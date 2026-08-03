import {
  INVOICE_PAYMENT_STATUS
} from '../constants/statuses.js';

import {
  compareIsoDates,
  isValidIsoDate
} from '../utils/date-utils.js';

import {
  toSafeNumber
} from '../utils/number-utils.js';

/**
 * Chuẩn hóa một số không âm.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường dùng trong thông báo lỗi.
 * @returns {number}
 * @throws {TypeError|Error} Khi giá trị không hợp lệ.
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
  } catch {
    throw new TypeError(
      `${fieldName} phải là một số hợp lệ.`
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
 * Chuẩn hóa ngày dạng YYYY-MM-DD.
 *
 * @param {*} value Giá trị ngày.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeDate(
  value,
  fieldName
) {
  if (typeof value !== 'string') {
    throw new TypeError(
      `${fieldName} phải là chuỗi ngày YYYY-MM-DD.`
    );
  }

  const normalizedDate = value.trim();

  if (!isValidIsoDate(normalizedDate)) {
    throw new Error(
      `${fieldName} không phải ngày hợp lệ theo định dạng YYYY-MM-DD.`
    );
  }

  return normalizedDate;
}

/**
 * Tính số tiền theo lượng sử dụng.
 *
 * @param {*} usage Lượng sử dụng.
 * @param {*} unitPrice Đơn giá.
 * @param {string} label Tên dịch vụ.
 * @returns {number}
 */
function calculateUsageAmount(
  usage,
  unitPrice,
  label
) {
  const normalizedUsage =
    normalizeNonNegativeNumber(
      usage,
      `${label} sử dụng`
    );

  const normalizedUnitPrice =
    normalizeNonNegativeNumber(
      unitPrice,
      `Đơn giá ${label.toLocaleLowerCase('vi-VN')}`
    );

  const amount =
    normalizedUsage *
    normalizedUnitPrice;

  if (
    Number.isNaN(amount) ||
    !Number.isFinite(amount)
  ) {
    throw new Error(
      `Không thể tính tiền ${label.toLocaleLowerCase('vi-VN')}.`
    );
  }

  return amount;
}

/**
 * Tính tiền điện theo lượng sử dụng.
 *
 * @param {*} usage Số điện đã sử dụng.
 * @param {*} unitPrice Đơn giá điện.
 * @returns {number}
 */
export function calculateElectricAmount(
  usage,
  unitPrice
) {
  return calculateUsageAmount(
    usage,
    unitPrice,
    'Điện'
  );
}

/**
 * Tính tiền nước theo lượng sử dụng.
 *
 * @param {*} usage Số nước đã sử dụng.
 * @param {*} unitPrice Đơn giá nước.
 * @returns {number}
 */
export function calculateWaterAmount(
  usage,
  unitPrice
) {
  return calculateUsageAmount(
    usage,
    unitPrice,
    'Nước'
  );
}

/**
 * Tính tiền dịch vụ cố định theo phòng.
 *
 * @param {*} unitPrice Đơn giá dịch vụ.
 * @returns {number}
 */
export function calculateFixedServiceAmount(
  unitPrice
) {
  return normalizeNonNegativeNumber(
    unitPrice,
    'Đơn giá dịch vụ cố định'
  );
}

/**
 * Tính tiền dịch vụ theo số người.
 *
 * @param {*} personCount Số người.
 * @param {*} unitPrice Đơn giá trên một người.
 * @returns {number}
 */
export function calculatePerPersonAmount(
  personCount,
  unitPrice
) {
  const normalizedPersonCount =
    normalizeNonNegativeNumber(
      personCount,
      'Số người'
    );

  if (
    !Number.isInteger(
      normalizedPersonCount
    )
  ) {
    throw new Error(
      'Số người phải là số nguyên không âm.'
    );
  }

  const normalizedUnitPrice =
    normalizeNonNegativeNumber(
      unitPrice,
      'Đơn giá theo người'
    );

  const amount =
    normalizedPersonCount *
    normalizedUnitPrice;

  if (
    Number.isNaN(amount) ||
    !Number.isFinite(amount)
  ) {
    throw new Error(
      'Không thể tính tiền dịch vụ theo số người.'
    );
  }

  return amount;
}

/**
 * Tính tiền dịch vụ theo số xe.
 *
 * @param {*} vehicleCount Số xe.
 * @param {*} unitPrice Đơn giá trên một xe.
 * @returns {number}
 */
export function calculatePerVehicleAmount(
  vehicleCount,
  unitPrice
) {
  const normalizedVehicleCount =
    normalizeNonNegativeNumber(
      vehicleCount,
      'Số xe'
    );

  if (
    !Number.isInteger(
      normalizedVehicleCount
    )
  ) {
    throw new Error(
      'Số xe phải là số nguyên không âm.'
    );
  }

  const normalizedUnitPrice =
    normalizeNonNegativeNumber(
      unitPrice,
      'Đơn giá theo xe'
    );

  const amount =
    normalizedVehicleCount *
    normalizedUnitPrice;

  if (
    Number.isNaN(amount) ||
    !Number.isFinite(amount)
  ) {
    throw new Error(
      'Không thể tính tiền dịch vụ theo số xe.'
    );
  }

  return amount;
}

/**
 * Lấy thành tiền của một dòng hóa đơn.
 *
 * Hàm hỗ trợ:
 * - item.amount đã được tính sẵn.
 * - Hoặc item.quantity * item.unitPrice.
 *
 * @param {object} item Dòng hóa đơn.
 * @param {number} index Vị trí dòng hóa đơn.
 * @returns {number}
 */
function calculateItemAmount(
  item,
  index
) {
  if (
    item === null ||
    typeof item !== 'object' ||
    Array.isArray(item)
  ) {
    throw new TypeError(
      `Dòng hóa đơn thứ ${index + 1} phải là một object.`
    );
  }

  if (
    item.amount !== undefined &&
    item.amount !== null &&
    item.amount !== ''
  ) {
    return normalizeNonNegativeNumber(
      item.amount,
      `Thành tiền dòng thứ ${index + 1}`
    );
  }

  if (
    item.quantity === undefined ||
    item.unitPrice === undefined
  ) {
    throw new Error(
      `Dòng hóa đơn thứ ${index + 1} phải có amount hoặc quantity và unitPrice.`
    );
  }

  const quantity =
    normalizeNonNegativeNumber(
      item.quantity,
      `Số lượng dòng thứ ${index + 1}`
    );

  const unitPrice =
    normalizeNonNegativeNumber(
      item.unitPrice,
      `Đơn giá dòng thứ ${index + 1}`
    );

  const amount = quantity * unitPrice;

  if (
    Number.isNaN(amount) ||
    !Number.isFinite(amount)
  ) {
    throw new Error(
      `Không thể tính thành tiền dòng hóa đơn thứ ${index + 1}.`
    );
  }

  return amount;
}

/**
 * Tính tạm tính của hóa đơn.
 *
 * @param {object[]} items Danh sách dòng hóa đơn.
 * @returns {number}
 */
export function calculateSubtotal(items) {
  if (!Array.isArray(items)) {
    throw new TypeError(
      'Danh sách dòng hóa đơn phải là một mảng.'
    );
  }

  const subtotal = items.reduce(
    (total, item, index) =>
      total +
      calculateItemAmount(
        item,
        index
      ),
    0
  );

  if (
    Number.isNaN(subtotal) ||
    !Number.isFinite(subtotal) ||
    subtotal < 0
  ) {
    throw new Error(
      'Tạm tính hóa đơn không hợp lệ.'
    );
  }

  return subtotal;
}

/**
 * Kiểm tra và trả về số tiền giảm giá.
 *
 * @param {*} subtotal Tạm tính.
 * @param {*} discount Số tiền giảm giá.
 * @returns {number}
 */
export function calculateDiscount(
  subtotal,
  discount
) {
  const normalizedSubtotal =
    normalizeNonNegativeNumber(
      subtotal,
      'Tạm tính'
    );

  const normalizedDiscount =
    discount === undefined ||
    discount === null ||
    discount === ''
      ? 0
      : normalizeNonNegativeNumber(
          discount,
          'Giảm giá'
        );

  if (
    normalizedDiscount >
    normalizedSubtotal
  ) {
    throw new Error(
      'Giảm giá không được lớn hơn tạm tính.'
    );
  }

  return normalizedDiscount;
}

/**
 * Tính tổng tiền hóa đơn sau giảm giá.
 *
 * @param {object[]} items Danh sách dòng hóa đơn.
 * @param {*} discount Số tiền giảm giá.
 * @returns {number}
 */
export function calculateInvoiceTotal(
  items,
  discount = 0
) {
  const subtotal =
    calculateSubtotal(items);

  const discountAmount =
    calculateDiscount(
      subtotal,
      discount
    );

  const total =
    subtotal - discountAmount;

  if (
    Number.isNaN(total) ||
    !Number.isFinite(total) ||
    total < 0
  ) {
    throw new Error(
      'Tổng tiền hóa đơn không hợp lệ.'
    );
  }

  return total;
}

/**
 * Tính số tiền còn nợ.
 *
 * Nếu số tiền đã trả lớn hơn tổng tiền, công nợ bằng 0.
 *
 * @param {*} total Tổng tiền hóa đơn.
 * @param {*} paidAmount Số tiền đã trả.
 * @returns {number}
 */
export function calculateRemainingDebt(
  total,
  paidAmount
) {
  const normalizedTotal =
    normalizeNonNegativeNumber(
      total,
      'Tổng tiền'
    );

  const normalizedPaidAmount =
    normalizeNonNegativeNumber(
      paidAmount,
      'Số tiền đã trả'
    );

  const remainingDebt = Math.max(
    normalizedTotal -
      normalizedPaidAmount,
    0
  );

  if (
    Number.isNaN(remainingDebt) ||
    !Number.isFinite(remainingDebt)
  ) {
    throw new Error(
      'Không thể tính số tiền còn nợ.'
    );
  }

  return remainingDebt;
}

/**
 * Xác định trạng thái thanh toán hóa đơn.
 *
 * Thứ tự ưu tiên:
 * 1. Đã trả đủ hoặc trả thừa: đã thanh toán.
 * 2. Chưa trả đủ và đã quá hạn: quá hạn.
 * 3. Chưa trả đồng nào: chưa thanh toán.
 * 4. Đã trả một phần: thanh toán một phần.
 *
 * @param {*} total Tổng tiền hóa đơn.
 * @param {*} paidAmount Số tiền đã trả.
 * @param {string} dueDate Ngày đến hạn.
 * @param {string} currentDate Ngày hiện tại.
 * @returns {string}
 */
export function determineInvoiceStatus(
  total,
  paidAmount,
  dueDate,
  currentDate
) {
  const normalizedTotal =
    normalizeNonNegativeNumber(
      total,
      'Tổng tiền'
    );

  const normalizedPaidAmount =
    normalizeNonNegativeNumber(
      paidAmount,
      'Số tiền đã trả'
    );

  const normalizedDueDate =
    normalizeDate(
      dueDate,
      'Ngày đến hạn'
    );

  const normalizedCurrentDate =
    normalizeDate(
      currentDate,
      'Ngày hiện tại'
    );

  if (
    normalizedPaidAmount >=
    normalizedTotal
  ) {
    return INVOICE_PAYMENT_STATUS.PAID;
  }

  if (
    compareIsoDates(
      normalizedCurrentDate,
      normalizedDueDate
    ) > 0
  ) {
    return INVOICE_PAYMENT_STATUS.OVERDUE;
  }

  if (normalizedPaidAmount === 0) {
    return INVOICE_PAYMENT_STATUS.UNPAID;
  }

  return INVOICE_PAYMENT_STATUS.PARTIALLY_PAID;
}