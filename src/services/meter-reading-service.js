import {
  STORAGE_KEYS
} from '../constants/storage-keys.js';

import {
  CONTRACT_STATUS
} from '../constants/statuses.js';

import {
  storageService
} from './storage-service.js';

import {
  calculateElectricUsage,
  calculateUsage,
  calculateWaterUsage,
  getPreviousMonthKey
} from '../business/meter-calculator.js';

import {
  validateMeterReading,
  validatePreviousIndex
} from '../business/meter-validator.js';

import {
  isDateRangeOverlap
} from '../business/contract-utils.js';

/**
 * Mã các cảnh báo có thể được trả về khi tạo hoặc sửa chỉ số.
 */
export const METER_READING_WARNING_CODE = Object.freeze({
  ELECTRICITY_PREVIOUS_MISMATCH:
    'electricity_previous_mismatch',

  WATER_PREVIOUS_MISMATCH:
    'water_previous_mismatch',

  RELATED_INVOICE_EXISTS:
    'related_invoice_exists'
});

const CONTRACT_STATUSES_WITH_OCCUPANCY = Object.freeze([
  CONTRACT_STATUS.ACTIVE,
  CONTRACT_STATUS.ENDED
]);

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
 * Chuẩn hóa ID.
 *
 * @param {*} id Giá trị ID.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeId(
  id,
  fieldName = 'ID'
) {
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
 * Chuẩn hóa khóa tháng YYYY-MM.
 *
 * @param {*} month Khóa tháng.
 * @returns {string}
 */
function normalizeMonthKey(month) {
  if (typeof month !== 'string') {
    throw new TypeError(
      'Tháng phải là một chuỗi YYYY-MM.'
    );
  }

  const normalizedMonth = month.trim();

  const match =
    /^(\d{4})-(\d{2})$/.exec(
      normalizedMonth
    );

  if (!match) {
    throw new Error(
      'Tháng phải đúng định dạng YYYY-MM.'
    );
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);

  if (
    !Number.isInteger(year) ||
    year < 1
  ) {
    throw new Error(
      'Năm trong khóa tháng không hợp lệ.'
    );
  }

  if (
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new Error(
      'Tháng phải nằm trong khoảng từ 01 đến 12.'
    );
  }

  return normalizedMonth;
}

/**
 * Lấy ngày đầu và ngày cuối của tháng.
 *
 * @param {string} month Khóa tháng YYYY-MM.
 * @returns {{startDate: string, endDate: string}}
 */
function getMonthDateRange(month) {
  const normalizedMonth =
    normalizeMonthKey(month);

  const [year, monthNumber] =
    normalizedMonth
      .split('-')
      .map(Number);

  const endDate = new Date(0);

  endDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCFullYear(
    year,
    monthNumber,
    0
  );

  const endYear = String(
    endDate.getUTCFullYear()
  ).padStart(4, '0');

  const endMonth = String(
    endDate.getUTCMonth() + 1
  ).padStart(2, '0');

  const endDay = String(
    endDate.getUTCDate()
  ).padStart(2, '0');

  return {
    startDate:
      `${normalizedMonth}-01`,

    endDate:
      `${endYear}-${endMonth}-${endDay}`
  };
}

/**
 * Chuẩn hóa một giá trị chỉ số.
 *
 * calculateUsage(0, value) vừa chuyển giá trị thành number
 * vừa kiểm tra NaN, số âm và số không hữu hạn.
 *
 * @param {*} value Giá trị chỉ số.
 * @param {string} label Nhãn chỉ số.
 * @returns {number}
 */
function normalizeIndexValue(
  value,
  label
) {
  return calculateUsage(
    0,
    value,
    label
  );
}

/**
 * Loại bỏ các trường do StorageService quản lý.
 *
 * @param {object} reading Bản ghi đã chuẩn hóa.
 * @returns {object}
 */
function createStorageChanges(reading) {
  const {
    id,
    createdAt,
    updatedAt,
    warnings,
    ...changes
  } = reading;

  return changes;
}

/**
 * Service quản lý chỉ số điện nước.
 *
 * Không thao tác trực tiếp LocalStorage.
 */
export class MeterReadingService {
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
        'MeterReadingService cần một StorageService hợp lệ.'
      );
    }

    this.storageService = service;
  }

  /**
   * Tính và bổ sung lượng điện, nước tiêu thụ.
   *
   * Hàm không làm thay đổi bản ghi đầu vào.
   *
   * @param {object} reading Bản ghi chỉ số.
   * @returns {object}
   */
  _createReadingView(reading) {
    if (!isPlainObject(reading)) {
      throw new TypeError(
        'Bản ghi chỉ số phải là một object.'
      );
    }

    const clonedReading =
      cloneJson(reading);

    const electricityUsage =
      calculateElectricUsage(
        clonedReading.electricityPrevious,
        clonedReading.electricityCurrent
      );

    const waterUsage =
      calculateWaterUsage(
        clonedReading.waterPrevious,
        clonedReading.waterCurrent
      );

    return {
      ...clonedReading,
      period:
        clonedReading.period ??
        clonedReading.monthKey,
      electricityUsage,
      waterUsage
    };
  }

  /**
   * Gắn cảnh báo vào kết quả trả về.
   *
   * Cảnh báo không được ghi vào LocalStorage.
   *
   * @param {object} reading Bản ghi chỉ số.
   * @param {object[]} warnings Danh sách cảnh báo.
   * @returns {object}
   */
  _createResult(reading, warnings) {
    return {
      ...this._createReadingView(reading),
      warnings: cloneJson(warnings)
    };
  }

  /**
   * Kiểm tra hợp đồng có hiệu lực trong một tháng hay không.
   *
   * Hợp đồng đã kết thúc vẫn được xem là hợp lệ cho các tháng
   * nằm trong thời gian thuê trước khi kết thúc.
   *
   * @param {object} contract Hợp đồng.
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng.
   * @returns {boolean}
   */
  _isContractValidForMonth(
    contract,
    roomId,
    month
  ) {
    if (
      !isPlainObject(contract) ||
      contract.roomId !== roomId ||
      !CONTRACT_STATUSES_WITH_OCCUPANCY.includes(
        contract.status
      )
    ) {
      return false;
    }

    const { startDate, endDate } =
      getMonthDateRange(month);

    try {
      return isDateRangeOverlap(
        contract.startDate,
        contract.endDate,
        startDate,
        endDate
      );
    } catch (error) {
      throw new Error(
        `Dữ liệu thời hạn của hợp đồng "${contract.code ?? contract.id ?? 'không xác định'}" không hợp lệ.`,
        { cause: error }
      );
    }
  }

  /**
   * Kiểm tra phòng có hợp đồng hiệu lực trong tháng.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng.
   * @returns {object[]} Các hợp đồng phù hợp.
   */
  _getValidContractsForRoomAndMonth(
    roomId,
    month
  ) {
    const contracts =
      this.storageService.getAll(
        STORAGE_KEYS.CONTRACTS
      );

    return contracts.filter(
      (contract) =>
        this._isContractValidForMonth(
          contract,
          roomId,
          month
        )
    );
  }

  /**
   * Kiểm tra phòng tồn tại và có hợp đồng hiệu lực trong tháng.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng.
   * @returns {object} Thông tin phòng.
   */
  _assertRoomCanRecord(
    roomId,
    month
  ) {
    const room =
      this.storageService.getById(
        STORAGE_KEYS.ROOMS,
        roomId
      );

    if (!room) {
      throw new Error(
        `Không tìm thấy phòng có ID "${roomId}".`
      );
    }

    const validContracts =
      this._getValidContractsForRoomAndMonth(
        roomId,
        month
      );

    if (validContracts.length === 0) {
      throw new Error(
        `Phòng "${room.code ?? roomId}" không có hợp đồng hiệu lực trong tháng ${month}.`
      );
    }

    return room;
  }

  /**
   * Kiểm tra một phòng chưa có bản ghi trong tháng.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng.
   * @param {string|null} excludedReadingId ID được bỏ qua khi sửa.
   * @returns {true}
   */
  _assertUniqueRoomAndMonth(
    roomId,
    month,
    excludedReadingId = null
  ) {
    const duplicatedReading =
      this.storageService
        .getAll(
          STORAGE_KEYS.METER_READINGS
        )
        .find((reading) => {
          const readingMonth =
            reading?.period ??
            reading?.monthKey;

          return (
            reading?.id !==
              excludedReadingId &&
            reading?.roomId === roomId &&
            readingMonth === month
          );
        });

    if (duplicatedReading) {
      throw new Error(
        `Phòng đã có bản ghi chỉ số trong tháng ${month}.`
      );
    }

    return true;
  }

  /**
   * Tìm các hóa đơn liên quan đến bản ghi chỉ số.
   *
   * @param {object} reading Bản ghi chỉ số.
   * @returns {object[]}
   */
  _getRelatedInvoices(reading) {
    const invoices =
      this.storageService.getAll(
        STORAGE_KEYS.INVOICES
      );

    return invoices.filter((invoice) => {
      if (
        invoice?.meterReadingId ===
        reading.id
      ) {
        return true;
      }

      const referencedByItem =
        Array.isArray(invoice?.items) &&
        invoice.items.some(
          (item) =>
            item?.sourceType ===
              'meterReading' &&
            item?.sourceId === reading.id
        );

      if (referencedByItem) {
        return true;
      }

      /*
       * Hỗ trợ hóa đơn cũ chưa lưu meterReadingId nhưng có
       * roomId, period và các dòng tiền điện hoặc tiền nước.
       */
      return (
        invoice?.roomId ===
          reading.roomId &&
        invoice?.period ===
          (
            reading.period ??
            reading.monthKey
          ) &&
        Array.isArray(invoice?.items) &&
        invoice.items.some(
          (item) =>
            item?.type === 'electricity' ||
            item?.type === 'water'
        )
      );
    });
  }

  /**
   * Tự điền chỉ số cũ từ tháng trước.
   *
   * Nếu người dùng truyền chỉ số cũ khác chỉ số mới tháng trước,
   * service dùng giá trị tháng trước và trả về cảnh báo.
   *
   * @param {object} data Dữ liệu cần chuẩn hóa.
   * @param {object|null} previousReading Bản ghi tháng trước.
   * @returns {{data: object, warnings: object[]}}
   */
  _applyPreviousIndexes(
    data,
    previousReading
  ) {
    const preparedData =
      cloneJson(data);

    const warnings = [];

    if (!previousReading) {
      return {
        data: preparedData,
        warnings
      };
    }

    const expectedElectricity =
      normalizeIndexValue(
        previousReading.electricityCurrent,
        'Chỉ số điện mới tháng trước'
      );

    const expectedWater =
      normalizeIndexValue(
        previousReading.waterCurrent,
        'Chỉ số nước mới tháng trước'
      );

    if (
      preparedData.electricityPrevious !==
        undefined &&
      preparedData.electricityPrevious !==
        null &&
      preparedData.electricityPrevious !==
        ''
    ) {
      const receivedElectricity =
        normalizeIndexValue(
          preparedData.electricityPrevious,
          'Chỉ số điện cũ'
        );

      if (
        receivedElectricity !==
        expectedElectricity
      ) {
        warnings.push({
          code:
            METER_READING_WARNING_CODE
              .ELECTRICITY_PREVIOUS_MISMATCH,

          field:
            'electricityPrevious',

          message:
            `Chỉ số điện cũ đã nhập (${receivedElectricity}) khác chỉ số điện mới tháng trước (${expectedElectricity}). RoomMate đã tự sử dụng giá trị ${expectedElectricity}.`,

          receivedValue:
            receivedElectricity,

          expectedValue:
            expectedElectricity,

          previousReadingId:
            previousReading.id
        });
      }
    }

    if (
      preparedData.waterPrevious !==
        undefined &&
      preparedData.waterPrevious !== null &&
      preparedData.waterPrevious !== ''
    ) {
      const receivedWater =
        normalizeIndexValue(
          preparedData.waterPrevious,
          'Chỉ số nước cũ'
        );

      if (
        receivedWater !== expectedWater
      ) {
        warnings.push({
          code:
            METER_READING_WARNING_CODE
              .WATER_PREVIOUS_MISMATCH,

          field:
            'waterPrevious',

          message:
            `Chỉ số nước cũ đã nhập (${receivedWater}) khác chỉ số nước mới tháng trước (${expectedWater}). RoomMate đã tự sử dụng giá trị ${expectedWater}.`,

          receivedValue:
            receivedWater,

          expectedValue:
            expectedWater,

          previousReadingId:
            previousReading.id
        });
      }
    }

    preparedData.electricityPrevious =
      expectedElectricity;

    preparedData.waterPrevious =
      expectedWater;

    return {
      data: preparedData,
      warnings
    };
  }

  /**
   * Chuẩn bị bản ghi trước khi tạo hoặc sửa.
   *
   * @param {object} data Dữ liệu bản ghi.
   * @returns {{reading: object, warnings: object[]}}
   */
  _prepareReading(data) {
    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu chỉ số điện nước phải là một object.'
      );
    }

    const roomId = normalizeId(
      data.roomId,
      'ID phòng'
    );

    const period =
      normalizeMonthKey(
        data.period ??
        data.monthKey
      );

    const previousReading =
      this.getPreviousReading(
        roomId,
        period
      );

    const preparedResult =
      this._applyPreviousIndexes(
        {
          ...cloneJson(data),
          roomId,
          period
        },
        previousReading
      );

    const validatedReading =
      validateMeterReading(
        preparedResult.data
      );

    if (previousReading) {
      /*
       * Sau khi tự điền, kiểm tra lại tính liên tục giữa hai tháng.
       */
      validatePreviousIndex(
        validatedReading,
        previousReading
      );
    }

    return {
      reading: validatedReading,
      warnings:
        preparedResult.warnings
    };
  }

  /**
   * Lấy toàn bộ bản ghi chỉ số.
   *
   * @returns {object[]}
   */
  getReadings() {
    return this.storageService
      .getAll(
        STORAGE_KEYS.METER_READINGS
      )
      .map((reading) =>
        this._createReadingView(reading)
      );
  }

  /**
   * Lấy bản ghi chỉ số theo ID.
   *
   * @param {string} id ID bản ghi.
   * @returns {object|null}
   */
  getReadingById(id) {
    const reading =
      this.storageService.getById(
        STORAGE_KEYS.METER_READINGS,
        id
      );

    return reading
      ? this._createReadingView(reading)
      : null;
  }

  /**
   * Lấy bản ghi của một phòng trong một tháng.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng YYYY-MM.
   * @returns {object|null}
   */
  getReadingByRoomAndMonth(
    roomId,
    month
  ) {
    const normalizedRoomId =
      normalizeId(roomId, 'ID phòng');

    const normalizedMonth =
      normalizeMonthKey(month);

    const reading =
      this.storageService
        .getAll(
          STORAGE_KEYS.METER_READINGS
        )
        .find((item) => {
          const itemMonth =
            item?.period ??
            item?.monthKey;

          return (
            item?.roomId ===
              normalizedRoomId &&
            itemMonth ===
              normalizedMonth
          );
        });

    return reading
      ? this._createReadingView(reading)
      : null;
  }

  /**
   * Tạo bản ghi chỉ số.
   *
   * Kết quả có thêm thuộc tính warnings nhưng warnings không
   * được lưu trong LocalStorage.
   *
   * @param {object} data Dữ liệu chỉ số.
   * @returns {object} Bản ghi đã tạo kèm warnings.
   */
  createReading(data) {
    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu chỉ số điện nước phải là một object.'
      );
    }

    const roomId = normalizeId(
      data.roomId,
      'ID phòng'
    );

    const period =
      normalizeMonthKey(
        data.period ??
        data.monthKey
      );

    this._assertRoomCanRecord(
      roomId,
      period
    );

    this._assertUniqueRoomAndMonth(
      roomId,
      period
    );

    const prepared =
      this._prepareReading({
        ...cloneJson(data),
        roomId,
        period
      });

    const readingToCreate =
      createStorageChanges(
        prepared.reading
      );

    const created =
      this.storageService.create(
        STORAGE_KEYS.METER_READINGS,
        readingToCreate
      );

    return this._createResult(
      created,
      prepared.warnings
    );
  }

  /**
   * Cập nhật bản ghi chỉ số.
   *
   * Nếu hóa đơn liên quan đã tồn tại, kết quả trả về cảnh báo
   * chứa danh sách ID hóa đơn. Hóa đơn cũ không bị chỉnh sửa.
   *
   * @param {string} id ID bản ghi.
   * @param {object} data Dữ liệu cập nhật.
   * @returns {object} Bản ghi sau cập nhật kèm warnings.
   */
  updateReading(id, data) {
    const normalizedId =
      normalizeId(
        id,
        'ID bản ghi chỉ số'
      );

    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu cập nhật chỉ số phải là một object.'
      );
    }

    const currentReading =
      this.storageService.getById(
        STORAGE_KEYS.METER_READINGS,
        normalizedId
      );

    if (!currentReading) {
      throw new Error(
        `Không tìm thấy bản ghi chỉ số có ID "${normalizedId}".`
      );
    }

    if (
      data.id !== undefined &&
      data.id !== normalizedId
    ) {
      throw new Error(
        'Không được thay đổi ID bản ghi chỉ số.'
      );
    }

    const mergedReading = {
      ...cloneJson(currentReading),
      ...cloneJson(data),
      id: currentReading.id
    };

    const roomId = normalizeId(
      mergedReading.roomId,
      'ID phòng'
    );

    const period =
      normalizeMonthKey(
        mergedReading.period ??
        mergedReading.monthKey
      );

    this._assertRoomCanRecord(
      roomId,
      period
    );

    this._assertUniqueRoomAndMonth(
      roomId,
      period,
      currentReading.id
    );

    const relatedInvoices =
      this._getRelatedInvoices(
        currentReading
      );

    if (
      relatedInvoices.length > 0 &&
      (
        roomId !==
          currentReading.roomId ||
        period !==
          (
            currentReading.period ??
            currentReading.monthKey
          )
      )
    ) {
      throw new Error(
        'Không được thay đổi phòng hoặc tháng của bản ghi đã được sử dụng trong hóa đơn.'
      );
    }

    const prepared =
      this._prepareReading({
        ...mergedReading,
        roomId,
        period
      });

    const warnings = [
      ...prepared.warnings
    ];

    if (relatedInvoices.length > 0) {
      const invoiceIds =
        relatedInvoices.map(
          (invoice) => invoice.id
        );

      warnings.push({
        code:
          METER_READING_WARNING_CODE
            .RELATED_INVOICE_EXISTS,

        message:
          `Bản ghi chỉ số đã được sử dụng trong ${invoiceIds.length} hóa đơn. Việc sửa chỉ số không tự động thay đổi các hóa đơn cũ.`,

        invoiceIds
      });
    }

    const changes =
      createStorageChanges(
        prepared.reading
      );

    changes.lockedByInvoiceId =
      currentReading.lockedByInvoiceId ??
      relatedInvoices[0]?.id ??
      null;

    const updated =
      this.storageService.update(
        STORAGE_KEYS.METER_READINGS,
        currentReading.id,
        changes
      );

    return this._createResult(
      updated,
      warnings
    );
  }

  /**
   * Xóa bản ghi chỉ số.
   *
   * Không cho phép xóa bản ghi đã được dùng trong hóa đơn
   * để tránh làm mất liên kết dữ liệu.
   *
   * @param {string} id ID bản ghi.
   * @returns {object} Bản ghi đã xóa.
   */
  deleteReading(id) {
    const normalizedId =
      normalizeId(
        id,
        'ID bản ghi chỉ số'
      );

    const reading =
      this.storageService.getById(
        STORAGE_KEYS.METER_READINGS,
        normalizedId
      );

    if (!reading) {
      throw new Error(
        `Không tìm thấy bản ghi chỉ số có ID "${normalizedId}".`
      );
    }

    const relatedInvoices =
      this._getRelatedInvoices(reading);

    if (relatedInvoices.length > 0) {
      throw new Error(
        'Không thể xóa bản ghi chỉ số đã được sử dụng trong hóa đơn.'
      );
    }

    const removed =
      this.storageService.remove(
        STORAGE_KEYS.METER_READINGS,
        normalizedId
      );

    if (!removed) {
      throw new Error(
        `Không thể xóa bản ghi chỉ số có ID "${normalizedId}".`
      );
    }

    return this._createReadingView(
      removed
    );
  }

  /**
   * Lấy bản ghi tháng liền trước.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Tháng hiện tại.
   * @returns {object|null}
   */
  getPreviousReading(
    roomId,
    month
  ) {
    const normalizedRoomId =
      normalizeId(roomId, 'ID phòng');

    const normalizedMonth =
      normalizeMonthKey(month);

    const previousMonth =
      getPreviousMonthKey(
        normalizedMonth
      );

    return this.getReadingByRoomAndMonth(
      normalizedRoomId,
      previousMonth
    );
  }

  /**
   * Lấy các phòng có hợp đồng hiệu lực nhưng chưa ghi chỉ số
   * trong tháng được chọn.
   *
   * @param {string} month Khóa tháng YYYY-MM.
   * @returns {object[]}
   */
  getRoomsWithoutReading(month) {
    const normalizedMonth =
      normalizeMonthKey(month);

    const rooms =
      this.storageService.getAll(
        STORAGE_KEYS.ROOMS
      );

    const contracts =
      this.storageService.getAll(
        STORAGE_KEYS.CONTRACTS
      );

    const readings =
      this.storageService.getAll(
        STORAGE_KEYS.METER_READINGS
      );

    const eligibleRoomIds = new Set(
      contracts
        .filter((contract) =>
          this._isContractValidForMonth(
            contract,
            contract.roomId,
            normalizedMonth
          )
        )
        .map(
          (contract) =>
            contract.roomId
        )
    );

    const roomsWithReading = new Set(
      readings
        .filter(
          (reading) =>
            (
              reading.period ??
              reading.monthKey
            ) === normalizedMonth
        )
        .map(
          (reading) =>
            reading.roomId
        )
    );

    return rooms
      .filter(
        (room) =>
          eligibleRoomIds.has(room.id) &&
          !roomsWithReading.has(room.id)
      )
      .sort(
        (firstRoom, secondRoom) =>
          String(firstRoom.code)
            .localeCompare(
              String(secondRoom.code),
              'vi'
            )
      )
      .map(cloneJson);
  }

  /**
   * Lọc danh sách chỉ số.
   *
   * Các bộ lọc được hỗ trợ:
   * - roomId
   * - month hoặc period
   * - fromMonth
   * - toMonth
   * - hasInvoice
   *
   * @param {object} [filters={}] Bộ lọc.
   * @returns {object[]}
   */
  filterReadings(filters = {}) {
    if (!isPlainObject(filters)) {
      throw new TypeError(
        'Bộ lọc chỉ số phải là một object.'
      );
    }

    const roomId =
      filters.roomId === undefined ||
      filters.roomId === ''
        ? null
        : normalizeId(
            filters.roomId,
            'ID phòng'
          );

    const monthValue =
      filters.month ??
      filters.period;

    const month =
      monthValue === undefined ||
      monthValue === ''
        ? null
        : normalizeMonthKey(
            monthValue
          );

    const fromMonth =
      filters.fromMonth === undefined ||
      filters.fromMonth === ''
        ? null
        : normalizeMonthKey(
            filters.fromMonth
          );

    const toMonth =
      filters.toMonth === undefined ||
      filters.toMonth === ''
        ? null
        : normalizeMonthKey(
            filters.toMonth
          );

    if (
      fromMonth &&
      toMonth &&
      fromMonth > toMonth
    ) {
      throw new Error(
        'Tháng bắt đầu không được sau tháng kết thúc.'
      );
    }

    if (
      filters.hasInvoice !== undefined &&
      typeof filters.hasInvoice !==
        'boolean'
    ) {
      throw new TypeError(
        'hasInvoice phải là boolean.'
      );
    }

    return this.getReadings().filter(
      (reading) => {
        if (
          roomId &&
          reading.roomId !== roomId
        ) {
          return false;
        }

        if (
          month &&
          reading.period !== month
        ) {
          return false;
        }

        if (
          fromMonth &&
          reading.period < fromMonth
        ) {
          return false;
        }

        if (
          toMonth &&
          reading.period > toMonth
        ) {
          return false;
        }

        if (
          filters.hasInvoice !==
          undefined
        ) {
          const hasInvoice =
            this._getRelatedInvoices(
              reading
            ).length > 0;

          if (
            hasInvoice !==
            filters.hasInvoice
          ) {
            return false;
          }
        }

        return true;
      }
    );
  }
}

/**
 * Instance MeterReadingService dùng chung.
 */
export const meterReadingService =
  new MeterReadingService();

export default meterReadingService;