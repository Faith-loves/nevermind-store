const state = {
  token: localStorage.getItem("nevermind-token") || "",
  user: null,
  settings: null,
  categories: [],
  cart: { items: [], subtotal: 0, shipping: 0, total: 0 },
  wishlist: [],
  shopCache: null,
  ui: {
    selectedSize: "M",
    selectedColor: "Black",
    quantity: 1,
    editingProductId: null,
    searchTimer: null
  }
};

const visualAssets = {
  hero: [
    "/catalog/men-grey-palm-resort-set.jpeg",
    "/catalog/women-pink-rose-slip-dress.jpeg",
    "/catalog/men-ivory-regal-double-breasted-suit.jpeg",
    "/catalog/women-burgundy-ribbed-mermaid-dress.jpeg"
  ],
  mission: "/catalog/men-white-palm-vacation-set.jpeg",
  vision: "/catalog/women-ivory-petal-maxi-dress.jpeg",
  feature: "/catalog/men-sand-tribal-resort-suit.jpeg"
};

const app = document.getElementById("app");
const toast = document.getElementById("toast");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");

bootstrap().catch(handleError);

async function bootstrap() {
  const bootstrapData = await api("/api/bootstrap");
  state.settings = bootstrapData.settings;
  state.user = bootstrapData.session;
  await refreshReferenceData();
  bindGlobalEvents();
  route();
}

async function refreshReferenceData() {
  const categories = await api("/api/categories");
  state.categories = categories.categories || [];
  if (state.user) {
    state.cart = await api("/api/cart", { auth: true });
    const wishlist = await api("/api/wishlist", { auth: true });
    state.wishlist = wishlist.items || [];
  } else {
    state.cart = { items: [], subtotal: 0, shipping: 0, total: 0 };
    state.wishlist = [];
  }
  renderHeaderState();
}

function bindGlobalEvents() {
  window.addEventListener("hashchange", route);
  document.addEventListener("click", handleClicks);
  document.addEventListener("click", handleRouteNavigation);
  document.addEventListener("submit", handleSubmit);
  document.getElementById("global-search").addEventListener("input", handleSearchSuggest);
  document.getElementById("global-search").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const query = event.target.value.trim();
    closeSuggestions();
    window.location.hash = `#/shop?search=${encodeURIComponent(query)}`;
  });
}

function handleRouteNavigation(event) {
  const link = event.target.closest('a[href^="#/"]');
  if (!link) return;
  const targetHash = link.getAttribute("href");
  if (!targetHash) return;
  event.preventDefault();
  if (window.location.hash === targetHash) {
    route();
    return;
  }
  window.location.hash = targetHash;
}

function route() {
  renderHeaderState();
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  const routeName = getRoute();
  if (routeName === "/home") return renderHome();
  if (routeName === "/shop") return renderShop();
  if (routeName.startsWith("/product/")) return renderProduct(routeName.split("/")[2]);
  if (routeName === "/cart") return renderCart();
  if (routeName === "/checkout") return renderCheckout();
  if (routeName === "/login") return renderLogin();
  if (routeName === "/register") return renderRegister();
  if (routeName === "/profile") return state.user ? renderProfile() : renderLocked("Please log in to open your account.");
  if (routeName === "/orders") return state.user ? renderOrders() : renderLocked("Please log in to view your orders.");
  if (routeName === "/wishlist") return renderWishlist();
  if (routeName === "/about") return renderAbout();
  if (routeName === "/contact") return renderContact();
  if (routeName === "/admin") return state.user?.role === "admin" ? renderAdmin() : renderLocked("Admin access only.");
  return renderHome();
}

function renderHeaderState() {
  document.getElementById("account-link").textContent = state.user ? state.user.name.split(" ")[0] : "Account";
  document.getElementById("account-link").href = state.user ? "#/profile" : "#/login";
  document.getElementById("cart-count").textContent = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("wishlist-count").textContent = state.wishlist.length;
}

function getRoute() {
  const hash = window.location.hash || "#/home";
  return hash.slice(1).split("?")[0] || "/home";
}

function getParams() {
  const hash = window.location.hash || "#/home";
  const query = hash.includes("?") ? hash.split("?")[1] : "";
  return new URLSearchParams(query);
}

async function renderHome() {
  const featured = await api("/api/products?page=1&pageSize=4&tag=featured");
  app.innerHTML = `
    <div class="page-stack">
      <section class="hero hero-reference">
        <div class="hero-visual hero-lookbook">
          <div class="hero-photo-grid hero-photo-grid-lookbook">
            ${visualAssets.hero.map((src, index) => `
              <a class="hero-photo hero-photo-lookbook ${index === 1 ? "hero-photo-accent" : ""}" href="#/shop" style="background-image:linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18)), url('${src}')"></a>
            `).join("")}
          </div>
          <div class="hero-overlay-copy hero-overlay-copy-lookbook">
            <h1 class="hero-title">STYLE<br>VIBE<br>REFLECT</h1>
            <p class="hero-copy">Discover standout men’s and women’s looks curated for soft glam nights, polished days, and bold everyday style.</p>
            <a class="btn hero-shop" href="#/shop">Shop now</a>
          </div>
        </div>
      </section>
      <section>
        <div class="section-header section-header-center">
          <div>
            <h2 class="section-title">Designed To Disrupt</h2>
            <p class="section-copy section-copy-tight">Luxury staples for the modern disruptor. Precision-tailored pieces that blend comfort and presence.</p>
          </div>
        </div>
        <div class="product-grid">${featured.items.map(productCard).join("")}</div>
      </section>
      <div class="ticker">
        <span>Limited edition</span><span>New arrival</span><span>Low stock</span>
        <span>Worldwide dispatch</span><span>Secure checkout</span><span>Wishlist enabled</span>
      </div>
      <section class="story-grid">
        <article class="story-card">
          <h2>Our Mission</h2>
          <p class="section-copy section-copy-small">Pair text with an image to focus on your chosen product, collection, or store. Add details on availability, style, or even provide a review.</p>
          <a class="btn spaced" href="#/shop">Learn more</a>
        </article>
        <div class="story-image" style="background-image:linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.24)), url('${visualAssets.mission}')"></div>
        <div class="story-image" style="background-image:linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.24)), url('${visualAssets.vision}')"></div>
        <article class="story-card">
          <h2>Our Vision</h2>
          <p class="section-copy section-copy-small">Pair text with an image to focus on your chosen product, collection, or store. Add details on availability, style, or even provide a review.</p>
          <a class="btn spaced" href="#/contact">Learn more</a>
        </article>
      </section>
    </div>
  `;
}

async function renderShop() {
  const params = getParams();
  const category = params.get("category") || "All";
  const tag = params.get("tag") || "all";
  const size = params.get("size") || "all";
  const color = params.get("color") || "all";
  const sort = params.get("sort") || "featured";
  const priceMin = params.get("priceMin") || "0";
  const priceMax = params.get("priceMax") || "1000000";
  const search = params.get("search") || "";
  const page = Number(params.get("page") || 1);
  const result = await api(`/api/products?category=${encodeURIComponent(category)}&tag=${encodeURIComponent(tag)}&size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}&sort=${encodeURIComponent(sort)}&priceMin=${encodeURIComponent(priceMin)}&priceMax=${encodeURIComponent(priceMax)}&search=${encodeURIComponent(search)}&page=${page}&pageSize=6`);
  state.shopCache = result;
  app.innerHTML = `
    <div class="page-stack">
      <section class="section-header">
        <div><p class="section-kicker">Catalog</p><h1 class="section-title">Shop The Collection</h1><p class="section-copy">Filter by category, price, size, color, and tag. Sort by newest, best sellers, and price.</p></div>
      </section>
      <section class="shop-layout">
        <aside class="sidebar">
          <div class="filter-group"><label>Category</label><select id="filter-category">${["All", ...state.categories].map((entry) => `<option ${entry === category ? "selected" : ""}>${entry}</option>`).join("")}</select></div>
          <div class="filter-group"><label>Collection</label><select id="filter-tag">${optionMap(["all", "new", "featured", "sale", "limited"], tag)}</select></div>
          <div class="filter-group"><label>Size</label><select id="filter-size">${optionMap(["all", "S", "M", "L", "XL", "One Size"], size)}</select></div>
          <div class="filter-group"><label>Color</label><select id="filter-color">${optionMap(["all", "Black", "Ash", "Olive", "Wine", "Stone", "Bone", "Gold", "Graphite"], color)}</select></div>
          <div class="form-grid">
            <div class="field"><label>Min price</label><input id="filter-price-min" type="number" value="${priceMin}"></div>
            <div class="field"><label>Max price</label><input id="filter-price-max" type="number" value="${priceMax}"></div>
          </div>
          <div class="filter-group"><label>Sort</label><select id="filter-sort">${optionMap(["featured", "newest", "best-sellers", "price-asc", "price-desc"], sort)}</select></div>
          <div class="filter-group"><label>Search</label><input id="filter-search" value="${escapeHtml(search)}"></div>
          <button class="btn" data-action="apply-shop-filters">Apply filters</button>
        </aside>
        <div class="content-panel">
          <div class="toolbar"><p class="muted">${result.total} product(s) found</p><div class="tag-row"><span class="tag">Search</span><span class="tag">Sort</span><span class="tag">Filters</span></div></div>
          <div class="product-listing spaced">${result.items.length ? result.items.map(productCard).join("") : emptyInline("No products match your filter.")}</div>
          <div class="toolbar spaced">
            <button class="btn-ghost" data-page="${Math.max(1, page - 1)}" data-action="shop-page">Previous</button>
            <p class="muted">Page ${result.page} of ${Math.max(1, Math.ceil(result.total / result.pageSize))}</p>
            <button class="btn-ghost" data-page="${Math.min(Math.max(1, Math.ceil(result.total / result.pageSize)), page + 1)}" data-action="shop-page">Next</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

async function renderProduct(productId) {
  const { product, reviews, related } = await api(`/api/products/${productId}`);
  if (!product.sizes.includes(state.ui.selectedSize)) state.ui.selectedSize = product.sizes[0] || "M";
  if (!product.colors.includes(state.ui.selectedColor)) state.ui.selectedColor = product.colors[0] || "Black";
  if (!state.ui.quantity) state.ui.quantity = 1;
  const images = product.images.length ? product.images : ["gradient", "gradient-2", "gradient-3"];
  app.innerHTML = `
    <div class="page-stack">
      <section class="product-detail-layout">
        <div class="product-gallery">
          ${images.map((image, index) => galleryTile(product, image, index === 0)).join("")}
        </div>
        <article class="product-detail">
          <p class="section-kicker">${escapeHtml(product.category)}</p>
          <h1>${escapeHtml(product.name)}</h1>
          <div class="price-row">
            <strong class="price">${money(product.price)}</strong>
            ${product.oldPrice ? `<span class="old-price">${money(product.oldPrice)}</span>` : ""}
            <span class="pill">Rating ${product.rating}</span>
            <span class="pill ${product.stock ? "" : "danger"}">${product.stock ? `${product.stock} in stock` : "Out of stock"}</span>
          </div>
          <p class="section-copy">${escapeHtml(product.description)}</p>
          <div class="field"><label>Sizes</label><div class="size-grid">${product.sizes.map((entry) => selector("size", entry, entry === state.ui.selectedSize)).join("")}</div></div>
          <div class="field"><label>Colors</label><div class="color-grid">${product.colors.map((entry) => selector("color", entry, entry === state.ui.selectedColor)).join("")}</div></div>
          <div class="field"><label>Quantity</label><div class="qty-control"><button class="qty-button" data-action="qty" data-delta="-1">-</button><span class="qty-value">${state.ui.quantity}</span><button class="qty-button" data-action="qty" data-delta="1">+</button></div></div>
          <div class="inline-actions spaced">
            <button class="btn" ${product.stock ? "" : "disabled"} data-action="cart-add" data-product-id="${product.id}">Add to cart</button>
            <button class="btn-secondary" ${product.stock ? "" : "disabled"} data-action="buy-now" data-product-id="${product.id}">Buy now</button>
            <button class="btn-ghost" data-action="wishlist-toggle" data-product-id="${product.id}">${isWishlisted(product.id) ? "Saved" : "Wishlist"}</button>
          </div>
          <div class="feature-pills spaced"><span class="pill">Zoom gallery</span><span class="pill">Related products</span><span class="pill">Reviews</span></div>
        </article>
      </section>
      <section>
        <div class="section-header"><div><p class="section-kicker">Reviews</p><h2 class="section-title">Customer Feedback</h2></div></div>
        <div class="review-list">${reviews.length ? reviews.map(reviewCard).join("") : emptyInline("No reviews yet.")}</div>
        <form id="review-form" class="panel spaced" data-product-id="${product.id}">
          <div class="form-grid">
            <div class="field"><label>Rating</label><select id="review-rating">${optionMap(["5", "4", "3", "2", "1"], "5")}</select></div>
            <div class="field"><label>Name</label><input id="review-name" value="${escapeHtml(state.user?.name || "")}" required></div>
          </div>
          <div class="field"><label>Comment</label><textarea id="review-comment" required></textarea></div>
          <button class="btn" type="submit">Add review</button>
        </form>
      </section>
      <section>
        <div class="section-header"><div><p class="section-kicker">Related products</p><h2 class="section-title">You May Also Like</h2></div></div>
        <div class="product-grid">${related.map(productCard).join("")}</div>
      </section>
    </div>
  `;
}

async function renderCart() {
  if (!state.user) {
    state.cart = { items: [], subtotal: 0, shipping: 0, total: 0 };
  } else {
    state.cart = await api("/api/cart", { auth: true });
  }
  app.innerHTML = `
    <div class="page-stack">
      <section class="section-header">
        <div>
          <p class="section-kicker">Cart</p>
          <h1 class="section-title">Your Bag</h1>
          <p class="section-copy section-copy-small">Review sizes, adjust quantities, and move straight into checkout when everything looks right.</p>
        </div>
        <a class="btn-secondary" href="#/shop">Continue shopping</a>
      </section>
      ${state.user && state.cart.items.length ? `
        <section class="cart-layout">
          <div class="cart-list">
            ${state.cart.items.map((item) => `
              <article class="cart-item">
                ${mediaBlock(item.product, "cart-thumb")}
                <div>
                  <strong>${escapeHtml(item.product.name)}</strong>
                  <p class="muted">${escapeHtml(item.size)} / ${escapeHtml(item.color)}</p>
                  <p class="muted">${money(item.product.price)} each</p>
                  <div class="qty-control">
                    <button class="qty-button" data-action="cart-qty" data-id="${item.id}" data-delta="-1">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-button" data-action="cart-qty" data-id="${item.id}" data-delta="1">+</button>
                  </div>
                </div>
                <div>
                  <strong>${money(item.product.price * item.quantity)}</strong>
                  <div class="spaced inline-actions">
                    <a class="btn-ghost" href="#/product/${item.product.id}">View item</a>
                    <button class="btn-ghost" data-action="cart-remove" data-id="${item.id}">Remove</button>
                  </div>
                </div>
              </article>
            `).join("")}
          </div>
          <aside class="cart-summary">
            <div class="summary-box">
              <p class="micro-label">Ready when you are</p>
              <h2>Checkout summary</h2>
              <div class="summary-row"><span>Subtotal</span><strong>${money(state.cart.subtotal)}</strong></div>
              <div class="summary-row"><span>Shipping</span><strong>${money(state.cart.shipping)}</strong></div>
              <div class="summary-row"><span>Total</span><strong>${money(state.cart.total)}</strong></div>
              <a class="btn" href="#/checkout">Proceed to checkout</a>
              <a class="btn-secondary" href="#/wishlist">Review wishlist</a>
            </div>
          </aside>
        </section>
      ` : `
        <section class="empty-state">
          <p class="section-kicker">Cart</p>
          <h2>${state.user ? "Your cart is empty" : "Your cart is waiting"}</h2>
          <p class="muted">${state.user ? "Add pieces from the shop or move saved items over from your wishlist before checking out." : "Sign in to save items in your cart and continue to checkout."}</p>
          <div class="inline-actions spaced">
            <a class="btn" href="#/shop">Go to shop</a>
            <a class="btn-secondary" href="${state.user ? "#/wishlist" : "#/login"}">${state.user ? "Open wishlist" : "Login"}</a>
          </div>
        </section>
      `}
    </div>
  `;
  renderHeaderState();
}

async function renderCheckout() {
  if (!state.user) {
    app.innerHTML = `
      <section class="empty-state">
        <p class="section-kicker">Checkout</p>
        <h2>Login to continue</h2>
        <p class="muted">Open your cart, sign in, and then complete your order here.</p>
        <div class="inline-actions spaced">
          <a class="btn" href="#/login">Login</a>
          <a class="btn-secondary" href="#/cart">Open cart</a>
        </div>
      </section>
    `;
    return;
  }
  state.cart = await api("/api/cart", { auth: true });
  if (!state.cart.items.length) {
    app.innerHTML = `
      <section class="empty-state">
        <p class="section-kicker">Checkout</p>
        <h2>Your cart is empty</h2>
        <p class="muted">You need at least one item in your cart before you can place an order.</p>
        <div class="inline-actions spaced">
          <a class="btn" href="#/shop">Shop now</a>
          <a class="btn-secondary" href="#/wishlist">Open wishlist</a>
        </div>
      </section>
    `;
    return;
  }
  const paymentOptions = state.settings.features;
  app.innerHTML = `
    <div class="page-stack">
      <section class="section-header">
        <div>
          <p class="section-kicker">Checkout</p>
          <h1 class="section-title">Complete Your Order</h1>
          <p class="section-copy section-copy-small">Your wishlist feeds the cart, and the cart feeds this page. Confirm delivery details and place the order here.</p>
        </div>
        <a class="btn-secondary" href="#/cart">Back to cart</a>
      </section>
      <section class="checkout-layout">
        <form id="checkout-form" class="content-panel">
          <div class="form-grid">
            <div class="field"><label>Name</label><input id="checkout-name" value="${escapeHtml(state.user.name)}" required></div>
            <div class="field"><label>Email</label><input id="checkout-email" type="email" value="${escapeHtml(state.user.email)}" required></div>
            <div class="field"><label>Phone</label><input id="checkout-phone" required></div>
            <div class="field"><label>Country</label><input id="checkout-country" value="Nigeria" required></div>
          </div>
          <div class="field"><label>Address</label><textarea id="checkout-address" required>${escapeHtml(state.user.address || "")}</textarea></div>
          <div class="form-grid">
            <div class="field"><label>Delivery method</label><select id="checkout-delivery">${optionMap(["Standard Delivery", "Express Delivery", "Store Pickup"], "Standard Delivery")}</select></div>
            <div class="field"><label>Payment method</label><select id="checkout-payment">${optionMap(["Paystack", "Flutterwave", "Stripe", "PayPal"], "Paystack")}</select></div>
          </div>
          <p class="muted">Gateway mode: ${state.settings.paymentMode}. Configured providers: ${Object.entries(paymentOptions).filter(([key, value]) => key !== "smtp" && value).map(([key]) => key).join(", ") || "none"}</p>
          <button class="btn" type="submit">Place order</button>
        </form>
        <aside class="checkout-summary">
          <div class="summary-box">
            ${state.cart.items.map((item) => `<div class="summary-row"><span>${escapeHtml(item.product.name)} x${item.quantity}</span><strong>${money(item.product.price * item.quantity)}</strong></div>`).join("")}
            <div class="divider"></div>
            <div class="summary-row"><span>Subtotal</span><strong>${money(state.cart.subtotal)}</strong></div>
            <div class="summary-row"><span>Shipping</span><strong>${money(state.cart.shipping)}</strong></div>
            <div class="summary-row"><span>Total</span><strong>${money(state.cart.total)}</strong></div>
          </div>
        </aside>
      </section>
    </div>
  `;
}

function renderLogin() {
  app.innerHTML = `
    <section class="auth-screen">
      <article class="auth-panel auth-panel-single">
        <p class="section-kicker">Account</p>
        <h1 class="section-title">Login</h1>
        <p class="section-copy section-copy-small">Sign in to add to cart, save wishlist items, and continue to checkout.</p>
        <form id="login-form">
          <div class="field"><label>Email</label><input id="login-email" type="email" required></div>
          <div class="field"><label>Password</label><input id="login-password" type="password" required></div>
          <button class="btn auth-submit" type="submit">Login</button>
        </form>
        <p class="auth-switch">No account yet? <a href="#/register">Create one here</a></p>
      </article>
    </section>
  `;
}

function renderRegister() {
  app.innerHTML = `
    <section class="auth-screen">
      <article class="auth-panel auth-panel-single">
        <p class="section-kicker">Register</p>
        <h1 class="section-title">Create Account</h1>
        <p class="section-copy section-copy-small">Create your profile so your cart, orders, and wishlist stay connected to you.</p>
        <form id="register-form">
          <div class="field"><label>Name</label><input id="register-name" required></div>
          <div class="field"><label>Email</label><input id="register-email" type="email" required></div>
          <div class="field"><label>Password</label><input id="register-password" type="password" required></div>
          <div class="field"><label>Confirm password</label><input id="register-confirm" type="password" required></div>
          <button class="btn auth-submit" type="submit">Register</button>
        </form>
        <p class="auth-switch">Already registered? <a href="#/login">Login here</a></p>
      </article>
    </section>
  `;
}

async function renderProfile() {
  const [orders, wishlist, cart] = await Promise.all([
    api("/api/orders", { auth: true }),
    api("/api/wishlist", { auth: true }),
    api("/api/cart", { auth: true })
  ]);
  app.innerHTML = `
    <div class="page-stack">
      <section class="section-header"><div><p class="section-kicker">Dashboard</p><h1 class="section-title">My Account</h1></div><button class="btn-ghost" data-action="logout">Logout</button></section>
      <section class="dashboard-grid">
        <article class="dashboard-card"><h2>My Profile</h2><p class="muted">${escapeHtml(state.user.name)}</p><p class="muted">${escapeHtml(state.user.email)}</p><p class="muted">${escapeHtml(state.user.address || "No address saved")}</p></article>
        <article class="dashboard-card">
          <h2>My Orders</h2>
          ${orders.orders.length ? `<table class="table"><thead><tr><th>Order</th><th>Status</th><th>Total</th></tr></thead><tbody>${orders.orders.map(orderRow).join("")}</tbody></table>` : `<p class="muted">No orders yet.</p>`}
          <div class="spaced"><a class="btn-secondary" href="#/orders">View all orders</a></div>
        </article>
        <article class="dashboard-card">
          <h2>Wishlist</h2>
          ${wishlist.items.length ? wishlist.items.map((item) => `<div class="list-row"><span>${escapeHtml(item.name)}</span><a class="btn-ghost" href="#/product/${item.id}">Open</a></div>`).join('<div class="divider"></div>') : `<p class="muted">Wishlist is empty.</p>`}
          <div class="spaced"><a class="btn-secondary" href="#/wishlist">Open wishlist</a></div>
        </article>
        <article class="dashboard-card">
          <h2>My Cart</h2>
          ${cart.items.length ? cart.items.map((item) => `<div class="list-row"><span>${escapeHtml(item.product.name)} x${item.quantity}</span><strong>${money(item.product.price * item.quantity)}</strong></div>`).join('<div class="divider"></div>') : `<p class="muted">Cart is empty.</p>`}
          <div class="divider"></div>
          <div class="list-row"><span>Total</span><strong>${money(cart.total)}</strong></div>
          <div class="spaced"><a class="btn-secondary" href="#/cart">Open cart</a></div>
        </article>
      </section>
    </div>
  `;
}

async function renderOrders() {
  const orders = await api("/api/orders", { auth: true });
  app.innerHTML = `
    <div class="page-stack">
      <section class="section-header"><div><p class="section-kicker">Orders</p><h1 class="section-title">Order History</h1></div></section>
      <section class="content-panel">
        ${orders.orders.length ? `<table class="table"><thead><tr><th>Order ID</th><th>Date</th><th>Payment</th><th>Status</th><th>Total</th></tr></thead><tbody>${orders.orders.map((order) => `
          <tr>
            <td>${order.id}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>${escapeHtml(order.paymentMethod)} / ${escapeHtml(order.paymentStatus)}</td>
            <td>${escapeHtml(order.status)}</td>
            <td>${money(order.total)}</td>
          </tr>`).join("")}</tbody></table>` : `<p class="muted">No orders yet.</p>`}
      </section>
    </div>
  `;
}

async function renderWishlist() {
  if (!state.user) {
    state.wishlist = [];
    app.innerHTML = `
      <section class="empty-state">
        <p class="section-kicker">Wishlist</p>
        <h2>Login to use your wishlist</h2>
        <p class="muted">Save your favorite items here and move them into your cart when you're ready.</p>
        <div class="inline-actions spaced">
          <a class="btn" href="#/login">Login</a>
          <a class="btn-secondary" href="#/shop">Browse the shop</a>
        </div>
      </section>
    `;
    renderHeaderState();
    return;
  }
  const wishlist = await api("/api/wishlist", { auth: true });
  state.wishlist = wishlist.items;
  app.innerHTML = `
    <div class="page-stack">
      <section class="section-header">
        <div>
          <p class="section-kicker">Saved items</p>
          <h1 class="section-title">Wishlist</h1>
          <p class="section-copy section-copy-small">Keep favorites here, then move them into your bag when you're ready to check out.</p>
        </div>
        <a class="btn-secondary" href="#/cart">Open cart</a>
      </section>
      ${wishlist.items.length ? `
        <section class="cart-layout">
          <div class="cart-list">
            ${wishlist.items.map((item) => `
              <article class="cart-item">
                ${mediaBlock(item, "cart-thumb")}
                <div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <p class="muted">${escapeHtml(item.category)} • ${money(item.price)}</p>
                  <p class="muted">Default option: ${escapeHtml(item.sizes?.[0] || "One Size")} / ${escapeHtml(item.colors?.[0] || "Default")}</p>
                </div>
                <div class="inline-actions spaced">
                  <a class="btn-ghost" href="#/product/${item.id}">View item</a>
                  <button
                    class="btn"
                    ${item.stock ? "" : "disabled"}
                    data-action="wishlist-move-to-cart"
                    data-product-id="${item.id}"
                    data-size="${escapeHtml(item.sizes?.[0] || "One Size")}"
                    data-color="${escapeHtml(item.colors?.[0] || "Default")}"
                  >
                    ${item.stock ? "Move to cart" : "Out of stock"}
                  </button>
                  <button class="btn-ghost" data-action="wishlist-remove" data-product-id="${item.id}">Remove</button>
                </div>
              </article>
            `).join("")}
          </div>
          <aside class="cart-summary">
            <div class="summary-box">
              <p class="micro-label">Saved for later</p>
              <h2>${wishlist.items.length} item(s) saved</h2>
              <p class="muted">Move any item into your cart to start checkout. Your cart total updates automatically.</p>
              <a class="btn" href="#/cart">Go to cart</a>
              <a class="btn-secondary" href="#/shop">Keep browsing</a>
            </div>
          </aside>
        </section>
      ` : `
        <section class="empty-state">
          <p class="section-kicker">Wishlist</p>
          <h2>Your wishlist is empty</h2>
          <p class="muted">Save standout pieces first, then move them into your cart whenever you're ready to order.</p>
          <div class="inline-actions spaced">
            <a class="btn" href="#/shop">Browse the shop</a>
            <a class="btn-secondary" href="#/cart">Open cart</a>
          </div>
        </section>
      `}
    </div>
  `;
  renderHeaderState();
}

function renderAbout() {
  app.innerHTML = `
    <section class="page-stack">
      <section class="hero hero-reference">
        <div class="hero-visual hero-lookbook">
          <div class="hero-photo-grid hero-photo-grid-lookbook">
            <div class="hero-photo hero-photo-lookbook" style="background-image:linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.3)), url('${visualAssets.feature}')"></div>
            <div class="hero-photo hero-photo-lookbook" style="background-image:linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.3)), url('${visualAssets.mission}')"></div>
          </div>
          <div class="hero-overlay-copy hero-overlay-copy-lookbook">
            <p class="eyebrow">About Nevermind</p>
            <h1 class="hero-title">DESIGNED<br>FOR<br>PRESENCE</h1>
            <p class="hero-copy">We build sharp dark essentials for men and women who want fashion with structure, ease, and a little attitude.</p>
          </div>
        </div>
      </section>
      <article class="story-card">
        <p class="section-kicker">Our Story</p>
        <h1 class="section-title">More Than A Storefront</h1>
        <p class="section-copy">Nevermind Studio was shaped around a clear idea: luxury streetwear should feel cinematic, wearable, and disciplined. Every release is built around clean silhouettes, confident textures, and a modern dark visual language.</p>
      </article>
      <section class="story-grid">
        <article class="story-card">
          <h2>Brand Direction</h2>
          <p class="section-copy section-copy-small">Editorial, dark, refined, and product-led. We use contrast, tailored cuts, premium textures, and strong posture to create looks that feel expensive without excess noise.</p>
        </article>
        <div class="story-image" style="background-image:linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.28)), url('${visualAssets.mission}')"></div>
        <div class="story-image" style="background-image:linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.28)), url('${visualAssets.vision}')"></div>
        <article class="story-card">
          <h2>What We Make</h2>
          <p class="section-copy section-copy-small">Our catalog covers men’s and women’s drops across hoodies, dresses, jackets, shirts, tailored sets, outerwear, and statement essentials. Every page now carries a fuller lineup, not a thin placeholder selection.</p>
        </article>
      </section>
      <section class="story-grid">
        <article class="story-card">
          <h2>Craft & Mood</h2>
          <p class="section-copy section-copy-small">The brand lives in fitted structure, premium fleece, quiet hardware, precise hems, monochrome palettes, and bold silhouettes that feel powerful in motion.</p>
        </article>
        <article class="story-card">
          <h2>Customer Experience</h2>
          <p class="section-copy section-copy-small">From home to checkout, the experience is meant to feel intentional: strong imagery, organized categories, clear navigation, saved wishlist flow, and a cleaner path into the clothes themselves.</p>
        </article>
      </section>
    </section>
  `;
}

function renderContact() {
  app.innerHTML = `
    <section class="page-stack">
      <section class="contact-grid">
        <article class="contact-card panel">
          <p class="section-kicker">Contact</p>
          <h1 class="section-title">Reach The Studio</h1>
          <form id="contact-form">
            <div class="form-grid">
              <div class="field"><label>Name</label><input id="contact-name" required></div>
              <div class="field"><label>Email</label><input id="contact-email" type="email" required></div>
            </div>
            <div class="field"><label>Message</label><textarea id="contact-message" required></textarea></div>
            <button class="btn" type="submit">Send</button>
          </form>
        </article>
        <article class="contact-card panel">
          <h2>Store Details</h2>
          <p class="muted">Lagos, Nigeria</p>
          <p class="muted">hello@nevermindstudio.com</p>
          <p class="muted">Orders generate confirmation files in the local outbox. SMTP can be enabled with credentials.</p>
          <div class="feature-pills spaced"><span class="pill">Paystack</span><span class="pill">Flutterwave</span><span class="pill">Stripe</span><span class="pill">PayPal</span></div>
        </article>
      </section>
    </section>
  `;
}

async function renderAdmin() {
  const [analytics, products, orders, users] = await Promise.all([
    api("/api/admin/analytics", { auth: true }),
    api("/api/products?page=1&pageSize=50"),
    api("/api/orders", { auth: true }),
    api("/api/admin/users", { auth: true })
  ]);
  const editingProduct = products.items.find((entry) => entry.id === state.ui.editingProductId) || null;
  state.ui.editingImages = editingProduct?.images || [];
  const topSelling = [...products.items].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);
  const lowStock = products.items.filter((product) => product.stock > 0 && product.stock <= 5).slice(0, 6);
  const recentOrders = orders.orders.slice(0, 6);
  app.innerHTML = `
    <div class="page-stack">
      <section class="section-header">
        <div>
          <p class="section-kicker">Admin</p>
          <h1 class="section-title">Operations Dashboard</h1>
          <p class="section-copy section-copy-small">Track what is in stock, what has sold, which orders just came in, and where the store needs attention.</p>
        </div>
      </section>
      <section class="metric-grid">
        <article class="metric-card"><p class="micro-label">Products</p><strong>${analytics.totalProducts}</strong></article>
        <article class="metric-card"><p class="micro-label">Orders</p><strong>${analytics.totalOrders}</strong></article>
        <article class="metric-card"><p class="micro-label">Users</p><strong>${analytics.totalUsers}</strong></article>
        <article class="metric-card"><p class="micro-label">Revenue</p><strong>${money(analytics.revenue)}</strong></article>
        <article class="metric-card"><p class="micro-label">Units In Stock</p><strong>${analytics.totalStockUnits}</strong></article>
        <article class="metric-card"><p class="micro-label">Units Sold</p><strong>${analytics.totalSoldUnits}</strong></article>
        <article class="metric-card"><p class="micro-label">Low Stock</p><strong>${analytics.lowStockCount}</strong></article>
        <article class="metric-card"><p class="micro-label">Out Of Stock</p><strong>${analytics.outOfStockCount}</strong></article>
        <article class="metric-card"><p class="micro-label">Inventory Value</p><strong>${money(analytics.inventoryValue)}</strong></article>
        <article class="metric-card"><p class="micro-label">Pending Orders</p><strong>${analytics.pendingOrders}</strong></article>
        <article class="metric-card"><p class="micro-label">Failed Payments</p><strong>${analytics.failedPayments}</strong></article>
        <article class="metric-card"><p class="micro-label">Newsletter</p><strong>${analytics.newsletterSignups}</strong></article>
      </section>
      <section class="admin-grid">
        <article class="admin-panel">
          <p class="section-kicker">Sales pulse</p>
          <h2>Top Selling Products</h2>
          ${topSelling.length ? topSelling.map((product) => `
            <div class="list-row">
              <span>${escapeHtml(product.name)}</span>
              <strong>${product.sales || 0} sold</strong>
            </div>
          `).join('<div class="divider"></div>') : `<p class="muted">No sales yet.</p>`}
        </article>
        <article class="admin-panel">
          <p class="section-kicker">Stock watch</p>
          <h2>Low Stock Alerts</h2>
          ${lowStock.length ? lowStock.map((product) => `
            <div class="list-row">
              <span>${escapeHtml(product.name)}</span>
              <strong>${product.stock} left</strong>
            </div>
          `).join('<div class="divider"></div>') : `<p class="muted">Nothing is running low right now.</p>`}
        </article>
      </section>
      <section class="admin-panel">
        <p class="section-kicker">Recent purchases</p>
        <h2>Latest Customer Orders</h2>
        ${recentOrders.length ? `<table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>${recentOrders.map((order) => `
          <tr>
            <td>${order.id}</td>
            <td>${escapeHtml(order.customerName)}</td>
            <td>${order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
            <td>${money(order.total)}</td>
            <td>${escapeHtml(order.status)}</td>
          </tr>
        `).join("")}</tbody></table>` : `<p class="muted">No purchases yet.</p>`}
      </section>
      <section class="admin-grid">
        <article class="admin-panel">
            <p class="section-kicker">Product editor</p>
            <h2>${state.ui.editingProductId ? "Edit Product" : "Add Product"}</h2>
            ${adminProductForm(editingProduct)}
        </article>
        <article class="admin-panel">
          <p class="section-kicker">Categories</p>
          <h2>Manage Categories</h2>
          <form id="admin-category-form" class="inline-actions"><input id="admin-category-name" placeholder="Add category" required><button class="btn" type="submit">Add</button></form>
          <div class="admin-list spaced">${state.categories.map((entry) => `<div class="list-row"><span>${escapeHtml(entry)}</span><button class="btn-ghost" data-action="delete-category" data-name="${escapeHtml(entry)}">Delete</button></div>`).join("")}</div>
        </article>
      </section>
      <section class="admin-panel">
        <p class="section-kicker">Inventory</p>
        <h2>Products</h2>
        <table class="table"><thead><tr><th>Name</th><th>Category</th><th>Stock</th><th>Sold</th><th>Price</th><th>Action</th></tr></thead><tbody>${products.items.map((product) => `
          <tr>
            <td>${escapeHtml(product.name)}</td>
            <td>${escapeHtml(product.category)}</td>
            <td>${product.stock}</td>
            <td>${product.sales || 0}</td>
            <td>${money(product.price)}</td>
            <td><button class="btn-ghost" data-action="edit-product" data-id="${product.id}">Edit</button> <button class="btn-ghost" data-action="delete-product" data-id="${product.id}">Delete</button></td>
          </tr>`).join("")}</tbody></table>
      </section>
      <section class="admin-grid">
        <article class="admin-panel">
          <p class="section-kicker">Orders</p>
          <h2>Order Management</h2>
          <table class="table"><thead><tr><th>Order</th><th>User</th><th>Payment</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>${orders.orders.map((order) => `
            <tr><td>${order.id}</td><td>${escapeHtml(order.customerName)}</td><td>${escapeHtml(order.paymentMethod)} / ${escapeHtml(order.paymentStatus)}</td><td>${money(order.total)}</td><td>${escapeHtml(order.status)}</td><td><select data-action="change-order-status" data-id="${order.id}">${optionMap(["Pending", "Paid", "Processing", "Delivered"], order.status)}</select></td></tr>`).join("")}</tbody></table>
        </article>
        <article class="admin-panel">
          <p class="section-kicker">Users</p>
          <h2>User Management</h2>
          <table class="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead><tbody>${users.users.map((user) => `
            <tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.role)}</td><td>${user.role === "admin" ? "-" : `<button class="btn-ghost" data-action="delete-user" data-id="${user.id}">Delete</button>`}</td></tr>`).join("")}</tbody></table>
        </article>
      </section>
    </div>
  `;
}

function renderLocked(message) {
  app.innerHTML = `<section class="auth-screen"><article class="auth-panel auth-panel-single"><h2>Access Required</h2><p class="muted">${escapeHtml(message)}</p><div class="inline-actions spaced"><a class="btn" href="#/login">Login</a><a class="btn-secondary" href="#/register">Register</a></div></article></section>`;
}

function productCard(product) {
  const defaultSize = product.sizes?.[0] || "One Size";
  const defaultColor = product.colors?.[0] || "Default";
  return `
    <article class="product-card">
      ${mediaBlock(product, "product-media")}
      <div class="product-card-content">
        <div class="card-row">
          <span class="tag">${escapeHtml(product.category)}</span>
          ${product.oldPrice ? '<span class="badge sale">Sale</span>' : '<span class="badge">Drop</span>'}
        </div>
        <h3 class="product-name-line">${escapeHtml(product.name)}</h3>
        <p class="muted product-copy-line">${escapeHtml(product.description)}</p>
        <div class="price-row">
          <strong class="price">${money(product.price)}</strong>
          ${product.oldPrice ? `<span class="old-price">${money(product.oldPrice)}</span>` : ""}
          ${product.stock ? "" : `<span class="pill danger">Out of stock</span>`}
        </div>
        <div class="inline-actions spaced">
          <a class="btn-secondary" href="#/product/${product.id}">View details</a>
          <button
            class="btn"
            ${product.stock ? "" : "disabled"}
            data-action="quick-add"
            data-product-id="${product.id}"
            data-size="${escapeHtml(defaultSize)}"
            data-color="${escapeHtml(defaultColor)}"
          >
            ${state.user ? "Add to cart" : "Login to add"}
          </button>
          <button class="btn-ghost" data-action="wishlist-toggle" data-product-id="${product.id}">${isWishlisted(product.id) ? "Saved" : "Wishlist"}</button>
        </div>
      </div>
    </article>
  `;
}

function mediaBlock(product, className) {
  if (product.images?.length) {
    return `<div class="${className}"><img loading="lazy" src="${product.images[0]}" alt="${escapeHtml(product.name)}"></div>`;
  }
  return `<div class="${className}" style="${gradientStyle(product.imageSeed)}"></div>`;
}

function galleryTile(product, image, primary) {
  const className = primary ? "gallery-tile primary" : "gallery-tile";
  if (image && !image.startsWith("gradient")) {
    return `<div class="${className}" data-action="zoom-image" data-src="${image}"><img loading="lazy" src="${image}" alt="${escapeHtml(product.name)}"></div>`;
  }
  return `<div class="${className}" data-action="zoom-image" data-src="" style="${gradientStyle(product.imageSeed + (primary ? 0 : 22))}"></div>`;
}

function reviewCard(review) {
  return `<article class="review-card"><div class="card-row"><strong>${escapeHtml(review.userName)}</strong><span class="pill">${review.rating}/5</span></div><p class="muted">${escapeHtml(review.comment)}</p></article>`;
}

function orderRow(order) {
  return `<tr><td>${order.id}</td><td>${escapeHtml(order.status)}</td><td>${money(order.total)}</td></tr>`;
}

function selector(kind, value, active) {
  return `<button class="selector ${active ? "active" : ""}" data-action="choose-${kind}" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`;
}

function optionMap(options, selected) {
  return options.map((option) => `<option value="${escapeHtml(option)}" ${String(option) === String(selected) ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
}

function emptyPage(message) {
  return `<section class="empty-state"><p class="muted">${escapeHtml(message)}</p><a class="btn spaced" href="#/shop">Go to shop</a></section>`;
}

function emptyInline(message) {
  return `<div class="empty-state"><p class="muted">${escapeHtml(message)}</p></div>`;
}

function gradientStyle(seed) {
  return `background:
    radial-gradient(circle at 50% 18%, rgba(255,255,255,0.18), transparent 14%),
    linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.45)),
    linear-gradient(${120 + (seed % 70)}deg, hsl(${seed}, 10%, 23%), #090909);`;
}

function money(value) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value || 0);
}

function isWishlisted(productId) {
  return state.wishlist.some((item) => item.id === productId);
}

function adminProductForm(product) {
  const model = product || {
    name: "",
    category: state.categories[0] || "Men",
    price: "",
    oldPrice: "",
    stock: 0,
    tags: [],
    description: "",
    colors: ["Black"],
    sizes: ["M"],
    images: []
  };
  return `
    <form id="admin-product-form" data-id="${product?.id || ""}">
      <div class="form-grid">
        <div class="field"><label>Name</label><input id="admin-product-name" value="${escapeHtml(model.name)}" required></div>
        <div class="field"><label>Category</label><select id="admin-product-category">${optionMap(state.categories, model.category)}</select></div>
        <div class="field"><label>Price</label><input id="admin-product-price" type="number" value="${model.price}" required></div>
        <div class="field"><label>Old price</label><input id="admin-product-old-price" type="number" value="${model.oldPrice || ""}"></div>
        <div class="field"><label>Stock</label><input id="admin-product-stock" type="number" value="${model.stock}" required></div>
        <div class="field"><label>Tags</label><input id="admin-product-tags" value="${escapeHtml(model.tags.join(", "))}" placeholder="new, featured, sale"></div>
      </div>
      <div class="field"><label>Description</label><textarea id="admin-product-description" required>${escapeHtml(model.description)}</textarea></div>
      <div class="form-grid">
        <div class="field"><label>Colors</label><input id="admin-product-colors" value="${escapeHtml(model.colors.join(", "))}"></div>
        <div class="field"><label>Sizes</label><input id="admin-product-sizes" value="${escapeHtml(model.sizes.join(", "))}"></div>
      </div>
      <div class="field"><label>Product images</label><input id="admin-product-images" type="file" accept="image/*" multiple></div>
      <div class="tag-row">${(model.images || []).map((image) => `<span class="tag">${escapeHtml(image.split("/").pop())}</span>`).join("") || '<span class="muted">No uploaded images yet</span>'}</div>
      <div class="inline-actions spaced">
        <button class="btn" type="submit">${product ? "Save product" : "Add product"}</button>
        ${product ? '<button class="btn-ghost" type="button" data-action="cancel-edit">Cancel edit</button>' : ""}
      </div>
    </form>
  `;
}

async function handleClicks(event) {
  const trigger = event.target.closest("[data-action], [data-close-modal]");
  if (!trigger) return;
  if (trigger.dataset.closeModal) return closeModal();
  const action = trigger.dataset.action;

  try {
    if (action === "quick-add") return await addToCart(
      trigger.dataset.productId,
      1,
      trigger.dataset.size || "One Size",
      trigger.dataset.color || "Default"
    );
    if (action === "wishlist-toggle") return await toggleWishlist(trigger.dataset.productId);
    if (action === "wishlist-remove") return await removeWishlist(trigger.dataset.productId);
    if (action === "wishlist-move-to-cart") return await moveWishlistToCart(
      trigger.dataset.productId,
      trigger.dataset.size,
      trigger.dataset.color
    );
    if (action === "choose-size") return chooseVariant("selectedSize", trigger.dataset.value);
    if (action === "choose-color") return chooseVariant("selectedColor", trigger.dataset.value);
    if (action === "qty") return adjustQty(Number(trigger.dataset.delta));
    if (action === "cart-add") return await addToCart(trigger.dataset.productId, state.ui.quantity, state.ui.selectedSize, state.ui.selectedColor);
    if (action === "buy-now") {
      await addToCart(trigger.dataset.productId, state.ui.quantity, state.ui.selectedSize, state.ui.selectedColor);
      window.location.hash = "#/checkout";
      return;
    }
    if (action === "cart-qty") return await updateCart(trigger.dataset.id, Number(trigger.dataset.delta));
    if (action === "cart-remove") return await removeCart(trigger.dataset.id);
    if (action === "logout") return logout();
    if (action === "apply-shop-filters") return applyShopFilters();
    if (action === "shop-page") return setShopPage(trigger.dataset.page);
    if (action === "zoom-image") return openZoom(trigger.dataset.src);
    if (action === "edit-product") {
      state.ui.editingProductId = trigger.dataset.id;
      return renderAdmin();
    }
    if (action === "cancel-edit") {
      state.ui.editingProductId = null;
      return renderAdmin();
    }
    if (action === "delete-product") return await deleteProduct(trigger.dataset.id);
    if (action === "delete-category") return await deleteCategory(trigger.dataset.name);
    if (action === "delete-user") return await deleteUser(trigger.dataset.id);
    if (action === "change-order-status") return;
  } catch (error) {
    handleError(error);
  }
}

document.addEventListener("change", async (event) => {
  const target = event.target;
  try {
    if (target.dataset.action === "change-order-status") {
      await api(`/api/orders/${target.dataset.id}`, { method: "PATCH", body: { status: target.value }, auth: true });
      notify("Order status updated.");
    }
  } catch (error) {
    handleError(error);
  }
});

async function handleSubmit(event) {
  const form = event.target;
  event.preventDefault();
  try {
    if (form.id === "newsletter-form") {
      await api("/api/newsletter", { method: "POST", body: { email: document.getElementById("newsletter-email").value } });
      form.reset();
      return notify("Newsletter signup saved.");
    }
    if (form.id === "login-form") return await login();
    if (form.id === "register-form") return await register();
    if (form.id === "review-form") return await addReview(form.dataset.productId);
    if (form.id === "checkout-form") return await checkout();
    if (form.id === "contact-form") return await sendContact();
    if (form.id === "admin-category-form") return await createCategory();
    if (form.id === "admin-product-form") return await saveProduct(form.dataset.id);
  } catch (error) {
    handleError(error);
  }
}

async function login() {
  const payload = await api("/api/auth/login", {
    method: "POST",
    body: {
      email: document.getElementById("login-email").value,
      password: document.getElementById("login-password").value
    }
  });
  setSession(payload);
  notify("Welcome back.");
  window.location.hash = "#/home";
}

async function register() {
  const password = document.getElementById("register-password").value;
  const confirm = document.getElementById("register-confirm").value;
  if (password !== confirm) throw new Error("Passwords do not match.");
  const payload = await api("/api/auth/register", {
    method: "POST",
    body: {
      name: document.getElementById("register-name").value,
      email: document.getElementById("register-email").value,
      password
    }
  });
  setSession(payload);
  notify("Account created.");
  window.location.hash = "#/home";
}

async function addReview(productId) {
  await api("/api/reviews", {
    method: "POST",
    body: {
      productId,
      rating: document.getElementById("review-rating").value,
      userName: document.getElementById("review-name").value,
      comment: document.getElementById("review-comment").value
    },
    auth: Boolean(state.token)
  });
  notify("Review added.");
  route();
}

async function checkout() {
  const response = await api("/api/orders", {
    method: "POST",
    auth: true,
    body: {
      name: document.getElementById("checkout-name").value,
      email: document.getElementById("checkout-email").value,
      phone: document.getElementById("checkout-phone").value,
      address: document.getElementById("checkout-address").value,
      country: document.getElementById("checkout-country").value,
      deliveryMethod: document.getElementById("checkout-delivery").value,
      paymentMethod: document.getElementById("checkout-payment").value
    }
  });
  await refreshReferenceData();
  notify("Order placed. Your delivery is on the way.");
  window.location.hash = "#/orders";
}

async function sendContact() {
  await api("/api/contact", {
    method: "POST",
    body: {
      name: document.getElementById("contact-name").value,
      email: document.getElementById("contact-email").value,
      message: document.getElementById("contact-message").value
    }
  });
  notify("Message sent.");
  document.getElementById("contact-form").reset();
}

async function createCategory() {
  await api("/api/admin/categories", {
    method: "POST",
    auth: true,
    body: { name: document.getElementById("admin-category-name").value }
  });
  notify("Category added.");
  await refreshReferenceData();
  renderAdmin();
}

async function deleteCategory(name) {
  await api(`/api/admin/categories/${encodeURIComponent(name)}`, { method: "DELETE", auth: true });
  notify("Category deleted.");
  await refreshReferenceData();
  renderAdmin();
}

async function saveProduct(productId) {
  const uploaded = await uploadSelectedFiles();
  const existing = state.ui.editingImages || [];
  const body = {
    name: document.getElementById("admin-product-name").value,
    category: document.getElementById("admin-product-category").value,
    price: Number(document.getElementById("admin-product-price").value),
    oldPrice: Number(document.getElementById("admin-product-old-price").value) || null,
    stock: Number(document.getElementById("admin-product-stock").value),
    tags: document.getElementById("admin-product-tags").value,
    description: document.getElementById("admin-product-description").value,
    colors: document.getElementById("admin-product-colors").value,
    sizes: document.getElementById("admin-product-sizes").value,
    images: [...existing, ...uploaded]
  };
  const method = productId ? "PUT" : "POST";
  const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
  await api(url, { method, body, auth: true });
  state.ui.editingProductId = null;
  notify(productId ? "Product updated." : "Product created.");
  renderAdmin();
}

async function deleteProduct(id) {
  await api(`/api/admin/products/${id}`, { method: "DELETE", auth: true });
  notify("Product deleted.");
  renderAdmin();
}

async function deleteUser(id) {
  await api(`/api/admin/users/${id}`, { method: "DELETE", auth: true });
  notify("User deleted.");
  renderAdmin();
}

async function uploadSelectedFiles() {
  const input = document.getElementById("admin-product-images");
  const files = Array.from(input?.files || []);
  if (!files.length) return [];
  const encoded = await Promise.all(files.map(fileToDataUrl));
  const result = await api("/api/admin/uploads", {
    method: "POST",
    auth: true,
    body: { files: files.map((file, index) => ({ name: file.name, dataUrl: encoded[index] })) }
  });
  return result.files.map((entry) => entry.url);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addToCart(productId, quantity, size, color) {
  await ensureSession();
  state.cart = await api("/api/cart", { method: "POST", auth: true, body: { productId, quantity, size, color } });
  renderHeaderState();
  notify("Added to cart.");
  window.location.hash = "#/cart";
}

async function addWishlistItemToCart(productId, size, color) {
  await ensureSession();
  state.cart = await api("/api/cart", { method: "POST", auth: true, body: { productId, quantity: 1, size, color } });
  renderHeaderState();
}

async function toggleWishlist(productId) {
  await ensureSession();
  await api("/api/wishlist", { method: "POST", auth: true, body: { productId } });
  const wishlist = await api("/api/wishlist", { auth: true });
  state.wishlist = wishlist.items;
  renderHeaderState();
  route();
}

async function updateCart(id, delta) {
  const item = state.cart.items.find((entry) => entry.id === id);
  if (!item) return;
  state.cart = await api(`/api/cart/${id}`, { method: "PATCH", auth: true, body: { quantity: Math.max(1, item.quantity + delta) } });
  renderCart();
}

async function removeCart(id) {
  state.cart = await api(`/api/cart/${id}`, { method: "DELETE", auth: true });
  renderCart();
}

async function removeWishlist(productId) {
  await api(`/api/wishlist/${productId}`, { method: "DELETE", auth: true });
  const wishlist = await api("/api/wishlist", { auth: true });
  state.wishlist = wishlist.items;
  renderHeaderState();
  notify("Removed from wishlist.");
  renderWishlist();
}

async function moveWishlistToCart(productId, size, color) {
  await addWishlistItemToCart(productId, size || "One Size", color || "Default");
  await api(`/api/wishlist/${productId}`, { method: "DELETE", auth: true });
  const wishlist = await api("/api/wishlist", { auth: true });
  state.wishlist = wishlist.items;
  renderHeaderState();
  notify("Moved to cart.");
  window.location.hash = "#/cart";
}

function chooseVariant(key, value) {
  state.ui[key] = value;
  route();
}

function adjustQty(delta) {
  state.ui.quantity = Math.max(1, state.ui.quantity + delta);
  route();
}

function logout() {
  state.token = "";
  state.user = null;
  localStorage.removeItem("nevermind-token");
  refreshReferenceData().then(() => {
    notify("Logged out.");
    window.location.hash = "#/home";
  });
}

function setSession(payload) {
  state.token = payload.token;
  state.user = payload.user;
  localStorage.setItem("nevermind-token", state.token);
  refreshReferenceData();
}

function applyShopFilters() {
  const params = new URLSearchParams({
    category: document.getElementById("filter-category").value,
    tag: document.getElementById("filter-tag").value,
    size: document.getElementById("filter-size").value,
    color: document.getElementById("filter-color").value,
    sort: document.getElementById("filter-sort").value,
    priceMin: document.getElementById("filter-price-min").value || "0",
    priceMax: document.getElementById("filter-price-max").value || "1000000",
    search: document.getElementById("filter-search").value || "",
    page: "1"
  });
  window.location.hash = `#/shop?${params.toString()}`;
}

function setShopPage(page) {
  const params = getParams();
  params.set("page", page);
  window.location.hash = `#/shop?${params.toString()}`;
}

async function handleSearchSuggest(event) {
  const query = event.target.value.trim();
  clearTimeout(state.ui.searchTimer);
  if (!query) return closeSuggestions();
  state.ui.searchTimer = setTimeout(async () => {
    try {
      const result = await api(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      const box = document.getElementById("global-suggestions");
      box.innerHTML = result.suggestions.length
        ? result.suggestions.map((entry) => `<a href="#/product/${entry.id}" class="suggestion-item">${escapeHtml(entry.label)}</a>`).join("")
        : `<div class="suggestion-item muted">No suggestions</div>`;
      box.classList.remove("hidden");
    } catch (error) {
      console.error(error);
    }
  }, 220);
}

function closeSuggestions() {
  document.getElementById("global-suggestions").classList.add("hidden");
  document.getElementById("global-suggestions").innerHTML = "";
}

function openZoom(src) {
  modal.classList.remove("hidden");
  modalContent.innerHTML = src ? `<img class="zoom-image" src="${src}" alt="Zoomed product image">` : `<div class="zoom-fallback">Zoom preview unavailable for generated placeholder artwork.</div>`;
}

function closeModal() {
  modal.classList.add("hidden");
  modalContent.innerHTML = "";
}

async function ensureSession() {
  if (state.user) return;
  notify("Please log in first.");
  window.location.hash = "#/login";
  throw new Error("Login required");
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.auth && state.token ? { Authorization: `Bearer ${state.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function handleError(error) {
  console.error(error);
  notify(error.message || "Something went wrong.");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
