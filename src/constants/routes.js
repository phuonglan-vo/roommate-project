/**
 * Đường dẫn nội bộ của router.
 *
 * Các giá trị này chưa bao gồm ký tự "#".
 */
export const ROUTE_PATHS = Object.freeze({
  DASHBOARD: '/dashboard',
  ROOMS: '/rooms',
  TENANTS: '/tenants',
  CONTRACTS: '/contracts',
  METERS: '/meters',
  SERVICES: '/services',
  INVOICES: '/invoices',
  PAYMENTS: '/payments',
  DEBTS: '/debts',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  NOT_FOUND: '/404'
});

/**
 * Hash hoàn chỉnh dùng cho thuộc tính href và điều hướng trình duyệt.
 */
export const ROUTES = Object.freeze({
  DASHBOARD: `#${ROUTE_PATHS.DASHBOARD}`,
  ROOMS: `#${ROUTE_PATHS.ROOMS}`,
  TENANTS: `#${ROUTE_PATHS.TENANTS}`,
  CONTRACTS: `#${ROUTE_PATHS.CONTRACTS}`,
  METERS: `#${ROUTE_PATHS.METERS}`,
  SERVICES: `#${ROUTE_PATHS.SERVICES}`,
  INVOICES: `#${ROUTE_PATHS.INVOICES}`,
  PAYMENTS: `#${ROUTE_PATHS.PAYMENTS}`,
  DEBTS: `#${ROUTE_PATHS.DEBTS}`,
  REPORTS: `#${ROUTE_PATHS.REPORTS}`,
  SETTINGS: `#${ROUTE_PATHS.SETTINGS}`,
  NOT_FOUND: `#${ROUTE_PATHS.NOT_FOUND}`
});

/**
 * Nhãn tiếng Việt theo đường dẫn router.
 */
export const ROUTE_LABELS = Object.freeze({
  [ROUTE_PATHS.DASHBOARD]: 'Dashboard',
  [ROUTE_PATHS.ROOMS]: 'Quản lý phòng',
  [ROUTE_PATHS.TENANTS]: 'Quản lý người thuê',
  [ROUTE_PATHS.CONTRACTS]: 'Quản lý hợp đồng',
  [ROUTE_PATHS.METERS]: 'Chỉ số điện nước',
  [ROUTE_PATHS.SERVICES]: 'Cấu hình dịch vụ',
  [ROUTE_PATHS.INVOICES]: 'Quản lý hóa đơn',
  [ROUTE_PATHS.PAYMENTS]: 'Quản lý thanh toán',
  [ROUTE_PATHS.DEBTS]: 'Quản lý công nợ',
  [ROUTE_PATHS.REPORTS]: 'Báo cáo và biểu đồ',
  [ROUTE_PATHS.SETTINGS]: 'Cài đặt',
  [ROUTE_PATHS.NOT_FOUND]: 'Không tìm thấy trang'
});

/**
 * Tên page dùng cho data-page, test ID và router.
 */
export const ROUTE_PAGE_KEYS = Object.freeze({
  [ROUTE_PATHS.DASHBOARD]: 'dashboard',
  [ROUTE_PATHS.ROOMS]: 'rooms',
  [ROUTE_PATHS.TENANTS]: 'tenants',
  [ROUTE_PATHS.CONTRACTS]: 'contracts',
  [ROUTE_PATHS.METERS]: 'meters',
  [ROUTE_PATHS.SERVICES]: 'services',
  [ROUTE_PATHS.INVOICES]: 'invoices',
  [ROUTE_PATHS.PAYMENTS]: 'payments',
  [ROUTE_PATHS.DEBTS]: 'debts',
  [ROUTE_PATHS.REPORTS]: 'reports',
  [ROUTE_PATHS.SETTINGS]: 'settings',
  [ROUTE_PATHS.NOT_FOUND]: 'not-found'
});

/**
 * Danh sách route chính dùng để tạo router hoặc menu.
 */
export const ROUTE_DEFINITIONS = Object.freeze([
  Object.freeze({
    path: ROUTE_PATHS.DASHBOARD,
    hash: ROUTES.DASHBOARD,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.DASHBOARD],
    label: ROUTE_LABELS[ROUTE_PATHS.DASHBOARD]
  }),
  Object.freeze({
    path: ROUTE_PATHS.ROOMS,
    hash: ROUTES.ROOMS,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.ROOMS],
    label: ROUTE_LABELS[ROUTE_PATHS.ROOMS]
  }),
  Object.freeze({
    path: ROUTE_PATHS.TENANTS,
    hash: ROUTES.TENANTS,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.TENANTS],
    label: ROUTE_LABELS[ROUTE_PATHS.TENANTS]
  }),
  Object.freeze({
    path: ROUTE_PATHS.CONTRACTS,
    hash: ROUTES.CONTRACTS,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.CONTRACTS],
    label: ROUTE_LABELS[ROUTE_PATHS.CONTRACTS]
  }),
  Object.freeze({
    path: ROUTE_PATHS.METERS,
    hash: ROUTES.METERS,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.METERS],
    label: ROUTE_LABELS[ROUTE_PATHS.METERS]
  }),
  Object.freeze({
    path: ROUTE_PATHS.SERVICES,
    hash: ROUTES.SERVICES,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.SERVICES],
    label: ROUTE_LABELS[ROUTE_PATHS.SERVICES]
  }),
  Object.freeze({
    path: ROUTE_PATHS.INVOICES,
    hash: ROUTES.INVOICES,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.INVOICES],
    label: ROUTE_LABELS[ROUTE_PATHS.INVOICES]
  }),
  Object.freeze({
    path: ROUTE_PATHS.PAYMENTS,
    hash: ROUTES.PAYMENTS,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.PAYMENTS],
    label: ROUTE_LABELS[ROUTE_PATHS.PAYMENTS]
  }),
  Object.freeze({
    path: ROUTE_PATHS.DEBTS,
    hash: ROUTES.DEBTS,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.DEBTS],
    label: ROUTE_LABELS[ROUTE_PATHS.DEBTS]
  }),
  Object.freeze({
    path: ROUTE_PATHS.REPORTS,
    hash: ROUTES.REPORTS,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.REPORTS],
    label: ROUTE_LABELS[ROUTE_PATHS.REPORTS]
  }),
  Object.freeze({
    path: ROUTE_PATHS.SETTINGS,
    hash: ROUTES.SETTINGS,
    page: ROUTE_PAGE_KEYS[ROUTE_PATHS.SETTINGS],
    label: ROUTE_LABELS[ROUTE_PATHS.SETTINGS]
  })
]);

export const DEFAULT_ROUTE = ROUTE_PATHS.DASHBOARD;