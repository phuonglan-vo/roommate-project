const MENU_ITEMS = Object.freeze([
  {
    page: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: '⌂'
  },
  {
    page: 'rooms',
    label: 'Phòng trọ',
    path: '/rooms',
    icon: '▦'
  },
  {
    page: 'tenants',
    label: 'Người thuê',
    path: '/tenants',
    icon: '♙'
  },
  {
    page: 'contracts',
    label: 'Hợp đồng',
    path: '/contracts',
    icon: '▤'
  },
  {
    page: 'meters',
    label: 'Điện nước',
    path: '/meters',
    icon: '↕'
  },
  {
    page: 'services',
    label: 'Dịch vụ',
    path: '/services',
    icon: '◇'
  },
  {
    page: 'invoices',
    label: 'Hóa đơn',
    path: '/invoices',
    icon: '▧'
  },
  {
    page: 'payments',
    label: 'Thanh toán',
    path: '/payments',
    icon: '✓'
  },
  {
    page: 'debts',
    label: 'Công nợ',
    path: '/debts',
    icon: '!'
  },
  {
    page: 'reports',
    label: 'Báo cáo',
    path: '/reports',
    icon: '▥'
  },
  {
    page: 'settings',
    label: 'Cài đặt',
    path: '/settings',
    icon: '⚙'
  }
]);

function createElement(
  tagName,
  {
    className = '',
    text = null,
    attributes = {},
    dataset = {}
  } = {},
  children = []
) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== null) {
    element.textContent = text;
  }

  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== null && value !== undefined) {
      element.setAttribute(name, String(value));
    }
  });

  Object.entries(dataset).forEach(([name, value]) => {
    element.dataset[name] = String(value);
  });

  element.append(...children);

  return element;
}

function closeMobileSidebar(sidebar) {
  if (window.innerWidth >= 992) {
    return;
  }

  const Offcanvas = window.bootstrap?.Offcanvas;

  if (!Offcanvas) {
    return;
  }

  const instance = Offcanvas.getInstance(sidebar);

  instance?.hide();
}

function createSidebar(onNavigate) {
  const sidebar = createElement('aside', {
    className: 'offcanvas-lg offcanvas-start rm-sidebar',
    attributes: {
      id: 'appSidebar',
      tabindex: '-1',
      'aria-labelledby': 'sidebarTitle'
    },
    dataset: {
      testid: 'sidebar'
    }
  });

  const brandLogo = createElement('span', {
    className: 'rm-brand-logo',
    text: 'RM',
    attributes: {
      'aria-hidden': 'true'
    }
  });

  const brandName = createElement('span', {
    text: 'RoomMate',
    attributes: {
      id: 'sidebarTitle'
    }
  });

  const brand = createElement(
    'a',
    {
      className: 'rm-brand',
      attributes: {
        href: '#/dashboard',
        'aria-label': 'Mở Dashboard RoomMate'
      },
      dataset: {
        testid: 'sidebar-brand'
      }
    },
    [brandLogo, brandName]
  );

  brand.addEventListener('click', (event) => {
    if (typeof onNavigate !== 'function') {
      return;
    }

    event.preventDefault();
    onNavigate('/dashboard');
    closeMobileSidebar(sidebar);
  });

  const closeButton = createElement('button', {
    className: 'btn-close btn-close-white d-lg-none',
    attributes: {
      type: 'button',
      'data-bs-dismiss': 'offcanvas',
      'data-bs-target': '#appSidebar',
      'aria-label': 'Đóng menu'
    },
    dataset: {
      testid: 'sidebar-close'
    }
  });

  const sidebarHeader = createElement(
    'div',
    {
      className:
        'offcanvas-header rm-sidebar-header d-flex align-items-center justify-content-between'
    },
    [brand, closeButton]
  );

  const menuLabel = createElement('p', {
    className: 'rm-sidebar-label',
    text: 'Quản lý'
  });

  const navigation = createElement('nav', {
    className: 'rm-sidebar-nav',
    attributes: {
      'aria-label': 'Menu chức năng RoomMate'
    },
    dataset: {
      testid: 'sidebar-navigation'
    }
  });

  MENU_ITEMS.forEach((item) => {
    const iconElement = createElement('span', {
      className: 'rm-nav-icon',
      text: item.icon,
      attributes: {
        'aria-hidden': 'true'
      }
    });

    const labelElement = createElement('span', {
      text: item.label
    });

    const link = createElement(
      'a',
      {
        className: 'rm-nav-link',
        attributes: {
          href: `#${item.path}`
        },
        dataset: {
          page: item.page,
          testid: `nav-${item.page}`
        }
      },
      [iconElement, labelElement]
    );

    link.addEventListener('click', (event) => {
      if (typeof onNavigate !== 'function') {
        return;
      }

      event.preventDefault();
      onNavigate(item.path);
      closeMobileSidebar(sidebar);
    });

    navigation.append(link);
  });

  const sidebarFooter = createElement('div', {
    className: 'rm-sidebar-footer',
    text: 'RoomMate Admin'
  });

  const sidebarBody = createElement(
    'div',
    {
      className: 'offcanvas-body rm-sidebar-body'
    },
    [menuLabel, navigation, sidebarFooter]
  );

  sidebar.append(sidebarHeader, sidebarBody);

  return sidebar;
}

function createTopbar() {
  const menuButton = createElement('button', {
    className: 'rm-icon-button d-lg-none',
    text: '☰',
    attributes: {
      type: 'button',
      'data-bs-toggle': 'offcanvas',
      'data-bs-target': '#appSidebar',
      'aria-controls': 'appSidebar',
      'aria-label': 'Mở menu chức năng'
    },
    dataset: {
      testid: 'sidebar-toggle'
    }
  });

  const title = createElement('p', {
    className: 'rm-topbar-title',
    text: 'Dashboard',
    dataset: {
      testid: 'topbar-title'
    }
  });

  const topbarStart = createElement(
    'div',
    {
      className: 'rm-topbar-start'
    },
    [menuButton, title]
  );

  const notificationButton = createElement('button', {
    className: 'rm-icon-button',
    text: '◉',
    attributes: {
      type: 'button',
      'aria-label': 'Thông báo'
    },
    dataset: {
      testid: 'notification-button'
    }
  });

  const avatar = createElement('span', {
    className: 'rm-user-avatar',
    text: 'QL',
    attributes: {
      'aria-hidden': 'true'
    }
  });

  const userName = createElement('div', {
    className: 'rm-user-name',
    text: 'Quản lý nhà trọ'
  });

  const userRole = createElement('div', {
    className: 'rm-user-role',
    text: 'Quản trị viên'
  });

  const userDetails = createElement(
    'div',
    {
      className: 'rm-user-details'
    },
    [userName, userRole]
  );

  const user = createElement(
    'div',
    {
      className: 'rm-user',
      dataset: {
        testid: 'current-user'
      }
    },
    [avatar, userDetails]
  );

  const actions = createElement(
    'div',
    {
      className: 'rm-topbar-actions'
    },
    [notificationButton, user]
  );

  return createElement(
    'header',
    {
      className: 'rm-topbar',
      dataset: {
        testid: 'topbar'
      }
    },
    [topbarStart, actions]
  );
}

function createMainContent() {
  const heading = createElement('h1', {
    className: 'rm-page-title',
    text: 'Dashboard',
    attributes: {
      id: 'roommatePageHeading'
    },
    dataset: {
      testid: 'page-heading'
    }
  });

  const pageHeader = createElement(
    'section',
    {
      className: 'rm-page-header',
      attributes: {
        'aria-labelledby': 'roommatePageHeading'
      }
    },
    [heading]
  );

  const outlet = createElement('div', {
    attributes: {
      id: 'routerOutlet',
      'aria-live': 'polite'
    },
    dataset: {
      routerOutlet: '',
      testid: 'page-content'
    }
  });

  const container = createElement(
    'div',
    {
      className: 'container-fluid px-0'
    },
    [pageHeader, outlet]
  );

  return createElement(
    'main',
    {
      className: 'rm-content',
      attributes: {
        id: 'mainContent',
        tabindex: '-1'
      },
      dataset: {
        testid: 'main-content'
      }
    },
    [container]
  );
}

export function createAppLayout({
  onNavigate
} = {}) {
  const sidebar = createSidebar(onNavigate);
  const topbar = createTopbar();
  const content = createMainContent();

  const mainArea = createElement(
    'div',
    {
      className: 'rm-app-main'
    },
    [topbar, content]
  );

  return createElement(
    'div',
    {
      className: 'rm-app-shell',
      dataset: {
        testid: 'app-shell'
      }
    },
    [sidebar, mainArea]
  );
}

export function getLayoutOutlet(layout) {
  if (!(layout instanceof HTMLElement)) {
    throw new TypeError('Layout cần là một HTMLElement.');
  }

  const outlet = layout.querySelector('[data-router-outlet]');

  if (!(outlet instanceof HTMLElement)) {
    throw new Error(
      'Không tìm thấy vùng hiển thị trang trong layout.'
    );
  }

  return outlet;
}

export function updateLayoutPage(
  layout,
  {
    page,
    title
  }
) {
  if (!(layout instanceof HTMLElement)) {
    throw new TypeError('Layout cần là một HTMLElement.');
  }

  const pageHeading = layout.querySelector(
    '[data-testid="page-heading"]'
  );

  const topbarTitle = layout.querySelector(
    '[data-testid="topbar-title"]'
  );

  if (pageHeading) {
    pageHeading.textContent = title;
  }

  if (topbarTitle) {
    topbarTitle.textContent = title;
  }

  layout.querySelectorAll('[data-page]').forEach((menuItem) => {
    const isActive =
      typeof page === 'string' &&
      menuItem.dataset.page === page;

    menuItem.classList.toggle('active', isActive);

    if (isActive) {
      menuItem.setAttribute('aria-current', 'page');
    } else {
      menuItem.removeAttribute('aria-current');
    }
  });
}