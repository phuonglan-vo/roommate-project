import { isValidIsoDate } from './date-utils.js';
import { isNonNegativeNumber } from './number-utils.js';

const VIETNAMESE_MOBILE_PHONE_PATTERN =
  /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/;

/**
 * Kiểm tra giá trị có phải chuỗi rỗng hoặc chỉ chứa khoảng trắng hay không.
 *
 * Giá trị không phải chuỗi cũng được xem là không đáp ứng
 * yêu cầu của một trường chuỗi bắt buộc.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @returns {boolean} `true` nếu không phải chuỗi hoặc chuỗi bị rỗng.
 *
 * @example
 * isEmptyString('   ');
 * // true
 */
export function isEmptyString(value) {
  return (
    typeof value !== 'string' ||
    value.trim().length === 0
  );
}

/**
 * Kiểm tra số điện thoại di động Việt Nam ở mức cơ bản.
 *
 * Chấp nhận:
 * - đầu số trong nước bắt đầu bằng 0;
 * - mã quốc gia +84;
 * - các dấu cách, dấu chấm, dấu gạch ngang và ngoặc được bỏ qua.
 *
 * Ví dụ hợp lệ:
 * - 0901234567
 * - +84901234567
 * - 090 123 4567
 *
 * @param {*} value Số điện thoại cần kiểm tra.
 * @returns {boolean} `true` nếu đúng định dạng cơ bản.
 */
export function isValidVietnamesePhone(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalizedPhone = value
    .trim()
    .replace(/[\s().-]/g, '');

  return VIETNAMESE_MOBILE_PHONE_PATTERN.test(
    normalizedPhone
  );
}

/**
 * Kiểm tra giá trị có phải số hữu hạn không âm hay không.
 *
 * Hàm không tự chuyển chuỗi thành number.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @returns {boolean} `true` nếu là số không âm.
 */
export function isValidNonNegativeNumber(value) {
  return isNonNegativeNumber(value);
}

/**
 * Kiểm tra chuỗi ngày YYYY-MM-DD có phải ngày hợp lệ hay không.
 *
 * @param {*} value Giá trị ngày cần kiểm tra.
 * @returns {boolean} `true` nếu đúng định dạng và ngày thực sự tồn tại.
 *
 * @example
 * isValidDate('2026-02-28');
 * // true
 *
 * @example
 * isValidDate('2026-02-30');
 * // false
 */
export function isValidDate(value) {
  return isValidIsoDate(value);
}