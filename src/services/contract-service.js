import {
  STORAGE_KEYS
} from '../constants/storage-keys.js';

import {
  CONTRACT_STATUS,
  ROOM_STATUS
} from '../constants/statuses.js';

import {
  storageService
} from './storage-service.js';

import {
  RoomService,
  roomService
} from './room-service.js';

import {
  hasOverlappingContract,
  validateContract,
  validateOccupancyLimit
} from '../business/contract-validator.js';

import {
  determineContractStatus,
  isContractActive,
  isContractExpiringSoon
} from '../business/contract-utils.js';

import {
  compareIsoDates,
  isValidIsoDate
} from '../utils/date-utils.js';

const CONTRACT_STATUS_VALUES = Object.freeze(
  Object.values(CONTRACT_STATUS)
);

/**
 * Kiểm tra giá trị có phải object thông thường hay không.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @returns {boolean}
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

/**
 * Chuẩn hóa một ID.
 *
 * @param {*} id Giá trị ID.
 * @param {string} fieldName Tên trường dùng trong thông báo lỗi.
 * @returns {string}
 */
function normalizeId(id, fieldName = 'ID') {
  if (typeof id !== 'string') {
    throw new TypeError(
      `${fieldName} phải là một chuỗi.`
    );
  }

  const normalizedId = id.trim();

  if (!normalizedId) {
    throw new TypeError(
      `${fieldName} không được để trống.`
    );
  }

  return normalizedId;
}

/**
 * Chuẩn hóa chuỗi dùng để tìm kiếm.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @returns {string}
 */
function normalizeSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

/**
 * Lấy ngày hiện tại tại múi giờ Việt Nam theo YYYY-MM-DD.
 *
 * @returns {string}
 */
function getCurrentDateInVietnam() {
  const parts = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Chuẩn hóa và kiểm tra ngày YYYY-MM-DD.
 *
 * @param {*} value Giá trị ngày.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeDate(value, fieldName) {
  if (typeof value !== 'string') {
    throw new TypeError(
      `${fieldName} phải là chuỗi ngày YYYY-MM-DD.`
    );
  }

  const normalizedValue = value.trim();

  if (!isValidIsoDate(normalizedValue)) {
    throw new Error(
      `${fieldName} không phải ngày hợp lệ theo định dạng YYYY-MM-DD.`
    );
  }

  return normalizedValue;
}

/**
 * Loại bỏ các thuộc tính chỉ dùng trong quá trình validation.
 *
 * @param {object} contract Hợp đồng đã chuẩn hóa.
 * @returns {object}
 */
function removeValidationFields(contract) {
  const {
    room,
    roomStatus,
    createdAt,
    updatedAt,
    ...storageContract
  } = contract;

  return storageContract;
}

/**
 * Service quản lý hợp đồng RoomMate.
 *
 * Mọi thao tác lưu trữ đều thông qua StorageService.
 * Việc thay đổi đồng thời hợp đồng và phòng được thực hiện
 * trong giao dịch có rollback.
 */
export class ContractService {
  /**
   * @param {import('./storage-service.js').StorageService} service
   * StorageService được sử dụng.
   * @param {RoomService} rooms
   * RoomService được sử dụng.
   */
  constructor(
    service = storageService,
    rooms =
      service === storageService
        ? roomService
        : new RoomService(service)
  ) {
    const requiredStorageMethods = [
      'getAll',
      'getById',
      'create',
      'update',
      'exportAll',
      'importAll'
    ];

    const validStorageService =
      service &&
      requiredStorageMethods.every(
        (methodName) =>
          typeof service[methodName] ===
          'function'
      );

    if (!validStorageService) {
      throw new TypeError(
        'ContractService cần một StorageService hợp lệ.'
      );
    }

    const requiredRoomMethods = [
      'getRoomById',
      'updateRoom'
    ];

    const validRoomService =
      rooms &&
      requiredRoomMethods.every(
        (methodName) =>
          typeof rooms[methodName] ===
          'function'
      );

    if (!validRoomService) {
      throw new TypeError(
        'ContractService cần một RoomService hợp lệ.'
      );
    }

    this.storageService = service;
    this.roomService = rooms;
  }

  /**
   * Thực hiện một nhóm thay đổi theo cơ chế all-or-nothing.
   *
   * Nếu một bước thất bại, toàn bộ dữ liệu RoomMate được
   * khôi phục về trạng thái trước thao tác.
   *
   * @template T
   * @param {() => T} operation Thao tác cần thực hiện.
   * @returns {T}
   */
  _runAtomic(operation) {
    if (typeof operation !== 'function') {
      throw new TypeError(
        'Thao tác giao dịch phải là một function.'
      );
    }

    const snapshot =
      this.storageService.exportAll();

    try {
      return operation();
    } catch (operationError) {
      try {
        this.storageService.importAll(snapshot);
      } catch (rollbackError) {
        throw new AggregateError(
          [
            operationError,
            rollbackError
          ],
          'Thao tác hợp đồng thất bại và không thể khôi phục toàn bộ dữ liệu.'
        );
      }

      throw operationError;
    }
  }

  /**
   * Kiểm tra mã hợp đồng không bị trùng.
   *
   * @param {*} code Mã hợp đồng.
   * @param {object[]} contracts Danh sách hợp đồng.
   * @param {string|null} excludedId ID được bỏ qua.
   * @returns {true}
   */
  _assertContractCodeUnique(
    code,
    contracts,
    excludedId = null
  ) {
    if (
      code === undefined ||
      code === null ||
      code === ''
    ) {
      return true;
    }

    if (typeof code !== 'string') {
      throw new TypeError(
        'Mã hợp đồng phải là một chuỗi.'
      );
    }

    const normalizedCode = code
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      throw new Error(
        'Mã hợp đồng không được để trống.'
      );
    }

    const duplicatedContract = contracts.find(
      (contract) =>
        contract?.id !== excludedId &&
        typeof contract?.code === 'string' &&
        contract.code
          .trim()
          .toUpperCase() === normalizedCode
    );

    if (duplicatedContract) {
      throw new Error(
        `Mã hợp đồng "${normalizedCode}" đã tồn tại.`
      );
    }

    return true;
  }

  /**
   * Kiểm tra các người thuê trong hợp đồng đều tồn tại.
   *
   * @param {string[]} tenantIds Danh sách ID người thuê.
   * @returns {true}
   */
  _assertTenantsExist(tenantIds) {
    const tenants =
      this.storageService.getAll(
        STORAGE_KEYS.TENANTS
      );

    const tenantIdSet = new Set(
      tenants.map((tenant) => tenant.id)
    );

    const missingIds = tenantIds.filter(
      (tenantId) =>
        !tenantIdSet.has(tenantId)
    );

    if (missingIds.length > 0) {
      throw new Error(
        `Không tìm thấy người thuê: ${missingIds.join(', ')}.`
      );
    }

    return true;
  }

  /**
   * Kiểm tra hợp đồng không trùng thời gian.
   *
   * @param {object} contract Hợp đồng cần kiểm tra.
   * @param {object[]} existingContracts Danh sách hiện tại.
   * @returns {true}
   */
  _assertNoOverlap(
    contract,
    existingContracts
  ) {
    if (
      hasOverlappingContract(
        contract,
        existingContracts
      )
    ) {
      throw new Error(
        '[CONTRACT-06] Phòng đã có hợp đồng trùng thời gian.'
      );
    }

    return true;
  }

  /**
   * Chuẩn bị và kiểm tra dữ liệu hợp đồng.
   *
   * Giá thuê chỉ lấy từ phòng khi hợp đồng chưa cung cấp
   * rentAmount. Sau khi tạo, giá thuê của hợp đồng được lưu
   * độc lập với giá thuê hiện tại của phòng.
   *
   * @param {object} data Dữ liệu hợp đồng.
   * @param {object|null} existingContract Hợp đồng hiện tại.
   * @returns {{contract: object, room: object}}
   */
  _prepareContract(
    data,
    existingContract = null
  ) {
    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu hợp đồng phải là một object.'
      );
    }

    const mergedData = existingContract
      ? {
          ...existingContract,
          ...data,
          tenantIds:
            data.tenantIds === undefined
              ? [...existingContract.tenantIds]
              : [...data.tenantIds],
          id: existingContract.id
        }
      : {
          ...data
        };

    const roomId = normalizeId(
      mergedData.roomId,
      'ID phòng'
    );

    const room =
      this.roomService.getRoomById(roomId);

    if (!room) {
      throw new Error(
        `Không tìm thấy phòng có ID "${roomId}".`
      );
    }

    const dataForValidation = {
      ...mergedData,
      roomId,
      roomStatus: room.status,
      rentAmount:
        mergedData.rentAmount ??
        room.monthlyRent,
      depositAmount:
        mergedData.depositAmount ?? 0,
      status:
        mergedData.status ??
        CONTRACT_STATUS.DRAFT
    };

    const normalizedContract =
      validateContract(dataForValidation);

    validateOccupancyLimit(
      room,
      normalizedContract.tenantIds
    );

    this._assertTenantsExist(
      normalizedContract.tenantIds
    );

    const contracts = this.getContracts();

    this._assertContractCodeUnique(
      normalizedContract.code,
      contracts,
      existingContract?.id ?? null
    );

    this._assertNoOverlap(
      normalizedContract,
      contracts
    );

    return {
      contract:
        removeValidationFields(
          normalizedContract
        ),
      room
    };
  }

  /**
   * Kiểm tra trạng thái hợp đồng có thể chỉnh sửa hay không.
   *
   * @param {object} contract Hợp đồng.
   * @returns {true}
   */
  _assertContractEditable(contract) {
    if (
      contract.status ===
      CONTRACT_STATUS.ENDED
    ) {
      throw new Error(
        'Không được sửa tùy ý hợp đồng đã kết thúc.'
      );
    }

    if (
      contract.status ===
      CONTRACT_STATUS.CANCELLED
    ) {
      throw new Error(
        'Không được sửa hợp đồng đã hủy.'
      );
    }

    return true;
  }

  /**
   * Kiểm tra phòng còn hợp đồng hiệu lực khác hay không.
   *
   * @param {string} roomId ID phòng.
   * @param {string} excludedContractId Hợp đồng bỏ qua.
   * @param {string} currentDate Ngày kiểm tra.
   * @returns {boolean}
   */
  _hasOtherActiveContract(
    roomId,
    excludedContractId,
    currentDate
  ) {
    return this.getContracts().some(
      (contract) =>
        contract.id !== excludedContractId &&
        contract.roomId === roomId &&
        isContractActive(
          contract,
          currentDate
        )
    );
  }

  /**
   * Lấy toàn bộ hợp đồng.
   *
   * @returns {object[]}
   */
  getContracts() {
    return this.storageService.getAll(
      STORAGE_KEYS.CONTRACTS
    );
  }

  /**
   * Lấy hợp đồng theo ID.
   *
   * @param {string} id ID hợp đồng.
   * @returns {object|null}
   */
  getContractById(id) {
    return this.storageService.getById(
      STORAGE_KEYS.CONTRACTS,
      id
    );
  }

  /**
   * Tạo hợp đồng mới.
   *
   * Hợp đồng mới chỉ được tạo với trạng thái nháp hoặc
   * đang hiệu lực. Nếu tạo trực tiếp ở trạng thái hiệu lực,
   * trạng thái phòng cũng được cập nhật trong cùng giao dịch.
   *
   * @param {object} data Dữ liệu hợp đồng.
   * @returns {object}
   */
  createContract(data) {
    const {
      contract,
      room
    } = this._prepareContract(data);

    if (
      ![
        CONTRACT_STATUS.DRAFT,
        CONTRACT_STATUS.ACTIVE
      ].includes(contract.status)
    ) {
      throw new Error(
        'Hợp đồng mới chỉ có thể ở trạng thái nháp hoặc đang hiệu lực.'
      );
    }

    if (
      contract.status ===
      CONTRACT_STATUS.DRAFT
    ) {
      return this.storageService.create(
        STORAGE_KEYS.CONTRACTS,
        contract
      );
    }

    const currentDate =
      getCurrentDateInVietnam();

    if (
      determineContractStatus(
        contract,
        currentDate
      ) !== CONTRACT_STATUS.ACTIVE
    ) {
      throw new Error(
        'Khoảng thời gian hợp đồng chưa có hiệu lực tại ngày hiện tại.'
      );
    }

    if (
      room.status !== ROOM_STATUS.VACANT
    ) {
      throw new Error(
        'Chỉ phòng trống mới có thể kích hoạt hợp đồng.'
      );
    }

    return this._runAtomic(() => {
      this.roomService.updateRoom(
        room.id,
        {
          status: ROOM_STATUS.OCCUPIED
        }
      );

      return this.storageService.create(
        STORAGE_KEYS.CONTRACTS,
        contract
      );
    });
  }

  /**
   * Cập nhật hợp đồng.
   *
   * Không cho phép đổi trạng thái bằng hàm này.
   * Hợp đồng đang hiệu lực không được đổi sang phòng khác.
   *
   * @param {string} id ID hợp đồng.
   * @param {object} data Các trường cần cập nhật.
   * @returns {object}
   */
  updateContract(id, data) {
    const normalizedId = normalizeId(
      id,
      'ID hợp đồng'
    );

    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu cập nhật hợp đồng phải là một object.'
      );
    }

    const currentContract =
      this.getContractById(normalizedId);

    if (!currentContract) {
      throw new Error(
        `Không tìm thấy hợp đồng có ID "${normalizedId}".`
      );
    }

    this._assertContractEditable(
      currentContract
    );

    if (
      data.status !== undefined &&
      data.status !== currentContract.status
    ) {
      throw new Error(
        'Không được đổi trạng thái hợp đồng bằng updateContract().'
      );
    }

    if (
      currentContract.status ===
        CONTRACT_STATUS.ACTIVE &&
      data.roomId !== undefined &&
      data.roomId !== currentContract.roomId
    ) {
      throw new Error(
        'Không được đổi phòng của hợp đồng đang hiệu lực.'
      );
    }

    const {
      contract
    } = this._prepareContract(
      {
        ...data,
        status: currentContract.status
      },
      currentContract
    );

    if (
      currentContract.status ===
      CONTRACT_STATUS.ACTIVE
    ) {
      const currentDate =
        getCurrentDateInVietnam();

      if (
        determineContractStatus(
          contract,
          currentDate
        ) !== CONTRACT_STATUS.ACTIVE
      ) {
        throw new Error(
          'Ngày bắt đầu và ngày kết thúc mới phải tiếp tục bao gồm ngày hiện tại đối với hợp đồng đang hiệu lực.'
        );
      }
    }

    const {
      id: ignoredId,
      ...changes
    } = contract;

    return this.storageService.update(
      STORAGE_KEYS.CONTRACTS,
      currentContract.id,
      changes
    );
  }

  /**
   * Kích hoạt một hợp đồng nháp.
   *
   * Khi thành công, phòng được chuyển sang trạng thái đang thuê.
   *
   * @param {string} id ID hợp đồng.
   * @returns {object}
   */
  activateContract(id) {
    const normalizedId = normalizeId(
      id,
      'ID hợp đồng'
    );

    const currentContract =
      this.getContractById(normalizedId);

    if (!currentContract) {
      throw new Error(
        `Không tìm thấy hợp đồng có ID "${normalizedId}".`
      );
    }

    if (
      currentContract.status ===
      CONTRACT_STATUS.ACTIVE
    ) {
      return currentContract;
    }

    if (
      currentContract.status !==
      CONTRACT_STATUS.DRAFT
    ) {
      throw new Error(
        'Chỉ hợp đồng nháp mới có thể được kích hoạt.'
      );
    }

    const {
      contract,
      room
    } = this._prepareContract(
      {
        status: CONTRACT_STATUS.ACTIVE
      },
      currentContract
    );

    const currentDate =
      getCurrentDateInVietnam();

    if (
      determineContractStatus(
        contract,
        currentDate
      ) !== CONTRACT_STATUS.ACTIVE
    ) {
      throw new Error(
        'Chỉ có thể kích hoạt hợp đồng khi ngày hiện tại nằm trong thời hạn hợp đồng.'
      );
    }

    if (
      room.status !== ROOM_STATUS.VACANT
    ) {
      throw new Error(
        'Chỉ phòng trống mới có thể kích hoạt hợp đồng.'
      );
    }

    return this._runAtomic(() => {
      this.roomService.updateRoom(
        room.id,
        {
          status: ROOM_STATUS.OCCUPIED
        }
      );

      return this.storageService.update(
        STORAGE_KEYS.CONTRACTS,
        contract.id,
        {
          status: CONTRACT_STATUS.ACTIVE
        }
      );
    });
  }

  /**
   * Gia hạn hợp đồng.
   *
   * Ngày kết thúc mới phải sau ngày kết thúc hiện tại
   * và không được gây trùng thời gian với hợp đồng khác.
   *
   * @param {string} id ID hợp đồng.
   * @param {string} newEndDate Ngày kết thúc mới.
   * @returns {object}
   */
  extendContract(id, newEndDate) {
    const normalizedId = normalizeId(
      id,
      'ID hợp đồng'
    );

    const normalizedEndDate = normalizeDate(
      newEndDate,
      'Ngày kết thúc mới'
    );

    const currentContract =
      this.getContractById(normalizedId);

    if (!currentContract) {
      throw new Error(
        `Không tìm thấy hợp đồng có ID "${normalizedId}".`
      );
    }

    this._assertContractEditable(
      currentContract
    );

    if (
      compareIsoDates(
        normalizedEndDate,
        currentContract.endDate
      ) <= 0
    ) {
      throw new Error(
        'Ngày kết thúc mới phải sau ngày kết thúc hiện tại.'
      );
    }

    const {
      contract
    } = this._prepareContract(
      {
        endDate: normalizedEndDate,
        status: currentContract.status
      },
      currentContract
    );

    return this.storageService.update(
      STORAGE_KEYS.CONTRACTS,
      currentContract.id,
      {
        endDate: contract.endDate
      }
    );
  }

  /**
   * Kết thúc hợp đồng đang hiệu lực.
   *
   * Sau khi kết thúc, phòng được chuyển thành trống nếu không
   * còn hợp đồng nào khác đang hiệu lực.
   *
   * @param {string} id ID hợp đồng.
   * @param {string} actualEndDate Ngày kết thúc thực tế.
   * @returns {object}
   */
  endContract(id, actualEndDate) {
    const normalizedId = normalizeId(
      id,
      'ID hợp đồng'
    );

    const normalizedEndDate = normalizeDate(
      actualEndDate,
      'Ngày kết thúc thực tế'
    );

    const currentContract =
      this.getContractById(normalizedId);

    if (!currentContract) {
      throw new Error(
        `Không tìm thấy hợp đồng có ID "${normalizedId}".`
      );
    }

    if (
      currentContract.status !==
      CONTRACT_STATUS.ACTIVE
    ) {
      throw new Error(
        'Chỉ hợp đồng đang hiệu lực mới có thể kết thúc.'
      );
    }

    if (
      compareIsoDates(
        normalizedEndDate,
        currentContract.startDate
      ) <= 0
    ) {
      throw new Error(
        'Ngày kết thúc thực tế phải sau ngày bắt đầu hợp đồng.'
      );
    }

    const room =
      this.roomService.getRoomById(
        currentContract.roomId
      );

    if (!room) {
      throw new Error(
        `Không tìm thấy phòng của hợp đồng "${currentContract.code ?? currentContract.id}".`
      );
    }

    return this._runAtomic(() => {
      const endedContract =
        this.storageService.update(
          STORAGE_KEYS.CONTRACTS,
          currentContract.id,
          {
            endDate: normalizedEndDate,
            status: CONTRACT_STATUS.ENDED
          }
        );

      const hasOtherActiveContract =
        this._hasOtherActiveContract(
          room.id,
          currentContract.id,
          normalizedEndDate
        );

      if (!hasOtherActiveContract) {
        this.roomService.updateRoom(
          room.id,
          {
            status: ROOM_STATUS.VACANT
          }
        );
      }

      return endedContract;
    });
  }

  /**
   * Hủy hợp đồng nháp hoặc đang hiệu lực.
   *
   * Nếu hợp đồng đang hiệu lực bị hủy, phòng được chuyển thành
   * trống khi không còn hợp đồng hiệu lực khác.
   *
   * @param {string} id ID hợp đồng.
   * @returns {object}
   */
  cancelContract(id) {
    const normalizedId = normalizeId(
      id,
      'ID hợp đồng'
    );

    const currentContract =
      this.getContractById(normalizedId);

    if (!currentContract) {
      throw new Error(
        `Không tìm thấy hợp đồng có ID "${normalizedId}".`
      );
    }

    if (
      currentContract.status ===
      CONTRACT_STATUS.CANCELLED
    ) {
      return currentContract;
    }

    if (
      currentContract.status ===
      CONTRACT_STATUS.ENDED
    ) {
      throw new Error(
        'Không thể hủy hợp đồng đã kết thúc.'
      );
    }

    const wasActive =
      currentContract.status ===
      CONTRACT_STATUS.ACTIVE;

    const room =
      this.roomService.getRoomById(
        currentContract.roomId
      );

    if (!room) {
      throw new Error(
        `Không tìm thấy phòng của hợp đồng "${currentContract.code ?? currentContract.id}".`
      );
    }

    return this._runAtomic(() => {
      const cancelledContract =
        this.storageService.update(
          STORAGE_KEYS.CONTRACTS,
          currentContract.id,
          {
            status:
              CONTRACT_STATUS.CANCELLED
          }
        );

      if (wasActive) {
        const currentDate =
          getCurrentDateInVietnam();

        const hasOtherActiveContract =
          this._hasOtherActiveContract(
            room.id,
            currentContract.id,
            currentDate
          );

        if (!hasOtherActiveContract) {
          this.roomService.updateRoom(
            room.id,
            {
              status: ROOM_STATUS.VACANT
            }
          );
        }
      }

      return cancelledContract;
    });
  }

  /**
   * Tìm kiếm hợp đồng.
   *
   * Tìm theo:
   * - Mã hợp đồng.
   * - Mã và tên phòng.
   * - Họ tên, số điện thoại hoặc CCCD của người thuê.
   *
   * @param {string} keyword Từ khóa.
   * @returns {object[]}
   */
  searchContracts(keyword) {
    if (typeof keyword !== 'string') {
      throw new TypeError(
        'Từ khóa tìm kiếm phải là một chuỗi.'
      );
    }

    const normalizedKeyword =
      normalizeSearchText(keyword);

    const contracts = this.getContracts();

    if (!normalizedKeyword) {
      return contracts;
    }

    const rooms =
      this.storageService.getAll(
        STORAGE_KEYS.ROOMS
      );

    const tenants =
      this.storageService.getAll(
        STORAGE_KEYS.TENANTS
      );

    const roomById = new Map(
      rooms.map((room) => [
        room.id,
        room
      ])
    );

    const tenantById = new Map(
      tenants.map((tenant) => [
        tenant.id,
        tenant
      ])
    );

    return contracts.filter((contract) => {
      const room =
        roomById.get(contract.roomId);

      const contractTenants = Array.isArray(
        contract.tenantIds
      )
        ? contract.tenantIds
            .map((tenantId) =>
              tenantById.get(tenantId)
            )
            .filter(Boolean)
        : [];

      const searchableText =
        normalizeSearchText([
          contract.code,
          room?.code,
          room?.name,
          ...contractTenants.flatMap(
            (tenant) => [
              tenant.fullName,
              tenant.phone,
              tenant.identityNumber
            ]
          )
        ].join(' '));

      return searchableText.includes(
        normalizedKeyword
      );
    });
  }

  /**
   * Lọc danh sách hợp đồng.
   *
   * Các bộ lọc được hỗ trợ:
   * - status: string hoặc string[].
   * - roomId: ID phòng.
   * - tenantId: ID người thuê.
   * - startFrom: ngày bắt đầu tối thiểu.
   * - startTo: ngày bắt đầu tối đa.
   * - endFrom: ngày kết thúc tối thiểu.
   * - endTo: ngày kết thúc tối đa.
   * - expiringWithinDays: chỉ lấy hợp đồng sắp hết hạn.
   *
   * @param {object} [filters={}] Bộ lọc.
   * @returns {object[]}
   */
  filterContracts(filters = {}) {
    if (!isPlainObject(filters)) {
      throw new TypeError(
        'Bộ lọc hợp đồng phải là một object.'
      );
    }

    let statuses = null;

    if (filters.status !== undefined) {
      statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];

      statuses.forEach((status) => {
        if (
          !CONTRACT_STATUS_VALUES.includes(
            status
          )
        ) {
          throw new Error(
            `Trạng thái hợp đồng "${status}" không hợp lệ.`
          );
        }
      });
    }

    const roomId =
      filters.roomId === undefined
        ? null
        : normalizeId(
            filters.roomId,
            'ID phòng'
          );

    const tenantId =
      filters.tenantId === undefined
        ? null
        : normalizeId(
            filters.tenantId,
            'ID người thuê'
          );

    const startFrom =
      filters.startFrom === undefined
        ? null
        : normalizeDate(
            filters.startFrom,
            'Ngày bắt đầu tối thiểu'
          );

    const startTo =
      filters.startTo === undefined
        ? null
        : normalizeDate(
            filters.startTo,
            'Ngày bắt đầu tối đa'
          );

    const endFrom =
      filters.endFrom === undefined
        ? null
        : normalizeDate(
            filters.endFrom,
            'Ngày kết thúc tối thiểu'
          );

    const endTo =
      filters.endTo === undefined
        ? null
        : normalizeDate(
            filters.endTo,
            'Ngày kết thúc tối đa'
          );

    if (
      startFrom &&
      startTo &&
      compareIsoDates(
        startFrom,
        startTo
      ) > 0
    ) {
      throw new Error(
        'Ngày bắt đầu tối thiểu không được sau ngày bắt đầu tối đa.'
      );
    }

    if (
      endFrom &&
      endTo &&
      compareIsoDates(
        endFrom,
        endTo
      ) > 0
    ) {
      throw new Error(
        'Ngày kết thúc tối thiểu không được sau ngày kết thúc tối đa.'
      );
    }

    let expiringWithinDays = null;

    if (
      filters.expiringWithinDays !==
      undefined
    ) {
      expiringWithinDays =
        Number(filters.expiringWithinDays);

      if (
        !Number.isInteger(
          expiringWithinDays
        ) ||
        expiringWithinDays < 0
      ) {
        throw new Error(
          'Số ngày sắp hết hạn phải là số nguyên không âm.'
        );
      }
    }

    const currentDate =
      getCurrentDateInVietnam();

    return this.getContracts().filter(
      (contract) => {
        if (
          statuses &&
          !statuses.includes(
            contract.status
          )
        ) {
          return false;
        }

        if (
          roomId &&
          contract.roomId !== roomId
        ) {
          return false;
        }

        if (
          tenantId &&
          (
            !Array.isArray(
              contract.tenantIds
            ) ||
            !contract.tenantIds.includes(
              tenantId
            )
          )
        ) {
          return false;
        }

        if (
          startFrom &&
          compareIsoDates(
            contract.startDate,
            startFrom
          ) < 0
        ) {
          return false;
        }

        if (
          startTo &&
          compareIsoDates(
            contract.startDate,
            startTo
          ) > 0
        ) {
          return false;
        }

        if (
          endFrom &&
          compareIsoDates(
            contract.endDate,
            endFrom
          ) < 0
        ) {
          return false;
        }

        if (
          endTo &&
          compareIsoDates(
            contract.endDate,
            endTo
          ) > 0
        ) {
          return false;
        }

        if (
          expiringWithinDays !== null &&
          !isContractExpiringSoon(
            contract,
            currentDate,
            expiringWithinDays
          )
        ) {
          return false;
        }

        return true;
      }
    );
  }

  /**
   * Lấy hợp đồng đang hiệu lực của một phòng.
   *
   * @param {string} roomId ID phòng.
   * @returns {object|null}
   */
  getActiveContractByRoom(roomId) {
    const normalizedRoomId = normalizeId(
      roomId,
      'ID phòng'
    );

    const currentDate =
      getCurrentDateInVietnam();

    const activeContracts =
      this.getContracts()
        .filter(
          (contract) =>
            contract.roomId ===
              normalizedRoomId &&
            isContractActive(
              contract,
              currentDate
            )
        )
        .sort(
          (firstContract, secondContract) =>
            String(
              secondContract.startDate
            ).localeCompare(
              String(
                firstContract.startDate
              )
            )
        );

    return activeContracts[0] ?? null;
  }

  /**
   * Lấy các hợp đồng đang hiệu lực và sắp hết hạn.
   *
   * @param {number} days Số ngày cảnh báo.
   * @returns {object[]}
   */
  getExpiringContracts(days) {
    const normalizedDays = Number(days);

    if (
      !Number.isInteger(normalizedDays) ||
      normalizedDays < 0
    ) {
      throw new TypeError(
        'Số ngày cảnh báo phải là số nguyên không âm.'
      );
    }

    const currentDate =
      getCurrentDateInVietnam();

    return this.getContracts()
      .filter((contract) =>
        isContractExpiringSoon(
          contract,
          currentDate,
          normalizedDays
        )
      )
      .sort(
        (firstContract, secondContract) =>
          String(
            firstContract.endDate
          ).localeCompare(
            String(
              secondContract.endDate
            )
          )
      );
  }
}

/**
 * Instance ContractService dùng chung.
 */
export const contractService =
  new ContractService();

export default contractService;