import {
  STORAGE_KEYS
} from '../constants/storage-keys.js';

import {
  storageService
} from './storage-service.js';

import * as seedServiceModule
  from './seed-service.js';

import {
  BACKUP_FORMAT_VERSION,
  REQUIRED_BACKUP_COLLECTIONS,
  validateImportData,
  validateJsonFile
} from '../business/import-validator.js';

const IMPORT_MODE = Object.freeze({
  OVERWRITE: 'overwrite',
  MERGE: 'merge'
});

const MERGE_CONFLICT_MODE =
  Object.freeze({
    REPLACE: 'replace',
    KEEP_EXISTING:
      'keep-existing',
    ERROR: 'error'
  });

const COLLECTION_STORAGE_KEYS =
  Object.freeze({
    rooms:
      STORAGE_KEYS.ROOMS ??
      'rooms',

    tenants:
      STORAGE_KEYS.TENANTS ??
      'tenants',

    contracts:
      STORAGE_KEYS.CONTRACTS ??
      'contracts',

    meterReadings:
      STORAGE_KEYS.METER_READINGS ??
      'meterReadings',

    serviceConfigs:
      STORAGE_KEYS.SERVICE_CONFIGS ??
      'serviceConfigs',

    invoices:
      STORAGE_KEYS.INVOICES ??
      'invoices',

    payments:
      STORAGE_KEYS.PAYMENTS ??
      'payments',

    appSettings:
      STORAGE_KEYS.APP_SETTINGS ??
      'appSettings'
  });

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
 * Sao chép sâu dữ liệu JSON.
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
 * Lấy thời gian hiện tại tại Việt Nam.
 *
 * @returns {Date}
 */
function getCurrentVietnamDate() {
  const formattedTime =
    new Intl.DateTimeFormat(
      'sv-SE',
      {
        timeZone:
          'Asia/Ho_Chi_Minh',

        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',

        hour12: false
      }
    ).format(new Date());

  return new Date(
    formattedTime.replace(' ', 'T')
  );
}

/**
 * Lấy thời gian hiện tại dạng ISO.
 *
 * @returns {string}
 */
function getCurrentIsoDateTime() {
  return new Date().toISOString();
}

/**
 * Tạo phần ngày giờ dùng trong tên file.
 *
 * @returns {string} YYYYMMDD-HHmmss.
 */
function createFileTimestamp() {
  const date =
    getCurrentVietnamDate();

  const year = String(
    date.getFullYear()
  );

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  const hour = String(
    date.getHours()
  ).padStart(2, '0');

  const minute = String(
    date.getMinutes()
  ).padStart(2, '0');

  const second = String(
    date.getSeconds()
  ).padStart(2, '0');

  return (
    `${year}${month}${day}-` +
    `${hour}${minute}${second}`
  );
}

/**
 * Tìm SeedService trong module được import.
 *
 * Hỗ trợ module export default, seedService hoặc các hàm named export.
 *
 * @param {object} moduleValue Module seed-service.
 * @returns {object}
 */
function resolveSeedService(
  moduleValue
) {
  const candidates = [
    moduleValue?.default,
    moduleValue?.seedService,
    moduleValue
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate
          .resetToSeedData ===
          'function'
    ) ??
    null
  );
}

/**
 * Đọc nội dung file bằng FileReader.
 *
 * Dùng làm phương án dự phòng khi file.text() không tồn tại.
 *
 * @param {Blob} file File cần đọc.
 * @returns {Promise<string>}
 */
function readFileWithFileReader(file) {
  return new Promise(
    (resolve, reject) => {
      if (
        typeof FileReader ===
        'undefined'
      ) {
        reject(
          new Error(
            'Môi trường hiện tại không hỗ trợ đọc file.'
          )
        );

        return;
      }

      const reader =
        new FileReader();

      reader.addEventListener(
        'load',
        () => {
          resolve(
            String(
              reader.result ?? ''
            )
          );
        }
      );

      reader.addEventListener(
        'error',
        () => {
          reject(
            reader.error ??
            new Error(
              'Không thể đọc file JSON.'
            )
          );
        }
      );

      reader.readAsText(
        file,
        'utf-8'
      );
    }
  );
}

/**
 * Chuẩn hóa chế độ import.
 *
 * @param {*} mode Chế độ import.
 * @returns {string}
 */
function normalizeImportMode(mode) {
  const normalizedMode =
    String(
      mode ??
      IMPORT_MODE.OVERWRITE
    )
      .trim()
      .toLocaleLowerCase('vi-VN');

  if (
    !Object.values(
      IMPORT_MODE
    ).includes(normalizedMode)
  ) {
    throw new Error(
      'Chế độ import phải là "overwrite" hoặc "merge".'
    );
  }

  return normalizedMode;
}

/**
 * Chuẩn hóa cách xử lý khi trùng ID lúc gộp.
 *
 * @param {*} conflictMode Chế độ xử lý.
 * @returns {string}
 */
function normalizeConflictMode(
  conflictMode
) {
  const normalizedMode =
    String(
      conflictMode ??
      MERGE_CONFLICT_MODE.REPLACE
    )
      .trim()
      .toLocaleLowerCase('vi-VN');

  if (
    !Object.values(
      MERGE_CONFLICT_MODE
    ).includes(normalizedMode)
  ) {
    throw new Error(
      'Cách xử lý dữ liệu trùng phải là "replace", "keep-existing" hoặc "error".'
    );
  }

  return normalizedMode;
}

/**
 * Service import và export dữ liệu RoomMate.
 */
export class BackupService {
  /**
   * @param {object} [dependencies={}] Các phụ thuộc.
   * @param {object} [dependencies.storage]
   * StorageService được sử dụng.
   * @param {object} [dependencies.seed]
   * SeedService được sử dụng.
   */
  constructor({
    storage = storageService,
    seed =
      resolveSeedService(
        seedServiceModule
      )
  } = {}) {
    if (
      !storage ||
      typeof storage.getAll !==
        'function'
    ) {
      throw new TypeError(
        'BackupService cần StorageService có phương thức getAll().'
      );
    }

    const canWriteData =
      typeof storage.replaceAll ===
        'function' ||
      typeof storage.importAll ===
        'function';

    if (!canWriteData) {
      throw new TypeError(
        'StorageService cần có replaceAll() hoặc importAll().'
      );
    }

    this.storageService =
      storage;

    this.seedService =
      seed;
  }

  /**
   * Lấy toàn bộ collection hiện tại.
   *
   * @returns {object}
   */
  _readCollections() {
    const collections = {};

    REQUIRED_BACKUP_COLLECTIONS
      .forEach((collectionName) => {
        const storageKey =
          COLLECTION_STORAGE_KEYS[
            collectionName
          ];

        const collection =
          this.storageService.getAll(
            storageKey
          );

        collections[collectionName] =
          Array.isArray(collection)
            ? cloneJson(collection)
            : [];
      });

    return collections;
  }

  /**
   * Chuyển dữ liệu collection sang object dùng cho importAll().
   *
   * @param {object} collections Các collection logic.
   * @returns {object}
   */
  _createStoragePayload(
    collections
  ) {
    const payload = {};

    REQUIRED_BACKUP_COLLECTIONS
      .forEach((collectionName) => {
        const storageKey =
          COLLECTION_STORAGE_KEYS[
            collectionName
          ];

        payload[storageKey] =
          cloneJson(
            collections[
              collectionName
            ]
          );
      });

    return payload;
  }

  /**
   * Ghi toàn bộ collection.
   *
   * @param {object} collections Dữ liệu cần ghi.
   * @returns {true}
   */
  _writeCollections(collections) {
    if (
      typeof this.storageService
        .replaceAll === 'function'
    ) {
      REQUIRED_BACKUP_COLLECTIONS
        .forEach(
          (collectionName) => {
            const storageKey =
              COLLECTION_STORAGE_KEYS[
                collectionName
              ];

            this.storageService.replaceAll(
              storageKey,
              cloneJson(
                collections[
                  collectionName
                ]
              )
            );
          }
        );

      return true;
    }

    this.storageService.importAll(
      this._createStoragePayload(
        collections
      )
    );

    return true;
  }

  /**
   * Thực hiện một thao tác có rollback.
   *
   * Nếu thao tác thất bại, dữ liệu được khôi phục về snapshot
   * trước khi thao tác.
   *
   * @template T
   * @param {() => T} operation Thao tác cần thực hiện.
   * @returns {T}
   */
  _runAtomic(operation) {
    if (typeof operation !== 'function') {
      throw new TypeError(
        'Thao tác backup phải là một function.'
      );
    }

    const snapshot =
      this._readCollections();

    try {
      return operation();
    } catch (operationError) {
      try {
        this._writeCollections(
          snapshot
        );
      } catch (rollbackError) {
        throw new AggregateError(
          [
            operationError,
            rollbackError
          ],
          'Thao tác dữ liệu thất bại và không thể khôi phục backup.'
        );
      }

      throw operationError;
    }
  }

  /**
   * Tạo file JSON và kích hoạt tải xuống.
   *
   * Khi chạy ngoài trình duyệt, hàm vẫn trả về nội dung backup
   * nhưng downloaded bằng false.
   *
   * @param {object} data Dữ liệu cần tải.
   * @param {string} prefix Tiền tố tên file.
   * @returns {{
   *   fileName: string,
   *   data: object,
   *   json: string,
   *   downloaded: boolean
   * }}
   */
  _downloadJsonData(
    data,
    prefix
  ) {
    const fileName =
      `${prefix}-` +
      `${createFileTimestamp()}.json`;

    const json = JSON.stringify(
      data,
      null,
      2
    );

    const result = {
      fileName,
      data: cloneJson(data),
      json,
      downloaded: false
    };

    const supportsBrowserDownload =
      typeof Blob !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL ===
        'function' &&
      typeof document !==
        'undefined' &&
      document.body;

    if (!supportsBrowserDownload) {
      return result;
    }

    const blob = new Blob(
      [json],
      {
        type:
          'application/json;charset=utf-8'
      }
    );

    const objectUrl =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.style.display = 'none';

    document.body.append(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => {
      URL.revokeObjectURL(
        objectUrl
      );
    }, 0);

    result.downloaded = true;

    return result;
  }

  /**
   * Gộp một collection theo ID.
   *
   * @param {object[]} currentCollection Dữ liệu hiện tại.
   * @param {object[]} importedCollection Dữ liệu import.
   * @param {string} conflictMode Cách xử lý khi trùng ID.
   * @param {string} collectionName Tên collection.
   * @returns {{
   *   collection: object[],
   *   added: number,
   *   replaced: number,
   *   kept: number
   * }}
   */
  _mergeCollection(
    currentCollection,
    importedCollection,
    conflictMode,
    collectionName
  ) {
    const mergedById = new Map(
      currentCollection.map(
        (item) => [
          item.id,
          cloneJson(item)
        ]
      )
    );

    let added = 0;
    let replaced = 0;
    let kept = 0;

    importedCollection.forEach(
      (importedItem) => {
        const existingItem =
          mergedById.get(
            importedItem.id
          );

        if (!existingItem) {
          mergedById.set(
            importedItem.id,
            cloneJson(
              importedItem
            )
          );

          added += 1;
          return;
        }

        if (
          conflictMode ===
          MERGE_CONFLICT_MODE.ERROR
        ) {
          throw new Error(
            `Collection "${collectionName}" có ID "${importedItem.id}" đã tồn tại.`
          );
        }

        if (
          conflictMode ===
          MERGE_CONFLICT_MODE.KEEP_EXISTING
        ) {
          kept += 1;
          return;
        }

        mergedById.set(
          importedItem.id,
          cloneJson(
            importedItem
          )
        );

        replaced += 1;
      }
    );

    return {
      collection:
        [...mergedById.values()],

      added,
      replaced,
      kept
    };
  }

  /**
   * Export toàn bộ dữ liệu RoomMate.
   *
   * @returns {object}
   */
  exportData() {
    return {
      metadata: {
        application: 'RoomMate',

        formatVersion:
          BACKUP_FORMAT_VERSION,

        exportedAt:
          getCurrentIsoDateTime(),

        timezone:
          'Asia/Ho_Chi_Minh'
      },

      ...this._readCollections()
    };
  }

  /**
   * Tải file backup JSON xuống máy.
   *
   * @returns {{
   *   fileName: string,
   *   data: object,
   *   json: string,
   *   downloaded: boolean
   * }}
   */
  downloadBackup() {
    return this._downloadJsonData(
      this.exportData(),
      'roommate-backup'
    );
  }

  /**
   * Đọc và parse file JSON.
   *
   * Hàm chỉ đọc nội dung. Dữ liệu cần được kiểm tra bằng
   * validateBackupData() trước khi import.
   *
   * @param {File|Blob} file File JSON.
   * @returns {Promise<object>}
   */
  async readJsonFile(file) {
    validateJsonFile(file);

    let content;

    if (
      typeof file.text ===
        'function'
    ) {
      content =
        await file.text();
    } else {
      content =
        await readFileWithFileReader(
          file
        );
    }

    if (
      typeof content !== 'string' ||
      !content.trim()
    ) {
      throw new Error(
        'File JSON không có nội dung.'
      );
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      throw new SyntaxError(
        `Nội dung file không phải JSON hợp lệ: ${
          error instanceof Error
            ? error.message
            : 'Lỗi cú pháp JSON.'
        }`
      );
    }
  }

  /**
   * Kiểm tra dữ liệu backup.
   *
   * Nếu hợp lệ, trả về bản sao đã chuẩn hóa.
   * Nếu không hợp lệ, hàm ném lỗi và không thay đổi dữ liệu.
   *
   * @param {*} data Dữ liệu backup.
   * @returns {object}
   */
  validateBackupData(data) {
    return validateImportData(
      data,
      {
        requiredCollections:
          REQUIRED_BACKUP_COLLECTIONS,

        allowExtraCollections:
          true
      }
    );
  }

  /**
   * Import dữ liệu.
   *
   * options:
   * - mode: overwrite | merge
   * - conflict: replace | keep-existing | error
   *
   * Dữ liệu luôn được validation trước khi có bất kỳ thao tác
   * ghi nào. Khi ghi đè, một file backup được tạo trước.
   *
   * @param {*} data Dữ liệu cần import.
   * @param {object} [options={}] Tùy chọn import.
   * @param {'overwrite'|'merge'} [options.mode='overwrite']
   * @param {'replace'|'keep-existing'|'error'} [options.conflict='replace']
   * @returns {{
   *   mode: string,
   *   conflict: string,
   *   backup: object|null,
   *   summary: object,
   *   data: object
   * }}
   */
  importData(
    data,
    {
      mode =
        IMPORT_MODE.OVERWRITE,

      conflict =
        MERGE_CONFLICT_MODE.REPLACE
    } = {}
  ) {
    /*
     * Validation phải hoàn tất trước khi tạo backup hoặc
     * thay đổi dữ liệu hiện tại.
     */
    const validatedData =
      this.validateBackupData(data);

    const normalizedMode =
      normalizeImportMode(mode);

    const normalizedConflict =
      normalizeConflictMode(
        conflict
      );

    let backup = null;
    let targetCollections;
    const summary = {};

    if (
      normalizedMode ===
      IMPORT_MODE.OVERWRITE
    ) {
      backup =
        this.createBackupBeforeImport();

      targetCollections = {};

      REQUIRED_BACKUP_COLLECTIONS
        .forEach((collectionName) => {
          targetCollections[
            collectionName
          ] = cloneJson(
            validatedData[
              collectionName
            ]
          );

          summary[collectionName] = {
            imported:
              validatedData[
                collectionName
              ].length,

            added:
              validatedData[
                collectionName
              ].length,

            replaced: 0,
            kept: 0
          };
        });
    } else {
      const currentCollections =
        this._readCollections();

      targetCollections = {};

      REQUIRED_BACKUP_COLLECTIONS
        .forEach((collectionName) => {
          const mergeResult =
            this._mergeCollection(
              currentCollections[
                collectionName
              ],

              validatedData[
                collectionName
              ],

              normalizedConflict,
              collectionName
            );

          targetCollections[
            collectionName
          ] =
            mergeResult.collection;

          summary[collectionName] = {
            imported:
              validatedData[
                collectionName
              ].length,

            added:
              mergeResult.added,

            replaced:
              mergeResult.replaced,

            kept:
              mergeResult.kept
          };
        });
    }

    this._runAtomic(() => {
      this._writeCollections(
        targetCollections
      );
    });

    return {
      mode: normalizedMode,
      conflict:
        normalizedConflict,
      backup,
      summary,
      data: this.exportData()
    };
  }

  /**
   * Tạo backup trước khi import ghi đè.
   *
   * @returns {{
   *   fileName: string,
   *   data: object,
   *   json: string,
   *   downloaded: boolean
   * }}
   */
  createBackupBeforeImport() {
    return this._downloadJsonData(
      this.exportData(),
      'roommate-before-import'
    );
  }

  /**
   * Xóa toàn bộ dữ liệu của các collection RoomMate.
   *
   * @returns {object} Dữ liệu rỗng sau khi reset.
   */
  resetAllData() {
    const emptyCollections =
      Object.fromEntries(
        REQUIRED_BACKUP_COLLECTIONS
          .map(
            (collectionName) => [
              collectionName,
              []
            ]
          )
      );

    this._runAtomic(() => {
      this._writeCollections(
        emptyCollections
      );
    });

    return this.exportData();
  }

  /**
   * Khôi phục dữ liệu mẫu.
   *
   * Nếu SeedService xảy ra lỗi, dữ liệu trước đó được rollback.
   *
   * @returns {object} Dữ liệu sau khi khôi phục.
   */
  restoreSeedData() {
    if (
      !this.seedService ||
      typeof this.seedService
        .resetToSeedData !==
        'function'
    ) {
      throw new Error(
        'SeedService chưa cung cấp phương thức resetToSeedData().'
      );
    }

    this._runAtomic(() => {
      this.seedService
        .resetToSeedData();
    });

    return this.exportData();
  }
}

export const backupService =
  new BackupService();

export default backupService;