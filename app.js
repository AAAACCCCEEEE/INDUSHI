// INDUSHI Application Controller & Admin Control System
import { INDUSHI_DATA } from './data.js';
import { app as firebaseApp, auth, db, analytics } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {

  const INITIAL_PRODUCTS = INDUSHI_DATA.products;

  // --- STATE MANAGEMENT ---
  const state = {
    user: JSON.parse(localStorage.getItem('indushi_user')) || null,
    registeredUserList: JSON.parse(localStorage.getItem('indushi_registered_user_list')) || [
      {
        uid: 'seed-admin-01',
        name: 'Master Admin',
        email: 'admin@indushi.id',
        role: 'admin',
        status: 'active',
        createdAt: '2026-09-01 10:00'
      },
      {
        uid: 'seed-user-01',
        name: 'Sebastian Jefferson',
        email: 'user@indushi.id',
        role: 'customer',
        status: 'active',
        createdAt: '2026-09-02 12:00'
      }
    ],
    products: JSON.parse(localStorage.getItem('indushi_products')) || INITIAL_PRODUCTS,
    orders: JSON.parse(localStorage.getItem('indushi_orders')) || [
      {
        id: 'ORD-1001',
        customer: 'Reza Rahardian',
        phone: '081299887766',
        address: 'Jl. Senopati No. 42, Jakarta Selatan',
        items: '1x Rendang Aburi Supreme Roll, 1x Es Cendol Matcha',
        total: 100000,
        paymentMethod: 'QRIS',
        status: 'Delivered',
        createdAt: '2026-09-04 14:30'
      },
      {
        id: 'ORD-1002',
        customer: 'Sarah Amalia',
        phone: '081345678901',
        address: 'SCBD Tower 2 Lt. 15, Jakarta Pusat',
        items: '1x Pesta Nusantara Platter Tower',
        total: 890000,
        paymentMethod: 'GoPay',
        status: 'Pending',
        createdAt: '2026-09-05 08:15'
      }
    ],
    bookings: JSON.parse(localStorage.getItem('indushi_bookings')) || [
      {
        id: 'RSV-501',
        name: 'Michael Tan',
        email: 'michael.tan@gmail.com',
        date: '2026-09-06',
        time: '18:30',
        pax: '4 Guests',
        status: 'Confirmed',
        createdAt: '2026-09-04 19:00'
      }
    ],
    siteSettings: JSON.parse(localStorage.getItem('indushi_settings')) || {
      showAnnouncement: true,
      announcementText: 'Get 20% OFF on all Signature Rolls with code INDUSHIFUSION20!',
      isStoreOpen: true
    },
    activeCategory: 'all',
    spiceFilter: 'all',
    styleFilter: 'all',
    currentHeroSlide: 0,
    heroAutoTimer: null,
    cart: JSON.parse(localStorage.getItem('indushi_cart')) || [],
    
    // Custom Roll Builder State
    customRoll: {
      base: INDUSHI_DATA.customBuilderOptions.bases[0],
      protein: INDUSHI_DATA.customBuilderOptions.proteins[0],
      filling: INDUSHI_DATA.customBuilderOptions.fillings[0],
      topping: INDUSHI_DATA.customBuilderOptions.toppings[0],
      torch: INDUSHI_DATA.customBuilderOptions.torchLevels[0]
    }
  };

  // --- STATE SAVERS ---
  function saveRegisteredUserList() {
    localStorage.setItem('indushi_registered_user_list', JSON.stringify(state.registeredUserList));
  }
  function saveProducts() {
    localStorage.setItem('indushi_products', JSON.stringify(state.products));
  }
  function saveOrders() {
    localStorage.setItem('indushi_orders', JSON.stringify(state.orders));
  }
  function saveBookings() {
    localStorage.setItem('indushi_bookings', JSON.stringify(state.bookings));
  }
  function saveSettings() {
    localStorage.setItem('indushi_settings', JSON.stringify(state.siteSettings));
  }
  function saveUser() {
    if (state.user) {
      localStorage.setItem('indushi_user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('indushi_user');
    }
  }

  // --- DOM ELEMENTS ---
  const announcementBar = document.getElementById('announcementBar');
  const announcementText = document.getElementById('announcementText');
  const closeAnnouncementBtn = document.getElementById('closeAnnouncementBtn');

  const navLinks = document.querySelectorAll('.nav-link');
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const navLinksMenu = document.getElementById('navLinks');
  const userNavContainer = document.getElementById('userNavContainer');
  const openAuthModalBtn = document.getElementById('openAuthModalBtn');

  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots = document.querySelectorAll('.indicator-dot');
  const prevHeroBtn = document.getElementById('prevHeroBtn');
  const nextHeroBtn = document.getElementById('nextHeroBtn');

  const categoryTabs = document.getElementById('categoryTabs');
  const spiceFilterSelect = document.getElementById('spiceFilter');
  const styleFilterSelect = document.getElementById('styleFilter');
  const productGrid = document.getElementById('productGrid');
  
  const platterGrid = document.getElementById('platterGrid');
  const testimonialsGrid = document.getElementById('testimonialsGrid');

  // Custom Builder Elements
  const baseOptionsContainer = document.getElementById('baseOptions');
  const proteinOptionsContainer = document.getElementById('proteinOptions');
  const fillingOptionsContainer = document.getElementById('fillingOptions');
  const toppingOptionsContainer = document.getElementById('toppingOptions');
  const torchOptionsContainer = document.getElementById('torchOptions');

  const summaryBase = document.getElementById('summaryBase');
  const summaryProtein = document.getElementById('summaryProtein');
  const summaryFilling = document.getElementById('summaryFilling');
  const summaryTopping = document.getElementById('summaryTopping');
  const summaryTorch = document.getElementById('summaryTorch');
  const customTotalPrice = document.getElementById('customTotalPrice');
  const addCustomRollBtn = document.getElementById('addCustomRollBtn');
  const sushiVisual = document.getElementById('sushiVisual');
  const sushiVisualText = document.getElementById('sushiVisualText');

  // Cart & Modals
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartItemList = document.getElementById('cartItemList');
  const cartSubtotalAmount = document.getElementById('cartSubtotalAmount');
  const cartBadgeCount = document.getElementById('cartBadgeCount');
  const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');

  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const payMethodBtns = document.querySelectorAll('.pay-method-btn');

  const bookingModal = document.getElementById('bookingModal');
  const closeBookingBtn = document.getElementById('closeBookingBtn');
  const bookTableNavBtn = document.getElementById('bookTableNavBtn');
  const heroBookBtn2 = document.getElementById('heroBookBtn2');
  const orderNowNavBtn = document.getElementById('orderNowNavBtn');
  const bookingForm = document.getElementById('bookingForm');

  const toastContainer = document.getElementById('toastContainer');

  // Auth Modal Elements
  const authModal = document.getElementById('authModal');
  const closeAuthBtn = document.getElementById('closeAuthBtn');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Admin Dashboard Elements
  const adminDashboardModal = document.getElementById('adminDashboardModal');
  const closeAdminDashboardBtn = document.getElementById('closeAdminDashboardBtn');
  const adminNavItems = document.querySelectorAll('[data-admin-tab]');
  const adminTabContents = document.querySelectorAll('.admin-tab-content');
  const adminTabTitle = document.getElementById('adminTabTitle');
  const adminTabSubtitle = document.getElementById('adminTabSubtitle');
  const adminLoggedName = document.getElementById('adminLoggedName');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const viewLiveSiteBtn = document.getElementById('viewLiveSiteBtn');

  // Admin Products Tab Elements
  const adminProductSearch = document.getElementById('adminProductSearch');
  const adminCategoryFilter = document.getElementById('adminCategoryFilter');
  const openAddProductBtn = document.getElementById('openAddProductBtn');
  const adminProductsTableBody = document.getElementById('adminProductsTableBody');

  // Admin Product Form Modal Elements
  const productFormModal = document.getElementById('productFormModal');
  const closeProductFormBtn = document.getElementById('closeProductFormBtn');
  const productForm = document.getElementById('productForm');
  const productModalHeading = document.getElementById('productModalHeading');
  const editProductIdInput = document.getElementById('editProductId');

  // Admin Settings Tab Elements
  const toggleAnnouncementBar = document.getElementById('toggleAnnouncementBar');
  const announcementTextEdit = document.getElementById('announcementTextEdit');
  const saveBannerSettingsBtn = document.getElementById('saveBannerSettingsBtn');
  const toggleStoreOpen = document.getElementById('toggleStoreOpen');
  const saveStoreStatusBtn = document.getElementById('saveStoreStatusBtn');
  const resetDataDefaultBtn = document.getElementById('resetDataDefaultBtn');

  // --- INITIALIZATION ---
  initAnnouncementBar();
  initNavbar();
  initAuthSystem();
  initHeroSlider();
  initCategories();
  initFilters();
  renderProducts();
  initCustomBuilder();
  renderPlatters();
  renderTestimonials();
  initCartAndModals();
  initAdminDashboard();
  updateCartUI();
  updateUserNavUI();

  // --- ANNOUNCEMENT BAR LOGIC ---
  function initAnnouncementBar() {
    if (!announcementBar) return;
    if (state.siteSettings.showAnnouncement) {
      announcementBar.style.display = 'block';
      if (announcementText) announcementText.textContent = state.siteSettings.announcementText;
    } else {
      announcementBar.style.display = 'none';
    }

    if (closeAnnouncementBtn) {
      closeAnnouncementBtn.addEventListener('click', () => {
        announcementBar.style.display = 'none';
      });
    }
  }

  // --- AUTH SYSTEM LOGIC (FIREBASE AUTH & FIRESTORE INTEGRATED) ---
  function initAuthSystem() {
    if (openAuthModalBtn) {
      openAuthModalBtn.addEventListener('click', () => {
        authModal.classList.add('active');
      });
    }

    if (closeAuthBtn) {
      closeAuthBtn.addEventListener('click', () => {
        authModal.classList.remove('active');
      });
    }

    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.classList.remove('active');
      });
    }

    // Auth Tab Switches
    if (tabLoginBtn && tabRegisterBtn) {
      tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
      });

      tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
      });
    }

    // Firebase Auth State Listener
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let name = firebaseUser.displayName || firebaseUser.email.split('@')[0];
        let role = 'customer';
        let status = 'pending';

        const localRecord = state.registeredUserList.find(
          u => u.uid === firebaseUser.uid || u.email.toLowerCase() === firebaseUser.email.toLowerCase()
        );

        if (localRecord) {
          name = localRecord.name || name;
          role = localRecord.role || role;
          status = localRecord.status || status;
        }

        if (firebaseUser.email.toLowerCase() === 'admin@indushi.id') {
          role = 'admin';
          status = 'active';
          name = 'Master Admin';
        }

        // Try reading Firestore user record safely without clearing state on permission errors
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap && userSnap.exists()) {
            const data = userSnap.data();
            if (data.name) name = data.name;
            if (data.role) role = data.role;
            if (data.status) status = data.status;
          }
        } catch (err) {
          console.warn("Firestore sync note (non-fatal):", err);
        }

        if (role === 'admin') {
          status = 'active';
        }

        if (role !== 'admin' && status !== 'active') {
          await signOut(auth);
          state.user = null;
          saveUser();
          updateUserNavUI();
          showToast('⏳ Your account is pending Admin approval. Please wait for an admin to verify your account before logging in.', 'error');
          return;
        }

        state.user = { uid: firebaseUser.uid, email: firebaseUser.email, name, role, status };
        saveUser();
        updateUserNavUI();

        if (role === 'admin' && !state.registeredUserList.some(u => u.email.toLowerCase() === firebaseUser.email.toLowerCase())) {
          state.registeredUserList.unshift({
            uid: firebaseUser.uid,
            name,
            email: firebaseUser.email,
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          });
          saveRegisteredUserList();
        }
      } else {
        // If state.user is set via local fallback (e.g. seed admin), preserve local session unless explicit logout
        if (state.user && state.user.isLocalFallback) {
          updateUserNavUI();
        } else {
          state.user = null;
          saveUser();
          updateUserNavUI();
        }
      }
    });

    // Login Form Submit -> Integrated Cloud & Local Fallback Authentication
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        showToast('Authenticating...', 'info');

        const isSeedAdmin = email.toLowerCase() === 'admin@indushi.id';
        const localRecord = state.registeredUserList.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.status === 'active'
        );

        let authenticated = false;
        let fbUser = null;

        // 1. Attempt standard Firebase Auth sign in
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          fbUser = userCredential.user;
          authenticated = true;
        } catch (authError) {
          console.warn("Firebase Auth sign-in note:", authError);

          // 2. If seed admin or active local user, attempt auto-creation on Firebase Auth if missing
          if (isSeedAdmin || localRecord) {
            try {
              const newCred = await createUserWithEmailAndPassword(auth, email, password);
              fbUser = newCred.user;
              authenticated = true;
            } catch (createErr) {
              console.warn("Firebase Auth auto-provision note:", createErr);
              // Fallback to local active session
              authenticated = true;
            }
          }
        }

        if (!authenticated && !isSeedAdmin && !localRecord) {
          showToast('Invalid credentials or account not found in Firebase!', 'error');
          return;
        }

        // 3. Resolve user details and permissions
        let uid = fbUser ? fbUser.uid : (localRecord ? localRecord.uid : 'seed-admin-01');
        let name = isSeedAdmin ? 'Master Admin' : (localRecord ? localRecord.name : (fbUser?.displayName || email.split('@')[0]));
        let role = (isSeedAdmin || localRecord?.role === 'admin') ? 'admin' : (localRecord ? localRecord.role : 'customer');
        let status = (isSeedAdmin || role === 'admin') ? 'active' : (localRecord ? localRecord.status : 'pending');

        // Safely check Firestore for custom role overrides if cloud user exists
        if (fbUser) {
          try {
            const userDocRef = doc(db, "users", fbUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap && userSnap.exists()) {
              const data = userSnap.data();
              if (data.name) name = data.name;
              if (data.role) role = data.role;
              if (data.status) status = data.status;
            }
          } catch (fsErr) {
            console.warn("Firestore user fetch note (non-fatal):", fsErr);
          }
        }

        if (isSeedAdmin) {
          role = 'admin';
          status = 'active';
        }

        if (role !== 'admin' && status !== 'active') {
          showToast('⏳ Your account is pending Admin approval.', 'error');
          return;
        }

        state.user = {
          uid,
          email,
          name,
          role,
          status,
          isLocalFallback: !fbUser
        };
        saveUser();
        updateUserNavUI();

        if (authModal) authModal.classList.remove('active');

        if (role === 'admin') {
          showToast('Welcome Admin! Opening Admin Panel... 🛡️', 'success');
          setTimeout(() => {
            openAdminDashboard();
          }, 300);
        } else {
          showToast(`Welcome back, ${name}! Logged in successfully. 👋`, 'success');
        }
      });
    }

    // Register Form Submit -> Firebase Auth Create User (Always role: customer, status: pending)
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;

        try {
          showToast('Submitting registration request to Firebase...', 'info');
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const fbUser = userCredential.user;

          // Always set role as customer and status as pending!
          const role = 'customer';
          const status = 'pending';
          const createdAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

          // Save user profile to Firestore
          try {
            await setDoc(doc(db, "users", fbUser.uid), {
              uid: fbUser.uid,
              email: email,
              name: name,
              role: role,
              status: status,
              createdAt: createdAt
            });
          } catch (fsErr) {
            console.warn("Firestore user creation note:", fsErr);
          }

          // Save to local registered list as pending
          const newUserRecord = {
            uid: fbUser.uid,
            name,
            email,
            role,
            status,
            createdAt
          };

          const existingIdx = state.registeredUserList.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
          if (existingIdx > -1) {
            state.registeredUserList[existingIdx] = newUserRecord;
          } else {
            state.registeredUserList.unshift(newUserRecord);
          }
          saveRegisteredUserList();

          // Immediately sign out since account requires admin verification
          await signOut(auth);
          state.user = null;
          saveUser();
          updateUserNavUI();

          if (authModal) authModal.classList.remove('active');
          showToast(`🎉 Registration request submitted! Your account is now pending Admin approval.`, 'success');
        } catch (error) {
          console.error("Firebase Register Error:", error);
          let msg = 'Failed to register account in Firebase.';
          if (error.code === 'auth/email-already-in-use') {
            msg = 'This email is already registered in Firebase!';
          } else if (error.code === 'auth/weak-password') {
            msg = 'Password should be at least 6 characters.';
          } else {
            msg = error.message || 'Firebase registration failed.';
          }
          showToast(msg, 'error');
        }
      });
    }

    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener('click', performLogout);
    }
  }

  async function performLogout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase SignOut note:", e);
    }
    state.user = null;
    saveUser();
    updateUserNavUI();
    if (adminDashboardModal) adminDashboardModal.classList.remove('active');
    showToast('Logged out of Firebase session.', 'info');
  }

  function updateUserNavUI() {
    if (!userNavContainer) return;

    if (state.user) {
      if (state.user.role === 'admin') {
        userNavContainer.innerHTML = `
          <button class="nav-admin-btn" id="openAdminNavBtn">
            <i class="fa-solid fa-user-shield"></i>
            <span>Admin Panel</span>
          </button>
          <button class="btn-icon-only" id="navLogoutBtn" title="Logout">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        `;
        document.getElementById('openAdminNavBtn').addEventListener('click', openAdminDashboard);
        document.getElementById('navLogoutBtn').addEventListener('click', performLogout);
      } else {
        userNavContainer.innerHTML = `
          <div class="nav-user-pill">
            <div class="nav-user-avatar">${state.user.name.charAt(0)}</div>
            <span>${state.user.name.split(' ')[0]}</span>
          </div>
          <button class="btn-icon-only" id="navLogoutBtn" title="Logout">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        `;
        document.getElementById('navLogoutBtn').addEventListener('click', performLogout);
      }
    } else {
      userNavContainer.innerHTML = `
        <button class="btn btn-primary nav-login-btn" id="openAuthModalBtn">
          <i class="fa-solid fa-user"></i>
          <span class="btn-text">Login</span>
        </button>
      `;
      document.getElementById('openAuthModalBtn').addEventListener('click', () => {
        if (authModal) authModal.classList.add('active');
      });
    }
  }

  // --- NAVBAR LOGIC ---
  function initNavbar() {
    const dropdownToggle = document.getElementById('menuDropdownToggle');
    const dropdownItemParent = dropdownToggle ? dropdownToggle.closest('.nav-item-dropdown') : null;
    const allNavLinks = document.querySelectorAll('.nav-link, .dropdown-item');

    // Smooth scrolling & active link update on scroll
    window.addEventListener('scroll', () => {
      let current = 'home';
      const sections = document.querySelectorAll('section');
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
          current = section.getAttribute('id');
        }
      });

      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${current}` || (href === '#menu' && (current === 'menu' || current === 'builder' || current === 'platters'))) {
          link.classList.add('active');
        }
      });
    });

    if (dropdownToggle && dropdownItemParent) {
      dropdownToggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdownItemParent.classList.toggle('open');
        }
      });
    }

    if (mobileNavToggle && navLinksMenu) {
      mobileNavToggle.addEventListener('click', () => {
        navLinksMenu.classList.toggle('active');
        const icon = mobileNavToggle.querySelector('i');
        if (navLinksMenu.classList.contains('active')) {
          if (icon) icon.className = 'fa-solid fa-xmark';
        } else {
          if (icon) icon.className = 'fa-solid fa-bars';
          if (dropdownItemParent) dropdownItemParent.classList.remove('open');
        }
      });
    }

    allNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const targetSection = document.querySelector(href);
          if (targetSection) {
            e.preventDefault();
            targetSection.scrollIntoView({ behavior: 'smooth' });
          }
        }

        if (navLinksMenu && navLinksMenu.classList.contains('active')) {
          navLinksMenu.classList.remove('active');
          const icon = mobileNavToggle ? mobileNavToggle.querySelector('i') : null;
          if (icon) icon.className = 'fa-solid fa-bars';
          if (dropdownItemParent) dropdownItemParent.classList.remove('open');
        }
      });
    });
  }

  // --- HERO SLIDER LOGIC ---
  function initHeroSlider() {
    function showSlide(index) {
      heroSlides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
      heroDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
      state.currentHeroSlide = index;
    }

    function nextSlide() {
      const nextIndex = (state.currentHeroSlide + 1) % heroSlides.length;
      showSlide(nextIndex);
    }

    function prevSlide() {
      const prevIndex = (state.currentHeroSlide - 1 + heroSlides.length) % heroSlides.length;
      showSlide(prevIndex);
    }

    if (prevHeroBtn) prevHeroBtn.addEventListener('click', prevSlide);
    if (nextHeroBtn) nextHeroBtn.addEventListener('click', nextSlide);

    heroDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const target = parseInt(dot.getAttribute('data-to'));
        showSlide(target);
      });
    });

    state.heroAutoTimer = setInterval(nextSlide, 6000);
  }

  // --- CATEGORIES & FILTERS LOGIC ---
  function initCategories() {
    categoryTabs.innerHTML = INDUSHI_DATA.categories.map(cat => `
      <button class="tab-btn ${cat.id === state.activeCategory ? 'active' : ''}" data-cat="${cat.id}">
        ${cat.name}
      </button>
    `).join('');

    categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        categoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeCategory = btn.getAttribute('data-cat');
        renderProducts();
      });
    });
  }

  function initFilters() {
    spiceFilterSelect.addEventListener('change', (e) => {
      state.spiceFilter = e.target.value;
      renderProducts();
    });

    styleFilterSelect.addEventListener('change', (e) => {
      state.styleFilter = e.target.value;
      renderProducts();
    });
  }

  function renderProducts() {
    let filtered = state.products;

    if (state.activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === state.activeCategory);
    }

    if (state.spiceFilter === 'mild') {
      filtered = filtered.filter(p => p.spiceLevel <= 2);
    } else if (state.spiceFilter === 'medium') {
      filtered = filtered.filter(p => p.spiceLevel >= 3 && p.spiceLevel <= 4);
    } else if (state.spiceFilter === 'spicy') {
      filtered = filtered.filter(p => p.spiceLevel === 5);
    }

    if (state.styleFilter !== 'all') {
      filtered = filtered.filter(p => p.cookingStyle === state.styleFilter);
    }

    if (filtered.length === 0) {
      productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:3rem; color:var(--text-muted);">
          <i class="fa-solid fa-pepper-hot" style="font-size:3rem; margin-bottom:1rem; color:var(--primary-accent);"></i>
          <h3>No rolls found matching your exact filter.</h3>
          <p style="margin-top:0.4rem;">Try adjusting your spice slider or category!</p>
        </div>
      `;
      return;
    }

    productGrid.innerHTML = filtered.map(item => `
      <div class="product-card">
        <div class="product-img-wrapper">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
          <div class="product-badges">
            ${item.isCooked ? `<span class="badge badge-cooked"><i class="fa-solid fa-circle-check"></i> 100% Cooked</span>` : ''}
            ${item.cookingStyle && item.cookingStyle.includes('Aburi') ? `<span class="badge badge-aburi"><i class="fa-solid fa-fire"></i> Torched Aburi</span>` : ''}
            ${item.badge ? `<span class="badge badge-bestseller">${item.badge}</span>` : ''}
          </div>
          ${item.spiceLevel > 0 ? `
            <div class="spice-tag">
              ${'🔥'.repeat(Math.min(item.spiceLevel, 5))} ${item.spiceLevel}/5
            </div>
          ` : ''}
        </div>
        <div class="product-body">
          <h3 class="product-title">${item.name}</h3>
          <p class="product-desc">${item.description}</p>
          <div class="product-footer">
            <span class="product-price">${item.formattedPrice || `IDR ${parseInt(item.price).toLocaleString()}`}</span>
            <button class="add-cart-btn" data-id="${item.id}" title="Add to Cart">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    productGrid.querySelectorAll('.add-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        const product = state.products.find(p => p.id === prodId);
        if (product) {
          addToCart(product);
        }
      });
    });
  }

  // --- CUSTOM ROLL BUILDER LOGIC ---
  function initCustomBuilder() {
    renderChipGroup(baseOptionsContainer, INDUSHI_DATA.customBuilderOptions.bases, 'base', state.customRoll.base.id);
    renderChipGroup(proteinOptionsContainer, INDUSHI_DATA.customBuilderOptions.proteins, 'protein', state.customRoll.protein.id);
    renderChipGroup(fillingOptionsContainer, INDUSHI_DATA.customBuilderOptions.fillings, 'filling', state.customRoll.filling.id);
    renderChipGroup(toppingOptionsContainer, INDUSHI_DATA.customBuilderOptions.toppings, 'topping', state.customRoll.topping.id);
    renderChipGroup(torchOptionsContainer, INDUSHI_DATA.customBuilderOptions.torchLevels, 'torch', state.customRoll.torch.id);

    updateBuilderPreview();

    addCustomRollBtn.addEventListener('click', () => {
      const customItem = {
        id: 'custom-' + Date.now(),
        name: `Custom Roll: ${state.customRoll.protein.name.split(' ')[0]} & ${state.customRoll.topping.name.split(' ')[0]}`,
        price: calculateCustomTotal(),
        formattedPrice: `IDR ${calculateCustomTotal().toLocaleString()}`,
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80',
        description: `Base: ${state.customRoll.base.name} | Filling: ${state.customRoll.filling.name} | Finish: ${state.customRoll.torch.name}`,
        isCustom: true
      };
      addToCart(customItem);
    });
  }

  function renderChipGroup(container, list, key, selectedId) {
    container.innerHTML = list.map(item => `
      <div class="option-chip ${item.id === selectedId ? 'selected' : ''}" data-key="${key}" data-id="${item.id}">
        <span class="option-name">${item.name}</span>
        <span class="option-price">+IDR ${(item.price || item.extra || 0).toLocaleString()}</span>
      </div>
    `).join('');

    container.querySelectorAll('.option-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        
        const itemId = chip.getAttribute('data-id');
        const found = list.find(x => x.id === itemId);
        state.customRoll[key] = found;
        
        updateBuilderPreview();
      });
    });
  }

  function calculateCustomTotal() {
    const { base, protein, filling, topping, torch } = state.customRoll;
    return (base.price || 0) + (protein.price || 0) + (filling.price || 0) + (topping.price || 0) + (torch.extra || 0);
  }

  function updateBuilderPreview() {
    const { base, protein, filling, topping, torch } = state.customRoll;
    
    summaryBase.textContent = base.name.split(' ')[0];
    summaryProtein.textContent = protein.name.split(' ')[0];
    summaryFilling.textContent = filling.name.split(' ')[0];
    summaryTopping.textContent = topping.name.split(' ')[0];
    summaryTorch.textContent = torch.name.split(' ')[0];

    const total = calculateCustomTotal();
    customTotalPrice.textContent = `IDR ${total.toLocaleString()}`;

    if (sushiVisual) {
      if (torch.id === 'l2') {
        sushiVisual.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8), 0 0 30px rgba(232,80,29,0.8)';
        sushiVisualText.textContent = `${protein.name.split(' ')[0]} ABURI`;
      } else {
        sushiVisual.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8), 0 0 20px rgba(232,80,29,0.3)';
        sushiVisualText.textContent = `${protein.name.split(' ')[0]} ROLL`;
      }
    }
  }

  // --- CATERING & TESTIMONIALS ---
  function renderPlatters() {
    platterGrid.innerHTML = INDUSHI_DATA.cateringPlatters.map(plat => `
      <div class="platter-card">
        <div class="platter-header">
          <span class="platter-pax"><i class="fa-solid fa-users"></i> ${plat.pax}</span>
          <h3 class="platter-title">${plat.name}</h3>
          <div class="platter-price">${plat.formattedPrice}</div>
          <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.3rem;">${plat.popularFor}</p>
        </div>
        <div class="platter-body">
          <ul class="platter-includes">
            ${plat.includes.map(inc => `<li>${inc}</li>`).join('')}
          </ul>
          <button class="btn btn-primary order-platter-btn" data-id="${plat.id}" style="width:100%; margin-top:1rem;">
            <i class="fa-solid fa-boxes-stacked"></i> Order Platter Tower
          </button>
        </div>
      </div>
    `).join('');

    platterGrid.querySelectorAll('.order-platter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const platId = btn.getAttribute('data-id');
        const platter = INDUSHI_DATA.cateringPlatters.find(p => p.id === platId);
        if (platter) {
          addToCart(platter);
        }
      });
    });
  }

  function renderTestimonials() {
    testimonialsGrid.innerHTML = INDUSHI_DATA.testimonials.map(rev => `
      <div class="testimonial-card">
        <div class="rev-stars">${'★'.repeat(rev.rating)}</div>
        <p class="rev-comment">"${rev.comment}"</p>
        <div class="rev-user">
          <img src="${rev.avatar}" alt="${rev.name}">
          <div class="rev-info">
            <h5>${rev.name}</h5>
            <p>${rev.role}</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  // --- CART & MODAL SYSTEM ---
  function initCartAndModals() {
    openCartBtn.addEventListener('click', () => cartOverlay.classList.add('active'));
    closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('active'));
    cartOverlay.addEventListener('click', (e) => {
      if (e.target === cartOverlay) cartOverlay.classList.remove('active');
    });

    proceedCheckoutBtn.addEventListener('click', () => {
      if (state.cart.length === 0) {
        showToast('Your order cart is empty!', 'error');
        return;
      }
      cartOverlay.classList.remove('active');
      checkoutModal.classList.add('active');
    });

    closeCheckoutBtn.addEventListener('click', () => checkoutModal.classList.remove('active'));
    checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) checkoutModal.classList.remove('active');
    });

    payMethodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        payMethodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const payType = btn.getAttribute('data-pay');
        const qrisBox = document.getElementById('qrisVisualBox');
        if (payType === 'qris') {
          qrisBox.style.display = 'block';
        } else {
          qrisBox.style.display = 'none';
        }
      });
    });

    // Customer Checkout Form Submit -> Saves Order to Admin State!
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const custName = document.getElementById('custName').value.trim();
      const custPhone = document.getElementById('custPhone').value.trim();
      const custAddress = document.getElementById('custAddress').value.trim();
      const activePayBtn = document.querySelector('.pay-method-btn.active');
      const payMethod = activePayBtn ? activePayBtn.getAttribute('data-pay').toUpperCase() : 'QRIS';

      const cartTotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const itemsSummary = state.cart.map(i => `${i.qty}x ${i.name}`).join(', ');

      const newOrder = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        customer: custName,
        phone: custPhone,
        address: custAddress,
        items: itemsSummary,
        total: cartTotal,
        paymentMethod: payMethod,
        status: 'Pending',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      state.orders.unshift(newOrder);
      saveOrders();

      checkoutModal.classList.remove('active');
      state.cart = [];
      saveCart();
      updateCartUI();

      if (adminDashboardModal.classList.contains('active')) {
        renderAdminOverview();
        renderAdminOrders();
      }

      showToast(`🎉 Thank you ${custName}! Order ${newOrder.id} confirmed. Dispatching courier...`, 'success');
    });

    // Booking Table Modal Submit -> Saves Booking to Admin State!
    const openBooking = () => bookingModal.classList.add('active');
    const closeBooking = () => bookingModal.classList.remove('active');

    if (bookTableNavBtn) bookTableNavBtn.addEventListener('click', openBooking);
    if (heroBookBtn2) heroBookBtn2.addEventListener('click', openBooking);
    if (closeBookingBtn) closeBookingBtn.addEventListener('click', closeBooking);
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) closeBooking();
    });

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('bookName').value.trim();
      const email = document.getElementById('bookEmail').value.trim();
      const date = document.getElementById('bookDate').value;
      const time = document.getElementById('bookTime').value;
      const pax = document.getElementById('bookPax').value + ' Guests';

      const newBooking = {
        id: 'RSV-' + Math.floor(100 + Math.random() * 900),
        name,
        email,
        date,
        time,
        pax,
        status: 'Confirmed',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      state.bookings.unshift(newBooking);
      saveBookings();

      closeBooking();

      if (adminDashboardModal.classList.contains('active')) {
        renderAdminOverview();
        renderAdminBookings();
      }

      showToast(`Table Reserved for ${name} on ${date} at ${time}! 🍽️`, 'success');
    });
  }

  function addToCart(item) {
    const existingIndex = state.cart.findIndex(i => i.id === item.id);
    if (existingIndex > -1 && !item.isCustom) {
      state.cart[existingIndex].qty += 1;
    } else {
      state.cart.push({ ...item, qty: 1 });
    }
    saveCart();
    updateCartUI();
    showToast(`${item.name} added to cart!`, 'success');
  }

  function saveCart() {
    localStorage.setItem('indushi_cart', JSON.stringify(state.cart));
  }

  function updateCartUI() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadgeCount.textContent = totalCount;

    if (state.cart.length === 0) {
      cartItemList.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
          <i class="fa-solid fa-bag-shopping" style="font-size:2.5rem; margin-bottom:1rem; opacity:0.5;"></i>
          <p>Your order cart is currently empty.</p>
        </div>
      `;
      cartSubtotalAmount.textContent = 'IDR 0';
      return;
    }

    let subtotal = 0;
    cartItemList.innerHTML = state.cart.map(item => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      return `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">IDR ${itemTotal.toLocaleString()}</div>
            <div class="cart-item-qty">
              <button class="qty-btn" data-action="minus" data-id="${item.id}">-</button>
              <span style="font-weight:700;">${item.qty}</span>
              <button class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
            </div>
          </div>
          <button class="remove-cart-item-btn" data-id="${item.id}" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
    }).join('');

    cartSubtotalAmount.textContent = `IDR ${subtotal.toLocaleString()}`;

    cartItemList.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        const item = state.cart.find(i => i.id === id);
        if (!item) return;

        if (action === 'plus') {
          item.qty += 1;
        } else if (action === 'minus') {
          item.qty -= 1;
          if (item.qty <= 0) {
            state.cart = state.cart.filter(i => i.id !== id);
          }
        }
        saveCart();
        updateCartUI();
      });
    });

    cartItemList.querySelectorAll('.remove-cart-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        state.cart = state.cart.filter(i => i.id !== id);
        saveCart();
        updateCartUI();
      });
    });
  }

  // --- ADMIN DASHBOARD CONTROLLER ---
  function openAdminDashboard() {
    if (!state.user || state.user.role !== 'admin') {
      showToast('Admin privilege required to access Dashboard!', 'error');
      if (authModal) authModal.classList.add('active');
      return;
    }

    if (adminDashboardModal) adminDashboardModal.classList.add('active');
    if (adminLoggedName && state.user) adminLoggedName.textContent = state.user.name;

    renderAdminOverview();
    renderAdminProducts();
    renderAdminOrders();
    renderAdminBookings();
    renderAdminUsers();
    loadAdminSettingsUI();
  }

  function initAdminDashboard() {
    if (closeAdminDashboardBtn) {
      closeAdminDashboardBtn.addEventListener('click', () => {
        adminDashboardModal.classList.remove('active');
      });
    }

    if (viewLiveSiteBtn) {
      viewLiveSiteBtn.addEventListener('click', () => {
        adminDashboardModal.classList.remove('active');
      });
    }

    // Sidebar Tab Switches
    adminNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.getAttribute('data-admin-tab');

        adminNavItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        adminTabContents.forEach(content => {
          content.classList.remove('active');
        });

        const activeContent = document.getElementById(`tab-admin-${targetTab}`);
        if (activeContent) activeContent.classList.add('active');

        // Titles
        const titleMap = {
          overview: { title: 'Dashboard Overview', sub: 'Real-time store metrics and control center.' },
          products: { title: 'Menu & Products Manager', sub: 'Direct live control over sushi items displayed on the website.' },
          orders: { title: 'Customer Orders Dispatch', sub: 'Manage live checkout orders and delivery status.' },
          bookings: { title: 'Table Reservations Manager', sub: 'View and manage guest reservations at Senopati location.' },
          users: { title: 'User Accounts & Verification Manager', sub: 'Approve or reject customer account registration requests to prevent spam.' },
          settings: { title: 'Site Banner & Configuration', sub: 'Manage top announcement banner and store operational status.' }
        };

        if (titleMap[targetTab]) {
          adminTabTitle.textContent = titleMap[targetTab].title;
          adminTabSubtitle.textContent = titleMap[targetTab].sub;
        }

        if (targetTab === 'overview') renderAdminOverview();
        if (targetTab === 'products') renderAdminProducts();
        if (targetTab === 'orders') renderAdminOrders();
        if (targetTab === 'bookings') renderAdminBookings();
        if (targetTab === 'users') renderAdminUsers();
        if (targetTab === 'settings') loadAdminSettingsUI();
      });
    });

    // Product Search & Filter in Admin
    if (adminProductSearch) {
      adminProductSearch.addEventListener('input', renderAdminProducts);
    }
    if (adminCategoryFilter) {
      adminCategoryFilter.addEventListener('change', renderAdminProducts);
    }

    // Add Product Modal Triggers
    if (openAddProductBtn) {
      openAddProductBtn.addEventListener('click', () => {
        productForm.reset();
        editProductIdInput.value = '';
        productModalHeading.innerHTML = `<i class="fa-solid fa-utensils" style="color:var(--primary-accent);"></i> Add New Sushi Item`;
        productFormModal.classList.add('active');
      });
    }

    if (closeProductFormBtn) {
      closeProductFormBtn.addEventListener('click', () => {
        productFormModal.classList.remove('active');
      });
    }

    if (productFormModal) {
      productFormModal.addEventListener('click', (e) => {
        if (e.target === productFormModal) productFormModal.classList.remove('active');
      });
    }

    // Product Form Submit (Add or Edit)
    if (productForm) {
      productForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const editId = editProductIdInput.value;
        const name = document.getElementById('prodFormName').value.trim();
        const category = document.getElementById('prodFormCategory').value;
        const price = parseInt(document.getElementById('prodFormPrice').value);
        const spiceLevel = parseInt(document.getElementById('prodFormSpice').value);
        const cookingStyle = document.getElementById('prodFormStyle').value;
        const badge = document.getElementById('prodFormBadge').value.trim();
        const image = document.getElementById('prodFormImage').value.trim();
        const description = document.getElementById('prodFormDesc').value.trim();

        if (editId) {
          // Edit existing
          const index = state.products.findIndex(p => p.id === editId);
          if (index > -1) {
            state.products[index] = {
              ...state.products[index],
              name,
              category,
              price,
              formattedPrice: `IDR ${price.toLocaleString()}`,
              spiceLevel,
              cookingStyle,
              badge: badge || null,
              image,
              description
            };
            showToast(`Product "${name}" updated successfully! ✏️`, 'success');
          }
        } else {
          // Add new
          const newProd = {
            id: 'prod-' + Date.now(),
            name,
            category,
            price,
            formattedPrice: `IDR ${price.toLocaleString()}`,
            spiceLevel,
            isCooked: true,
            cookingStyle,
            badge: badge || 'New',
            image,
            description,
            ingredients: ['Fresh Ingredients', 'INDUSHI Glaze']
          };
          state.products.unshift(newProd);
          showToast(`New sushi roll "${name}" added to live menu! 🍣`, 'success');
        }

        saveProducts();
        renderProducts(); // Updates main website live!
        renderAdminProducts();
        renderAdminOverview();
        productFormModal.classList.remove('active');
      });
    }

    // Settings Submit Triggers
    if (saveBannerSettingsBtn) {
      saveBannerSettingsBtn.addEventListener('click', () => {
        state.siteSettings.showAnnouncement = toggleAnnouncementBar.checked;
        state.siteSettings.announcementText = announcementTextEdit.value.trim();
        saveSettings();
        initAnnouncementBar();
        showToast('Top Site Announcement Banner updated! 📢', 'success');
      });
    }

    if (saveStoreStatusBtn) {
      saveStoreStatusBtn.addEventListener('click', () => {
        state.siteSettings.isStoreOpen = toggleStoreOpen.checked;
        saveSettings();
        showToast(`Store Operational Status saved (${toggleStoreOpen.checked ? 'OPEN' : 'CLOSED'})! 🏪`, 'success');
      });
    }

    // Reset Factory Default
    if (resetDataDefaultBtn) {
      resetDataDefaultBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all site products, orders, and settings back to factory defaults?')) {
          localStorage.removeItem('indushi_products');
          localStorage.removeItem('indushi_orders');
          localStorage.removeItem('indushi_bookings');
          localStorage.removeItem('indushi_settings');
          localStorage.removeItem('indushi_registered_user_list');

          state.registeredUserList = [
            {
              uid: 'seed-admin-01',
              name: 'Master Admin',
              email: 'admin@indushi.id',
              role: 'admin',
              status: 'active',
              createdAt: '2026-09-01 10:00'
            },
            {
              uid: 'seed-user-01',
              name: 'Sebastian Jefferson',
              email: 'user@indushi.id',
              role: 'customer',
              status: 'active',
              createdAt: '2026-09-02 12:00'
            }
          ];

          state.products = INITIAL_PRODUCTS;
          state.orders = [
            {
              id: 'ORD-1001',
              customer: 'Reza Rahardian',
              phone: '081299887766',
              address: 'Jl. Senopati No. 42, Jakarta Selatan',
              items: '1x Rendang Aburi Supreme Roll, 1x Es Cendol Matcha',
              total: 100000,
              paymentMethod: 'QRIS',
              status: 'Delivered',
              createdAt: '2026-09-04 14:30'
            }
          ];
          state.bookings = [];
          state.siteSettings = {
            showAnnouncement: true,
            announcementText: 'Get 20% OFF on all Signature Rolls with code INDUSHIFUSION20!',
            isStoreOpen: true
          };

          renderProducts();
          initAnnouncementBar();
          renderAdminOverview();
          renderAdminProducts();
          renderAdminOrders();
          renderAdminBookings();
          renderAdminUsers();
          loadAdminSettingsUI();

          showToast('All site data has been reset to factory defaults! 🔄', 'info');
        }
      });
    }
  }

  // --- RENDER ADMIN TAB 1: OVERVIEW KPIs ---
  function renderAdminOverview() {
    const totalRev = state.orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const pendingOrders = state.orders.filter(o => o.status === 'Pending').length;
    const confirmedBookings = state.bookings.filter(b => b.status === 'Confirmed').length;
    const pendingUsers = state.registeredUserList.filter(u => u.role !== 'admin' && u.status === 'pending').length;

    document.getElementById('kpiRevenue').textContent = `IDR ${totalRev.toLocaleString()}`;
    document.getElementById('kpiOrdersCount').textContent = state.orders.length;
    document.getElementById('kpiOrdersPending').textContent = `${pendingOrders} Pending Dispatch`;
    document.getElementById('kpiProductsCount').textContent = state.products.length;
    document.getElementById('kpiBookingsCount').textContent = state.bookings.length;
    document.getElementById('kpiBookingsConfirmed').textContent = `${confirmedBookings} Confirmed Seats`;

    document.getElementById('adminOrdersBadge').textContent = pendingOrders;
    document.getElementById('adminBookingsBadge').textContent = confirmedBookings;
    
    const adminUsersBadge = document.getElementById('adminUsersBadge');
    if (adminUsersBadge) adminUsersBadge.textContent = pendingUsers;

    // Recent 5 Orders
    const recentOrders = state.orders.slice(0, 5);
    const overviewRecentOrders = document.getElementById('overviewRecentOrders');
    if (recentOrders.length === 0) {
      overviewRecentOrders.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No recent orders</td></tr>`;
    } else {
      overviewRecentOrders.innerHTML = recentOrders.map(o => `
        <tr>
          <td><strong>${o.customer}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${o.id}</span></td>
          <td>IDR ${(o.total || 0).toLocaleString()}</td>
          <td><span class="badge-status ${getBadgeStatusClass(o.status)}">${o.status}</span></td>
        </tr>
      `).join('');
    }

    // Recent 5 Bookings
    const recentBookings = state.bookings.slice(0, 5);
    const overviewRecentBookings = document.getElementById('overviewRecentBookings');
    if (recentBookings.length === 0) {
      overviewRecentBookings.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No upcoming bookings</td></tr>`;
    } else {
      overviewRecentBookings.innerHTML = recentBookings.map(b => `
        <tr>
          <td><strong>${b.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${b.id}</span></td>
          <td>${b.date} • ${b.time}</td>
          <td>${b.pax}</td>
        </tr>
      `).join('');
    }
  }

  // --- RENDER ADMIN TAB 5: USER VERIFICATIONS ---
  function renderAdminUsers() {
    const adminUsersTableBody = document.getElementById('adminUsersTableBody');
    const usersTotalCount = document.getElementById('usersTotalCount');

    if (!adminUsersTableBody) return;

    if (usersTotalCount) {
      usersTotalCount.textContent = `${state.registeredUserList.length} Registered Accounts`;
    }

    const pendingCount = state.registeredUserList.filter(u => u.role !== 'admin' && u.status === 'pending').length;
    const adminUsersBadge = document.getElementById('adminUsersBadge');
    if (adminUsersBadge) adminUsersBadge.textContent = pendingCount;

    if (state.registeredUserList.length === 0) {
      adminUsersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No user registration records found.</td></tr>`;
      return;
    }

    adminUsersTableBody.innerHTML = state.registeredUserList.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td><span style="text-transform:uppercase; font-size:0.75rem; font-weight:800; padding:0.15rem 0.5rem; border-radius:4px; background:${u.role === 'admin' ? 'rgba(232,80,29,0.2)' : 'rgba(255,255,255,0.08)'}; color:${u.role === 'admin' ? 'var(--primary-accent)' : '#fff'};">${u.role}</span></td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${u.createdAt || 'N/A'}</td>
        <td>
          ${u.role === 'admin' ? '<span class="badge-status badge-cooking">Admin</span>' :
            (u.status === 'active' ? '<span class="badge-status badge-delivered"><i class="fa-solid fa-circle-check"></i> Verified</span>' :
            '<span class="badge-status badge-pending"><i class="fa-solid fa-hourglass-half"></i> Pending Approval</span>')}
        </td>
        <td>
          ${u.role === 'admin' ? '<span style="font-size:0.75rem; color:var(--text-muted);">Protected Master</span>' : `
            <div style="display:flex; gap:0.4rem;">
              ${u.status !== 'active' ? `
                <button class="btn btn-approve-user" data-id="${u.uid}" data-email="${u.email}" style="padding:0.3rem 0.7rem; font-size:0.75rem; background:#2ecc71; color:#fff; border-radius:var(--radius-full);">
                  <i class="fa-solid fa-check"></i> Approve
                </button>
              ` : ''}
              <button class="btn btn-reject-user" data-id="${u.uid}" data-email="${u.email}" style="padding:0.3rem 0.7rem; font-size:0.75rem; background:rgba(231, 76, 60, 0.2); color:#e74c3c; border-radius:var(--radius-full);" title="${u.status === 'pending' ? 'Reject & Delete Account' : 'Revoke & Delete Account'}">
                <i class="fa-solid fa-trash"></i> ${u.status === 'pending' ? 'Reject' : 'Delete'}
              </button>
            </div>
          `}
        </td>
      </tr>
    `).join('');

    // Approve user listener
    adminUsersTableBody.querySelectorAll('.btn-approve-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.getAttribute('data-id');
        const email = btn.getAttribute('data-email');
        const targetUser = state.registeredUserList.find(u => u.uid === uid || u.email === email);

        if (targetUser) {
          targetUser.status = 'active';
          saveRegisteredUserList();

          // Sync status to Firestore
          try {
            await setDoc(doc(db, "users", uid), { status: 'active' }, { merge: true });
          } catch (e) {
            console.warn("Firestore status approve update note:", e);
          }

          renderAdminUsers();
          renderAdminOverview();
          showToast(`User ${email} approved! Account is now active. ✅`, 'success');
        }
      });
    });

    // Reject / Delete user listener
    adminUsersTableBody.querySelectorAll('.btn-reject-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.getAttribute('data-id');
        const email = btn.getAttribute('data-email');

        if (confirm(`Are you sure you want to reject/delete registration for ${email}? This frees up storage and prevents spam.`)) {
          state.registeredUserList = state.registeredUserList.filter(u => u.uid !== uid && u.email !== email);
          saveRegisteredUserList();

          // Delete/reject status in Firestore
          try {
            await setDoc(doc(db, "users", uid), { status: 'rejected' }, { merge: true });
          } catch (e) {
            console.warn("Firestore user reject note:", e);
          }

          renderAdminUsers();
          renderAdminOverview();
          showToast(`Account for ${email} deleted to prevent storage waste. 🗑️`, 'info');
        }
      });
    });
  }

  function getBadgeStatusClass(status) {
    if (status === 'Pending') return 'badge-pending';
    if (status === 'Cooking' || status === 'Confirmed') return 'badge-cooking';
    if (status === 'Delivered' || status === 'Seated') return 'badge-delivered';
    return 'badge-cancelled';
  }

  // --- RENDER ADMIN TAB 2: PRODUCTS MANAGER ---
  function renderAdminProducts() {
    const searchTerm = adminProductSearch ? adminProductSearch.value.toLowerCase() : '';
    const catFilter = adminCategoryFilter ? adminCategoryFilter.value : 'all';

    let filtered = state.products;

    if (catFilter !== 'all') {
      filtered = filtered.filter(p => p.category === catFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm));
    }

    if (filtered.length === 0) {
      adminProductsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No menu products found. Click "Add New Sushi Item" to create one!
          </td>
        </tr>
      `;
      return;
    }

    adminProductsTableBody.innerHTML = filtered.map(p => `
      <tr>
        <td><img src="${p.image}" alt="${p.name}" class="table-img"></td>
        <td>
          <strong>${p.name}</strong>
          ${p.badge ? `<span style="font-size:0.7rem; background:rgba(232,80,29,0.2); color:var(--secondary-accent); padding:0.1rem 0.4rem; border-radius:4px; margin-left:0.4rem;">${p.badge}</span>` : ''}
        </td>
        <td style="text-transform:capitalize;">${p.category}</td>
        <td style="font-weight:700; color:var(--secondary-accent);">IDR ${(p.price || 0).toLocaleString()}</td>
        <td>${'🔥'.repeat(p.spiceLevel || 0)} (${p.spiceLevel}/5)</td>
        <td>${p.cookingStyle || 'Cooked'}</td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-secondary btn-edit-prod" data-id="${p.id}" style="padding:0.4rem 0.8rem; font-size:0.75rem;">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="btn btn-del-prod" data-id="${p.id}" style="padding:0.4rem 0.8rem; font-size:0.75rem; background:#e74c3c; color:#fff; border-radius:var(--radius-full);">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach Edit Listeners
    adminProductsTableBody.querySelectorAll('.btn-edit-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = state.products.find(p => p.id === id);
        if (!prod) return;

        editProductIdInput.value = prod.id;
        document.getElementById('prodFormName').value = prod.name;
        document.getElementById('prodFormCategory').value = prod.category;
        document.getElementById('prodFormPrice').value = prod.price;
        document.getElementById('prodFormSpice').value = prod.spiceLevel || 0;
        document.getElementById('prodFormStyle').value = prod.cookingStyle || '100% Cooked';
        document.getElementById('prodFormBadge').value = prod.badge || '';
        document.getElementById('prodFormImage').value = prod.image;
        document.getElementById('prodFormDesc').value = prod.description;

        productModalHeading.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color:var(--primary-accent);"></i> Edit Sushi Item`;
        productFormModal.classList.add('active');
      });
    });

    // Attach Delete Listeners
    adminProductsTableBody.querySelectorAll('.btn-del-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = state.products.find(p => p.id === id);
        if (!prod) return;

        if (confirm(`Are you sure you want to delete "${prod.name}" from the website menu?`)) {
          state.products = state.products.filter(p => p.id !== id);
          saveProducts();
          renderProducts(); // Updates main site!
          renderAdminProducts();
          renderAdminOverview();
          showToast(`Deleted "${prod.name}" from menu.`, 'info');
        }
      });
    });
  }

  // --- RENDER ADMIN TAB 3: ORDERS DISPATCH ---
  function renderAdminOrders() {
    const adminOrdersTableBody = document.getElementById('adminOrdersTableBody');
    const ordersTotalCount = document.getElementById('ordersTotalCount');

    ordersTotalCount.textContent = `${state.orders.length} Total Orders`;

    if (state.orders.length === 0) {
      adminOrdersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No customer orders yet.</td></tr>`;
      return;
    }

    adminOrdersTableBody.innerHTML = state.orders.map(o => `
      <tr>
        <td><strong>${o.id}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${o.createdAt}</span></td>
        <td>
          <strong>${o.customer}</strong><br>
          <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${o.phone}</span><br>
          <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${o.address}</span>
        </td>
        <td style="max-width:220px; font-size:0.8rem;">${o.items}</td>
        <td style="font-weight:700; color:var(--secondary-accent);">IDR ${(o.total || 0).toLocaleString()}</td>
        <td><span style="font-weight:700; font-size:0.8rem; background:rgba(255,255,255,0.08); padding:0.2rem 0.6rem; border-radius:4px;">${o.paymentMethod}</span></td>
        <td>
          <select class="admin-select order-status-select" data-id="${o.id}">
            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Cooking" ${o.status === 'Cooking' ? 'selected' : ''}>Cooking / Prep</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn btn-del-order" data-id="${o.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:rgba(231, 76, 60, 0.2); color:#e74c3c; border-radius:var(--radius-full);">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Attach Status Select Listener
    adminOrdersTableBody.querySelectorAll('.order-status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const id = select.getAttribute('data-id');
        const newStatus = e.target.value;
        const order = state.orders.find(o => o.id === id);
        if (order) {
          order.status = newStatus;
          saveOrders();
          renderAdminOverview();
          showToast(`Order ${id} status updated to ${newStatus}! 📦`, 'success');
        }
      });
    });

    // Delete Order Listener
    adminOrdersTableBody.querySelectorAll('.btn-del-order').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Delete record for Order ${id}?`)) {
          state.orders = state.orders.filter(o => o.id !== id);
          saveOrders();
          renderAdminOrders();
          renderAdminOverview();
          showToast(`Order ${id} deleted.`, 'info');
        }
      });
    });
  }

  // --- RENDER ADMIN TAB 4: TABLE BOOKINGS ---
  function renderAdminBookings() {
    const adminBookingsTableBody = document.getElementById('adminBookingsTableBody');
    const bookingsTotalCount = document.getElementById('bookingsTotalCount');

    bookingsTotalCount.textContent = `${state.bookings.length} Total Bookings`;

    if (state.bookings.length === 0) {
      adminBookingsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No table reservations yet.</td></tr>`;
      return;
    }

    adminBookingsTableBody.innerHTML = state.bookings.map(b => `
      <tr>
        <td><strong>${b.id}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${b.createdAt}</span></td>
        <td>
          <strong>${b.name}</strong><br>
          <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-envelope"></i> ${b.email}</span>
        </td>
        <td>${b.date}</td>
        <td>${b.time}</td>
        <td><span style="font-weight:700;">${b.pax}</span></td>
        <td>
          <select class="admin-select booking-status-select" data-id="${b.id}">
            <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Seated" ${b.status === 'Seated' ? 'selected' : ''}>Guest Seated</option>
            <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn btn-del-booking" data-id="${b.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:rgba(231, 76, 60, 0.2); color:#e74c3c; border-radius:var(--radius-full);">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    adminBookingsTableBody.querySelectorAll('.booking-status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const id = select.getAttribute('data-id');
        const newStatus = e.target.value;
        const booking = state.bookings.find(b => b.id === id);
        if (booking) {
          booking.status = newStatus;
          saveBookings();
          renderAdminOverview();
          showToast(`Reservation ${id} updated to ${newStatus}! 🍽️`, 'success');
        }
      });
    });

    adminBookingsTableBody.querySelectorAll('.btn-del-booking').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Delete reservation record ${id}?`)) {
          state.bookings = state.bookings.filter(b => b.id !== id);
          saveBookings();
          renderAdminBookings();
          renderAdminOverview();
          showToast(`Reservation ${id} deleted.`, 'info');
        }
      });
    });
  }

  // --- RENDER ADMIN TAB 5: SITE SETTINGS ---
  function loadAdminSettingsUI() {
    if (toggleAnnouncementBar) toggleAnnouncementBar.checked = state.siteSettings.showAnnouncement;
    if (announcementTextEdit) announcementTextEdit.value = state.siteSettings.announcementText;
    if (toggleStoreOpen) toggleStoreOpen.checked = state.siteSettings.isStoreOpen;
  }

  // --- TOAST UTILITY ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check" style="color:#2ecc71;"></i>' : '<i class="fa-solid fa-circle-info" style="color:var(--primary-accent);"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

});
