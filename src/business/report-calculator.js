/**
 * Các trạng thái phòng dùng trong báo cáo.
 */
export const REPORT_ROOM_STATUS = Object.freeze({
  VACANT: 'vacant',
  OCCUPIED: 'occupied',
  REPAIR: 'repair',
  OTHER: 'other'
});

/**
 * Các trạng thái hóa đơn dùng trong báo cáo.
 */
export const REPORT_INVOICE_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
});

const ROOM_STATUS_LABELS = Object.freeze({
  [REPORT_ROOM_STATUS.VACANT]:
    'Phòng trống',

  [REPORT_ROOM_STATUS.OCCUPIED]:
    'Đang thuê',

  [REPORT_ROOM_STATUS.REPAIR]:
    'Sửa chữa',

  [REPORT_ROOM_STATUS.OTHER]:
    'Trạng thái khác'
});

const INVOICE_STATUS_LABELS = Object.freeze({
  [REPORT_INVOICE_STATUS.UNPAID]:
    'Chưa thanh toán',

  [REPORT_INVOICE_STATUS.PARTIAL]:
    'Thanh toán một phần',

  [REPORT_INVOICE_STATUS.PAID]:
    'Đã thanh toán',

  [REPORT_INVOICE_STATUS.OVERDUE]:
    'Quá hạn',

  [REPORT_INVOICE_STATUS.CANCELLED]:
    'Đã hủy'
});

const PAYMENT_METHOD_LABELS = Object.freeze({
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  transfer: 'Chuyển khoản',
  eWallet: 'Ví điện tử',
  other: 'Khác'
});

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
 * Làm tròn tiền đến hai chữ số thập phân.
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
 * Chuẩn hóa một mảng.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @param {string} fieldName Tên dữ liệu.
 * @returns {Array}
 */
function normalizeArray(
  value,
  fieldName
) {
  if (!Array.isArray(value)) {
    throw new TypeError(
      `${fieldName} phải là một mảng.`
    );
  }

  return value;
}

/**
 * Chuẩn hóa số không âm.
 *
 * Giá trị rỗng được thay bằng defaultValue.
 *
 * @param {*} value Giá trị.
 * @param {string} fieldName Tên trường.
 * @param {number} [defaultValue=0] Giá trị mặc định.
 * @returns {number}
 */
function normalizeNonNegativeNumber(
  value,
  fieldName,
  defaultValue = 0
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return defaultValue;
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

  const isValidDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValidDate) {
    throw new Error(
      `${fieldName} không phải ngày hợp lệ.`
    );
  }

  return normalizedValue;
}

/**
 * Chuẩn hóa tháng YYYY-MM.
 *
 * @param {*} value Giá trị tháng.
 * @param {string} [fieldName='Tháng'] Tên trường.
 * @returns {string}
 */
function normalizeMonthKey(
  value,
  fieldName = 'Tháng'
) {
  if (typeof value !== 'string') {
    throw new TypeError(
      `${fieldName} phải là chuỗi YYYY-MM.`
    );
  }

  const normalizedValue = value.trim();

  const match =
    /^(\d{4})-(\d{2})$/.exec(
      normalizedValue
    );

  if (!match) {
    throw new Error(
      `${fieldName} phải đúng định dạng YYYY-MM.`
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (
    !Number.isInteger(year) ||
    year < 1
  ) {
    throw new Error(
      `Năm của ${fieldName.toLocaleLowerCase('vi-VN')} không hợp lệ.`
    );
  }

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      `${fieldName} phải có tháng từ 01 đến 12.`
    );
  }

  return normalizedValue;
}

/**
 * Chuyển ngày sang UTC milliseconds.
 *
 * @param {string} value Ngày YYYY-MM-DD.
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
 * Cộng số ngày vào ngày YYYY-MM-DD.
 *
 * @param {string} value Ngày ban đầu.
 * @param {number} days Số ngày cần cộng.
 * @returns {string}
 */
function addDays(value, days) {
  const normalizedDate =
    normalizeDate(value, 'Ngày');

  if (
    !Number.isInteger(days)
  ) {
    throw new TypeError(
      'Số ngày cần cộng phải là số nguyên.'
    );
  }

  const date = new Date(
    dateToUtcMilliseconds(
      normalizedDate
    )
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date.toISOString().slice(0, 10);
}

/**
 * Chuẩn hóa trạng thái phòng.
 *
 * @param {*} status Trạng thái gốc.
 * @returns {string}
 */
function normalizeRoomStatus(status) {
  const normalizedStatus =
    String(status ?? '')
      .trim()
      .toLocaleLowerCase('vi-VN');

  if (
    [
      'vacant',
      'empty',
      'available'
    ].includes(normalizedStatus)
  ) {
    return REPORT_ROOM_STATUS.VACANT;
  }

  if (
    [
      'occupied',
      'rented',
      'renting'
    ].includes(normalizedStatus)
  ) {
    return REPORT_ROOM_STATUS.OCCUPIED;
  }

  if (
    [
      'repair',
      'maintenance',
      'under_repair'
    ].includes(normalizedStatus)
  ) {
    return REPORT_ROOM_STATUS.REPAIR;
  }

  return REPORT_ROOM_STATUS.OTHER;
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
    invoice.month,
    'Tháng hóa đơn'
  );
}

/**
 * Kiểm tra hóa đơn đã hủy.
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
 * Lấy tổng tiền hóa đơn.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {number}
 */
function getInvoiceTotal(invoice) {
  return normalizeNonNegativeNumber(
    invoice.total,
    'Tổng tiền hóa đơn'
  );
}

/**
 * Lấy số tiền hóa đơn đã trả.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {number}
 */
function getInvoicePaidAmount(invoice) {
  return normalizeNonNegativeNumber(
    invoice.paidAmount,
    'Số tiền đã trả',
    0
  );
}

/**
 * Lấy số tiền còn nợ.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {number}
 */
function getInvoiceRemainingDebt(invoice) {
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

  return roundMoney(
    Math.max(
      getInvoiceTotal(invoice) -
        getInvoicePaidAmount(invoice),
      0
    )
  );
}

/**
 * Kiểm tra hợp đồng đang có hiệu lực tại ngày được chọn.
 *
 * @param {object} contract Hợp đồng.
 * @param {string} currentDate Ngày hiện tại.
 * @returns {boolean}
 */
function isContractActiveOnDate(
  contract,
  currentDate
) {
  if (!isPlainObject(contract)) {
    return false;
  }

  if (contract.status !== 'active') {
    return false;
  }

  const startDate =
    normalizeDate(
      contract.startDate,
      'Ngày bắt đầu hợp đồng'
    );

  const endDate =
    normalizeDate(
      contract.actualEndDate ??
      contract.endDate,
      'Ngày kết thúc hợp đồng'
    );

  return (
    startDate <= currentDate &&
    endDate >= currentDate
  );
}

/**
 * Lấy danh sách ID người thuê từ hợp đồng.
 *
 * Hỗ trợ cả tenantIds và coTenantIds.
 *
 * @param {object} contract Hợp đồng.
 * @returns {string[]}
 */
function getContractTenantIds(contract) {
  const tenantIds = new Set();

  if (
    Array.isArray(contract.tenantIds)
  ) {
    contract.tenantIds.forEach(
      (tenantId) => {
        if (
          typeof tenantId === 'string' &&
          tenantId.trim()
        ) {
          tenantIds.add(
            tenantId.trim()
          );
        }
      }
    );
  }

  if (
    Array.isArray(contract.coTenantIds)
  ) {
    contract.coTenantIds.forEach(
      (tenantId) => {
        if (
          typeof tenantId === 'string' &&
          tenantId.trim()
        ) {
          tenantIds.add(
            tenantId.trim()
          );
        }
      }
    );
  }

  const representativeTenantId =
    contract.representativeTenantId ??
    contract.representativeId;

  if (
    typeof representativeTenantId ===
      'string' &&
    representativeTenantId.trim()
  ) {
    tenantIds.add(
      representativeTenantId.trim()
    );
  }

  return [...tenantIds];
}

/**
 * Lấy lượng điện tiêu thụ của bản ghi.
 *
 * @param {object} reading Bản ghi điện nước.
 * @returns {number}
 */
function getElectricityUsage(reading) {
  if (
    reading.electricityUsage !== undefined
  ) {
    return normalizeNonNegativeNumber(
      reading.electricityUsage,
      'Lượng điện tiêu thụ'
    );
  }

  if (
    reading.electricUsage !== undefined
  ) {
    return normalizeNonNegativeNumber(
      reading.electricUsage,
      'Lượng điện tiêu thụ'
    );
  }

  const oldIndex =
    normalizeNonNegativeNumber(
      reading.electricityPrevious ??
      reading.electricOld,
      'Chỉ số điện cũ'
    );

  const newIndex =
    normalizeNonNegativeNumber(
      reading.electricityCurrent ??
      reading.electricNew,
      'Chỉ số điện mới'
    );

  if (newIndex < oldIndex) {
    throw new Error(
      'Chỉ số điện mới không được nhỏ hơn chỉ số điện cũ.'
    );
  }

  return newIndex - oldIndex;
}

/**
 * Lấy lượng nước tiêu thụ của bản ghi.
 *
 * @param {object} reading Bản ghi điện nước.
 * @returns {number}
 */
function getWaterUsage(reading) {
  if (
    reading.waterUsage !== undefined
  ) {
    return normalizeNonNegativeNumber(
      reading.waterUsage,
      'Lượng nước tiêu thụ'
    );
  }

  const oldIndex =
    normalizeNonNegativeNumber(
      reading.waterPrevious ??
      reading.waterOld,
      'Chỉ số nước cũ'
    );

  const newIndex =
    normalizeNonNegativeNumber(
      reading.waterCurrent ??
      reading.waterNew,
      'Chỉ số nước mới'
    );

  if (newIndex < oldIndex) {
    throw new Error(
      'Chỉ số nước mới không được nhỏ hơn chỉ số nước cũ.'
    );
  }

  return newIndex - oldIndex;
}

/**
 * Lấy tháng của bản ghi điện nước.
 *
 * @param {object} reading Bản ghi.
 * @returns {string}
 */
function getReadingMonth(reading) {
  return normalizeMonthKey(
    reading.period ??
    reading.month ??
    reading.monthKey,
    'Tháng ghi chỉ số'
  );
}

/**
 * Chuẩn hóa phương thức thanh toán.
 *
 * @param {*} value Phương thức gốc.
 * @returns {string}
 */
function normalizePaymentMethod(value) {
  const method =
    String(value ?? '')
      .trim()
      .toLocaleLowerCase('vi-VN')
      .replace(/[\s_-]+/g, '');

  if (method === 'cash') {
    return 'cash';
  }

  if (
    [
      'bank',
      'banking'
    ].includes(method)
  ) {
    return 'bank';
  }

  if (
    [
      'transfer',
      'banktransfer',
      'chuyenkhoan'
    ].includes(method)
  ) {
    return 'transfer';
  }

  if (
    [
      'ewallet',
      'momo',
      'zalopay',
      'vnpay'
    ].includes(method)
  ) {
    return 'eWallet';
  }

  return 'other';
}

/**
 * Chuẩn hóa trạng thái thanh toán của hóa đơn.
 *
 * Trạng thái được tính lại từ tổng tiền, đã trả và hạn thanh toán.
 *
 * @param {object} invoice Hóa đơn.
 * @param {string} currentDate Ngày hiện tại.
 * @returns {string}
 */
function determineReportInvoiceStatus(
  invoice,
  currentDate
) {
  if (isCancelledInvoice(invoice)) {
    return REPORT_INVOICE_STATUS.CANCELLED;
  }

  const total =
    getInvoiceTotal(invoice);

  const paidAmount =
    getInvoicePaidAmount(invoice);

  const remainingDebt =
    getInvoiceRemainingDebt(invoice);

  if (
    total === 0 ||
    paidAmount >= total ||
    remainingDebt === 0
  ) {
    return REPORT_INVOICE_STATUS.PAID;
  }

  const dueDate =
    normalizeDate(
      invoice.dueDate,
      'Ngày đến hạn'
    );

  if (currentDate > dueDate) {
    return REPORT_INVOICE_STATUS.OVERDUE;
  }

  if (paidAmount > 0) {
    return REPORT_INVOICE_STATUS.PARTIAL;
  }

  return REPORT_INVOICE_STATUS.UNPAID;
}

/**
 * Tạo dữ liệu labels/data phù hợp cho thư viện biểu đồ.
 *
 * @param {object[]} records Danh sách dữ liệu.
 * @param {string} labelKey Khóa nhãn.
 * @param {string} dataKey Khóa giá trị.
 * @returns {{labels: string[], data: number[]}}
 */
export function createChartSeries(
  records,
  labelKey,
  dataKey
) {
  normalizeArray(
    records,
    'Dữ liệu biểu đồ'
  );

  if (
    typeof labelKey !== 'string' ||
    !labelKey
  ) {
    throw new TypeError(
      'Khóa nhãn biểu đồ không hợp lệ.'
    );
  }

  if (
    typeof dataKey !== 'string' ||
    !dataKey
  ) {
    throw new TypeError(
      'Khóa dữ liệu biểu đồ không hợp lệ.'
    );
  }

  return {
    labels: records.map(
      (record) =>
        String(record[labelKey] ?? '')
    ),

    data: records.map(
      (record, index) =>
        normalizeNonNegativeNumber(
          record[dataKey],
          `Giá trị biểu đồ thứ ${index + 1}`
        )
    )
  };
}

/**
 * Tính số phòng theo trạng thái và tỷ lệ lấp đầy.
 *
 * @param {object[]} rooms Danh sách phòng.
 * @returns {{
 *   totalRooms: number,
 *   vacantRooms: number,
 *   occupiedRooms: number,
 *   repairRooms: number,
 *   otherRooms: number,
 *   occupancyRate: number,
 *   statusItems: object[]
 * }}
 */
export function calculateRoomStatistics(
  rooms
) {
  normalizeArray(
    rooms,
    'Danh sách phòng'
  );

  const counts = {
    [REPORT_ROOM_STATUS.VACANT]: 0,
    [REPORT_ROOM_STATUS.OCCUPIED]: 0,
    [REPORT_ROOM_STATUS.REPAIR]: 0,
    [REPORT_ROOM_STATUS.OTHER]: 0
  };

  rooms.forEach((room, index) => {
    if (!isPlainObject(room)) {
      throw new TypeError(
        `Phòng thứ ${index + 1} phải là một object.`
      );
    }

    counts[
      normalizeRoomStatus(room.status)
    ] += 1;
  });

  const totalRooms = rooms.length;

  const occupiedRooms =
    counts[
      REPORT_ROOM_STATUS.OCCUPIED
    ];

  const occupancyRate =
    totalRooms === 0
      ? 0
      : Number(
          (
            occupiedRooms /
            totalRooms *
            100
          ).toFixed(2)
        );

  return {
    totalRooms,

    vacantRooms:
      counts[
        REPORT_ROOM_STATUS.VACANT
      ],

    occupiedRooms,

    repairRooms:
      counts[
        REPORT_ROOM_STATUS.REPAIR
      ],

    otherRooms:
      counts[
        REPORT_ROOM_STATUS.OTHER
      ],

    occupancyRate,

    statusItems: Object.values(
      REPORT_ROOM_STATUS
    ).map((status) => ({
      status,
      label:
        ROOM_STATUS_LABELS[status],
      count: counts[status]
    }))
  };
}

/**
 * Tính tổng số người thuê hiện tại.
 *
 * Một người xuất hiện trong nhiều hợp đồng chỉ được tính một lần.
 *
 * @param {object[]} contracts Danh sách hợp đồng.
 * @param {string} currentDate Ngày hiện tại.
 * @returns {number}
 */
export function calculateCurrentTenantCount(
  contracts,
  currentDate
) {
  normalizeArray(
    contracts,
    'Danh sách hợp đồng'
  );

  const normalizedCurrentDate =
    normalizeDate(
      currentDate,
      'Ngày hiện tại'
    );

  const tenantIds = new Set();

  contracts
    .filter((contract) =>
      isContractActiveOnDate(
        contract,
        normalizedCurrentDate
      )
    )
    .forEach((contract) => {
      getContractTenantIds(contract)
        .forEach((tenantId) => {
          tenantIds.add(tenantId);
        });
    });

  return tenantIds.size;
}

/**
 * Tổng hợp tổng giá trị hóa đơn theo tháng.
 *
 * Hóa đơn đã hủy không được tính.
 *
 * @param {object[]} invoices Danh sách hóa đơn.
 * @returns {Array<{
 *   month: string,
 *   invoiceValue: number,
 *   invoiceCount: number
 * }>}
 */
export function calculateInvoiceValueByMonth(
  invoices
) {
  normalizeArray(
    invoices,
    'Danh sách hóa đơn'
  );

  const groups = new Map();

  invoices
    .filter(
      (invoice) =>
        !isCancelledInvoice(invoice)
    )
    .forEach((invoice, index) => {
      if (!isPlainObject(invoice)) {
        throw new TypeError(
          `Hóa đơn thứ ${index + 1} phải là một object.`
        );
      }

      const month =
        getInvoiceMonth(invoice);

      const total =
        getInvoiceTotal(invoice);

      if (!groups.has(month)) {
        groups.set(month, {
          month,
          invoiceValue: 0,
          invoiceCount: 0
        });
      }

      const group = groups.get(month);

      group.invoiceValue =
        roundMoney(
          group.invoiceValue +
          total
        );

      group.invoiceCount += 1;
    });

  return [...groups.values()]
    .sort(
      (firstGroup, secondGroup) =>
        firstGroup.month.localeCompare(
          secondGroup.month
        )
    );
}

/**
 * Tổng hợp số tiền thực thu theo tháng thanh toán.
 *
 * @param {object[]} payments Danh sách giao dịch.
 * @returns {Array<{
 *   month: string,
 *   collectedAmount: number,
 *   paymentCount: number
 * }>}
 */
export function calculateCollectedAmountByMonth(
  payments
) {
  normalizeArray(
    payments,
    'Danh sách thanh toán'
  );

  const groups = new Map();

  payments.forEach((payment, index) => {
    if (!isPlainObject(payment)) {
      throw new TypeError(
        `Giao dịch thứ ${index + 1} phải là một object.`
      );
    }

    const paymentDate =
      normalizeDate(
        payment.paymentDate ??
        payment.date,
        `Ngày giao dịch thứ ${index + 1}`
      );

    const month =
      paymentDate.slice(0, 7);

    const amount =
      normalizeNonNegativeNumber(
        payment.amount,
        `Số tiền giao dịch thứ ${index + 1}`
      );

    if (!groups.has(month)) {
      groups.set(month, {
        month,
        collectedAmount: 0,
        paymentCount: 0
      });
    }

    const group = groups.get(month);

    group.collectedAmount =
      roundMoney(
        group.collectedAmount +
        amount
      );

    group.paymentCount += 1;
  });

  return [...groups.values()]
    .sort(
      (firstGroup, secondGroup) =>
        firstGroup.month.localeCompare(
          secondGroup.month
        )
    );
}

/**
 * Tính tổng công nợ.
 *
 * @param {object[]} invoices Danh sách hóa đơn.
 * @returns {number}
 */
export function calculateTotalDebt(
  invoices
) {
  normalizeArray(
    invoices,
    'Danh sách hóa đơn'
  );

  return roundMoney(
    invoices
      .filter(
        (invoice) =>
          !isCancelledInvoice(invoice)
      )
      .reduce(
        (totalDebt, invoice) =>
          totalDebt +
          getInvoiceRemainingDebt(
            invoice
          ),
        0
      )
  );
}

/**
 * Đếm số hóa đơn quá hạn còn nợ.
 *
 * @param {object[]} invoices Danh sách hóa đơn.
 * @param {string} currentDate Ngày hiện tại.
 * @returns {number}
 */
export function countOverdueInvoices(
  invoices,
  currentDate
) {
  normalizeArray(
    invoices,
    'Danh sách hóa đơn'
  );

  const normalizedCurrentDate =
    normalizeDate(
      currentDate,
      'Ngày hiện tại'
    );

  return invoices.filter(
    (invoice) =>
      determineReportInvoiceStatus(
        invoice,
        normalizedCurrentDate
      ) ===
      REPORT_INVOICE_STATUS.OVERDUE
  ).length;
}

/**
 * Tổng hợp điện và nước tiêu thụ theo tháng.
 *
 * @param {object[]} readings Danh sách bản ghi.
 * @returns {Array<{
 *   month: string,
 *   electricityUsage: number,
 *   waterUsage: number,
 *   readingCount: number
 * }>}
 */
export function calculateMeterUsageByMonth(
  readings
) {
  normalizeArray(
    readings,
    'Danh sách chỉ số điện nước'
  );

  const groups = new Map();

  readings.forEach((reading, index) => {
    if (!isPlainObject(reading)) {
      throw new TypeError(
        `Bản ghi chỉ số thứ ${index + 1} phải là một object.`
      );
    }

    const month =
      getReadingMonth(reading);

    if (!groups.has(month)) {
      groups.set(month, {
        month,
        electricityUsage: 0,
        waterUsage: 0,
        readingCount: 0
      });
    }

    const group = groups.get(month);

    group.electricityUsage +=
      getElectricityUsage(reading);

    group.waterUsage +=
      getWaterUsage(reading);

    group.readingCount += 1;
  });

  return [...groups.values()]
    .sort(
      (firstGroup, secondGroup) =>
        firstGroup.month.localeCompare(
          secondGroup.month
        )
    );
}

/**
 * Tổng hợp điện tiêu thụ theo phòng.
 *
 * @param {object[]} readings Danh sách chỉ số.
 * @param {object[]} rooms Danh sách phòng.
 * @param {string|null} [month=null] Tháng cần lọc.
 * @returns {Array<{
 *   roomId: string,
 *   roomCode: string,
 *   roomName: string,
 *   label: string,
 *   electricityUsage: number,
 *   readingCount: number
 * }>}
 */
export function calculateElectricUsageByRoom(
  readings,
  rooms,
  month = null
) {
  normalizeArray(
    readings,
    'Danh sách chỉ số điện nước'
  );

  normalizeArray(
    rooms,
    'Danh sách phòng'
  );

  const normalizedMonth =
    month === null ||
    month === undefined ||
    month === ''
      ? null
      : normalizeMonthKey(
          month,
          'Tháng lọc điện'
        );

  const roomById = new Map(
    rooms
      .filter(isPlainObject)
      .map((room) => [
        room.id,
        room
      ])
  );

  const groups = new Map();

  readings
    .filter((reading) => {
      if (!normalizedMonth) {
        return true;
      }

      return (
        getReadingMonth(reading) ===
        normalizedMonth
      );
    })
    .forEach((reading) => {
      const roomId =
        String(reading.roomId ?? '')
          .trim();

      if (!roomId) {
        throw new Error(
          'Bản ghi chỉ số thiếu ID phòng.'
        );
      }

      if (!groups.has(roomId)) {
        groups.set(roomId, {
          roomId,
          electricityUsage: 0,
          readingCount: 0
        });
      }

      const group = groups.get(roomId);

      group.electricityUsage +=
        getElectricityUsage(reading);

      group.readingCount += 1;
    });

  return [...groups.values()]
    .map((group) => {
      const room =
        roomById.get(group.roomId);

      const roomCode =
        room?.code ??
        group.roomId;

      const roomName =
        room?.name ?? '';

      return {
        ...group,
        roomCode,
        roomName,

        label: roomName
          ? `${roomCode} — ${roomName}`
          : roomCode
      };
    })
    .sort(
      (firstGroup, secondGroup) => {
        const usageComparison =
          secondGroup.electricityUsage -
          firstGroup.electricityUsage;

        if (usageComparison !== 0) {
          return usageComparison;
        }

        return firstGroup.roomCode
          .localeCompare(
            secondGroup.roomCode,
            'vi'
          );
      }
    );
}

/**
 * Tính tỷ lệ trạng thái hóa đơn.
 *
 * @param {object[]} invoices Danh sách hóa đơn.
 * @param {string} currentDate Ngày hiện tại.
 * @returns {Array<{
 *   status: string,
 *   label: string,
 *   count: number,
 *   percentage: number
 * }>}
 */
export function calculateInvoiceStatusDistribution(
  invoices,
  currentDate
) {
  normalizeArray(
    invoices,
    'Danh sách hóa đơn'
  );

  const normalizedCurrentDate =
    normalizeDate(
      currentDate,
      'Ngày hiện tại'
    );

  const counts = {
    [REPORT_INVOICE_STATUS.UNPAID]: 0,
    [REPORT_INVOICE_STATUS.PARTIAL]: 0,
    [REPORT_INVOICE_STATUS.PAID]: 0,
    [REPORT_INVOICE_STATUS.OVERDUE]: 0,
    [REPORT_INVOICE_STATUS.CANCELLED]: 0
  };

  invoices.forEach((invoice) => {
    const status =
      determineReportInvoiceStatus(
        invoice,
        normalizedCurrentDate
      );

    counts[status] += 1;
  });

  const totalInvoices =
    invoices.length;

  return Object.values(
    REPORT_INVOICE_STATUS
  ).map((status) => ({
    status,

    label:
      INVOICE_STATUS_LABELS[status],

    count: counts[status],

    percentage:
      totalInvoices === 0
        ? 0
        : Number(
            (
              counts[status] /
              totalInvoices *
              100
            ).toFixed(2)
          )
  }));
}

/**
 * Tổng hợp thanh toán theo phương thức.
 *
 * @param {object[]} payments Danh sách giao dịch.
 * @returns {Array<{
 *   method: string,
 *   label: string,
 *   totalAmount: number,
 *   paymentCount: number
 * }>}
 */
export function calculatePaymentsByMethod(
  payments
) {
  normalizeArray(
    payments,
    'Danh sách thanh toán'
  );

  const groups = new Map();

  payments.forEach((payment, index) => {
    if (!isPlainObject(payment)) {
      throw new TypeError(
        `Giao dịch thứ ${index + 1} phải là một object.`
      );
    }

    const method =
      normalizePaymentMethod(
        payment.method
      );

    const amount =
      normalizeNonNegativeNumber(
        payment.amount,
        `Số tiền giao dịch thứ ${index + 1}`
      );

    if (!groups.has(method)) {
      groups.set(method, {
        method,

        label:
          PAYMENT_METHOD_LABELS[
            method
          ],

        totalAmount: 0,
        paymentCount: 0
      });
    }

    const group =
      groups.get(method);

    group.totalAmount =
      roundMoney(
        group.totalAmount +
        amount
      );

    group.paymentCount += 1;
  });

  return [...groups.values()]
    .sort(
      (firstGroup, secondGroup) =>
        secondGroup.totalAmount -
        firstGroup.totalAmount
    );
}

/**
 * Lấy các hợp đồng sắp hết hạn.
 *
 * @param {object[]} contracts Danh sách hợp đồng.
 * @param {string} currentDate Ngày hiện tại.
 * @param {number} [days=30] Số ngày cần cảnh báo.
 * @returns {Array<{
 *   contract: object,
 *   contractId: string,
 *   contractCode: string,
 *   roomId: string,
 *   endDate: string,
 *   daysRemaining: number
 * }>}
 */
export function calculateExpiringContracts(
  contracts,
  currentDate,
  days = 30
) {
  normalizeArray(
    contracts,
    'Danh sách hợp đồng'
  );

  const normalizedCurrentDate =
    normalizeDate(
      currentDate,
      'Ngày hiện tại'
    );

  if (
    !Number.isInteger(days) ||
    days < 0
  ) {
    throw new Error(
      'Số ngày cảnh báo phải là số nguyên không âm.'
    );
  }

  const warningEndDate =
    addDays(
      normalizedCurrentDate,
      days
    );

  const currentTime =
    dateToUtcMilliseconds(
      normalizedCurrentDate
    );

  return contracts
    .filter(
      (contract) =>
        contract?.status === 'active'
    )
    .map((contract) => {
      const endDate =
        normalizeDate(
          contract.endDate,
          'Ngày kết thúc hợp đồng'
        );

      const daysRemaining =
        Math.ceil(
          (
            dateToUtcMilliseconds(
              endDate
            ) -
            currentTime
          ) /
          MILLISECONDS_PER_DAY
        );

      return {
        contract:
          cloneJson(contract),

        contractId:
          contract.id,

        contractCode:
          contract.code ??
          contract.id,

        roomId:
          contract.roomId,

        endDate,
        daysRemaining
      };
    })
    .filter(
      (item) =>
        item.endDate >=
          normalizedCurrentDate &&
        item.endDate <=
          warningEndDate
    )
    .sort(
      (firstItem, secondItem) =>
        firstItem.daysRemaining -
        secondItem.daysRemaining
    );
}