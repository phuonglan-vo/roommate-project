import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import {
  createUniqueId
} from '../../../src/utils/id-utils.js';

describe('id-utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('createUniqueId', () => {
    it('tạo ID với tiền tố mặc định', () => {
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() =>
          '550e8400-e29b-41d4-a716-446655440000'
        )
      });

      expect(createUniqueId()).toBe(
        'id_550e8400-e29b-41d4-a716-446655440000'
      );
    });

    it('chuẩn hóa khoảng trắng ở hai đầu tiền tố', () => {
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() =>
          '11111111-2222-4333-8444-555555555555'
        )
      });

      expect(
        createUniqueId('  room  ')
      ).toBe(
        'room_11111111-2222-4333-8444-555555555555'
      );
    });

    it('chấp nhận tiền tố gồm chữ, số, gạch ngang và gạch dưới', () => {
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() =>
          'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
        )
      });

      expect(
        createUniqueId(
          'room_01-active'
        )
      ).toBe(
        'room_01-active_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
      );
    });

    it('tạo các ID khác nhau khi randomUUID trả về giá trị khác nhau', () => {
      const randomUUID = vi
        .fn()
        .mockReturnValueOnce(
          '00000000-0000-4000-8000-000000000001'
        )
        .mockReturnValueOnce(
          '00000000-0000-4000-8000-000000000002'
        );

      vi.stubGlobal('crypto', {
        randomUUID
      });

      const firstId =
        createUniqueId('tenant');

      const secondId =
        createUniqueId('tenant');

      expect(firstId).not.toBe(
        secondId
      );

      expect(
        randomUUID
      ).toHaveBeenCalledTimes(2);
    });

    it('dùng phương án dự phòng khi randomUUID không tồn tại', () => {
      vi.stubGlobal('crypto', {});

      vi.spyOn(
        Date,
        'now'
      ).mockReturnValue(
        1_700_000_000_000
      );

      vi.spyOn(
        Math,
        'random'
      ).mockReturnValue(
        0.123456789
      );

      const firstId =
        createUniqueId('payment');

      const secondId =
        createUniqueId('payment');

      expect(firstId).toMatch(
        /^payment_[a-z0-9]+_[a-z0-9]+_[a-z0-9]+$/
      );

      expect(secondId).toMatch(
        /^payment_[a-z0-9]+_[a-z0-9]+_[a-z0-9]+$/
      );

      expect(firstId).not.toBe(
        secondId
      );
    });

    it.each([
      [
        '',
        'tiền tố rỗng'
      ],
      [
        '   ',
        'tiền tố chỉ có khoảng trắng'
      ],
      [
        'room code',
        'tiền tố có khoảng trắng bên trong'
      ],
      [
        'room/code',
        'tiền tố có dấu gạch chéo'
      ],
      [
        'phòng',
        'tiền tố có ký tự ngoài bảng cho phép'
      ]
    ])(
      'ném TypeError với %s (%s)',
      (prefix) => {
        expect(() =>
          createUniqueId(prefix)
        ).toThrow(TypeError);
      }
    );

    it('xem undefined như việc không truyền tiền tố', () => {
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() =>
          '99999999-8888-4777-8666-555555555555'
        )
      });

      expect(
        createUniqueId(undefined)
      ).toBe(
        'id_99999999-8888-4777-8666-555555555555'
      );
    });

    it.each([
      null,
      123,
      true,
      {},
      []
    ])(
      'ném TypeError khi tiền tố không phải chuỗi: %p',
      (prefix) => {
        expect(() =>
          createUniqueId(prefix)
        ).toThrow(TypeError);
      }
    );
  });
});