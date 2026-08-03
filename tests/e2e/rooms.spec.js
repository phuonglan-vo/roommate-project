import {
  expect,
  test
} from '@playwright/test';

const TEST_ID = Object.freeze({
  roomsPage: 'rooms-page',
  roomsTable: 'rooms-table',

  addRoomButton: 'add-room-button',

  roomForm: 'room-form',
  roomCodeInput: 'room-code-input',
  roomNameInput: 'room-name-input',
  roomAreaInput: 'room-area-input',
  roomTypeInput: 'room-type-input',
  roomRentInput: 'room-rent-input',
  roomCapacityInput:
    'room-capacity-input',
  roomStatusSelect:
    'room-status-select',
  roomDescriptionInput:
    'room-description-input',
  roomSubmitButton:
    'room-submit-button',

  roomSearchInput:
    'room-search-input',
  roomStatusFilter:
    'room-status-filter',

  roomEditButton:
    'room-edit-button',
  roomDeleteButton:
    'room-delete-button',

  confirmDialog:
    'confirm-dialog',
  confirmButton:
    'confirm-dialog-confirm'
});

const MAIN_ROOM = Object.freeze({
  code: 'E2E-P101',
  name: 'Phòng E2E 101',
  area: 'Khu E2E',
  roomType: 'Phòng đơn',
  monthlyRent: '3000000',
  updatedRent: '3500000',
  maxOccupants: '2',
  status: 'vacant',
  description:
    'Phòng được tạo từ Playwright'
});

const FILTER_CONTROL_ROOM =
  Object.freeze({
    code: 'E2E-P102',
    name: 'Phòng E2E bảo trì',
    area: 'Khu E2E',
    roomType: 'Phòng đơn',
    monthlyRent: '2500000',
    maxOccupants: '1',
    status: 'maintenance',
    description:
      'Phòng dùng kiểm tra bộ lọc'
  });

function getRoomRow(page, roomCode) {
  return page
    .getByTestId(TEST_ID.roomsTable)
    .getByRole('row')
    .filter({
      hasText: roomCode
    });
}

async function openRoomsPage(page) {
  /*
   * Không dùng page.goto('/#/rooms') sau khi
   * clear LocalStorage vì việc tải lại toàn bộ
   * ứng dụng có thể kích hoạt dữ liệu seed.
   *
   * Thay đổi hash trong cùng document để router
   * render lại trang phòng từ LocalStorage rỗng.
   */
  await page.evaluate(() => {
    window.location.hash = '#/rooms';
  });

  await expect(page).toHaveURL(
    /#\/rooms$/
  );

  await expect(
    page.getByTestId(TEST_ID.roomsPage)
  ).toBeVisible();

  await expect(
    page.getByTestId(TEST_ID.roomsTable)
  ).toBeVisible();
}

async function fillRoomForm(
  page,
  room
) {
  await page
    .getByTestId(TEST_ID.roomCodeInput)
    .fill(room.code);

  await page
    .getByTestId(TEST_ID.roomNameInput)
    .fill(room.name);

  await page
    .getByTestId(TEST_ID.roomAreaInput)
    .fill(room.area);

  await page
    .getByTestId(TEST_ID.roomTypeInput)
    .fill(room.roomType);

  await page
    .getByTestId(TEST_ID.roomRentInput)
    .fill(room.monthlyRent);

  await page
    .getByTestId(
      TEST_ID.roomCapacityInput
    )
    .fill(room.maxOccupants);

  await page
    .getByTestId(
      TEST_ID.roomStatusSelect
    )
    .selectOption(room.status);

  await page
    .getByTestId(
      TEST_ID.roomDescriptionInput
    )
    .fill(room.description);
}

async function createRoom(page, room) {
  await page
    .getByTestId(
      TEST_ID.addRoomButton
    )
    .click();

  await expect(
    page.getByTestId(TEST_ID.roomForm)
  ).toBeVisible();

  await fillRoomForm(page, room);

  await page
    .getByTestId(
      TEST_ID.roomSubmitButton
    )
    .click();

  const roomRow = getRoomRow(
    page,
    room.code
  );

  await expect(roomRow).toBeVisible();
  await expect(roomRow).toContainText(
    room.name
  );

  return roomRow;
}

test.describe(
  'Trang quản lý phòng',
  () => {
    test.beforeEach(async ({ page }) => {
      /*
       * Mở ứng dụng trước để có đúng origin
       * của Vite, sau đó dọn LocalStorage.
       */
      await page.goto('/');

      await page.evaluate(() => {
        localStorage.clear();
      });

      await openRoomsPage(page);

      /*
       * Đảm bảo test không sử dụng dữ liệu
       * seed hoặc dữ liệu từ test trước.
       */
      await expect(
        page.getByTestId(
          TEST_ID.roomsTable
        )
      ).not.toContainText(
        MAIN_ROOM.code
      );
    });

    test(
      'thêm, lưu lại, sửa, tìm kiếm, lọc và xóa phòng',
      async ({ page }) => {
        /*
         * 1. Trang phòng đã được mở trong
         * beforeEach.
         */
        await expect(
          page.getByTestId(
            TEST_ID.roomsPage
          )
        ).toBeVisible();

        /*
         * 2. Thêm phòng mới.
         * 3. Kiểm tra phòng xuất hiện.
         */
        let mainRoomRow =
          await createRoom(
            page,
            MAIN_ROOM
          );

        await expect(
          mainRoomRow
        ).toContainText(MAIN_ROOM.code);

        await expect(
          mainRoomRow
        ).toContainText(MAIN_ROOM.name);

        /*
         * Kiểm tra dữ liệu đã được lưu vào
         * một collection trong LocalStorage.
         *
         * Không phụ thuộc tên cụ thể của key
         * LocalStorage.
         */
        const storedMainRoom =
          await page.evaluate(
            (roomCode) => {
              for (
                let index = 0;
                index <
                localStorage.length;
                index += 1
              ) {
                const key =
                  localStorage.key(index);

                if (!key) {
                  continue;
                }

                try {
                  const value =
                    JSON.parse(
                      localStorage.getItem(
                        key
                      )
                    );

                  if (!Array.isArray(value)) {
                    continue;
                  }

                  const room = value.find(
                    (item) =>
                      item?.code ===
                      roomCode
                  );

                  if (room) {
                    return room;
                  }
                } catch {
                  /*
                   * Bỏ qua những key không
                   * chứa JSON hợp lệ.
                   */
                }
              }

              return null;
            },
            MAIN_ROOM.code
          );

        expect(storedMainRoom).toEqual(
          expect.objectContaining({
            code: MAIN_ROOM.code,
            name: MAIN_ROOM.name,
            monthlyRent: 3000000,
            status: MAIN_ROOM.status
          })
        );

        /*
         * 4. Tải lại trang.
         * 5. Dữ liệu vẫn tồn tại.
         */
        await page.reload();

        await expect(
          page.getByTestId(
            TEST_ID.roomsPage
          )
        ).toBeVisible();

        mainRoomRow = getRoomRow(
          page,
          MAIN_ROOM.code
        );

        await expect(
          mainRoomRow
        ).toBeVisible();

        await expect(
          mainRoomRow
        ).toContainText(MAIN_ROOM.name);

        /*
         * 6. Sửa giá phòng.
         */
        await mainRoomRow
          .getByTestId(
            TEST_ID.roomEditButton
          )
          .click();

        await expect(
          page.getByTestId(
            TEST_ID.roomForm
          )
        ).toBeVisible();

        await expect(
          page.getByTestId(
            TEST_ID.roomCodeInput
          )
        ).toHaveValue(MAIN_ROOM.code);

        await page
          .getByTestId(
            TEST_ID.roomRentInput
          )
          .fill(MAIN_ROOM.updatedRent);

        await page
          .getByTestId(
            TEST_ID.roomSubmitButton
          )
          .click();

        mainRoomRow = getRoomRow(
          page,
          MAIN_ROOM.code
        );

        await expect(
          mainRoomRow
        ).toBeVisible();

        /*
         * Hỗ trợ cách hiển thị:
         * 3.500.000, 3 500 000 hoặc 3500000.
         */
        await expect(
          mainRoomRow
        ).toContainText(
          /3(?:[.\s]?500){2}/
        );

        const updatedRent =
          await page.evaluate(
            (roomCode) => {
              for (
                let index = 0;
                index <
                localStorage.length;
                index += 1
              ) {
                const key =
                  localStorage.key(index);

                if (!key) {
                  continue;
                }

                try {
                  const value =
                    JSON.parse(
                      localStorage.getItem(
                        key
                      )
                    );

                  if (!Array.isArray(value)) {
                    continue;
                  }

                  const room = value.find(
                    (item) =>
                      item?.code ===
                      roomCode
                  );

                  if (room) {
                    return room.monthlyRent;
                  }
                } catch {
                  // Bỏ qua key không hợp lệ.
                }
              }

              return null;
            },
            MAIN_ROOM.code
          );

        expect(updatedRent).toBe(
          3_500_000
        );

        /*
         * 7. Tìm kiếm phòng.
         */
        await page
          .getByTestId(
            TEST_ID.roomSearchInput
          )
          .fill(MAIN_ROOM.code);

        await expect(
          getRoomRow(
            page,
            MAIN_ROOM.code
          )
        ).toBeVisible();

        await expect(
          page.getByTestId(
            TEST_ID.roomsTable
          )
        ).not.toContainText(
          'PHONG-KHONG-TON-TAI'
        );

        await page
          .getByTestId(
            TEST_ID.roomSearchInput
          )
          .fill(
            'PHONG-KHONG-TON-TAI'
          );

        await expect(
          getRoomRow(
            page,
            MAIN_ROOM.code
          )
        ).toBeHidden();

        await page
          .getByTestId(
            TEST_ID.roomSearchInput
          )
          .clear();

        /*
         * Tạo thêm một phòng trạng thái bảo
         * trì để kiểm tra bộ lọc không phụ
         * thuộc dữ liệu seed.
         */
        await createRoom(
          page,
          FILTER_CONTROL_ROOM
        );

        /*
         * 8. Lọc theo trạng thái.
         */
        await page
          .getByTestId(
            TEST_ID.roomStatusFilter
          )
          .selectOption('vacant');

        await expect(
          getRoomRow(
            page,
            MAIN_ROOM.code
          )
        ).toBeVisible();

        await expect(
          getRoomRow(
            page,
            FILTER_CONTROL_ROOM.code
          )
        ).toBeHidden();

        await page
          .getByTestId(
            TEST_ID.roomStatusFilter
          )
          .selectOption('maintenance');

        await expect(
          getRoomRow(
            page,
            MAIN_ROOM.code
          )
        ).toBeHidden();

        await expect(
          getRoomRow(
            page,
            FILTER_CONTROL_ROOM.code
          )
        ).toBeVisible();

        /*
         * Trả bộ lọc về tất cả trước khi xóa.
         * Giá trị rỗng thường đại diện cho
         * lựa chọn "Tất cả".
         */
        await page
          .getByTestId(
            TEST_ID.roomStatusFilter
          )
          .selectOption('');

        /*
         * 9. Xóa phòng.
         */
        mainRoomRow = getRoomRow(
          page,
          MAIN_ROOM.code
        );

        await expect(
          mainRoomRow
        ).toBeVisible();

        await mainRoomRow
          .getByTestId(
            TEST_ID.roomDeleteButton
          )
          .click();

        await expect(
          page.getByTestId(
            TEST_ID.confirmDialog
          )
        ).toBeVisible();

        await page
          .getByTestId(
            TEST_ID.confirmButton
          )
          .click();

        /*
         * 10. Phòng biến mất.
         */
        await expect(
          getRoomRow(
            page,
            MAIN_ROOM.code
          )
        ).toHaveCount(0);

        await expect(
          page.getByTestId(
            TEST_ID.roomsTable
          )
        ).not.toContainText(
          MAIN_ROOM.code
        );

        const deletedRoomExists =
          await page.evaluate(
            (roomCode) => {
              for (
                let index = 0;
                index <
                localStorage.length;
                index += 1
              ) {
                const key =
                  localStorage.key(index);

                if (!key) {
                  continue;
                }

                try {
                  const value =
                    JSON.parse(
                      localStorage.getItem(
                        key
                      )
                    );

                  if (
                    Array.isArray(value) &&
                    value.some(
                      (item) =>
                        item?.code ===
                        roomCode
                    )
                  ) {
                    return true;
                  }
                } catch {
                  // Bỏ qua key không hợp lệ.
                }
              }

              return false;
            },
            MAIN_ROOM.code
          );

        expect(
          deletedRoomExists
        ).toBe(false);
      }
    );
  }
);