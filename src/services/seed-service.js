import {
  STORAGE_COLLECTION_KEYS,
  STORAGE_KEYS
} from '../constants/storage-keys.js';

import {
  storageService
} from './storage-service.js';

import {
  SEED_DATA
} from '../data/seed-data.js';

/**
 * Tạo bản sao sâu bằng JSON để không làm thay đổi SEED_DATA.
 *
 * @template T
 * @param {T} value Dữ liệu cần sao chép.
 * @returns {T}
 */
function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Kiểm tra object có ít nhất một thuộc tính riêng hay không.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @returns {boolean}
 */
function hasObjectProperties(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  );
}

/**
 * Service quản lý dữ liệu mẫu của RoomMate.
 *
 * Có thể truyền StorageService giả vào constructor để unit test.
 */
export class SeedService {
  /**
   * @param {import('./storage-service.js').StorageService} service
   * StorageService được sử dụng.
   */
  constructor(service = storageService) {
    if (
      !service ||
      typeof service.exportAll !== 'function' ||
      typeof service.importAll !== 'function'
    ) {
      throw new TypeError(
        'SeedService cần một StorageService hợp lệ.'
      );
    }

    this.storageService = service;
  }

  /**
   * Kiểm tra hệ thống đã có dữ liệu RoomMate hay chưa.
   *
   * Chỉ cần một collection có phần tử hoặc appSettings có dữ liệu
   * thì hệ thống được xem là đã có dữ liệu.
   *
   * @returns {boolean}
   */
  hasExistingData() {
    const currentData =
      this.storageService.exportAll();

    const hasCollectionData =
      STORAGE_COLLECTION_KEYS.some((key) => {
        const collection = currentData[key];

        return (
          Array.isArray(collection) &&
          collection.length > 0
        );
      });

    const hasSettingsData = hasObjectProperties(
      currentData[STORAGE_KEYS.APP_SETTINGS]
    );

    return hasCollectionData || hasSettingsData;
  }

  /**
   * Ghi dữ liệu seed khi toàn bộ dữ liệu RoomMate đang rỗng.
   *
   * Hàm không ghi đè nếu đã tồn tại bất kỳ dữ liệu nào.
   *
   * @returns {{
   *   seeded: boolean,
   *   reason: 'seeded'|'existing-data',
   *   data: object
   * }}
   */
  seedIfEmpty() {
    if (this.hasExistingData()) {
      return {
        seeded: false,
        reason: 'existing-data',
        data: this.storageService.exportAll()
      };
    }

    const importedData =
      this.storageService.importAll(
        cloneJson(SEED_DATA)
      );

    return {
      seeded: true,
      reason: 'seeded',
      data: importedData
    };
  }

  /**
   * Thay thế toàn bộ dữ liệu RoomMate bằng dữ liệu seed.
   *
   * Đây là thao tác đặt lại dữ liệu có chủ đích và sẽ ghi đè
   * các collection RoomMate hiện có. StorageService chịu trách
   * nhiệm rollback nếu quá trình ghi thất bại.
   *
   * @returns {{
   *   seeded: true,
   *   reason: 'reset',
   *   data: object
   * }}
   */
  resetToSeedData() {
    const importedData =
      this.storageService.importAll(
        cloneJson(SEED_DATA)
      );

    return {
      seeded: true,
      reason: 'reset',
      data: importedData
    };
  }
}

/**
 * Instance SeedService dùng chung trong ứng dụng.
 */
export const seedService = new SeedService();

export default seedService;