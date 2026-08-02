import {
  STORAGE_KEYS
} from '../constants/storage-keys.js';

import {
  ROOM_STATUS
} from '../constants/statuses.js';

import {
  storageService
} from './storage-service.js';

import {
  assertRoomCanBeDeleted,
  assertRoomCodeUnique,
  assertRoomStatusChange,
  getActiveRoomContracts,
  hasActiveRoomContract,
  validateRoomData
} from '../business/room-validator.js';

import {
  toSafeNumber
} from '../utils/number-utils.js';

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
 * Chuẩn hóa văn bản để tìm kiếm không phân biệt:
 * - Chữ hoa và chữ thường.
 * - Dấu tiếng Việt.
 * - Khoảng trắng thừa.
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
 * Chuẩn hóa danh sách trạng thái dùng cho bộ lọc.
 *
 * @param {string|string[]|undefined} status Trạng thái cần lọc.
 * @returns {string[]|null}
 */
function normalizeStatusFilter(status) {
  if (status === undefined) {
    return null;
  }

  const statuses = Array.isArray(status)
    ? status
    : [status];

  const validStatuses = Object.values(
    ROOM_STATUS
  );

  statuses.forEach((value) => {
    if (!validStatuses.includes(value)) {
      throw new Error(
        `Trạng thái phòng "${value}" không hợp lệ.`
      );
    }
  });

  return [...new Set(statuses)];
}

/**
 * Service quản lý collection rooms.
 *
 * RoomService không thao tác DOM và không truy cập trực tiếp
 * LocalStorage. Mọi thao tác lưu trữ đi qua StorageService.
 */
export class RoomService {
  /**
   * @param {import('./storage-service.js').StorageService} service
   * StorageService được sử dụng.
   */
  constructor(service = storageService) {
    const requiredMethods = [
      'getAll',
      'getById',
      'create',
      'update',
      'remove'
    ];

    const isValidService =
      service &&
      requiredMethods.every(
        (methodName) =>
          typeof service[methodName] ===
          'function'
      );

    if (!isValidService) {
      throw new TypeError(
        'RoomService cần một StorageService hợp lệ.'
      );
    }

    this.storageService = service;
  }

  /**
   * Lấy toàn bộ danh sách phòng.
   *
   * @returns {object[]}
   */
  getRooms() {
    return this.storageService.getAll(
      STORAGE_KEYS.ROOMS
    );
  }

  /**
   * Lấy một phòng theo ID.
   *
   * @param {string} id ID phòng.
   * @returns {object|null}
   */
  getRoomById(id) {
    return this.storageService.getById(
      STORAGE_KEYS.ROOMS,
      id
    );
  }

  /**
   * Tạo phòng mới.
   *
   * @param {object} data Dữ liệu phòng.
   * @returns {object} Phòng đã được tạo.
   * @throws {Error} Khi dữ liệu không hợp lệ hoặc mã phòng bị trùng.
   */
  createRoom(data) {
    const normalizedData =
      validateRoomData(data);

    const rooms = this.getRooms();

    assertRoomCodeUnique(
      normalizedData.code,
      rooms
    );

    return this.storageService.create(
      STORAGE_KEYS.ROOMS,
      normalizedData
    );
  }

  /**
   * Cập nhật một phòng.
   *
   * @param {string} id ID phòng.
   * @param {object} data Dữ liệu cần cập nhật.
   * @returns {object} Phòng sau cập nhật.
   * @throws {Error} Khi không tìm thấy phòng hoặc dữ liệu không hợp lệ.
   */
  updateRoom(id, data) {
    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu cập nhật phòng phải là một object.'
      );
    }

    const currentRoom =
      this.getRoomById(id);

    if (!currentRoom) {
      throw new Error(
        `Không tìm thấy phòng có ID "${id}".`
      );
    }

    const mergedRoom = {
      ...currentRoom,
      ...data,
      id: currentRoom.id
    };

    const normalizedData =
      validateRoomData(mergedRoom);

    const rooms = this.getRooms();

    assertRoomCodeUnique(
      normalizedData.code,
      rooms,
      currentRoom.id
    );

    const contracts =
      this.storageService.getAll(
        STORAGE_KEYS.CONTRACTS
      );

    assertRoomStatusChange(
      currentRoom,
      normalizedData.status,
      contracts
    );

    const {
      id: ignoredId,
      ...changes
    } = normalizedData;

    return this.storageService.update(
      STORAGE_KEYS.ROOMS,
      currentRoom.id,
      changes
    );
  }

  /**
   * Xóa một phòng.
   *
   * Phòng có hợp đồng đang hiệu lực không được phép xóa.
   *
   * @param {string} id ID phòng.
   * @returns {object} Phòng đã xóa.
   * @throws {Error} Khi không tìm thấy phòng hoặc phòng đang có hợp đồng.
   */
  deleteRoom(id) {
    const room = this.getRoomById(id);

    if (!room) {
      throw new Error(
        `Không tìm thấy phòng có ID "${id}".`
      );
    }

    const contracts =
      this.storageService.getAll(
        STORAGE_KEYS.CONTRACTS
      );

    assertRoomCanBeDeleted(
      room.id,
      contracts
    );

    const removedRoom =
      this.storageService.remove(
        STORAGE_KEYS.ROOMS,
        room.id
      );

    if (!removedRoom) {
      throw new Error(
        `Không thể xóa phòng có ID "${id}".`
      );
    }

    return removedRoom;
  }

  /**
   * Tìm kiếm phòng theo mã, tên, khu vực, loại phòng hoặc mô tả.
   *
   * Tìm kiếm không phân biệt chữ hoa, chữ thường và dấu tiếng Việt.
   * Từ khóa rỗng trả về toàn bộ danh sách phòng.
   *
   * @param {string} keyword Từ khóa tìm kiếm.
   * @returns {object[]}
   */
  searchRooms(keyword) {
    if (typeof keyword !== 'string') {
      throw new TypeError(
        'Từ khóa tìm kiếm phải là một chuỗi.'
      );
    }

    const normalizedKeyword =
      normalizeSearchText(keyword);

    const rooms = this.getRooms();

    if (!normalizedKeyword) {
      return rooms;
    }

    return rooms.filter((room) => {
      const searchableText =
        normalizeSearchText([
          room.code,
          room.name,
          room.area,
          room.roomType,
          room.description
        ].join(' '));

      return searchableText.includes(
        normalizedKeyword
      );
    });
  }

  /**
   * Lọc danh sách phòng.
   *
   * Các thuộc tính filters được hỗ trợ:
   * - status: string hoặc string[].
   * - area: khu vực.
   * - roomType: loại phòng.
   * - minRent: giá thuê tối thiểu.
   * - maxRent: giá thuê tối đa.
   * - minCapacity: sức chứa tối thiểu.
   * - maxCapacity: sức chứa tối đa.
   * - availableOnly: chỉ lấy phòng có thể cho thuê.
   *
   * @param {object} [filters={}] Bộ lọc.
   * @returns {object[]}
   */
  filterRooms(filters = {}) {
    if (!isPlainObject(filters)) {
      throw new TypeError(
        'Bộ lọc phòng phải là một object.'
      );
    }

    const statuses =
      normalizeStatusFilter(
        filters.status
      );

    const normalizedArea =
      filters.area === undefined
        ? null
        : normalizeSearchText(filters.area);

    const normalizedRoomType =
      filters.roomType === undefined
        ? null
        : normalizeSearchText(
            filters.roomType
          );

    const minRent =
      filters.minRent === undefined ||
      filters.minRent === ''
        ? null
        : toSafeNumber(filters.minRent);

    const maxRent =
      filters.maxRent === undefined ||
      filters.maxRent === ''
        ? null
        : toSafeNumber(filters.maxRent);

    const minCapacity =
      filters.minCapacity === undefined ||
      filters.minCapacity === ''
        ? null
        : toSafeNumber(
            filters.minCapacity
          );

    const maxCapacity =
      filters.maxCapacity === undefined ||
      filters.maxCapacity === ''
        ? null
        : toSafeNumber(
            filters.maxCapacity
          );

    if (
      minRent !== null &&
      minRent < 0
    ) {
      throw new Error(
        'Giá thuê tối thiểu không được âm.'
      );
    }

    if (
      maxRent !== null &&
      maxRent < 0
    ) {
      throw new Error(
        'Giá thuê tối đa không được âm.'
      );
    }

    if (
      minRent !== null &&
      maxRent !== null &&
      minRent > maxRent
    ) {
      throw new Error(
        'Giá thuê tối thiểu không được lớn hơn giá thuê tối đa.'
      );
    }

    if (
      minCapacity !== null &&
      (
        !Number.isInteger(minCapacity) ||
        minCapacity <= 0
      )
    ) {
      throw new Error(
        'Sức chứa tối thiểu phải là số nguyên lớn hơn 0.'
      );
    }

    if (
      maxCapacity !== null &&
      (
        !Number.isInteger(maxCapacity) ||
        maxCapacity <= 0
      )
    ) {
      throw new Error(
        'Sức chứa tối đa phải là số nguyên lớn hơn 0.'
      );
    }

    if (
      minCapacity !== null &&
      maxCapacity !== null &&
      minCapacity > maxCapacity
    ) {
      throw new Error(
        'Sức chứa tối thiểu không được lớn hơn sức chứa tối đa.'
      );
    }

    if (
      filters.availableOnly !== undefined &&
      typeof filters.availableOnly !==
        'boolean'
    ) {
      throw new TypeError(
        'availableOnly phải là boolean.'
      );
    }

    let rooms = this.getRooms();

    if (filters.availableOnly === true) {
      const availableRoomIds = new Set(
        this.getAvailableRooms().map(
          (room) => room.id
        )
      );

      rooms = rooms.filter((room) =>
        availableRoomIds.has(room.id)
      );
    }

    return rooms.filter((room) => {
      if (
        statuses &&
        !statuses.includes(room.status)
      ) {
        return false;
      }

      if (
        normalizedArea &&
        normalizeSearchText(room.area) !==
          normalizedArea
      ) {
        return false;
      }

      if (
        normalizedRoomType &&
        normalizeSearchText(
          room.roomType
        ) !== normalizedRoomType
      ) {
        return false;
      }

      if (
        minRent !== null &&
        room.monthlyRent < minRent
      ) {
        return false;
      }

      if (
        maxRent !== null &&
        room.monthlyRent > maxRent
      ) {
        return false;
      }

      if (
        minCapacity !== null &&
        room.maxOccupants < minCapacity
      ) {
        return false;
      }

      if (
        maxCapacity !== null &&
        room.maxOccupants > maxCapacity
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Lấy các phòng hiện có thể cho thuê.
   *
   * Phòng khả dụng phải:
   * - Có trạng thái trống.
   * - Không có hợp đồng đang hiệu lực.
   * - Không ở trạng thái sửa chữa hoặc ngừng sử dụng.
   *
   * @returns {object[]}
   */
  getAvailableRooms() {
    const rooms = this.getRooms();

    const contracts =
      this.storageService.getAll(
        STORAGE_KEYS.CONTRACTS
      );

    return rooms.filter(
      (room) =>
        room.status === ROOM_STATUS.VACANT &&
        !hasActiveRoomContract(
          room.id,
          contracts
        )
    );
  }

  /**
   * Lấy tình trạng sử dụng và sức chứa của một phòng.
   *
   * @param {string} roomId ID phòng.
   * @returns {{
   *   roomId: string,
   *   status: string,
   *   maxOccupants: number,
   *   currentOccupants: number,
   *   availableSpots: number,
   *   occupancyRate: number,
   *   isOccupied: boolean,
   *   isOverCapacity: boolean,
   *   activeContractIds: string[],
   *   tenantIds: string[]
   * }}
   * @throws {Error} Khi không tìm thấy phòng.
   */
  getRoomOccupancy(roomId) {
    const room = this.getRoomById(roomId);

    if (!room) {
      throw new Error(
        `Không tìm thấy phòng có ID "${roomId}".`
      );
    }

    const contracts =
      this.storageService.getAll(
        STORAGE_KEYS.CONTRACTS
      );

    const activeContracts =
      getActiveRoomContracts(
        room.id,
        contracts
      );

    const tenantIds = [
      ...new Set(
        activeContracts.flatMap(
          (contract) =>
            Array.isArray(
              contract.tenantIds
            )
              ? contract.tenantIds
              : []
        )
      )
    ];

    const currentOccupants =
      tenantIds.length;

    const availableSpots = Math.max(
      0,
      room.maxOccupants -
        currentOccupants
    );

    const occupancyRate =
      room.maxOccupants > 0
        ? Number(
            (
              (
                currentOccupants /
                room.maxOccupants
              ) *
              100
            ).toFixed(2)
          )
        : 0;

    return {
      roomId: room.id,
      status: room.status,
      maxOccupants:
        room.maxOccupants,
      currentOccupants,
      availableSpots,
      occupancyRate,
      isOccupied:
        currentOccupants > 0,
      isOverCapacity:
        currentOccupants >
        room.maxOccupants,
      activeContractIds:
        activeContracts.map(
          (contract) => contract.id
        ),
      tenantIds
    };
  }
}

/**
 * Instance RoomService dùng chung trong ứng dụng.
 */
export const roomService =
  new RoomService();

export default roomService;