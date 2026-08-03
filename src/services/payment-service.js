import {
  STORAGE_KEYS
} from '../constants/storage-keys.js';

import {
  INVOICE_DOCUMENT_STATUS,
  INVOICE_PAYMENT_STATUS
} from '../constants/statuses.js';

import {
  storageService
} from './storage-service.js';

import {
  calculateRemainingAmount,
  calculateTotalPaid,
  determinePaymentStatus,
  groupPaymentsByMethod
} from '../business/payment-processor.js';

import {
  canDeletePayment,
  validatePayment
} from '../business/payment-validator.js';

import {
  isValidIsoDate
} from '../utils/date-utils.js';

/**
 * Kiểm tra một giá trị có phải object thông thường hay không.
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
 * Sao chép sâu dữ liệu JSON.
 *
 * @template T
 * @param {T} value Giá trị cần sao chép.
 * @returns {T}
 */
function cloneJson(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

/**
 * Chuẩn hóa ID.
 *
 * @param {*} id Giá trị ID.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeId(
  id,
  fieldName = 'ID'
) {
  if (typeof id !== 'string') {
    throw new TypeError(
      `${fieldName} phải là một chuỗi.`
    );
  }

  const normalizedId = id.trim();

  if (!normalizedId) {
    throw new Error(
      `${fieldName} không được để trống.`
    );
  }

  return normalizedId;
}

/**
 * Chuẩn hóa chuỗi tìm kiếm.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @returns {string}
 */
function normalizeSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
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
 * Chuẩn hóa số không âm dùng trong bộ lọc.
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

  const numericValue = Number(value);

  if (
    Number.isNaN(numericValue) ||
    !Number.isFinite(numericValue)
  ) {
    throw new TypeError(
      `${fieldName} phải là một số hợp lệ.`
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
 * Lấy ngày hiện tại tại Việt Nam.
 *
 * @returns {string} Ngày YYYY-MM-DD.
 */
function getCurrentDateInVietnam() {
  const parts = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter(
        (part) =>
          part.type !== 'literal'
      )
      .map(
        (part) => [
          part.type,
          part.value
        ]
      )
  );

  return (
    `${values.year}-` +
    `${values.month}-` +
    `${values.day}`
  );
}

/**
 * Lấy trạng thái chứng từ hóa đơn.
 *
 * Hỗ trợ dữ liệu cũ lưu trạng thái trong trường status.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {*}
 */
function getInvoiceDocumentStatus(invoice) {
  return (
    invoice?.documentStatus ??
    invoice?.status
  );
}

/**
 * Loại bỏ các trường do StorageService quản lý.
 *
 * @param {object} payment Giao dịch đã chuẩn hóa.
 * @returns {object}
 */
function createPaymentStorageData(payment) {
  const {
    id,
    createdAt,
    updatedAt,
    invoice,
    ...storageData
  } = payment;

  return storageData;
}

/**
 * Service quản lý giao dịch thanh toán.
 *
 * Mọi thao tác lưu trữ đều thông qua StorageService.
 */
export class PaymentService {
  /**
   * @param {import('./storage-service.js').StorageService} service
   * StorageService được sử dụng.
   */
  constructor(service = storageService) {
    const requiredMethods = [
      'getAll',
      'getById',
      'create',
      'update',
      'remove',
      'exportAll',
      'importAll'
    ];

    const validStorageService =
      service &&
      requiredMethods.every(
        (methodName) =>
          typeof service[methodName] ===
          'function'
      );

    if (!validStorageService) {
      throw new TypeError(
        'PaymentService cần một StorageService hợp lệ.'
      );
    }

    this.storageService = service;
  }

  /**
   * Thực hiện nhiều thay đổi theo cơ chế all-or-nothing.
   *
   * Nếu lưu payment thành công nhưng cập nhật invoice thất bại,
   * toàn bộ dữ liệu được khôi phục về trạng thái ban đầu.
   *
   * @template T
   * @param {() => T} operation Thao tác cần thực hiện.
   * @returns {T}
   */
  _runAtomic(operation) {
    if (typeof operation !== 'function') {
      throw new TypeError(
        'Thao tác giao dịch phải là một function.'
      );
    }

    const snapshot =
      this.storageService.exportAll();

    try {
      return operation();
    } catch (operationError) {
      try {
        this.storageService.importAll(
          snapshot
        );
      } catch (rollbackError) {
        throw new AggregateError(
          [
            operationError,
            rollbackError
          ],
          'Thao tác thanh toán thất bại và không thể khôi phục toàn bộ dữ liệu.'
        );
      }

      throw operationError;
    }
  }

  /**
   * Lấy hóa đơn và báo lỗi nếu không tồn tại.
   *
   * @param {string} invoiceId ID hóa đơn.
   * @returns {object}
   */
  _getRequiredInvoice(invoiceId) {
    const normalizedInvoiceId =
      normalizeId(
        invoiceId,
        'ID hóa đơn'
      );

    const invoice =
      this.storageService.getById(
        STORAGE_KEYS.INVOICES,
        normalizedInvoiceId
      );

    if (!invoice) {
      throw new Error(
        `Không tìm thấy hóa đơn có ID "${normalizedInvoiceId}".`
      );
    }

    return invoice;
  }

  /**
   * Tạo bản sao hóa đơn với số tiền đã trả được tính từ
   * danh sách payment thực tế.
   *
   * Dữ liệu này dùng cho validatePayment, không được lưu.
   *
   * @param {object} invoice Hóa đơn.
   * @returns {object}
   */
  _createInvoiceForValidation(invoice) {
    const payments =
      this.getPaymentsByInvoice(
        invoice.id
      );

    const totalPaid =
      calculateTotalPaid(payments);

    const remainingDebt =
      calculateRemainingAmount(
        invoice.total,
        payments
      );

    return {
      ...cloneJson(invoice),
      paidAmount: totalPaid,
      remainingDebt
    };
  }

  /**
   * Lấy tất cả giao dịch thanh toán.
   *
   * @returns {object[]}
   */
  getPayments() {
    return this.storageService.getAll(
      STORAGE_KEYS.PAYMENTS
    );
  }

  /**
   * Lấy giao dịch thanh toán theo ID.
   *
   * @param {string} id ID giao dịch.
   * @returns {object|null}
   */
  getPaymentById(id) {
    return this.storageService.getById(
      STORAGE_KEYS.PAYMENTS,
      id
    );
  }

  /**
   * Lấy các giao dịch của một hóa đơn.
   *
   * Danh sách được sắp xếp theo ngày thanh toán tăng dần.
   *
   * @param {string} invoiceId ID hóa đơn.
   * @returns {object[]}
   */
  getPaymentsByInvoice(invoiceId) {
    const normalizedInvoiceId =
      normalizeId(
        invoiceId,
        'ID hóa đơn'
      );

    return this.getPayments()
      .filter(
        (payment) =>
          payment.invoiceId ===
          normalizedInvoiceId
      )
      .sort(
        (firstPayment, secondPayment) => {
          const firstDate =
            firstPayment.paymentDate ??
            firstPayment.date ??
            '';

          const secondDate =
            secondPayment.paymentDate ??
            secondPayment.date ??
            '';

          const dateComparison =
            String(firstDate).localeCompare(
              String(secondDate)
            );

          if (dateComparison !== 0) {
            return dateComparison;
          }

          return String(
            firstPayment.createdAt ?? ''
          ).localeCompare(
            String(
              secondPayment.createdAt ?? ''
            )
          );
        }
      );
  }

  /**
   * Tạo giao dịch thanh toán.
   *
   * Sau khi payment được tạo, hóa đơn được đồng bộ trong cùng
   * một giao dịch. Nếu cập nhật hóa đơn thất bại, payment vừa
   * tạo sẽ được rollback.
   *
   * @param {object} data Dữ liệu giao dịch.
   * @returns {object} Giao dịch đã tạo.
   */
  createPayment(data) {
    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu thanh toán phải là một object.'
      );
    }

    const invoiceId =
      normalizeId(
        data.invoiceId,
        'ID hóa đơn'
      );

    const invoice =
      this._getRequiredInvoice(
        invoiceId
      );

    const invoiceForValidation =
      this._createInvoiceForValidation(
        invoice
      );

    const validatedPayment =
      validatePayment(
        {
          ...cloneJson(data),
          invoiceId
        },
        invoiceForValidation
      );

    const paymentToCreate =
      createPaymentStorageData(
        validatedPayment
      );

    return this._runAtomic(() => {
      const createdPayment =
        this.storageService.create(
          STORAGE_KEYS.PAYMENTS,
          paymentToCreate
        );

      this.syncInvoicePaymentStatus(
        invoice.id
      );

      return createdPayment;
    });
  }

  /**
   * Xóa một giao dịch thanh toán.
   *
   * Sau khi xóa, hóa đơn được tính lại trong cùng một giao dịch.
   * Nếu đồng bộ hóa đơn thất bại, payment được khôi phục.
   *
   * @param {string} id ID giao dịch.
   * @returns {object} Giao dịch đã xóa.
   */
  deletePayment(id) {
    const normalizedId =
      normalizeId(
        id,
        'ID giao dịch thanh toán'
      );

    const payment =
      this.storageService.getById(
        STORAGE_KEYS.PAYMENTS,
        normalizedId
      );

    if (!payment) {
      throw new Error(
        `Không tìm thấy giao dịch thanh toán có ID "${normalizedId}".`
      );
    }

    const invoice =
      this._getRequiredInvoice(
        payment.invoiceId
      );

    if (
      !canDeletePayment(
        payment,
        invoice
      )
    ) {
      throw new Error(
        'Giao dịch thanh toán không thể bị xóa.'
      );
    }

    return this._runAtomic(() => {
      const removedPayment =
        this.storageService.remove(
          STORAGE_KEYS.PAYMENTS,
          payment.id
        );

      if (!removedPayment) {
        throw new Error(
          `Không thể xóa giao dịch thanh toán có ID "${payment.id}".`
        );
      }

      this.syncInvoicePaymentStatus(
        invoice.id
      );

      return removedPayment;
    });
  }

  /**
   * Tính tổng số tiền đã thanh toán của một hóa đơn.
   *
   * @param {string} invoiceId ID hóa đơn.
   * @returns {number}
   */
  getTotalPaidByInvoice(invoiceId) {
    const invoice =
      this._getRequiredInvoice(
        invoiceId
      );

    const payments =
      this.getPaymentsByInvoice(
        invoice.id
      );

    return calculateTotalPaid(payments);
  }

  /**
   * Đồng bộ dữ liệu thanh toán của hóa đơn.
   *
   * Các trường được cập nhật:
   * - paidAmount
   * - remainingDebt
   * - paymentStatus
   *
   * Các giá trị luôn được tính lại từ danh sách payment thực tế.
   *
   * @param {string} invoiceId ID hóa đơn.
   * @returns {object} Hóa đơn sau khi đồng bộ.
   */
  syncInvoicePaymentStatus(invoiceId) {
    const invoice =
      this._getRequiredInvoice(
        invoiceId
      );

    const payments =
      this.getPaymentsByInvoice(
        invoice.id
      );

    const totalPaid =
      calculateTotalPaid(payments);

    const remainingDebt =
      calculateRemainingAmount(
        invoice.total,
        payments
      );

    const documentStatus =
      getInvoiceDocumentStatus(
        invoice
      );

    let paymentStatus;

    if (
      documentStatus ===
      INVOICE_DOCUMENT_STATUS.CANCELLED
    ) {
      if (totalPaid > 0) {
        throw new Error(
          'Hóa đơn đã hủy đang có giao dịch thanh toán. Dữ liệu không nhất quán.'
        );
      }

      paymentStatus =
        INVOICE_PAYMENT_STATUS.UNPAID;
    } else {
      paymentStatus =
        determinePaymentStatus(
          invoice.total,
          payments,
          invoice.dueDate,
          getCurrentDateInVietnam()
        );
    }

    return this.storageService.update(
      STORAGE_KEYS.INVOICES,
      invoice.id,
      {
        paidAmount: totalPaid,
        remainingDebt,
        paymentStatus
      }
    );
  }

  /**
   * Lọc danh sách giao dịch thanh toán.
   *
   * Các bộ lọc được hỗ trợ:
   * - keyword: ID, mã tham chiếu, ghi chú, mã hóa đơn.
   * - invoiceId.
   * - method.
   * - paymentDate hoặc date.
   * - fromDate.
   * - toDate.
   * - minAmount.
   * - maxAmount.
   *
   * @param {object} [filters={}] Bộ lọc.
   * @returns {object[]}
   */
  filterPayments(filters = {}) {
    if (!isPlainObject(filters)) {
      throw new TypeError(
        'Bộ lọc thanh toán phải là một object.'
      );
    }

    const keyword =
      filters.keyword === undefined
        ? ''
        : normalizeSearchText(
            filters.keyword
          );

    const invoiceId =
      filters.invoiceId === undefined ||
      filters.invoiceId === ''
        ? null
        : normalizeId(
            filters.invoiceId,
            'ID hóa đơn'
          );

    let method = null;

    if (
      filters.method !== undefined &&
      filters.method !== ''
    ) {
      if (
        typeof filters.method !==
        'string'
      ) {
        throw new TypeError(
          'Phương thức thanh toán phải là một chuỗi.'
        );
      }

      method = normalizeSearchText(
        filters.method
      );

      if (!method) {
        throw new Error(
          'Phương thức thanh toán không được để trống.'
        );
      }
    }

    const paymentDateValue =
      filters.paymentDate ??
      filters.date;

    const paymentDate =
      paymentDateValue === undefined ||
      paymentDateValue === ''
        ? null
        : normalizeDate(
            paymentDateValue,
            'Ngày thanh toán'
          );

    const fromDate =
      filters.fromDate === undefined ||
      filters.fromDate === ''
        ? null
        : normalizeDate(
            filters.fromDate,
            'Ngày bắt đầu'
          );

    const toDate =
      filters.toDate === undefined ||
      filters.toDate === ''
        ? null
        : normalizeDate(
            filters.toDate,
            'Ngày kết thúc'
          );

    if (
      fromDate &&
      toDate &&
      fromDate > toDate
    ) {
      throw new Error(
        'Ngày bắt đầu không được sau ngày kết thúc.'
      );
    }

    const minAmount =
      filters.minAmount === undefined ||
      filters.minAmount === ''
        ? null
        : normalizeNonNegativeNumber(
            filters.minAmount,
            'Số tiền tối thiểu'
          );

    const maxAmount =
      filters.maxAmount === undefined ||
      filters.maxAmount === ''
        ? null
        : normalizeNonNegativeNumber(
            filters.maxAmount,
            'Số tiền tối đa'
          );

    if (
      minAmount !== null &&
      maxAmount !== null &&
      minAmount > maxAmount
    ) {
      throw new Error(
        'Số tiền tối thiểu không được lớn hơn số tiền tối đa.'
      );
    }

    const invoiceById = new Map(
      this.storageService
        .getAll(STORAGE_KEYS.INVOICES)
        .map(
          (invoice) => [
            invoice.id,
            invoice
          ]
        )
    );

    return this.getPayments()
      .filter((payment) => {
        const invoice =
          invoiceById.get(
            payment.invoiceId
          );

        const currentPaymentDate =
          payment.paymentDate ??
          payment.date ??
          '';

        const amount =
          Number(payment.amount);

        if (
          invoiceId &&
          payment.invoiceId !== invoiceId
        ) {
          return false;
        }

        if (
          method &&
          normalizeSearchText(
            payment.method
          ) !== method
        ) {
          return false;
        }

        if (
          paymentDate &&
          currentPaymentDate !==
            paymentDate
        ) {
          return false;
        }

        if (
          fromDate &&
          currentPaymentDate < fromDate
        ) {
          return false;
        }

        if (
          toDate &&
          currentPaymentDate > toDate
        ) {
          return false;
        }

        if (
          minAmount !== null &&
          amount < minAmount
        ) {
          return false;
        }

        if (
          maxAmount !== null &&
          amount > maxAmount
        ) {
          return false;
        }

        if (keyword) {
          const searchableText =
            normalizeSearchText([
              payment.id,
              payment.reference,
              payment.note,
              payment.method,
              invoice?.code,
              invoice?.roomSnapshot?.code,
              invoice?.roomSnapshot?.name
            ].join(' '));

          if (
            !searchableText.includes(
              keyword
            )
          ) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (firstPayment, secondPayment) => {
          const firstDate =
            firstPayment.paymentDate ??
            firstPayment.date ??
            '';

          const secondDate =
            secondPayment.paymentDate ??
            secondPayment.date ??
            '';

          const dateComparison =
            String(secondDate).localeCompare(
              String(firstDate)
            );

          if (dateComparison !== 0) {
            return dateComparison;
          }

          return String(
            secondPayment.createdAt ?? ''
          ).localeCompare(
            String(
              firstPayment.createdAt ?? ''
            )
          );
        }
      );
  }

  /**
   * Nhóm các giao dịch hiện có theo phương thức thanh toán.
   *
   * Phương thức hỗ trợ việc tái sử dụng trực tiếp hàm thuần
   * groupPaymentsByMethod của PaymentProcessor.
   *
   * @returns {Record<string, object[]>}
   */
  getPaymentsGroupedByMethod() {
    return groupPaymentsByMethod(
      this.getPayments()
    );
  }
}

/**
 * Instance PaymentService dùng chung.
 */
export const paymentService =
  new PaymentService();

export default paymentService;