import {
  describe,
  expect,
  it
} from 'vitest';

import {
  INVOICE_PAYMENT_STATUS
} from '../../../src/constants/statuses.js';

import {
  calculateDiscount,
  calculateElectricAmount,
  calculateFixedServiceAmount,
  calculateInvoiceTotal,
  calculatePerPersonAmount,
  calculateRemainingDebt,
  calculateSubtotal,
  calculateWaterAmount,
  determineInvoiceStatus
} from '../../../src/business/invoice-calculator.js';

describe('invoice-calculator', () => {
  describe('calculateElectricAmount', () => {
    it('tính đúng tiền điện', () => {
      expect(
        calculateElectricAmount(45, 3500)
      ).toBe(157500);
    });

    it('xử lý đúng chuỗi số hợp lệ', () => {
      expect(
        calculateElectricAmount(
          '45',
          '3500'
        )
      ).toBe(157500);
    });

    it('không chấp nhận NaN', () => {
      expect(() =>
        calculateElectricAmount(
          Number.NaN,
          3500
        )
      ).toThrow(TypeError);

      expect(() =>
        calculateElectricAmount(
          45,
          Number.NaN
        )
      ).toThrow(TypeError);
    });
  });

  describe('calculateWaterAmount', () => {
    it('tính đúng tiền nước', () => {
      expect(
        calculateWaterAmount(12, 15000)
      ).toBe(180000);
    });

    it('không chấp nhận số âm', () => {
      expect(() =>
        calculateWaterAmount(-1, 15000)
      ).toThrow(/không được là số âm/);
    });
  });

  describe(
    'calculateFixedServiceAmount',
    () => {
      it('tính đúng dịch vụ cố định', () => {
        expect(
          calculateFixedServiceAmount(
            120000
          )
        ).toBe(120000);
      });

      it('xử lý đúng đơn giá dạng chuỗi', () => {
        expect(
          calculateFixedServiceAmount(
            '120000'
          )
        ).toBe(120000);
      });
    }
  );

  describe(
    'calculatePerPersonAmount',
    () => {
      it('tính đúng dịch vụ theo người', () => {
        expect(
          calculatePerPersonAmount(
            3,
            50000
          )
        ).toBe(150000);
      });

      it('báo lỗi khi số người không phải số nguyên', () => {
        expect(() =>
          calculatePerPersonAmount(
            2.5,
            50000
          )
        ).toThrow(
          'Số người phải là số nguyên không âm.'
        );
      });
    }
  );

  describe('calculateSubtotal', () => {
    it('tính tổng các khoản từ amount và quantity nhân unitPrice', () => {
      const items = [
        {
          name: 'Tiền phòng',
          amount: 3000000
        },
        {
          name: 'Tiền điện',
          quantity: 45,
          unitPrice: 3500
        },
        {
          name: 'Tiền nước',
          quantity: 12,
          unitPrice: 15000
        }
      ];

      expect(
        calculateSubtotal(items)
      ).toBe(3337500);
    });

    it('trả về 0 khi danh sách dòng hóa đơn rỗng', () => {
      expect(
        calculateSubtotal([])
      ).toBe(0);
    });

    it('không chấp nhận NaN trong dòng hóa đơn', () => {
      expect(() =>
        calculateSubtotal([
          {
            amount: Number.NaN
          }
        ])
      ).toThrow(TypeError);
    });
  });

  describe('calculateDiscount', () => {
    it('áp dụng đúng giảm giá', () => {
      expect(
        calculateDiscount(
          1000000,
          150000
        )
      ).toBe(150000);
    });

    it.each([
      0,
      undefined,
      null,
      ''
    ])(
      'coi giảm giá %p là 0',
      (discount) => {
        expect(
          calculateDiscount(
            1000000,
            discount
          )
        ).toBe(0);
      }
    );

    it('báo lỗi khi giảm giá lớn hơn tạm tính', () => {
      expect(() =>
        calculateDiscount(
          1000000,
          1000001
        )
      ).toThrow(
        'Giảm giá không được lớn hơn tạm tính.'
      );
    });

    it('không chấp nhận NaN', () => {
      expect(() =>
        calculateDiscount(
          1000000,
          Number.NaN
        )
      ).toThrow(TypeError);
    });
  });

  describe('calculateInvoiceTotal', () => {
    it('tính tổng tiền sau giảm giá', () => {
      const items = [
        {
          amount: 3000000
        },
        {
          amount: 500000
        }
      ];

      expect(
        calculateInvoiceTotal(
          items,
          200000
        )
      ).toBe(3300000);
    });

    it('báo lỗi khi giảm giá làm tổng tiền âm', () => {
      expect(() =>
        calculateInvoiceTotal(
          [
            {
              amount: 100000
            }
          ],
          100001
        )
      ).toThrow(
        'Giảm giá không được lớn hơn tạm tính.'
      );
    });

    it('không chấp nhận dòng tiền âm', () => {
      expect(() =>
        calculateInvoiceTotal([
          {
            amount: -1
          }
        ])
      ).toThrow(/không được là số âm/);
    });
  });

  describe(
    'calculateRemainingDebt',
    () => {
      it('tính đúng số tiền còn nợ', () => {
        expect(
          calculateRemainingDebt(
            3500000,
            1200000
          )
        ).toBe(2300000);
      });

      it('trả về 0 khi đã trả nhiều hơn tổng tiền', () => {
        expect(
          calculateRemainingDebt(
            1000000,
            1200000
          )
        ).toBe(0);
      });

      it('không cho tổng tiền âm', () => {
        expect(() =>
          calculateRemainingDebt(
            -1,
            0
          )
        ).toThrow(
          'Tổng tiền không được là số âm.'
        );
      });

      it('không chấp nhận NaN', () => {
        expect(() =>
          calculateRemainingDebt(
            Number.NaN,
            0
          )
        ).toThrow(TypeError);
      });
    }
  );

  describe(
    'determineInvoiceStatus',
    () => {
      const dueDate =
        '2026-08-10';

      it('xác định trạng thái chưa thanh toán', () => {
        expect(
          determineInvoiceStatus(
            1000000,
            0,
            dueDate,
            '2026-08-10'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS.UNPAID
        );
      });

      it('xác định trạng thái thanh toán một phần', () => {
        expect(
          determineInvoiceStatus(
            1000000,
            400000,
            dueDate,
            '2026-08-09'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS
            .PARTIALLY_PAID
        );
      });

      it('xác định trạng thái đã thanh toán', () => {
        expect(
          determineInvoiceStatus(
            1000000,
            1000000,
            dueDate,
            '2026-08-11'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS.PAID
        );
      });

      it('vẫn xác định đã thanh toán khi trả thừa', () => {
        expect(
          determineInvoiceStatus(
            1000000,
            1200000,
            dueDate,
            '2026-08-11'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS.PAID
        );
      });

      it('xác định trạng thái quá hạn khi chưa trả đủ', () => {
        expect(
          determineInvoiceStatus(
            1000000,
            0,
            dueDate,
            '2026-08-11'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS.OVERDUE
        );
      });

      it('xác định quá hạn ngay cả khi đã thanh toán một phần', () => {
        expect(
          determineInvoiceStatus(
            1000000,
            400000,
            dueDate,
            '2026-08-11'
          )
        ).toBe(
          INVOICE_PAYMENT_STATUS.OVERDUE
        );
      });

      it('không chấp nhận tổng tiền âm', () => {
        expect(() =>
          determineInvoiceStatus(
            -1,
            0,
            dueDate,
            '2026-08-09'
          )
        ).toThrow(
          'Tổng tiền không được là số âm.'
        );
      });

      it('không chấp nhận NaN', () => {
        expect(() =>
          determineInvoiceStatus(
            1000000,
            Number.NaN,
            dueDate,
            '2026-08-09'
          )
        ).toThrow(TypeError);
      });
    }
  );
});