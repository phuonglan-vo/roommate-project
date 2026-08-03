import {
  describe,
  expect,
  it
} from 'vitest';

import {
  INVOICE_PAYMENT_STATUS
} from '../../../src/constants/statuses.js';

import {
  calculateRemainingAmount,
  calculateTotalPaid,
  determinePaymentStatus,
  groupPaymentsByMethod
} from '../../../src/business/payment-processor.js';

function createPayment(
  amount,
  overrides = {}
) {
  return {
    id: `payment-${amount}`,
    invoiceId: 'invoice-01',
    amount,
    method: 'cash',
    paymentDate: '2026-08-03',
    ...overrides
  };
}

describe('payment-processor', () => {
  describe('calculateTotalPaid', () => {
    it('tính đúng tổng của một giao dịch hợp lệ', () => {
      const payments = [
        createPayment(400000)
      ];

      expect(
        calculateTotalPaid(payments)
      ).toBe(400000);
    });

    it('tính đúng tổng của nhiều giao dịch', () => {
      const payments = [
        createPayment(300000),
        createPayment(250000),
        createPayment(450000)
      ];

      expect(
        calculateTotalPaid(payments)
      ).toBe(1000000);
    });

    it('xử lý đúng số tiền dạng chuỗi hợp lệ', () => {
      const payments = [
        createPayment('300000'),
        createPayment('250000,5')
      ];

      expect(
        calculateTotalPaid(payments)
      ).toBe(550000.5);
    });

    it('trả về 0 khi chưa có giao dịch', () => {
      expect(
        calculateTotalPaid([])
      ).toBe(0);
    });

    it('báo lỗi khi thanh toán bằng 0', () => {
      expect(() =>
        calculateTotalPaid([
          createPayment(0)
        ])
      ).toThrow(
        'Số tiền giao dịch thứ 1 phải lớn hơn 0.'
      );
    });

    it('báo lỗi khi thanh toán âm', () => {
      expect(() =>
        calculateTotalPaid([
          createPayment(-100000)
        ])
      ).toThrow(
        'Số tiền giao dịch thứ 1 không được là số âm.'
      );
    });

    it('không chấp nhận NaN', () => {
      expect(() =>
        calculateTotalPaid([
          createPayment(Number.NaN)
        ])
      ).toThrow(TypeError);
    });

    it('báo TypeError khi danh sách thanh toán không phải mảng', () => {
      expect(() =>
        calculateTotalPaid(null)
      ).toThrow(TypeError);
    });

    it('báo TypeError khi một giao dịch không phải object', () => {
      expect(() =>
        calculateTotalPaid([
          null
        ])
      ).toThrow(
        'Giao dịch thứ 1 phải là một object.'
      );
    });
  });

  describe(
    'calculateRemainingAmount',
    () => {
      it('tính đúng công nợ còn lại', () => {
        const payments = [
          createPayment(300000),
          createPayment(200000)
        ];

        expect(
          calculateRemainingAmount(
            1000000,
            payments
          )
        ).toBe(500000);
      });

      it('trả về 0 khi đã thanh toán đủ', () => {
        const payments = [
          createPayment(600000),
          createPayment(400000)
        ];

        expect(
          calculateRemainingAmount(
            1000000,
            payments
          )
        ).toBe(0);
      });

      it('báo lỗi khi tổng thanh toán vượt công nợ', () => {
        const payments = [
          createPayment(700000),
          createPayment(400000)
        ];

        expect(() =>
          calculateRemainingAmount(
            1000000,
            payments
          )
        ).toThrow(
          'Tổng số tiền thanh toán (1100000) vượt quá tổng tiền hóa đơn (1000000).'
        );
      });

      it('xóa giao dịch làm tăng lại công nợ', () => {
        const invoiceTotal = 1000000;

        const payments = [
          createPayment(400000, {
            id: 'payment-01'
          }),
          createPayment(300000, {
            id: 'payment-02'
          })
        ];

        const debtBeforeDelete =
          calculateRemainingAmount(
            invoiceTotal,
            payments
          );

        const paymentsAfterDelete =
          payments.filter(
            (payment) =>
              payment.id !==
              'payment-02'
          );

        const debtAfterDelete =
          calculateRemainingAmount(
            invoiceTotal,
            paymentsAfterDelete
          );

        expect(debtBeforeDelete).toBe(
          300000
        );

        expect(debtAfterDelete).toBe(
          600000
        );

        expect(
          debtAfterDelete -
            debtBeforeDelete
        ).toBe(300000);
      });

      it('báo lỗi khi tổng tiền hóa đơn âm', () => {
        expect(() =>
          calculateRemainingAmount(
            -1,
            []
          )
        ).toThrow(
          'Tổng tiền hóa đơn không được là số âm.'
        );
      });

      it('không chấp nhận tổng tiền hóa đơn là NaN', () => {
        expect(() =>
          calculateRemainingAmount(
            Number.NaN,
            []
          )
        ).toThrow(TypeError);
      });
    }
  );

  describe(
    'determinePaymentStatus',
    () => {
      const invoiceTotal = 1000000;
      const dueDate = '2026-08-10';

      it('xác định trạng thái chưa thanh toán', () => {
        expect(
          determinePaymentStatus(
            invoiceTotal,
            [],
            dueDate,
            '2026-08-10'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS.UNPAID
        );
      });

      it('xác định trạng thái thanh toán một phần', () => {
        const payments = [
          createPayment(400000)
        ];

        expect(
          determinePaymentStatus(
            invoiceTotal,
            payments,
            dueDate,
            '2026-08-09'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS
            .PARTIALLY_PAID
        );
      });

      it('xác định trạng thái đã thanh toán', () => {
        const payments = [
          createPayment(600000),
          createPayment(400000)
        ];

        expect(
          determinePaymentStatus(
            invoiceTotal,
            payments,
            dueDate,
            '2026-08-11'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS.PAID
        );
      });

      it('xác định trạng thái quá hạn khi chưa thanh toán', () => {
        expect(
          determinePaymentStatus(
            invoiceTotal,
            [],
            dueDate,
            '2026-08-11'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS.OVERDUE
        );
      });

      it('xác định trạng thái quá hạn khi mới thanh toán một phần', () => {
        const payments = [
          createPayment(400000)
        ];

        expect(
          determinePaymentStatus(
            invoiceTotal,
            payments,
            dueDate,
            '2026-08-11'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS.OVERDUE
        );
      });

      it('báo lỗi khi tổng giao dịch vượt tổng hóa đơn', () => {
        expect(() =>
          determinePaymentStatus(
            invoiceTotal,
            [
              createPayment(1000001)
            ],
            dueDate,
            '2026-08-09'
          )
        ).toThrow(
          'Tổng số tiền thanh toán không được vượt quá tổng tiền hóa đơn.'
        );
      });
    }
  );

  describe(
    'groupPaymentsByMethod',
    () => {
      it('nhóm giao dịch đúng theo phương thức thanh toán', () => {
        const payments = [
          createPayment(300000, {
            id: 'payment-01',
            method: ' Cash '
          }),
          createPayment(200000, {
            id: 'payment-02',
            method: 'cash'
          }),
          createPayment(500000, {
            id: 'payment-03',
            method: 'BANK'
          })
        ];

        const result =
          groupPaymentsByMethod(
            payments
          );

        expect(result.cash).toHaveLength(
          2
        );

        expect(result.bank).toHaveLength(
          1
        );

        expect(
          result.cash[0].method
        ).toBe('cash');

        expect(
          result.bank[0].method
        ).toBe('bank');
      });

      it('không làm thay đổi danh sách giao dịch đầu vào', () => {
        const payments = [
          createPayment(300000, {
            method: ' Cash '
          })
        ];

        groupPaymentsByMethod(
          payments
        );

        expect(
          payments[0].method
        ).toBe(' Cash ');
      });
    }
  );
});