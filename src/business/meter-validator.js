import {
  isValidIsoDate
} from '../utils/date-utils.js';

import {
  toSafeNumber
} from '../utils/number-utils.js';

import {
  calculateElectricUsage,
  calculateWaterUsage,
  getPreviousMonthKey
} from './meter-calculator.js';

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
 * Chuẩn hóa chuỗi bắt buộc.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeRequiredString(
  value,
  fieldName
) {
  if (typeof value !== 'string') {
    throw new TypeError(
      `${fieldName} phải là một chuỗi.`
    );
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} không được để trống.`
    );
  }

  return normalizedValue;
}

/**
 * Chuẩn hóa một chỉ số điện hoặc nước.
 *
 * @param {*} value Giá trị chỉ số.
 * @param {string} fieldName Tên trường.
 * @returns {number}
 */
function normalizeMeterIndex(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    throw new Error(
      `${fieldName} không được để trống.`
    );
  }

  let numericValue;

  try {
    numericValue = toSafeNumber(value);
  } catch (error) {
    throw new TypeError(
      `${fieldName} phải là một số hợp lệ.`,
      { cause: error }
    );
  }

  if (
    Number.isNaN(numericValue) ||
    !Number.isFinite(numericValue)
  ) {
    throw new TypeError(
      `${fieldName} phải là một số hữu hạn.`
    );
  }

  if (numericValue < 0) {
    throw new Error(
      `${fieldName} không được là số âm.`
    );
  }

  return numericValue;
}

/**
 * Kiểm tra khóa tháng dạng YYYY-MM.
 *
 * @param {*} monthKey Khóa tháng.
 * @returns {string}
 */
function normalizeMonthKey(monthKey) {
  const normalizedMonthKey =
    normalizeRequiredString(
      monthKey,
      'Tháng ghi chỉ số'
    );

  /*
   * getPreviousMonthKey đồng thời kiểm tra định dạng,
   * tháng và năm của monthKey.
   */
  getPreviousMonthKey(
    normalizedMonthKey
  );

  return normalizedMonthKey;
}

/**
 * Kiểm tra và chuẩn hóa một bản ghi chỉ số điện nước.
 *
 * Cấu trúc hỗ trợ:
 * - roomId
 * - period hoặc monthKey
 * - readingDate
 * - electricityPrevious
 * - electricityCurrent
 * - waterPrevious
 * - waterCurrent
 *
 * Hàm không làm thay đổi object đầu vào.
 *
 * @param {object} reading Bản ghi chỉ số.
 * @returns {object} Bản sao đã chuẩn hóa, có thêm lượng tiêu thụ.
 * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
 */
export function validateMeterReading(
  reading
) {
  if (!isPlainObject(reading)) {
    throw new TypeError(
      'Bản ghi chỉ số điện nước phải là một object.'
    );
  }

  const roomId =
    normalizeRequiredString(
      reading.roomId,
      'ID phòng'
    );

  const period =
    normalizeMonthKey(
      reading.period ??
      reading.monthKey
    );

  if (
    reading.readingDate !== undefined &&
    reading.readingDate !== null &&
    reading.readingDate !== '' &&
    (
      typeof reading.readingDate !==
        'string' ||
      !isValidIsoDate(
        reading.readingDate.trim()
      )
    )
  ) {
    throw new Error(
      'Ngày ghi chỉ số phải là ngày hợp lệ theo định dạng YYYY-MM-DD.'
    );
  }

  const electricityPrevious =
    normalizeMeterIndex(
      reading.electricityPrevious,
      'Chỉ số điện cũ'
    );

  const electricityCurrent =
    normalizeMeterIndex(
      reading.electricityCurrent,
      'Chỉ số điện mới'
    );

  const waterPrevious =
    normalizeMeterIndex(
      reading.waterPrevious,
      'Chỉ số nước cũ'
    );

  const waterCurrent =
    normalizeMeterIndex(
      reading.waterCurrent,
      'Chỉ số nước mới'
    );

  const electricityUsage =
    calculateElectricUsage(
      electricityPrevious,
      electricityCurrent
    );

  const waterUsage =
    calculateWaterUsage(
      waterPrevious,
      waterCurrent
    );

  const normalizedReading = {
    ...reading,
    roomId,
    period,
    electricityPrevious,
    electricityCurrent,
    waterPrevious,
    waterCurrent,
    electricityUsage,
    waterUsage
  };

  delete normalizedReading.monthKey;

  if (
    reading.readingDate !== undefined &&
    reading.readingDate !== null &&
    reading.readingDate !== ''
  ) {
    normalizedReading.readingDate =
      reading.readingDate.trim();
  }

  if (reading.id !== undefined) {
    normalizedReading.id =
      normalizeRequiredString(
        reading.id,
        'ID bản ghi chỉ số'
      );
  }

  return normalizedReading;
}

/**
 * Kiểm tra chỉ số đầu kỳ của tháng hiện tại có khớp với
 * chỉ số cuối kỳ của tháng trước hay không.
 *
 * Quy tắc:
 * - electricityPrevious của kỳ hiện tại phải bằng
 *   electricityCurrent của kỳ trước.
 * - waterPrevious của kỳ hiện tại phải bằng
 *   waterCurrent của kỳ trước.
 * - Nếu cả hai bản ghi có period, kỳ trước phải là tháng
 *   liền trước kỳ hiện tại.
 * - Nếu previousReading là null hoặc undefined, hàm trả true
 *   vì đây có thể là bản ghi đầu tiên của phòng.
 *
 * @param {object} currentReading Bản ghi kỳ hiện tại.
 * @param {object|null|undefined} previousReading Bản ghi kỳ trước.
 * @returns {true}
 * @throws {TypeError|Error} Khi chỉ số không khớp.
 */
export function validatePreviousIndex(
  currentReading,
  previousReading
) {
  if (!isPlainObject(currentReading)) {
    throw new TypeError(
      'Bản ghi chỉ số hiện tại phải là một object.'
    );
  }

  if (
    previousReading === null ||
    previousReading === undefined
  ) {
    return true;
  }

  if (!isPlainObject(previousReading)) {
    throw new TypeError(
      'Bản ghi chỉ số kỳ trước phải là một object.'
    );
  }

  if (
    currentReading.roomId !== undefined &&
    previousReading.roomId !== undefined
  ) {
    const currentRoomId =
      normalizeRequiredString(
        currentReading.roomId,
        'ID phòng hiện tại'
      );

    const previousRoomId =
      normalizeRequiredString(
        previousReading.roomId,
        'ID phòng kỳ trước'
      );

    if (currentRoomId !== previousRoomId) {
      throw new Error(
        'Bản ghi hiện tại và bản ghi kỳ trước phải thuộc cùng một phòng.'
      );
    }
  }

  const currentPeriod =
    currentReading.period ??
    currentReading.monthKey;

  const previousPeriod =
    previousReading.period ??
    previousReading.monthKey;

  if (
    currentPeriod !== undefined &&
    previousPeriod !== undefined
  ) {
    const normalizedCurrentPeriod =
      normalizeMonthKey(
        currentPeriod
      );

    const normalizedPreviousPeriod =
      normalizeMonthKey(
        previousPeriod
      );

    const expectedPreviousPeriod =
      getPreviousMonthKey(
        normalizedCurrentPeriod
      );

    if (
      normalizedPreviousPeriod !==
      expectedPreviousPeriod
    ) {
      throw new Error(
        `Kỳ trước phải là tháng ${expectedPreviousPeriod}.`
      );
    }
  }

  const currentElectricityPrevious =
    normalizeMeterIndex(
      currentReading.electricityPrevious,
      'Chỉ số điện cũ của kỳ hiện tại'
    );

  const previousElectricityCurrent =
    normalizeMeterIndex(
      previousReading.electricityCurrent,
      'Chỉ số điện mới của kỳ trước'
    );

  if (
    currentElectricityPrevious !==
    previousElectricityCurrent
  ) {
    throw new Error(
      `Chỉ số điện cũ của kỳ hiện tại (${currentElectricityPrevious}) phải bằng chỉ số điện mới của kỳ trước (${previousElectricityCurrent}).`
    );
  }

  const currentWaterPrevious =
    normalizeMeterIndex(
      currentReading.waterPrevious,
      'Chỉ số nước cũ của kỳ hiện tại'
    );

  const previousWaterCurrent =
    normalizeMeterIndex(
      previousReading.waterCurrent,
      'Chỉ số nước mới của kỳ trước'
    );

  if (
    currentWaterPrevious !==
    previousWaterCurrent
  ) {
    throw new Error(
      `Chỉ số nước cũ của kỳ hiện tại (${currentWaterPrevious}) phải bằng chỉ số nước mới của kỳ trước (${previousWaterCurrent}).`
    );
  }

  return true;
}