import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import {
  INVOICE_DOCUMENT_STATUS,
  INVOICE_PAYMENT_STATUS
} from '../../src/constants/statuses.js';

import {
  STORAGE_KEYS
} from '../../src/constants/storage-keys.js';

import {
  StorageService
} from '../../src/services/storage-service.js';

import {
  calculateRemainingAmount,
  calculateTotalPaid,
  determinePaymentStatus
} from '../../src/business/payment-processor.js';

import {
  canDeletePayment,
  validatePayment
} from '../../src/business/payment-validator.js';

const CURRENT_DATE = '2026-08-03';
const INVOICE_TOTAL = 2_000_000;

function createInvoiceData(overrides = {}) {
  return {
    id: 'invoice-payment-01',
    code: 'HD-PAYMENT-01',
    roomId: 'room-01',
    contractId: 'contract-01',
    period: '2026-08',

    issueDate: '2026-08-01',
    dueDate: '2026-08-10',

    items: [
      {
        id: 'invoice-item-rent',
        type: 'rent',
        name: 'Tiền phòng',
        quantity: 1,
        unitPrice: INVOICE_TOTAL,
        amount: INVOICE_TOTAL
      }
    ],

    subtotal: INVOICE_TOTAL,
    discount: 0,
    total: INVOICE_TOTAL,

    paidAmount: 0,
    remainingDebt: INVOICE_TOTAL,

    documentStatus:
      INVOICE_DOCUMENT_STATUS.FINALIZED,

    paymentStatus:
      INVOICE_PAYMENT_STATUS.UNPAID,

    ...overrides
  };
}

function createPaymentData(
  id,
  amount,
  overrides = {}
) {
  return {
    id,
    invoiceId: 'invoice-payment-01',
    amount,
    method: 'cash',
    paymentDate: CURRENT_DATE,
    note: 'Thanh toán hóa đơn',

    ...overrides
  };
}

describe(
  'Business flow: thanh toán hóa đơn',
  () => {
    let storageService;

    beforeEach(() => {
      vi.useFakeTimers();

      vi.setSystemTime(
        new Date(
          '2026-08-03T10:00:00.000Z'
        )
      );

      /*
       * Dùng LocalStorage thật của jsdom
       * và dọn dữ liệu trước mỗi test.
       */
      localStorage.clear();

      storageService =
        new StorageService(localStorage);
    });

    afterEach(() => {
      localStorage.clear();
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    function createInvoice(overrides = {}) {
      return storageService.create(
        STORAGE_KEYS.INVOICES,
        createInvoiceData(overrides)
      );
    }

    function getInvoice(invoiceId) {
      return storageService.getById(
        STORAGE_KEYS.INVOICES,
        invoiceId
      );
    }

    function getInvoicePayments(invoiceId) {
      return storageService
        .getAll(STORAGE_KEYS.PAYMENTS)
        .filter(
          (payment) =>
            payment.invoiceId === invoiceId
        );
    }

    function recalculateInvoice(invoiceId) {
      const invoice =
        getInvoice(invoiceId);

      if (!invoice) {
        throw new Error(
          `Không tìm thấy hóa đơn có ID "${invoiceId}".`
        );
      }

      const payments =
        getInvoicePayments(invoiceId);

      const paidAmount =
        calculateTotalPaid(payments);

      const remainingDebt =
        calculateRemainingAmount(
          invoice.total,
          payments
        );

      const paymentStatus =
        determinePaymentStatus(
          invoice.total,
          payments,
          invoice.dueDate,
          CURRENT_DATE
        );

      return storageService.update(
        STORAGE_KEYS.INVOICES,
        invoice.id,
        {
          paidAmount,
          remainingDebt,
          paymentStatus
        }
      );
    }

    function recordPayment(paymentData) {
      const invoice =
        getInvoice(paymentData.invoiceId);

      if (!invoice) {
        throw new Error(
          `Không tìm thấy hóa đơn có ID "${paymentData.invoiceId}".`
        );
      }

      const normalizedPayment =
        validatePayment(
          paymentData,
          invoice
        );

      const payment =
        storageService.create(
          STORAGE_KEYS.PAYMENTS,
          normalizedPayment
        );

      const updatedInvoice =
        recalculateInvoice(invoice.id);

      return {
        payment,
        invoice: updatedInvoice
      };
    }

    function deletePayment(paymentId) {
      const payment =
        storageService.getById(
          STORAGE_KEYS.PAYMENTS,
          paymentId
        );

      if (!payment) {
        throw new Error(
          `Không tìm thấy giao dịch có ID "${paymentId}".`
        );
      }

      const invoice =
        getInvoice(payment.invoiceId);

      if (
        !invoice ||
        !canDeletePayment(payment, invoice)
      ) {
        throw new Error(
          'Không thể xóa giao dịch thanh toán.'
        );
      }

      const removedPayment =
        storageService.remove(
          STORAGE_KEYS.PAYMENTS,
          payment.id
        );

      const updatedInvoice =
        recalculateInvoice(invoice.id);

      return {
        payment: removedPayment,
        invoice: updatedInvoice
      };
    }

    it(
      'thanh toán 1.200.000 rồi thanh toán tiếp 800.000',
      () => {
        const createdInvoice =
          createInvoice();

        expect(createdInvoice.total).toBe(
          2_000_000
        );

        expect(
          createdInvoice.paidAmount
        ).toBe(0);

        expect(
          createdInvoice.remainingDebt
        ).toBe(2_000_000);

        expect(
          createdInvoice.paymentStatus
        ).toBe(
          INVOICE_PAYMENT_STATUS.UNPAID
        );

        /*
         * Thanh toán lần thứ nhất:
         * 2.000.000 - 1.200.000
         * = 800.000.
         */
        const firstResult =
          recordPayment(
            createPaymentData(
              'payment-01',
              1_200_000
            )
          );

        expect(
          firstResult.payment.amount
        ).toBe(1_200_000);

        expect(
          firstResult.invoice.paidAmount
        ).toBe(1_200_000);

        expect(
          firstResult.invoice.remainingDebt
        ).toBe(800_000);

        expect(
          firstResult.invoice.paymentStatus
        ).toBe(
          INVOICE_PAYMENT_STATUS
            .PARTIALLY_PAID
        );

        /*
         * Thanh toán lần thứ hai:
         * 800.000.
         */
        const secondResult =
          recordPayment(
            createPaymentData(
              'payment-02',
              800_000
            )
          );

        expect(
          secondResult.payment.amount
        ).toBe(800_000);

        expect(
          secondResult.invoice.paidAmount
        ).toBe(2_000_000);

        expect(
          secondResult.invoice.remainingDebt
        ).toBe(0);

        expect(
          secondResult.invoice.paymentStatus
        ).toBe(
          INVOICE_PAYMENT_STATUS.PAID
        );

        const savedPayments =
          getInvoicePayments(
            createdInvoice.id
          );

        expect(savedPayments).toHaveLength(
          2
        );

        expect(
          calculateTotalPaid(savedPayments)
        ).toBe(2_000_000);

        const savedInvoice =
          getInvoice(createdInvoice.id);

        expect(savedInvoice).toMatchObject({
          total: 2_000_000,
          paidAmount: 2_000_000,
          remainingDebt: 0,

          paymentStatus:
            INVOICE_PAYMENT_STATUS.PAID
        });
      }
    );

    it(
      'không cho thanh toán vượt công nợ còn lại',
      () => {
        const invoice =
          createInvoice();

        recordPayment(
          createPaymentData(
            'payment-01',
            1_200_000
          )
        );

        /*
         * Công nợ hiện tại chỉ còn 800.000.
         */
        expect(() =>
          recordPayment(
            createPaymentData(
              'payment-over-debt',
              800_001
            )
          )
        ).toThrow(
          'Số tiền thanh toán (800001) vượt quá công nợ còn lại (800000).'
        );

        const savedInvoice =
          getInvoice(invoice.id);

        expect(savedInvoice).toMatchObject({
          paidAmount: 1_200_000,
          remainingDebt: 800_000,

          paymentStatus:
            INVOICE_PAYMENT_STATUS
              .PARTIALLY_PAID
        });

        /*
         * Giao dịch không hợp lệ không được lưu.
         */
        expect(
          getInvoicePayments(invoice.id)
        ).toHaveLength(1);

        expect(
          storageService.getById(
            STORAGE_KEYS.PAYMENTS,
            'payment-over-debt'
          )
        ).toBeNull();
      }
    );

    it(
      'xóa giao dịch thanh toán phải cập nhật lại hóa đơn',
      () => {
        const invoice =
          createInvoice();

        recordPayment(
          createPaymentData(
            'payment-01',
            1_200_000
          )
        );

        recordPayment(
          createPaymentData(
            'payment-02',
            800_000
          )
        );

        const fullyPaidInvoice =
          getInvoice(invoice.id);

        expect(
          fullyPaidInvoice.paidAmount
        ).toBe(2_000_000);

        expect(
          fullyPaidInvoice.remainingDebt
        ).toBe(0);

        expect(
          fullyPaidInvoice.paymentStatus
        ).toBe(
          INVOICE_PAYMENT_STATUS.PAID
        );

        /*
         * Xóa giao dịch 800.000:
         * số tiền đã trả trở lại 1.200.000,
         * công nợ tăng lại thành 800.000.
         */
        const deleteResult =
          deletePayment('payment-02');

        expect(
          deleteResult.payment.id
        ).toBe('payment-02');

        expect(
          deleteResult.invoice.paidAmount
        ).toBe(1_200_000);

        expect(
          deleteResult.invoice.remainingDebt
        ).toBe(800_000);

        expect(
          deleteResult.invoice.paymentStatus
        ).toBe(
          INVOICE_PAYMENT_STATUS
            .PARTIALLY_PAID
        );

        expect(
          storageService.getById(
            STORAGE_KEYS.PAYMENTS,
            'payment-02'
          )
        ).toBeNull();

        expect(
          getInvoicePayments(invoice.id)
        ).toHaveLength(1);
      }
    );

    it(
      'không cho thanh toán hóa đơn đã hủy',
      () => {
        const cancelledInvoice =
          createInvoice({
            id: 'invoice-cancelled-01',
            code: 'HD-CANCELLED-01',

            documentStatus:
              INVOICE_DOCUMENT_STATUS
                .CANCELLED
          });

        expect(() =>
          recordPayment(
            createPaymentData(
              'payment-cancelled-01',
              500_000,
              {
                invoiceId:
                  cancelledInvoice.id
              }
            )
          )
        ).toThrow(
          'Không thể thanh toán hóa đơn đã hủy.'
        );

        expect(
          getInvoicePayments(
            cancelledInvoice.id
          )
        ).toEqual([]);

        const savedInvoice =
          getInvoice(cancelledInvoice.id);

        expect(savedInvoice).toMatchObject({
          paidAmount: 0,
          remainingDebt: 2_000_000,

          documentStatus:
            INVOICE_DOCUMENT_STATUS
              .CANCELLED,

          paymentStatus:
            INVOICE_PAYMENT_STATUS
              .UNPAID
        });
      }
    );
  }
);