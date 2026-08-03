import {
  describe,
  expect,
  it
} from 'vitest';

import {
  isEmptyString,
  isValidDate,
  isValidNonNegativeNumber,
  isValidVietnamesePhone
} from '../../../src/utils/validation-utils.js';

describe('validation-utils', () => {
  describe('isEmptyString', () => {
    it.each([
      '',
      '   ',
      '\n\t'
    ])(
      'trả về true với chuỗi rỗng %p',
      (value) => {
        expect(
          isEmptyString(value)
        ).toBe(true);
      }
    );

    it.each([
      null,
      undefined,
      0,
      false,
      {},
      []
    ])(
      'trả về true với dữ liệu không phải chuỗi %p',
      (value) => {
        expect(
          isEmptyString(value)
        ).toBe(true);
      }
    );

    it.each([
      'RoomMate',
      '  Phòng 01  ',
      '0'
    ])(
      'trả về false với chuỗi có nội dung %p',
      (value) => {
        expect(
          isEmptyString(value)
        ).toBe(false);
      }
    );
  });

  describe(
    'isValidVietnamesePhone',
    () => {
      it.each([
        '0901234567',
        '0391234567',
        '0561234567',
        '0781234567',
        '0811234567',
        '+84901234567',
        '090 123 4567',
        '090.123.4567',
        '090-123-4567',
        '(090) 123-4567',
        ' +84 90 123 4567 '
      ])(
        'trả về true với số điện thoại hợp lệ %p',
        (value) => {
          expect(
            isValidVietnamesePhone(
              value
            )
          ).toBe(true);
        }
      );

      it.each([
        '',
        '   ',
        '0212345678',
        '0123456789',
        '090123456',
        '09012345678',
        '84901234567',
        '+840901234567',
        '+8490123456',
        '09012abc67',
        '090/123/4567',
        null,
        undefined,
        901234567,
        {},
        []
      ])(
        'trả về false với số điện thoại không hợp lệ %p',
        (value) => {
          expect(
            isValidVietnamesePhone(
              value
            )
          ).toBe(false);
        }
      );
    }
  );

  describe(
    'isValidNonNegativeNumber',
    () => {
      it.each([
        0,
        -0,
        0.5,
        1,
        Number.MAX_VALUE
      ])(
        'trả về true với số không âm %p',
        (value) => {
          expect(
            isValidNonNegativeNumber(
              value
            )
          ).toBe(true);
        }
      );

      it.each([
        -0.01,
        -1,
        Number.NaN,
        Number.POSITIVE_INFINITY,
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
            isValidNonNegativeNumber(
              value
            )
          ).toBe(false);
        }
      );
    }
  );

  describe('isValidDate', () => {
    it.each([
      '2026-08-03',
      '2024-02-29',
      '0001-01-01',
      ' 2026-12-31 '
    ])(
      'trả về true với ngày hợp lệ %p',
      (value) => {
        expect(
          isValidDate(value)
        ).toBe(true);
      }
    );

    it.each([
      '',
      '   ',
      '2026-02-29',
      '2026-04-31',
      '2026-13-01',
      '2026-00-01',
      '0000-01-01',
      '03/08/2026',
      '2026-08-03T00:00:00.000Z',
      null,
      undefined,
      20260803,
      {},
      []
    ])(
      'trả về false với ngày không hợp lệ %p',
      (value) => {
        expect(
          isValidDate(value)
        ).toBe(false);
      }
    );
  });
});