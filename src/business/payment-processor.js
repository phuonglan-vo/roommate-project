import {
  determineInvoiceStatus
} from './invoice-calculator.js';

import {
  toSafeNumber
} from '../utils/number-utils.js';

const MONEY_PRECISION = 100;
const MONEY_TOLERANCE = 0.01;

/**
 * Làm tròn giá trị tiền đến 2 chữ số thập phân.
 *
 * @param {number} value Giá trị tiền.
 * @returns {number}
 */
function roundMoney(value) {
  return Math.round(
    (value + Number.EPSILON) *
      MONEY_PRECISION
  ) / MONEY_PRECISION;
}

/**
 * Chuẩn hóa số không âm.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường.
 * @returns {number}
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

  return roundMoney(numericValue);
}

/**
 * Chuẩn hóa số tiền thanh toán.
 *
 * Số tiền thanh toán phải lớn hơn 0.
 *
 * @param {*} value Số tiền.
 * @param {string} fieldName Tên trường.
 * @returns {number}
 */
function normalizePaymentAmount(
  value,
  fieldName
) {
  const amount =
    normalizeNonNegativeNumber(
      value,
      fieldName
    );

  if (amount <= 0) {
    throw new Error(
      `${fieldName} phải lớn hơn 0.`
    );
  }

  return amount;
}

/**
 * Chuẩn hóa phương thức thanh toán.
 *
 * @param {*} method Phương thức thanh toán.
 * @returns {string}
 */
function normalizePaymentMethod(method) {
  if (typeof method !== 'string') {
    throw new TypeError(
      'Phương thức thanh toán phải là một chuỗi.'
    );
  }

  const normalizedMethod = method
    .trim()
    .toLocaleLowerCase('vi-VN');

  if (!normalizedMethod) {
    throw new Error(
      'Phương thức thanh toán không được để trống.'
    );
  }

  return normalizedMethod;
}

/**
 * Tính tổng số tiền đã thanh toán.
 *
 * @param {object[]} payments Danh sách giao dịch thanh toán.
 * @returns {number}
 */
export function calculateTotalPaid(payments) {
  if (!Array.isArray(payments)) {
    throw new TypeError(
      'Danh sách thanh toán phải là một mảng.'
    );
  }

  const totalPaid = payments.reduce(
    (total, payment, index) => {
      if (
        payment === null ||
        typeof payment !== 'object' ||
        Array.isArray(payment)
      ) {
        throw new TypeError(
          `Giao dịch thứ ${index + 1} phải là một object.`
        );
      }

      const amount =
        normalizePaymentAmount(
          payment.amount,
          `Số tiền giao dịch thứ ${index + 1}`
        );

      return roundMoney(
        total + amount
      );
    },
    0
  );

  if (
    Number.isNaN(totalPaid) ||
    !Number.isFinite(totalPaid)
  ) {
    throw new Error(
      'Không thể tính tổng số tiền đã thanh toán.'
    );
  }

  return totalPaid;
}

/**
 * Tính số tiền còn phải thanh toán.
 *
 * Hàm báo lỗi nếu tổng các giao dịch vượt quá tổng hóa đơn.
 *
 * @param {*} invoiceTotal Tổng tiền hóa đơn.
 * @param {object[]} payments Danh sách giao dịch.
 * @returns {number}
 */
export function calculateRemainingAmount(
  invoiceTotal,
  payments
) {
  const normalizedInvoiceTotal =
    normalizeNonNegativeNumber(
      invoiceTotal,
      'Tổng tiền hóa đơn'
    );

  const totalPaid =
    calculateTotalPaid(payments);

  if (
    totalPaid >
    normalizedInvoiceTotal +
      MONEY_TOLERANCE
  ) {
    throw new Error(
      `Tổng số tiền thanh toán (${totalPaid}) vượt quá tổng tiền hóa đơn (${normalizedInvoiceTotal}).`
    );
  }

  return roundMoney(
    Math.max(
      normalizedInvoiceTotal -
        totalPaid,
      0
    )
  );
}

/**
 * Xác định trạng thái thanh toán hóa đơn.
 *
 * Quy tắc:
 * - Trả đủ: đã thanh toán.
 * - Quá hạn và chưa trả đủ: quá hạn.
 * - Chưa trả: chưa thanh toán.
 * - Trả một phần: thanh toán một phần.
 *
 * @param {*} invoiceTotal Tổng tiền hóa đơn.
 * @param {object[]} payments Danh sách giao dịch.
 * @param {string} dueDate Ngày đến hạn YYYY-MM-DD.
 * @param {string} currentDate Ngày hiện tại YYYY-MM-DD.
 * @returns {string}
 */
export function determinePaymentStatus(
  invoiceTotal,
  payments,
  dueDate,
  currentDate
) {
  const normalizedInvoiceTotal =
    normalizeNonNegativeNumber(
      invoiceTotal,
      'Tổng tiền hóa đơn'
    );

  const totalPaid =
    calculateTotalPaid(payments);

  if (
    totalPaid >
    normalizedInvoiceTotal +
      MONEY_TOLERANCE
  ) {
    throw new Error(
      'Tổng số tiền thanh toán không được vượt quá tổng tiền hóa đơn.'
    );
  }

  return determineInvoiceStatus(
    normalizedInvoiceTotal,
    totalPaid,
    dueDate,
    currentDate
  );
}

/**
 * Nhóm các giao dịch theo phương thức thanh toán.
 *
 * Kết quả là object có dạng:
 *
 * {
 *   cash: [payment1, payment2],
 *   bankTransfer: [payment3]
 * }
 *
 * Hàm không thay đổi danh sách đầu vào.
 *
 * @param {object[]} payments Danh sách giao dịch.
 * @returns {Record<string, object[]>}
 */
export function groupPaymentsByMethod(
  payments
) {
  if (!Array.isArray(payments)) {
    throw new TypeError(
      'Danh sách thanh toán phải là một mảng.'
    );
  }

  return payments.reduce(
    (groups, payment, index) => {
      if (
        payment === null ||
        typeof payment !== 'object' ||
        Array.isArray(payment)
      ) {
        throw new TypeError(
          `Giao dịch thứ ${index + 1} phải là một object.`
        );
      }

      /*
       * Kiểm tra số tiền để không nhóm các giao dịch
       * có dữ liệu không hợp lệ.
       */
      normalizePaymentAmount(
        payment.amount,
        `Số tiền giao dịch thứ ${index + 1}`
      );

      const method =
        normalizePaymentMethod(
          payment.method
        );

      if (!groups[method]) {
        groups[method] = [];
      }

      groups[method].push({
        ...payment,
        method
      });

      return groups;
    },
    {}
  );
}