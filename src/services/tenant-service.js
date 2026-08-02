import {
  STORAGE_KEYS
} from '../constants/storage-keys.js';

import {
  CONTRACT_STATUS,
  TENANT_STATUS
} from '../constants/statuses.js';

import {
  storageService
} from './storage-service.js';

import {
  assertTenantCanBeDeleted,
  assertTenantIdentityUnique,
  getActiveTenantContracts,
  validateTenantData
} from '../business/tenant-validator.js';

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
 * Chuẩn hóa chuỗi dùng cho tìm kiếm.
 *
 * Hàm loại bỏ:
 * - Khác biệt chữ hoa và chữ thường.
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
 * So sánh hai hợp đồng theo ngày bắt đầu giảm dần.
 *
 * @param {object} firstContract Hợp đồng thứ nhất.
 * @param {object} secondContract Hợp đồng thứ hai.
 * @returns {number}
 */
function compareContractsByStartDateDescending(
  firstContract,
  secondContract
) {
  return String(
    secondContract.startDate ?? ''
  ).localeCompare(
    String(firstContract.startDate ?? '')
  );
}

/**
 * Service quản lý collection tenants.
 *
 * TenantService không thao tác DOM và không truy cập trực tiếp
 * LocalStorage. Tất cả thao tác lưu trữ đi qua StorageService.
 */
export class TenantService {
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
        'TenantService cần một StorageService hợp lệ.'
      );
    }

    this.storageService = service;
  }

  /**
   * Lấy danh sách người thuê đang hoạt động.
   *
   * Hồ sơ đã lưu trữ có status là inactive và không xuất hiện
   * trong danh sách mặc định.
   *
   * Các bản ghi cũ chưa có status được xem là đang hoạt động.
   *
   * @returns {object[]}
   */
  getTenants() {
    return this.storageService
      .getAll(STORAGE_KEYS.TENANTS)
      .filter(
        (tenant) =>
          tenant?.status !==
          TENANT_STATUS.INACTIVE
      );
  }

  /**
   * Lấy người thuê theo ID.
   *
   * Hàm vẫn trả hồ sơ đã được lưu trữ.
   *
   * @param {string} id ID người thuê.
   * @returns {object|null}
   */
  getTenantById(id) {
    return this.storageService.getById(
      STORAGE_KEYS.TENANTS,
      id
    );
  }

  /**
   * Tạo người thuê mới.
   *
   * @param {object} data Dữ liệu người thuê.
   * @returns {object} Người thuê đã tạo.
   * @throws {Error} Khi dữ liệu không hợp lệ hoặc CCCD bị trùng.
   */
  createTenant(data) {
    const normalizedData =
      validateTenantData({
        ...data,
        status:
          data?.status ??
          TENANT_STATUS.ACTIVE
      });

    const allTenants =
      this.storageService.getAll(
        STORAGE_KEYS.TENANTS
      );

    assertTenantIdentityUnique(
      normalizedData.identityNumber,
      allTenants
    );

    return this.storageService.create(
      STORAGE_KEYS.TENANTS,
      normalizedData
    );
  }

  /**
   * Cập nhật người thuê.
   *
   * @param {string} id ID người thuê.
   * @param {object} data Dữ liệu cần cập nhật.
   * @returns {object} Người thuê sau cập nhật.
   * @throws {Error} Khi không tìm thấy người thuê hoặc dữ liệu không hợp lệ.
   */
  updateTenant(id, data) {
    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu cập nhật người thuê phải là một object.'
      );
    }

    const currentTenant =
      this.getTenantById(id);

    if (!currentTenant) {
      throw new Error(
        `Không tìm thấy người thuê có ID "${id}".`
      );
    }

    const mergedTenant = {
      ...currentTenant,
      ...data,
      emergencyContact: {
        ...currentTenant.emergencyContact,
        ...data.emergencyContact
      },
      id: currentTenant.id
    };

    const normalizedData =
      validateTenantData(mergedTenant);

    const allTenants =
      this.storageService.getAll(
        STORAGE_KEYS.TENANTS
      );

    assertTenantIdentityUnique(
      normalizedData.identityNumber,
      allTenants,
      currentTenant.id
    );

    const {
      id: ignoredId,
      ...changes
    } = normalizedData;

    return this.storageService.update(
      STORAGE_KEYS.TENANTS,
      currentTenant.id,
      changes
    );
  }

  /**
   * Lưu trữ hồ sơ người thuê.
   *
   * Hồ sơ lưu trữ được chuyển sang trạng thái inactive.
   * Người thuê vẫn được giữ lại để phục vụ lịch sử hợp đồng.
   *
   * Thao tác này được phép kể cả khi người thuê đang có hợp đồng
   * hiệu lực, nhưng hồ sơ sẽ không xuất hiện trong getTenants().
   *
   * @param {string} id ID người thuê.
   * @returns {object} Người thuê sau khi được lưu trữ.
   * @throws {Error} Khi không tìm thấy người thuê.
   */
  archiveTenant(id) {
    const tenant =
      this.getTenantById(id);

    if (!tenant) {
      throw new Error(
        `Không tìm thấy người thuê có ID "${id}".`
      );
    }

    if (
      tenant.status === TENANT_STATUS.INACTIVE
    ) {
      return tenant;
    }

    return this.storageService.update(
      STORAGE_KEYS.TENANTS,
      tenant.id,
      {
        status: TENANT_STATUS.INACTIVE
      }
    );
  }

  /**
   * Xóa người thuê.
   *
   * Không cho phép xóa người thuê đang có hợp đồng hiệu lực.
   * Trong trường hợp đó, có thể gọi archiveTenant().
   *
   * @param {string} id ID người thuê.
   * @returns {object} Người thuê đã xóa.
   * @throws {Error} Khi không tìm thấy người thuê hoặc có hợp đồng hiệu lực.
   */
  deleteTenant(id) {
    const tenant =
      this.getTenantById(id);

    if (!tenant) {
      throw new Error(
        `Không tìm thấy người thuê có ID "${id}".`
      );
    }

    const contracts =
      this.storageService.getAll(
        STORAGE_KEYS.CONTRACTS
      );

    assertTenantCanBeDeleted(
      tenant.id,
      contracts
    );

    const removedTenant =
      this.storageService.remove(
        STORAGE_KEYS.TENANTS,
        tenant.id
      );

    if (!removedTenant) {
      throw new Error(
        `Không thể xóa người thuê có ID "${id}".`
      );
    }

    return removedTenant;
  }

  /**
   * Tìm kiếm người thuê đang hoạt động.
   *
   * Tìm theo:
   * - Họ tên.
   * - Số điện thoại.
   * - CCCD.
   * - Email.
   *
   * Từ khóa rỗng trả về toàn bộ danh sách đang hoạt động.
   *
   * @param {string} keyword Từ khóa tìm kiếm.
   * @returns {object[]}
   */
  searchTenants(keyword) {
    if (typeof keyword !== 'string') {
      throw new TypeError(
        'Từ khóa tìm kiếm phải là một chuỗi.'
      );
    }

    const normalizedKeyword =
      normalizeSearchText(keyword);

    const tenants = this.getTenants();

    if (!normalizedKeyword) {
      return tenants;
    }

    return tenants.filter((tenant) => {
      const searchableText =
        normalizeSearchText([
          tenant.fullName,
          tenant.phone,
          tenant.identityNumber,
          tenant.email
        ].join(' '));

      return searchableText.includes(
        normalizedKeyword
      );
    });
  }

  /**
   * Lấy lịch sử thuê phòng của người thuê.
   *
   * Chỉ bao gồm hợp đồng đang hiệu lực và đã kết thúc.
   * Hợp đồng nháp hoặc đã hủy không được xem là lịch sử thuê.
   *
   * @param {string} tenantId ID người thuê.
   * @returns {Array<{
   *   contract: object,
   *   room: object|null,
   *   isCurrent: boolean
   * }>}
   * @throws {Error} Khi không tìm thấy người thuê.
   */
  getTenantRentalHistory(tenantId) {
    const tenant =
      this.getTenantById(tenantId);

    if (!tenant) {
      throw new Error(
        `Không tìm thấy người thuê có ID "${tenantId}".`
      );
    }

    const contracts =
      this.storageService.getAll(
        STORAGE_KEYS.CONTRACTS
      );

    const rooms =
      this.storageService.getAll(
        STORAGE_KEYS.ROOMS
      );

    const roomById = new Map(
      rooms.map((room) => [
        room.id,
        room
      ])
    );

    return contracts
      .filter(
        (contract) =>
          Array.isArray(
            contract.tenantIds
          ) &&
          contract.tenantIds.includes(
            tenant.id
          ) &&
          (
            contract.status ===
              CONTRACT_STATUS.ACTIVE ||
            contract.status ===
              CONTRACT_STATUS.ENDED
          )
      )
      .sort(
        compareContractsByStartDateDescending
      )
      .map((contract) => ({
        contract: {
          ...contract,
          tenantIds: [
            ...(contract.tenantIds ?? [])
          ]
        },
        room:
          roomById.get(contract.roomId)
            ? {
                ...roomById.get(
                  contract.roomId
                )
              }
            : null,
        isCurrent:
          contract.status ===
          CONTRACT_STATUS.ACTIVE
      }));
  }

  /**
   * Lấy phòng hiện tại của người thuê.
   *
   * Nếu không có hợp đồng hiệu lực, hàm trả về null.
   *
   * @param {string} tenantId ID người thuê.
   * @returns {object|null} Phòng hiện tại hoặc null.
   * @throws {Error} Khi không tìm thấy người thuê hoặc dữ liệu tham chiếu lỗi.
   */
  getCurrentRoomOfTenant(tenantId) {
    const tenant =
      this.getTenantById(tenantId);

    if (!tenant) {
      throw new Error(
        `Không tìm thấy người thuê có ID "${tenantId}".`
      );
    }

    const contracts =
      this.storageService.getAll(
        STORAGE_KEYS.CONTRACTS
      );

    const activeContracts =
      getActiveTenantContracts(
        tenant.id,
        contracts
      ).sort(
        compareContractsByStartDateDescending
      );

    if (activeContracts.length === 0) {
      return null;
    }

    const currentContract =
      activeContracts[0];

    const room =
      this.storageService.getById(
        STORAGE_KEYS.ROOMS,
        currentContract.roomId
      );

    if (!room) {
      throw new Error(
        `Hợp đồng "${currentContract.code ?? currentContract.id}" đang tham chiếu đến phòng không tồn tại.`
      );
    }

    return room;
  }
}

/**
 * Instance TenantService dùng chung trong ứng dụng.
 */
export const tenantService =
  new TenantService();

export default tenantService;