import {
  CONTRACT_STATUS
} from '../constants/statuses.js';

import {
  compareIsoDates,
  differenceInDays,
  isValidIsoDate
} from '../utils/date-utils.js';

const CONTRACT_STATUS_VALUES = Object.freeze(
  Object.values(CONTRACT_STATUS)
);

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
 * Kiểm tra một ngày có đúng định dạng YYYY-MM-DD hay không.
 *
 * @param {*} value Giá trị ngày.
 * @param {string} fieldName Tên trường dùng trong thông báo lỗi.
 * @returns {string} Ngày hợp lệ.
 * @throws {TypeError|Error} Khi ngày không hợp lệ.
 */
function assertValidDate(value, fieldName) {
  if (typeof value !== 'string') {
    throw new TypeError(
      `${fieldName} phải là chuỗi ngày YYYY-MM-DD.`
    );
  }

  const normalizedValue = value.trim();

  if (!isValidIsoDate(normalizedValue)) {
    throw new Error(
      `${fieldName} không phải ngày hợp lệ theo định dạng YYYY-MM-DD.`
    );
  }

  return normalizedValue;
}

/**
 * Kiểm tra khoảng ngày hợp đồng.
 *
 * Ngày kết thúc phải sau ngày bắt đầu, không được bằng nhau.
 *
 * @param {string} startDate Ngày bắt đầu.
 * @param {string} endDate Ngày kết thúc.
 * @returns {{startDate: string, endDate: string}}
 * @throws {Error} Khi khoảng ngày không hợp lệ.
 */
function validateDateRange(startDate, endDate) {
  const normalizedStartDate = assertValidDate(
    startDate,
    'Ngày bắt đầu'
  );

  const normalizedEndDate = assertValidDate(
    endDate,
    'Ngày kết thúc'
  );

  if (
    compareIsoDates(
      normalizedEndDate,
      normalizedStartDate
    ) <= 0
  ) {
    throw new Error(
      '[CONTRACT-05] Ngày kết thúc phải sau ngày bắt đầu.'
    );
  }

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate
  };
}

/**
 * Kiểm tra hai khoảng ngày có giao nhau hay không.
 *
 * Ngày bắt đầu và ngày kết thúc được xem là có hiệu lực trong cả ngày.
 * Vì vậy, hợp đồng mới bắt đầu đúng ngày hợp đồng cũ kết thúc
 * vẫn được xem là trùng thời gian.
 *
 * @param {string} startA Ngày bắt đầu khoảng A.
 * @param {string} endA Ngày kết thúc khoảng A.
 * @param {string} startB Ngày bắt đầu khoảng B.
 * @param {string} endB Ngày kết thúc khoảng B.
 * @returns {boolean} `true` nếu hai khoảng ngày giao nhau.
 * @throws {Error} Khi một khoảng ngày không hợp lệ.
 *
 * @example
 * isDateRangeOverlap(
 *   '2026-01-01',
 *   '2026-01-31',
 *   '2026-01-31',
 *   '2026-02-28'
 * );
 * // true
 */
export function isDateRangeOverlap(
  startA,
  endA,
  startB,
  endB
) {
  const rangeA = validateDateRange(startA, endA);
  const rangeB = validateDateRange(startB, endB);

  return (
    compareIsoDates(
      rangeA.startDate,
      rangeB.endDate
    ) <= 0 &&
    compareIsoDates(
      rangeB.startDate,
      rangeA.endDate
    ) <= 0
  );
}

/**
 * Xác định trạng thái hợp đồng tại một ngày cụ thể.
 *
 * Quy tắc:
 * - Hợp đồng đã hủy luôn giữ trạng thái đã hủy.
 * - Hợp đồng đã kết thúc thủ công luôn giữ trạng thái đã kết thúc.
 * - Hợp đồng nháp luôn giữ trạng thái nháp.
 * - Trước ngày bắt đầu: nháp.
 * - Trong khoảng hiệu lực: đang hiệu lực.
 * - Sau ngày kết thúc: đã kết thúc.
 *
 * @param {object} contract Hợp đồng cần xác định trạng thái.
 * @param {string} currentDate Ngày hiện tại dạng YYYY-MM-DD.
 * @returns {string} Một giá trị trong CONTRACT_STATUS.
 * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
 */
export function determineContractStatus(
  contract,
  currentDate
) {
  if (!isPlainObject(contract)) {
    throw new TypeError(
      'Hợp đồng phải là một object.'
    );
  }

  const normalizedCurrentDate = assertValidDate(
    currentDate,
    'Ngày hiện tại'
  );

  const { startDate, endDate } =
    validateDateRange(
      contract.startDate,
      contract.endDate
    );

  if (
    contract.status !== undefined &&
    !CONTRACT_STATUS_VALUES.includes(
      contract.status
    )
  ) {
    throw new Error(
      'Trạng thái hợp đồng không hợp lệ.'
    );
  }

  if (
    contract.status ===
    CONTRACT_STATUS.CANCELLED
  ) {
    return CONTRACT_STATUS.CANCELLED;
  }

  if (
    contract.status ===
    CONTRACT_STATUS.ENDED
  ) {
    return CONTRACT_STATUS.ENDED;
  }

  if (
    contract.status ===
    CONTRACT_STATUS.DRAFT
  ) {
    return CONTRACT_STATUS.DRAFT;
  }

  if (
    compareIsoDates(
      normalizedCurrentDate,
      startDate
    ) < 0
  ) {
    return CONTRACT_STATUS.DRAFT;
  }

  if (
    compareIsoDates(
      normalizedCurrentDate,
      endDate
    ) > 0
  ) {
    return CONTRACT_STATUS.ENDED;
  }

  return CONTRACT_STATUS.ACTIVE;
}

/**
 * Kiểm tra hợp đồng có đang hiệu lực tại ngày cụ thể hay không.
 *
 * @param {object} contract Hợp đồng cần kiểm tra.
 * @param {string} currentDate Ngày hiện tại dạng YYYY-MM-DD.
 * @returns {boolean}
 */
export function isContractActive(
  contract,
  currentDate
) {
  return (
    determineContractStatus(
      contract,
      currentDate
    ) === CONTRACT_STATUS.ACTIVE
  );
}

/**
 * Kiểm tra hợp đồng có sắp hết hạn hay không.
 *
 * Hợp đồng được xem là sắp hết hạn khi:
 * - Đang hiệu lực.
 * - Số ngày còn lại từ currentDate đến endDate nằm trong
 *   khoảng từ 0 đến warningDays.
 *
 * @param {object} contract Hợp đồng cần kiểm tra.
 * @param {string} currentDate Ngày hiện tại dạng YYYY-MM-DD.
 * @param {number} warningDays Số ngày cảnh báo trước.
 * @returns {boolean}
 * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
 */
export function isContractExpiringSoon(
  contract,
  currentDate,
  warningDays
) {
  if (
    typeof warningDays !== 'number' ||
    !Number.isInteger(warningDays) ||
    warningDays < 0
  ) {
    throw new TypeError(
      'Số ngày cảnh báo phải là số nguyên không âm.'
    );
  }

  if (
    !isContractActive(
      contract,
      currentDate
    )
  ) {
    return false;
  }

  const remainingDays = differenceInDays(
    currentDate,
    contract.endDate
  );

  return (
    remainingDays >= 0 &&
    remainingDays <= warningDays
  );
}