import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import {
  compareIsoDates,
  differenceInDays,
  formatDateForDisplay,
  formatIsoDateToVietnamese,
  getCurrentIsoDateTime,
  isValidIsoDate
} from '../../../src/utils/date-utils.js';

describe('date-utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getCurrentIsoDateTime', () => {
    it('trả về thời gian hiện tại theo ISO 8601', () => {
      vi.useFakeTimers();

      vi.setSystemTime(
        new Date(
          '2026-08-03T09:42:15.123Z'
        )
      );

      expect(
        getCurrentIsoDateTime()
      ).toBe(
        '2026-08-03T09:42:15.123Z'
      );
    });
  });

  describe('isValidIsoDate', () => {
    it.each([
      '2026-08-03',
      '2024-02-29',
      '0001-01-01',
      ' 2026-12-31 '
    ])(
      'trả về true với ngày hợp lệ %s',
      (value) => {
        expect(
          isValidIsoDate(value)
        ).toBe(true);
      }
    );

    it.each([
      '',
      '   ',
      '2026-02-29',
      '2026-04-31',
      '2026-00-10',
      '2026-13-10',
      '0000-01-01',
      '03/08/2026',
      '2026-8-3',
      '2026-08-03T10:00:00.000Z',
      null,
      undefined,
      20260803,
      {},
      []
    ])(
      'trả về false với dữ liệu không hợp lệ %p',
      (value) => {
        expect(
          isValidIsoDate(value)
        ).toBe(false);
      }
    );
  });

  describe(
    'formatIsoDateToVietnamese',
    () => {
      it('định dạng ngày ISO thành dd/mm/yyyy', () => {
        expect(
          formatIsoDateToVietnamese(
            '2026-08-03'
          )
        ).toBe('03/08/2026');
      });

      it('giữ nguyên phần ngày ghi trong chuỗi ISO datetime', () => {
        expect(
          formatIsoDateToVietnamese(
            '2026-08-02T23:30:00-05:00'
          )
        ).toBe('02/08/2026');
      });

      it('chấp nhận khoảng trắng ở hai đầu', () => {
        expect(
          formatIsoDateToVietnamese(
            ' 2024-02-29T10:00:00.000Z '
          )
        ).toBe('29/02/2024');
      });

      it.each([
        '',
        '2026-02-30',
        '2026-08-03T25:00:00.000Z',
        'not-a-date'
      ])(
        'ném RangeError với chuỗi không hợp lệ %p',
        (value) => {
          expect(() =>
            formatIsoDateToVietnamese(
              value
            )
          ).toThrow(RangeError);
        }
      );

      it.each([
        null,
        undefined,
        20260803,
        {}
      ])(
        'ném TypeError với dữ liệu không phải chuỗi %p',
        (value) => {
          expect(() =>
            formatIsoDateToVietnamese(
              value
            )
          ).toThrow(TypeError);
        }
      );
    }
  );

  describe(
    'formatDateForDisplay',
    () => {
      it('định dạng ngày nhập YYYY-MM-DD', () => {
        expect(
          formatDateForDisplay(
            '2026-12-05'
          )
        ).toBe('05/12/2026');
      });

      it('xử lý đúng ngày nhuận', () => {
        expect(
          formatDateForDisplay(
            '2024-02-29'
          )
        ).toBe('29/02/2024');
      });

      it.each([
        '',
        '2026-02-29',
        '2026-08-03T00:00:00.000Z',
        '03/08/2026'
      ])(
        'ném RangeError với ngày không hợp lệ %p',
        (value) => {
          expect(() =>
            formatDateForDisplay(value)
          ).toThrow(RangeError);
        }
      );

      it('ném TypeError với dữ liệu rỗng null', () => {
        expect(() =>
          formatDateForDisplay(null)
        ).toThrow(TypeError);
      });
    }
  );

  describe('compareIsoDates', () => {
    it('trả về -1 khi ngày đầu đứng trước ngày sau', () => {
      expect(
        compareIsoDates(
          '2026-08-01',
          '2026-08-02'
        )
      ).toBe(-1);
    });

    it('trả về 0 khi hai ngày bằng nhau', () => {
      expect(
        compareIsoDates(
          '2026-08-03',
          ' 2026-08-03 '
        )
      ).toBe(0);
    });

    it('trả về 1 khi ngày đầu đứng sau ngày sau', () => {
      expect(
        compareIsoDates(
          '2026-08-04',
          '2026-08-03'
        )
      ).toBe(1);
    });

    it('ném lỗi khi một trong hai ngày không hợp lệ', () => {
      expect(() =>
        compareIsoDates(
          '2026-02-30',
          '2026-03-01'
        )
      ).toThrow(RangeError);

      expect(() =>
        compareIsoDates(
          '2026-03-01',
          null
        )
      ).toThrow(TypeError);
    });
  });

  describe('differenceInDays', () => {
    it('tính số ngày dương khi ngày kết thúc ở sau', () => {
      expect(
        differenceInDays(
          '2026-08-01',
          '2026-08-10'
        )
      ).toBe(9);
    });

    it('tính số ngày âm khi ngày kết thúc ở trước', () => {
      expect(
        differenceInDays(
          '2026-08-10',
          '2026-08-01'
        )
      ).toBe(-9);
    });

    it('trả về 0 khi hai ngày giống nhau', () => {
      expect(
        differenceInDays(
          '2026-08-03',
          '2026-08-03'
        )
      ).toBe(0);
    });

    it('tính đúng qua ngày nhuận', () => {
      expect(
        differenceInDays(
          '2024-02-28',
          '2024-03-01'
        )
      ).toBe(2);
    });

    it('ném lỗi với dữ liệu rỗng hoặc không hợp lệ', () => {
      expect(() =>
        differenceInDays(
          '',
          '2026-08-03'
        )
      ).toThrow(RangeError);

      expect(() =>
        differenceInDays(
          '2026-08-03',
          undefined
        )
      ).toThrow(TypeError);
    });
  });
});