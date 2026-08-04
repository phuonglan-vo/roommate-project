import {
  expect,
  test
} from '@playwright/test';

const TEST_ID = Object.freeze({
  // Phòng
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

  // Người thuê
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

  // Hợp đồng
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

  // Dịch vụ
  servicesPage: 'services-page',
  servicesTable: 'service-table',
  addServiceButton:
    'service-add-button',
  serviceForm:
    'service-form-modal',
  serviceCodeInput:
    'service-form-code',
  serviceNameInput:
    'service-form-name',
  serviceUnitInput:
    'service-form-unit',
  serviceCalculationTypeSelect:
    'service-form-calculation-type',
  serviceUnitPriceInput:
    'service-form-unit-price',
  serviceSubmitButton:
    'service-form-submit',

  // Chỉ số điện nước
  meterReadingsPage:
    'meter-readings-page',
  meterReadingsTable:
    'meter-table',
  meterMonthFilter:
    'meter-month-filter',
  addMeterReadingButton:
    'meter-add-button',
  meterReadingForm:
    'meter-form-modal',
  meterRoomSelect:
    'meter-form-room',
  meterPeriodInput:
    'meter-form-period',
  meterReadingDateInput:
    'meter-form-reading-date',
  electricityPreviousInput:
    'meter-form-electricity-previous',
  electricityCurrentInput:
    'meter-form-electricity-current',
  waterPreviousInput:
    'meter-form-water-previous',
  waterCurrentInput:
    'meter-form-water-current',
  electricityUsageValue:
    'meter-form-electricity-usage',
  waterUsageValue:
    'meter-form-water-usage',
  meterReadingSubmitButton:
    'meter-form-submit',

  // Hóa đơn
  invoicesPage: 'invoices-page',
  invoicesTable: 'invoice-table',
  invoiceMonthFilter:
    'invoice-month-filter',
  addInvoiceButton:
    'invoice-add-button',
  invoiceForm:
    'invoice-form-modal',
  invoiceRoomSelect:
    'invoice-form-room',
  invoicePeriodInput:
    'invoice-form-period',
  invoiceSubmitButton:
    'invoice-form-submit',
  invoiceStatusBadge:
    'invoice-payment-status-badge',
  invoiceDetail:
    'invoice-detail-modal',
  invoiceDetailContent:
    'invoice-detail-content',
  invoiceItemsTable:
    'invoice-detail-items-table',

  // Dùng chung
  confirmDialog: 'confirm-dialog',
  confirmButton:
    'confirm-dialog-confirm'
});

const DATA = Object.freeze({
  room: {
    code: 'E2E-BILL-01',
    name: 'Phòng E2E lập hóa đơn',
    area: 'Khu E2E',
    roomType: 'Phòng đơn',
    monthlyRent: '3500000',
    maxOccupants: '2',
    status: 'vacant',
    description:
      'Phòng dùng kiểm thử hóa đơn'
  },

  tenant: {
    fullName: 'Nguyễn Văn Hóa Đơn',
    phone: '0901234599',
    identityNumber: '079203009999',
    email: 'invoice-e2e@example.com',
    address:
      'Quận Ninh Kiều, Cần Thơ'
  },

  contract: {
    code: 'HD-E2E-BILL-01',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    rentAmount: '3000000',
    depositAmount: '3000000'
  },

  period: '2026-08',

  meter: {
    readingDate: '2026-08-03',
    electricityPrevious: '120',
    electricityCurrent: '165',
    waterPrevious: '30',
    waterCurrent: '42'
  },

  services: {
    electricity: {
      code: 'DIEN-E2E',
      name: 'Tiền điện',
      unit: 'kWh',
      calculationType: 'usage',
      unitPrice: '3500'
    },

    water: {
      code: 'NUOC-E2E',
      name: 'Tiền nước',
      unit: 'm3',
      calculationType: 'usage',
      unitPrice: '15000'
    },

    internet: {
      code: 'INTERNET-E2E',
      name: 'Internet',
      unit: 'phòng',
      calculationType: 'fixed',
      unitPrice: '120000'
    }
  }
});

const EXPECTED = Object.freeze({
  electricityUsage: 45,
  waterUsage: 12,

  rentAmount: 3_000_000,
  electricityAmount: 157_500,
  waterAmount: 180_000,
  internetAmount: 120_000,

  total: 3_457_500
});

function getTableRow(
  page,
  tableTestId,
  text
) {
  return page
    .getByTestId(tableTestId)
    .getByRole('row')
    .filter({
      hasText: text
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
      `${route.replaceAll(
        '/',
        '\\/'
      )}$`
    )
  );

  await expect(
    page.getByTestId(pageTestId)
  ).toBeVisible();
}

async function selectOptionByText(
  select,
  expectedText
) {
  const option = select
    .locator('option')
    .filter({
      hasText: expectedText
    })
    .first();

  await expect(option).toHaveCount(1);

  const value =
    await option.getAttribute('value');

  expect(value).toBeTruthy();

  await select.selectOption(value);

  return value;
}

async function selectOptionalValue(
  locator,
  value
) {
  if (
    (await locator.count()) > 0 &&
    (await locator.isVisible()) &&
    (await locator.isEnabled())
  ) {
    await locator.selectOption(value);
  }
}

async function confirmAction(page) {
  const dialog =
    page.getByTestId(
      TEST_ID.confirmDialog
    );

  await expect(dialog).toBeVisible();

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

  await expect(dialog).toBeHidden();

  await expect(
    page.locator('.modal-backdrop')
  ).toHaveCount(0);
}

async function createRoom(page) {
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

  const roomForm =
    page.getByTestId(
      TEST_ID.roomForm
    );

  await expect(
    roomForm
  ).toBeVisible();

  await page
    .getByTestId(
      TEST_ID.roomCodeInput
    )
    .fill(DATA.room.code);

  await page
    .getByTestId(
      TEST_ID.roomNameInput
    )
    .fill(DATA.room.name);

  await page
    .getByTestId(
      TEST_ID.roomAreaInput
    )
    .fill(DATA.room.area);

  await page
    .getByTestId(
      TEST_ID.roomTypeInput
    )
    .fill(DATA.room.roomType);

  await page
    .getByTestId(
      TEST_ID.roomRentInput
    )
    .fill(DATA.room.monthlyRent);

  await page
    .getByTestId(
      TEST_ID.roomCapacityInput
    )
    .fill(DATA.room.maxOccupants);

  await selectOptionalValue(
    page.getByTestId(
      TEST_ID.roomStatusSelect
    ),
    DATA.room.status
  );

  await page
    .getByTestId(
      TEST_ID.roomDescriptionInput
    )
    .fill(DATA.room.description);

  await page
    .getByTestId(
      TEST_ID.roomSubmitButton
    )
    .click();

  await expect(
    roomForm
  ).toBeHidden();

  const roomRow = getTableRow(
    page,
    TEST_ID.roomsTable,
    DATA.room.code
  );

  await expect(
    roomRow
  ).toBeVisible();

  return roomRow;
}

async function createTenant(page) {
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

  const tenantForm =
    page.getByTestId(
      TEST_ID.tenantForm
    );

  await expect(
    tenantForm
  ).toBeVisible();

  await page
    .getByTestId(
      TEST_ID.tenantFullNameInput
    )
    .fill(DATA.tenant.fullName);

  await page
    .getByTestId(
      TEST_ID.tenantPhoneInput
    )
    .fill(DATA.tenant.phone);

  await page
    .getByTestId(
      TEST_ID.tenantIdentityInput
    )
    .fill(
      DATA.tenant.identityNumber
    );

  await page
    .getByTestId(
      TEST_ID.tenantEmailInput
    )
    .fill(DATA.tenant.email);

  await page
    .getByTestId(
      TEST_ID.tenantAddressInput
    )
    .fill(DATA.tenant.address);

  await page
    .getByTestId(
      TEST_ID.tenantSubmitButton
    )
    .click();

  await expect(
    tenantForm
  ).toBeHidden();

  const tenantRow = getTableRow(
    page,
    TEST_ID.tenantsTable,
    DATA.tenant.identityNumber
  );

  await expect(
    tenantRow
  ).toBeVisible();

  return tenantRow;
}

async function createAndActivateContract(
  page
) {
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

  const contractForm =
    page.getByTestId(
      TEST_ID.contractForm
    );

  await expect(
    contractForm
  ).toBeVisible();

  await page
    .getByTestId(
      TEST_ID.contractCodeInput
    )
    .fill(DATA.contract.code);

  await selectOptionByText(
    page.getByTestId(
      TEST_ID.contractRoomSelect
    ),
    DATA.room.code
  );

  await selectOptionByText(
    page.getByTestId(
      TEST_ID
        .contractRepresentativeSelect
    ),
    DATA.tenant.fullName
  );

  await page
    .getByTestId(
      TEST_ID.contractStartDateInput
    )
    .fill(DATA.contract.startDate);

  await page
    .getByTestId(
      TEST_ID.contractEndDateInput
    )
    .fill(DATA.contract.endDate);

  const rentInput =
    page.getByTestId(
      TEST_ID.contractRentInput
    );

  if (
    await rentInput.isEditable()
  ) {
    await rentInput.fill(
      DATA.contract.rentAmount
    );
  }

  await page
    .getByTestId(
      TEST_ID.contractDepositInput
    )
    .fill(
      DATA.contract.depositAmount
    );

  await page
    .getByTestId(
      TEST_ID.contractSubmitButton
    )
    .click();

  await expect(
    contractForm
  ).toBeHidden();

  let contractRow = getTableRow(
    page,
    TEST_ID.contractsTable,
    DATA.contract.code
  );

  await expect(
    contractRow
  ).toBeVisible();

  await expect(
    contractRow.getByTestId(
      TEST_ID.contractStatusBadge
    )
  ).toContainText(/Nháp/i);

  const activateButton =
    contractRow.getByTestId(
      TEST_ID.contractActivateButton
    );

  await expect(
    activateButton
  ).toBeVisible();

  await expect(
    activateButton
  ).toBeEnabled();

  await activateButton.click();

  await confirmAction(page);

  /*
   * Bảng đã render lại sau khi
   * kích hoạt nên lấy lại locator.
   */
  contractRow = getTableRow(
    page,
    TEST_ID.contractsTable,
    DATA.contract.code
  );

  await expect(
    contractRow
  ).toBeVisible();

  await expect(
    contractRow.getByTestId(
      TEST_ID.contractStatusBadge
    )
  ).toContainText(
    /Đang hiệu lực|Hiệu lực/i
  );

  return contractRow;
}

async function createService(
  page,
  service
) {
  await openRoute(
    page,
    '#/services',
    TEST_ID.servicesPage
  );

  const addButton =
    page.getByTestId(
      TEST_ID.addServiceButton
    );

  await expect(
    addButton
  ).toBeVisible();

  await expect(
    addButton
  ).toBeEnabled();

  await addButton.click();

  const serviceForm =
    page.getByTestId(
      TEST_ID.serviceForm
    );

  await expect(
    serviceForm
  ).toBeVisible();

  await page
    .getByTestId(
      TEST_ID.serviceCodeInput
    )
    .fill(service.code);

  await page
    .getByTestId(
      TEST_ID.serviceNameInput
    )
    .fill(service.name);

  await page
    .getByTestId(
      TEST_ID.serviceUnitInput
    )
    .fill(service.unit);

  await page
    .getByTestId(
      TEST_ID
        .serviceCalculationTypeSelect
    )
    .selectOption(
      service.calculationType
    );

  await page
    .getByTestId(
      TEST_ID.serviceUnitPriceInput
    )
    .fill(service.unitPrice);

  const submitButton =
    page.getByTestId(
      TEST_ID.serviceSubmitButton
    );

  await expect(
    submitButton
  ).toBeVisible();

  await expect(
    submitButton
  ).toBeEnabled();

  await submitButton.click();

  await expect(
    serviceForm
  ).toBeHidden();

  await expect(
    page.locator('.modal-backdrop')
  ).toHaveCount(0);

  const serviceRow = getTableRow(
    page,
    TEST_ID.servicesTable,
    service.code
  );

  await expect(
    serviceRow
  ).toBeVisible();

  await expect(
    serviceRow
  ).toContainText(service.name);
}

async function createFixedServices(
  page
) {
  await createService(
    page,
    DATA.services.electricity
  );

  await createService(
    page,
    DATA.services.water
  );

  await createService(
    page,
    DATA.services.internet
  );
}

async function createMeterReading(
  page
) {
  await openRoute(
    page,
    '#/meters',
    TEST_ID.meterReadingsPage
  );

  /*
   * Chọn tháng trên bộ lọc trang.
   * Trường tháng trong modal readOnly.
   */
  const monthFilter =
    page.getByTestId(
      TEST_ID.meterMonthFilter
    );

  await expect(
    monthFilter
  ).toBeVisible();

  await monthFilter.fill(
    DATA.period
  );

  await monthFilter.dispatchEvent(
    'change'
  );

  await expect(
    monthFilter
  ).toHaveValue(DATA.period);

  const addButton =
    page.getByTestId(
      TEST_ID.addMeterReadingButton
    );

  await expect(
    addButton
  ).toBeVisible();

  await expect(
    addButton
  ).toBeEnabled();

  await addButton.click();

  const meterForm =
    page.getByTestId(
      TEST_ID.meterReadingForm
    );

  await expect(
    meterForm
  ).toBeVisible();

  await selectOptionByText(
    page.getByTestId(
      TEST_ID.meterRoomSelect
    ),
    DATA.room.code
  );

  /*
   * Không fill trường tháng trong
   * modal vì trường này readOnly.
   */
  await expect(
    page.getByTestId(
      TEST_ID.meterPeriodInput
    )
  ).toHaveValue(DATA.period);

  const electricityPreviousInput =
    page.getByTestId(
      TEST_ID
        .electricityPreviousInput
    );

  await expect(
    electricityPreviousInput
  ).toBeEditable();

  await electricityPreviousInput.fill(
    DATA.meter.electricityPrevious
  );

  await page
    .getByTestId(
      TEST_ID.electricityCurrentInput
    )
    .fill(
      DATA.meter.electricityCurrent
    );

  const waterPreviousInput =
    page.getByTestId(
      TEST_ID.waterPreviousInput
    );

  await expect(
    waterPreviousInput
  ).toBeEditable();

  await waterPreviousInput.fill(
    DATA.meter.waterPrevious
  );

  await page
    .getByTestId(
      TEST_ID.waterCurrentInput
    )
    .fill(DATA.meter.waterCurrent);

  await page
    .getByTestId(
      TEST_ID.meterReadingDateInput
    )
    .fill(DATA.meter.readingDate);

  /*
   * Kiểm tra lượng tiêu thụ
   * ngay trên modal.
   */
  await expect(
    page.getByTestId(
      TEST_ID.electricityUsageValue
    )
  ).toHaveText(
    String(
      EXPECTED.electricityUsage
    )
  );

  await expect(
    page.getByTestId(
      TEST_ID.waterUsageValue
    )
  ).toHaveText(
    String(EXPECTED.waterUsage)
  );

  const submitButton =
    page.getByTestId(
      TEST_ID
        .meterReadingSubmitButton
    );

  await expect(
    submitButton
  ).toBeVisible();

  await expect(
    submitButton
  ).toBeEnabled();

  await submitButton.click();

  await expect(
    meterForm
  ).toBeHidden();

  await expect(
    page.locator('.modal-backdrop')
  ).toHaveCount(0);

  const readingRow = getTableRow(
    page,
    TEST_ID.meterReadingsTable,
    DATA.room.code
  );

  await expect(
    readingRow
  ).toBeVisible();

  await expect(
    readingRow
  ).toContainText(
    String(
      EXPECTED.electricityUsage
    )
  );

  await expect(
    readingRow
  ).toContainText(
    String(EXPECTED.waterUsage)
  );

  return readingRow;
}

async function createInvoice(page) {
  await openRoute(
    page,
    '#/invoices',
    TEST_ID.invoicesPage
  );

  const monthFilter =
    page.getByTestId(
      TEST_ID.invoiceMonthFilter
    );

  await expect(
    monthFilter
  ).toBeVisible();

  await monthFilter.fill(
    DATA.period
  );

  await monthFilter.dispatchEvent(
    'change'
  );

  await expect(
    monthFilter
  ).toHaveValue(DATA.period);

  const addButton =
    page.getByTestId(
      TEST_ID.addInvoiceButton
    );

  await expect(
    addButton
  ).toBeVisible();

  await expect(
    addButton
  ).toBeEnabled();

  await addButton.click();

  const invoiceForm =
    page.getByTestId(
      TEST_ID.invoiceForm
    );

  await expect(
    invoiceForm
  ).toBeVisible();

  await selectOptionByText(
    page.getByTestId(
      TEST_ID.invoiceRoomSelect
    ),
    DATA.room.code
  );

  const periodInput =
    page.getByTestId(
      TEST_ID.invoicePeriodInput
    );

  await periodInput.fill(
    DATA.period
  );

  await expect(
    periodInput
  ).toHaveValue(DATA.period);

  const submitButton =
    page.getByTestId(
      TEST_ID.invoiceSubmitButton
    );

  await expect(
    submitButton
  ).toBeVisible();

  await expect(
    submitButton
  ).toBeEnabled();

  await submitButton.click();

  await expect(
    invoiceForm
  ).toBeHidden();

  await expect(
    page.locator('.modal-backdrop')
  ).toHaveCount(0);

  const invoiceRow = getTableRow(
    page,
    TEST_ID.invoicesTable,
    DATA.room.code
  );

  await expect(
    invoiceRow
  ).toBeVisible();

  return invoiceRow;
}

async function findStoredInvoice(
  page
) {
  return page.evaluate(
    ({ roomCode, period }) => {
      for (
        let index = 0;
        index < localStorage.length;
        index += 1
      ) {
        const key =
          localStorage.key(index);

        if (!key) {
          continue;
        }

        try {
          const value = JSON.parse(
            localStorage.getItem(key)
          );

          if (!Array.isArray(value)) {
            continue;
          }

          const invoice = value.find(
            (item) =>
              item?.period ===
                period &&
              (
                item?.roomSnapshot
                  ?.code ===
                    roomCode ||
                item?.roomCode ===
                  roomCode
              ) &&
              Array.isArray(
                item?.items
              )
          );

          if (invoice) {
            return invoice;
          }
        } catch {
          /*
           * Bỏ qua khóa LocalStorage
           * không chứa JSON hợp lệ.
           */
        }
      }

      return null;
    },
    {
      roomCode: DATA.room.code,
      period: DATA.period
    }
  );
}

function getInvoiceItem(
  invoice,
  type,
  sourceName
) {
  return invoice.items.find(
    (item) =>
      item.type === type ||
      item.name === sourceName
  );
}

test.describe(
  'Luồng tạo hóa đơn từ hợp đồng và chỉ số điện nước',
  () => {
    test.beforeEach(
      async ({ page }) => {
        await page.goto('/');

        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      }
    );

    test(
      'tạo hóa đơn đúng tổng tiền và trạng thái chưa thanh toán',
      async ({ page }) => {
        /*
         * 1. Tạo phòng.
         */
        await createRoom(page);

        /*
         * 2. Tạo người thuê.
         */
        await createTenant(page);

        /*
         * 3. Tạo và kích hoạt
         * hợp đồng.
         */
        await createAndActivateContract(
          page
        );

        /*
         * 4. Tạo các dịch vụ với
         * đơn giá cố định cho test.
         */
        await createFixedServices(page);

        /*
         * 5. Ghi chỉ số điện nước.
         */
        await createMeterReading(page);

        /*
         * 6. Tạo hóa đơn.
         */
        const invoiceRow =
          await createInvoice(page);

        /*
         * 7. Mở chi tiết hóa đơn.
         */
        const viewButton =
          invoiceRow.getByRole(
            'button',
            {
              name: /Xem hóa đơn/i
            }
          );

        await expect(
          viewButton
        ).toBeVisible();

        await expect(
          viewButton
        ).toBeEnabled();

        await viewButton.click();

        const invoiceDetail =
          page.getByTestId(
            TEST_ID.invoiceDetail
          );

        await expect(
          invoiceDetail
        ).toBeVisible();

        const itemsTable =
          page.getByTestId(
            TEST_ID.invoiceItemsTable
          );

        await expect(
          itemsTable
        ).toBeVisible();

        /*
         * 8. Tìm từng dòng khoản thu.
         */
        const rentRow = itemsTable
          .getByRole('row')
          .filter({
            hasText: 'Tiền phòng'
          });

        const electricityRow =
          itemsTable
            .getByRole('row')
            .filter({
              hasText: 'Tiền điện'
            });

        const waterRow = itemsTable
          .getByRole('row')
          .filter({
            hasText: 'Tiền nước'
          });

        const internetRow = itemsTable
          .getByRole('row')
          .filter({
            hasText: 'Internet'
          });

        /*
         * 9. Kiểm tra tiền phòng.
         */
        await expect(
          rentRow
        ).toContainText(
          /3(?:[.\s]?000){2}/
        );

        /*
         * Điện:
         * 165 - 120 = 45 kWh
         * 45 × 3.500 = 157.500
         */
        await expect(
          electricityRow
        ).toContainText(
          /157[.\s]?500/
        );

        /*
         * Nước:
         * 42 - 30 = 12 m3
         * 12 × 15.000 = 180.000
         */
        await expect(
          waterRow
        ).toContainText(
          /180[.\s]?000/
        );

        /*
         * Internet cố định:
         * 120.000 đồng.
         */
        await expect(
          internetRow
        ).toContainText(
          /120[.\s]?000/
        );

        /*
         * Tổng:
         * 3.000.000
         * + 157.500
         * + 180.000
         * + 120.000
         * = 3.457.500
         */
        const invoiceDetailContent =
          page.getByTestId(
            TEST_ID
              .invoiceDetailContent
          );

        const totalRow =
          invoiceDetailContent.locator(
            '.rm-invoice-detail-total-row'
          );

        await expect(
          totalRow
        ).toContainText(/Tổng tiền/i);

        await expect(
          totalRow
        ).toContainText(
          /3[.\s]?457[.\s]?500/
        );

        /*
         * 10. Đọc dữ liệu hóa đơn
         * từ LocalStorage.
         */
        const storedInvoice =
          await findStoredInvoice(page);

        expect(
          storedInvoice
        ).not.toBeNull();

        const rentItem =
          getInvoiceItem(
            storedInvoice,
            'rent',
            'Tiền phòng'
          );

        const electricityItem =
          getInvoiceItem(
            storedInvoice,
            'electricity',
            'Tiền điện'
          );

        const waterItem =
          getInvoiceItem(
            storedInvoice,
            'water',
            'Tiền nước'
          );

        const internetItem =
          getInvoiceItem(
            storedInvoice,
            'service',
            'Internet'
          );

        expect(
          rentItem
        ).toMatchObject({
          quantity: 1,
          unitPrice:
            EXPECTED.rentAmount,
          amount:
            EXPECTED.rentAmount
        });

        expect(
          electricityItem
        ).toMatchObject({
          quantity:
            EXPECTED
              .electricityUsage,

          unitPrice: 3_500,

          amount:
            EXPECTED
              .electricityAmount
        });

        expect(
          waterItem
        ).toMatchObject({
          quantity:
            EXPECTED.waterUsage,

          unitPrice: 15_000,

          amount:
            EXPECTED.waterAmount
        });

        expect(
          internetItem
        ).toMatchObject({
          quantity: 1,

          unitPrice:
            EXPECTED.internetAmount,

          amount:
            EXPECTED.internetAmount
        });

        expect(
          storedInvoice
        ).toMatchObject({
          subtotal: EXPECTED.total,
          discount: 0,
          total: EXPECTED.total,
          paidAmount: 0,
          remainingDebt:
            EXPECTED.total
        });

        /*
         * 11. Hóa đơn mới phải ở
         * trạng thái chưa thanh toán.
         */
        await expect(
          invoiceRow.getByTestId(
            TEST_ID.invoiceStatusBadge
          )
        ).toContainText(
          /Chưa thanh toán/i
        );

        expect(
          storedInvoice.paymentStatus
        ).toBe('unpaid');
      }
    );
  }
);