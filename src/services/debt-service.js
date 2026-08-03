import invoiceService from './invoice-service.js';

const MILLISECONDS_PER_DAY =
  24 * 60 * 60 * 1000;

const MONEY_PRECISION = 100;

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
 * Làm tròn giá trị tiền đến hai chữ số thập phân.
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

  return roundMoney(numericValue);
}

/**
 * Chuẩn hóa ID.
 *
 * @param {*} value Giá trị ID.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeId(
  value,
  fieldName = 'ID'
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
      `${fieldName} phải là chuỗi YYYY-MM-DD.`
    );
  }

  const normalizedValue = value.trim();

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      normalizedValue
    );

  if (!match) {
    throw new Error(
      `${fieldName} phải đúng định dạng YYYY-MM-DD.`
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() === day;

  if (!isValid) {
    throw new Error(
      `${fieldName} không phải ngày hợp lệ.`
    );
  }

  return normalizedValue;
}

/**
 * Chuẩn hóa khóa tháng YYYY-MM.
 *
 * @param {*} value Giá trị tháng.
 * @returns {string}
 */
function normalizeMonthKey(value) {
  if (typeof value !== 'string') {
    throw new TypeError(
      'Tháng hóa đơn phải là chuỗi YYYY-MM.'
    );
  }

  const normalizedValue = value.trim();

  const match =
    /^(\d{4})-(\d{2})$/.exec(
      normalizedValue
    );

  if (!match) {
    throw new Error(
      'Tháng hóa đơn phải đúng định dạng YYYY-MM.'
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (
    !Number.isInteger(year) ||
    year < 1
  ) {
    throw new Error(
      'Năm hóa đơn không hợp lệ.'
    );
  }

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      'Tháng hóa đơn phải nằm trong khoảng từ 01 đến 12.'
    );
  }

  return normalizedValue;
}

/**
 * Chuyển ngày YYYY-MM-DD thành số milliseconds UTC.
 *
 * @param {string} value Chuỗi ngày.
 * @returns {number}
 */
function dateToUtcMilliseconds(value) {
  const normalizedDate =
    normalizeDate(value, 'Ngày');

  const [year, month, day] =
    normalizedDate
      .split('-')
      .map(Number);

  return Date.UTC(
    year,
    month - 1,
    day
  );
}

/**
 * Kiểm tra hóa đơn đã bị hủy hay chưa.
 *
 * Hỗ trợ cả documentStatus và status của dữ liệu cũ.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {boolean}
 */
function isCancelledInvoice(invoice) {
  return (
    invoice?.documentStatus ===
      'cancelled' ||
    invoice?.status ===
      'cancelled'
  );
}

/**
 * Lấy tháng của hóa đơn.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {string}
 */
function getInvoiceMonth(invoice) {
  return normalizeMonthKey(
    invoice.period ??
    invoice.month
  );
}

/**
 * Lấy công nợ còn lại của hóa đơn.
 *
 * Ưu tiên remainingDebt. Nếu dữ liệu cũ chưa có trường này,
 * công nợ được suy ra từ total và paidAmount.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {number}
 */
function getRemainingDebt(invoice) {
  if (!isPlainObject(invoice)) {
    throw new TypeError(
      'Hóa đơn phải là một object.'
    );
  }

  if (
    invoice.remainingDebt !== undefined &&
    invoice.remainingDebt !== null &&
    invoice.remainingDebt !== ''
  ) {
    return normalizeNonNegativeNumber(
      invoice.remainingDebt,
      'Số tiền còn nợ'
    );
  }

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
          'Số tiền đã trả'
        );

  return roundMoney(
    Math.max(
      total - paidAmount,
      0
    )
  );
}

/**
 * Tạo dữ liệu hóa đơn công nợ thống nhất.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {object}
 */
function createDebtInvoice(invoice) {
  if (!isPlainObject(invoice)) {
    throw new TypeError(
      'Hóa đơn công nợ phải là một object.'
    );
  }

  return {
    ...cloneJson(invoice),

    roomId: normalizeId(
      invoice.roomId,
      'ID phòng'
    ),

    period:
      getInvoiceMonth(invoice),

    remainingDebt:
      getRemainingDebt(invoice)
  };
}

/**
 * Service tổng hợp công nợ từ InvoiceService.
 *
 * DebtService không truy cập LocalStorage trực tiếp.
 */
export class DebtService {
  /**
   * @param {object} service InvoiceService được sử dụng.
   */
  constructor(service = invoiceService) {
    if (
      !service ||
      typeof service.getInvoices !==
        'function'
    ) {
      throw new TypeError(
        'DebtService cần một InvoiceService hợp lệ.'
      );
    }

    this.invoiceService = service;
  }

  /**
   * Lấy các hóa đơn còn công nợ.
   *
   * Hóa đơn đã hủy không được tính vào công nợ.
   * Danh sách được sắp xếp theo công nợ giảm dần.
   *
   * @returns {object[]}
   */
  getOutstandingInvoices() {
    return this.invoiceService
      .getInvoices()
      .filter(
        (invoice) =>
          !isCancelledInvoice(invoice)
      )
      .map(createDebtInvoice)
      .filter(
        (invoice) =>
          invoice.remainingDebt > 0
      )
      .sort(
        (firstInvoice, secondInvoice) => {
          const debtComparison =
            secondInvoice.remainingDebt -
            firstInvoice.remainingDebt;

          if (debtComparison !== 0) {
            return debtComparison;
          }

          return String(
            firstInvoice.dueDate ?? ''
          ).localeCompare(
            String(
              secondInvoice.dueDate ?? ''
            )
          );
        }
      );
  }

  /**
   * Lấy các hóa đơn còn nợ đã quá hạn.
   *
   * @param {string} currentDate Ngày hiện tại YYYY-MM-DD.
   * @returns {object[]}
   */
  getOverdueInvoices(currentDate) {
    const normalizedCurrentDate =
      normalizeDate(
        currentDate,
        'Ngày hiện tại'
      );

    return this.getOutstandingInvoices()
      .map((invoice) => ({
        ...invoice,

        daysOverdue:
          this.calculateDaysOverdue(
            invoice.dueDate,
            normalizedCurrentDate
          )
      }))
      .filter(
        (invoice) =>
          invoice.daysOverdue > 0
      )
      .sort(
        (firstInvoice, secondInvoice) => {
          const dayComparison =
            secondInvoice.daysOverdue -
            firstInvoice.daysOverdue;

          if (dayComparison !== 0) {
            return dayComparison;
          }

          return (
            secondInvoice.remainingDebt -
            firstInvoice.remainingDebt
          );
        }
      );
  }

  /**
   * Tính tổng công nợ hiện tại.
   *
   * @returns {number}
   */
  getTotalDebt() {
    return roundMoney(
      this.getOutstandingInvoices()
        .reduce(
          (totalDebt, invoice) =>
            totalDebt +
            invoice.remainingDebt,
          0
        )
    );
  }

  /**
   * Tổng hợp công nợ theo phòng.
   *
   * @returns {Array<{
   *   roomId: string,
   *   roomSnapshot: object|null,
   *   totalDebt: number,
   *   invoiceCount: number,
   *   oldestDueDate: string|null,
   *   invoiceIds: string[],
   *   invoices: object[]
   * }>}
   */
  getDebtByRoom() {
    const groups = new Map();

    this.getOutstandingInvoices()
      .forEach((invoice) => {
        const roomId = invoice.roomId;

        if (!groups.has(roomId)) {
          groups.set(roomId, {
            roomId,

            roomSnapshot:
              invoice.roomSnapshot
                ? cloneJson(
                    invoice.roomSnapshot
                  )
                : null,

            totalDebt: 0,
            invoiceCount: 0,
            oldestDueDate: null,
            invoiceIds: [],
            invoices: []
          });
        }

        const group =
          groups.get(roomId);

        group.totalDebt =
          roundMoney(
            group.totalDebt +
            invoice.remainingDebt
          );

        group.invoiceCount += 1;

        group.invoiceIds.push(
          invoice.id
        );

        group.invoices.push(
          cloneJson(invoice)
        );

        if (
          invoice.dueDate &&
          (
            !group.oldestDueDate ||
            invoice.dueDate <
              group.oldestDueDate
          )
        ) {
          group.oldestDueDate =
            invoice.dueDate;
        }
      });

    return [...groups.values()]
      .sort(
        (firstGroup, secondGroup) =>
          secondGroup.totalDebt -
          firstGroup.totalDebt
      );
  }

  /**
   * Tổng hợp công nợ theo tháng hóa đơn.
   *
   * @returns {Array<{
   *   month: string,
   *   totalDebt: number,
   *   invoiceCount: number,
   *   roomCount: number,
   *   roomIds: string[],
   *   invoiceIds: string[],
   *   invoices: object[]
   * }>}
   */
  getDebtByMonth() {
    const groups = new Map();

    this.getOutstandingInvoices()
      .forEach((invoice) => {
        const month = invoice.period;

        if (!groups.has(month)) {
          groups.set(month, {
            month,
            totalDebt: 0,
            invoiceCount: 0,
            roomCount: 0,
            roomIds: [],
            invoiceIds: [],
            invoices: []
          });
        }

        const group =
          groups.get(month);

        group.totalDebt =
          roundMoney(
            group.totalDebt +
            invoice.remainingDebt
          );

        group.invoiceCount += 1;

        group.invoiceIds.push(
          invoice.id
        );

        group.invoices.push(
          cloneJson(invoice)
        );

        if (
          !group.roomIds.includes(
            invoice.roomId
          )
        ) {
          group.roomIds.push(
            invoice.roomId
          );

          group.roomCount += 1;
        }
      });

    return [...groups.values()]
      .sort(
        (firstGroup, secondGroup) =>
          String(secondGroup.month)
            .localeCompare(
              String(firstGroup.month)
            )
      );
  }

  /**
   * Tính số ngày quá hạn.
   *
   * Nếu currentDate chưa sau dueDate, kết quả bằng 0.
   *
   * @param {string} dueDate Ngày đến hạn YYYY-MM-DD.
   * @param {string} currentDate Ngày hiện tại YYYY-MM-DD.
   * @returns {number}
   */
  calculateDaysOverdue(
    dueDate,
    currentDate
  ) {
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

    const dueTime =
      dateToUtcMilliseconds(
        normalizedDueDate
      );

    const currentTime =
      dateToUtcMilliseconds(
        normalizedCurrentDate
      );

    if (currentTime <= dueTime) {
      return 0;
    }

    return Math.floor(
      (
        currentTime - dueTime
      ) /
      MILLISECONDS_PER_DAY
    );
  }
}

/**
 * Instance DebtService dùng chung.
 */
export const debtService =
  new DebtService();

export default debtService;