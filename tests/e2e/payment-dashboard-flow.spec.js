import {
  expect,
  test
} from '@playwright/test';

import {
  STORAGE_KEYS
} from '../../src/constants/storage-keys.js';

import {
  CONTRACT_STATUS,
  INVOICE_DOCUMENT_STATUS,
  INVOICE_PAYMENT_STATUS,
  ROOM_STATUS
} from '../../src/constants/statuses.js';

const TEST_ID = Object.freeze({
  // Hóa đơn
  invoicesPage: 'invoices-page',
  invoicesTable: 'invoices-table',
  invoicePaymentStatusBadge:
    'invoice-payment-status-badge',
  invoicePaidAmount:
    'invoice-paid-amount',
  invoiceRemainingDebt:
    'invoice-remaining-debt',

  // Thanh toán
  paymentsPage: 'payments-page',
  paymentsTable: 'payments-table',
  addPaymentButton:
    'add-payment-button',
  paymentForm: 'payment-form',
  paymentInvoiceSelect:
    'payment-invoice-select',
  paymentAmountInput:
    'payment-amount-input',
  paymentMethodSelect:
    'payment-method-select',
  paymentDateInput:
    'payment-date-input',
  paymentReferenceInput:
    'payment-reference-input',
  paymentNoteInput:
    'payment-note-input',
  paymentSubmitButton:
    'payment-submit-button',

  // Dashboard
  dashboardPage: 'dashboard-page',
  dashboardMonthFilter:
    'dashboard-month-filter',

  dashboardCollectedAmount:
    'dashboard-collected-amount',

  dashboardTotalDebt:
    'dashboard-total-debt',

  // Thành phần dùng chung
  confirmDialog: 'confirm-dialog',
  confirmButton:
    'confirm-dialog-confirm'
});

const TEST_DATA = Object.freeze({
  room: {
    id: 'room-payment-e2e-01',
    code: 'E2E-PAY-01',
    name: 'Phòng thanh toán E2E',
    area: 'Khu E2E',
    roomType: 'Phòng đơn',
    monthlyRent: 2_000_000,
    maxOccupants: 2,
    status: ROOM_STATUS.OCCUPIED,
    createdAt:
      '2026-08-01T00:00:00.000Z',
    updatedAt:
      '2026-08-01T00:00:00.000Z'
  },

  tenant: {
    id: 'tenant-payment-e2e-01',
    fullName:
      'Nguyễn Văn Thanh Toán',
    phone: '0901234588',
    identityNumber:
      '079203008888',
    email:
      'payment-e2e@example.com',
    address:
      'Quận Ninh Kiều, Cần Thơ',
    status: 'active',
    vehiclePlates: [],
    createdAt:
      '2026-08-01T00:00:00.000Z',
    updatedAt:
      '2026-08-01T00:00:00.000Z'
  },

  contract: {
    id: 'contract-payment-e2e-01',
    code: 'HD-E2E-PAY-01',

    roomId: 'room-payment-e2e-01',

    tenantIds: [
      'tenant-payment-e2e-01'
    ],

    representativeTenantId:
      'tenant-payment-e2e-01',

    startDate: '2026-08-01',
    endDate: '2027-07-31',

    rentAmount: 2_000_000,
    depositAmount: 2_000_000,

    status: CONTRACT_STATUS.ACTIVE,

    createdAt:
      '2026-08-01T00:00:00.000Z',

    updatedAt:
      '2026-08-01T00:00:00.000Z'
  },

  invoice: {
    id: 'invoice-payment-e2e-01',
    code: 'HD-TT-E2E-01',

    roomId: 'room-payment-e2e-01',

    contractId:
      'contract-payment-e2e-01',

    period: '2026-08',

    issueDate: '2026-08-01',
    dueDate: '2026-08-10',

    roomSnapshot: {
      id: 'room-payment-e2e-01',
      code: 'E2E-PAY-01',
      name: 'Phòng thanh toán E2E'
    },

    items: [
      {
        id: 'invoice-item-payment-e2e-01',
        type: 'rent',
        sourceType: 'contract',

        sourceId:
          'contract-payment-e2e-01',

        name: 'Tiền phòng',
        unit: 'phòng',
        calculationType: 'fixed',
        quantity: 1,
        unitPrice: 2_000_000,
        amount: 2_000_000
      }
    ],

    subtotal: 2_000_000,
    discount: 0,
    total: 2_000_000,

    paidAmount: 0,
    remainingDebt: 2_000_000,

    documentStatus:
      INVOICE_DOCUMENT_STATUS.FINALIZED,

    paymentStatus:
      INVOICE_PAYMENT_STATUS.UNPAID,

    finalizedAt:
      '2026-08-01T01:00:00.000Z',

    createdAt:
      '2026-08-01T00:00:00.000Z',

    updatedAt:
      '2026-08-01T01:00:00.000Z'
  },

  firstPayment: {
    amount: 1_200_000,
    date: '2026-08-03',

    reference:
      'PAYMENT-E2E-PARTIAL',

    note:
      'Thanh toán một phần bằng Playwright'
  },

  secondPayment: {
    amount: 800_000,
    date: '2026-08-03',

    reference:
      'PAYMENT-E2E-FINAL',

    note:
      'Thanh toán phần còn lại bằng Playwright'
  }
});

const EXPECTED = Object.freeze({
  invoiceTotal: 2_000_000,

  partialPaidAmount: 1_200_000,
  partialRemainingDebt: 800_000,

  finalPaidAmount: 2_000_000,
  finalRemainingDebt: 0
});

function moneyPattern(amount) {
  const groups = String(amount).split(
    /(?=(?:\d{3})+$)/
  );

  return new RegExp(
    groups.join('[.\\s,]?')
  );
}

function getInvoiceRow(page) {
  return page
    .getByTestId(
      TEST_ID.invoicesTable
    )
    .getByRole('row')
    .filter({
      hasText: TEST_DATA.invoice.code
    });
}

function getPaymentRow(
  page,
  reference
) {
  return page
    .getByTestId(
      TEST_ID.paymentsTable
    )
    .getByRole('row')
    .filter({
      hasText: reference
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
}

async function confirmIfVisible(page) {
  const dialog =
    page.getByTestId(
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

async function seedUnpaidInvoice(page) {
  await page.goto('/');

  await page.evaluate(
    ({
      storageKeys,
      data
    }) => {
      localStorage.clear();
      sessionStorage.clear();

      /*
       * Khởi tạo tất cả collection để không
       * phụ thuộc dữ liệu seed của ứng dụng.
       */
      Object.entries(
        storageKeys
      ).forEach(([name, key]) => {
        const initialValue =
          name === 'APP_SETTINGS'
            ? {}
            : [];

        localStorage.setItem(
          key,
          JSON.stringify(initialValue)
        );
      });

      localStorage.setItem(
        storageKeys.ROOMS,
        JSON.stringify([
          data.room
        ])
      );

      localStorage.setItem(
        storageKeys.TENANTS,
        JSON.stringify([
          data.tenant
        ])
      );

      localStorage.setItem(
        storageKeys.CONTRACTS,
        JSON.stringify([
          data.contract
        ])
      );

      localStorage.setItem(
        storageKeys.INVOICES,
        JSON.stringify([
          data.invoice
        ])
      );

      localStorage.setItem(
        storageKeys.PAYMENTS,
        JSON.stringify([])
      );
    },
    {
      storageKeys:
        STORAGE_KEYS,

      data: {
        room: TEST_DATA.room,
        tenant: TEST_DATA.tenant,
        contract:
          TEST_DATA.contract,
        invoice:
          TEST_DATA.invoice
      }
    }
  );
}

async function createPayment(
  page,
  paymentData
) {
  await openRoute(
    page,
    '#/payments',
    TEST_ID.paymentsPage
  );

  await page
    .getByTestId(
      TEST_ID.addPaymentButton
    )
    .click();

  await expect(
    page.getByTestId(
      TEST_ID.paymentForm
    )
  ).toBeVisible();

  await selectOptionByText(
    page.getByTestId(
      TEST_ID.paymentInvoiceSelect
    ),
    TEST_DATA.invoice.code
  );

  await page
    .getByTestId(
      TEST_ID.paymentAmountInput
    )
    .fill(String(paymentData.amount));

  await selectOptionByText(
    page.getByTestId(
      TEST_ID.paymentMethodSelect
    ),
    /Tiền mặt/i
  );

  await page
    .getByTestId(
      TEST_ID.paymentDateInput
    )
    .fill(paymentData.date);

  await page
    .getByTestId(
      TEST_ID.paymentReferenceInput
    )
    .fill(paymentData.reference);

  const noteInput =
    page.getByTestId(
      TEST_ID.paymentNoteInput
    );

  if (
    (await noteInput.count()) > 0 &&
    (await noteInput.isVisible()) &&
    (await noteInput.isEditable())
  ) {
    await noteInput.fill(
      paymentData.note
    );
  }

  await page
    .getByTestId(
      TEST_ID.paymentSubmitButton
    )
    .click();

  await confirmIfVisible(page);

  const paymentRow =
    getPaymentRow(
      page,
      paymentData.reference
    );

  await expect(
    paymentRow
  ).toBeVisible();

  await expect(
    paymentRow
  ).toContainText(
    moneyPattern(paymentData.amount)
  );

  return paymentRow;
}

async function assertInvoiceUi(
  page,
  {
    paidAmount,
    remainingDebt,
    status
  }
) {
  const invoiceRow =
    getInvoiceRow(page);

  await expect(
    invoiceRow
  ).toBeVisible();

  await expect(
    invoiceRow.getByTestId(
      TEST_ID.invoicePaidAmount
    )
  ).toContainText(
    moneyPattern(paidAmount)
  );

  await expect(
    invoiceRow.getByTestId(
      TEST_ID.invoiceRemainingDebt
    )
  ).toContainText(
    moneyPattern(remainingDebt)
  );

  await expect(
    invoiceRow.getByTestId(
      TEST_ID
        .invoicePaymentStatusBadge
    )
  ).toContainText(status);

  return invoiceRow;
}

async function readStoredState(page) {
  return page.evaluate(
    ({
      storageKeys,
      invoiceId
    }) => {
      const invoices = JSON.parse(
        localStorage.getItem(
          storageKeys.INVOICES
        ) ?? '[]'
      );

      const payments = JSON.parse(
        localStorage.getItem(
          storageKeys.PAYMENTS
        ) ?? '[]'
      );

      return {
        invoice:
          invoices.find(
            (item) =>
              item.id === invoiceId
          ) ?? null,

        payments:
          payments.filter(
            (item) =>
              item.invoiceId ===
              invoiceId
          )
      };
    },
    {
      storageKeys:
        STORAGE_KEYS,

      invoiceId:
        TEST_DATA.invoice.id
    }
  );
}

async function setDashboardMonth(
  page
) {
  const filter =
    page.getByTestId(
      TEST_ID.dashboardMonthFilter
    );

  if (
    (await filter.count()) === 0 ||
    !(await filter.isVisible())
  ) {
    return;
  }

  const tagName =
    await filter.evaluate(
      (element) =>
        element.tagName
          .toLocaleLowerCase()
    );

  if (tagName === 'select') {
    await filter.selectOption(
      TEST_DATA.invoice.period
    );

    return;
  }

  if (await filter.isEditable()) {
    await filter.fill(
      TEST_DATA.invoice.period
    );
  }
}

async function assertDashboard(
  page,
  {
    collectedAmount,
    totalDebt
  }
) {
  await expect(
    page.getByTestId(
      TEST_ID
        .dashboardCollectedAmount
    )
  ).toContainText(
    moneyPattern(collectedAmount)
  );

  await expect(
    page.getByTestId(
      TEST_ID.dashboardTotalDebt
    )
  ).toContainText(
    moneyPattern(totalDebt)
  );
}

test.describe(
  'Thanh toán hóa đơn và cập nhật Dashboard',
  () => {
    test.beforeEach(
      async ({ page }) => {
        await seedUnpaidInvoice(
          page
        );
      }
    );

    test(
      'thanh toán một phần, trả đủ và cập nhật doanh thu cùng công nợ',
      async ({ page }) => {
        /*
         * Kiểm tra trạng thái ban đầu của
         * hóa đơn test.
         */
        await openRoute(
          page,
          '#/invoices',
          TEST_ID.invoicesPage
        );

        await assertInvoiceUi(
          page,
          {
            paidAmount: 0,

            remainingDebt:
              EXPECTED.invoiceTotal,

            status:
              /Chưa thanh toán/i
          }
        );

        /*
         * Ghi nhận số liệu Dashboard trước
         * khi phát sinh thanh toán.
         */
        await openRoute(
          page,
          '#/dashboard',
          TEST_ID.dashboardPage
        );

        await setDashboardMonth(page);

        await assertDashboard(
          page,
          {
            collectedAmount: 0,

            totalDebt:
              EXPECTED.invoiceTotal
          }
        );

        /*
         * Thanh toán lần thứ nhất:
         * 2.000.000 - 1.200.000
         * = còn nợ 800.000.
         */
        await createPayment(
          page,
          TEST_DATA.firstPayment
        );

        await openRoute(
          page,
          '#/invoices',
          TEST_ID.invoicesPage
        );

        await assertInvoiceUi(
          page,
          {
            paidAmount:
              EXPECTED
                .partialPaidAmount,

            remainingDebt:
              EXPECTED
                .partialRemainingDebt,

            status:
              /Thanh toán một phần/i
          }
        );

        /*
         * Reload và kiểm tra giao diện vẫn
         * hiển thị đúng dữ liệu.
         */
        await page.reload();

        await expect(
          page.getByTestId(
            TEST_ID.invoicesPage
          )
        ).toBeVisible();

        await assertInvoiceUi(
          page,
          {
            paidAmount:
              EXPECTED
                .partialPaidAmount,

            remainingDebt:
              EXPECTED
                .partialRemainingDebt,

            status:
              /Thanh toán một phần/i
          }
        );

        /*
         * Kiểm tra dữ liệu LocalStorage sau
         * lần thanh toán thứ nhất.
         */
        let storedState =
          await readStoredState(page);

        expect(
          storedState.invoice
        ).toMatchObject({
          total:
            EXPECTED.invoiceTotal,

          paidAmount:
            EXPECTED
              .partialPaidAmount,

          remainingDebt:
            EXPECTED
              .partialRemainingDebt,

          paymentStatus:
            INVOICE_PAYMENT_STATUS
              .PARTIALLY_PAID
        });

        expect(
          storedState.payments
        ).toHaveLength(1);

        expect(
          storedState.payments[0]
        ).toMatchObject({
          invoiceId:
            TEST_DATA.invoice.id,

          amount:
            TEST_DATA
              .firstPayment.amount,

          reference:
            TEST_DATA
              .firstPayment.reference
        });

        /*
         * Thanh toán phần còn lại:
         * 800.000.
         */
        await createPayment(
          page,
          TEST_DATA.secondPayment
        );

        await openRoute(
          page,
          '#/invoices',
          TEST_ID.invoicesPage
        );

        await assertInvoiceUi(
          page,
          {
            paidAmount:
              EXPECTED
                .finalPaidAmount,

            remainingDebt:
              EXPECTED
                .finalRemainingDebt,

            status:
              /Đã thanh toán/i
          }
        );

        /*
         * Reload lần nữa để kiểm tra hóa
         * đơn đã thanh toán vẫn tồn tại.
         */
        await page.reload();

        await expect(
          page.getByTestId(
            TEST_ID.invoicesPage
          )
        ).toBeVisible();

        await assertInvoiceUi(
          page,
          {
            paidAmount:
              EXPECTED
                .finalPaidAmount,

            remainingDebt:
              EXPECTED
                .finalRemainingDebt,

            status:
              /Đã thanh toán/i
          }
        );

        storedState =
          await readStoredState(page);

        expect(
          storedState.invoice
        ).toMatchObject({
          total:
            EXPECTED.invoiceTotal,

          paidAmount:
            EXPECTED
              .finalPaidAmount,

          remainingDebt: 0,

          paymentStatus:
            INVOICE_PAYMENT_STATUS.PAID
        });

        expect(
          storedState.payments
        ).toHaveLength(2);

        expect(
          storedState.payments
            .map(
              (payment) =>
                payment.amount
            )
            .sort(
              (first, second) =>
                first - second
            )
        ).toEqual([
          800_000,
          1_200_000
        ]);

        expect(
          storedState.payments.reduce(
            (total, payment) =>
              total +
              payment.amount,
            0
          )
        ).toBe(
          EXPECTED.finalPaidAmount
        );

        /*
         * Mở Dashboard và kiểm tra:
         * - Thực thu tăng từ 0 lên 2.000.000.
         * - Công nợ giảm từ 2.000.000 về 0.
         */
        await openRoute(
          page,
          '#/dashboard',
          TEST_ID.dashboardPage
        );

        await setDashboardMonth(page);

        await assertDashboard(
          page,
          {
            collectedAmount:
              EXPECTED
                .finalPaidAmount,

            totalDebt: 0
          }
        );

        /*
         * Reload Dashboard và kiểm tra số
         * liệu vẫn được tính từ dữ liệu đã
         * lưu trong LocalStorage.
         */
        await page.reload();

        await expect(
          page.getByTestId(
            TEST_ID.dashboardPage
          )
        ).toBeVisible();

        await setDashboardMonth(page);

        await assertDashboard(
          page,
          {
            collectedAmount:
              EXPECTED
                .finalPaidAmount,

            totalDebt: 0
          }
        );

        const stateAfterReload =
          await readStoredState(page);

        expect(
          stateAfterReload.invoice
            .paidAmount
        ).toBe(2_000_000);

        expect(
          stateAfterReload.invoice
            .remainingDebt
        ).toBe(0);

        expect(
          stateAfterReload.invoice
            .paymentStatus
        ).toBe(
          INVOICE_PAYMENT_STATUS.PAID
        );

        expect(
          stateAfterReload.payments
        ).toHaveLength(2);
      }
    );
  }
);