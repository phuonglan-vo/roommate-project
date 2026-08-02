import './styles/main.css';

import {
  createAppLayout,
  updateLayoutPage
} from './components/layout.js';

import { createToastRegion } from './components/toast.js';
import { createConfirmDialog } from './components/confirm-dialog.js';

const PAGE_TITLES = Object.freeze({
  dashboard: 'Dashboard',
  rooms: 'Quản lý phòng',
  tenants: 'Quản lý người thuê',
  contracts: 'Quản lý hợp đồng',
  'meter-readings': 'Chỉ số điện nước',
  'service-configs': 'Cấu hình dịch vụ',
  invoices: 'Quản lý hóa đơn',
  payments: 'Quản lý thanh toán',
  debts: 'Quản lý công nợ',
  reports: 'Báo cáo và biểu đồ',
  'import-export': 'Import và export dữ liệu',
  settings: 'Cài đặt'
});

function getPageFromHash() {
  const hashValue = window.location.hash
    .replace(/^#\/?/, '')
    .split('/')[0]
    .trim();

  return hashValue || 'dashboard';
}

function isSupportedPage(page) {
  return Object.hasOwn(PAGE_TITLES, page);
}

function setHashPage(page) {
  if (!isSupportedPage(page)) {
    return;
  }

  const targetHash = `#/${page}`;

  if (window.location.hash === targetHash) {
    renderCurrentPage();
    return;
  }

  window.location.hash = targetHash;
}

function renderCurrentPage() {
  const requestedPage = getPageFromHash();
  const page = isSupportedPage(requestedPage)
    ? requestedPage
    : 'dashboard';

  if (page !== requestedPage) {
    window.history.replaceState(null, '', `#/${page}`);
  }

  updateLayoutPage(appLayout, {
    page,
    title: PAGE_TITLES[page]
  });

  document.title = `${PAGE_TITLES[page]} | RoomMate`;
}

const appRoot = document.querySelector('#app');

if (!appRoot) {
  throw new Error('Không tìm thấy phần tử #app để khởi tạo RoomMate.');
}

const appLayout = createAppLayout({
  onNavigate: setHashPage
});

appRoot.replaceChildren(appLayout);

document.body.append(
  createToastRegion(),
  createConfirmDialog()
);

window.addEventListener('hashchange', renderCurrentPage);

if (!window.location.hash) {
  window.history.replaceState(null, '', '#/dashboard');
}

renderCurrentPage();