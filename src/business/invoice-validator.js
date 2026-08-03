import {
  INVOICE_DOCUMENT_STATUS,
  INVOICE_PAYMENT_STATUS
} from '../constants/statuses.js';

import {
  compareIsoDates,
  isValidIsoDate
} from '../utils/date-utils.js';

import {
  toSafeNumber
} from '../utils/number-utils.js';

import {
  calculateDiscount,
  calculateInvoiceTotal,
  calculateRemainingDebt,
  calculateSubtotal,
  determineInvoiceStatus
} from './invoice-calculator.js';

const DOCUMENT_STATUS_VALUES = Object.freeze(
  Object.values(
    INVOICE_DOCUMENT_STATUS
  )
);

const PAYMENT_STATUS_VALUES = Object.freeze(
  Object.values(
    INVOICE_PAYMENT_STATUS
  )
);

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
 * Chuẩn hóa chuỗi không bắt buộc.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
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
 * @param {*} value Giá trị số.
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

  return numericValue;
}

/**
 * Chuẩn hóa ngày YYYY-MM-DD.
 *
 * @param {*} value Giá trị ngày.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeDate(
  value,
  fieldName
) {
  const normalizedDate =
    normalizeRequiredString(
      value,
      fieldName
    );

  if (!isValidIsoDate(normalizedDate)) {
    throw new Error(
      `${fieldName} không phải ngày hợp lệ theo định dạng YYYY-MM-DD.`
    );
  }

  return normalizedDate;
}

/**
 * Chuẩn hóa tháng YYYY-MM.
 *
 * @param {*} value Giá trị tháng.
 * @returns {string}
 */
function normalizeMonthKey(value) {
  const month =
    normalizeRequiredString(
      value,
      'Tháng hóa đơn'
    );

  const match =
    /^(\d{4})-(\d{2})$/.exec(month);

  if (!match) {
    throw new Error(
      'Tháng hóa đơn phải đúng định dạng YYYY-MM.'
    );
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);

  if (
    !Number.isInteger(year) ||
    year < 1
  ) {
    throw new Error(
      'Năm của hóa đơn không hợp lệ.'
    );
  }

  if (
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new Error(
      'Tháng hóa đơn phải nằm trong khoảng từ 01 đến 12.'
    );
  }

  return month;
}

/**
 * So sánh hai giá trị tiền với sai số nhỏ.
 *
 * @param {number} firstValue Giá trị thứ nhất.
 * @param {number} secondValue Giá trị thứ hai.
 * @returns {boolean}
 */
function areMoneyValuesEqual(
  firstValue,
  secondValue
) {
  return (
    Math.abs(
      firstValue - secondValue
    ) <= MONEY_TOLERANCE
  );
}

/**
 * Chuẩn hóa một dòng hóa đơn.
 *
 * Dòng hóa đơn phải có:
 * - amount; hoặc
 * - quantity và unitPrice.
 *
 * @param {object} item Dòng hóa đơn.
 * @param {number} index Vị trí dòng.
 * @returns {object}
 */
function validateInvoiceItem(
  item,
  index
) {
  if (!isPlainObject(item)) {
    throw new TypeError(
      `Dòng hóa đơn thứ ${index + 1} phải là một object.`
    );
  }

  const itemName =
    item.name ??
    item.label ??
    item.description ??
    item.type;

  const normalizedName =
    normalizeRequiredString(
      itemName,
      `Tên dòng hóa đơn thứ ${index + 1}`
    );

  let quantity = null;
  let unitPrice = null;
  let amount;

  if (
    item.quantity !== undefined &&
    item.quantity !== null &&
    item.quantity !== ''
  ) {
    quantity =
      normalizeNonNegativeNumber(
        item.quantity,
        `Số lượng dòng thứ ${index + 1}`
      );
  }

  if (
    item.unitPrice !== undefined &&
    item.unitPrice !== null &&
    item.unitPrice !== ''
  ) {
    unitPrice =
      normalizeNonNegativeNumber(
        item.unitPrice,
        `Đơn giá dòng thứ ${index + 1}`
      );
  }

  if (
    item.amount !== undefined &&
    item.amount !== null &&
    item.amount !== ''
  ) {
    amount =
      normalizeNonNegativeNumber(
        item.amount,
        `Thành tiền dòng thứ ${index + 1}`
      );

    if (
      quantity !== null &&
      unitPrice !== null
    ) {
      const calculatedAmount =
        quantity * unitPrice;

      if (
        !areMoneyValuesEqual(
          amount,
          calculatedAmount
        )
      ) {
        throw new Error(
          `Thành tiền dòng thứ ${index + 1} không khớp với số lượng nhân đơn giá.`
        );
      }
    }
  } else {
    if (
      quantity === null ||
      unitPrice === null
    ) {
      throw new Error(
        `Dòng hóa đơn thứ ${index + 1} phải có amount hoặc quantity và unitPrice.`
      );
    }

    amount = quantity * unitPrice;
  }

  if (
    Number.isNaN(amount) ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error(
      `Thành tiền dòng hóa đơn thứ ${index + 1} không hợp lệ.`
    );
  }

  const normalizedItem = {
    ...item,
    name: normalizedName,
    amount
  };

  if (quantity !== null) {
    normalizedItem.quantity = quantity;
  }

  if (unitPrice !== null) {
    normalizedItem.unitPrice = unitPrice;
  }

  if (item.id !== undefined) {
    normalizedItem.id =
      normalizeRequiredString(
        item.id,
        `ID dòng hóa đơn thứ ${index + 1}`
      );
  }

  return normalizedItem;
}

/**
 * Kiểm tra và chuẩn hóa dữ liệu hóa đơn.
 *
 * Hàm không thay đổi object đầu vào.
 *
 * Nếu invoice.currentDate được cung cấp, hàm tự tính
 * paymentStatus tại ngày đó.
 *
 * @param {object} invoice Hóa đơn cần kiểm tra.
 * @returns {object} Hóa đơn đã chuẩn hóa.
 */
export function validateInvoice(invoice) {
  if (!isPlainObject(invoice)) {
    throw new TypeError(
      'Hóa đơn phải là một object.'
    );
  }

  const roomId =
    normalizeRequiredString(
      invoice.roomId,
      'ID phòng'
    );

  const period =
    normalizeMonthKey(
      invoice.period ??
      invoice.month
    );

  const issueDate =
    normalizeDate(
      invoice.issueDate,
      'Ngày lập hóa đơn'
    );

  const dueDate =
    normalizeDate(
      invoice.dueDate,
      'Ngày đến hạn'
    );

  if (
    compareIsoDates(
      dueDate,
      issueDate
    ) < 0
  ) {
    throw new Error(
      'Ngày đến hạn không được trước ngày lập hóa đơn.'
    );
  }

  if (!Array.isArray(invoice.items)) {
    throw new TypeError(
      'Danh sách dòng hóa đơn phải là một mảng.'
    );
  }

  if (invoice.items.length === 0) {
    throw new Error(
      'Hóa đơn phải có ít nhất một dòng tiền.'
    );
  }

  const items = invoice.items.map(
    validateInvoiceItem
  );

  const subtotal =
    calculateSubtotal(items);

  const discountValue =
    invoice.discount ??
    invoice.discountAmount ??
    0;

  const discount =
    calculateDiscount(
      subtotal,
      discountValue
    );

  const total =
    calculateInvoiceTotal(
      items,
      discount
    );

  const paidAmount =
    invoice.paidAmount === undefined ||
    invoice.paidAmount === null ||
    invoice.paidAmount === ''
      ? 0
      : normalizeNonNegativeNumber(
          invoice.paidAmount,
          'Số tiền đã trả'
        );

  const remainingDebt =
    calculateRemainingDebt(
      total,
      paidAmount
    );

  if (
    invoice.subtotal !== undefined &&
    !areMoneyValuesEqual(
      normalizeNonNegativeNumber(
        invoice.subtotal,
        'Tạm tính'
      ),
      subtotal
    )
  ) {
    throw new Error(
      'Tạm tính được lưu không khớp với các dòng hóa đơn.'
    );
  }

  if (
    invoice.total !== undefined &&
    !areMoneyValuesEqual(
      normalizeNonNegativeNumber(
        invoice.total,
        'Tổng tiền'
      ),
      total
    )
  ) {
    throw new Error(
      'Tổng tiền được lưu không khớp với dữ liệu hóa đơn.'
    );
  }

  const documentStatus =
    invoice.documentStatus ??
    invoice.status ??
    INVOICE_DOCUMENT_STATUS.DRAFT;

  if (
    !DOCUMENT_STATUS_VALUES.includes(
      documentStatus
    )
  ) {
    throw new Error(
      'Trạng thái chứng từ hóa đơn không hợp lệ.'
    );
  }

  let paymentStatus =
    invoice.paymentStatus;

  if (
    invoice.currentDate !== undefined
  ) {
    const currentDate =
      normalizeDate(
        invoice.currentDate,
        'Ngày hiện tại'
      );

    paymentStatus =
      determineInvoiceStatus(
        total,
        paidAmount,
        dueDate,
        currentDate
      );
  } else if (
    paymentStatus !== undefined &&
    !PAYMENT_STATUS_VALUES.includes(
      paymentStatus
    )
  ) {
    throw new Error(
      'Trạng thái thanh toán hóa đơn không hợp lệ.'
    );
  }

  const normalizedInvoice = {
    ...invoice,
    roomId,
    period,
    issueDate,
    dueDate,
    items,
    subtotal,
    discount,
    total,
    paidAmount,
    remainingDebt,
    documentStatus
  };

  delete normalizedInvoice.month;
  delete normalizedInvoice.discountAmount;
  delete normalizedInvoice.currentDate;

  if (paymentStatus !== undefined) {
    normalizedInvoice.paymentStatus =
      paymentStatus;
  }

  if (invoice.id !== undefined) {
    normalizedInvoice.id =
      normalizeRequiredString(
        invoice.id,
        'ID hóa đơn'
      );
  }

  if (invoice.code !== undefined) {
    normalizedInvoice.code =
      normalizeRequiredString(
        invoice.code,
        'Mã hóa đơn'
      );
  }

  if (invoice.contractId !== undefined) {
    normalizedInvoice.contractId =
      normalizeOptionalString(
        invoice.contractId,
        'ID hợp đồng'
      );
  }

  if (
    invoice.meterReadingId !==
    undefined
  ) {
    normalizedInvoice.meterReadingId =
      normalizeOptionalString(
        invoice.meterReadingId,
        'ID bản ghi chỉ số'
      );
  }

  return normalizedInvoice;
}