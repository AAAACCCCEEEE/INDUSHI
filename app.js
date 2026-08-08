// INDUSHI Application Controller
import { INDUSHI_DATA } from './data.js';

document.addEventListener('DOMContentLoaded', () => {

  // --- STATE MANAGEMENT ---
  const state = {
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

  // --- DOM ELEMENTS ---
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const navLinksMenu = document.getElementById('navLinks');
  
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

  // --- INITIALIZATION ---
  initNavbar();
  initHeroSlider();
  initCategories();
  initFilters();
  renderProducts();
  initCustomBuilder();
  renderPlatters();
  renderTestimonials();
  initCartAndModals();
  updateCartUI();

  // --- NAVBAR LOGIC ---
  function initNavbar() {
    // Smooth scrolling & active link update
    window.addEventListener('scroll', () => {
      let current = 'home';
      const sections = document.querySelectorAll('section');
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
          current = section.getAttribute('id');
        }
      });
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });

    if (mobileNavToggle) {
      mobileNavToggle.addEventListener('click', () => {
        navLinksMenu.classList.toggle('active');
        if (navLinksMenu.classList.contains('active')) {
          navLinksMenu.style.display = 'flex';
          navLinksMenu.style.flexDirection = 'column';
          navLinksMenu.style.position = 'absolute';
          navLinksMenu.style.top = '100%';
          navLinksMenu.style.left = '0';
          navLinksMenu.style.width = '100%';
          navLinksMenu.style.background = '#181818';
          navLinksMenu.style.padding = '1.5rem';
        } else {
          navLinksMenu.style.display = '';
        }
      });
    }
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

    // Auto play every 6 seconds
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
    let filtered = INDUSHI_DATA.products;

    // Filter by Category
    if (state.activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === state.activeCategory);
    }

    // Filter by Spice Level
    if (state.spiceFilter === 'mild') {
      filtered = filtered.filter(p => p.spiceLevel <= 2);
    } else if (state.spiceFilter === 'medium') {
      filtered = filtered.filter(p => p.spiceLevel >= 3 && p.spiceLevel <= 4);
    } else if (state.spiceFilter === 'spicy') {
      filtered = filtered.filter(p => p.spiceLevel === 5);
    }

    // Filter by Style
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
            ${item.cookingStyle.includes('Aburi') ? `<span class="badge badge-aburi"><i class="fa-solid fa-fire"></i> Torched Aburi</span>` : ''}
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
            <span class="product-price">${item.formattedPrice}</span>
            <button class="add-cart-btn" data-id="${item.id}" title="Add to Cart">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach Add to Cart Listeners
    productGrid.querySelectorAll('.add-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = btn.getAttribute('data-id');
        const product = INDUSHI_DATA.products.find(p => p.id === prodId);
        if (product) {
          addToCart(product);
        }
      });
    });
  }

  // --- CUSTOM ROLL BUILDER LOGIC ---
  function initCustomBuilder() {
    // Render option chips
    renderChipGroup(baseOptionsContainer, INDUSHI_DATA.customBuilderOptions.bases, 'base', state.customRoll.base.id);
    renderChipGroup(proteinOptionsContainer, INDUSHI_DATA.customBuilderOptions.proteins, 'protein', state.customRoll.protein.id);
    renderChipGroup(fillingOptionsContainer, INDUSHI_DATA.customBuilderOptions.fillings, 'filling', state.customRoll.filling.id);
    renderChipGroup(toppingOptionsContainer, INDUSHI_DATA.customBuilderOptions.toppings, 'topping', state.customRoll.topping.id);
    renderChipGroup(torchOptionsContainer, INDUSHI_DATA.customBuilderOptions.torchLevels, 'torch', state.customRoll.torch.id);

    updateBuilderPreview();

    // Add custom roll button
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
      showToast(`Custom ${customItem.name} added to cart! 🔥`, 'success');
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

    // Update Visual Representation
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

  // --- CATERING & TESTIMONIALS RENDERING ---
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
    // Open/Close Cart
    openCartBtn.addEventListener('click', () => cartOverlay.classList.add('active'));
    closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('active'));
    cartOverlay.addEventListener('click', (e) => {
      if (e.target === cartOverlay) cartOverlay.classList.remove('active');
    });

    // Proceed to Checkout
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

    // Payment method selector buttons
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

    // Submit Checkout
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const custName = document.getElementById('custName').value;
      checkoutModal.classList.remove('active');
      state.cart = [];
      saveCart();
      updateCartUI();

      showToast(`🎉 Thank you ${custName}! Order confirmed. Dispatching courier...`, 'success');
    });

    // Booking Table Modal
    const openBooking = () => bookingModal.classList.add('active');
    const closeBooking = () => bookingModal.classList.remove('active');

    if (bookTableNavBtn) bookTableNavBtn.addEventListener('click', openBooking);
    if (heroBookBtn2) heroBookBtn2.addEventListener('click', openBooking);
    if (closeBookingBtn) closeBookingBtn.addEventListener('click', closeBooking);
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) closeBooking();
    });

    if (orderNowNavBtn) {
      orderNowNavBtn.addEventListener('click', () => {
        document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
      });
    }

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('bookName').value;
      const date = document.getElementById('bookDate').value;
      const time = document.getElementById('bookTime').value;
      closeBooking();
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

    // Attach qty listeners
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

    // Remove listener
    cartItemList.querySelectorAll('.remove-cart-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        state.cart = state.cart.filter(i => i.id !== id);
        saveCart();
        updateCartUI();
      });
    });
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
