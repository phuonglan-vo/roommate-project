import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import {
  STORAGE_COLLECTION_KEYS,
  STORAGE_KEYS
} from '../../../src/constants/storage-keys.js';

import {
  StorageService
} from '../../../src/services/storage-service.js';

const TEST_COLLECTION_KEY =
  STORAGE_KEYS.ROOMS;

function createRoom(overrides = {}) {
  return {
    id: 'room-01',
    code: 'P01',
    name: 'Phòng 01',
    status: 'empty',
    ...overrides
  };
}

describe('StorageService', () => {
  let storageService;

  beforeEach(() => {
    localStorage.clear();

    storageService =
      new StorageService(
        localStorage
      );
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getAll', () => {
    it('trả về mảng rỗng khi collection chưa có dữ liệu', () => {
      expect(
        storageService.getAll(
          TEST_COLLECTION_KEY
        )
      ).toEqual([]);
    });

    it('trả về bản sao độc lập của dữ liệu', () => {
      const room = createRoom();

      storageService.replaceAll(
        TEST_COLLECTION_KEY,
        [room]
      );

      const result =
        storageService.getAll(
          TEST_COLLECTION_KEY
        );

      result[0].name =
        'Tên đã bị sửa bên ngoài';

      expect(
        storageService.getAll(
          TEST_COLLECTION_KEY
        )[0].name
      ).toBe('Phòng 01');
    });
  });

  describe('create', () => {
    it('tạo bản ghi thành công', () => {
      vi.useFakeTimers();

      vi.setSystemTime(
        new Date(
          '2026-08-03T10:00:00.000Z'
        )
      );

      const createdRoom =
        storageService.create(
          TEST_COLLECTION_KEY,
          createRoom()
        );

      expect(createdRoom).toEqual({
        id: 'room-01',
        code: 'P01',
        name: 'Phòng 01',
        status: 'empty',
        createdAt:
          '2026-08-03T10:00:00.000Z',
        updatedAt:
          '2026-08-03T10:00:00.000Z'
      });

      expect(
        storageService.getAll(
          TEST_COLLECTION_KEY
        )
      ).toEqual([createdRoom]);
    });

    it('tự tạo ID khi bản ghi chưa có ID', () => {
      const createdRoom =
        storageService.create(
          TEST_COLLECTION_KEY,
          {
            code: 'P02',
            name: 'Phòng 02'
          }
        );

      expect(
        typeof createdRoom.id
      ).toBe('string');

      expect(createdRoom.id).not.toBe(
        ''
      );

      expect(
        storageService.getById(
          TEST_COLLECTION_KEY,
          createdRoom.id
        )
      ).toEqual(createdRoom);
    });

    it('không tạo bản ghi có ID trùng', () => {
      storageService.create(
        TEST_COLLECTION_KEY,
        createRoom()
      );

      expect(() =>
        storageService.create(
          TEST_COLLECTION_KEY,
          createRoom({
            name: 'Phòng bị trùng ID'
          })
        )
      ).toThrow(
        `ID "room-01" đã tồn tại trong collection "${TEST_COLLECTION_KEY}".`
      );

      expect(
        storageService.getAll(
          TEST_COLLECTION_KEY
        )
      ).toHaveLength(1);
    });

    it('không làm thay đổi object đầu vào', () => {
      const room = createRoom();

      storageService.create(
        TEST_COLLECTION_KEY,
        room
      );

      expect(room).toEqual(
        createRoom()
      );

      expect(room).not.toHaveProperty(
        'createdAt'
      );

      expect(room).not.toHaveProperty(
        'updatedAt'
      );
    });
  });

  describe('getById', () => {
    it('trả về bản ghi khi tìm thấy ID', () => {
      storageService.create(
        TEST_COLLECTION_KEY,
        createRoom()
      );

      const result =
        storageService.getById(
          TEST_COLLECTION_KEY,
          'room-01'
        );

      expect(result).toMatchObject({
        id: 'room-01',
        code: 'P01',
        name: 'Phòng 01'
      });
    });

    it('chuẩn hóa khoảng trắng của ID', () => {
      storageService.create(
        TEST_COLLECTION_KEY,
        createRoom()
      );

      expect(
        storageService.getById(
          TEST_COLLECTION_KEY,
          '  room-01  '
        )
      ).toMatchObject({
        id: 'room-01'
      });
    });

    it('trả về null khi không tìm thấy ID', () => {
      storageService.create(
        TEST_COLLECTION_KEY,
        createRoom()
      );

      expect(
        storageService.getById(
          TEST_COLLECTION_KEY,
          'room-99'
        )
      ).toBeNull();
    });

    it('trả về bản sao độc lập của bản ghi', () => {
      storageService.create(
        TEST_COLLECTION_KEY,
        createRoom()
      );

      const result =
        storageService.getById(
          TEST_COLLECTION_KEY,
          'room-01'
        );

      result.name = 'Đã sửa';

      expect(
        storageService.getById(
          TEST_COLLECTION_KEY,
          'room-01'
        ).name
      ).toBe('Phòng 01');
    });
  });

  describe('update', () => {
    it('cập nhật bản ghi thành công', () => {
      vi.useFakeTimers();

      vi.setSystemTime(
        new Date(
          '2026-08-03T08:00:00.000Z'
        )
      );

      const createdRoom =
        storageService.create(
          TEST_COLLECTION_KEY,
          createRoom()
        );

      vi.setSystemTime(
        new Date(
          '2026-08-03T09:30:00.000Z'
        )
      );

      const updatedRoom =
        storageService.update(
          TEST_COLLECTION_KEY,
          'room-01',
          {
            name: 'Phòng 01 mới',
            status: 'occupied'
          }
        );

      expect(updatedRoom).toEqual({
        ...createdRoom,
        name: 'Phòng 01 mới',
        status: 'occupied',
        updatedAt:
          '2026-08-03T09:30:00.000Z'
      });

      expect(
        updatedRoom.createdAt
      ).toBe(createdRoom.createdAt);

      expect(
        storageService.getById(
          TEST_COLLECTION_KEY,
          'room-01'
        )
      ).toEqual(updatedRoom);
    });

    it('không cho thay đổi ID của bản ghi', () => {
      storageService.create(
        TEST_COLLECTION_KEY,
        createRoom()
      );

      expect(() =>
        storageService.update(
          TEST_COLLECTION_KEY,
          'room-01',
          {
            id: 'room-02',
            name: 'Phòng 02'
          }
        )
      ).toThrow(
        'Không được thay đổi ID của bản ghi.'
      );
    });

    it('không cho thay đổi createdAt và updatedAt thủ công', () => {
      vi.useFakeTimers();

      vi.setSystemTime(
        new Date(
          '2026-08-03T08:00:00.000Z'
        )
      );

      const createdRoom =
        storageService.create(
          TEST_COLLECTION_KEY,
          createRoom()
        );

      vi.setSystemTime(
        new Date(
          '2026-08-03T10:00:00.000Z'
        )
      );

      const updatedRoom =
        storageService.update(
          TEST_COLLECTION_KEY,
          'room-01',
          {
            name: 'Phòng đã sửa',
            createdAt:
              '2000-01-01T00:00:00.000Z',
            updatedAt:
              '2000-01-01T00:00:00.000Z'
          }
        );

      expect(
        updatedRoom.createdAt
      ).toBe(createdRoom.createdAt);

      expect(
        updatedRoom.updatedAt
      ).toBe(
        '2026-08-03T10:00:00.000Z'
      );
    });

    it('báo lỗi khi cập nhật ID không tồn tại', () => {
      expect(() =>
        storageService.update(
          TEST_COLLECTION_KEY,
          'room-99',
          {
            name: 'Không tồn tại'
          }
        )
      ).toThrow(
        `Không tìm thấy ID "room-99" trong collection "${TEST_COLLECTION_KEY}".`
      );
    });
  });

  describe('remove', () => {
    it('xóa bản ghi thành công', () => {
      storageService.create(
        TEST_COLLECTION_KEY,
        createRoom()
      );

      storageService.create(
        TEST_COLLECTION_KEY,
        createRoom({
          id: 'room-02',
          code: 'P02',
          name: 'Phòng 02'
        })
      );

      const removedRoom =
        storageService.remove(
          TEST_COLLECTION_KEY,
          'room-01'
        );

      expect(removedRoom).toMatchObject({
        id: 'room-01',
        code: 'P01'
      });

      expect(
        storageService.getAll(
          TEST_COLLECTION_KEY
        )
      ).toHaveLength(1);

      expect(
        storageService.getById(
          TEST_COLLECTION_KEY,
          'room-01'
        )
      ).toBeNull();
    });

    it('trả về null khi xóa ID không tồn tại', () => {
      expect(
        storageService.remove(
          TEST_COLLECTION_KEY,
          'room-99'
        )
      ).toBeNull();
    });
  });

  describe('replaceAll', () => {
    it('thay thế toàn bộ dữ liệu collection', () => {
      storageService.create(
        TEST_COLLECTION_KEY,
        createRoom()
      );

      const replacement = [
        createRoom({
          id: 'room-02',
          code: 'P02',
          name: 'Phòng 02'
        }),
        createRoom({
          id: 'room-03',
          code: 'P03',
          name: 'Phòng 03'
        })
      ];

      const result =
        storageService.replaceAll(
          TEST_COLLECTION_KEY,
          replacement
        );

      expect(result).toEqual(
        replacement
      );

      expect(
        storageService.getAll(
          TEST_COLLECTION_KEY
        )
      ).toEqual(replacement);

      expect(
        storageService.getById(
          TEST_COLLECTION_KEY,
          'room-01'
        )
      ).toBeNull();
    });

    it('không chấp nhận danh sách có ID trùng', () => {
      expect(() =>
        storageService.replaceAll(
          TEST_COLLECTION_KEY,
          [
            createRoom(),
            createRoom({
              name: 'Phòng trùng'
            })
          ]
        )
      ).toThrow(
        `Collection "${TEST_COLLECTION_KEY}" chứa ID bị trùng: "room-01".`
      );
    });
  });

  describe('safeParse', () => {
    it('phân tích JSON hợp lệ', () => {
      const json = JSON.stringify({
        id: 'room-01',
        name: 'Phòng 01'
      });

      expect(
        storageService.safeParse(
          json,
          {}
        )
      ).toEqual({
        id: 'room-01',
        name: 'Phòng 01'
      });
    });

    it('trả về fallback khi JSON bị lỗi', () => {
      const fallback = {
        valid: false
      };

      const result =
        storageService.safeParse(
          '{"id": "room-01"',
          fallback
        );

      expect(result).toEqual(
        fallback
      );

      expect(result).not.toBe(
        fallback
      );
    });

    it('trả về fallback khi chuỗi JSON rỗng', () => {
      expect(
        storageService.safeParse(
          '',
          []
        )
      ).toEqual([]);
    });

    it('báo TypeError khi giá trị JSON không phải chuỗi', () => {
      expect(() =>
        storageService.safeParse(
          {
            id: 'room-01'
          },
          {}
        )
      ).toThrow(TypeError);
    });
  });

  describe('exportAll', () => {
    it('export toàn bộ collection và appSettings', () => {
      const room = createRoom();

      const tenant = {
        id: 'tenant-01',
        fullName: 'Nguyễn Văn An'
      };

      storageService.replaceAll(
        STORAGE_KEYS.ROOMS,
        [room]
      );

      storageService.replaceAll(
        STORAGE_KEYS.TENANTS,
        [tenant]
      );

      localStorage.setItem(
        STORAGE_KEYS.APP_SETTINGS,
        JSON.stringify({
          currency: 'VND',
          locale: 'vi-VN'
        })
      );

      localStorage.setItem(
        'unrelated-application',
        JSON.stringify({
          value: 123
        })
      );

      const result =
        storageService.exportAll();

      expect(
        result[STORAGE_KEYS.ROOMS]
      ).toEqual([room]);

      expect(
        result[STORAGE_KEYS.TENANTS]
      ).toEqual([tenant]);

      expect(
        result[
          STORAGE_KEYS.APP_SETTINGS
        ]
      ).toEqual({
        currency: 'VND',
        locale: 'vi-VN'
      });

      STORAGE_COLLECTION_KEYS
        .forEach((key) => {
          expect(
            result
          ).toHaveProperty(key);

          expect(
            Array.isArray(result[key])
          ).toBe(true);
        });

      expect(result).not.toHaveProperty(
        'unrelated-application'
      );
    });

    it('trả về collection rỗng và appSettings rỗng khi chưa có dữ liệu', () => {
      const result =
        storageService.exportAll();

      STORAGE_COLLECTION_KEYS
        .forEach((key) => {
          expect(result[key]).toEqual(
            []
          );
        });

      expect(
        result[
          STORAGE_KEYS.APP_SETTINGS
        ]
      ).toEqual({});
    });
  });

  describe('importAll', () => {
    it('import dữ liệu hợp lệ', () => {
      const importData = {
        data: {
          [STORAGE_KEYS.ROOMS]: [
            createRoom({
              id: 'room-imported',
              code: 'P10',
              name: 'Phòng import'
            })
          ],

          [STORAGE_KEYS.TENANTS]: [
            {
              id: 'tenant-imported',
              fullName:
                'Nguyễn Văn Bình'
            }
          ],

          [STORAGE_KEYS.APP_SETTINGS]: {
            currency: 'VND',
            locale: 'vi-VN'
          }
        }
      };

      const result =
        storageService.importAll(
          importData
        );

      expect(
        storageService.getAll(
          STORAGE_KEYS.ROOMS
        )
      ).toEqual(
        importData.data[
          STORAGE_KEYS.ROOMS
        ]
      );

      expect(
        storageService.getAll(
          STORAGE_KEYS.TENANTS
        )
      ).toEqual(
        importData.data[
          STORAGE_KEYS.TENANTS
        ]
      );

      expect(
        result[
          STORAGE_KEYS.APP_SETTINGS
        ]
      ).toEqual({
        currency: 'VND',
        locale: 'vi-VN'
      });
    });

    it('chỉ thay thế những collection xuất hiện trong dữ liệu import', () => {
      const existingTenant = {
        id: 'tenant-01',
        fullName: 'Nguyễn Văn An'
      };

      storageService.replaceAll(
        STORAGE_KEYS.TENANTS,
        [existingTenant]
      );

      storageService.importAll({
        [STORAGE_KEYS.ROOMS]: [
          createRoom()
        ]
      });

      expect(
        storageService.getAll(
          STORAGE_KEYS.ROOMS
        )
      ).toEqual([
        createRoom()
      ]);

      expect(
        storageService.getAll(
          STORAGE_KEYS.TENANTS
        )
      ).toEqual([
        existingTenant
      ]);
    });

    it('không ghi đè dữ liệu khi import không hợp lệ', () => {
      const existingRooms = [
        createRoom()
      ];

      storageService.replaceAll(
        STORAGE_KEYS.ROOMS,
        existingRooms
      );

      expect(() =>
        storageService.importAll({
          [STORAGE_KEYS.ROOMS]: [
            createRoom({
              id: 'room-duplicate'
            }),
            createRoom({
              id: 'room-duplicate'
            })
          ]
        })
      ).toThrow(
        `Collection "${STORAGE_KEYS.ROOMS}" chứa ID bị trùng: "room-duplicate".`
      );

      expect(
        storageService.getAll(
          STORAGE_KEYS.ROOMS
        )
      ).toEqual(existingRooms);
    });

    it('báo TypeError khi collection import không phải mảng', () => {
      expect(() =>
        storageService.importAll({
          [STORAGE_KEYS.ROOMS]: {
            id: 'room-01'
          }
        })
      ).toThrow(
        `Collection "${STORAGE_KEYS.ROOMS}" phải là một mảng.`
      );
    });

    it('báo TypeError khi dữ liệu import không phải object', () => {
      expect(() =>
        storageService.importAll(null)
      ).toThrow(
        'Dữ liệu import phải là một object.'
      );

      expect(() =>
        storageService.importAll([])
      ).toThrow(
        'Dữ liệu import phải là một object.'
      );
    });

    it('báo lỗi khi object không chứa collection RoomMate', () => {
      expect(() =>
        storageService.importAll({
          unknownCollection: []
        })
      ).toThrow(
        'Dữ liệu import không chứa collection RoomMate hợp lệ.'
      );
    });

    it('báo TypeError khi appSettings không phải object', () => {
      expect(() =>
        storageService.importAll({
          [STORAGE_KEYS.APP_SETTINGS]:
            []
        })
      ).toThrow(
        'appSettings phải là một object.'
      );
    });
  });

  describe('clearKey', () => {
    it('xóa một khóa và trả về true khi khóa tồn tại', () => {
      storageService.replaceAll(
        TEST_COLLECTION_KEY,
        [createRoom()]
      );

      expect(
        storageService.clearKey(
          TEST_COLLECTION_KEY
        )
      ).toBe(true);

      expect(
        localStorage.getItem(
          TEST_COLLECTION_KEY
        )
      ).toBeNull();

      expect(
        storageService.getAll(
          TEST_COLLECTION_KEY
        )
      ).toEqual([]);
    });

    it('trả về false khi khóa chưa tồn tại', () => {
      expect(
        storageService.clearKey(
          TEST_COLLECTION_KEY
        )
      ).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('xóa toàn bộ khóa RoomMate nhưng giữ dữ liệu ứng dụng khác', () => {
      storageService.replaceAll(
        STORAGE_KEYS.ROOMS,
        [createRoom()]
      );

      storageService.replaceAll(
        STORAGE_KEYS.TENANTS,
        [
          {
            id: 'tenant-01',
            fullName:
              'Nguyễn Văn An'
          }
        ]
      );

      localStorage.setItem(
        STORAGE_KEYS.APP_SETTINGS,
        JSON.stringify({
          currency: 'VND'
        })
      );

      localStorage.setItem(
        'other-app-data',
        'không được xóa'
      );

      const removedCount =
        storageService.clearAll();

      expect(removedCount).toBe(3);

      STORAGE_COLLECTION_KEYS
        .forEach((key) => {
          expect(
            localStorage.getItem(key)
          ).toBeNull();
        });

      expect(
        localStorage.getItem(
          STORAGE_KEYS.APP_SETTINGS
        )
      ).toBeNull();

      expect(
        localStorage.getItem(
          'other-app-data'
        )
      ).toBe('không được xóa');
    });

    it('trả về 0 khi không có khóa RoomMate nào tồn tại', () => {
      expect(
        storageService.clearAll()
      ).toBe(0);
    });
  });
});