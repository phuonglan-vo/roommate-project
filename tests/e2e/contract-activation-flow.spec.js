import {
  expect,
  test
} from '@playwright/test';

const TEST_ID = Object.freeze({
  // Trang phòng
  roomsPage: 'rooms-page',
  roomsTable: 'rooms-table',
  addRoomButton: 'add-room-button',
  roomForm: 'room-form',
  roomCodeInput: 'room-code-input',
  roomNameInput: 'room-name-input',
  roomAreaInput: 'room-area-input',
  roomTypeInput: 'room-type-input',
  roomRentInput: 'room-rent-input',
  roomCapacityInput: 'room-capacity-input',
  roomStatusSelect: 'room-status-select',
  roomDescriptionInput:
    'room-description-input',
  roomSubmitButton: 'room-submit-button',
  roomStatusBadge: 'room-status-badge',

  // Trang người thuê
  tenantsPage: 'tenants-page',
  tenantsTable: 'tenants-table',
  addTenantButton: 'add-tenant-button',
  tenantForm: 'tenant-form',
  tenantFullNameInput:
    'tenant-full-name-input',
  tenantPhoneInput: 'tenant-phone-input',
  tenantIdentityInput:
    'tenant-identity-number-input',
  tenantEmailInput: 'tenant-email-input',
  tenantAddressInput:
    'tenant-address-input',
  tenantSubmitButton:
    'tenant-submit-button',

  // Trang hợp đồng
  contractsPage: 'contracts-page',
  contractsTable: 'contracts-table',
  addContractButton:
    'add-contract-button',
  contractForm: 'contract-form',
  contractCodeInput:
    'contract-code-input',
  contractRoomSelect:
    'contract-room-select',
  contractRepresentativeSelect:
    'contract-representative-select',
  contractStartDateInput:
    'contract-start-date-input',
  contractEndDateInput:
    'contract-end-date-input',
  contractRentInput:
    'contract-rent-input',
  contractDepositInput:
    'contract-deposit-input',
  contractSubmitButton:
    'contract-submit-button',
  contractActivateButton:
    'contract-activate-button',
  contractStatusBadge:
    'contract-status-badge',
  contractFormError:
    'contract-form-error',

  // Thành phần dùng chung
  toastArea: 'toast-area',
  confirmDialog: 'confirm-dialog',
  confirmButton:
    'confirm-dialog-confirm'
});

const OVERLAP_ERROR =
  '[CONTRACT-06] Phòng đã có hợp đồng trùng thời gian.';

const ACTIVE_START_DATE = '2020-01-01';
const ACTIVE_END_DATE = '2099-12-31';

function createRoomData(suffix) {
  return {
    code: `E2E-P-${suffix}`,
    name: `Phòng E2E ${suffix}`,
    area: 'Khu E2E',
    roomType: 'Phòng đơn',
    monthlyRent: '3000000',
    maxOccupants: '2',
    status: 'vacant',
    description:
      `Phòng dùng cho test ${suffix}`
  };
}

function createTenantData(suffix) {
  return {
    fullName:
      `Nguyễn Văn E2E ${suffix}`,

    phone:
      suffix === '01'
        ? '0901234501'
        : '0901234502',

    identityNumber:
      suffix === '01'
        ? '079203000001'
        : '079203000002',

    email:
      `tenant-${suffix}@example.com`,

    address:
      'Quận Ninh Kiều, Cần Thơ'
  };
}

function createContractData(
  suffix,
  overrides = {}
) {
  return {
    code: `HD-E2E-${suffix}`,
    startDate: ACTIVE_START_DATE,
    endDate: ACTIVE_END_DATE,
    rentAmount: '3000000',
    depositAmount: '3000000',
    ...overrides
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

function getTenantRow(
  page,
  identityNumber
) {
  return page
    .getByTestId(TEST_ID.tenantsTable)
    .getByRole('row')
    .filter({
      hasText: identityNumber
    });
}

function getContractRow(
  page,
  contractCode
) {
  return page
    .getByTestId(
      TEST_ID.contractsTable
    )
    .getByRole('row')
    .filter({
      hasText: contractCode
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
      `${route.replace('/', '\\/')}$`
    )
  );

  await expect(
    page.getByTestId(pageTestId)
  ).toBeVisible();
}

async function selectOptionByText(
  select,
  text
) {
  const option = select
    .locator('option')
    .filter({
      hasText: text
    })
    .first();

  await expect(option).toHaveCount(1);

  const optionValue =
    await option.getAttribute('value');

  expect(optionValue).toBeTruthy();

  await select.selectOption(
    optionValue
  );

  return optionValue;
}

async function createRoom(
  page,
  roomData
) {
  await openRoute(
    page,
    '#/rooms',
    TEST_ID.roomsPage
  );

  await page
    .getByTestId(
      TEST_ID.addRoomButton
    )
    .click();

  await expect(
    page.getByTestId(TEST_ID.roomForm)
  ).toBeVisible();

  await page
    .getByTestId(
      TEST_ID.roomCodeInput
    )
    .fill(roomData.code);

  await page
    .getByTestId(
      TEST_ID.roomNameInput
    )
    .fill(roomData.name);

  await page
    .getByTestId(
      TEST_ID.roomAreaInput
    )
    .fill(roomData.area);

  await page
    .getByTestId(
      TEST_ID.roomTypeInput
    )
    .fill(roomData.roomType);

  await page
    .getByTestId(
      TEST_ID.roomRentInput
    )
    .fill(roomData.monthlyRent);

  await page
    .getByTestId(
      TEST_ID.roomCapacityInput
    )
    .fill(roomData.maxOccupants);

  const statusSelect =
    page.getByTestId(
      TEST_ID.roomStatusSelect
    );

  if (await statusSelect.isEnabled()) {
    await statusSelect.selectOption(
      roomData.status
    );
  }

  await page
    .getByTestId(
      TEST_ID.roomDescriptionInput
    )
    .fill(roomData.description);

  await page
    .getByTestId(
      TEST_ID.roomSubmitButton
    )
    .click();

  const roomRow = getRoomRow(
    page,
    roomData.code
  );

  await expect(roomRow).toBeVisible();

  await expect(roomRow).toContainText(
    roomData.name
  );

  return roomRow;
}

async function createTenant(
  page,
  tenantData
) {
  await openRoute(
    page,
    '#/tenants',
    TEST_ID.tenantsPage
  );

  await page
    .getByTestId(
      TEST_ID.addTenantButton
    )
    .click();

  await expect(
    page.getByTestId(
      TEST_ID.tenantForm
    )
  ).toBeVisible();

  await page
    .getByTestId(
      TEST_ID.tenantFullNameInput
    )
    .fill(tenantData.fullName);

  await page
    .getByTestId(
      TEST_ID.tenantPhoneInput
    )
    .fill(tenantData.phone);

  await page
    .getByTestId(
      TEST_ID.tenantIdentityInput
    )
    .fill(
      tenantData.identityNumber
    );

  await page
    .getByTestId(
      TEST_ID.tenantEmailInput
    )
    .fill(tenantData.email);

  await page
    .getByTestId(
      TEST_ID.tenantAddressInput
    )
    .fill(tenantData.address);

  await page
    .getByTestId(
      TEST_ID.tenantSubmitButton
    )
    .click();

  const tenantRow = getTenantRow(
    page,
    tenantData.identityNumber
  );

  await expect(tenantRow).toBeVisible();

  await expect(
    tenantRow
  ).toContainText(
    tenantData.fullName
  );

  return tenantRow;
}

async function openContractForm(page) {
  await openRoute(
    page,
    '#/contracts',
    TEST_ID.contractsPage
  );

  await page
    .getByTestId(
      TEST_ID.addContractButton
    )
    .click();

  await expect(
    page.getByTestId(
      TEST_ID.contractForm
    )
  ).toBeVisible();
}

async function fillContractForm(
  page,
  {
    contractData,
    roomData,
    tenantData
  }
) {
  await page
    .getByTestId(
      TEST_ID.contractCodeInput
    )
    .fill(contractData.code);

  await selectOptionByText(
    page.getByTestId(
      TEST_ID.contractRoomSelect
    ),
    roomData.code
  );

  await selectOptionByText(
    page.getByTestId(
      TEST_ID
        .contractRepresentativeSelect
    ),
    tenantData.fullName
  );

  await page
    .getByTestId(
      TEST_ID.contractStartDateInput
    )
    .fill(contractData.startDate);

  await page
    .getByTestId(
      TEST_ID.contractEndDateInput
    )
    .fill(contractData.endDate);

  const rentInput =
    page.getByTestId(
      TEST_ID.contractRentInput
    );

  /*
   * Một số form tự lấy giá phòng và
   * khóa ô giá thuê. Chỉ nhập khi ô
   * còn cho phép chỉnh sửa.
   */
  if (await rentInput.isEditable()) {
    await rentInput.fill(
      contractData.rentAmount
    );
  }

  await page
    .getByTestId(
      TEST_ID.contractDepositInput
    )
    .fill(contractData.depositAmount);
}

async function createDraftContract(
  page,
  context
) {
  await openContractForm(page);

  await fillContractForm(
    page,
    context
  );

  await page
    .getByTestId(
      TEST_ID.contractSubmitButton
    )
    .click();

  const contractRow =
    getContractRow(
      page,
      context.contractData.code
    );

  await expect(
    contractRow
  ).toBeVisible();

  return contractRow;
}

async function confirmActionIfVisible(
  page
) {
  const confirmDialog =
    page.getByTestId(
      TEST_ID.confirmDialog
    );

  /*
   * Chờ dialog xuất hiện thay vì kiểm tra
   * ngay lập tức bằng isVisible().
   */
  await expect(
    confirmDialog
  ).toBeVisible();

  const confirmButton =
    page.getByTestId(
      TEST_ID.confirmButton
    );

  await expect(
    confirmButton
  ).toBeVisible();

  await expect(
    confirmButton
  ).toBeEnabled();

  await confirmButton.click();

  /*
   * Chờ dialog đóng để chắc chắn thao tác
   * kích hoạt đã hoàn tất.
   */
  await expect(
    confirmDialog
  ).toBeHidden();
}

test.describe(
  'Luồng tạo và kích hoạt hợp đồng',
  () => {
    test.beforeEach(
      async ({ page }) => {
        /*
         * Mỗi test có browser context riêng.
         * Vẫn chủ động xóa LocalStorage để
         * không phụ thuộc dữ liệu seed.
         */
        await page.goto('/');

        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      }
    );

    test(
      'tạo phòng, người thuê, hợp đồng và kích hoạt thành công',
      async ({ page }) => {
        const roomData =
          createRoomData('01');

        const tenantData =
          createTenantData('01');

        const contractData =
          createContractData('01');

        // 1. Tạo phòng mới.
        await createRoom(
          page,
          roomData
        );

        // 2. Tạo người thuê.
        await createTenant(
          page,
          tenantData
        );

        // 3. Tạo hợp đồng nháp.
        let contractRow =
          await createDraftContract(
            page,
            {
              roomData,
              tenantData,
              contractData
            }
          );

        await expect(
          contractRow
        ).toContainText(
          contractData.code
        );

        /*
         * Hợp đồng mới chưa kích hoạt
         * phải ở trạng thái nháp.
         */
        await expect(
          contractRow.getByTestId(
            TEST_ID.contractStatusBadge
          )
        ).toContainText(/Nháp/i);

        // 4. Kích hoạt hợp đồng.
        await contractRow
          .getByTestId(
            TEST_ID
              .contractActivateButton
          )
          .click();

        await confirmActionIfVisible(
          page
        );

        /*
         * Hợp đồng chuyển sang trạng thái
         * đang hiệu lực.
         */
        contractRow = getContractRow(
          page,
          contractData.code
        );

        await expect(
          contractRow.getByTestId(
            TEST_ID.contractStatusBadge
          )
        ).toContainText(
          /Đang hiệu lực|Hiệu lực/i
        );

        /*
         * 5. Phòng chuyển sang trạng thái
         * đang thuê.
         */
        await openRoute(
          page,
          '#/rooms',
          TEST_ID.roomsPage
        );

        const roomRow = getRoomRow(
          page,
          roomData.code
        );

        await expect(roomRow).toBeVisible();

        await expect(
          roomRow.getByTestId(
            TEST_ID.roomStatusBadge
          )
        ).toContainText(
          /Đang thuê|Có người thuê/i
        );

        /*
         * 6. Hợp đồng vẫn xuất hiện trong
         * danh sách hợp đồng.
         */
        await openRoute(
          page,
          '#/contracts',
          TEST_ID.contractsPage
        );

        contractRow = getContractRow(
          page,
          contractData.code
        );

        await expect(
          contractRow
        ).toBeVisible();

        await expect(
          contractRow
        ).toContainText(roomData.code);

        await expect(
          contractRow
        ).toContainText(
          tenantData.fullName
        );

        await expect(
          contractRow.getByTestId(
            TEST_ID.contractStatusBadge
          )
        ).toContainText(
          /Đang hiệu lực|Hiệu lực/i
        );
      }
    );

    test(
      'không cho tạo hợp đồng trùng thời gian và hiển thị đúng lỗi',
      async ({ page }) => {
        const roomData =
          createRoomData('02');

        const tenantData =
          createTenantData('02');

        const firstContract =
          createContractData(
            '02-A',
            {
              startDate:
                '2026-01-01',

              endDate:
                '2026-12-31'
            }
          );

        const overlappingContract =
          createContractData(
            '02-B',
            {
              startDate:
                '2026-06-01',

              endDate:
                '2027-05-31'
            }
          );

        /*
         * Test tự chuẩn bị toàn bộ dữ liệu,
         * không phụ thuộc test trước.
         */
        await createRoom(
          page,
          roomData
        );

        await createTenant(
          page,
          tenantData
        );

        await createDraftContract(
          page,
          {
            roomData,
            tenantData,

            contractData:
              firstContract
          }
        );

        /*
         * Thử tạo hợp đồng thứ hai cùng
         * phòng và trùng một phần thời gian.
         */
        await openContractForm(page);

        await fillContractForm(
          page,
          {
            roomData,
            tenantData,

            contractData:
              overlappingContract
          }
        );

        await page
          .getByTestId(
            TEST_ID.contractSubmitButton
          )
          .click();

        /*
         * Lỗi có thể được hiển thị trong
         * form hoặc toast. Cả hai đều được
         * chọn bằng data-testid.
         */
        const errorMessage =
          page
            .locator(
              [
                `[data-testid="${TEST_ID.contractFormError}"]`,
                `[data-testid="${TEST_ID.toastArea}"]`
              ].join(', ')
            )
            .filter({
              hasText: OVERLAP_ERROR
            });

        await expect(
          errorMessage
        ).toBeVisible();

        await expect(
          errorMessage
        ).toContainText(
          OVERLAP_ERROR
        );

        /*
         * Hợp đồng đầu tiên vẫn tồn tại.
         */
        await expect(
          getContractRow(
            page,
            firstContract.code
          )
        ).toBeVisible();

        /*
         * Hợp đồng bị trùng không được
         * thêm vào danh sách.
         */
        await expect(
          getContractRow(
            page,
            overlappingContract.code
          )
        ).toHaveCount(0);
      }
    );
  }
);