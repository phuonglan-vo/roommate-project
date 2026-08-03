import {
  describe,
  expect,
  it
} from 'vitest';

import {
  calculateElectricUsage,
  calculateUsage,
  calculateWaterUsage,
  detectAbnormalUsage,
  getPreviousMonthKey
} from '../../../src/business/meter-calculator.js';

describe('meter-calculator', () => {
  describe('calculateUsage', () => {
    it('tính đúng lượng tiêu thụ khi chỉ số cũ là 120 và mới là 165', () => {
      expect(
        calculateUsage(120, 165)
      ).toBe(45);
    });

    it('trả về 0 khi chỉ số cũ bằng chỉ số mới', () => {
      expect(
        calculateUsage(120, 120)
      ).toBe(0);
    });

    it('xử lý đúng chuỗi số hợp lệ', () => {
      expect(
        calculateUsage('120', '165')
      ).toBe(45);

      expect(
        calculateUsage('120,5', '165,5')
      ).toBe(45);
    });

    it('loại bỏ khoảng trắng ở chuỗi số hợp lệ', () => {
      expect(
        calculateUsage(
          ' 120 ',
          ' 165 '
        )
      ).toBe(45);
    });

    it('báo lỗi khi chỉ số mới nhỏ hơn chỉ số cũ', () => {
      expect(() =>
        calculateUsage(165, 120)
      ).toThrow(
        'Chỉ số mới không được nhỏ hơn chỉ số cũ.'
      );
    });

    it.each([
      [-1, 20],
      [10, -1],
      ['-1', 20],
      [10, '-1']
    ])(
      'báo lỗi khi có chỉ số âm: cũ=%p, mới=%p',
      (oldIndex, newIndex) => {
        expect(() =>
          calculateUsage(
            oldIndex,
            newIndex
          )
        ).toThrow(/không được là số âm/);
      }
    );

    it.each([
      [Number.NaN, 20],
      [10, Number.NaN]
    ])(
      'báo TypeError khi có NaN: cũ=%p, mới=%p',
      (oldIndex, newIndex) => {
        expect(() =>
          calculateUsage(
            oldIndex,
            newIndex
          )
        ).toThrow(TypeError);
      }
    );

    it.each([
      [undefined, 20],
      [null, 20],
      ['', 20],
      [10, undefined],
      [10, null],
      [10, '']
    ])(
      'báo lỗi khi chỉ số bị rỗng: cũ=%p, mới=%p',
      (oldIndex, newIndex) => {
        expect(() =>
          calculateUsage(
            oldIndex,
            newIndex
          )
        ).toThrow(/không được để trống/);
      }
    );

    it.each([
      ['abc', 20],
      [10, 'abc'],
      [true, 20],
      [10, {}]
    ])(
      'báo TypeError với dữ liệu không phải số hợp lệ: cũ=%p, mới=%p',
      (oldIndex, newIndex) => {
        expect(() =>
          calculateUsage(
            oldIndex,
            newIndex
          )
        ).toThrow(TypeError);
      }
    );

    it('sử dụng nhãn tùy chỉnh trong thông báo lỗi', () => {
      expect(() =>
        calculateUsage(
          100,
          90,
          'Đồng hồ gas'
        )
      ).toThrow(
        'Đồng hồ gas mới không được nhỏ hơn đồng hồ gas cũ.'
      );
    });

    it('báo TypeError khi nhãn không phải chuỗi', () => {
      expect(() =>
        calculateUsage(
          100,
          120,
          123
        )
      ).toThrow(TypeError);
    });
  });

  describe('calculateElectricUsage', () => {
    it('tính đúng điện tiêu thụ', () => {
      expect(
        calculateElectricUsage(
          120,
          165
        )
      ).toBe(45);
    });

    it('hiển thị đúng tên chỉ số điện khi dữ liệu sai', () => {
      expect(() =>
        calculateElectricUsage(
          165,
          120
        )
      ).toThrow(
        'Chỉ số điện mới không được nhỏ hơn chỉ số điện cũ.'
      );
    });
  });

  describe('calculateWaterUsage', () => {
    it('tính đúng nước tiêu thụ', () => {
      expect(
        calculateWaterUsage(
          30,
          42
        )
      ).toBe(12);
    });

    it('hiển thị đúng tên chỉ số nước khi dữ liệu sai', () => {
      expect(() =>
        calculateWaterUsage(
          42,
          30
        )
      ).toThrow(
        'Chỉ số nước mới không được nhỏ hơn chỉ số nước cũ.'
      );
    });
  });

  describe('detectAbnormalUsage', () => {
    it('phát hiện tiêu thụ tăng bất thường khi đạt đúng ngưỡng', () => {
      expect(
        detectAbnormalUsage(
          150,
          100,
          50
        )
      ).toBe(true);
    });

    it('phát hiện tiêu thụ tăng bất thường khi vượt ngưỡng', () => {
      expect(
        detectAbnormalUsage(
          180,
          100,
          50
        )
      ).toBe(true);
    });

    it('không xem là bất thường khi tỷ lệ tăng chưa đạt ngưỡng', () => {
      expect(
        detectAbnormalUsage(
          149,
          100,
          50
        )
      ).toBe(false);
    });

    it('không xem là bất thường khi tiêu thụ không tăng', () => {
      expect(
        detectAbnormalUsage(
          100,
          100,
          20
        )
      ).toBe(false);

      expect(
        detectAbnormalUsage(
          80,
          100,
          20
        )
      ).toBe(false);
    });

    it('xem mức tiêu thụ dương là bất thường khi kỳ trước bằng 0', () => {
      expect(
        detectAbnormalUsage(
          1,
          0,
          100
        )
      ).toBe(true);
    });

    it('không bất thường khi cả kỳ hiện tại và kỳ trước đều bằng 0', () => {
      expect(
        detectAbnormalUsage(
          0,
          0,
          100
        )
      ).toBe(false);
    });

    it('xử lý đúng các chuỗi số hợp lệ', () => {
      expect(
        detectAbnormalUsage(
          '150',
          '100',
          '50'
        )
      ).toBe(true);
    });

    it.each([
      [Number.NaN, 100, 50],
      [150, Number.NaN, 50],
      [150, 100, Number.NaN]
    ])(
      'báo TypeError khi có NaN: hiện tại=%p, kỳ trước=%p, ngưỡng=%p',
      (
        currentUsage,
        previousUsage,
        threshold
      ) => {
        expect(() =>
          detectAbnormalUsage(
            currentUsage,
            previousUsage,
            threshold
          )
        ).toThrow(TypeError);
      }
    );

    it.each([
      [-1, 100, 50],
      [150, -1, 50],
      [150, 100, -1]
    ])(
      'báo lỗi khi có giá trị âm: hiện tại=%p, kỳ trước=%p, ngưỡng=%p',
      (
        currentUsage,
        previousUsage,
        threshold
      ) => {
        expect(() =>
          detectAbnormalUsage(
            currentUsage,
            previousUsage,
            threshold
          )
        ).toThrow(/không được là số âm/);
      }
    );
  });

  describe('getPreviousMonthKey', () => {
    it('lấy đúng tháng trước trong cùng năm', () => {
      expect(
        getPreviousMonthKey(
          '2026-08'
        )
      ).toBe('2026-07');
    });

    it('lấy tháng 12 năm trước khi tháng hiện tại là tháng 1', () => {
      expect(
        getPreviousMonthKey(
          '2026-01'
        )
      ).toBe('2025-12');
    });

    it('chấp nhận khoảng trắng ở hai đầu', () => {
      expect(
        getPreviousMonthKey(
          ' 2026-08 '
        )
      ).toBe('2026-07');
    });

    it.each([
      '',
      '2026-8',
      '2026/08',
      'abc'
    ])(
      'báo lỗi với khóa tháng sai định dạng %p',
      (monthKey) => {
        expect(() =>
          getPreviousMonthKey(
            monthKey
          )
        ).toThrow(Error);
      }
    );

    it.each([
      '2026-00',
      '2026-13'
    ])(
      'báo lỗi với tháng ngoài phạm vi %p',
      (monthKey) => {
        expect(() =>
          getPreviousMonthKey(
            monthKey
          )
        ).toThrow(
          'Tháng phải nằm trong khoảng từ 01 đến 12.'
        );
      }
    );

    it('báo lỗi khi không thể xác định tháng trước của 0001-01', () => {
      expect(() =>
        getPreviousMonthKey(
          '0001-01'
        )
      ).toThrow(
        'Không thể xác định tháng trước của khóa tháng đã cho.'
      );
    });

    it.each([
      null,
      undefined,
      202608,
      {}
    ])(
      'báo TypeError khi khóa tháng không phải chuỗi: %p',
      (monthKey) => {
        expect(() =>
          getPreviousMonthKey(
            monthKey
          )
        ).toThrow(TypeError);
      }
    );
  });
});