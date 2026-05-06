const STORAGE_KEY = "nevermind-store-state-v1";
const SHIPPING_FEE = 5000;
const state = loadState();
const uiState = {
  selectedSize: "M",
  selectedColor: "Black",
  productQty: 1
};

function seedState() {
  const categories = ["Men", "Women", "Hoodies", "Tees", "Outerwear", "Accessories"];
  const products = [
    createProduct("Chaos Hoodie", "Men", 45000, 52000, ["Black", "Ash"], ["S", "M", "L", "XL"], 12, ["new", "sale", "featured"], "Oversized fleece hoodie with raw hem energy and high-density front script.", 4.8),
    createProduct("Metro Hoodie", "Hoodies", 47000, null, ["Black", "Olive"], ["M", "L", "XL"], 8, ["featured"], "Heavyweight graphic hoodie made for night movement and clean layering.", 4.6),
    createProduct("Vanta Hoodie", "Men", 49000, 56000, ["Black", "Wine"], ["S", "M", "L"], 5, ["sale", "limited"], "Statement embroidery and structured shoulder line with thermal interior.", 4.9),
    createProduct("Noir Track Jacket", "Outerwear", 62000, null, ["Black", "Gold"], ["M", "L", "XL"], 7, ["new", "featured"], "Performance trim jacket with contrast piping and low-gloss finish.", 4.5),
    createProduct("Reflect Tee", "Tees", 24000, null, ["Bone", "Black"], ["S", "M", "L", "XL"], 18, ["new"], "Soft jersey tee with minimal chest hit and oversized drape.", 4.4),
    createProduct("Soft Armor Set", "Women", 68000, 76000, ["Stone", "Black"], ["S", "M", "L"], 6, ["sale", "featured"], "Cropped zip jacket and wide-leg bottom set for elevated off-duty wear.", 4.7),
    createProduct("Limited Cargo", "Men", 58000, null, ["Black", "Graphite"], ["M", "L", "XL"], 11, ["limited"], "Structured cargo trouser with metal trim and adjustable ankle opening.", 4.3),
    createProduct("Studio Cap", "Accessories", 15000, null, ["Black"], ["One Size"], 22, ["featured"], "Low-profile cap with tonal mark and brushed cotton feel.", 4.2)
  ];

  const adminId = crypto.randomUUID();
  const demoId = crypto.randomUUID();
  const reviews = [
    createReview(products[0].id, demoId, "Amina", 5, "The fit is clean and the fabric feels premium."),
    createReview(products[0].id, adminId, "Studio Team", 4, "Limited run piece. Restock is not guaranteed."),
    createReview(products[5].id, demoId, "Amina", 5, "Looks expensive in person and sizes match perfectly.")
  ];

  return {
    categories,
    products,
    users: [
      {
        id: adminId,
        name: "Admin User",
        email: "admin@nevermind.com",
        password: "admin123",
        role: "admin",
        address: "12 Victoria Island, Lagos"
      },
      {
        id: demoId,
        name: "Amina James",
        email: "amina@example.com",
        password: "demo123",
        role: "user",
        address: "45 Admiralty Way, Lekki"
      }
    ],
    cartByUser: {},
    wishlistByUser: {},
    orders: [],
    reviews,
    sessions: {
      currentUserId: null
    },
    newsletter: []
  };
}

function createProduct(name, category, price, oldPrice, colors, sizes, stock, tags, description, rating) {
  return {
    id: crypto.randomUUID(),
    name,
    category,
    price,
    oldPrice,
    colors,
    sizes,
    stock,
    tags,
    description,
    rating,
    imageSeed: Math.floor(Math.random() * 360),
    createdAt: new Date().toISOString(),
    sales: Math.floor(Math.random() * 80) + 10
  };
}

function createReview(productId, userId, userName, rating, comment) {
  return {
    id: crypto.randomUUID(),
    productId,
    userId,
    userName,
    rating,
    comment,
    createdAt: new Date().toISOString()
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const seeded = seedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentUser() {
  return state.users.find((user) => user.id === state.sessions.currentUserId) || null;
}

function getUserCart() {
  const user = getCurrentUser();
  if (!user) return [];
  return state.cartByUser[user.id] || [];
}

function getUserWishlist() {
  const user = getCurrentUser();
  if (!user) return [];
  return state.wishlistByUser[user.id] || [];
}

function getProduct(id) {
  return state.products.find((product) => product.id === id);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(value);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getQueryParams() {
  const hash = window.location.hash || "#/home";
  const queryString = hash.includes("?") ? hash.split("?")[1] : "";
  return new URLSearchParams(queryString);
}

function getRoute() {
  const hash = window.location.hash || "#/home";
  const path = hash.slice(1).split("?")[0];
  return path || "/home";
}

function updateHeader() {
  const user = getCurrentUser();
  const accountLink = document.getElementById("account-link");
  accountLink.textContent = user ? user.name.split(" ")[0] : "Account";
  accountLink.href = user ? "#/profile" : "#/login";
  document.getElementById("cart-count").textContent = getUserCart().reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("wishlist-count").textContent = getUserWishlist().length;
}

function productMediaStyle(seed) {
  return `background:
    radial-gradient(circle at 50% 18%, rgba(255,255,255,0.18), transparent 14%),
    linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.45)),
    linear-gradient(${120 + (seed % 70)}deg, hsl(${seed}, 10%, 23%), #090909);`;
}

function renderProductCard(product) {
  const isWishlisted = getUserWishlist().includes(product.id);
  return `
    <article class="product-card">
      <div class="product-media" style="${productMediaStyle(product.imageSeed)}"></div>
      <div class="product-card-content">
        <div class="card-row">
          <span class="tag">${escapeHtml(product.category)}</span>
          ${product.oldPrice ? '<span class="badge sale">Sale</span>' : '<span class="badge">Drop</span>'}
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="muted">${escapeHtml(product.description)}</p>
        <div class="price-row">
          <strong class="price">${formatCurrency(product.price)}</strong>
          ${product.oldPrice ? `<span class="old-price">${formatCurrency(product.oldPrice)}</span>` : ""}
        </div>
        <div class="inline-actions spaced">
          <a class="btn-secondary" href="#/product/${product.id}">View details</a>
          <button class="btn" data-action="quick-add" data-id="${product.id}">Quick add</button>
          <button class="btn-ghost" data-action="toggle-wishlist" data-id="${product.id}">${isWishlisted ? "Saved" : "Wishlist"}</button>
        </div>
      </div>
    </article>
  `;
}

function renderHomePage() {
  const featured = state.products.filter((product) => product.tags.includes("featured")).slice(0, 4);
  const arrivals = state.products.filter((product) => product.tags.includes("new")).slice(0, 3);
  return `
    <div class="page-stack">
      <section class="hero">
        <div class="hero-visual">
          <div class="hero-grid">
            <div class="hero-model"></div>
            <div class="hero-model"></div>
            <div class="hero-model"></div>
            <div class="hero-model light"></div>
          </div>
        </div>
        <div class="hero-content">
          <p class="eyebrow">New streetwear capsule</p>
          <h1 class="hero-title">Style<br>Vibe<br>Reflect</h1>
          <p class="hero-copy">Built like the reference you shared, but expanded into a real store flow with catalog, wishlist, checkout, profile, and admin tools.</p>
          <div class="cta-row">
            <a class="btn" href="#/shop">Shop now</a>
            <a class="btn-secondary" href="#/admin">View operations</a>
          </div>
          <div class="hero-meta">
            <div class="hero-meta-card"><p class="micro-label">Drop cadence</p><strong>Weekly</strong></div>
            <div class="hero-meta-card"><p class="micro-label">Fulfillment</p><strong>48 hours</strong></div>
            <div class="hero-meta-card"><p class="micro-label">Payment</p><strong>Paystack ready</strong></div>
          </div>
        </div>
      </section>

      <section>
        <div class="section-header">
          <div>
            <p class="section-kicker">Crafted for movement</p>
            <h2 class="section-title">Designed To Disrupt</h2>
            <p class="section-copy">Luxury staples for the modern disruptor. Precision-tailored pieces that balance comfort, identity, and clean presentation.</p>
          </div>
          <a class="btn-ghost" href="#/shop">Browse catalog</a>
        </div>
        <div class="product-grid">${featured.map(renderProductCard).join("")}</div>
      </section>

      <div class="ticker">
        <span>Limited edition</span>
        <span>New arrival</span>
        <span>Wishlist enabled</span>
        <span>Fast dispatch</span>
        <span>Multiple sizes</span>
        <span>Reviews live</span>
      </div>

      <section class="story-grid">
        <article class="story-card">
          <p class="section-kicker">Mission</p>
          <h2>Our Mission</h2>
          <p class="section-copy">Pair strong essentials with modern tooling. Customers can discover, save, buy, and track their pieces, while your team manages products, orders, and users from one place.</p>
          <a class="btn spaced" href="#/shop">Learn more</a>
        </article>
        <div class="story-image"></div>
        <div class="story-image"></div>
        <article class="story-card">
          <p class="section-kicker">Vision</p>
          <h2>Our Vision</h2>
          <p class="section-copy">A dark editorial fashion identity supported by practical commerce features: filtering, sorting, cart, checkout, wishlists, reviews, and admin analytics.</p>
          <a class="btn-secondary spaced" href="#/contact">Get in touch</a>
        </article>
      </section>

      <section class="feature-grid">
        <div class="feature-image"></div>
        <div class="feature-stack">
          <article class="panel">
            <p class="section-kicker">Store capabilities</p>
            <h2 class="section-title">Complete Buying Flow</h2>
            <div class="feature-pills">
              <span class="pill">Search</span><span class="pill">Filter</span><span class="pill">Wishlist</span>
              <span class="pill">Reviews</span><span class="pill">Checkout</span><span class="pill">Orders</span>
            </div>
            <p class="section-copy">This prototype includes the full customer journey from discovery to order placement, plus account and admin operations.</p>
          </article>
          <article class="panel">
            <p class="section-kicker">New arrivals</p>
            ${arrivals.map((product) => `
              <div class="list-row">
                <div><strong>${escapeHtml(product.name)}</strong><p class="muted">${escapeHtml(product.category)}</p></div>
                <a class="btn-ghost" href="#/product/${product.id}">View</a>
              </div>
            `).join('<div class="divider"></div>')}
          </article>
        </div>
      </section>
    </div>
  `;
}

function renderShopPage() {
  const params = getQueryParams();
  const category = params.get("category") || "All";
  const tag = params.get("tag") || "all";
  const sort = params.get("sort") || "featured";
  const page = Number(params.get("page") || 1);
  const search = params.get("search") || "";
  const perPage = 6;

  let filtered = [...state.products];
  if (category !== "All") filtered = filtered.filter((product) => product.category === category);
  if (tag !== "all") filtered = filtered.filter((product) => product.tags.includes(tag));
  if (search) filtered = filtered.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase()));

  if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
  if (sort === "best-sellers") filtered.sort((a, b) => b.sales - a.sales);
  if (sort === "newest") filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return `
    <div class="page-stack">
      <section class="section-header">
        <div>
          <p class="section-kicker">Catalog</p>
          <h1 class="section-title">Shop The Collection</h1>
          <p class="section-copy">Search, filter, sort, and paginate through the store just like a real commerce catalog.</p>
        </div>
      </section>

      <section class="shop-layout">
        <aside class="sidebar">
          <div class="filter-group">
            <label for="filter-category">Category</label>
            <select id="filter-category">
              <option ${category === "All" ? "selected" : ""}>All</option>
              ${state.categories.map((entry) => `<option ${entry === category ? "selected" : ""}>${entry}</option>`).join("")}
            </select>
          </div>
          <div class="filter-group">
            <label for="filter-tag">Collection</label>
            <select id="filter-tag">
              <option value="all" ${tag === "all" ? "selected" : ""}>All</option>
              <option value="new" ${tag === "new" ? "selected" : ""}>New arrivals</option>
              <option value="featured" ${tag === "featured" ? "selected" : ""}>Featured</option>
              <option value="sale" ${tag === "sale" ? "selected" : ""}>Sale</option>
              <option value="limited" ${tag === "limited" ? "selected" : ""}>Limited</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="filter-sort">Sort</label>
            <select id="filter-sort">
              <option value="featured" ${sort === "featured" ? "selected" : ""}>Featured</option>
              <option value="newest" ${sort === "newest" ? "selected" : ""}>Newest</option>
              <option value="best-sellers" ${sort === "best-sellers" ? "selected" : ""}>Best sellers</option>
              <option value="price-asc" ${sort === "price-asc" ? "selected" : ""}>Price low to high</option>
              <option value="price-desc" ${sort === "price-desc" ? "selected" : ""}>Price high to low</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="filter-search">Search</label>
            <input id="filter-search" type="search" value="${escapeHtml(search)}" placeholder="Search catalog">
          </div>
          <button class="btn" data-action="apply-filters">Apply filters</button>
        </aside>
        <div class="content-panel">
          <div class="toolbar">
            <p class="muted">${filtered.length} product(s) found</p>
            <div class="tag-row">
              <span class="tag">Pagination</span>
              <span class="tag">Wishlist</span>
              <span class="tag">Quick add</span>
            </div>
          </div>
          <div class="product-listing spaced">
            ${visible.length ? visible.map(renderProductCard).join("") : renderEmptyInline("No products match this filter.")}
          </div>
          <div class="toolbar spaced">
            <button class="btn-ghost" data-action="paginate" data-page="${Math.max(1, currentPage - 1)}">Previous</button>
            <p class="muted">Page ${currentPage} of ${totalPages}</p>
            <button class="btn-ghost" data-action="paginate" data-page="${Math.min(totalPages, currentPage + 1)}">Next</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderProductPage(productId) {
  const product = getProduct(productId);
  if (!product) return renderEmptyPage("Product not found.");
  const related = state.products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  const reviews = state.reviews.filter((review) => review.productId === product.id);
  return `
    <div class="page-stack">
      <section class="product-detail-layout">
        <div class="product-gallery">
          <div class="gallery-tile primary" style="${productMediaStyle(product.imageSeed)}"></div>
          <div class="gallery-tile" style="${productMediaStyle(product.imageSeed + 24)}"></div>
          <div class="gallery-tile" style="${productMediaStyle(product.imageSeed + 48)}"></div>
        </div>
        <article class="product-detail">
          <p class="section-kicker">${escapeHtml(product.category)}</p>
          <h1>${escapeHtml(product.name)}</h1>
          <div class="price-row">
            <strong class="price">${formatCurrency(product.price)}</strong>
            ${product.oldPrice ? `<span class="old-price">${formatCurrency(product.oldPrice)}</span>` : ""}
            <span class="pill">Rating ${product.rating}</span>
          </div>
          <p class="section-copy">${escapeHtml(product.description)}</p>
          <div class="field">
            <label>Sizes</label>
            <div class="size-grid">
              ${product.sizes.map((size) => `<button class="selector ${uiState.selectedSize === size ? "active" : ""}" data-action="select-size" data-size="${size}">${size}</button>`).join("")}
            </div>
          </div>
          <div class="field">
            <label>Colors</label>
            <div class="color-grid">
              ${product.colors.map((color) => `<button class="selector ${uiState.selectedColor === color ? "active" : ""}" data-action="select-color" data-color="${color}">${color}</button>`).join("")}
            </div>
          </div>
          <div class="field">
            <label>Quantity</label>
            <div class="qty-control">
              <button class="qty-button" data-action="product-qty" data-delta="-1">-</button>
              <span class="qty-value">${uiState.productQty}</span>
              <button class="qty-button" data-action="product-qty" data-delta="1">+</button>
            </div>
          </div>
          <div class="inline-actions spaced">
            <button class="btn" data-action="add-configured-cart" data-id="${product.id}">Add to cart</button>
            <button class="btn-secondary" data-action="buy-now" data-id="${product.id}">Buy now</button>
            <button class="btn-ghost" data-action="toggle-wishlist" data-id="${product.id}">Wishlist</button>
          </div>
          <div class="feature-pills spaced">
            <span class="pill">Stock ${product.stock}</span>
            <span class="pill">Zoom-ready gallery</span>
            <span class="pill">Related products</span>
          </div>
        </article>
      </section>

      <section>
        <div class="section-header">
          <div><p class="section-kicker">Reviews</p><h2 class="section-title">Customer Feedback</h2></div>
        </div>
        <div class="review-list">
          ${reviews.length ? reviews.map((review) => `
            <article class="review-card">
              <div class="card-row"><strong>${escapeHtml(review.userName)}</strong><span class="pill">${review.rating}/5</span></div>
              <p class="muted">${escapeHtml(review.comment)}</p>
            </article>
          `).join("") : renderEmptyInline("No reviews yet.")}
        </div>
        <form id="review-form" class="panel spaced" data-product-id="${product.id}">
          <div class="form-grid">
            <div class="field">
              <label for="review-rating">Rating</label>
              <select id="review-rating" required><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select>
            </div>
            <div class="field">
              <label for="review-name">Name</label>
              <input id="review-name" type="text" value="${escapeHtml(getCurrentUser()?.name || "")}" required>
            </div>
          </div>
          <div class="field">
            <label for="review-comment">Comment</label>
            <textarea id="review-comment" required></textarea>
          </div>
          <button class="btn" type="submit">Add review</button>
        </form>
      </section>

      <section>
        <div class="section-header">
          <div><p class="section-kicker">Related products</p><h2 class="section-title">You May Also Like</h2></div>
        </div>
        <div class="product-grid">${related.map(renderProductCard).join("")}</div>
      </section>
    </div>
  `;
}

function renderCartPage() {
  const user = getCurrentUser();
  if (!user) return renderLoginRequired("Sign in to manage your cart and checkout.", "#/login");
  const items = getExpandedCart();
  const totals = getCartTotals();
  return `
    <div class="page-stack">
      <section class="section-header"><div><p class="section-kicker">Cart</p><h1 class="section-title">Your Bag</h1></div></section>
      ${items.length ? `
        <section class="cart-layout">
          <div class="cart-list">
            ${items.map((item) => `
              <article class="cart-item">
                <div class="cart-thumb" style="${productMediaStyle(item.product.imageSeed)}"></div>
                <div>
                  <strong>${escapeHtml(item.product.name)}</strong>
                  <p class="muted">${escapeHtml(item.size)} / ${escapeHtml(item.color)}</p>
                  <p class="muted">${formatCurrency(item.product.price)} each</p>
                  <div class="qty-control">
                    <button class="qty-button" data-action="update-cart-qty" data-cart-id="${item.id}" data-delta="-1">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-button" data-action="update-cart-qty" data-cart-id="${item.id}" data-delta="1">+</button>
                  </div>
                </div>
                <div>
                  <strong>${formatCurrency(item.product.price * item.quantity)}</strong>
                  <div class="spaced"><button class="btn-ghost" data-action="remove-cart-item" data-cart-id="${item.id}">Remove</button></div>
                </div>
              </article>
            `).join("")}
          </div>
          <aside class="cart-summary">
            <div class="summary-box">
              <div class="summary-row"><span>Subtotal</span><strong>${formatCurrency(totals.subtotal)}</strong></div>
              <div class="summary-row"><span>Shipping</span><strong>${formatCurrency(totals.shipping)}</strong></div>
              <div class="summary-row"><span>Total</span><strong>${formatCurrency(totals.total)}</strong></div>
              <a class="btn" href="#/checkout">Proceed to checkout</a>
            </div>
          </aside>
        </section>
      ` : renderEmptyPage("Your cart is empty. Add products from the shop.")}
    </div>
  `;
}

function renderCheckoutPage() {
  const user = getCurrentUser();
  if (!user) return renderLoginRequired("Sign in before checkout.", "#/login");
  const items = getExpandedCart();
  if (!items.length) return renderEmptyPage("Your cart is empty. Visit the shop first.");
  const totals = getCartTotals();
  return `
    <div class="page-stack">
      <section class="section-header"><div><p class="section-kicker">Checkout</p><h1 class="section-title">Complete Your Order</h1></div></section>
      <section class="checkout-layout">
        <form id="checkout-form" class="content-panel">
          <div class="form-grid">
            <div class="field"><label for="checkout-name">Full name</label><input id="checkout-name" value="${escapeHtml(user.name)}" required></div>
            <div class="field"><label for="checkout-email">Email</label><input id="checkout-email" type="email" value="${escapeHtml(user.email)}" required></div>
            <div class="field"><label for="checkout-phone">Phone</label><input id="checkout-phone" placeholder="+234..." required></div>
            <div class="field"><label for="checkout-country">Country</label><input id="checkout-country" value="Nigeria" required></div>
          </div>
          <div class="field"><label for="checkout-address">Address</label><textarea id="checkout-address" required>${escapeHtml(user.address || "")}</textarea></div>
          <div class="form-grid">
            <div class="field"><label for="checkout-delivery">Delivery method</label><select id="checkout-delivery"><option>Standard Delivery</option><option>Express Delivery</option><option>Store Pickup</option></select></div>
            <div class="field"><label for="checkout-payment">Payment method</label><select id="checkout-payment"><option>Paystack</option><option>Flutterwave</option><option>Stripe</option><option>PayPal</option></select></div>
          </div>
          <button class="btn" type="submit">Place order</button>
        </form>
        <aside class="checkout-summary">
          <div class="summary-box">
            ${items.map((item) => `<div class="summary-row"><span>${escapeHtml(item.product.name)} x${item.quantity}</span><strong>${formatCurrency(item.product.price * item.quantity)}</strong></div>`).join("")}
            <div class="divider"></div>
            <div class="summary-row"><span>Subtotal</span><strong>${formatCurrency(totals.subtotal)}</strong></div>
            <div class="summary-row"><span>Shipping</span><strong>${formatCurrency(totals.shipping)}</strong></div>
            <div class="summary-row"><span>Total</span><strong>${formatCurrency(totals.total)}</strong></div>
          </div>
        </aside>
      </section>
    </div>
  `;
}

function renderLoginPage() {
  return `
    <section class="auth-layout">
      <article class="auth-panel">
        <p class="section-kicker">Account</p>
        <h1 class="section-title">Login</h1>
        <form id="login-form">
          <div class="field"><label for="login-email">Email</label><input id="login-email" type="email" required></div>
          <div class="field"><label for="login-password">Password</label><input id="login-password" type="password" required></div>
          <button class="btn" type="submit">Login</button>
        </form>
        <p class="muted spaced">Demo user: amina@example.com / demo123</p>
        <p class="muted">Admin: admin@nevermind.com / admin123</p>
      </article>
      <article class="auth-panel">
        <p class="section-kicker">New here</p>
        <h2>Create Account</h2>
        <p class="section-copy">Register to save wishlists, place orders, and manage your profile.</p>
        <a class="btn-secondary" href="#/register">Register</a>
      </article>
    </section>
  `;
}

function renderRegisterPage() {
  return `
    <section class="auth-layout">
      <article class="auth-panel">
        <p class="section-kicker">Register</p>
        <h1 class="section-title">Create Account</h1>
        <form id="register-form">
          <div class="field"><label for="register-name">Name</label><input id="register-name" required></div>
          <div class="field"><label for="register-email">Email</label><input id="register-email" type="email" required></div>
          <div class="field"><label for="register-password">Password</label><input id="register-password" type="password" required></div>
          <div class="field"><label for="register-confirm">Confirm password</label><input id="register-confirm" type="password" required></div>
          <button class="btn" type="submit">Register</button>
        </form>
      </article>
      <article class="auth-panel">
        <p class="section-kicker">Already registered</p>
        <h2>Sign In</h2>
        <p class="section-copy">Use your account to track orders, save favorites, and access checkout faster.</p>
        <a class="btn-secondary" href="#/login">Login</a>
      </article>
    </section>
  `;
}

function renderProfilePage(user) {
  const orders = state.orders.filter((order) => order.userId === user.id);
  const wishlist = getUserWishlist().map(getProduct).filter(Boolean);
  return `
    <div class="page-stack">
      <section class="section-header">
        <div><p class="section-kicker">Dashboard</p><h1 class="section-title">My Account</h1></div>
        <button class="btn-ghost" data-action="logout">Logout</button>
      </section>
      <section class="dashboard-grid">
        <article class="dashboard-card">
          <h2>My Profile</h2>
          <p class="muted">${escapeHtml(user.name)}</p>
          <p class="muted">${escapeHtml(user.email)}</p>
          <p class="muted">${escapeHtml(user.address || "No address yet")}</p>
        </article>
        <article class="dashboard-card">
          <h2>My Orders</h2>
          ${orders.length ? `
            <table class="table">
              <thead><tr><th>Order</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>${orders.map((order) => `<tr><td>${order.id.slice(0, 8)}</td><td>${escapeHtml(order.status)}</td><td>${formatCurrency(order.total)}</td></tr>`).join("")}</tbody>
            </table>
          ` : `<p class="muted">No orders yet.</p>`}
        </article>
        <article class="dashboard-card">
          <h2>Wishlist</h2>
          ${wishlist.length ? `<div class="wishlist-list">${wishlist.map((product) => `<div class="list-row"><span>${escapeHtml(product.name)}</span><a class="btn-ghost" href="#/product/${product.id}">Open</a></div>`).join("")}</div>` : `<p class="muted">Your wishlist is empty.</p>`}
        </article>
      </section>
    </div>
  `;
}

function renderWishlistPage() {
  const products = getUserWishlist().map(getProduct).filter(Boolean);
  return `
    <div class="page-stack">
      <section class="section-header"><div><p class="section-kicker">Saved items</p><h1 class="section-title">Wishlist</h1></div></section>
      ${products.length ? `<div class="product-grid">${products.map(renderProductCard).join("")}</div>` : renderEmptyPage("Your wishlist is empty.")}
    </div>
  `;
}

function renderAboutPage() {
  return `
    <section class="page-stack">
      <article class="story-card">
        <p class="section-kicker">About</p>
        <h1 class="section-title">A Complete Clothing Store Prototype</h1>
        <p class="section-copy">This build combines the look of your reference with the flows a real fashion storefront needs: account creation, catalog browsing, product detail views, cart, checkout, orders, wishlists, reviews, and admin control.</p>
      </article>
      <section class="story-grid">
        <article class="story-card">
          <h2>Brand Direction</h2>
          <p class="section-copy">Editorial, dark, precise, and product-led. The layout uses strong contrast, uppercase navigation, oversized headlines, and gallery-based product presentation.</p>
        </article>
        <article class="story-card">
          <h2>Operational Direction</h2>
          <p class="section-copy">The admin area tracks products, categories, orders, users, and simple revenue metrics using seeded data stored locally in the browser.</p>
        </article>
      </section>
    </section>
  `;
}

function renderContactPage() {
  return `
    <section class="page-stack">
      <section class="contact-grid">
        <article class="contact-card panel">
          <p class="section-kicker">Contact</p>
          <h1 class="section-title">Reach The Studio</h1>
          <p class="section-copy">Use this form for sizing questions, partnership requests, or order support.</p>
          <form id="contact-form">
            <div class="form-grid">
              <div class="field"><label for="contact-name">Name</label><input id="contact-name" required></div>
              <div class="field"><label for="contact-email">Email</label><input id="contact-email" type="email" required></div>
            </div>
            <div class="field"><label for="contact-message">Message</label><textarea id="contact-message" required></textarea></div>
            <button class="btn" type="submit">Send</button>
          </form>
        </article>
        <article class="contact-card panel">
          <h2>Store Details</h2>
          <p class="muted">Lagos, Nigeria</p>
          <p class="muted">hello@nevermindstudio.com</p>
          <p class="muted">Mon - Sat / 9:00 - 18:00</p>
          <div class="feature-pills spaced"><span class="pill">Paystack</span><span class="pill">Flutterwave</span><span class="pill">Stripe</span><span class="pill">PayPal</span></div>
        </article>
      </section>
    </section>
  `;
}

function renderAdminPage() {
  const revenue = state.orders.reduce((sum, order) => sum + order.total, 0);
  return `
    <div class="page-stack">
      <section class="section-header"><div><p class="section-kicker">Admin</p><h1 class="section-title">Operations Dashboard</h1></div></section>
      <section class="metric-grid">
        <article class="metric-card"><p class="micro-label">Products</p><strong>${state.products.length}</strong></article>
        <article class="metric-card"><p class="micro-label">Orders</p><strong>${state.orders.length}</strong></article>
        <article class="metric-card"><p class="micro-label">Users</p><strong>${state.users.length}</strong></article>
        <article class="metric-card"><p class="micro-label">Revenue</p><strong>${formatCurrency(revenue)}</strong></article>
      </section>
      <section class="admin-grid">
        <article class="admin-panel">
          <p class="section-kicker">Products</p>
          <h2>Add Product</h2>
          <form id="admin-product-form">
            <div class="form-grid">
              <div class="field"><label for="admin-product-name">Name</label><input id="admin-product-name" required></div>
              <div class="field"><label for="admin-product-category">Category</label><select id="admin-product-category">${state.categories.map((entry) => `<option>${entry}</option>`).join("")}</select></div>
              <div class="field"><label for="admin-product-price">Price</label><input id="admin-product-price" type="number" required></div>
              <div class="field"><label for="admin-product-old-price">Old price</label><input id="admin-product-old-price" type="number"></div>
              <div class="field"><label for="admin-product-stock">Stock</label><input id="admin-product-stock" type="number" required></div>
              <div class="field"><label for="admin-product-tags">Tags</label><input id="admin-product-tags" placeholder="new,featured,sale"></div>
            </div>
            <div class="field"><label for="admin-product-description">Description</label><textarea id="admin-product-description" required></textarea></div>
            <div class="form-grid">
              <div class="field"><label for="admin-product-colors">Colors</label><input id="admin-product-colors" placeholder="Black, Ash"></div>
              <div class="field"><label for="admin-product-sizes">Sizes</label><input id="admin-product-sizes" placeholder="S, M, L, XL"></div>
            </div>
            <button class="btn" type="submit">Add product</button>
          </form>
        </article>
        <article class="admin-panel">
          <p class="section-kicker">Categories</p>
          <h2>Manage Categories</h2>
          <form id="admin-category-form" class="inline-actions">
            <input id="admin-category-name" placeholder="Add category" required>
            <button class="btn" type="submit">Add</button>
          </form>
          <div class="admin-list spaced">${state.categories.map((category) => `<div class="list-row"><span>${escapeHtml(category)}</span><button class="btn-ghost" data-action="delete-category" data-category="${category}">Delete</button></div>`).join("")}</div>
        </article>
      </section>
      <section class="admin-grid">
        <article class="admin-panel">
          <p class="section-kicker">Orders</p>
          <h2>Order Management</h2>
          ${state.orders.length ? `
            <table class="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>${state.orders.map((order) => `
                <tr>
                  <td>${order.id.slice(0, 8)}</td>
                  <td>${escapeHtml(order.customerName)}</td>
                  <td>${escapeHtml(order.status)}</td>
                  <td><button class="btn-ghost" data-action="advance-order" data-order-id="${order.id}">Advance</button></td>
                </tr>`).join("")}</tbody>
            </table>` : `<p class="muted">No orders yet.</p>`}
        </article>
        <article class="admin-panel">
          <p class="section-kicker">Users</p>
          <h2>User Management</h2>
          <table class="table">
            <thead><tr><th>Name</th><th>Role</th><th>Action</th></tr></thead>
            <tbody>${state.users.map((user) => `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.role)}</td><td>${user.role === "admin" ? "-" : `<button class="btn-ghost" data-action="delete-user" data-user-id="${user.id}">Delete</button>`}</td></tr>`).join("")}</tbody>
          </table>
        </article>
      </section>
      <section class="admin-panel">
        <p class="section-kicker">Inventory</p>
        <h2>Products</h2>
        <table class="table">
          <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
          <tbody>${state.products.map((product) => `<tr><td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.category)}</td><td>${formatCurrency(product.price)}</td><td>${product.stock}</td><td><button class="btn-ghost" data-action="delete-product" data-product-id="${product.id}">Delete</button></td></tr>`).join("")}</tbody>
        </table>
      </section>
    </div>
  `;
}

function renderLoginRequired(message, href) {
  return `<section class="empty-state"><h2>Access Required</h2><p class="muted">${escapeHtml(message)}</p><a class="btn" href="${href}">Continue</a></section>`;
}

function renderEmptyPage(message) {
  return `<section class="empty-state"><p class="muted">${escapeHtml(message)}</p><a class="btn spaced" href="#/shop">Go to shop</a></section>`;
}

function renderEmptyInline(message) {
  return `<div class="empty-state"><p class="muted">${escapeHtml(message)}</p></div>`;
}

function getExpandedCart() {
  return getUserCart().map((item) => ({ ...item, product: getProduct(item.productId) })).filter((item) => item.product);
}

function getCartTotals() {
  const subtotal = getExpandedCart().reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal ? SHIPPING_FEE : 0;
  return { subtotal, shipping, total: subtotal + shipping };
}

function bindActiveControls() {
  document.querySelectorAll('button[data-action="select-size"]').forEach((button) => {
    button.classList.toggle("active", button.dataset.size === uiState.selectedSize);
  });
  document.querySelectorAll('button[data-action="select-color"]').forEach((button) => {
    button.classList.toggle("active", button.dataset.color === uiState.selectedColor);
  });
  const qty = document.querySelector(".qty-value");
  if (qty) qty.textContent = uiState.productQty;
}

function renderApp() {
  updateHeader();
  const route = getRoute();
  const app = document.getElementById("app");
  const user = getCurrentUser();

  if (route === "/home") app.innerHTML = renderHomePage();
  else if (route === "/shop") app.innerHTML = renderShopPage();
  else if (route.startsWith("/product/")) app.innerHTML = renderProductPage(route.split("/")[2]);
  else if (route === "/cart") app.innerHTML = renderCartPage();
  else if (route === "/checkout") app.innerHTML = renderCheckoutPage();
  else if (route === "/login") app.innerHTML = renderLoginPage();
  else if (route === "/register") app.innerHTML = renderRegisterPage();
  else if (route === "/profile") app.innerHTML = user ? renderProfilePage(user) : renderLoginRequired("Sign in to view your dashboard.", "#/login");
  else if (route === "/wishlist") app.innerHTML = user ? renderWishlistPage() : renderLoginRequired("Sign in to save pieces to your wishlist.", "#/login");
  else if (route === "/about") app.innerHTML = renderAboutPage();
  else if (route === "/contact") app.innerHTML = renderContactPage();
  else if (route === "/admin") app.innerHTML = user && user.role === "admin" ? renderAdminPage() : renderLoginRequired("Admin access only.", "#/login");
  else app.innerHTML = renderHomePage();

  bindActiveControls();
}

function requireUser() {
  const user = getCurrentUser();
  if (!user) {
    showToast("Please log in first.");
    window.location.hash = "#/login";
    return null;
  }
  return user;
}

function addToCart(productId, quantity, size, color) {
  const user = requireUser();
  if (!user) return;
  const cart = state.cartByUser[user.id] || [];
  const existing = cart.find((entry) => entry.productId === productId && entry.size === size && entry.color === color);
  if (existing) existing.quantity += quantity;
  else cart.push({ id: crypto.randomUUID(), productId, quantity, size, color });
  state.cartByUser[user.id] = cart;
  saveState();
  updateHeader();
  showToast("Added to cart.");
}

function toggleWishlist(productId) {
  const user = requireUser();
  if (!user) return;
  const wishlist = state.wishlistByUser[user.id] || [];
  const index = wishlist.indexOf(productId);
  if (index >= 0) {
    wishlist.splice(index, 1);
    showToast("Removed from wishlist.");
  } else {
    wishlist.push(productId);
    showToast("Saved to wishlist.");
  }
  state.wishlistByUser[user.id] = wishlist;
  saveState();
  renderApp();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action } = button.dataset;

  if (action === "quick-add") addToCart(button.dataset.id, 1, "M", "Black");
  if (action === "toggle-wishlist") toggleWishlist(button.dataset.id);
  if (action === "select-size") {
    uiState.selectedSize = button.dataset.size;
    bindActiveControls();
  }
  if (action === "select-color") {
    uiState.selectedColor = button.dataset.color;
    bindActiveControls();
  }
  if (action === "product-qty") {
    uiState.productQty = Math.max(1, uiState.productQty + Number(button.dataset.delta));
    bindActiveControls();
  }
  if (action === "add-configured-cart") addToCart(button.dataset.id, uiState.productQty, uiState.selectedSize, uiState.selectedColor);
  if (action === "buy-now") {
    addToCart(button.dataset.id, uiState.productQty, uiState.selectedSize, uiState.selectedColor);
    window.location.hash = "#/checkout";
  }
  if (action === "update-cart-qty") {
    const user = requireUser();
    if (!user) return;
    const cart = state.cartByUser[user.id] || [];
    const item = cart.find((entry) => entry.id === button.dataset.cartId);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + Number(button.dataset.delta));
    saveState();
    renderApp();
  }
  if (action === "remove-cart-item") {
    const user = requireUser();
    if (!user) return;
    state.cartByUser[user.id] = (state.cartByUser[user.id] || []).filter((entry) => entry.id !== button.dataset.cartId);
    saveState();
    renderApp();
  }
  if (action === "logout") {
    state.sessions.currentUserId = null;
    saveState();
    updateHeader();
    showToast("Logged out.");
    window.location.hash = "#/home";
  }
  if (action === "apply-filters") {
    const category = document.getElementById("filter-category").value;
    const tag = document.getElementById("filter-tag").value;
    const sort = document.getElementById("filter-sort").value;
    const search = document.getElementById("filter-search").value.trim();
    window.location.hash = `#/shop?category=${encodeURIComponent(category)}&tag=${encodeURIComponent(tag)}&sort=${encodeURIComponent(sort)}&search=${encodeURIComponent(search)}&page=1`;
  }
  if (action === "paginate") {
    const params = getQueryParams();
    params.set("page", button.dataset.page);
    window.location.hash = `#/shop?${params.toString()}`;
  }
  if (action === "delete-product") {
    state.products = state.products.filter((product) => product.id !== button.dataset.productId);
    Object.keys(state.cartByUser).forEach((userId) => {
      state.cartByUser[userId] = (state.cartByUser[userId] || []).filter((entry) => entry.productId !== button.dataset.productId);
    });
    Object.keys(state.wishlistByUser).forEach((userId) => {
      state.wishlistByUser[userId] = (state.wishlistByUser[userId] || []).filter((id) => id !== button.dataset.productId);
    });
    saveState();
    showToast("Product deleted.");
    renderApp();
  }
  if (action === "delete-user") {
    state.users = state.users.filter((user) => user.id !== button.dataset.userId);
    delete state.cartByUser[button.dataset.userId];
    delete state.wishlistByUser[button.dataset.userId];
    state.orders = state.orders.filter((order) => order.userId !== button.dataset.userId);
    saveState();
    showToast("User deleted.");
    renderApp();
  }
  if (action === "delete-category") {
    const category = button.dataset.category;
    const inUse = state.products.some((product) => product.category === category);
    if (inUse) {
      showToast("Delete or move products before removing the category.");
      return;
    }
    state.categories = state.categories.filter((entry) => entry !== category);
    saveState();
    renderApp();
  }
  if (action === "advance-order") {
    const order = state.orders.find((entry) => entry.id === button.dataset.orderId);
    if (!order) return;
    const statuses = ["Pending", "Paid", "Processing", "Delivered"];
    const index = statuses.indexOf(order.status);
    order.status = statuses[Math.min(statuses.length - 1, index + 1)];
    saveState();
    renderApp();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  event.preventDefault();

  if (form.id === "newsletter-form") {
    const email = document.getElementById("newsletter-email").value.trim();
    if (!email) return;
    state.newsletter.push({ email, createdAt: new Date().toISOString() });
    saveState();
    form.reset();
    showToast("Newsletter signup saved.");
  }

  if (form.id === "login-form") {
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;
    const user = state.users.find((entry) => entry.email.toLowerCase() === email && entry.password === password);
    if (!user) {
      showToast("Invalid login details.");
      return;
    }
    state.sessions.currentUserId = user.id;
    saveState();
    showToast("Welcome back.");
    window.location.hash = "#/profile";
  }

  if (form.id === "register-form") {
    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim().toLowerCase();
    const password = document.getElementById("register-password").value;
    const confirm = document.getElementById("register-confirm").value;
    if (password !== confirm) {
      showToast("Passwords do not match.");
      return;
    }
    if (state.users.some((user) => user.email.toLowerCase() === email)) {
      showToast("Email already exists.");
      return;
    }
    const user = { id: crypto.randomUUID(), name, email, password, role: "user", address: "" };
    state.users.push(user);
    state.sessions.currentUserId = user.id;
    saveState();
    showToast("Account created.");
    window.location.hash = "#/profile";
  }

  if (form.id === "review-form") {
    const productId = form.dataset.productId;
    const user = getCurrentUser();
    const rating = Number(document.getElementById("review-rating").value);
    const userName = document.getElementById("review-name").value.trim();
    const comment = document.getElementById("review-comment").value.trim();
    if (!comment) return;
    state.reviews.unshift(createReview(productId, user?.id || crypto.randomUUID(), userName, rating, comment));
    saveState();
    showToast("Review added.");
    renderApp();
  }

  if (form.id === "checkout-form") {
    const user = requireUser();
    if (!user) return;
    const totals = getCartTotals();
    const order = {
      id: crypto.randomUUID(),
      userId: user.id,
      customerName: document.getElementById("checkout-name").value.trim(),
      email: document.getElementById("checkout-email").value.trim(),
      phone: document.getElementById("checkout-phone").value.trim(),
      address: document.getElementById("checkout-address").value.trim(),
      country: document.getElementById("checkout-country").value.trim(),
      deliveryMethod: document.getElementById("checkout-delivery").value,
      paymentMethod: document.getElementById("checkout-payment").value,
      status: "Pending",
      total: totals.total,
      items: getExpandedCart().map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.product.price
      })),
      createdAt: new Date().toISOString()
    };
    state.orders.unshift(order);
    state.cartByUser[user.id] = [];
    user.address = order.address;
    saveState();
    showToast(`Order placed with ${order.paymentMethod}.`);
    window.location.hash = "#/profile";
  }

  if (form.id === "contact-form") {
    showToast("Message sent. We will reply soon.");
    form.reset();
  }

  if (form.id === "admin-product-form") {
    const product = {
      id: crypto.randomUUID(),
      name: document.getElementById("admin-product-name").value.trim(),
      category: document.getElementById("admin-product-category").value,
      price: Number(document.getElementById("admin-product-price").value),
      oldPrice: Number(document.getElementById("admin-product-old-price").value) || null,
      stock: Number(document.getElementById("admin-product-stock").value),
      tags: document.getElementById("admin-product-tags").value.split(",").map((entry) => entry.trim()).filter(Boolean),
      description: document.getElementById("admin-product-description").value.trim(),
      colors: document.getElementById("admin-product-colors").value.split(",").map((entry) => entry.trim()).filter(Boolean),
      sizes: document.getElementById("admin-product-sizes").value.split(",").map((entry) => entry.trim()).filter(Boolean),
      rating: 4.5,
      imageSeed: Math.floor(Math.random() * 360),
      createdAt: new Date().toISOString(),
      sales: 0
    };
    state.products.unshift(product);
    saveState();
    showToast("Product added.");
    form.reset();
    renderApp();
  }

  if (form.id === "admin-category-form") {
    const name = document.getElementById("admin-category-name").value.trim();
    if (name && !state.categories.includes(name)) {
      state.categories.push(name);
      saveState();
      renderApp();
      showToast("Category added.");
    }
  }
});

document.getElementById("global-search").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const search = event.target.value.trim();
  window.location.hash = `#/shop?category=All&tag=all&sort=featured&search=${encodeURIComponent(search)}&page=1`;
});

window.addEventListener("hashchange", renderApp);

if (!window.location.hash) {
  window.location.hash = "#/home";
} else {
  renderApp();
}
