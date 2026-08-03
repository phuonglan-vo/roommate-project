import {
  expect,
  test
} from '@playwright/test';

import {
  Buffer
} from 'node:buffer';

import {
  STORAGE_KEYS
} from '../../src/constants/storage-keys.js';

const TEST_ID = Object.freeze({
  // Trang sao lưu dữ liệu
  backupPage: 'backup-page',
  exportButton: 'export-data-button',
  importButton: 'import-data-button',
  clearDataButton: 'clear-data-button',
  importError: 'import-error',
  toastArea: 'toast-area',

  // Dialog xác nhận
  confirmDialog: 'confirm-dialog',
  confirmButton: 'confirm-dialog-confirm',
  cancelButton: 'confirm-dialog-cancel',

  // Trang phòng
  roomsPage: 'rooms-page',
  roomsTable: 'rooms-table'
});

const ROUTE = Object.freeze({
  backup: '#/backup',
  rooms: '#/rooms'
});

const EXPORTED_ROOM_A = Object.freeze({
  id: 'room-export-e2e-01',
  code: 'E2E-EXPORT-01',
  name: 'Phòng export E2E 01',
  area: 'Khu E2E',
  roomType: 'Phòng đơn',
  monthlyRent: 2_500_000,
  maxOccupants: 2,
  status: 'vacant',
  description: 'Dữ liệu kiểm tra export',
  createdAt: '2026-08-03T01:00:00.000Z',
  updatedAt: '2026-08-03T01:00:00.000Z'
});

const EXPORTED_ROOM_B = Object.freeze({
  id: 'room-export-e2e-02',
  code: 'E2E-EXPORT-02',
  name: 'Phòng export E2E 02',
  area: 'Khu E2E',
  roomType: 'Phòng đôi',
  monthlyRent: 3_500_000,
  maxOccupants: 4,
  status: 'vacant',
  description: 'Dữ liệu kiểm tra khôi phục',
  createdAt: '2026-08-03T01:05:00.000Z',
  updatedAt: '2026-08-03T01:05:00.000Z'
});

const EXPORTED_TENANT = Object.freeze({
  id: 'tenant-export-e2e-01',
  fullName: 'Nguyễn Văn Export',
  phone: '0901234567',
  identityNumber: '079203001111',
  email: 'export-e2e@example.com',
  address: 'Cần Thơ',
  vehiclePlates: [],
  status: 'active',
  createdAt: '2026-08-03T01:10:00.000Z',
  updatedAt: '2026-08-03T01:10:00.000Z'
});

const CURRENT_ROOM = Object.freeze({
  id: 'room-current-e2e-01',
  code: 'E2E-CURRENT-01',
  name: 'Phòng hiện tại E2E',
  area: 'Khu hiện tại',
  roomType: 'Phòng đơn',
  monthlyRent: 2_800_000,
  maxOccupants: 2,
  status: 'vacant',
  description:
    'Dữ liệu không được mất khi hủy import',
  createdAt: '2026-08-03T02:00:00.000Z',
  updatedAt: '2026-08-03T02:00:00.000Z'
});

const IMPORTED_ROOM = Object.freeze({
  id: 'room-overwrite-e2e-01',
  code: 'E2E-OVERWRITE-01',
  name: 'Phòng từ file ghi đè',
  area: 'Khu import',
  roomType: 'Phòng đôi',
  monthlyRent: 4_000_000,
  maxOccupants: 4,
  status: 'vacant',
  description:
    'Dữ liệu chỉ xuất hiện nếu đồng ý ghi đè',
  createdAt: '2026-08-03T03:00:00.000Z',
  updatedAt: '2026-08-03T03:00:00.000Z'
});

function escapeRegExp(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

function createEmptyStorageData() {
  return Object.fromEntries(
    Object.entries(STORAGE_KEYS).map(
      ([name, key]) => [
        key,
        name === 'APP_SETTINGS'
          ? {}
          : []
      ]
    )
  );
}

function createBackupPayload({
  rooms = [],
  tenants = [],
  contracts = [],
  meterReadings = [],
  serviceConfigs = [],
  invoices = [],
  payments = [],
  appSettings = {}
} = {}) {
  return {
    ...createEmptyStorageData(),

    [STORAGE_KEYS.ROOMS]: rooms,
    [STORAGE_KEYS.TENANTS]: tenants,
    [STORAGE_KEYS.CONTRACTS]:
      contracts,
    [STORAGE_KEYS.METER_READINGS]:
      meterReadings,
    [STORAGE_KEYS.SERVICE_CONFIGS]:
      serviceConfigs,
    [STORAGE_KEYS.INVOICES]:
      invoices,
    [STORAGE_KEYS.PAYMENTS]:
      payments,
    [STORAGE_KEYS.APP_SETTINGS]:
      appSettings
  };
}

function getRoomRow(page, roomCode) {
  return page
    .getByTestId(TEST_ID.roomsTable)
    .getByRole('row')
    .filter({
      hasText: roomCode
    });
}

async function openRoute(
  page,
  route,
  pageTestId
) {
  await page.evaluate(
    (targetRoute) => {
      window.location.hash =
        targetRoute;
    },
    route
  );

  await expect(page).toHaveURL(
    new RegExp(
      `${escapeRegExp(route)}$`
    )
  );

  await expect(
    page.getByTestId(pageTestId)
  ).toBeVisible();
}

async function writeStorageData(
  page,
  data
) {
  await page.evaluate(
    ({ storageData }) => {
      localStorage.clear();
      sessionStorage.clear();

      Object.entries(
        storageData
      ).forEach(([key, value]) => {
        localStorage.setItem(
          key,
          JSON.stringify(value)
        );
      });
    },
    {
      storageData: data
    }
  );
}

async function readStorageSnapshot(page) {
  return page.evaluate(
    (storageKeys) => {
      return Object.fromEntries(
        Object.values(storageKeys).map(
          (key) => {
            const rawValue =
              localStorage.getItem(key);

            if (rawValue === null) {
              return [key, null];
            }

            try {
              return [
                key,
                JSON.parse(rawValue)
              ];
            } catch {
              return [key, rawValue];
            }
          }
        )
      );
    },
    STORAGE_KEYS
  );
}

async function readCollection(
  page,
  storageKey
) {
  return page.evaluate(
    (key) => {
      const value = JSON.parse(
        localStorage.getItem(key) ??
          '[]'
      );

      return Array.isArray(value)
        ? value
        : [];
    },
    storageKey
  );
}

async function seedExportData(page) {
  await writeStorageData(
    page,
    createBackupPayload({
      rooms: [
        EXPORTED_ROOM_A,
        EXPORTED_ROOM_B
      ],

      tenants: [
        EXPORTED_TENANT
      ],

      appSettings: {
        testData: true
      }
    })
  );
}

async function downloadToBuffer(
  download
) {
  const stream =
    await download.createReadStream();

  expect(stream).not.toBeNull();

  const chunks = [];

  for await (
    const chunk of stream
  ) {
    chunks.push(
      Buffer.from(chunk)
    );
  }

  const buffer =
    Buffer.concat(chunks);

  expect(buffer.length).toBeGreaterThan(
    0
  );

  expect(
    await download.failure()
  ).toBeNull();

  return buffer;
}

async function exportJson(page) {
  const downloadPromise =
    page.waitForEvent('download');

  await page
    .getByTestId(
      TEST_ID.exportButton
    )
    .click();

  const download =
    await downloadPromise;

  expect(
    download.suggestedFilename()
  ).toMatch(/\.json$/i);

  const buffer =
    await downloadToBuffer(
      download
    );

  return {
    buffer,

    fileName:
      download.suggestedFilename()
  };
}

async function selectImportFile(
  page,
  {
    name,
    buffer,
    mimeType =
      'application/json'
  }
) {
  const fileChooserPromise =
    page.waitForEvent(
      'filechooser'
    );

  await page
    .getByTestId(
      TEST_ID.importButton
    )
    .click();

  const fileChooser =
    await fileChooserPromise;

  await fileChooser.setFiles({
    name,
    mimeType,
    buffer
  });
}

async function confirmImportIfShown(
  page
) {
  const dialog =
    page.getByTestId(
      TEST_ID.confirmDialog
    );

  const isVisible =
    await dialog
      .waitFor({
        state: 'visible',
        timeout: 1_500
      })
      .then(() => true)
      .catch(() => false);

  if (!isVisible) {
    return;
  }

  await page
    .getByTestId(
      TEST_ID.confirmButton
    )
    .click();

  await expect(
    dialog
  ).toBeHidden();
}

async function clearAllData(page) {
  await page
    .getByTestId(
      TEST_ID.clearDataButton
    )
    .click();

  const dialog =
    page.getByTestId(
      TEST_ID.confirmDialog
    );

  await expect(
    dialog
  ).toBeVisible();

  await page
    .getByTestId(
      TEST_ID.confirmButton
    )
    .click();

  await expect(
    dialog
  ).toBeHidden();

  await expect
    .poll(async () => {
      const rooms =
        await readCollection(
          page,
          STORAGE_KEYS.ROOMS
        );

      const tenants =
        await readCollection(
          page,
          STORAGE_KEYS.TENANTS
        );

      return (
        rooms.length +
        tenants.length
      );
    })
    .toBe(0);
}

function objectContainsCode(
  value,
  expectedCode
) {
  if (Array.isArray(value)) {
    return value.some(
      (item) =>
        objectContainsCode(
          item,
          expectedCode
        )
    );
  }

  if (
    value !== null &&
    typeof value === 'object'
  ) {
    if (
      value.code === expectedCode
    ) {
      return true;
    }

    return Object.values(value).some(
      (item) =>
        objectContainsCode(
          item,
          expectedCode
        )
    );
  }

  return false;
}

test.describe(
  'Import và export dữ liệu RoomMate',
  () => {
    test.beforeEach(
      async ({ page }) => {
        await page.goto('/');

        await writeStorageData(
          page,
          createBackupPayload()
        );
      }
    );

    test(
      'export JSON, xóa dữ liệu và import để khôi phục',
      async ({ page }) => {
        /*
         * 1. Tạo dữ liệu riêng cho test.
         */
        await seedExportData(page);

        await openRoute(
          page,
          ROUTE.backup,
          TEST_ID.backupPage
        );

        /*
         * 2. Export file JSON.
         * 3. Kiểm tra có download.
         */
        const {
          buffer,
          fileName
        } = await exportJson(page);

        const exportedJson =
          JSON.parse(
            buffer.toString('utf8')
          );

        expect(
          objectContainsCode(
            exportedJson,
            EXPORTED_ROOM_A.code
          )
        ).toBe(true);

        expect(
          objectContainsCode(
            exportedJson,
            EXPORTED_ROOM_B.code
          )
        ).toBe(true);

        /*
         * 4. Xóa toàn bộ dữ liệu bằng UI.
         */
        await clearAllData(page);

        await openRoute(
          page,
          ROUTE.rooms,
          TEST_ID.roomsPage
        );

        await expect(
          getRoomRow(
            page,
            EXPORTED_ROOM_A.code
          )
        ).toHaveCount(0);

        await expect(
          getRoomRow(
            page,
            EXPORTED_ROOM_B.code
          )
        ).toHaveCount(0);

        /*
         * 5. Import lại chính file vừa
         * được download.
         *
         * File được truyền bằng buffer,
         * không phụ thuộc file có sẵn trên
         * máy người dùng.
         */
        await openRoute(
          page,
          ROUTE.backup,
          TEST_ID.backupPage
        );

        await selectImportFile(
          page,
          {
            name: fileName,
            buffer
          }
        );

        await confirmImportIfShown(
          page
        );

        /*
         * 6. Dữ liệu được khôi phục.
         */
        await expect
          .poll(async () => {
            const rooms =
              await readCollection(
                page,
                STORAGE_KEYS.ROOMS
              );

            return rooms
              .map((room) => room.code)
              .sort();
          })
          .toEqual([
            EXPORTED_ROOM_A.code,
            EXPORTED_ROOM_B.code
          ]);

        await openRoute(
          page,
          ROUTE.rooms,
          TEST_ID.roomsPage
        );

        await expect(
          getRoomRow(
            page,
            EXPORTED_ROOM_A.code
          )
        ).toBeVisible();

        await expect(
          getRoomRow(
            page,
            EXPORTED_ROOM_B.code
          )
        ).toBeVisible();

        /*
         * Reload để kiểm tra dữ liệu import
         * thực sự đã lưu trong LocalStorage.
         */
        await page.reload();

        await expect(
          page.getByTestId(
            TEST_ID.roomsPage
          )
        ).toBeVisible();

        await expect(
          getRoomRow(
            page,
            EXPORTED_ROOM_A.code
          )
        ).toBeVisible();

        await expect(
          getRoomRow(
            page,
            EXPORTED_ROOM_B.code
          )
        ).toBeVisible();

        const restoredTenants =
          await readCollection(
            page,
            STORAGE_KEYS.TENANTS
          );

        expect(
          restoredTenants
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id:
                EXPORTED_TENANT.id,

              identityNumber:
                EXPORTED_TENANT
                  .identityNumber
            })
          ])
        );
      }
    );

    test(
      'import file sai định dạng hiển thị lỗi và không làm mất dữ liệu',
      async ({ page }) => {
        await writeStorageData(
          page,
          createBackupPayload({
            rooms: [
              CURRENT_ROOM
            ],

            appSettings: {
              preserved: true
            }
          })
        );

        const snapshotBefore =
          await readStorageSnapshot(
            page
          );

        await openRoute(
          page,
          ROUTE.backup,
          TEST_ID.backupPage
        );

        /*
         * 7. Import file JSON bị lỗi cú pháp.
         *
         * File được tạo trực tiếp trong bộ
         * nhớ bằng API file chooser.
         */
        await selectImportFile(
          page,
          {
            name:
              'roommate-invalid.json',

            buffer:
              Buffer.from(
                '{"rooms": [}',
                'utf8'
              )
          }
        );

        /*
         * 8. Hiển thị thông báo lỗi.
         */
        const errorMessage =
          page
            .locator(
              [
                `[data-testid="${TEST_ID.importError}"]`,
                `[data-testid="${TEST_ID.toastArea}"]`
              ].join(', ')
            )
            .filter({
              hasText:
                /JSON|định dạng|không hợp lệ|không thể đọc|import thất bại/i
            })
            .first();

        await expect(
          errorMessage
        ).toBeVisible();

        /*
         * File sai không được thay đổi dữ
         * liệu đang có.
         */
        const snapshotAfter =
          await readStorageSnapshot(
            page
          );

        expect(
          snapshotAfter
        ).toEqual(snapshotBefore);

        await openRoute(
          page,
          ROUTE.rooms,
          TEST_ID.roomsPage
        );

        await expect(
          getRoomRow(
            page,
            CURRENT_ROOM.code
          )
        ).toBeVisible();

        await page.reload();

        await expect(
          getRoomRow(
            page,
            CURRENT_ROOM.code
          )
        ).toBeVisible();
      }
    );

    test(
      'hủy thao tác ghi đè giữ nguyên dữ liệu hiện tại',
      async ({ page }) => {
        await writeStorageData(
          page,
          createBackupPayload({
            rooms: [
              CURRENT_ROOM
            ],

            appSettings: {
              preserved: true
            }
          })
        );

        const snapshotBefore =
          await readStorageSnapshot(
            page
          );

        const overwritePayload =
          createBackupPayload({
            rooms: [
              IMPORTED_ROOM
            ],

            appSettings: {
              imported: true
            }
          });

        await openRoute(
          page,
          ROUTE.backup,
          TEST_ID.backupPage
        );

        await selectImportFile(
          page,
          {
            name:
              'roommate-overwrite.json',

            buffer:
              Buffer.from(
                JSON.stringify(
                  overwritePayload
                ),
                'utf8'
              )
          }
        );

        /*
         * 9. Hủy thao tác ghi đè.
         */
        const dialog =
          page.getByTestId(
            TEST_ID.confirmDialog
          );

        await expect(
          dialog
        ).toBeVisible();

        await page
          .getByTestId(
            TEST_ID.cancelButton
          )
          .click();

        await expect(
          dialog
        ).toBeHidden();

        /*
         * 10. Dữ liệu hiện tại không bị mất.
         */
        const snapshotAfter =
          await readStorageSnapshot(
            page
          );

        expect(
          snapshotAfter
        ).toEqual(snapshotBefore);

        const rooms =
          await readCollection(
            page,
            STORAGE_KEYS.ROOMS
          );

        expect(rooms).toEqual([
          expect.objectContaining({
            id: CURRENT_ROOM.id,
            code: CURRENT_ROOM.code
          })
        ]);

        expect(
          rooms.some(
            (room) =>
              room.code ===
              IMPORTED_ROOM.code
          )
        ).toBe(false);

        await openRoute(
          page,
          ROUTE.rooms,
          TEST_ID.roomsPage
        );

        await expect(
          getRoomRow(
            page,
            CURRENT_ROOM.code
          )
        ).toBeVisible();

        await expect(
          getRoomRow(
            page,
            IMPORTED_ROOM.code
          )
        ).toHaveCount(0);

        await page.reload();

        await expect(
          getRoomRow(
            page,
            CURRENT_ROOM.code
          )
        ).toBeVisible();

        await expect(
          getRoomRow(
            page,
            IMPORTED_ROOM.code
          )
        ).toHaveCount(0);
      }
    );
  }
);