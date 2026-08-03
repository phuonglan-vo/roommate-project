import {
  toSafeNumber
} from '../utils/number-utils.js';

/**
 * Chuẩn hóa giá trị số và kiểm tra không âm.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường dùng trong thông báo lỗi.
 * @returns {number}
 * @throws {TypeError|Error} Khi giá trị không phải số hợp lệ hoặc là số âm.
 */
function normalizeNonNegativeNumber(
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
 * Chuẩn hóa nhãn chỉ số.
 *
 * @param {*} label Nhãn cần chuẩn hóa.
 * @returns {string}
 */
function normalizeLabel(label) {
  if (
    label === undefined ||
    label === null
  ) {
    return 'Chỉ số';
  }

  if (typeof label !== 'string') {
    throw new TypeError(
      'Nhãn chỉ số phải là một chuỗi.'
    );
  }

  const normalizedLabel = label.trim();

  return normalizedLabel || 'Chỉ số';
}

/**
 * Tính lượng sử dụng từ chỉ số cũ và chỉ số mới.
 *
 * @param {number|string} oldIndex Chỉ số cũ.
 * @param {number|string} newIndex Chỉ số mới.
 * @param {string} [label='Chỉ số'] Nhãn dùng trong thông báo lỗi.
 * @returns {number} Lượng sử dụng.
 * @throws {TypeError|Error} Khi chỉ số không hợp lệ.
 */
export function calculateUsage(
  oldIndex,
  newIndex,
  label = 'Chỉ số'
) {
  const normalizedLabel =
    normalizeLabel(label);

  const normalizedOldIndex =
    normalizeNonNegativeNumber(
      oldIndex,
      `${normalizedLabel} cũ`
    );

  const normalizedNewIndex =
    normalizeNonNegativeNumber(
      newIndex,
      `${normalizedLabel} mới`
    );

  if (
    normalizedNewIndex <
    normalizedOldIndex
  ) {
    throw new Error(
      `${normalizedLabel} mới không được nhỏ hơn ${normalizedLabel.toLocaleLowerCase('vi-VN')} cũ.`
    );
  }

  const usage =
    normalizedNewIndex -
    normalizedOldIndex;

  if (
    Number.isNaN(usage) ||
    !Number.isFinite(usage)
  ) {
    throw new Error(
      `Không thể tính lượng sử dụng của ${normalizedLabel.toLocaleLowerCase('vi-VN')}.`
    );
  }

  return usage;
}

/**
 * Tính lượng điện đã sử dụng.
 *
 * @param {number|string} oldIndex Chỉ số điện cũ.
 * @param {number|string} newIndex Chỉ số điện mới.
 * @returns {number} Số điện tiêu thụ.
 */
export function calculateElectricUsage(
  oldIndex,
  newIndex
) {
  return calculateUsage(
    oldIndex,
    newIndex,
    'Chỉ số điện'
  );
}

/**
 * Tính lượng nước đã sử dụng.
 *
 * @param {number|string} oldIndex Chỉ số nước cũ.
 * @param {number|string} newIndex Chỉ số nước mới.
 * @returns {number} Số nước tiêu thụ.
 */
export function calculateWaterUsage(
  oldIndex,
  newIndex
) {
  return calculateUsage(
    oldIndex,
    newIndex,
    'Chỉ số nước'
  );
}

/**
 * Phát hiện lượng sử dụng tăng bất thường.
 *
 * Lượng sử dụng được xem là bất thường khi:
 * - Lớn hơn lượng sử dụng kỳ trước.
 * - Tỷ lệ tăng lớn hơn hoặc bằng thresholdPercent.
 *
 * Khi kỳ trước có lượng sử dụng bằng 0:
 * - Kỳ hiện tại bằng 0: không bất thường.
 * - Kỳ hiện tại lớn hơn 0: bất thường.
 *
 * @param {number|string} currentUsage Lượng sử dụng kỳ hiện tại.
 * @param {number|string} previousUsage Lượng sử dụng kỳ trước.
 * @param {number|string} thresholdPercent Ngưỡng tăng theo phần trăm.
 * @returns {boolean}
 */
export function detectAbnormalUsage(
  currentUsage,
  previousUsage,
  thresholdPercent
) {
  const normalizedCurrentUsage =
    normalizeNonNegativeNumber(
      currentUsage,
      'Lượng sử dụng hiện tại'
    );

  const normalizedPreviousUsage =
    normalizeNonNegativeNumber(
      previousUsage,
      'Lượng sử dụng kỳ trước'
    );

  const normalizedThreshold =
    normalizeNonNegativeNumber(
      thresholdPercent,
      'Ngưỡng cảnh báo'
    );

  if (normalizedPreviousUsage === 0) {
    return normalizedCurrentUsage > 0;
  }

  if (
    normalizedCurrentUsage <=
    normalizedPreviousUsage
  ) {
    return false;
  }

  const increasePercent =
    (
      (
        normalizedCurrentUsage -
        normalizedPreviousUsage
      ) /
      normalizedPreviousUsage
    ) * 100;

  if (
    Number.isNaN(increasePercent) ||
    !Number.isFinite(increasePercent)
  ) {
    throw new Error(
      'Không thể tính tỷ lệ tăng lượng sử dụng.'
    );
  }

  return (
    increasePercent >=
    normalizedThreshold
  );
}

/**
 * Lấy khóa tháng liền trước.
 *
 * @param {string} monthKey Khóa tháng dạng YYYY-MM.
 * @returns {string} Khóa tháng trước dạng YYYY-MM.
 * @throws {TypeError|Error} Khi khóa tháng không hợp lệ.
 *
 * @example
 * getPreviousMonthKey('2026-01');
 * // '2025-12'
 */
export function getPreviousMonthKey(
  monthKey
) {
  if (typeof monthKey !== 'string') {
    throw new TypeError(
      'Khóa tháng phải là một chuỗi YYYY-MM.'
    );
  }

  const normalizedMonthKey =
    monthKey.trim();

  const match =
    /^(\d{4})-(\d{2})$/.exec(
      normalizedMonthKey
    );

  if (!match) {
    throw new Error(
      'Khóa tháng phải đúng định dạng YYYY-MM.'
    );
  }

  let year = Number(match[1]);
  let month = Number(match[2]);

  if (
    !Number.isInteger(year) ||
    year < 1
  ) {
    throw new Error(
      'Năm trong khóa tháng không hợp lệ.'
    );
  }

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      'Tháng phải nằm trong khoảng từ 01 đến 12.'
    );
  }

  month -= 1;

  if (month === 0) {
    month = 12;
    year -= 1;
  }

  if (year < 1) {
    throw new Error(
      'Không thể xác định tháng trước của khóa tháng đã cho.'
    );
  }

  return (
    `${String(year).padStart(4, '0')}-` +
    `${String(month).padStart(2, '0')}`
  );
}