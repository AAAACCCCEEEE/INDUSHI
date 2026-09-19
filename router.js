// INDUSHI Client-Side Router & Route Tracker
import { trackPageView } from './firebase.js';

export const ROUTES = [
  // Storefront Public Sections
  {
    path: '/home',
    aliases: ['/', ''],
    type: 'public',
    name: 'Home',
    title: 'INDUSHI - Indonesian Fusion Sushi | 100% Cooked & Spicy Rolls',
    icon: 'fa-solid fa-house',
    description: 'Hero presentation, spicy roll highlights, and guarantee ribbon.'
  },
  {
    path: '/menu',
    aliases: ['/signatures'],
    type: 'public',
    name: 'Menu & Signatures',
    title: 'Menu & Signatures | INDUSHI',
    icon: 'fa-solid fa-utensils',
    description: 'Full culinary catalog with spice & cooking style filters.'
  },
  {
    path: '/builder',
    aliases: ['/custom-roll'],
    type: 'public',
    name: 'Roll Your Own Builder',
    title: 'Custom Roll Builder Studio | INDUSHI',
    icon: 'fa-solid fa-sliders',
    description: 'Interactive custom sushi studio with live visual preview.'
  },
  {
    path: '/platters',
    aliases: ['/catering'],
    type: 'public',
    name: 'Catering Platter Towers',
    title: 'Catering Platter Towers | INDUSHI',
    icon: 'fa-solid fa-boxes-stacked',
    description: 'Office & party towers, modern alternative to Tumpeng.'
  },
  {
    path: '/story',
    aliases: ['/about', '/testimonials'],
    type: 'public',
    name: 'Our Story & Reviews',
    title: 'Our Story & Reviews | INDUSHI',
    icon: 'fa-solid fa-book-open',
    description: 'The philosophy behind cooked Indonesian fusion sushi.'
  },
  {
    path: '/qa',
    aliases: ['/bugs', '/bug-tracker', '/quality'],
    type: 'admin',
    adminTab: 'qa',
    name: 'Admin: QA & Bug Tracker',
    title: 'QA & Bug Tracker | INDUSHI Admin',
    icon: 'fa-solid fa-bug',
    description: 'Internal glitch tracking and screenshot inspection studio.'
  },

  // Storefront Action Modals & Drawers
  {
    path: '/book-table',
    aliases: ['/booking', '/reserve'],
    type: 'modal',
    name: 'Reserve Table',
    title: 'Reserve a Table | INDUSHI',
    icon: 'fa-solid fa-calendar-check',
    description: 'Table booking at the Senopati flame-bar location.'
  },
  {
    path: '/cart',
    aliases: [],
    type: 'modal',
    name: 'Order Cart',
    title: 'Your Order Cart | INDUSHI',
    icon: 'fa-solid fa-bag-shopping',
    description: 'Slide-over cart drawer with live price calculation.'
  },
  {
    path: '/checkout',
    aliases: [],
    type: 'modal',
    name: 'Delivery Checkout',
    title: 'Instant Delivery Checkout | INDUSHI',
    icon: 'fa-solid fa-credit-card',
    description: 'Instant dispatch with QRIS, GoPay, and ShopeePay.'
  },
  {
    path: '/login',
    aliases: ['/signin', '/auth'],
    type: 'modal',
    name: 'Sign In',
    title: 'Sign In | INDUSHI',
    icon: 'fa-solid fa-right-to-bracket',
    description: 'Customer and Master Admin authentication portal.'
  },
  {
    path: '/register',
    aliases: ['/signup'],
    type: 'modal',
    name: 'Create Account',
    title: 'Create Account | INDUSHI',
    icon: 'fa-solid fa-user-plus',
    description: 'New customer account registration with Admin verification.'
  },
  {
    path: '/verification-status',
    aliases: ['/verification', '/status'],
    type: 'modal',
    name: 'Verification Status',
    title: 'Account Verification Status | INDUSHI',
    icon: 'fa-solid fa-user-clock',
    description: 'Check status of customer registration and admin approval.'
  },
  {
    path: '/routes',
    aliases: ['/sitemap', '/pages'],
    type: 'modal',
    name: 'All Pages Navigator',
    title: 'Site Routes & Page Navigator | INDUSHI',
    icon: 'fa-solid fa-map-location-dot',
    description: 'Full live directory of all site sections, modals, and Admin views.'
  },

  // Admin Dashboard Panel & Tabs
  {
    path: '/admin/overview',
    aliases: ['/admin'],
    type: 'admin',
    adminTab: 'overview',
    name: 'Admin: Overview KPIs',
    title: 'Dashboard Overview | INDUSHI Admin',
    icon: 'fa-solid fa-chart-pie',
    description: 'Store revenue, order counts, active menu, and recent activity.'
  },
  {
    path: '/admin/products',
    aliases: [],
    type: 'admin',
    adminTab: 'products',
    name: 'Admin: Menu & Products',
    title: 'Menu & Products Manager | INDUSHI Admin',
    icon: 'fa-solid fa-utensils',
    description: 'Manage live sushi items, pricing, spice levels, and styles.'
  },
  {
    path: '/admin/orders',
    aliases: [],
    type: 'admin',
    adminTab: 'orders',
    name: 'Admin: Orders Dispatch',
    title: 'Orders Dispatch Manager | INDUSHI Admin',
    icon: 'fa-solid fa-box-open',
    description: 'Real-time customer checkout orders, status, and tracking.'
  },
  {
    path: '/admin/bookings',
    aliases: [],
    type: 'admin',
    adminTab: 'bookings',
    name: 'Admin: Table Bookings',
    title: 'Table Reservations Manager | INDUSHI Admin',
    icon: 'fa-solid fa-calendar-check',
    description: 'Guest bookings, party sizes, date/time, and status updates.'
  },
  {
    path: '/admin/users',
    aliases: ['/admin/verifications'],
    type: 'admin',
    adminTab: 'users',
    name: 'Admin: User Verifications',
    title: 'User Accounts & Verification Manager | INDUSHI Admin',
    icon: 'fa-solid fa-user-check',
    description: 'Approve or reject customer registrations to prevent spam.'
  },
  {
    path: '/admin/qa',
    aliases: ['/admin/bugs', '/admin/quality'],
    type: 'admin',
    adminTab: 'qa',
    name: 'Admin: QA & Bug Center',
    title: 'QA & Bug Center | INDUSHI Admin',
    icon: 'fa-solid fa-bug',
    description: 'Triage reported glitches, manage fix attempts, and run automated smoke tests.'
  },
  {
    path: '/admin/settings',
    aliases: ['/admin/config'],
    type: 'admin',
    adminTab: 'settings',
    name: 'Admin: Site Banner & Config',
    title: 'Site Banner & Configuration | INDUSHI Admin',
    icon: 'fa-solid fa-sliders',
    description: 'Top promo announcement banner and store operational status.'
  }
];

class Router {
  constructor() {
    this.routes = ROUTES;
    this.currentPath = '/home';
    this.previousPath = '/home';
    this.hooks = {};
    this.isNavigating = false;
    this.scrollSpyEnabled = true;
  }

  // Register external handlers from app.js
  registerHooks(hooks) {
    this.hooks = { ...this.hooks, ...hooks };
  }

  // Normalize any given hash or path into a standard route path
  normalizePath(rawPath) {
    if (!rawPath) return '/home';
    let path = rawPath.trim();
    if (path.startsWith('#')) path = path.slice(1);
    if (!path.startsWith('/')) path = '/' + path;

    // Remove trailing slash if not root
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Direct match
    const exact = this.routes.find(r => r.path === path || (r.aliases && r.aliases.includes(path)));
    if (exact) return exact.path;

    // Match section without leading slash (e.g. /#menu -> /menu)
    const sectionMatch = this.routes.find(r => r.path === path.toLowerCase());
    if (sectionMatch) return sectionMatch.path;

    return path;
  }

  // Find route metadata for a path
  getRoute(path) {
    const norm = this.normalizePath(path);
    return this.routes.find(r => r.path === norm) || {
      path: norm,
      type: 'unknown',
      name: norm,
      title: 'INDUSHI - Indonesian Fusion Sushi',
      icon: 'fa-solid fa-link',
      description: ''
    };
  }

  // Navigate programmatically to a route
  navigate(targetPath, options = {}) {
    const norm = this.normalizePath(targetPath);
    const hash = '#' + norm;

    if (window.location.hash !== hash) {
      if (options.replace) {
        history.replaceState(null, '', hash);
        this.handleRouteChange();
      } else {
        window.location.hash = hash;
      }
    } else {
      // If already on this hash, force route handling
      this.handleRouteChange();
    }
  }

  // Smooth scroll to a section on the public storefront
  scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      this.scrollSpyEnabled = false;
      el.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        this.scrollSpyEnabled = true;
      }, 700);
    }
  }

  // Core route transition dispatcher
  handleRouteChange() {
    const rawHash = window.location.hash || window.location.pathname;
    let path = this.normalizePath(rawHash);

    // Fallback if path is root
    if (path === '/' || path === '') path = '/home';

    const route = this.getRoute(path);
    this.previousPath = this.currentPath;
    this.currentPath = route.path;

    // 1. Update Document Title & Analytics
    document.title = route.title || 'INDUSHI - Indonesian Fusion Sushi';
    trackPageView(route.path, document.title);

    // 2. Update Route Badges in the UI
    this.updateRouteBadges(route);

    // 3. Admin Route Handling & Guard
    if (route.type === 'admin') {
      const isAdmin = this.hooks.checkAdminAuth ? this.hooks.checkAdminAuth() : false;
      if (!isAdmin) {
        if (this.hooks.showToast) {
          this.hooks.showToast('Admin privilege required to access Dashboard!', 'error');
        }
        sessionStorage.setItem('indushi_auth_redirect', route.path);
        this.navigate('/login', { replace: true });
        return;
      }

      // Open admin dashboard if not active and switch to tab
      if (this.hooks.openAdminDashboard) {
        this.hooks.openAdminDashboard(route.adminTab || 'overview');
      }
      this.closeAllPublicModals();
      this.updateNavbarActiveLink(null);
      this.dispatchRouteEvent(route);
      return;
    }

    // If leaving admin route, close admin dashboard modal
    if (this.hooks.closeAdminDashboard) {
      this.hooks.closeAdminDashboard();
    }

    // 4. Modal Route Handling
    if (route.type === 'modal') {
      this.handleModalRoute(route);
      this.dispatchRouteEvent(route);
      return;
    }

    // 5. Public Section Route Handling
    this.closeAllPublicModals();
    const sectionMap = {
      '/home': 'home',
      '/menu': 'menu',
      '/builder': 'builder',
      '/platters': 'platters',
      '/story': 'story'
    };
    const sectionId = sectionMap[route.path];
    if (sectionId) {
      this.scrollToSection(sectionId);
      this.updateNavbarActiveLink(sectionId);
    }

    this.dispatchRouteEvent(route);
  }

  // Handle opening specific modals based on route
  handleModalRoute(route) {
    if (this.hooks.closeAllModals) {
      this.hooks.closeAllModals();
    }

    switch (route.path) {
      case '/book-table':
        if (this.hooks.openBookingModal) this.hooks.openBookingModal();
        break;
      case '/cart':
        if (this.hooks.openCartDrawer) this.hooks.openCartDrawer();
        break;
      case '/checkout':
        if (this.hooks.openCheckoutModal) this.hooks.openCheckoutModal();
        break;
      case '/login':
        if (this.hooks.openAuthModal) this.hooks.openAuthModal('login');
        break;
      case '/register':
        if (this.hooks.openAuthModal) this.hooks.openAuthModal('register');
        break;
      case '/verification-status':
        if (this.hooks.openVerificationModal) this.hooks.openVerificationModal();
        break;
      case '/routes': {
        const isAdmin = this.hooks.checkAdminAuth ? this.hooks.checkAdminAuth() : false;
        if (!isAdmin) {
          if (this.hooks.showToast) {
            this.hooks.showToast('Route Navigator is reserved for Master Admin.', 'warning');
          }
          this.navigate('/home', { replace: true });
          return;
        }
        if (this.hooks.openRoutesModal) this.hooks.openRoutesModal();
        break;
      }
    }
  }

  // Close modals when switching to a regular public view
  closeAllPublicModals() {
    if (this.hooks.closeAllModals) {
      this.hooks.closeAllModals();
    }
  }

  // Update UI route badge displays
  updateRouteBadges(route) {
    // Admin header route badge text
    const adminBadgeText = document.getElementById('adminRoutePathText');
    if (adminBadgeText) {
      adminBadgeText.textContent = '#' + route.path;
    }
  }

  // Highlight active link in the top navigation bar
  updateNavbarActiveLink(activeSectionId) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (activeSectionId) {
        if (href === `#${activeSectionId}` || href === `#/${activeSectionId}` ||
           (href.includes('menu') && ['menu', 'builder', 'platters'].includes(activeSectionId))) {
          link.classList.add('active');
        }
      }
    });
  }

  // Dispatch custom route change event for components
  dispatchRouteEvent(route) {
    window.dispatchEvent(new CustomEvent('indushi:routechange', {
      detail: {
        route,
        path: route.path,
        previousPath: this.previousPath,
        title: route.title
      }
    }));
  }

  // Setup Scroll-Spy for smooth address bar synchronization without polluting history
  initScrollSpy() {
    const sections = ['home', 'menu', 'builder', 'platters', 'story', 'qa'];
    let lastSection = '';

    window.addEventListener('scroll', () => {
      if (!this.scrollSpyEnabled) return;

      // Don't scroll spy if admin panel or any modal overlay is active
      const adminModal = document.getElementById('adminDashboardModal');
      if (adminModal && adminModal.classList.contains('active')) return;
      const anyModalOpen = document.querySelector('.modal-overlay.active, .cart-drawer-overlay.active');
      if (anyModalOpen) return;

      let current = 'home';
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop - 180;
          if (window.scrollY >= top) {
            current = id;
          }
        }
      });

      if (current !== lastSection) {
        lastSection = current;
        const targetPath = '/' + current;
        this.currentPath = targetPath;
        const hash = '#' + targetPath;

        // Update URL hash without adding history stack entry
        if (window.location.hash !== hash) {
          history.replaceState(null, '', hash);
        }

        const route = this.getRoute(targetPath);
        if (route) {
          document.title = route.title || 'INDUSHI';
          this.updateNavbarActiveLink(current);
        }
      }
    }, { passive: true });
  }

  // Start the router and bind browser events
  init() {
    // Intercept clicks on links with href="#..." or href="#/..."
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href !== '#' && !anchor.hasAttribute('data-no-route')) {
          e.preventDefault();
          this.navigate(href);
        }
      }
    });

    // Listen to browser Back and Forward navigation
    window.addEventListener('hashchange', () => {
      this.handleRouteChange();
    });

    // Listen to popstate for history navigation
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });

    // Keyboard shortcut (Ctrl + K or Alt + R) to open All Routes Explorer
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.navigate('/routes');
      }
    });

    this.initScrollSpy();

    // Initial page load route resolution
    this.handleRouteChange();
  }
}

export const router = new Router();
