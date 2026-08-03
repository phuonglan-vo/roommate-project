import {
  describe,
  expect,
  it
} from 'vitest';

import {
  validateMeterReading,
  validatePreviousIndex
} from '../../../src/business/meter-validator.js';

function createValidReading(
  overrides = {}
) {
  return {
    id: 'meter-001',
    roomId: 'room-01',
    period: '2026-08',
    readingDate: '2026-08-31',
    electricityPrevious: 120,
    electricityCurrent: 165,
    waterPrevious: 30,
    waterCurrent: 42,
    note: 'Bản ghi hợp lệ',
    ...overrides
  };
}

describe('meter-validator', () => {
  describe('validateMeterReading', () => {
    it('chuẩn hóa bản ghi hợp lệ và tính lượng tiêu thụ', () => {
      const reading =
        createValidReading();

      const result =
        validateMeterReading(
          reading
        );

      expect(result).toEqual({
        ...reading,
        electricityUsage: 45,
        waterUsage: 12
      });
    });

    it('không làm thay đổi object đầu vào', () => {
      const reading =
        createValidReading();

      const original = {
        ...reading
      };

      const result =
        validateMeterReading(
          reading
        );

      expect(reading).toEqual(
        original
      );

      expect(result).not.toBe(
        reading
      );
    });

    it('trả về mức tiêu thụ 0 khi chỉ số cũ bằng chỉ số mới', () => {
      const result =
        validateMeterReading(
          createValidReading({
            electricityCurrent: 120,
            waterCurrent: 30
          })
        );

      expect(
        result.electricityUsage
      ).toBe(0);

      expect(
        result.waterUsage
      ).toBe(0);
    });

    it('xử lý đúng chuỗi số hợp lệ và chuyển thành number', () => {
      const result =
        validateMeterReading(
          createValidReading({
            electricityPrevious:
              '120',
            electricityCurrent:
              '165',
            waterPrevious:
              '30,5',
            waterCurrent:
              '42,5'
          })
        );

      expect(result).toMatchObject({
        electricityPrevious: 120,
        electricityCurrent: 165,
        electricityUsage: 45,
        waterPrevious: 30.5,
        waterCurrent: 42.5,
        waterUsage: 12
      });
    });

    it('hỗ trợ monthKey và chuyển thành period', () => {
      const reading =
        createValidReading({
          period: undefined,
          monthKey: '2026-08'
        });

      const result =
        validateMeterReading(
          reading
        );

      expect(result.period).toBe(
        '2026-08'
      );

      expect(result).not.toHaveProperty(
        'monthKey'
      );
    });

    it('chuẩn hóa khoảng trắng của roomId, period, readingDate và id', () => {
      const result =
        validateMeterReading(
          createValidReading({
            id: ' meter-001 ',
            roomId: ' room-01 ',
            period: ' 2026-08 ',
            readingDate:
              ' 2026-08-31 '
          })
        );

      expect(result.id).toBe(
        'meter-001'
      );

      expect(result.roomId).toBe(
        'room-01'
      );

      expect(result.period).toBe(
        '2026-08'
      );

      expect(result.readingDate).toBe(
        '2026-08-31'
      );
    });

    it('cho phép không truyền readingDate', () => {
      const reading =
        createValidReading();

      delete reading.readingDate;

      const result =
        validateMeterReading(
          reading
        );

      expect(result).not.toHaveProperty(
        'readingDate'
      );
    });

    it('báo lỗi khi chỉ số mới nhỏ hơn chỉ số cũ', () => {
      expect(() =>
        validateMeterReading(
          createValidReading({
            electricityPrevious: 165,
            electricityCurrent: 120
          })
        )
      ).toThrow(
        'Chỉ số điện mới không được nhỏ hơn chỉ số điện cũ.'
      );
    });

    it.each([
      {
        electricityPrevious: -1
      },
      {
        electricityCurrent: -1
      },
      {
        waterPrevious: -1
      },
      {
        waterCurrent: -1
      }
    ])(
      'báo lỗi khi chỉ số âm: %p',
      (overrides) => {
        expect(() =>
          validateMeterReading(
            createValidReading(
              overrides
            )
          )
        ).toThrow(/không được là số âm/);
      }
    );

    it.each([
      {
        electricityPrevious:
          Number.NaN
      },
      {
        electricityCurrent:
          Number.NaN
      },
      {
        waterPrevious:
          Number.NaN
      },
      {
        waterCurrent:
          Number.NaN
      }
    ])(
      'báo TypeError khi chỉ số là NaN: %p',
      (overrides) => {
        expect(() =>
          validateMeterReading(
            createValidReading(
              overrides
            )
          )
        ).toThrow(TypeError);
      }
    );

    it.each([
      null,
      undefined,
      [],
      'reading'
    ])(
      'báo TypeError khi bản ghi không phải object thường: %p',
      (reading) => {
        expect(() =>
          validateMeterReading(
            reading
          )
        ).toThrow(TypeError);
      }
    );

    it.each([
      {
        roomId: ''
      },
      {
        roomId: '   '
      },
      {
        period: ''
      },
      {
        period: '2026-13'
      },
      {
        readingDate:
          '2026-02-30'
      }
    ])(
      'báo lỗi với trường bắt buộc hoặc ngày tháng không hợp lệ: %p',
      (overrides) => {
        expect(() =>
          validateMeterReading(
            createValidReading(
              overrides
            )
          )
        ).toThrow(Error);
      }
    );

    it.each([
      {
        electricityPrevious: ''
      },
      {
        electricityCurrent: null
      },
      {
        waterPrevious: undefined
      },
      {
        waterCurrent: ''
      }
    ])(
      'báo lỗi khi chỉ số bị rỗng: %p',
      (overrides) => {
        expect(() =>
          validateMeterReading(
            createValidReading(
              overrides
            )
          )
        ).toThrow(/không được để trống/);
      }
    );
  });

  describe('validatePreviousIndex', () => {
    it('trả về true khi chỉ số cũ khớp với chỉ số mới của tháng trước', () => {
      const currentReading = {
        roomId: 'room-01',
        period: '2026-08',
        electricityPrevious: 165,
        waterPrevious: 42
      };

      const previousReading = {
        roomId: 'room-01',
        period: '2026-07',
        electricityCurrent: 165,
        waterCurrent: 42
      };

      expect(
        validatePreviousIndex(
          currentReading,
          previousReading
        )
      ).toBe(true);
    });

    it('kiểm tra đúng tháng trước khi chuyển năm', () => {
      const currentReading = {
        roomId: 'room-01',
        period: '2026-01',
        electricityPrevious: 165,
        waterPrevious: 42
      };

      const previousReading = {
        roomId: 'room-01',
        period: '2025-12',
        electricityCurrent: 165,
        waterCurrent: 42
      };

      expect(
        validatePreviousIndex(
          currentReading,
          previousReading
        )
      ).toBe(true);
    });

    it('xử lý đúng chỉ số dạng chuỗi số hợp lệ', () => {
      const currentReading = {
        roomId: 'room-01',
        period: '2026-08',
        electricityPrevious: '165',
        waterPrevious: '42,5'
      };

      const previousReading = {
        roomId: 'room-01',
        period: '2026-07',
        electricityCurrent: '165',
        waterCurrent: '42,5'
      };

      expect(
        validatePreviousIndex(
          currentReading,
          previousReading
        )
      ).toBe(true);
    });

    it.each([
      null,
      undefined
    ])(
      'trả về true khi chưa có bản ghi tháng trước: %p',
      (previousReading) => {
        expect(
          validatePreviousIndex(
            {
              electricityPrevious: 0,
              waterPrevious: 0
            },
            previousReading
          )
        ).toBe(true);
      }
    );

    it('báo lỗi khi kỳ trước không phải tháng liền trước', () => {
      expect(() =>
        validatePreviousIndex(
          {
            roomId: 'room-01',
            period: '2026-08',
            electricityPrevious: 165,
            waterPrevious: 42
          },
          {
            roomId: 'room-01',
            period: '2026-06',
            electricityCurrent: 165,
            waterCurrent: 42
          }
        )
      ).toThrow(
        'Kỳ trước phải là tháng 2026-07.'
      );
    });

    it('báo lỗi khi hai bản ghi thuộc hai phòng khác nhau', () => {
      expect(() =>
        validatePreviousIndex(
          {
            roomId: 'room-01',
            period: '2026-08',
            electricityPrevious: 165,
            waterPrevious: 42
          },
          {
            roomId: 'room-02',
            period: '2026-07',
            electricityCurrent: 165,
            waterCurrent: 42
          }
        )
      ).toThrow(
        'Bản ghi hiện tại và bản ghi kỳ trước phải thuộc cùng một phòng.'
      );
    });

    it('báo lỗi khi chỉ số điện cũ không khớp tháng trước', () => {
      expect(() =>
        validatePreviousIndex(
          {
            roomId: 'room-01',
            period: '2026-08',
            electricityPrevious: 166,
            waterPrevious: 42
          },
          {
            roomId: 'room-01',
            period: '2026-07',
            electricityCurrent: 165,
            waterCurrent: 42
          }
        )
      ).toThrow(
        'Chỉ số điện cũ của kỳ hiện tại (166) phải bằng chỉ số điện mới của kỳ trước (165).'
      );
    });

    it('báo lỗi khi chỉ số nước cũ không khớp tháng trước', () => {
      expect(() =>
        validatePreviousIndex(
          {
            roomId: 'room-01',
            period: '2026-08',
            electricityPrevious: 165,
            waterPrevious: 43
          },
          {
            roomId: 'room-01',
            period: '2026-07',
            electricityCurrent: 165,
            waterCurrent: 42
          }
        )
      ).toThrow(
        'Chỉ số nước cũ của kỳ hiện tại (43) phải bằng chỉ số nước mới của kỳ trước (42).'
      );
    });

    it('báo TypeError khi chỉ số tháng trước là NaN', () => {
      expect(() =>
        validatePreviousIndex(
          {
            electricityPrevious: 165,
            waterPrevious: 42
          },
          {
            electricityCurrent:
              Number.NaN,
            waterCurrent: 42
          }
        )
      ).toThrow(TypeError);
    });

    it.each([
      null,
      undefined,
      [],
      'reading'
    ])(
      'báo TypeError khi bản ghi hiện tại không phải object thường: %p',
      (currentReading) => {
        expect(() =>
          validatePreviousIndex(
            currentReading,
            null
          )
        ).toThrow(TypeError);
      }
    );

    it.each([
      [],
      'reading',
      123
    ])(
      'báo TypeError khi bản ghi kỳ trước không phải object thường: %p',
      (previousReading) => {
        expect(() =>
          validatePreviousIndex(
            {
              electricityPrevious: 0,
              waterPrevious: 0
            },
            previousReading
          )
        ).toThrow(TypeError);
      }
    );
  });
});