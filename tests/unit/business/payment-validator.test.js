import {
  describe,
  expect,
  it
} from 'vitest';

import {
  INVOICE_DOCUMENT_STATUS
} from '../../../src/constants/statuses.js';

import {
  canDeletePayment,
  validatePayment
} from '../../../src/business/payment-validator.js';

function createInvoice(
  overrides = {}
) {
  return {
    id: 'invoice-01',
    total: 1000000,
    paidAmount: 300000,

    documentStatus:
      INVOICE_DOCUMENT_STATUS.ISSUED,

    ...overrides
  };
}

function createPayment(
  overrides = {}
) {
  return {
    id: 'payment-01',
    invoiceId: 'invoice-01',
    amount: 400000,
    method: 'cash',
    paymentDate: '2026-08-03',
    reference: 'REF-001',
    note: 'Thanh toán tiền mặt',
    ...overrides
  };
}

describe('payment-validator', () => {
  describe('validatePayment', () => {
    it('chấp nhận một giao dịch thanh toán hợp lệ', () => {
      const payment =
        createPayment();

      const invoice =
        createInvoice();

      const result =
        validatePayment(
          payment,
          invoice
        );

      expect(result).toMatchObject({
        id: 'payment-01',
        invoiceId: 'invoice-01',
        amount: 400000,
        method: 'cash',
        paymentDate: '2026-08-03',
        reference: 'REF-001',
        note:
          'Thanh toán tiền mặt'
      });
    });

    it('không làm thay đổi giao dịch và hóa đơn đầu vào', () => {
      const payment =
        createPayment();

      const invoice =
        createInvoice();

      const paymentBefore = {
        ...payment
      };

      const invoiceBefore = {
        ...invoice
      };

      const result =
        validatePayment(
          payment,
          invoice
        );

      expect(payment).toEqual(
        paymentBefore
      );

      expect(invoice).toEqual(
        invoiceBefore
      );

      expect(result).not.toBe(payment);
    });

    it('xử lý đúng số tiền dạng chuỗi hợp lệ', () => {
      const result =
        validatePayment(
          createPayment({
            amount: '400000'
          }),
          createInvoice()
        );

      expect(result.amount).toBe(
        400000
      );
    });

    it('hỗ trợ trường date và chuẩn hóa thành paymentDate', () => {
      const payment =
        createPayment({
          paymentDate: undefined,
          date: '2026-08-03'
        });

      const result =
        validatePayment(
          payment,
          createInvoice()
        );

      expect(result.paymentDate).toBe(
        '2026-08-03'
      );

      expect(
        result
      ).not.toHaveProperty('date');
    });

    it('báo lỗi khi thanh toán bằng 0', () => {
      expect(() =>
        validatePayment(
          createPayment({
            amount: 0
          }),
          createInvoice()
        )
      ).toThrow(
        'Số tiền thanh toán phải lớn hơn 0.'
      );
    });

    it('báo lỗi khi thanh toán âm', () => {
      expect(() =>
        validatePayment(
          createPayment({
            amount: -1
          }),
          createInvoice()
        )
      ).toThrow(
        'Số tiền thanh toán không được là số âm.'
      );
    });

    it('không chấp nhận NaN', () => {
      expect(() =>
        validatePayment(
          createPayment({
            amount: Number.NaN
          }),
          createInvoice()
        )
      ).toThrow(TypeError);
    });

    it('báo lỗi khi thanh toán vượt công nợ còn lại', () => {
      const invoice =
        createInvoice({
          total: 1000000,
          paidAmount: 700000
        });

      expect(() =>
        validatePayment(
          createPayment({
            amount: 300001
          }),
          invoice
        )
      ).toThrow(
        'Số tiền thanh toán (300001) vượt quá công nợ còn lại (300000).'
      );
    });

    it('cho phép thanh toán đúng bằng công nợ còn lại', () => {
      const invoice =
        createInvoice({
          total: 1000000,
          paidAmount: 700000
        });

      const result =
        validatePayment(
          createPayment({
            amount: 300000
          }),
          invoice
        );

      expect(result.amount).toBe(
        300000
      );
    });

    it('không cho thanh toán hóa đơn đã hủy', () => {
      const invoice =
        createInvoice({
          documentStatus:
            INVOICE_DOCUMENT_STATUS
              .CANCELLED
        });

      expect(() =>
        validatePayment(
          createPayment(),
          invoice
        )
      ).toThrow(
        'Không thể thanh toán hóa đơn đã hủy.'
      );
    });

    it('hỗ trợ dữ liệu cũ dùng trường status để phát hiện hóa đơn đã hủy', () => {
      const invoice =
        createInvoice({
          documentStatus: undefined,
          status:
            INVOICE_DOCUMENT_STATUS
              .CANCELLED
        });

      expect(() =>
        validatePayment(
          createPayment(),
          invoice
        )
      ).toThrow(
        'Không thể thanh toán hóa đơn đã hủy.'
      );
    });

    it('không cho thanh toán thêm hóa đơn đã trả đủ', () => {
      const invoice =
        createInvoice({
          total: 1000000,
          paidAmount: 1000000
        });

      expect(() =>
        validatePayment(
          createPayment({
            amount: 100000
          }),
          invoice
        )
      ).toThrow(
        'Hóa đơn đã được thanh toán đủ, không thể thanh toán thêm.'
      );
    });

    it('báo lỗi khi giao dịch không thuộc hóa đơn được cung cấp', () => {
      expect(() =>
        validatePayment(
          createPayment({
            invoiceId: 'invoice-02'
          }),
          createInvoice({
            id: 'invoice-01'
          })
        )
      ).toThrow(
        'Giao dịch thanh toán không thuộc hóa đơn được cung cấp.'
      );
    });

    it('báo lỗi khi ngày thanh toán không hợp lệ', () => {
      expect(() =>
        validatePayment(
          createPayment({
            paymentDate:
              '2026-02-30'
          }),
          createInvoice()
        )
      ).toThrow(
        'Ngày thanh toán phải là ngày hợp lệ theo định dạng YYYY-MM-DD.'
      );
    });

    it('báo lỗi khi phương thức thanh toán rỗng', () => {
      expect(() =>
        validatePayment(
          createPayment({
            method: '   '
          }),
          createInvoice()
        )
      ).toThrow(
        'Phương thức thanh toán không được để trống.'
      );
    });

    it.each([
      null,
      undefined,
      [],
      'payment'
    ])(
      'báo TypeError khi giao dịch không phải object thường: %p',
      (payment) => {
        expect(() =>
          validatePayment(
            payment,
            createInvoice()
          )
        ).toThrow(TypeError);
      }
    );

    it.each([
      null,
      undefined,
      [],
      'invoice'
    ])(
      'báo TypeError khi hóa đơn không phải object thường: %p',
      (invoice) => {
        expect(() =>
          validatePayment(
            createPayment(),
            invoice
          )
        ).toThrow(TypeError);
      }
    );
  });

  describe('canDeletePayment', () => {
    it('cho phép xóa một giao dịch hợp lệ', () => {
      expect(
        canDeletePayment(
          createPayment(),
          createInvoice()
        )
      ).toBe(true);
    });

    it('không cho xóa giao dịch của hóa đơn đã hủy', () => {
      expect(
        canDeletePayment(
          createPayment(),
          createInvoice({
            documentStatus:
              INVOICE_DOCUMENT_STATUS
                .CANCELLED
          })
        )
      ).toBe(false);
    });

    it('không cho xóa giao dịch đã bị khóa', () => {
      expect(
        canDeletePayment(
          createPayment({
            isLocked: true
          }),
          createInvoice()
        )
      ).toBe(false);

      expect(
        canDeletePayment(
          createPayment({
            locked: true
          }),
          createInvoice()
        )
      ).toBe(false);
    });

    it('không cho xóa giao dịch có số tiền bằng 0', () => {
      expect(
        canDeletePayment(
          createPayment({
            amount: 0
          }),
          createInvoice()
        )
      ).toBe(false);
    });

    it('không cho xóa giao dịch âm hoặc NaN', () => {
      expect(
        canDeletePayment(
          createPayment({
            amount: -1
          }),
          createInvoice()
        )
      ).toBe(false);

      expect(
        canDeletePayment(
          createPayment({
            amount: Number.NaN
          }),
          createInvoice()
        )
      ).toBe(false);
    });

    it('không cho xóa khi giao dịch thuộc hóa đơn khác', () => {
      expect(
        canDeletePayment(
          createPayment({
            invoiceId: 'invoice-02'
          }),
          createInvoice({
            id: 'invoice-01'
          })
        )
      ).toBe(false);
    });

    it('trả về false khi dữ liệu đầu vào không phải object', () => {
      expect(
        canDeletePayment(
          null,
          createInvoice()
        )
      ).toBe(false);

      expect(
        canDeletePayment(
          createPayment(),
          null
        )
      ).toBe(false);
    });
  });
});