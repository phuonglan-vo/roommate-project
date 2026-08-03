import {
  describe,
  expect,
  it
} from 'vitest';

import {
  isFiniteNumber,
  isNonNegativeNumber,
  toSafeNumber
} from '../../../src/utils/number-utils.js';

describe('number-utils', () => {
  describe('isFiniteNumber', () => {
    it.each([
      0,
      -0,
      12.5,
      -99,
      Number.MAX_VALUE,
      Number.MIN_VALUE
    ])(
      'trả về true với số hữu hạn %p',
      (value) => {
        expect(
          isFiniteNumber(value)
        ).toBe(true);
      }
    );

    it.each([
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      '12',
      '',
      null,
      undefined,
      true,
      {},
      []
    ])(
      'trả về false với dữ liệu không phải số hữu hạn %p',
      (value) => {
        expect(
          isFiniteNumber(value)
        ).toBe(false);
      }
    );
  });

  describe('toSafeNumber', () => {
    it.each([
      [0, 0],
      [-25, -25],
      [12.5, 12.5],
      ['1800000', 1_800_000],
      [' 42 ', 42],
      ['+12', 12],
      ['-12.5', -12.5],
      ['12,5', 12.5],
      ['-0,75', -0.75],
      ['0007', 7]
    ])(
      'chuyển %p thành %p',
      (input, expected) => {
        expect(
          toSafeNumber(input)
        ).toBe(expected);
      }
    );

    it.each([
      '',
      '   '
    ])(
      'ném TypeError với chuỗi rỗng %p',
      (value) => {
        expect(() =>
          toSafeNumber(value)
        ).toThrow(TypeError);
      }
    );

    it.each([
      '.5',
      '1.',
      '1e3',
      '1 000',
      '1.000.000',
      '1,000,000',
      '12abc',
      '--1',
      '+-1',
      'NaN',
      'Infinity'
    ])(
      'ném TypeError với chuỗi số không hợp lệ %p',
      (value) => {
        expect(() =>
          toSafeNumber(value)
        ).toThrow(TypeError);
      }
    );

    it.each([
      null,
      undefined,
      true,
      false,
      {},
      [],
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY
    ])(
      'ném TypeError với kiểu dữ liệu không hợp lệ %p',
      (value) => {
        expect(() =>
          toSafeNumber(value)
        ).toThrow(TypeError);
      }
    );

    it('ném RangeError khi chuỗi số được parse thành Infinity', () => {
      expect(() =>
        toSafeNumber(
          '9'.repeat(400)
        )
      ).toThrow(RangeError);
    });
  });

  describe(
    'isNonNegativeNumber',
    () => {
      it.each([
        0,
        -0,
        0.01,
        100,
        Number.MAX_VALUE
      ])(
        'trả về true với số không âm %p',
        (value) => {
          expect(
            isNonNegativeNumber(
              value
            )
          ).toBe(true);
        }
      );

      it.each([
        -0.01,
        -100,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        '0',
        '',
        null,
        undefined,
        true,
        {},
        []
      ])(
        'trả về false với dữ liệu không hợp lệ %p',
        (value) => {
          expect(
            isNonNegativeNumber(
              value
            )
          ).toBe(false);
        }
      );
    }
  );
});