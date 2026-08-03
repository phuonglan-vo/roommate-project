import {
  describe,
  expect,
  it
} from 'vitest';

import {
  formatVietnameseCurrency
} from '../../../src/utils/currency-utils.js';

function expectVietnameseCurrency(
  actual,
  expectedNumber
) {
  expect(actual).toMatch(
    new RegExp(
      `^${expectedNumber.replaceAll(
        '.',
        '\\.'
      )}\\s₫$`
    )
  );
}

describe('currency-utils', () => {
  describe(
    'formatVietnameseCurrency',
    () => {
      it('định dạng số nguyên thành tiền Việt Nam', () => {
        expectVietnameseCurrency(
          formatVietnameseCurrency(
            1_800_000
          ),
          '1.800.000'
        );
      });

      it('chấp nhận chuỗi số có khoảng trắng hai đầu', () => {
        expectVietnameseCurrency(
          formatVietnameseCurrency(
            ' 2500000 '
          ),
          '2.500.000'
        );
      });

      it('định dạng giá trị 0', () => {
        expectVietnameseCurrency(
          formatVietnameseCurrency(0),
          '0'
        );
      });

      it('định dạng số âm', () => {
        expectVietnameseCurrency(
          formatVietnameseCurrency(
            -1500
          ),
          '-1.500'
        );
      });

      it('làm tròn phần thập phân theo định dạng VND', () => {
        expectVietnameseCurrency(
          formatVietnameseCurrency(
            12.5
          ),
          '13'
        );
      });

      it.each([
        '',
        '   '
      ])(
        'ném TypeError với chuỗi rỗng %p',
        (value) => {
          expect(() =>
            formatVietnameseCurrency(
              value
            )
          ).toThrow(TypeError);
        }
      );

      it.each([
        '1.800.000 ₫',
        '12abc',
        '1,2,3',
        'NaN'
      ])(
        'ném TypeError với chuỗi không hợp lệ %p',
        (value) => {
          expect(() =>
            formatVietnameseCurrency(
              value
            )
          ).toThrow(TypeError);
        }
      );

      it.each([
        null,
        undefined,
        true,
        {},
        [],
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY
      ])(
        'ném TypeError với dữ liệu không hợp lệ %p',
        (value) => {
          expect(() =>
            formatVietnameseCurrency(
              value
            )
          ).toThrow(TypeError);
        }
      );

      it('ném RangeError khi chuỗi số vượt quá giới hạn hữu hạn', () => {
        expect(() =>
          formatVietnameseCurrency(
            '9'.repeat(400)
          )
        ).toThrow(RangeError);
      });
    }
  );
});