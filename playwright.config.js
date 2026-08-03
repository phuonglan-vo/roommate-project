import {
  defineConfig,
  devices
} from '@playwright/test';

const isCI = Boolean(process.env.CI);

const baseURL =
  'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests/e2e',

  /*
   * Playwright tạo browser context riêng
   * cho từng test.
   */
  fullyParallel: true,

  forbidOnly: isCI,

  /*
   * Chỉ retry trên môi trường CI.
   */
  retries: isCI ? 2 : 0,

  /*
   * CI chạy tuần tự để hạn chế test
   * không ổn định do tài nguyên máy.
   */
  workers: isCI ? 1 : undefined,

  /*
   * Timeout tối đa cho mỗi test.
   */
  timeout: 30_000,

  expect: {
    timeout: 5_000
  },

  reporter: isCI
    ? [
        ['github'],
        [
          'html',
          {
            open: 'never',
            outputFolder:
              'playwright-report'
          }
        ]
      ]
    : [
        ['list'],
        [
          'html',
          {
            open: 'never',
            outputFolder:
              'playwright-report'
          }
        ]
      ],

  use: {
    baseURL,

    /*
     * Mỗi browser context bắt đầu với
     * cookies và LocalStorage rỗng.
     *
     * Do Playwright tạo context mới cho
     * mỗi test, dữ liệu LocalStorage
     * không bị dùng chung giữa các test.
     */
    storageState: {
      cookies: [],
      origins: []
    },

    actionTimeout: 10_000,
    navigationTimeout: 15_000,

    /*
     * Chụp ảnh khi test thất bại.
     */
    screenshot: 'only-on-failure',

    /*
     * Lưu trace khi test được retry.
     */
    trace: 'on-first-retry'
  },

  /*
   * Chỉ chạy Chromium.
   */
  projects: [
    {
      name: 'chromium',

      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],

  /*
   * Playwright tự khởi động Vite trước
   * khi chạy test.
   */
  webServer: {
    command: 'npm run dev',
    url: baseURL,

    reuseExistingServer: !isCI,

    timeout: 120_000,

    /*
     * Vite config có base path dành cho
     * GitHub Pages. Khi chạy E2E trên CI,
     * ép base về "/" để địa chỉ local luôn
     * là http://127.0.0.1:5173.
     */
    env: {
      ...process.env,
      BASE_PATH: '/'
    },

    stdout: 'pipe',
    stderr: 'pipe'
  }
});