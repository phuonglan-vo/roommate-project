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

  // Cấu hình dịch vụ
  servicesPage: 'services-page',
  servicesTable: 'services-table',
  addServiceButton: 'add-service-button',
  serviceForm: 'service-form',
  serviceCodeInput: 'service-code-input',
  serviceNameInput: 'service-name-input',
  serviceUnitInput: 'service-unit-input',
  serviceCalculationTypeSelect:
    'service-calculation-type-select',
  serviceUsageTypeSelect:
    'service-usage-type-select',
  serviceUnitPriceInput:
    'service-unit-price-input',
  serviceEffectiveFromInput:
    'service-effective-from-input',
  serviceActiveCheckbox:
    'service-active-checkbox',
  serviceSubmitButton:
    'service-submit-button',

  // Chỉ số điện nước
  meterReadingsPage:
    'meter-readings-page',
  meterReadingsTable:
    'meter-readings-table',
  addMeterReadingButton:
    'add-meter-reading-button',
  meterReadingForm:
    'meter-reading-form',
  meterRoomSelect:
    'meter-room-select',
  meterPeriodInput:
    'meter-period-input',
  electricityPreviousInput:
    'electricity-previous-input',
  electricityCurrentInput:
    'electricity-current-input',
  waterPreviousInput:
    'water-previous-input',
  waterCurrentInput:
    'water-current-input',
  meterReadingDateInput:
    'meter-reading-date-input',
  meterReadingSubmitButton:
    'meter-reading-submit-button',

  // Hóa đơn
  invoicesPage: 'invoices-page',
  invoicesTable: 'invoices-table',
  addInvoiceButton: 'add-invoice-button',
  invoiceForm: 'invoice-form',
  invoiceRoomSelect:
    'invoice-room-select',
  invoicePeriodInput:
    'invoice-period-input',
  invoiceSubmitButton:
    'invoice-submit-button',
  invoiceViewButton:
    'invoice-view-button',
  invoiceStatusBadge:
    'invoice-payment-status-badge',
  invoiceDetail: 'invoice-detail',
  invoiceItemsTable:
    'invoice-items-table',
  invoiceTotal: 'invoice-total',

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
    address: 'Quận Ninh Kiều, Cần Thơ'
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
      usageType: 'electricity',
      unitPrice: '3500',
      effectiveFrom: '2026-08-01'
    },

    water: {
      code: 'NUOC-E2E',
      name: 'Tiền nước',
      unit: 'm3',
      calculationType: 'usage',
      usageType: 'water',
      unitPrice: '15000',
      effectiveFrom: '2026-08-01'
    },

    internet: {
      code: 'INTERNET-E2E',
      name: 'Internet',
      unit: 'phòng',
      calculationType: 'fixed',
      unitPrice: '120000',
      effectiveFrom: '2026-08-01'
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
      `${route.replaceAll('/', '\\/')}$`
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

async function fillOptionalInput(
  locator,
  value
) {
  if (
    (await locator.count()) > 0 &&
    (await locator.isVisible()) &&
    (await locator.isEditable())
  ) {
    await locator.fill(value);
  }
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

async function confirmIfVisible(page) {
  const dialog = page.getByTestId(
    TEST_ID.confirmDialog
  );

  if (
    (await dialog.count()) > 0 &&
    (await dialog.isVisible())
  ) {
    await page
      .getByTestId(
        TEST_ID.confirmButton
      )
      .click();
  }
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

  await expect(
    page.getByTestId(TEST_ID.roomForm)
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

  const roomRow = getTableRow(
    page,
    TEST_ID.roomsTable,
    DATA.room.code
  );

  await expect(roomRow).toBeVisible();

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

  await expect(
    page.getByTestId(
      TEST_ID.tenantForm
    )
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
    .fill(DATA.tenant.identityNumber);

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

  const tenantRow = getTableRow(
    page,
    TEST_ID.tenantsTable,
    DATA.tenant.identityNumber
  );

  await expect(tenantRow).toBeVisible();

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

  await expect(
    page.getByTestId(
      TEST_ID.contractForm
    )
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

  if (await rentInput.isEditable()) {
    await rentInput.fill(
      DATA.contract.rentAmount
    );
  }

  await page
    .getByTestId(
      TEST_ID.contractDepositInput
    )
    .fill(DATA.contract.depositAmount);

  await page
    .getByTestId(
      TEST_ID.contractSubmitButton
    )
    .click();

  const contractRow = getTableRow(
    page,
    TEST_ID.contractsTable,
    DATA.contract.code
  );

  await expect(contractRow).toBeVisible();

  await contractRow
    .getByTestId(
      TEST_ID.contractActivateButton
    )
    .click();

  await confirmIfVisible(page);

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

  await page
    .getByTestId(
      TEST_ID.addServiceButton
    )
    .click();

  await expect(
    page.getByTestId(
      TEST_ID.serviceForm
    )
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

  if (service.usageType) {
    await selectOptionalValue(
      page.getByTestId(
        TEST_ID.serviceUsageTypeSelect
      ),
      service.usageType
    );
  }

  await page
    .getByTestId(
      TEST_ID.serviceUnitPriceInput
    )
    .fill(service.unitPrice);

  await fillOptionalInput(
    page.getByTestId(
      TEST_ID
        .serviceEffectiveFromInput
    ),
    service.effectiveFrom
  );

  const activeCheckbox =
    page.getByTestId(
      TEST_ID.serviceActiveCheckbox
    );

  if (
    (await activeCheckbox.count()) > 0 &&
    (await activeCheckbox.isVisible()) &&
    !(await activeCheckbox.isChecked())
  ) {
    await activeCheckbox.check();
  }

  await page
    .getByTestId(
      TEST_ID.serviceSubmitButton
    )
    .click();

  const serviceRow = getTableRow(
    page,
    TEST_ID.servicesTable,
    service.code
  );

  await expect(serviceRow).toBeVisible();
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

async function createMeterReading(page) {
  await openRoute(
    page,
    '#/meters',
    TEST_ID.meterReadingsPage
  );

  await page
    .getByTestId(
      TEST_ID.addMeterReadingButton
    )
    .click();

  await expect(
    page.getByTestId(
      TEST_ID.meterReadingForm
    )
  ).toBeVisible();

  await selectOptionByText(
    page.getByTestId(
      TEST_ID.meterRoomSelect
    ),
    DATA.room.code
  );

  await page
    .getByTestId(
      TEST_ID.meterPeriodInput
    )
    .fill(DATA.period);

  await page
    .getByTestId(
      TEST_ID.electricityPreviousInput
    )
    .fill(
      DATA.meter.electricityPrevious
    );

  await page
    .getByTestId(
      TEST_ID.electricityCurrentInput
    )
    .fill(
      DATA.meter.electricityCurrent
    );

  await page
    .getByTestId(
      TEST_ID.waterPreviousInput
    )
    .fill(DATA.meter.waterPrevious);

  await page
    .getByTestId(
      TEST_ID.waterCurrentInput
    )
    .fill(DATA.meter.waterCurrent);

  await fillOptionalInput(
    page.getByTestId(
      TEST_ID.meterReadingDateInput
    ),
    DATA.meter.readingDate
  );

  await page
    .getByTestId(
      TEST_ID.meterReadingSubmitButton
    )
    .click();

  const readingRow = getTableRow(
    page,
    TEST_ID.meterReadingsTable,
    DATA.room.code
  );

  await expect(readingRow).toBeVisible();

  await expect(readingRow).toContainText(
    String(EXPECTED.electricityUsage)
  );

  await expect(readingRow).toContainText(
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

  await page
    .getByTestId(
      TEST_ID.addInvoiceButton
    )
    .click();

  await expect(
    page.getByTestId(
      TEST_ID.invoiceForm
    )
  ).toBeVisible();

  await selectOptionByText(
    page.getByTestId(
      TEST_ID.invoiceRoomSelect
    ),
    DATA.room.code
  );

  await page
    .getByTestId(
      TEST_ID.invoicePeriodInput
    )
    .fill(DATA.period);

  await page
    .getByTestId(
      TEST_ID.invoiceSubmitButton
    )
    .click();

  const invoiceRow = getTableRow(
    page,
    TEST_ID.invoicesTable,
    DATA.room.code
  );

  await expect(invoiceRow).toBeVisible();

  return invoiceRow;
}

async function findStoredInvoice(page) {
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
              item?.period === period &&
              (
                item?.roomSnapshot
                  ?.code === roomCode ||
                item?.roomCode ===
                  roomCode
              ) &&
              Array.isArray(item?.items)
          );

          if (invoice) {
            return invoice;
          }
        } catch {
          // Bỏ qua khóa không chứa JSON.
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
        // 1. Tạo phòng.
        await createRoom(page);

        // 2. Tạo người thuê.
        await createTenant(page);

        // 3. Tạo và kích hoạt hợp đồng.
        await createAndActivateContract(
          page
        );

        /*
         * Chuẩn bị đơn giá cố định để kết quả
         * không phụ thuộc dữ liệu seed.
         */
        await createFixedServices(page);

        // 4. Ghi chỉ số điện nước.
        await createMeterReading(page);

        // 5. Tạo hóa đơn.
        const invoiceRow =
          await createInvoice(page);

        /*
         * 6. Kiểm tra tổng tiền và từng
         * khoản chính trên giao diện.
         */
        await invoiceRow
          .getByTestId(
            TEST_ID.invoiceViewButton
          )
          .click();

        await expect(
          page.getByTestId(
            TEST_ID.invoiceDetail
          )
        ).toBeVisible();

        const itemsTable =
          page.getByTestId(
            TEST_ID.invoiceItemsTable
          );

        const rentRow = itemsTable
          .getByRole('row')
          .filter({
            hasText: 'Tiền phòng'
          });

        const electricityRow = itemsTable
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

        await expect(rentRow).toContainText(
          /3(?:[.\s]?000){2}/
        );

        await expect(
          electricityRow
        ).toContainText(
          /157[.\s]?500/
        );

        await expect(waterRow).toContainText(
          /180[.\s]?000/
        );

        await expect(
          internetRow
        ).toContainText(
          /120[.\s]?000/
        );

        await expect(
          page.getByTestId(
            TEST_ID.invoiceTotal
          )
        ).toContainText(
          /3[.\s]?457[.\s]?500/
        );

        /*
         * Kiểm tra chính xác dữ liệu số đã
         * được lưu, không phụ thuộc cách
         * định dạng tiền trên giao diện.
         */
        const storedInvoice =
          await findStoredInvoice(page);

        expect(storedInvoice).not.toBeNull();

        const rentItem = getInvoiceItem(
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

        const waterItem = getInvoiceItem(
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

        expect(rentItem).toMatchObject({
          quantity: 1,
          unitPrice:
            EXPECTED.rentAmount,
          amount: EXPECTED.rentAmount
        });

        expect(
          electricityItem
        ).toMatchObject({
          quantity:
            EXPECTED.electricityUsage,

          unitPrice: 3_500,

          amount:
            EXPECTED.electricityAmount
        });

        expect(waterItem).toMatchObject({
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

        expect(storedInvoice).toMatchObject({
          subtotal: EXPECTED.total,
          discount: 0,
          total: EXPECTED.total,
          paidAmount: 0,
          remainingDebt: EXPECTED.total
        });

        /*
         * 7. Hóa đơn mới ở trạng thái
         * chưa thanh toán.
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

        /*
         * Screenshot khi lỗi và trace khi
         * retry được Playwright tự lưu theo
         * playwright.config.js.
         */
      }
    );
  }
);