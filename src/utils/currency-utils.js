import { toSafeNumber } from './number-utils.js';

const vietnameseCurrencyFormatter = new Intl.NumberFormat(
  'vi-VN',
  {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }
);

/**
 * Định dạng một giá trị số thành tiền Việt Nam.
 *
 * Hàm chỉ phục vụ hiển thị. Dữ liệu lưu trữ vẫn phải là number.
 *
 * @param {number|string} value Giá trị tiền cần định dạng.
 * @returns {string} Chuỗi tiền theo định dạng Việt Nam.
 * @throws {TypeError|RangeError} Khi giá trị không thể chuyển thành số hữu hạn.
 *
 * @example
 * formatVietnameseCurrency(1800000);
 * // "1.800.000 ₫"
 */
export function formatVietnameseCurrency(value) {
  const numericValue = toSafeNumber(value);

  return vietnameseCurrencyFormatter.format(numericValue);
}