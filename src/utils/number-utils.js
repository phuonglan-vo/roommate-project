const PLAIN_NUMBER_PATTERN =
  /^[+-]?(?:\d+|\d+\.\d+|\d+,\d+)$/;

/**
 * Kiểm tra giá trị có phải số hữu hạn hay không.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @returns {boolean} `true` nếu là number hữu hạn.
 */
export function isFiniteNumber(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  );
}

/**
 * Chuyển giá trị nhập thành number một cách an toàn.
 *
 * Hàm chấp nhận:
 * - number hữu hạn;
 * - chuỗi số nguyên;
 * - chuỗi số thập phân dùng dấu chấm hoặc dấu phẩy.
 *
 * Hàm không chấp nhận:
 * - chuỗi tiền đã định dạng như "1.800.000 ₫";
 * - chuỗi rỗng;
 * - NaN;
 * - Infinity;
 * - boolean;
 * - object.
 *
 * @param {number|string} value Giá trị cần chuyển đổi.
 * @returns {number} Giá trị number hữu hạn.
 * @throws {TypeError|RangeError} Khi dữ liệu không hợp lệ.
 *
 * @example
 * toSafeNumber('1800000');
 * // 1800000
 *
 * @example
 * toSafeNumber('12,5');
 * // 12.5
 */
export function toSafeNumber(value) {
  if (isFiniteNumber(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    throw new TypeError(
      'Giá trị phải là number hoặc chuỗi số hợp lệ.'
    );
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new TypeError('Giá trị số không được để trống.');
  }

  if (!PLAIN_NUMBER_PATTERN.test(normalizedValue)) {
    throw new TypeError(
      `Giá trị "${normalizedValue}" không phải chuỗi số hợp lệ.`
    );
  }

  const decimalNormalizedValue = normalizedValue.replace(
    ',',
    '.'
  );

  const parsedValue = Number(decimalNormalizedValue);

  if (!Number.isFinite(parsedValue)) {
    throw new RangeError(
      'Giá trị số phải là một số hữu hạn.'
    );
  }

  return parsedValue;
}

/**
 * Kiểm tra một giá trị có phải số hữu hạn không âm hay không.
 *
 * Hàm chỉ chấp nhận kiểu number, không tự chuyển chuỗi thành số.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @returns {boolean} `true` nếu giá trị là number và lớn hơn hoặc bằng 0.
 */
export function isNonNegativeNumber(value) {
  return isFiniteNumber(value) && value >= 0;
}