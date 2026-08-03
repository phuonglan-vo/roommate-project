import {
  describe,
  expect,
  it
} from 'vitest';

import {
  INVOICE_DOCUMENT_STATUS,
  INVOICE_PAYMENT_STATUS
} from '../../../src/constants/statuses.js';

import {
  validateInvoice
} from '../../../src/business/invoice-validator.js';

function createValidInvoice(
  overrides = {}
) {
  return {
    id: 'invoice-001',
    code: 'HD-202608-001',
    roomId: 'room-01',
    contractId: 'contract-01',
    period: '2026-08',
    issueDate: '2026-08-01',
    dueDate: '2026-08-10',

    documentStatus:
      INVOICE_DOCUMENT_STATUS.DRAFT,

    items: [
      {
        id: 'item-rent',
        name: 'Tiền phòng',
        quantity: 1,
        unitPrice: 3000000,
        amount: 3000000
      },
      {
        id: 'item-electricity',
        name: 'Tiền điện',
        quantity: 45,
        unitPrice: 3500,
        amount: 157500
      },
      {
        id: 'item-water',
        name: 'Tiền nước',
        quantity: 12,
        unitPrice: 15000,
        amount: 180000
      }
    ],

    discount: 100000,
    paidAmount: 0,

    ...overrides
  };
}

describe('invoice-validator', () => {
  describe('validateInvoice', () => {
    it('chuẩn hóa hóa đơn hợp lệ và tính đúng các tổng tiền', () => {
      const invoice =
        createValidInvoice();

      const result =
        validateInvoice(invoice);

      expect(result.subtotal).toBe(
        3337500
      );

      expect(result.discount).toBe(
        100000
      );

      expect(result.total).toBe(
        3237500
      );

      expect(result.paidAmount).toBe(
        0
      );

      expect(
        result.remainingDebt
      ).toBe(3237500);
    });

    it('không làm thay đổi object hóa đơn đầu vào', () => {
      const invoice =
        createValidInvoice();

      const original =
        structuredClone(invoice);

      const result =
        validateInvoice(invoice);

      expect(invoice).toEqual(
        original
      );

      expect(result).not.toBe(
        invoice
      );

      expect(result.items).not.toBe(
        invoice.items
      );
    });

    it('xử lý đúng các giá trị tiền dạng chuỗi số hợp lệ', () => {
      const result =
        validateInvoice(
          createValidInvoice({
            items: [
              {
                name: 'Tiền phòng',
                quantity: '1',
                unitPrice: '3000000',
                amount: '3000000'
              },
              {
                name: 'Tiền điện',
                quantity: '45',
                unitPrice: '3500',
                amount: '157500'
              }
            ],

            discount: '50000',
            paidAmount: '1000000'
          })
        );

      expect(result.subtotal).toBe(
        3157500
      );

      expect(result.discount).toBe(
        50000
      );

      expect(result.total).toBe(
        3107500
      );

      expect(result.paidAmount).toBe(
        1000000
      );

      expect(
        result.remainingDebt
      ).toBe(2107500);
    });

    it('hỗ trợ month và discountAmount rồi chuẩn hóa sang period và discount', () => {
      const invoice =
        createValidInvoice({
          period: undefined,
          month: '2026-08',
          discount: undefined,
          discountAmount: 50000
        });

      const result =
        validateInvoice(invoice);

      expect(result.period).toBe(
        '2026-08'
      );

      expect(result.discount).toBe(
        50000
      );

      expect(
        result
      ).not.toHaveProperty('month');

      expect(
        result
      ).not.toHaveProperty(
        'discountAmount'
      );
    });

    it('tự tính trạng thái chưa thanh toán', () => {
      const result =
        validateInvoice(
          createValidInvoice({
            paidAmount: 0,
            currentDate:
              '2026-08-10'
          })
        );

      expect(
        result.paymentStatus
      ).toBe(
        INVOICE_PAYMENT_STATUS.UNPAID
      );

      expect(
        result
      ).not.toHaveProperty(
        'currentDate'
      );
    });

    it('tự tính trạng thái thanh toán một phần', () => {
      const result =
        validateInvoice(
          createValidInvoice({
            paidAmount: 1000000,
            currentDate:
              '2026-08-09'
          })
        );

      expect(
        result.paymentStatus
      ).toBe(
        INVOICE_PAYMENT_STATUS
          .PARTIALLY_PAID
      );
    });

    it('tự tính trạng thái đã thanh toán', () => {
      const result =
        validateInvoice(
          createValidInvoice({
            paidAmount: 3237500,
            currentDate:
              '2026-08-11'
          })
        );

      expect(
        result.paymentStatus
      ).toBe(
        INVOICE_PAYMENT_STATUS.PAID
      );

      expect(
        result.remainingDebt
      ).toBe(0);
    });

    it('tự tính trạng thái quá hạn', () => {
      const result =
        validateInvoice(
          createValidInvoice({
            paidAmount: 0,
            currentDate:
              '2026-08-11'
          })
        );

      expect(
        result.paymentStatus
      ).toBe(
        INVOICE_PAYMENT_STATUS.OVERDUE
      );
    });

    it('báo lỗi khi giảm giá lớn hơn tạm tính', () => {
      expect(() =>
        validateInvoice(
          createValidInvoice({
            items: [
              {
                name: 'Tiền phòng',
                amount: 100000
              }
            ],

            discount: 100001
          })
        )
      ).toThrow(
        'Giảm giá không được lớn hơn tạm tính.'
      );
    });

    it('không cho tổng tiền được lưu là số âm', () => {
      expect(() =>
        validateInvoice(
          createValidInvoice({
            total: -1
          })
        )
      ).toThrow(
        'Tổng tiền không được là số âm.'
      );
    });

    it('báo lỗi khi tổng tiền được lưu không khớp dữ liệu hóa đơn', () => {
      expect(() =>
        validateInvoice(
          createValidInvoice({
            total: 1000000
          })
        )
      ).toThrow(
        'Tổng tiền được lưu không khớp với dữ liệu hóa đơn.'
      );
    });

    it('không chấp nhận NaN ở thành tiền dòng hóa đơn', () => {
      expect(() =>
        validateInvoice(
          createValidInvoice({
            items: [
              {
                name: 'Tiền phòng',
                amount: Number.NaN
              }
            ]
          })
        )
      ).toThrow(TypeError);
    });

    it('không chấp nhận NaN ở số tiền đã trả', () => {
      expect(() =>
        validateInvoice(
          createValidInvoice({
            paidAmount:
              Number.NaN
          })
        )
      ).toThrow(TypeError);
    });

    it('báo lỗi khi thành tiền không khớp số lượng nhân đơn giá', () => {
      expect(() =>
        validateInvoice(
          createValidInvoice({
            items: [
              {
                name: 'Tiền điện',
                quantity: 45,
                unitPrice: 3500,
                amount: 160000
              }
            ]
          })
        )
      ).toThrow(
        'Thành tiền dòng thứ 1 không khớp với số lượng nhân đơn giá.'
      );
    });

    it('báo lỗi khi hóa đơn không có dòng tiền', () => {
      expect(() =>
        validateInvoice(
          createValidInvoice({
            items: []
          })
        )
      ).toThrow(
        'Hóa đơn phải có ít nhất một dòng tiền.'
      );
    });

    it('báo lỗi khi ngày đến hạn trước ngày lập hóa đơn', () => {
      expect(() =>
        validateInvoice(
          createValidInvoice({
            issueDate:
              '2026-08-10',

            dueDate:
              '2026-08-09'
          })
        )
      ).toThrow(
        'Ngày đến hạn không được trước ngày lập hóa đơn.'
      );
    });

    it.each([
      null,
      undefined,
      [],
      'invoice'
    ])(
      'báo TypeError khi hóa đơn không phải object thường: %p',
      (invoice) => {
        expect(() =>
          validateInvoice(invoice)
        ).toThrow(TypeError);
      }
    );

    it.each([
      {
        roomId: ''
      },
      {
        period: ''
      },
      {
        period: '2026-13'
      },
      {
        issueDate:
          '2026-02-30'
      },
      {
        dueDate:
          'not-a-date'
      }
    ])(
      'báo lỗi với trường bắt buộc không hợp lệ: %p',
      (overrides) => {
        expect(() =>
          validateInvoice(
            createValidInvoice(
              overrides
            )
          )
        ).toThrow(Error);
      }
    );
  });
});