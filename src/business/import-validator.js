/**
 * Các collection bắt buộc trong file backup RoomMate.
 */
export const REQUIRED_BACKUP_COLLECTIONS = Object.freeze([
  'rooms',
  'tenants',
  'contracts',
  'meterReadings',
  'serviceConfigs',
  'invoices',
  'payments',
  'appSettings'
]);

export const BACKUP_FORMAT_VERSION = 1;

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
 * Sao chép dữ liệu JSON mà không thay đổi dữ liệu đầu vào.
 *
 * @template T
 * @param {T} value Giá trị cần sao chép.
 * @returns {T}
 */
function cloneJson(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

/**
 * Chuẩn hóa tên collection bắt buộc.
 *
 * @param {*} requiredCollections Danh sách collection.
 * @returns {string[]}
 */
function normalizeRequiredCollections(
  requiredCollections
) {
  if (!Array.isArray(requiredCollections)) {
    throw new TypeError(
      'Danh sách collection bắt buộc phải là một mảng.'
    );
  }

  const normalizedCollections =
    requiredCollections.map(
      (collectionName, index) => {
        if (
          typeof collectionName !==
          'string'
        ) {
          throw new TypeError(
            `Tên collection thứ ${index + 1} phải là một chuỗi.`
          );
        }

        const normalizedName =
          collectionName.trim();

        if (!normalizedName) {
          throw new Error(
            `Tên collection thứ ${index + 1} không được để trống.`
          );
        }

        return normalizedName;
      }
    );

  if (
    new Set(normalizedCollections).size !==
    normalizedCollections.length
  ) {
    throw new Error(
      'Danh sách collection bắt buộc có tên bị trùng.'
    );
  }

  return normalizedCollections;
}

/**
 * Kiểm tra một phần tử trong collection.
 *
 * @param {*} item Phần tử cần kiểm tra.
 * @param {string} collectionName Tên collection.
 * @param {number} index Vị trí phần tử.
 * @returns {object}
 */
function validateCollectionItem(
  item,
  collectionName,
  index
) {
  if (!isPlainObject(item)) {
    throw new TypeError(
      `Phần tử thứ ${index + 1} của collection "${collectionName}" phải là một object.`
    );
  }

  if (
    typeof item.id !== 'string' ||
    !item.id.trim()
  ) {
    throw new Error(
      `Phần tử thứ ${index + 1} của collection "${collectionName}" phải có id là chuỗi không rỗng.`
    );
  }

  return {
    ...cloneJson(item),
    id: item.id.trim()
  };
}

/**
 * Kiểm tra và chuẩn hóa một collection.
 *
 * @param {*} collection Dữ liệu collection.
 * @param {string} collectionName Tên collection.
 * @returns {object[]}
 */
export function validateImportCollection(
  collection,
  collectionName
) {
  if (!Array.isArray(collection)) {
    throw new TypeError(
      `Collection "${collectionName}" phải là một mảng.`
    );
  }

  const normalizedCollection =
    collection.map(
      (item, index) =>
        validateCollectionItem(
          item,
          collectionName,
          index
        )
    );

  const ids = new Set();

  normalizedCollection.forEach(
    (item) => {
      if (ids.has(item.id)) {
        throw new Error(
          `Collection "${collectionName}" có id bị trùng: "${item.id}".`
        );
      }

      ids.add(item.id);
    }
  );

  return normalizedCollection;
}

/**
 * Kiểm tra thông tin file JSON trước khi đọc.
 *
 * File phải:
 * - Có tên kết thúc bằng .json.
 * - Không được rỗng.
 * - Có kiểu MIME JSON, octet-stream hoặc để trống.
 *
 * @param {*} file File được chọn.
 * @returns {true}
 */
export function validateJsonFile(file) {
  if (
    !file ||
    typeof file !== 'object'
  ) {
    throw new TypeError(
      'File JSON không hợp lệ.'
    );
  }

  if (
    typeof file.name !== 'string' ||
    !file.name
      .trim()
      .toLocaleLowerCase('vi-VN')
      .endsWith('.json')
  ) {
    throw new Error(
      'File import phải có phần mở rộng .json.'
    );
  }

  if (
    typeof file.size === 'number' &&
    file.size <= 0
  ) {
    throw new Error(
      'File JSON không được rỗng.'
    );
  }

  const mimeType =
    typeof file.type === 'string'
      ? file.type
          .trim()
          .toLocaleLowerCase('vi-VN')
      : '';

  const allowedMimeTypes = [
    '',
    'application/json',
    'text/json',
    'application/octet-stream'
  ];

  if (
    mimeType &&
    !allowedMimeTypes.includes(
      mimeType
    ) &&
    !mimeType.includes('json')
  ) {
    throw new Error(
      'File được chọn không phải file JSON.'
    );
  }

  return true;
}

/**
 * Kiểm tra toàn bộ dữ liệu backup.
 *
 * Hàm không thay đổi object đầu vào. Nếu dữ liệu hợp lệ,
 * hàm trả về một bản sao đã chuẩn hóa.
 *
 * @param {*} data Dữ liệu backup.
 * @param {object} [options={}] Tùy chọn.
 * @param {string[]} [options.requiredCollections]
 * Danh sách collection bắt buộc.
 * @param {boolean} [options.allowExtraCollections=true]
 * Cho phép file có thêm collection khác.
 * @returns {object}
 */
export function validateImportData(
  data,
  {
    requiredCollections =
      REQUIRED_BACKUP_COLLECTIONS,

    allowExtraCollections = true
  } = {}
) {
  if (!isPlainObject(data)) {
    throw new TypeError(
      'Dữ liệu backup phải là một object JSON.'
    );
  }

  const normalizedRequiredCollections =
    normalizeRequiredCollections(
      requiredCollections
    );

  const missingCollections =
    normalizedRequiredCollections.filter(
      (collectionName) =>
        !Object.prototype
          .hasOwnProperty
          .call(
            data,
            collectionName
          )
    );

  if (missingCollections.length > 0) {
    throw new Error(
      `File backup thiếu các collection bắt buộc: ${missingCollections.join(', ')}.`
    );
  }

  if (!allowExtraCollections) {
    const allowedKeys = new Set([
      ...normalizedRequiredCollections,
      'metadata'
    ]);

    const extraCollections =
      Object.keys(data).filter(
        (key) =>
          !allowedKeys.has(key)
      );

    if (extraCollections.length > 0) {
      throw new Error(
        `File backup chứa collection không được hỗ trợ: ${extraCollections.join(', ')}.`
      );
    }
  }

  const normalizedData = {};

  if (data.metadata !== undefined) {
    if (!isPlainObject(data.metadata)) {
      throw new TypeError(
        'metadata của file backup phải là một object.'
      );
    }

    normalizedData.metadata =
      cloneJson(data.metadata);
  }

  normalizedRequiredCollections.forEach(
    (collectionName) => {
      normalizedData[collectionName] =
        validateImportCollection(
          data[collectionName],
          collectionName
        );
    }
  );

  return normalizedData;
}

export default validateImportData;