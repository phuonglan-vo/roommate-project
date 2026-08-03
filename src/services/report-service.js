import roomService from './room-service.js';
import contractService from './contract-service.js';
import invoiceService from './invoice-service.js';
import paymentService from './payment-service.js';
import meterReadingService from './meter-reading-service.js';

import {
  calculateCollectedAmountByMonth,
  calculateCurrentTenantCount,
  calculateElectricUsageByRoom,
  calculateExpiringContracts,
  calculateInvoiceStatusDistribution,
  calculateInvoiceValueByMonth,
  calculateMeterUsageByMonth,
  calculatePaymentsByMethod,
  calculateRoomStatistics,
  calculateTotalDebt,
  countOverdueInvoices,
  createChartSeries
} from '../business/report-calculator.js';

/**
 * Lấy ngày hiện tại tại Việt Nam.
 *
 * @returns {string} Ngày YYYY-MM-DD.
 */
function getCurrentDateInVietnam() {
  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'Asia/Ho_Chi_Minh',

        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    ).formatToParts(new Date());

  const values =
    Object.fromEntries(
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
 * Kiểm tra ngày YYYY-MM-DD.
 *
 * @param {*} value Giá trị cần kiểm tra.
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

  const normalizedValue =
    value.trim();

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

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(
      `${fieldName} không phải ngày hợp lệ.`
    );
  }

  return normalizedValue;
}

/**
 * Kiểm tra tháng YYYY-MM.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @returns {string|null}
 */
function normalizeOptionalMonth(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new TypeError(
      'Tháng lọc phải là chuỗi YYYY-MM.'
    );
  }

  const normalizedValue =
    value.trim();

  const match =
    /^(\d{4})-(\d{2})$/.exec(
      normalizedValue
    );

  if (!match) {
    throw new Error(
      'Tháng lọc phải đúng định dạng YYYY-MM.'
    );
  }

  const month = Number(match[2]);

  if (
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      'Tháng lọc phải nằm trong khoảng từ 01 đến 12.'
    );
  }

  return normalizedValue;
}

/**
 * Trộn danh sách tháng từ nhiều nguồn và sắp xếp tăng dần.
 *
 * @param {object[]} invoiceValues Tổng hóa đơn theo tháng.
 * @param {object[]} collectedValues Thực thu theo tháng.
 * @returns {string[]}
 */
function getCombinedMonths(
  invoiceValues,
  collectedValues
) {
  return [
    ...new Set([
      ...invoiceValues.map(
        (item) => item.month
      ),

      ...collectedValues.map(
        (item) => item.month
      )
    ])
  ].sort();
}

/**
 * Tạo biểu đồ so sánh tổng hóa đơn và thực thu.
 *
 * @param {object[]} invoiceValues Tổng hóa đơn.
 * @param {object[]} collectedValues Thực thu.
 * @returns {{
 *   labels: string[],
 *   invoiceValues: number[],
 *   collectedAmounts: number[]
 * }}
 */
function createRevenueChart(
  invoiceValues,
  collectedValues
) {
  const months =
    getCombinedMonths(
      invoiceValues,
      collectedValues
    );

  const invoiceValueByMonth =
    new Map(
      invoiceValues.map(
        (item) => [
          item.month,
          item.invoiceValue
        ]
      )
    );

  const collectedAmountByMonth =
    new Map(
      collectedValues.map(
        (item) => [
          item.month,
          item.collectedAmount
        ]
      )
    );

  return {
    labels: months,

    invoiceValues: months.map(
      (month) =>
        invoiceValueByMonth.get(
          month
        ) ?? 0
    ),

    collectedAmounts: months.map(
      (month) =>
        collectedAmountByMonth.get(
          month
        ) ?? 0
    )
  };
}

/**
 * Kiểm tra các service phụ thuộc.
 *
 * @param {object} dependencies Danh sách service.
 * @returns {true}
 */
function validateDependencies(
  dependencies
) {
  const requirements = [
    [
      dependencies.roomService,
      'getRooms',
      'RoomService'
    ],

    [
      dependencies.contractService,
      'getContracts',
      'ContractService'
    ],

    [
      dependencies.invoiceService,
      'getInvoices',
      'InvoiceService'
    ],

    [
      dependencies.paymentService,
      'getPayments',
      'PaymentService'
    ],

    [
      dependencies.meterReadingService,
      'getReadings',
      'MeterReadingService'
    ]
  ];

  requirements.forEach(
    ([
      service,
      methodName,
      serviceName
    ]) => {
      if (
        !service ||
        typeof service[methodName] !==
          'function'
      ) {
        throw new TypeError(
          `${serviceName} không hợp lệ.`
        );
      }
    }
  );

  return true;
}

/**
 * Service tổng hợp dữ liệu báo cáo.
 *
 * ReportService không thao tác DOM và không chứa mã Chart.js.
 */
export class ReportService {
  /**
   * @param {object} [dependencies={}] Các service phụ thuộc.
   */
  constructor(
    dependencies = {}
  ) {
    this.roomService =
      dependencies.roomService ??
      roomService;

    this.contractService =
      dependencies.contractService ??
      contractService;

    this.invoiceService =
      dependencies.invoiceService ??
      invoiceService;

    this.paymentService =
      dependencies.paymentService ??
      paymentService;

    this.meterReadingService =
      dependencies.meterReadingService ??
      meterReadingService;

    validateDependencies(this);
  }

  /**
   * Lấy thống kê tổng số phòng và tỷ lệ lấp đầy.
   *
   * @returns {object}
   */
  getRoomStatistics() {
    return calculateRoomStatistics(
      this.roomService.getRooms()
    );
  }

  /**
   * Lấy tổng số người thuê hiện tại.
   *
   * @param {string} [currentDate] Ngày hiện tại.
   * @returns {number}
   */
  getCurrentTenantCount(
    currentDate =
      getCurrentDateInVietnam()
  ) {
    const normalizedCurrentDate =
      normalizeDate(
        currentDate,
        'Ngày hiện tại'
      );

    return calculateCurrentTenantCount(
      this.contractService
        .getContracts(),

      normalizedCurrentDate
    );
  }

  /**
   * Lấy tổng giá trị hóa đơn theo tháng.
   *
   * Đây là giá trị đã lập hóa đơn, không phải tiền thực thu.
   *
   * @returns {object[]}
   */
  getInvoiceValueByMonth() {
    return calculateInvoiceValueByMonth(
      this.invoiceService
        .getInvoices()
    );
  }

  /**
   * Lấy số tiền thực thu theo tháng thanh toán.
   *
   * @returns {object[]}
   */
  getCollectedAmountByMonth() {
    return calculateCollectedAmountByMonth(
      this.paymentService
        .getPayments()
    );
  }

  /**
   * Lấy tổng công nợ hiện tại.
   *
   * @returns {number}
   */
  getTotalDebt() {
    return calculateTotalDebt(
      this.invoiceService
        .getInvoices()
    );
  }

  /**
   * Lấy số hóa đơn quá hạn.
   *
   * @param {string} [currentDate] Ngày hiện tại.
   * @returns {number}
   */
  getOverdueInvoiceCount(
    currentDate =
      getCurrentDateInVietnam()
  ) {
    const normalizedCurrentDate =
      normalizeDate(
        currentDate,
        'Ngày hiện tại'
      );

    return countOverdueInvoices(
      this.invoiceService
        .getInvoices(),

      normalizedCurrentDate
    );
  }

  /**
   * Lấy tổng điện và nước tiêu thụ theo tháng.
   *
   * @returns {object[]}
   */
  getMeterUsageByMonth() {
    return calculateMeterUsageByMonth(
      this.meterReadingService
        .getReadings()
    );
  }

  /**
   * Lấy điện tiêu thụ theo phòng.
   *
   * @param {string|null} [month=null] Tháng cần lọc.
   * @returns {object[]}
   */
  getElectricUsageByRoom(
    month = null
  ) {
    const normalizedMonth =
      normalizeOptionalMonth(month);

    return calculateElectricUsageByRoom(
      this.meterReadingService
        .getReadings(),

      this.roomService.getRooms(),

      normalizedMonth
    );
  }

  /**
   * Lấy tỷ lệ trạng thái hóa đơn.
   *
   * @param {string} [currentDate] Ngày hiện tại.
   * @returns {object[]}
   */
  getInvoiceStatusDistribution(
    currentDate =
      getCurrentDateInVietnam()
  ) {
    const normalizedCurrentDate =
      normalizeDate(
        currentDate,
        'Ngày hiện tại'
      );

    return calculateInvoiceStatusDistribution(
      this.invoiceService
        .getInvoices(),

      normalizedCurrentDate
    );
  }

  /**
   * Lấy tổng thanh toán theo phương thức.
   *
   * @returns {object[]}
   */
  getPaymentsByMethod() {
    return calculatePaymentsByMethod(
      this.paymentService
        .getPayments()
    );
  }

  /**
   * Lấy hợp đồng sắp hết hạn.
   *
   * @param {object} [options={}] Tùy chọn.
   * @param {string} [options.currentDate] Ngày hiện tại.
   * @param {number} [options.days=30] Số ngày cảnh báo.
   * @returns {object[]}
   */
  getExpiringContracts({
    currentDate =
      getCurrentDateInVietnam(),

    days = 30
  } = {}) {
    const normalizedCurrentDate =
      normalizeDate(
        currentDate,
        'Ngày hiện tại'
      );

    return calculateExpiringContracts(
      this.contractService
        .getContracts(),

      normalizedCurrentDate,
      days
    );
  }

  /**
   * Lấy toàn bộ dữ liệu báo cáo.
   *
   * Kết quả gồm dữ liệu chi tiết và dữ liệu đã chuyển sang
   * labels/data để có thể truyền vào thư viện biểu đồ.
   *
   * @param {object} [options={}] Tùy chọn.
   * @param {string} [options.currentDate] Ngày hiện tại.
   * @param {number} [options.expiringDays=30] Số ngày cảnh báo hợp đồng.
   * @param {string|null} [options.electricityMonth=null] Tháng lọc điện theo phòng.
   * @returns {object}
   */
  getReportData({
    currentDate =
      getCurrentDateInVietnam(),

    expiringDays = 30,

    electricityMonth = null
  } = {}) {
    const normalizedCurrentDate =
      normalizeDate(
        currentDate,
        'Ngày hiện tại'
      );

    const normalizedElectricityMonth =
      normalizeOptionalMonth(
        electricityMonth
      );

    const rooms =
      this.roomService.getRooms();

    const contracts =
      this.contractService
        .getContracts();

    const invoices =
      this.invoiceService
        .getInvoices();

    const payments =
      this.paymentService
        .getPayments();

    const readings =
      this.meterReadingService
        .getReadings();

    const roomStatistics =
      calculateRoomStatistics(
        rooms
      );

    const currentTenantCount =
      calculateCurrentTenantCount(
        contracts,
        normalizedCurrentDate
      );

    const invoiceValueByMonth =
      calculateInvoiceValueByMonth(
        invoices
      );

    const collectedAmountByMonth =
      calculateCollectedAmountByMonth(
        payments
      );

    const meterUsageByMonth =
      calculateMeterUsageByMonth(
        readings
      );

    const electricUsageByRoom =
      calculateElectricUsageByRoom(
        readings,
        rooms,
        normalizedElectricityMonth
      );

    const invoiceStatusDistribution =
      calculateInvoiceStatusDistribution(
        invoices,
        normalizedCurrentDate
      );

    const paymentsByMethod =
      calculatePaymentsByMethod(
        payments
      );

    const expiringContracts =
      calculateExpiringContracts(
        contracts,
        normalizedCurrentDate,
        expiringDays
      );

    const totalDebt =
      calculateTotalDebt(invoices);

    const overdueInvoiceCount =
      countOverdueInvoices(
        invoices,
        normalizedCurrentDate
      );

    return {
      generatedAt:
        new Date().toISOString(),

      currentDate:
        normalizedCurrentDate,

      metrics: {
        totalRooms:
          roomStatistics.totalRooms,

        vacantRooms:
          roomStatistics.vacantRooms,

        occupiedRooms:
          roomStatistics.occupiedRooms,

        repairRooms:
          roomStatistics.repairRooms,

        otherRooms:
          roomStatistics.otherRooms,

        occupancyRate:
          roomStatistics.occupancyRate,

        currentTenantCount,

        totalDebt,

        overdueInvoiceCount,

        expiringContractCount:
          expiringContracts.length
      },

      details: {
        roomStatistics,

        invoiceValueByMonth,

        collectedAmountByMonth,

        meterUsageByMonth,

        electricUsageByRoom,

        invoiceStatusDistribution,

        paymentsByMethod,

        expiringContracts
      },

      charts: {
        roomStatus: {
          labels:
            roomStatistics
              .statusItems
              .map(
                (item) =>
                  item.label
              ),

          data:
            roomStatistics
              .statusItems
              .map(
                (item) =>
                  item.count
              ),

          statuses:
            roomStatistics
              .statusItems
              .map(
                (item) =>
                  item.status
              )
        },

        monthlyRevenue:
          createRevenueChart(
            invoiceValueByMonth,
            collectedAmountByMonth
          ),

        monthlyMeterUsage: {
          labels:
            meterUsageByMonth.map(
              (item) => item.month
            ),

          electricityUsage:
            meterUsageByMonth.map(
              (item) =>
                item.electricityUsage
            ),

          waterUsage:
            meterUsageByMonth.map(
              (item) =>
                item.waterUsage
            )
        },

        electricityByRoom: {
          ...createChartSeries(
            electricUsageByRoom,
            'label',
            'electricityUsage'
          ),

          roomIds:
            electricUsageByRoom.map(
              (item) =>
                item.roomId
            )
        },

        invoiceStatus: {
          labels:
            invoiceStatusDistribution
              .map(
                (item) =>
                  item.label
              ),

          data:
            invoiceStatusDistribution
              .map(
                (item) =>
                  item.count
              ),

          percentages:
            invoiceStatusDistribution
              .map(
                (item) =>
                  item.percentage
              ),

          statuses:
            invoiceStatusDistribution
              .map(
                (item) =>
                  item.status
              )
        },

        paymentMethods: {
          labels:
            paymentsByMethod.map(
              (item) => item.label
            ),

          data:
            paymentsByMethod.map(
              (item) =>
                item.totalAmount
            ),

          counts:
            paymentsByMethod.map(
              (item) =>
                item.paymentCount
            ),

          methods:
            paymentsByMethod.map(
              (item) =>
                item.method
            )
        }
      }
    };
  }
}

/**
 * Instance ReportService dùng chung.
 */
export const reportService =
  new ReportService();

export default reportService;