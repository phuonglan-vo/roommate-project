import {
  INVOICE_DOCUMENT_STATUS
} from '../constants/statuses.js';

import {
  isValidIsoDate
} from '../utils/date-utils.js';

import {
  toSafeNumber
} from '../utils/number-utils.js';

const MONEY_PRECISION = 100;
const MONEY_TOLERANCE = 0.01;

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
 * Làm tròn giá trị tiền.
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
 * Chuẩn hóa chuỗi bắt buộc.
 *
 * @param {*} value Giá trị.
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
 * Chuẩn hóa chuỗi không bắt buộc.
 *
 * @param {*} value Giá trị.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeOptionalString(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null
  ) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(
      `${fieldName} phải là một chuỗi.`
    );
  }

  return value.trim();
}

/**
 * Chuẩn hóa số không âm.
 *
 * @param {*} value Giá trị.
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
 * @param {*} value Giá trị.
 * @returns {number}
 */
function normalizePaymentAmount(value) {
  const amount =
    normalizeNonNegativeNumber(
      value,
      'Số tiền thanh toán'
    );

  if (amount <= 0) {
    throw new Error(
      'Số tiền thanh toán phải lớn hơn 0.'
    );
  }

  return amount;
}

/**
 * Lấy trạng thái chứng từ hóa đơn.
 *
 * Hỗ trợ dữ liệu cũ dùng trường status.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {*}
 */
function getInvoiceDocumentStatus(invoice) {
  return (
    invoice.documentStatus ??
    invoice.status
  );
}

/**
 * Tính công nợ hiện tại của hóa đơn.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {{
 *   total: number,
 *   paidAmount: number,
 *   remainingAmount: number
 * }}
 */
function getInvoiceDebt(invoice) {
  const total =
    normalizeNonNegativeNumber(
      invoice.total,
      'Tổng tiền hóa đơn'
    );

  const paidAmount =
    invoice.paidAmount === undefined ||
    invoice.paidAmount === null ||
    invoice.paidAmount === ''
      ? 0
      : normalizeNonNegativeNumber(
          invoice.paidAmount,
          'Số tiền hóa đơn đã trả'
        );

  if (
    paidAmount >
    total + MONEY_TOLERANCE
  ) {
    throw new Error(
      'Số tiền đã trả của hóa đơn vượt quá tổng tiền.'
    );
  }

  return {
    total,
    paidAmount,

    remainingAmount: roundMoney(
      Math.max(
        total - paidAmount,
        0
      )
    )
  };
}

/**
 * Kiểm tra và chuẩn hóa giao dịch thanh toán.
 *
 * Quy tắc:
 * - Số tiền phải lớn hơn 0.
 * - Không vượt quá công nợ.
 * - Không thanh toán hóa đơn đã hủy.
 * - Không thanh toán thêm hóa đơn đã trả đủ.
 * - payment.invoiceId phải khớp với invoice.id nếu có.
 *
 * Hàm không thay đổi dữ liệu đầu vào.
 *
 * @param {object} payment Giao dịch thanh toán.
 * @param {object} invoice Hóa đơn liên quan.
 * @returns {object} Giao dịch đã chuẩn hóa.
 */
export function validatePayment(
  payment,
  invoice
) {
  if (!isPlainObject(payment)) {
    throw new TypeError(
      'Giao dịch thanh toán phải là một object.'
    );
  }

  if (!isPlainObject(invoice)) {
    throw new TypeError(
      'Hóa đơn phải là một object.'
    );
  }

  if (
    getInvoiceDocumentStatus(invoice) ===
    INVOICE_DOCUMENT_STATUS.CANCELLED
  ) {
    throw new Error(
      'Không thể thanh toán hóa đơn đã hủy.'
    );
  }

  const invoiceId =
    normalizeRequiredString(
      invoice.id,
      'ID hóa đơn'
    );

  if (
    payment.invoiceId !== undefined &&
    payment.invoiceId !== null &&
    normalizeRequiredString(
      payment.invoiceId,
      'ID hóa đơn của giao dịch'
    ) !== invoiceId
  ) {
    throw new Error(
      'Giao dịch thanh toán không thuộc hóa đơn được cung cấp.'
    );
  }

  const amount =
    normalizePaymentAmount(
      payment.amount
    );

  const {
    remainingAmount
  } = getInvoiceDebt(invoice);

  if (
    remainingAmount <=
    MONEY_TOLERANCE
  ) {
    throw new Error(
      'Hóa đơn đã được thanh toán đủ, không thể thanh toán thêm.'
    );
  }

  if (
    amount >
    remainingAmount +
      MONEY_TOLERANCE
  ) {
    throw new Error(
      `Số tiền thanh toán (${amount}) vượt quá công nợ còn lại (${remainingAmount}).`
    );
  }

  const method =
    normalizeRequiredString(
      payment.method,
      'Phương thức thanh toán'
    );

  let paymentDate =
    payment.paymentDate ??
    payment.date;

  if (
    paymentDate === undefined ||
    paymentDate === null ||
    paymentDate === ''
  ) {
    throw new Error(
      'Ngày thanh toán không được để trống.'
    );
  }

  paymentDate =
    normalizeRequiredString(
      paymentDate,
      'Ngày thanh toán'
    );

  if (!isValidIsoDate(paymentDate)) {
    throw new Error(
      'Ngày thanh toán phải là ngày hợp lệ theo định dạng YYYY-MM-DD.'
    );
  }

  const normalizedPayment = {
    ...payment,
    invoiceId,
    amount,
    method,
    paymentDate,

    reference:
      normalizeOptionalString(
        payment.reference,
        'Mã tham chiếu'
      ),

    note:
      normalizeOptionalString(
        payment.note,
        'Ghi chú'
      )
  };

  delete normalizedPayment.date;

  if (payment.id !== undefined) {
    normalizedPayment.id =
      normalizeRequiredString(
        payment.id,
        'ID giao dịch'
      );
  }

  return normalizedPayment;
}

/**
 * Kiểm tra một giao dịch có thể bị xóa hay không.
 *
 * Việc xóa giao dịch phải được service theo sau bằng:
 * - Tính lại tổng số tiền đã trả.
 * - Tính lại công nợ.
 * - Tính lại trạng thái thanh toán hóa đơn.
 *
 * @param {object} payment Giao dịch cần xóa.
 * @param {object} invoice Hóa đơn liên quan.
 * @returns {boolean}
 */
export function canDeletePayment(
  payment,
  invoice
) {
  if (
    !isPlainObject(payment) ||
    !isPlainObject(invoice)
  ) {
    return false;
  }

  if (
    getInvoiceDocumentStatus(invoice) ===
    INVOICE_DOCUMENT_STATUS.CANCELLED
  ) {
    return false;
  }

  if (
    payment.isLocked === true ||
    payment.locked === true
  ) {
    return false;
  }

  let amount;

  try {
    amount =
      normalizePaymentAmount(
        payment.amount
      );
  } catch {
    return false;
  }

  if (amount <= 0) {
    return false;
  }

  if (
    payment.invoiceId !== undefined &&
    invoice.id !== undefined &&
    payment.invoiceId !== invoice.id
  ) {
    return false;
  }

  return true;
}