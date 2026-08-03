import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import {
  CONTRACT_STATUS,
  INVOICE_DOCUMENT_STATUS,
  INVOICE_PAYMENT_STATUS,
  ROOM_STATUS
} from '../../src/constants/statuses.js';

import {
  STORAGE_KEYS
} from '../../src/constants/storage-keys.js';

import {
  SERVICE_CALCULATION_TYPE
} from '../../src/business/service-config-validator.js';

import {
  StorageService
} from '../../src/services/storage-service.js';

import {
  MeterReadingService
} from '../../src/services/meter-reading-service.js';

import {
  ServiceConfigService
} from '../../src/services/service-config-service.js';

import {
  InvoiceService
} from '../../src/services/invoice-service.js';

const INVOICE_MONTH = '2026-08';

const FIXED_NOW = new Date(
  '2026-08-03T10:00:00.000Z'
);

const EXPECTED_ELECTRICITY_USAGE = 45;
const EXPECTED_WATER_USAGE = 12;

const EXPECTED_ELECTRICITY_AMOUNT =
  157_500;

const EXPECTED_WATER_AMOUNT =
  180_000;

const EXPECTED_RENT_AMOUNT =
  3_000_000;

const EXPECTED_FIXED_SERVICE_AMOUNT =
  120_000;

const EXPECTED_INVOICE_TOTAL =
  3_457_500;

function createOccupiedRoom(
  overrides = {}
) {
  return {
    id: 'room-invoice-01',
    code: 'P-BILL-01',
    name: 'Phòng lập hóa đơn 01',
    area: 'Khu A',
    roomType: 'Phòng đơn',

    /*
     * Giá phòng hiện tại khác giá trong
     * hợp đồng để kiểm tra hóa đơn lấy
     * đúng giá thuê đã ký.
     */
    monthlyRent: 3_500_000,

    maxOccupants: 2,
    status: ROOM_STATUS.OCCUPIED,

    ...overrides
  };
}

function createTenant(
  overrides = {}
) {
  return {
    id: 'tenant-invoice-01',
    fullName: 'Nguyễn Văn An',
    phone: '0901234567',

    identityNumber:
      '079203001234',

    vehiclePlates: [],

    ...overrides
  };
}

function createActiveContract({
  roomId,
  tenantId,
  ...overrides
}) {
  return {
    id: 'contract-invoice-01',
    code: 'HD-BILL-01',

    roomId,

    tenantIds: [
      tenantId
    ],

    representativeTenantId:
      tenantId,

    startDate: '2026-08-01',
    endDate: '2027-07-31',

    rentAmount:
      EXPECTED_RENT_AMOUNT,

    depositAmount:
      EXPECTED_RENT_AMOUNT,

    dueDay: 10,

    status:
      CONTRACT_STATUS.ACTIVE,

    ...overrides
  };
}

function createMeterReadingData(
  roomId
) {
  return {
    id: 'meter-invoice-01',

    roomId,
    period: INVOICE_MONTH,

    readingDate:
      '2026-08-31',

    electricityPrevious: 120,
    electricityCurrent: 165,

    waterPrevious: 30,
    waterCurrent: 42,

    note:
      'Chỉ số dùng để lập hóa đơn'
  };
}

function findInvoiceItem(
  invoice,
  predicate
) {
  const item =
    invoice.items.find(predicate);

  expect(item).toBeDefined();

  return item;
}

describe(
  'Business flow: ghi chỉ số, cấu hình dịch vụ và tạo hóa đơn',
  () => {
    let storageService;
    let meterReadingService;
    let serviceConfigService;
    let invoiceService;

    beforeEach(() => {
      vi.useFakeTimers();

      vi.setSystemTime(
        FIXED_NOW
      );

      /*
       * Dọn LocalStorage thật của jsdom
       * trước mỗi test.
       */
      localStorage.clear();

      storageService =
        new StorageService(
          localStorage
        );

      meterReadingService =
        new MeterReadingService(
          storageService
        );

      serviceConfigService =
        new ServiceConfigService(
          storageService
        );

      invoiceService =
        new InvoiceService(
          storageService
        );
    });

    afterEach(() => {
      localStorage.clear();

      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    function seedActiveRental() {
      const room =
        storageService.create(
          STORAGE_KEYS.ROOMS,
          createOccupiedRoom()
        );

      const tenant =
        storageService.create(
          STORAGE_KEYS.TENANTS,
          createTenant()
        );

      const contract =
        storageService.create(
          STORAGE_KEYS.CONTRACTS,

          createActiveContract({
            roomId: room.id,
            tenantId: tenant.id
          })
        );

      return {
        room,
        tenant,
        contract
      };
    }

    function createServiceConfigs() {
      const electricityService =
        serviceConfigService
          .createServiceConfig({
            code: 'DIEN',
            name: 'Tiền điện',
            unit: 'kWh',

            calculationType:
              SERVICE_CALCULATION_TYPE
                .USAGE,

            unitPrice: 3_500,

            isActive: true,

            effectiveFrom:
              '2026-08-01',

            description:
              'Tính theo số điện tiêu thụ'
          });

      const waterService =
        serviceConfigService
          .createServiceConfig({
            code: 'NUOC',
            name: 'Tiền nước',
            unit: 'm3',

            calculationType:
              SERVICE_CALCULATION_TYPE
                .USAGE,

            unitPrice: 15_000,

            isActive: true,

            effectiveFrom:
              '2026-08-01',

            description:
              'Tính theo số nước tiêu thụ'
          });

      const internetService =
        serviceConfigService
          .createServiceConfig({
            code: 'INTERNET',
            name: 'Internet',
            unit: 'phòng',

            calculationType:
              SERVICE_CALCULATION_TYPE
                .FIXED,

            unitPrice:
              EXPECTED_FIXED_SERVICE_AMOUNT,

            isActive: true,

            effectiveFrom:
              '2026-08-01',

            description:
              'Thu cố định theo phòng'
          });

      return {
        electricityService,
        waterService,
        internetService
      };
    }

    function createCompleteInvoiceFlow() {
      const rental =
        seedActiveRental();

      const reading =
        meterReadingService
          .createReading(
            createMeterReadingData(
              rental.room.id
            )
          );

      const services =
        createServiceConfigs();

      const invoice =
        invoiceService.createInvoice({
          roomId: rental.room.id,
          period: INVOICE_MONTH
        });

      return {
        ...rental,
        reading,
        services,
        invoice
      };
    }

    it(
      'tạo hóa đơn đúng từ hợp đồng, chỉ số điện nước và cấu hình dịch vụ',
      () => {
        const {
          room,
          contract,
          reading,
          services,
          invoice
        } = createCompleteInvoiceFlow();

        /*
         * Kiểm tra lượng điện tiêu thụ:
         * 165 - 120 = 45.
         */
        expect(
          reading.electricityUsage
        ).toBe(
          EXPECTED_ELECTRICITY_USAGE
        );

        /*
         * Kiểm tra lượng nước tiêu thụ:
         * 42 - 30 = 12.
         */
        expect(
          reading.waterUsage
        ).toBe(
          EXPECTED_WATER_USAGE
        );

        expect(
          invoice
            .meterReadingSnapshot
            .electricityUsage
        ).toBe(
          EXPECTED_ELECTRICITY_USAGE
        );

        expect(
          invoice
            .meterReadingSnapshot
            .waterUsage
        ).toBe(
          EXPECTED_WATER_USAGE
        );

        expect(
          invoice.items
        ).toHaveLength(4);

        const rentItem =
          findInvoiceItem(
            invoice,

            (item) =>
              item.type === 'rent'
          );

        const electricityItem =
          findInvoiceItem(
            invoice,

            (item) =>
              item.type ===
              'electricity'
          );

        const waterItem =
          findInvoiceItem(
            invoice,

            (item) =>
              item.type === 'water'
          );

        const internetItem =
          findInvoiceItem(
            invoice,

            (item) =>
              item.sourceId ===
              services
                .internetService.id
          );

        /*
         * Tiền phòng phải lấy từ hợp đồng:
         * 3.000.000 đồng.
         *
         * Không lấy giá phòng hiện tại:
         * 3.500.000 đồng.
         */
        expect(
          rentItem
        ).toMatchObject({
          sourceType: 'contract',
          sourceId: contract.id,
          quantity: 1,

          unitPrice:
            EXPECTED_RENT_AMOUNT,

          amount:
            EXPECTED_RENT_AMOUNT
        });

        expect(
          rentItem.unitPrice
        ).not.toBe(
          room.monthlyRent
        );

        /*
         * Tiền điện:
         * 45 × 3.500 = 157.500.
         */
        expect(
          electricityItem.quantity
        ).toBe(
          EXPECTED_ELECTRICITY_USAGE
        );

        expect(
          electricityItem.unitPrice
        ).toBe(3_500);

        expect(
          electricityItem.amount
        ).toBe(
          EXPECTED_ELECTRICITY_AMOUNT
        );

        /*
         * Tiền nước:
         * 12 × 15.000 = 180.000.
         */
        expect(
          waterItem.quantity
        ).toBe(
          EXPECTED_WATER_USAGE
        );

        expect(
          waterItem.unitPrice
        ).toBe(15_000);

        expect(
          waterItem.amount
        ).toBe(
          EXPECTED_WATER_AMOUNT
        );

        /*
         * Internet cố định:
         * 1 × 120.000 = 120.000.
         */
        expect(
          internetItem
        ).toMatchObject({
          sourceType:
            'serviceConfig',

          sourceId:
            services
              .internetService.id,

          quantity: 1,

          unitPrice:
            EXPECTED_FIXED_SERVICE_AMOUNT,

          amount:
            EXPECTED_FIXED_SERVICE_AMOUNT
        });

        /*
         * Tổng hóa đơn:
         *
         * 3.000.000 tiền phòng
         * + 157.500 tiền điện
         * + 180.000 tiền nước
         * + 120.000 Internet
         * = 3.457.500 đồng.
         */
        expect(
          invoice.subtotal
        ).toBe(
          EXPECTED_INVOICE_TOTAL
        );

        expect(
          invoice.discount
        ).toBe(0);

        expect(
          invoice.total
        ).toBe(
          EXPECTED_INVOICE_TOTAL
        );

        expect(
          invoice.paidAmount
        ).toBe(0);

        expect(
          invoice.remainingDebt
        ).toBe(
          EXPECTED_INVOICE_TOTAL
        );

        /*
         * Hóa đơn mới phải là bản nháp
         * và chưa thanh toán.
         */
        expect(
          invoice.documentStatus
        ).toBe(
          INVOICE_DOCUMENT_STATUS
            .DRAFT
        );

        expect(
          invoice.paymentStatus
        ).toBe(
          INVOICE_PAYMENT_STATUS
            .UNPAID
        );

        /*
         * Kiểm tra hóa đơn thực sự được
         * lưu vào LocalStorage của jsdom.
         */
        const savedInvoices =
          JSON.parse(
            localStorage.getItem(
              STORAGE_KEYS.INVOICES
            )
          );

        expect(
          savedInvoices
        ).toHaveLength(1);

        expect(
          savedInvoices[0]
        ).toMatchObject({
          id: invoice.id,
          roomId: room.id,

          contractId:
            contract.id,

          meterReadingId:
            reading.id,

          period:
            INVOICE_MONTH,

          total:
            EXPECTED_INVOICE_TOTAL,

          documentStatus:
            INVOICE_DOCUMENT_STATUS
              .DRAFT,

          paymentStatus:
            INVOICE_PAYMENT_STATUS
              .UNPAID
        });
      }
    );

    it(
      'không tạo hóa đơn trùng phòng và tháng',
      () => {
        const {
          room
        } = createCompleteInvoiceFlow();

        expect(() =>
          invoiceService.createInvoice({
            roomId: room.id,
            period: INVOICE_MONTH,

            code:
              'HD-BILL-DUPLICATE'
          })
        ).toThrow(
          `Phòng đã có hóa đơn trong tháng ${INVOICE_MONTH}.`
        );

        /*
         * Sau lần tạo thất bại,
         * LocalStorage vẫn chỉ có một hóa đơn.
         */
        expect(
          storageService.getAll(
            STORAGE_KEYS.INVOICES
          )
        ).toHaveLength(1);
      }
    );

    it(
      'không tạo hóa đơn khi phòng chưa có chỉ số điện nước trong tháng',
      () => {
        const {
          room
        } = seedActiveRental();

        /*
         * Phòng có hợp đồng và có cấu hình
         * dịch vụ nhưng chưa ghi chỉ số.
         */
        createServiceConfigs();

        expect(() =>
          invoiceService.createInvoice({
            roomId: room.id,
            period: INVOICE_MONTH
          })
        ).toThrow(
          `Phòng chưa có bản ghi điện nước trong tháng ${INVOICE_MONTH}.`
        );

        expect(
          storageService.getAll(
            STORAGE_KEYS.INVOICES
          )
        ).toEqual([]);
      }
    );
  }
);