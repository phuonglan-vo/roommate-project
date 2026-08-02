const pageModules = import.meta.glob('./pages/**/*.page.js');

const ROUTES = Object.freeze([
  {
    path: '/dashboard',
    page: 'dashboard',
    title: 'Dashboard',
    modulePath: './pages/dashboard/dashboard.page.js'
  },
  {
    path: '/rooms',
    page: 'rooms',
    title: 'Quản lý phòng',
    modulePath: './pages/rooms/rooms.page.js'
  },
  {
    path: '/tenants',
    page: 'tenants',
    title: 'Quản lý người thuê',
    modulePath: './pages/tenants/tenants.page.js'
  },
  {
    path: '/contracts',
    page: 'contracts',
    title: 'Quản lý hợp đồng',
    modulePath: './pages/contracts/contracts.page.js'
  },
  {
    path: '/meters',
    page: 'meters',
    title: 'Chỉ số điện nước',
    modulePath: './pages/meters/meters.page.js'
  },
  {
    path: '/services',
    page: 'services',
    title: 'Cấu hình dịch vụ',
    modulePath: './pages/services/services.page.js'
  },
  {
    path: '/invoices',
    page: 'invoices',
    title: 'Quản lý hóa đơn',
    modulePath: './pages/invoices/invoices.page.js'
  },
  {
    path: '/payments',
    page: 'payments',
    title: 'Quản lý thanh toán',
    modulePath: './pages/payments/payments.page.js'
  },
  {
    path: '/debts',
    page: 'debts',
    title: 'Quản lý công nợ',
    modulePath: './pages/debts/debts.page.js'
  },
  {
    path: '/reports',
    page: 'reports',
    title: 'Báo cáo và biểu đồ',
    modulePath: './pages/reports/reports.page.js'
  },
  {
    path: '/settings',
    page: 'settings',
    title: 'Cài đặt',
    modulePath: './pages/settings/settings.page.js'
  }
]);

const NOT_FOUND_ROUTE = Object.freeze({
  path: '/404',
  page: 'not-found',
  title: 'Không tìm thấy trang',
  modulePath: './pages/not-found/not-found.page.js'
});

function normalizePath(value) {
  let path = String(value ?? '')
    .trim()
    .replace(/^#/, '')
    .split('?')[0];

  if (!path || path === '/') {
    return '/dashboard';
  }

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  path = path.replace(/\/{2,}/g, '/');

  if (path.length > 1) {
    path = path.replace(/\/+$/, '');
  }

  return path.toLowerCase();
}

function getCurrentPath() {
  return normalizePath(window.location.hash);
}

function findRoute(path) {
  return ROUTES.find((route) => route.path === path) ?? null;
}

function createElement(
  tagName,
  {
    className = '',
    text = '',
    attributes = {},
    dataset = {}
  } = {},
  children = []
) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, String(value));
  });

  Object.entries(dataset).forEach(([name, value]) => {
    element.dataset[name] = String(value);
  });

  element.append(...children);

  return element;
}

function createPlaceholderPage(route) {
  const description =
    route.page === 'dashboard'
      ? 'Nội dung Dashboard sẽ được xây dựng ở bước tiếp theo.'
      : `Trang ${route.title} sẽ được xây dựng ở bước tiếp theo.`;

  const message = createElement('p', {
    className: 'mb-0 text-body-secondary',
    text: description
  });

  return createElement(
    'section',
    {
      className: 'card border-0 shadow-sm',
      attributes: {
        'aria-label': route.title
      },
      dataset: {
        testid: `${route.page}-page`
      }
    },
    [
      createElement(
        'div',
        {
          className: 'card-body p-4'
        },
        [message]
      )
    ]
  );
}

function createNotFoundPlaceholder(requestedPath) {
  const title = createElement('h2', {
    className: 'h4 mb-2',
    text: 'Trang không tồn tại'
  });

  const message = createElement('p', {
    className: 'mb-3 text-body-secondary',
    text: `Không tìm thấy đường dẫn ${requestedPath}.`
  });

  const dashboardLink = createElement('a', {
    className: 'btn btn-primary',
    text: 'Về Dashboard',
    attributes: {
      href: '#/dashboard'
    },
    dataset: {
      testid: 'not-found-dashboard-link'
    }
  });

  dashboardLink.addEventListener('click', (event) => {
    event.preventDefault();
    navigate('/dashboard');
  });

  return createElement(
    'section',
    {
      className: 'card border-0 shadow-sm',
      attributes: {
        'aria-labelledby': 'notFoundPageTitle'
      },
      dataset: {
        testid: 'not-found-page'
      }
    },
    [
      createElement(
        'div',
        {
          className: 'card-body p-4'
        },
        [title, message, dashboardLink]
      )
    ]
  );
}

function createLoadingPage() {
  const spinner = createElement('span', {
    className: 'spinner-border spinner-border-sm me-2',
    attributes: {
      'aria-hidden': 'true'
    }
  });

  const text = createElement('span', {
    text: 'Đang tải trang...'
  });

  return createElement(
    'div',
    {
      className: 'd-flex align-items-center text-body-secondary',
      attributes: {
        role: 'status'
      },
      dataset: {
        testid: 'page-loading'
      }
    },
    [spinner, text]
  );
}

function normalizePageResult(result, route) {
  if (
    result instanceof HTMLElement ||
    result instanceof DocumentFragment
  ) {
    return result;
  }

  console.warn(
    `Module của trang "${route.page}" không trả về HTMLElement hoặc DocumentFragment.`
  );

  return createPlaceholderPage(route);
}

async function loadPage(route, context) {
  const loadModule = pageModules[route.modulePath];

  if (!loadModule) {
    if (route.page === 'not-found') {
      return createNotFoundPlaceholder(context.requestedPath);
    }

    return createPlaceholderPage(route);
  }

  try {
    const pageModule = await loadModule();

    const pageFactory =
      pageModule.default ??
      pageModule.createPage ??
      pageModule.renderPage;

    if (typeof pageFactory !== 'function') {
      console.warn(
        `Module "${route.modulePath}" chưa export hàm tạo trang.`
      );

      return route.page === 'not-found'
        ? createNotFoundPlaceholder(context.requestedPath)
        : createPlaceholderPage(route);
    }

    const pageResult = await pageFactory(context);

    return normalizePageResult(pageResult, route);
  } catch (error) {
    console.error(`Không thể tải trang "${route.page}".`, error);

    return route.page === 'not-found'
      ? createNotFoundPlaceholder(context.requestedPath)
      : createPlaceholderPage(route);
  }
}

export function navigate(target) {
  const path = normalizePath(target);
  const targetHash = `#${path}`;

  if (window.location.hash === targetHash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }

  window.location.hash = targetHash;
}

export function createHashRouter({
  outlet,
  onRouteChange
} = {}) {
  if (!(outlet instanceof HTMLElement)) {
    throw new TypeError(
      'Router cần một HTMLElement làm vùng hiển thị trang.'
    );
  }

  let started = false;
  let navigationVersion = 0;

  async function renderCurrentRoute() {
    const requestedPath = getCurrentPath();
    const matchedRoute = findRoute(requestedPath);
    const route = matchedRoute ?? NOT_FOUND_ROUTE;
    const isNotFound = matchedRoute === null;

    const currentVersion = ++navigationVersion;

    outlet.replaceChildren(createLoadingPage());

    if (typeof onRouteChange === 'function') {
      onRouteChange({
        route,
        requestedPath,
        isNotFound
      });
    }

    const pageElement = await loadPage(route, {
      route,
      requestedPath,
      isNotFound,
      navigate
    });

    if (currentVersion !== navigationVersion) {
      return;
    }

    outlet.replaceChildren(pageElement);
  }

  function start() {
    if (started) {
      return;
    }

    started = true;

    window.addEventListener('hashchange', renderCurrentRoute);

    if (!window.location.hash || window.location.hash === '#/') {
      window.history.replaceState(null, '', '#/dashboard');
    }

    renderCurrentRoute();
  }

  function stop() {
    if (!started) {
      return;
    }

    started = false;
    navigationVersion += 1;

    window.removeEventListener('hashchange', renderCurrentRoute);
  }

  return Object.freeze({
    start,
    stop,
    refresh: renderCurrentRoute,
    navigate
  });
}