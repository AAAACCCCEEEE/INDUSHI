// INDUSHI Application Controller & Admin Control System
import { INDUSHI_DATA } from './data.js';
import { router, ROUTES } from './router.js';
import { app as firebaseApp, auth, db, analytics } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  deleteDoc 
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
        Verified: true,
        Created_at: { date: '2026-09-01', timestamp: 1788220800000 },
        createdAt: '2026-09-01 10:00'
      },
      {
        uid: 'seed-user-01',
        name: 'Sebastian Jefferson',
        email: 'user@indushi.id',
        role: 'customer',
        status: 'active',
        Verified: true,
        Created_at: { date: '2026-09-02', timestamp: 1788314400000 },
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
    
    // QA & Bug Tracker State
    qaReports: JSON.parse(localStorage.getItem('indushi_qa_reports')) || [
      {
        id: 'QA-001',
        topic: 'Checkout button unresponsive on mobile Safari iOS',
        priority: 'Critical',
        username: 'Sebastian Jefferson',
        proof: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600&auto=format&fit=crop&q=80',
        status: 'In Progress',
        fixAttempts: 2,
        description: 'When tapping the "Proceed to Checkout" button on iPhone 13 running Safari, the button stays in depressed state and does not trigger payment confirmation modal. Console throws touch listener timeout.',
        createdAt: '2026-09-08 14:10'
      },
      {
        id: 'QA-002',
        topic: 'Custom Sushi builder spice slider snaps back to 0',
        priority: 'Medium',
        username: 'Budi Santoso',
        proof: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
        status: 'Solved',
        fixAttempts: 1,
        description: 'Adjusting the spice slider in Custom Roll Builder resets back to level 0 whenever Rendang Aburi is selected as the primary topping.',
        createdAt: '2026-09-09 11:25'
      },
      {
        id: 'QA-003',
        topic: 'Table reservation date picker allows past booking dates',
        priority: 'High',
        username: 'Citra Kirana',
        proof: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
        status: 'New',
        fixAttempts: 0,
        description: 'The reservation calendar input does not set min attribute to today, allowing users to pick yesterday and submit invalid reservations.',
        createdAt: '2026-09-11 16:45'
      }
    ],

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
  function saveQaReports() {
    localStorage.setItem('indushi_qa_reports', JSON.stringify(state.qaReports));
  }
  function saveUser() {
    if (state.user) {
      localStorage.setItem('indushi_user', JSON.stringify(state.user));
    }
  }

  // --- REAL-TIME FIRESTORE MULTI-ADMIN CLOUD SYNC ---
  function initFirestoreRealtimeSync() {
    try {
      // 1. Real-time Products Sync
      onSnapshot(collection(db, "products"), (snapshot) => {
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach(docSnap => {
            items.push({ id: docSnap.id, ...docSnap.data() });
          });
          state.products = items;
          saveProducts();
          renderProducts();
          if (adminDashboardModal && adminDashboardModal.classList.contains('active')) {
            renderAdminProducts();
            renderAdminOverview();
          }
        } else {
          // Seed products to Cloud Firestore if empty
          INITIAL_PRODUCTS.forEach(async (p) => {
            try {
              await setDoc(doc(db, "products", p.id), p);
            } catch (e) {}
          });
        }
      }, (err) => console.warn("Firestore products sync note:", err));

      // 2. Real-time Customer Orders Sync across all Admins
      onSnapshot(collection(db, "orders"), (snapshot) => {
        if (!snapshot.empty) {
          const orderList = [];
          snapshot.forEach(docSnap => {
            orderList.push({ id: docSnap.id, ...docSnap.data() });
          });
          orderList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          state.orders = orderList;
          saveOrders();
          if (adminDashboardModal && adminDashboardModal.classList.contains('active')) {
            renderAdminOrders();
            renderAdminOverview();
          }
        }
      }, (err) => console.warn("Firestore orders sync note:", err));

      // 3. Real-time Table Reservations Sync
      onSnapshot(collection(db, "bookings"), (snapshot) => {
        if (!snapshot.empty) {
          const bookingList = [];
          snapshot.forEach(docSnap => {
            bookingList.push({ id: docSnap.id, ...docSnap.data() });
          });
          bookingList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          state.bookings = bookingList;
          saveBookings();
          if (adminDashboardModal && adminDashboardModal.classList.contains('active')) {
            renderAdminBookings();
            renderAdminOverview();
          }
        }
      }, (err) => console.warn("Firestore bookings sync note:", err));

      // 4. Real-time Registered User Accounts Sync
      onSnapshot(collection(db, "users"), (snapshot) => {
        if (!snapshot.empty) {
          const userList = [];
          snapshot.forEach(docSnap => {
            userList.push({ uid: docSnap.id, ...docSnap.data() });
          });
          if (!userList.some(u => u.email.toLowerCase() === 'admin@indushi.id')) {
            userList.unshift({
              uid: 'seed-admin-01',
              name: 'Master Admin',
              email: 'admin@indushi.id',
              role: 'admin',
              status: 'active',
              Verified: true,
              Created_at: { date: '2026-09-01', timestamp: 1788220800000 },
              createdAt: '2026-09-01 10:00'
            });
          }
          state.registeredUserList = userList;
          saveRegisteredUserList();
          if (adminDashboardModal && adminDashboardModal.classList.contains('active')) {
            renderAdminUsers();
            renderAdminOverview();
          }
        }
      }, (err) => console.warn("Firestore users sync note:", err));

      // 5. Real-time Site Settings Sync
      onSnapshot(doc(db, "settings", "site"), (docSnap) => {
        if (docSnap.exists()) {
          state.siteSettings = docSnap.data();
          saveSettings();
          initAnnouncementBar();
        }
      }, (err) => console.warn("Firestore settings sync note:", err));

      // 6. Real-time QA & Bug Reports Sync across all Admins & Users
      onSnapshot(collection(db, "qa_reports"), (snapshot) => {
        if (!snapshot.empty) {
          const reports = [];
          snapshot.forEach(docSnap => {
            reports.push({ id: docSnap.id, ...docSnap.data() });
          });
          // Sort chronologically ascending: QA-001, QA-002, QA-003...
          reports.sort((a, b) => {
            const numA = parseInt((a.id || '').replace(/\D/g, '')) || 0;
            const numB = parseInt((b.id || '').replace(/\D/g, '')) || 0;
            return numA - numB;
          });
          state.qaReports = reports;
          saveQaReports();
          renderPublicQa();
          if (adminDashboardModal && adminDashboardModal.classList.contains('active')) {
            renderAdminQa();
            renderAdminOverview();
          }
        } else {
          // Seed initial default reports to Firestore if collection is empty
          state.qaReports.forEach(async (r) => {
            try {
              await setDoc(doc(db, "qa_reports", r.id), r);
            } catch (e) {}
          });
        }
      }, (err) => console.warn("Firestore QA reports sync note:", err));
    } catch (err) {
      console.warn("Firestore realtime init note:", err);
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

  // Routes Navigator Elements
  const routesModal = document.getElementById('routesModal');
  const closeRoutesModalBtn = document.getElementById('closeRoutesModalBtn');
  const routesSearchInput = document.getElementById('routesSearchInput');
  const routesModalList = document.getElementById('routesModalList');
  const openRoutesModalNavBtn = document.getElementById('openRoutesModalNavBtn');
  const adminOpenRoutesBtn = document.getElementById('adminOpenRoutesBtn');
  const adminRouteBadge = document.getElementById('adminRouteBadge');

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
  initRoutesModal();
  updateCartUI();
  updateUserNavUI();
  initFirestoreRealtimeSync();
  initQaSystem();
  initRouterSystem();

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
        router.navigate('/login');
      });
    }

    if (closeAuthBtn) {
      closeAuthBtn.addEventListener('click', () => {
        router.navigate('/home');
      });
    }

    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) router.navigate('/home');
      });
    }

    // Auth Tab Switches
    if (tabLoginBtn && tabRegisterBtn) {
      tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        if (window.location.hash !== '#/login') {
          history.replaceState(null, '', '#/login');
        }
      });

      tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        if (window.location.hash !== '#/register') {
          history.replaceState(null, '', '#/register');
        }
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
          await signOut(auth);
          state.user = null;
          saveUser();
          updateUserNavUI();
          showToast('⏳ Account pending Admin verification! Please wait for an Admin to approve your account in the Admin Panel before logging in.', 'error');
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
          const redirect = sessionStorage.getItem('indushi_auth_redirect') || '/admin/overview';
          sessionStorage.removeItem('indushi_auth_redirect');
          setTimeout(() => {
            router.navigate(redirect);
          }, 300);
        } else {
          showToast(`Welcome back, ${name}! Logged in successfully. 👋`, 'success');
          router.navigate('/home');
        }
      });
    }

    // Register Form Submit -> Firebase Auth Create User (Role: customer, status: pending)
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

          // Always set role as customer and status as pending for new accounts!
          const role = 'customer';
          const status = 'pending';
          const isVerified = false;
          const now = new Date();
          const formattedCreatedAt = now.toISOString().replace('T', ' ').substring(0, 16);
          const dateStr = now.toISOString().split('T')[0];

          // Document data with uid, customer role, Verified, and Created_at object
          const userDocData = {
            uid: fbUser.uid,
            email: email,
            name: name,
            role: role,
            status: status,
            Verified: isVerified,
            verified: isVerified,
            Created_at: {
              date: dateStr,
              timestamp: now.getTime()
            },
            createdAt: formattedCreatedAt
          };

          // Save user profile directly to Firestore under document ID "users/{fbUser.uid}"
          try {
            await setDoc(doc(db, "users", fbUser.uid), userDocData);
            console.log("Firestore document stored successfully for UID:", fbUser.uid, userDocData);
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
            Verified: isVerified,
            Created_at: {
              date: dateStr,
              timestamp: now.getTime()
            },
            createdAt: formattedCreatedAt
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
          showToast(`🎉 Registration request submitted! UID: ${fbUser.uid.substring(0, 8)}... Pending Admin approval.`, 'success');
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
    router.navigate('/home');
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
        document.getElementById('openAdminNavBtn').addEventListener('click', () => {
          router.navigate('/admin/overview');
        });
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
        router.navigate('/login');
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
        if (href && (href.startsWith('#') || href.startsWith('/'))) {
          e.preventDefault();
          router.navigate(href);
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
    if (openCartBtn) openCartBtn.addEventListener('click', () => router.navigate('/cart'));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => router.navigate('/home'));
    if (cartOverlay) {
      cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) router.navigate('/home');
      });
    }

    if (proceedCheckoutBtn) {
      proceedCheckoutBtn.addEventListener('click', () => {
        if (state.cart.length === 0) {
          showToast('Your order cart is empty!', 'error');
          return;
        }
        router.navigate('/checkout');
      });
    }

    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', () => router.navigate('/cart'));
    if (checkoutModal) {
      checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) router.navigate('/home');
      });
    }

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
    if (checkoutForm) {
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
        try {
          setDoc(doc(db, "orders", newOrder.id), newOrder);
        } catch (err) {
          console.warn("Firestore order save note:", err);
        }

        checkoutModal.classList.remove('active');
        state.cart = [];
        saveCart();
        updateCartUI();

        if (adminDashboardModal.classList.contains('active')) {
          renderAdminOverview();
          renderAdminOrders();
        }

        router.navigate('/home');
        showToast(`🎉 Thank you ${custName}! Order ${newOrder.id} confirmed. Dispatching courier...`, 'success');
      });
    }

    // Booking Table Modal Submit -> Saves Booking to Admin State & Firestore!
    const openBooking = () => router.navigate('/book-table');
    const closeBooking = () => router.navigate('/home');

    if (bookTableNavBtn) bookTableNavBtn.addEventListener('click', openBooking);
    if (heroBookBtn2) heroBookBtn2.addEventListener('click', openBooking);
    if (closeBookingBtn) closeBookingBtn.addEventListener('click', closeBooking);
    if (bookingModal) {
      bookingModal.addEventListener('click', (e) => {
        if (e.target === bookingModal) closeBooking();
      });
    }

    if (bookingForm) {
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
        try {
          setDoc(doc(db, "bookings", newBooking.id), newBooking);
        } catch (err) {
          console.warn("Firestore booking save note:", err);
        }

        closeBooking();

        if (adminDashboardModal.classList.contains('active')) {
          renderAdminOverview();
          renderAdminBookings();
        }

        showToast(`Table Reserved for ${name} on ${date} at ${time}! 🍽️`, 'success');
      });
    }
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
  function switchAdminTab(targetTab = 'overview') {
    document.querySelectorAll('[data-admin-tab]').forEach(i => {
      if (i.getAttribute('data-admin-tab') === targetTab) {
        i.classList.add('active');
      } else {
        i.classList.remove('active');
      }
    });

    document.querySelectorAll('.admin-tab-content').forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
    });

    const activeContent = document.getElementById(`tab-admin-${targetTab}`);
    if (activeContent) {
      activeContent.classList.add('active');
      activeContent.style.display = 'block';
    }

    const titleMap = {
      overview: { title: 'Dashboard Overview', sub: 'Real-time store metrics and control center.' },
      products: { title: 'Menu & Products Manager', sub: 'Direct live control over sushi items displayed on the website.' },
      orders: { title: 'Customer Orders Dispatch', sub: 'Manage live checkout orders and delivery status.' },
      bookings: { title: 'Table Reservations Manager', sub: 'View and manage guest reservations at Senopati location.' },
      users: { title: 'User Accounts & Verification Manager', sub: 'Approve or reject customer account registration requests to prevent spam.' },
      settings: { title: 'Site Banner & Configuration', sub: 'Manage top announcement banner and store operational status.' },
      qa: { title: 'QA & Bug Tracker Manager', sub: 'Triage reported glitches, review annotated screenshots, and manage bug fix iterations.' }
    };

    if (titleMap[targetTab]) {
      if (adminTabTitle) adminTabTitle.textContent = titleMap[targetTab].title;
      if (adminTabSubtitle) adminTabSubtitle.textContent = titleMap[targetTab].sub;
    }

    const adminRoutePathText = document.getElementById('adminRoutePathText');
    if (adminRoutePathText) {
      adminRoutePathText.textContent = `#/admin/${targetTab}`;
    }

    if (targetTab === 'overview') renderAdminOverview();
    if (targetTab === 'products') renderAdminProducts();
    if (targetTab === 'orders') renderAdminOrders();
    if (targetTab === 'bookings') renderAdminBookings();
    if (targetTab === 'users') renderAdminUsers();
    if (targetTab === 'settings') loadAdminSettingsUI();
    if (targetTab === 'qa' && typeof renderAdminQa === 'function') renderAdminQa();
  }

  function openAdminDashboard(targetTab = 'overview') {
    if (!state.user || state.user.role !== 'admin') {
      showToast('Admin privilege required to access Dashboard!', 'error');
      sessionStorage.setItem('indushi_auth_redirect', `/admin/${targetTab}`);
      router.navigate('/login');
      return;
    }

    if (adminDashboardModal) adminDashboardModal.classList.add('active');
    if (adminLoggedName && state.user) adminLoggedName.textContent = state.user.name;

    switchAdminTab(targetTab);
  }

  function initAdminDashboard() {
    if (closeAdminDashboardBtn) {
      closeAdminDashboardBtn.addEventListener('click', () => {
        router.navigate('/home');
      });
    }

    if (viewLiveSiteBtn) {
      viewLiveSiteBtn.addEventListener('click', () => {
        router.navigate('/home');
      });
    }

    // Sidebar Tab Switches via Delegation
    const adminNav = document.querySelector('.admin-nav');
    if (adminNav) {
      adminNav.addEventListener('click', (e) => {
        const item = e.target.closest('[data-admin-tab]');
        if (!item) return;

        const targetTab = item.getAttribute('data-admin-tab');
        router.navigate(`/admin/${targetTab}`);
      });
    }

    // Route Badge Copy Listener
    if (adminRouteBadge) {
      adminRouteBadge.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('Admin route URL copied to clipboard! 📋', 'success');
      });
    }

    // Admin Open Routes Button
    if (adminOpenRoutesBtn) {
      adminOpenRoutesBtn.addEventListener('click', () => {
        router.navigate('/routes');
      });
    }

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
        const targetProd = editId ? state.products.find(p => p.id === editId) : state.products[0];
        if (targetProd) {
          try {
            setDoc(doc(db, "products", targetProd.id), targetProd);
          } catch (e) {
            console.warn("Firestore product save note:", e);
          }
        }
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
        try {
          setDoc(doc(db, "settings", "site"), state.siteSettings, { merge: true });
        } catch (e) {
          console.warn("Firestore settings update note:", e);
        }
        initAnnouncementBar();
        showToast('Top Site Announcement Banner updated! 📢', 'success');
      });
    }

    if (saveStoreStatusBtn) {
      saveStoreStatusBtn.addEventListener('click', () => {
        state.siteSettings.isStoreOpen = toggleStoreOpen.checked;
        saveSettings();
        try {
          setDoc(doc(db, "settings", "site"), state.siteSettings, { merge: true });
        } catch (e) {
          console.warn("Firestore settings update note:", e);
        }
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

    const adminQaBadge = document.getElementById('adminQaBadge');
    if (adminQaBadge) {
      const openBugs = state.qaReports.filter(r => r.status !== 'Solved').length;
      adminQaBadge.textContent = openBugs;
    }

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
          targetUser.Verified = true;
          targetUser.verified = true;
          saveRegisteredUserList();

          // Sync status and Verified to Firestore
          try {
            await setDoc(doc(db, "users", uid), {
              status: 'active',
              Verified: true,
              verified: true
            }, { merge: true });
          } catch (e) {
            console.warn("Firestore status approve update note:", e);
          }

          renderAdminUsers();
          renderAdminOverview();
          showToast(`User ${email} approved! Account is now active & verified. ✅`, 'success');
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
          try {
            deleteDoc(doc(db, "products", id));
          } catch (e) {
            console.warn("Firestore product delete note:", e);
          }
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
          try {
            setDoc(doc(db, "orders", id), { status: newStatus }, { merge: true });
          } catch (e) {
            console.warn("Firestore order status update note:", e);
          }
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
          try {
            deleteDoc(doc(db, "orders", id));
          } catch (e) {
            console.warn("Firestore order delete note:", e);
          }
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
          try {
            setDoc(doc(db, "bookings", id), { status: newStatus }, { merge: true });
          } catch (e) {
            console.warn("Firestore booking status update note:", e);
          }
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
          try {
            deleteDoc(doc(db, "bookings", id));
          } catch (e) {
            console.warn("Firestore booking delete note:", e);
          }
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

  // ==========================================================================
  // QA & BUG TRACKER SYSTEM (PUBLIC & ADMIN CONTROL)
  // ==========================================================================
  function initQaSystem() {
    const publicQaTableBody = document.getElementById('publicQaTableBody');
    const qaTotalReportsCount = document.getElementById('qaTotalReportsCount');
    const qaOpenReportsCount = document.getElementById('qaOpenReportsCount');
    const openQaModalBtn = document.getElementById('openQaModalBtn');
    const closeQaModalBtn = document.getElementById('closeQaModalBtn');
    const qaModal = document.getElementById('qaModal');
    const qaReportForm = document.getElementById('qaReportForm');

    // Canvas & Annotation studio elements
    const qaProofUrl = document.getElementById('qaProofUrl');
    const qaProofFile = document.getElementById('qaProofFile');
    const qaUseSampleImageBtn = document.getElementById('qaUseSampleImageBtn');
    const qaAnnotationStudio = document.getElementById('qaAnnotationStudio');
    const qaCanvas = document.getElementById('qaCanvas');
    const qaCanvasWrapper = document.getElementById('qaCanvasWrapper');
    const qaCanvasHint = document.getElementById('qaCanvasHint');
    const qaToolBox = document.getElementById('qaToolBox');
    const qaToolPen = document.getElementById('qaToolPen');
    const qaUndoBtn = document.getElementById('qaUndoBtn');
    const qaClearCanvasBtn = document.getElementById('qaClearCanvasBtn');
    const colorBtns = document.querySelectorAll('.qa-color-btn');

    // Lightbox Inspector elements
    const qaProofLightboxModal = document.getElementById('qaProofLightboxModal');
    const closeQaLightboxBtn = document.getElementById('closeQaLightboxBtn');
    const qaInspectCloseBtn = document.getElementById('qaInspectCloseBtn');

    // Admin QA elements
    const adminQaTableBody = document.getElementById('adminQaTableBody');
    const adminQaSearch = document.getElementById('adminQaSearch');
    const adminQaStatusFilter = document.getElementById('adminQaStatusFilter');
    const adminQaPriorityFilter = document.getElementById('adminQaPriorityFilter');
    const adminOpenQaModalBtn = document.getElementById('adminOpenQaModalBtn');

    // Canvas State
    let ctx = qaCanvas ? qaCanvas.getContext('2d') : null;
    let baseImg = null;
    let annotations = [];
    let activeTool = 'box'; // 'box' or 'pen'
    let activeColor = '#e74c3c';
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let currentPenPoints = [];

    // Helper: Hex to RGBA for highlight box
    function hexToRgba(hex, alpha) {
      let c = (hex || '#e74c3c').replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16) || 0;
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }

    // Helper: Canvas coordinates from event
    function getCanvasCoords(e) {
      if (!qaCanvas) return { x: 0, y: 0 };
      const rect = qaCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleX = qaCanvas.width / (rect.width || 1);
      const scaleY = qaCanvas.height / (rect.height || 1);
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    // Redraw Canvas (base image + annotations + in-progress shape)
    function redrawCanvas(currentPreview = null) {
      if (!ctx || !qaCanvas || !baseImg) return;
      ctx.clearRect(0, 0, qaCanvas.width, qaCanvas.height);
      ctx.drawImage(baseImg, 0, 0, qaCanvas.width, qaCanvas.height);

      // Draw stored annotations
      annotations.forEach(ann => {
        if (ann.type === 'box') {
          // Highlight translucent fill
          ctx.fillStyle = hexToRgba(ann.color, 0.28);
          ctx.fillRect(ann.x, ann.y, ann.w, ann.h);
          // Highlight sharp outline
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = 3;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);
          ctx.setLineDash([]);
        } else if (ann.type === 'pen' && ann.points && ann.points.length > 1) {
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          ctx.stroke();
        }
      });

      // Draw active preview shape during mouse drag
      if (currentPreview) {
        if (currentPreview.type === 'box') {
          ctx.fillStyle = hexToRgba(currentPreview.color, 0.28);
          ctx.fillRect(currentPreview.x, currentPreview.y, currentPreview.w, currentPreview.h);
          ctx.strokeStyle = currentPreview.color;
          ctx.lineWidth = 3;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(currentPreview.x, currentPreview.y, currentPreview.w, currentPreview.h);
          ctx.setLineDash([]);
        } else if (currentPreview.type === 'pen' && currentPreview.points && currentPreview.points.length > 1) {
          ctx.strokeStyle = currentPreview.color;
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(currentPreview.points[0].x, currentPreview.points[0].y);
          for (let i = 1; i < currentPreview.points.length; i++) {
            ctx.lineTo(currentPreview.points[i].x, currentPreview.points[i].y);
          }
          ctx.stroke();
        }
      }
    }

    // Load Image into Canvas Studio
    function loadImageIntoCanvas(imageSrc) {
      if (!qaCanvas || !ctx) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        baseImg = img;
        annotations = [];
        
        // Scale to fit canvas studio nicely (max width 600, max height 340)
        let w = img.width || 600;
        let h = img.height || 360;
        const maxW = 600;
        const maxH = 340;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        
        qaCanvas.width = Math.round(w * ratio);
        qaCanvas.height = Math.round(h * ratio);

        if (qaAnnotationStudio) qaAnnotationStudio.style.display = 'block';
        redrawCanvas();
        if (qaCanvasHint) {
          qaCanvasHint.innerHTML = `<i class="fa-solid fa-shapes"></i> Image ready! Drag on image to highlight glitch with <strong>${activeTool === 'box' ? 'Boxes' : 'Pen'}</strong>.`;
        }
      };
      img.onerror = () => {
        showToast("Could not load image. Please try another link or upload.", "error");
      };
      img.src = imageSrc;
    }

    // Canvas Mouse & Touch Interaction Listeners
    if (qaCanvas) {
      // Mouse Down
      qaCanvas.addEventListener('mousedown', (e) => {
        if (!baseImg) return;
        isDrawing = true;
        const coords = getCanvasCoords(e);
        startX = coords.x;
        startY = coords.y;
        if (activeTool === 'pen') {
          currentPenPoints = [{ x: startX, y: startY }];
        }
      });

      // Mouse Move
      qaCanvas.addEventListener('mousemove', (e) => {
        if (!isDrawing || !baseImg) return;
        const coords = getCanvasCoords(e);
        if (activeTool === 'box') {
          const preview = {
            type: 'box',
            x: Math.min(startX, coords.x),
            y: Math.min(startY, coords.y),
            w: Math.abs(coords.x - startX),
            h: Math.abs(coords.y - startY),
            color: activeColor
          };
          redrawCanvas(preview);
        } else if (activeTool === 'pen') {
          currentPenPoints.push(coords);
          redrawCanvas({
            type: 'pen',
            points: currentPenPoints,
            color: activeColor
          });
        }
      });

      // Mouse Up
      const finishDrawing = (e) => {
        if (!isDrawing || !baseImg) return;
        isDrawing = false;
        const coords = getCanvasCoords(e || { clientX: startX, clientY: startY });
        if (activeTool === 'box') {
          const w = Math.abs(coords.x - startX);
          const h = Math.abs(coords.y - startY);
          if (w > 5 && h > 5) {
            annotations.push({
              type: 'box',
              x: Math.min(startX, coords.x),
              y: Math.min(startY, coords.y),
              w: w,
              h: h,
              color: activeColor
            });
          }
        } else if (activeTool === 'pen' && currentPenPoints.length > 1) {
          annotations.push({
            type: 'pen',
            points: [...currentPenPoints],
            color: activeColor
          });
          currentPenPoints = [];
        }
        redrawCanvas();
      };

      qaCanvas.addEventListener('mouseup', finishDrawing);
      qaCanvas.addEventListener('mouseleave', () => {
        if (isDrawing) finishDrawing();
      });

      // Touch Events for Mobile / Tablet
      qaCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!baseImg) return;
        isDrawing = true;
        const coords = getCanvasCoords(e);
        startX = coords.x;
        startY = coords.y;
        if (activeTool === 'pen') {
          currentPenPoints = [{ x: startX, y: startY }];
        }
      });

      qaCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing || !baseImg) return;
        const coords = getCanvasCoords(e);
        if (activeTool === 'box') {
          const preview = {
            type: 'box',
            x: Math.min(startX, coords.x),
            y: Math.min(startY, coords.y),
            w: Math.abs(coords.x - startX),
            h: Math.abs(coords.y - startY),
            color: activeColor
          };
          redrawCanvas(preview);
        } else if (activeTool === 'pen') {
          currentPenPoints.push(coords);
          redrawCanvas({
            type: 'pen',
            points: currentPenPoints,
            color: activeColor
          });
        }
      });

      qaCanvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        finishDrawing(e);
      });
    }

    // Annotation Toolbar Controls
    if (qaToolBox) {
      qaToolBox.addEventListener('click', () => {
        activeTool = 'box';
        qaToolBox.classList.add('active');
        if (qaToolPen) qaToolPen.classList.remove('active');
      });
    }

    if (qaToolPen) {
      qaToolPen.addEventListener('click', () => {
        activeTool = 'pen';
        qaToolPen.classList.add('active');
        if (qaToolBox) qaToolBox.classList.remove('active');
      });
    }

    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeColor = btn.getAttribute('data-color') || '#e74c3c';
      });
    });

    if (qaUndoBtn) {
      qaUndoBtn.addEventListener('click', () => {
        if (annotations.length > 0) {
          annotations.pop();
          redrawCanvas();
        }
      });
    }

    if (qaClearCanvasBtn) {
      qaClearCanvasBtn.addEventListener('click', () => {
        annotations = [];
        redrawCanvas();
      });
    }

    // Image Input Listeners
    if (qaProofUrl) {
      qaProofUrl.addEventListener('change', () => {
        const url = qaProofUrl.value.trim();
        if (url) loadImageIntoCanvas(url);
      });
    }

    if (qaProofFile) {
      qaProofFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            loadImageIntoCanvas(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (qaUseSampleImageBtn) {
      qaUseSampleImageBtn.addEventListener('click', () => {
        const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
          <rect width="600" height="340" fill="#121212"/>
          <rect x="0" y="0" width="600" height="48" fill="#1e1e1e"/>
          <circle cx="24" cy="24" r="8" fill="#E8501D"/>
          <text x="44" y="29" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">INDUSHI - Checkout Bug Reproduction</text>
          <rect x="30" y="70" width="320" height="180" rx="8" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
          <text x="50" y="105" fill="#E8501D" font-family="sans-serif" font-size="15" font-weight="bold">1x Rendang Aburi Supreme Roll</text>
          <text x="50" y="130" fill="#888" font-family="sans-serif" font-size="12">Subtotal: IDR 55,000 • Senopati Kitchen</text>
          <rect x="50" y="170" width="280" height="44" rx="6" fill="#E8501D"/>
          <text x="110" y="198" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">Proceed to Checkout</text>
          <rect x="375" y="70" width="195" height="230" rx="8" fill="#181818" stroke="#2c2c2c"/>
          <text x="390" y="100" fill="#ff7675" font-family="sans-serif" font-size="12" font-weight="bold">🐞 Glitch Observation:</text>
          <text x="390" y="125" fill="#bbb" font-family="sans-serif" font-size="11">Clicking button does not open</text>
          <text x="390" y="145" fill="#bbb" font-family="sans-serif" font-size="11">QRIS payment modal on iOS.</text>
          <rect x="390" y="180" width="165" height="30" rx="4" fill="#252525"/>
          <text x="400" y="200" fill="#feca57" font-family="sans-serif" font-size="11">Error: touchstart timeout</text>
        </svg>`;
        const sampleUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sampleSvg)}`;
        loadImageIntoCanvas(sampleUrl);
      });
    }

    // Public Modal Open / Close
    if (openQaModalBtn) {
      openQaModalBtn.addEventListener('click', () => {
        if (state.user && document.getElementById('qaUsername')) {
          document.getElementById('qaUsername').value = state.user.name || '';
        }
        qaModal.classList.add('active');
      });
    }

    if (adminOpenQaModalBtn) {
      adminOpenQaModalBtn.addEventListener('click', () => {
        if (state.user && document.getElementById('qaUsername')) {
          document.getElementById('qaUsername').value = state.user.name || 'Master Admin';
        }
        qaModal.classList.add('active');
      });
    }

    if (closeQaModalBtn) {
      closeQaModalBtn.addEventListener('click', () => {
        qaModal.classList.remove('active');
      });
    }

    // Lightbox Inspector Close
    if (closeQaLightboxBtn) {
      closeQaLightboxBtn.addEventListener('click', () => {
        qaProofLightboxModal.classList.remove('active');
      });
    }
    if (qaInspectCloseBtn) {
      qaInspectCloseBtn.addEventListener('click', () => {
        qaProofLightboxModal.classList.remove('active');
      });
    }

    // Open Inspection Modal (Full screenshot + problem description)
    window.openQaInspectionModal = function(reportId) {
      const report = state.qaReports.find(r => r.id === reportId);
      if (!report) return;

      const img = document.getElementById('qaLightboxImg');
      const title = document.getElementById('qaLightboxTitle');
      const idEl = document.getElementById('qaInspectId');
      const priEl = document.getElementById('qaInspectPriority');
      const statEl = document.getElementById('qaInspectStatus');
      const repEl = document.getElementById('qaInspectReporter');
      const dateEl = document.getElementById('qaInspectDate');
      const fixEl = document.getElementById('qaInspectFixAttempts');
      const descEl = document.getElementById('qaInspectDescription');

      if (img) img.src = report.proof || '';
      if (title) title.textContent = report.topic || 'Issue Details';
      if (idEl) idEl.textContent = report.id;
      if (priEl) priEl.innerHTML = `<span class="badge-priority badge-priority-${(report.priority || 'medium').toLowerCase()}">${report.priority}</span>`;
      if (statEl) statEl.innerHTML = `<span class="badge-status badge-status-${(report.status || 'new').toLowerCase().replace(/\s+/g, '-')}">${report.status}</span>`;
      if (repEl) repEl.innerHTML = `<i class="fa-solid fa-user"></i> ${report.username || 'Anonymous'}`;
      if (dateEl) dateEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${report.createdAt || 'Recent'}`;
      if (fixEl) fixEl.innerHTML = `<i class="fa-solid fa-wrench"></i> <strong>${report.fixAttempts || 0}</strong> ${report.fixAttempts === 1 ? 'attempt' : 'attempts'}`;
      if (descEl) descEl.textContent = report.description || 'No steps or description provided.';

      if (qaProofLightboxModal) qaProofLightboxModal.classList.add('active');
    };

    // Submit QA Bug Report Form
    if (qaReportForm) {
      qaReportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Generate next chronological ID: QA-001, QA-002, QA-003...
        let maxNum = 0;
        state.qaReports.forEach(r => {
          const num = parseInt((r.id || '').replace(/\D/g, '')) || 0;
          if (num > maxNum) maxNum = num;
        });
        const nextId = `QA-${String(maxNum + 1).padStart(3, '0')}`;

        // 2. Export proof image (either annotated canvas or provided URL)
        let proofData = '';
        if (baseImg && qaCanvas) {
          proofData = qaCanvas.toDataURL('image/jpeg', 0.82);
        } else if (qaProofUrl && qaProofUrl.value.trim()) {
          proofData = qaProofUrl.value.trim();
        } else {
          // Default placeholder
          proofData = 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600&auto=format&fit=crop&q=80';
        }

        const newReport = {
          id: nextId,
          topic: document.getElementById('qaTopic').value.trim(),
          priority: document.getElementById('qaPriority').value,
          username: document.getElementById('qaUsername').value.trim() || (state.user ? state.user.name : 'Anonymous'),
          proof: proofData,
          status: 'New',
          fixAttempts: 0,
          description: document.getElementById('qaDescription').value.trim(),
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };

        state.qaReports.push(newReport);
        saveQaReports();

        // Cloud Firestore Multi-Admin Sync
        try {
          await setDoc(doc(db, "qa_reports", nextId), newReport);
        } catch (err) {
          console.warn("Firestore QA save note:", err);
        }

        renderPublicQa();
        if (adminDashboardModal && adminDashboardModal.classList.contains('active')) {
          renderAdminQa();
          renderAdminOverview();
        }

        qaModal.classList.remove('active');
        qaReportForm.reset();
        if (qaAnnotationStudio) qaAnnotationStudio.style.display = 'none';
        baseImg = null;
        annotations = [];

        showToast(`Bug report ${nextId} submitted successfully! 🐞`, 'success');

        const qaSection = document.getElementById('qa');
        if (qaSection) {
          qaSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Search and Filter Listeners for Admin QA
    if (adminQaSearch) adminQaSearch.addEventListener('input', renderAdminQa);
    if (adminQaStatusFilter) adminQaStatusFilter.addEventListener('change', renderAdminQa);
    if (adminQaPriorityFilter) adminQaPriorityFilter.addEventListener('change', renderAdminQa);

    // Initial Renders
    renderPublicQa();
  }

  // --- RENDER PUBLIC QA TABLE ---
  function renderPublicQa() {
    const tableBody = document.getElementById('publicQaTableBody');
    const totalCountEl = document.getElementById('qaTotalReportsCount');
    const openCountEl = document.getElementById('qaOpenReportsCount');

    if (!tableBody) return;

    const total = state.qaReports.length;
    const openCount = state.qaReports.filter(r => r.status !== 'Solved').length;

    if (totalCountEl) totalCountEl.textContent = total;
    if (openCountEl) openCountEl.textContent = openCount;

    if (total === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No bug reports submitted yet. Everything looks running smoothly! ✨</td></tr>`;
      return;
    }

    // Required column order: ID (chronological), Topic, Priority, Username, proof (screenshot), Status, Fix Attempts
    tableBody.innerHTML = state.qaReports.map(report => `
      <tr>
        <td><span class="qa-id-pill">${report.id}</span></td>
        <td>
          <strong style="color:#fff; font-size:0.92rem;">${report.topic}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Reported on ${report.createdAt || 'Recent'}</div>
        </td>
        <td>
          <span class="badge-priority badge-priority-${(report.priority || 'medium').toLowerCase()}">
            ${report.priority}
          </span>
        </td>
        <td>
          <span style="font-weight:600; color:var(--text-main);">
            <i class="fa-solid fa-user" style="color:var(--text-muted); margin-right:4px; font-size:0.8rem;"></i>
            ${report.username}
          </span>
        </td>
        <td>
          <div class="qa-proof-cell" data-inspect-id="${report.id}" title="Click to view screenshot & problem description">
            <img class="qa-proof-thumb" src="${report.proof}" alt="Proof Thumbnail">
            <span class="qa-proof-zoom-icon"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
          </div>
        </td>
        <td>
          <span class="badge-status badge-status-${(report.status || 'new').toLowerCase().replace(/\s+/g, '-')}">
            ${report.status}
          </span>
        </td>
        <td>
          <span class="qa-attempts-badge" title="Fix iterations applied">
            <i class="fa-solid fa-wrench" style="color:var(--primary-accent);"></i>
            <strong>${report.fixAttempts || 0}</strong> ${(report.fixAttempts === 1) ? 'attempt' : 'attempts'}
          </span>
        </td>
      </tr>
    `).join('');

    // Clicking proof opens the inspector modal
    tableBody.querySelectorAll('.qa-proof-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const id = cell.getAttribute('data-inspect-id');
        if (window.openQaInspectionModal) window.openQaInspectionModal(id);
      });
    });
  }

  // --- RENDER ADMIN QA TAB ---
  function renderAdminQa() {
    const tableBody = document.getElementById('adminQaTableBody');
    if (!tableBody) return;

    // 1. KPI Counts
    const total = state.qaReports.length;
    const newCount = state.qaReports.filter(r => r.status === 'New').length;
    const inProgressCount = state.qaReports.filter(r => r.status === 'In Progress').length;
    const solvedCount = state.qaReports.filter(r => r.status === 'Solved').length;

    const totalEl = document.getElementById('adminQaKpiTotal');
    const newEl = document.getElementById('adminQaKpiNew');
    const progEl = document.getElementById('adminQaKpiInProgress');
    const solvEl = document.getElementById('adminQaKpiSolved');
    const badgeEl = document.getElementById('adminQaBadge');

    if (totalEl) totalEl.textContent = total;
    if (newEl) newEl.textContent = newCount;
    if (progEl) progEl.textContent = inProgressCount;
    if (solvEl) solvEl.textContent = solvedCount;
    if (badgeEl) badgeEl.textContent = (newCount + inProgressCount);

    // 2. Filters
    const searchVal = (document.getElementById('adminQaSearch')?.value || '').toLowerCase().trim();
    const statusVal = document.getElementById('adminQaStatusFilter')?.value || 'all';
    const priVal = document.getElementById('adminQaPriorityFilter')?.value || 'all';

    let filtered = [...state.qaReports];

    if (searchVal) {
      filtered = filtered.filter(r => 
        (r.id || '').toLowerCase().includes(searchVal) ||
        (r.topic || '').toLowerCase().includes(searchVal) ||
        (r.username || '').toLowerCase().includes(searchVal) ||
        (r.description || '').toLowerCase().includes(searchVal)
      );
    }

    if (statusVal !== 'all') {
      filtered = filtered.filter(r => r.status === statusVal);
    }

    if (priVal !== 'all') {
      filtered = filtered.filter(r => r.priority === priVal);
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">No bug reports match your filter criteria.</td></tr>`;
      return;
    }

    // Required column order: ID (chronological), Topic, Priority, Username, proof (screenshot), Status, Fix Attempts, Actions
    tableBody.innerHTML = filtered.map(report => `
      <tr>
        <td><span class="qa-id-pill">${report.id}</span></td>
        <td>
          <strong style="color:#fff; font-size:0.9rem;">${report.topic}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">${report.createdAt || 'Recent'}</div>
        </td>
        <td>
          <span class="badge-priority badge-priority-${(report.priority || 'medium').toLowerCase()}">
            ${report.priority}
          </span>
        </td>
        <td>
          <span style="font-weight:600; color:var(--text-main);">
            <i class="fa-solid fa-user" style="color:var(--text-muted); margin-right:4px;"></i>${report.username}
          </span>
        </td>
        <td>
          <div class="qa-proof-cell" data-inspect-id="${report.id}" title="Click to inspect problem & screenshot">
            <img class="qa-proof-thumb" src="${report.proof}" alt="Proof Thumbnail">
            <span class="qa-proof-zoom-icon"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
          </div>
        </td>
        <td>
          <select class="admin-select qa-admin-status-select" data-id="${report.id}" style="padding:0.35rem 0.6rem; font-size:0.8rem;">
            <option value="New" ${report.status === 'New' ? 'selected' : ''}>New</option>
            <option value="In Progress" ${report.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Solved" ${report.status === 'Solved' ? 'selected' : ''}>Solved</option>
          </select>
        </td>
        <td>
          <div class="qa-attempt-control">
            <button class="qa-attempt-btn qa-attempt-dec" data-id="${report.id}" title="Decrease Fix Attempts">-</button>
            <span class="qa-attempt-num">${report.fixAttempts || 0}</span>
            <button class="qa-attempt-btn qa-attempt-inc" data-id="${report.id}" title="Increase Fix Attempts">+</button>
          </div>
        </td>
        <td style="text-align:right;">
          <div style="display:inline-flex; gap:0.4rem;">
            <button class="btn btn-outline qa-btn-inspect-row" data-id="${report.id}" title="Inspect Details" style="padding:0.35rem 0.65rem; font-size:0.8rem;">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn btn-del-booking qa-btn-delete-row" data-id="${report.id}" title="Delete Bug Report" style="padding:0.35rem 0.65rem; font-size:0.8rem; background:rgba(231, 76, 60, 0.2); color:#e74c3c;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Event: Click proof thumbnail to open inspection modal
    tableBody.querySelectorAll('.qa-proof-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const id = cell.getAttribute('data-inspect-id');
        if (window.openQaInspectionModal) window.openQaInspectionModal(id);
      });
    });

    // Event: Inspect button
    tableBody.querySelectorAll('.qa-btn-inspect-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (window.openQaInspectionModal) window.openQaInspectionModal(id);
      });
    });

    // Event: Live Status Change
    tableBody.querySelectorAll('.qa-admin-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = select.getAttribute('data-id');
        const newStatus = e.target.value;
        const report = state.qaReports.find(r => r.id === id);
        if (report) {
          report.status = newStatus;
          saveQaReports();
          try {
            await setDoc(doc(db, "qa_reports", id), { status: newStatus }, { merge: true });
          } catch (err) {
            console.warn("Firestore status update note:", err);
          }
          renderPublicQa();
          renderAdminQa();
          renderAdminOverview();
          showToast(`Report ${id} marked as ${newStatus}!`, 'success');
        }
      });
    });

    // Event: Increment Fix Attempts
    tableBody.querySelectorAll('.qa-attempt-inc').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const report = state.qaReports.find(r => r.id === id);
        if (report) {
          report.fixAttempts = (report.fixAttempts || 0) + 1;
          saveQaReports();
          try {
            await setDoc(doc(db, "qa_reports", id), { fixAttempts: report.fixAttempts }, { merge: true });
          } catch (err) {
            console.warn("Firestore fixAttempts increment note:", err);
          }
          renderPublicQa();
          renderAdminQa();
          showToast(`Report ${id} fix attempts: ${report.fixAttempts}`, 'info');
        }
      });
    });

    // Event: Decrement Fix Attempts
    tableBody.querySelectorAll('.qa-attempt-dec').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const report = state.qaReports.find(r => r.id === id);
        if (report && (report.fixAttempts || 0) > 0) {
          report.fixAttempts = report.fixAttempts - 1;
          saveQaReports();
          try {
            await setDoc(doc(db, "qa_reports", id), { fixAttempts: report.fixAttempts }, { merge: true });
          } catch (err) {
            console.warn("Firestore fixAttempts decrement note:", err);
          }
          renderPublicQa();
          renderAdminQa();
          showToast(`Report ${id} fix attempts: ${report.fixAttempts}`, 'info');
        }
      });
    });

    // Event: Delete Bug Report
    tableBody.querySelectorAll('.qa-btn-delete-row').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Delete QA Bug Report ${id}? This action cannot be undone.`)) {
          state.qaReports = state.qaReports.filter(r => r.id !== id);
          saveQaReports();
          try {
            await deleteDoc(doc(db, "qa_reports", id));
          } catch (err) {
            console.warn("Firestore QA delete note:", err);
          }
          renderPublicQa();
          renderAdminQa();
          renderAdminOverview();
          showToast(`Report ${id} deleted.`, 'info');
        }
      });
    });
  }

  // --- ROUTES NAVIGATOR MODAL CONTROLLER ---
  function initRoutesModal() {
    if (openRoutesModalNavBtn) {
      openRoutesModalNavBtn.addEventListener('click', () => router.navigate('/routes'));
    }
    if (closeRoutesModalBtn) {
      closeRoutesModalBtn.addEventListener('click', () => {
        const dest = router.previousPath && router.previousPath !== '/routes' ? router.previousPath : '/home';
        router.navigate(dest);
      });
    }
    if (routesModal) {
      routesModal.addEventListener('click', (e) => {
        if (e.target === routesModal) {
          const dest = router.previousPath && router.previousPath !== '/routes' ? router.previousPath : '/home';
          router.navigate(dest);
        }
      });
    }

    // Search and tab filters
    if (routesSearchInput) {
      routesSearchInput.addEventListener('input', (e) => {
        const activeTab = document.querySelector('.routes-tab-btn.active');
        const filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
        renderRoutesModalList(filter, e.target.value);
      });
    }

    document.querySelectorAll('.routes-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.routes-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        const query = routesSearchInput ? routesSearchInput.value : '';
        renderRoutesModalList(filter, query);
      });
    });
  }

  function renderRoutesModalList(filter = 'all', searchQuery = '') {
    if (!routesModalList) return;
    const query = searchQuery.trim().toLowerCase();

    const filtered = ROUTES.filter(r => {
      if (filter !== 'all' && r.type !== filter) return false;
      if (query) {
        return r.name.toLowerCase().includes(query) ||
               r.path.toLowerCase().includes(query) ||
               (r.description && r.description.toLowerCase().includes(query));
      }
      return true;
    });

    if (filtered.length === 0) {
      routesModalList.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 2.5rem 1rem; color:var(--text-muted);">
          <i class="fa-solid fa-magnifying-glass" style="font-size:2rem; margin-bottom:0.75rem; opacity:0.4; display:block;"></i>
          <p>No matching routes found for "${searchQuery}".</p>
        </div>
      `;
      return;
    }

    routesModalList.innerHTML = filtered.map(r => {
      const isCurrent = router.currentPath === r.path;
      return `
        <div class="route-card ${isCurrent ? 'current-active' : ''}" data-route-target="${r.path}">
          <div class="route-card-top">
            <div class="route-card-icon ${r.type}">
              <i class="${r.icon}"></i>
            </div>
            <div style="display:flex; gap:0.35rem; align-items:center;">
              <span class="route-tag ${r.type}">${r.type}</span>
              ${isCurrent ? '<span class="route-tag active-pill">Active</span>' : ''}
            </div>
          </div>
          <div class="route-card-title">${r.name}</div>
          <div class="route-card-path">#${r.path}</div>
          <div class="route-card-desc">${r.description}</div>
        </div>
      `;
    }).join('');

    routesModalList.querySelectorAll('[data-route-target]').forEach(card => {
      card.addEventListener('click', () => {
        const path = card.getAttribute('data-route-target');
        router.navigate(path);
      });
    });
  }

  // --- ROUTER SYSTEM INITIALIZATION & LIFECYCLE BINDING ---
  function initRouterSystem() {
    router.registerHooks({
      checkAdminAuth: () => Boolean(state.user && state.user.role === 'admin'),
      openAdminDashboard: (targetTab) => {
        openAdminDashboard(targetTab);
      },
      closeAdminDashboard: () => {
        if (adminDashboardModal) adminDashboardModal.classList.remove('active');
      },
      openBookingModal: () => {
        if (bookingModal) bookingModal.classList.add('active');
      },
      openCartDrawer: () => {
        if (cartOverlay) cartOverlay.classList.add('active');
      },
      openCheckoutModal: () => {
        if (checkoutModal) checkoutModal.classList.add('active');
      },
      openAuthModal: (mode) => {
        if (authModal) {
          authModal.classList.add('active');
          if (mode === 'register') {
            if (tabRegisterBtn) tabRegisterBtn.click();
          } else {
            if (tabLoginBtn) tabLoginBtn.click();
          }
        }
      },
      openRoutesModal: () => {
        renderRoutesModalList();
        if (routesModal) {
          routesModal.classList.add('active');
          if (routesSearchInput) {
            routesSearchInput.value = '';
            setTimeout(() => routesSearchInput.focus(), 120);
          }
        }
      },
      closeAllModals: () => {
        if (bookingModal) bookingModal.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
        if (checkoutModal) checkoutModal.classList.remove('active');
        if (authModal) authModal.classList.remove('active');
        if (routesModal) routesModal.classList.remove('active');
        if (productFormModal) productFormModal.classList.remove('active');
        const qaModal = document.getElementById('qaModal');
        if (qaModal) qaModal.classList.remove('active');
        const qaProofLightboxModal = document.getElementById('qaProofLightboxModal');
        if (qaProofLightboxModal) qaProofLightboxModal.classList.remove('active');
      },
      showToast: (msg, type) => showToast(msg, type)
    });

    router.init();
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
