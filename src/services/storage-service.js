import {
  STORAGE_COLLECTION_KEYS,
  STORAGE_KEYS
} from '../constants/storage-keys.js';

import { createUniqueId } from '../utils/id-utils.js';
import { getCurrentIsoDateTime } from '../utils/date-utils.js';

const ALL_STORAGE_KEYS = Object.freeze(
  Object.values(STORAGE_KEYS)
);

/**
 * Kiểm tra giá trị có phải object thông thường hay không.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @returns {boolean}
 */
function isPlainObject(value) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null
  );
}

/**
 * Sao chép sâu dữ liệu bằng JSON.stringify và JSON.parse.
 *
 * @template T
 * @param {T} value Dữ liệu cần sao chép.
 * @returns {T} Bản sao độc lập.
 * @throws {TypeError} Khi dữ liệu không thể chuyển thành JSON.
 */
function cloneJsonValue(value) {
  if (value === undefined) {
    return undefined;
  }

  let serializedValue;

  try {
    serializedValue = JSON.stringify(value);
  } catch (error) {
    throw new TypeError(
      'Dữ liệu không thể chuyển thành JSON.',
      { cause: error }
    );
  }

  if (serializedValue === undefined) {
    throw new TypeError(
      'Dữ liệu không thể chuyển thành JSON.'
    );
  }

  return JSON.parse(serializedValue);
}

/**
 * Kiểm tra khóa LocalStorage.
 *
 * @param {*} key Khóa cần kiểm tra.
 * @returns {string} Khóa đã được loại bỏ khoảng trắng.
 * @throws {TypeError} Khi khóa không hợp lệ.
 */
function normalizeKey(key) {
  if (typeof key !== 'string') {
    throw new TypeError(
      'Khóa LocalStorage phải là một chuỗi.'
    );
  }

  const normalizedKey = key.trim();

  if (!normalizedKey) {
    throw new TypeError(
      'Khóa LocalStorage không được để trống.'
    );
  }

  return normalizedKey;
}

/**
 * Kiểm tra ID.
 *
 * @param {*} id ID cần kiểm tra.
 * @returns {string} ID đã được loại bỏ khoảng trắng.
 * @throws {TypeError} Khi ID không hợp lệ.
 */
function normalizeId(id) {
  if (typeof id !== 'string') {
    throw new TypeError('ID phải là một chuỗi.');
  }

  const normalizedId = id.trim();

  if (!normalizedId) {
    throw new TypeError('ID không được để trống.');
  }

  return normalizedId;
}

/**
 * Kiểm tra một phần tử collection.
 *
 * @param {*} item Phần tử cần kiểm tra.
 * @param {string} context Nội dung dùng trong thông báo lỗi.
 * @throws {TypeError} Khi phần tử không phải object.
 */
function assertCollectionItem(item, context = 'Dữ liệu') {
  if (!isPlainObject(item)) {
    throw new TypeError(
      `${context} phải là một object.`
    );
  }
}

/**
 * Kiểm tra danh sách có ID hợp lệ và không trùng nhau.
 *
 * @param {object[]} items Danh sách cần kiểm tra.
 * @param {string} key Tên collection.
 * @throws {TypeError|Error} Khi ID không hợp lệ hoặc bị trùng.
 */
function assertUniqueIds(items, key) {
  const ids = new Set();

  items.forEach((item, index) => {
    assertCollectionItem(
      item,
      `Phần tử thứ ${index + 1} của "${key}"`
    );

    const id = normalizeId(item.id);

    if (ids.has(id)) {
      throw new Error(
        `Collection "${key}" chứa ID bị trùng: "${id}".`
      );
    }

    ids.add(id);
  });
}

/**
 * Phân tích chuỗi JSON an toàn.
 *
 * Khi giá trị không tồn tại hoặc JSON bị lỗi, hàm trả về
 * một bản sao của giá trị dự phòng.
 *
 * @template T
 * @param {string|null|undefined} value Chuỗi JSON cần phân tích.
 * @param {T} fallback Giá trị dự phòng.
 * @returns {T|*} Dữ liệu đã phân tích hoặc giá trị dự phòng.
 * @throws {TypeError} Khi value không phải chuỗi, null hoặc undefined.
 */
export function safeParse(value, fallback) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return cloneJsonValue(fallback);
  }

  if (typeof value !== 'string') {
    throw new TypeError(
      'Giá trị JSON phải là một chuỗi.'
    );
  }

  try {
    return JSON.parse(value);
  } catch {
    return cloneJsonValue(fallback);
  }
}

/**
 * Service quản lý dữ liệu JSON trong LocalStorage.
 *
 * Có thể truyền LocalStorage giả vào constructor để unit test.
 */
export class StorageService {
  /**
   * @param {Storage|null} storage Đối tượng có giao diện giống LocalStorage.
   */
  constructor(storage = globalThis.localStorage ?? null) {
    this.storage = storage;
  }

  /**
   * Kiểm tra LocalStorage có sẵn hay không.
   *
   * @returns {Storage}
   * @throws {Error} Khi không có LocalStorage hợp lệ.
   */
  _getStorage() {
    const storage = this.storage;

    const isValidStorage =
      storage &&
      typeof storage.getItem === 'function' &&
      typeof storage.setItem === 'function' &&
      typeof storage.removeItem === 'function';

    if (!isValidStorage) {
      throw new Error(
        'LocalStorage không khả dụng trong môi trường hiện tại.'
      );
    }

    return storage;
  }

  /**
   * Đọc dữ liệu thô từ LocalStorage.
   *
   * @param {string} key Khóa LocalStorage.
   * @returns {string|null}
   */
  _readRaw(key) {
    const storage = this._getStorage();

    try {
      return storage.getItem(key);
    } catch (error) {
      throw new Error(
        `Không thể đọc dữ liệu từ khóa "${key}".`,
        { cause: error }
      );
    }
  }

  /**
   * Ghi dữ liệu JSON vào LocalStorage.
   *
   * @param {string} key Khóa LocalStorage.
   * @param {*} value Dữ liệu cần ghi.
   */
  _writeJson(key, value) {
    const storage = this._getStorage();

    let serializedValue;

    try {
      serializedValue = JSON.stringify(value);
    } catch (error) {
      throw new TypeError(
        `Dữ liệu của khóa "${key}" không thể chuyển thành JSON.`,
        { cause: error }
      );
    }

    if (serializedValue === undefined) {
      throw new TypeError(
        `Dữ liệu của khóa "${key}" không thể chuyển thành JSON.`
      );
    }

    try {
      storage.setItem(key, serializedValue);
    } catch (error) {
      throw new Error(
        `Không thể ghi dữ liệu vào khóa "${key}".`,
        { cause: error }
      );
    }
  }

  /**
   * Xóa một khóa khỏi LocalStorage.
   *
   * @param {string} key Khóa cần xóa.
   */
  _removeRaw(key) {
    const storage = this._getStorage();

    try {
      storage.removeItem(key);
    } catch (error) {
      throw new Error(
        `Không thể xóa khóa "${key}".`,
        { cause: error }
      );
    }
  }

  /**
   * Phân tích chuỗi JSON an toàn.
   *
   * @template T
   * @param {string|null|undefined} value Chuỗi JSON.
   * @param {T} fallback Giá trị dự phòng.
   * @returns {T|*}
   */
  safeParse(value, fallback) {
    return safeParse(value, fallback);
  }

  /**
   * Lấy toàn bộ phần tử trong một collection.
   *
   * Trả về mảng rỗng khi khóa chưa tồn tại, JSON bị lỗi
   * hoặc dữ liệu tại khóa không phải mảng.
   *
   * @param {string} key Khóa collection.
   * @returns {object[]} Bản sao dữ liệu trong collection.
   */
  getAll(key) {
    const normalizedKey = normalizeKey(key);
    const rawValue = this._readRaw(normalizedKey);
    const parsedValue = safeParse(rawValue, []);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return cloneJsonValue(parsedValue);
  }

  /**
   * Tìm một phần tử theo ID.
   *
   * @param {string} key Khóa collection.
   * @param {string} id ID cần tìm.
   * @returns {object|null} Bản sao phần tử hoặc null.
   */
  getById(key, id) {
    const normalizedKey = normalizeKey(key);
    const normalizedId = normalizeId(id);

    const item = this
      .getAll(normalizedKey)
      .find((entry) => entry?.id === normalizedId);

    return item ? cloneJsonValue(item) : null;
  }

  /**
   * Tạo phần tử mới trong collection.
   *
   * Nếu item chưa có ID, service tự sinh ID chuỗi.
   * Service tự thêm createdAt và updatedAt nếu chưa có.
   *
   * @param {string} key Khóa collection.
   * @param {object} item Dữ liệu cần tạo.
   * @returns {object} Bản sao phần tử đã được tạo.
   * @throws {Error} Khi ID bị trùng.
   */
  create(key, item) {
    const normalizedKey = normalizeKey(key);

    assertCollectionItem(item, 'Dữ liệu tạo mới');

    const items = this.getAll(normalizedKey);
    const newItem = cloneJsonValue(item);

    if (
      newItem.id === undefined ||
      newItem.id === null
    ) {
      const prefix =
        normalizedKey.replace(
          /[^a-zA-Z0-9_-]/g,
          '_'
        ) || 'item';

      do {
        newItem.id = createUniqueId(prefix);
      } while (
        items.some(
          (existingItem) =>
            existingItem?.id === newItem.id
        )
      );
    } else {
      newItem.id = normalizeId(newItem.id);
    }

    const duplicateExists = items.some(
      (existingItem) =>
        existingItem?.id === newItem.id
    );

    if (duplicateExists) {
      throw new Error(
        `ID "${newItem.id}" đã tồn tại trong collection "${normalizedKey}".`
      );
    }

    const now = getCurrentIsoDateTime();

    if (
      typeof newItem.createdAt !== 'string' ||
      !newItem.createdAt.trim()
    ) {
      newItem.createdAt = now;
    }

    if (
      typeof newItem.updatedAt !== 'string' ||
      !newItem.updatedAt.trim()
    ) {
      newItem.updatedAt = now;
    }

    const nextItems = [...items, newItem];

    this._writeJson(normalizedKey, nextItems);

    return cloneJsonValue(newItem);
  }

  /**
   * Cập nhật một phần tử theo ID.
   *
   * Không cho phép thay đổi ID hoặc createdAt.
   * updatedAt được cập nhật tự động.
   *
   * @param {string} key Khóa collection.
   * @param {string} id ID phần tử.
   * @param {object} changes Các trường cần cập nhật.
   * @returns {object} Bản sao phần tử sau cập nhật.
   * @throws {Error} Khi không tìm thấy ID.
   */
  update(key, id, changes) {
    const normalizedKey = normalizeKey(key);
    const normalizedId = normalizeId(id);

    assertCollectionItem(
      changes,
      'Dữ liệu cập nhật'
    );

    if (
      changes.id !== undefined &&
      normalizeId(changes.id) !== normalizedId
    ) {
      throw new Error(
        'Không được thay đổi ID của bản ghi.'
      );
    }

    const items = this.getAll(normalizedKey);
    const itemIndex = items.findIndex(
      (item) => item?.id === normalizedId
    );

    if (itemIndex === -1) {
      throw new Error(
        `Không tìm thấy ID "${normalizedId}" trong collection "${normalizedKey}".`
      );
    }

    const existingItem = items[itemIndex];
    const clonedChanges = cloneJsonValue(changes);

    delete clonedChanges.id;
    delete clonedChanges.createdAt;
    delete clonedChanges.updatedAt;

    const now = getCurrentIsoDateTime();

    const updatedItem = {
      ...existingItem,
      ...clonedChanges,
      id: normalizedId,
      createdAt:
        typeof existingItem.createdAt === 'string' &&
        existingItem.createdAt.trim()
          ? existingItem.createdAt
          : now,
      updatedAt: now
    };

    const nextItems = [...items];

    nextItems[itemIndex] = updatedItem;

    this._writeJson(normalizedKey, nextItems);

    return cloneJsonValue(updatedItem);
  }

  /**
   * Xóa một phần tử theo ID.
   *
   * @param {string} key Khóa collection.
   * @param {string} id ID cần xóa.
   * @returns {object|null} Phần tử đã xóa hoặc null nếu không tìm thấy.
   */
  remove(key, id) {
    const normalizedKey = normalizeKey(key);
    const normalizedId = normalizeId(id);

    const items = this.getAll(normalizedKey);
    const itemIndex = items.findIndex(
      (item) => item?.id === normalizedId
    );

    if (itemIndex === -1) {
      return null;
    }

    const removedItem = items[itemIndex];
    const nextItems = items.filter(
      (_, index) => index !== itemIndex
    );

    this._writeJson(normalizedKey, nextItems);

    return cloneJsonValue(removedItem);
  }

  /**
   * Kiểm tra collection có phần tử thỏa mãn điều kiện hay không.
   *
   * @param {string} key Khóa collection.
   * @param {(item: object, index: number, items: object[]) => boolean} predicate
   * Hàm điều kiện.
   * @returns {boolean}
   */
  exists(key, predicate) {
    const normalizedKey = normalizeKey(key);

    if (typeof predicate !== 'function') {
      throw new TypeError(
        'Predicate phải là một function.'
      );
    }

    const items = this.getAll(normalizedKey);

    return items.some(predicate);
  }

  /**
   * Thay thế toàn bộ dữ liệu của một collection.
   *
   * Hàm kiểm tra tất cả phần tử là object, ID là chuỗi
   * và không có ID trùng.
   *
   * @param {string} key Khóa collection.
   * @param {object[]} items Danh sách mới.
   * @returns {object[]} Bản sao danh sách đã lưu.
   */
  replaceAll(key, items) {
    const normalizedKey = normalizeKey(key);

    if (!Array.isArray(items)) {
      throw new TypeError(
        'Dữ liệu thay thế phải là một mảng.'
      );
    }

    const clonedItems = cloneJsonValue(items);

    assertUniqueIds(clonedItems, normalizedKey);

    this._writeJson(normalizedKey, clonedItems);

    return cloneJsonValue(clonedItems);
  }

  /**
   * Xóa một khóa khỏi LocalStorage.
   *
   * @param {string} key Khóa cần xóa.
   * @returns {boolean} true nếu khóa từng tồn tại.
   */
  clearKey(key) {
    const normalizedKey = normalizeKey(key);
    const existed =
      this._readRaw(normalizedKey) !== null;

    this._removeRaw(normalizedKey);

    return existed;
  }

  /**
   * Xóa toàn bộ khóa dữ liệu thuộc RoomMate.
   *
   * Không sử dụng localStorage.clear() để tránh xóa dữ liệu
   * của ứng dụng khác trên cùng origin.
   *
   * @returns {number} Số khóa đã tồn tại và được xóa.
   */
  clearAll() {
    let removedCount = 0;

    ALL_STORAGE_KEYS.forEach((key) => {
      if (this.clearKey(key)) {
        removedCount += 1;
      }
    });

    return removedCount;
  }

  /**
   * Xuất toàn bộ dữ liệu RoomMate thành object độc lập.
   *
   * @returns {object} Object chứa tất cả collection và appSettings.
   */
  exportAll() {
    const exportedData = {};

    STORAGE_COLLECTION_KEYS.forEach((key) => {
      exportedData[key] = this.getAll(key);
    });

    const appSettingsRaw = this._readRaw(
      STORAGE_KEYS.APP_SETTINGS
    );

    const appSettings = safeParse(
      appSettingsRaw,
      {}
    );

    exportedData[STORAGE_KEYS.APP_SETTINGS] =
      isPlainObject(appSettings)
        ? cloneJsonValue(appSettings)
        : {};

    return cloneJsonValue(exportedData);
  }

  /**
   * Import dữ liệu RoomMate.
   *
   * Chấp nhận:
   * - object chứa trực tiếp các collection;
   * - object export có dữ liệu bên trong thuộc tính `data`.
   *
   * Chỉ những khóa RoomMate xuất hiện trong dữ liệu import mới
   * được thay thế. Quá trình import có rollback nếu ghi thất bại.
   *
   * @param {object} data Dữ liệu cần import.
   * @returns {object} Toàn bộ dữ liệu sau import.
   * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
   */
  importAll(data) {
    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu import phải là một object.'
      );
    }

    const source = isPlainObject(data.data)
      ? data.data
      : data;

    const importedKeys = ALL_STORAGE_KEYS.filter(
      (key) =>
        Object.prototype.hasOwnProperty.call(
          source,
          key
        )
    );

    if (importedKeys.length === 0) {
      throw new Error(
        'Dữ liệu import không chứa collection RoomMate hợp lệ.'
      );
    }

    const normalizedData = {};

    importedKeys.forEach((key) => {
      const value = source[key];

      if (
        STORAGE_COLLECTION_KEYS.includes(key)
      ) {
        if (!Array.isArray(value)) {
          throw new TypeError(
            `Collection "${key}" phải là một mảng.`
          );
        }

        const clonedItems = cloneJsonValue(value);

        assertUniqueIds(clonedItems, key);

        normalizedData[key] = clonedItems;
        return;
      }

      if (key === STORAGE_KEYS.APP_SETTINGS) {
        if (!isPlainObject(value)) {
          throw new TypeError(
            'appSettings phải là một object.'
          );
        }

        normalizedData[key] =
          cloneJsonValue(value);
      }
    });

    const serializedData = new Map();

    importedKeys.forEach((key) => {
      serializedData.set(
        key,
        JSON.stringify(normalizedData[key])
      );
    });

    const storage = this._getStorage();
    const previousValues = new Map();

    importedKeys.forEach((key) => {
      previousValues.set(
        key,
        this._readRaw(key)
      );
    });

    try {
      importedKeys.forEach((key) => {
        storage.setItem(
          key,
          serializedData.get(key)
        );
      });
    } catch (importError) {
      const rollbackErrors = [];

      importedKeys.forEach((key) => {
        try {
          const previousValue =
            previousValues.get(key);

          if (previousValue === null) {
            storage.removeItem(key);
          } else {
            storage.setItem(
              key,
              previousValue
            );
          }
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      });

      if (rollbackErrors.length > 0) {
        throw new AggregateError(
          [importError, ...rollbackErrors],
          'Import và khôi phục dữ liệu đều thất bại.'
        );
      }

      throw new Error(
        'Import thất bại. Dữ liệu hiện tại đã được khôi phục.',
        { cause: importError }
      );
    }

    return this.exportAll();
  }
}

/**
 * Instance dùng chung trong ứng dụng.
 *
 * Khi unit test, có thể tạo instance mới:
 * `new StorageService(mockStorage)`.
 */
export const storageService = new StorageService();

export default storageService;