const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const OUTBOX_DIR = path.join(ROOT, "outbox");
const DATA_FILE = path.join(ROOT, "data", "runtime.json");
const PORT = Number(process.env.PORT || 3000);
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const PAYMENT_MODE = process.env.PAYMENT_MODE || "mock";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

const defaultProductImages = {
  "Chaos Hoodie": [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80"
  ],
  "Metro Hoodie": [
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80"
  ],
  "Vanta Hoodie": [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"
  ],
  "Noir Track Jacket": [
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"
  ],
  "Reflect Tee": [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80"
  ],
  "Soft Armor Set": [
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80"
  ],
  "Limited Cargo": [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"
  ],
  "Studio Cap": [
    "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80"
  ]
};

const supplementalCatalog = {
  men: [
    ["Midnight Bomber", 64000, 71000, ["Black", "Olive"], ["M", "L", "XL"], 9, ["featured", "new"], "Structured bomber jacket with sharp shoulders and a matte urban finish.", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"],
    ["Slate Denim", 42000, null, ["Blue", "Graphite"], ["M", "L", "XL"], 12, ["new"], "Slim straight denim with faded knees and a clean stacked hem.", "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80"],
    ["Monarch Tee", 26000, null, ["White", "Black"], ["S", "M", "L", "XL"], 18, ["featured"], "Premium cotton tee with a clean chest line and relaxed daily fit.", "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80"],
    ["District Trouser", 48000, null, ["Black", "Stone"], ["M", "L", "XL"], 10, ["new"], "Tailored utility trouser cut for movement with a softened finish.", "https://images.unsplash.com/photo-1506629905607-d405b7a4a3b2?auto=format&fit=crop&w=900&q=80"],
    ["Runway Knit", 53000, 59000, ["Charcoal", "Black"], ["M", "L"], 8, ["sale"], "Refined knitwear layer with a heavy drape and minimal seam profile.", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80"],
    ["Crest Polo", 34000, null, ["Black", "Bone"], ["M", "L", "XL"], 14, ["featured"], "A crisp polo reworked with broader sleeves and a tailored collar.", "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=80"],
    ["Harbor Overshirt", 51000, null, ["Olive", "Black"], ["M", "L", "XL"], 7, ["new"], "Overshirt with a workwear stance and brushed texture.", "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80"],
    ["Apex Hoodie", 47000, 54000, ["Black", "Stone"], ["M", "L", "XL"], 11, ["sale", "featured"], "Heavy fleece hoodie with a cropped body and sharp pocket geometry.", "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=900&q=80"],
    ["Shadow Vest", 39000, null, ["Black"], ["M", "L"], 9, ["new"], "Layering vest with a sleek zip front and high-neck protection.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80"],
    ["Rivet Cargo", 56000, null, ["Graphite", "Black"], ["M", "L", "XL"], 10, ["limited"], "Modern cargo trouser with metal trim and a sculpted leg.", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80"],
    ["Northline Jacket", 68000, 74000, ["Black", "Khaki"], ["M", "L", "XL"], 6, ["sale", "featured"], "Performance outer layer built for cold streets and clean lines.", "https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=900&q=80"],
    ["Studio Crew", 33000, null, ["Black", "Ash"], ["S", "M", "L", "XL"], 16, ["featured"], "Crewneck sweatshirt with a soft hand feel and boxy profile.", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80"],
    ["Vertex Shirt", 41000, null, ["White", "Navy"], ["M", "L", "XL"], 13, ["new"], "Sharp woven shirt with a longer body and polished cuff detail.", "https://images.unsplash.com/photo-1519340333755-c1aa5571fd46?auto=format&fit=crop&w=900&q=80"],
    ["Pier Coat", 79000, null, ["Black", "Camel"], ["M", "L"], 5, ["limited"], "Longline coat with crisp structure and understated buttons.", "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=900&q=80"],
    ["Signal Jogger", 36000, null, ["Black", "Grey"], ["M", "L", "XL"], 15, ["featured"], "Premium jogger with a clean taper and soft fleece interior.", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80"],
    ["Cinder Set", 87000, 92000, ["Black"], ["M", "L", "XL"], 4, ["new", "limited"], "Matching street set built for statement dressing with clean proportion.", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80"]
  ],
  women: [
    ["Satin Slip Dress", 69000, 76000, ["Black", "Wine"], ["S", "M", "L"], 8, ["featured", "new"], "Fluid satin slip dress with a sleek neckline and evening polish.", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80"],
    ["Muse Blazer", 62000, null, ["Black", "Beige"], ["S", "M", "L"], 10, ["featured"], "Tailored blazer with a strong shoulder and clean open front.", "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80"],
    ["Glow Set", 75000, 82000, ["Gold", "Stone"], ["S", "M", "L"], 7, ["sale", "new"], "Matching co-ord set with a bright luxury tone and shaped waist.", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"],
    ["Contour Dress", 71000, null, ["Black", "Olive"], ["S", "M", "L"], 9, ["featured"], "Body-skimming dress with minimal seams and a strong neckline.", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"],
    ["Silk Shirt Set", 66000, null, ["Bone", "Black"], ["S", "M", "L"], 11, ["new"], "Soft silk shirt set designed for luxury movement and ease.", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"],
    ["Aster Knit Dress", 58000, null, ["Cream", "Charcoal"], ["S", "M", "L"], 13, ["featured"], "Refined knit dress with a sculpted fit and soft vertical line.", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80"],
    ["Night Bloom Jacket", 64000, 70000, ["Black", "Red"], ["S", "M", "L"], 6, ["sale"], "Statement jacket with dramatic sleeve volume and soft structure.", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"],
    ["Shoreline Gown", 92000, null, ["Black", "Stone"], ["S", "M"], 4, ["limited"], "Long gown cut with a clean fall and elevated event-ready finish.", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"],
    ["Halo Crop Top", 24000, null, ["White", "Black"], ["S", "M", "L"], 20, ["new"], "Minimal crop top with a sculpted fit and softened sleeve line.", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"],
    ["Rosette Pants", 43000, null, ["Black", "Beige"], ["S", "M", "L"], 12, ["featured"], "Wide-leg pant with soft tailoring and a quiet statement shape.", "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=900&q=80"],
    ["Velour Tracksuit", 81000, 87000, ["Wine", "Black"], ["S", "M", "L"], 5, ["sale", "limited"], "Luxury velour set with a fitted waist and dramatic line.", "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80"],
    ["Studio Mini Dress", 52000, null, ["Black", "Tan"], ["S", "M", "L"], 14, ["new"], "Short dress built with a clean edge and polished city feel.", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"],
    ["Flare Sleeve Top", 32000, null, ["Black", "Cream"], ["S", "M", "L"], 16, ["featured"], "Soft flare sleeve top with a balanced dramatic shape.", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80"],
    ["Monroe Skirt", 35000, null, ["Black", "Grey"], ["S", "M", "L"], 15, ["new"], "A-line skirt with a clean fall and a sharp everyday finish.", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"],
    ["Solar Hoodie Set", 70000, null, ["Yellow", "Stone"], ["S", "M", "L"], 8, ["featured"], "Two-piece hoodie set with a strong color pop and lounge luxury feel.", "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80"],
    ["Coco Blouse", 29000, null, ["White", "Wine"], ["S", "M", "L"], 18, ["new"], "Light blouse with elevated softness and a refined collar line.", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"],
    ["Velvet Corset Dress", 76000, 83000, ["Black", "Plum"], ["S", "M"], 6, ["sale", "limited"], "Corset-inspired velvet dress with rich texture and a structured waist.", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80"],
    ["Onyx Trouser Set", 85000, null, ["Black"], ["S", "M", "L"], 7, ["featured", "new"], "Sharp matching trouser set with an executive city silhouette.", "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=900&q=80"]
  ]
};

const rateLimitBuckets = new Map();

ensureDir(PUBLIC_DIR);
ensureDir(UPLOAD_DIR);
ensureDir(OUTBOX_DIR);
ensureDir(path.dirname(DATA_FILE));

const server = http.createServer(async (req, res) => {
  try {
    addCorsHeaders(res);
    if (req.method === "OPTIONS") return sendEmpty(res, 204);

    if (!allowRequest(req, res)) return;

    const url = new URL(req.url, APP_URL);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    if (pathname.startsWith("/uploads/")) {
      return serveFile(res, path.join(ROOT, pathname));
    }

    if (pathname === "/" || pathname === "/index.html") {
      return serveFile(res, path.join(PUBLIC_DIR, "index.html"));
    }

    const filePath = path.join(PUBLIC_DIR, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return serveFile(res, filePath);
    }

    return serveFile(res, path.join(PUBLIC_DIR, "index.html"));
  } catch (error) {
    console.error(error);
    if (error instanceof HttpError) {
      return sendJson(res, error.statusCode, { error: error.message });
    }
    return sendJson(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Nevermind Store running on ${APP_URL}`);
});

async function handleApi(req, res, url) {
  const pathname = url.pathname;
  const db = readDb();
  const auth = authenticate(req, db);

  if (pathname === "/api/health" && req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      appUrl: APP_URL,
      paymentMode: PAYMENT_MODE,
      features: getGatewayStatus()
    });
  }

  if (pathname === "/api/bootstrap" && req.method === "GET") {
    return sendJson(res, 200, {
      settings: {
        appUrl: APP_URL,
        paymentMode: PAYMENT_MODE,
        features: getGatewayStatus()
      },
      session: auth.user ? sanitizeUser(auth.user) : null
    });
  }

  if (pathname === "/api/auth/register" && req.method === "POST") {
    const body = await readJson(req);
    const name = requireString(body.name, "Name is required");
    const email = requireEmail(body.email);
    const password = requireString(body.password, "Password is required");
    if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      return sendJson(res, 400, { error: "Email already exists" });
    }
    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: hashPassword(password),
      role: "user",
      address: "",
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    writeDb(db);
    const token = createToken(user);
    return sendJson(res, 201, { token, user: sanitizeUser(user) });
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    const body = await readJson(req);
    const email = requireEmail(body.email);
    const password = requireString(body.password, "Password is required");
    const user = db.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return sendJson(res, 401, { error: "Invalid credentials" });
    }
    const token = createToken(user);
    return sendJson(res, 200, { token, user: sanitizeUser(user) });
  }

  if (pathname === "/api/auth/session" && req.method === "GET") {
    return sendJson(res, 200, { user: auth.user ? sanitizeUser(auth.user) : null });
  }

  if (pathname === "/api/products" && req.method === "GET") {
    return sendJson(res, 200, queryProducts(db, url));
  }

  if (pathname.startsWith("/api/products/") && req.method === "GET") {
    const productId = pathname.split("/")[3];
    const product = db.products.find((entry) => entry.id === productId);
    if (!product) return sendJson(res, 404, { error: "Product not found" });
    const reviews = db.reviews.filter((review) => review.productId === productId);
    const related = db.products.filter((entry) => entry.category === product.category && entry.id !== product.id).slice(0, 4);
    return sendJson(res, 200, { product, reviews, related });
  }

  if (pathname === "/api/search/suggestions" && req.method === "GET") {
    const query = (url.searchParams.get("q") || "").trim().toLowerCase();
    const suggestions = query
      ? db.products
          .filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query))
          .slice(0, 6)
          .map((product) => ({ id: product.id, label: `${product.name} - ${product.category}` }))
      : [];
    return sendJson(res, 200, { suggestions });
  }

  if (pathname === "/api/categories" && req.method === "GET") {
    return sendJson(res, 200, { categories: db.categories });
  }

  if (pathname === "/api/wishlist" && req.method === "GET") {
    if (!auth.user) return sendJson(res, 401, { error: "Unauthorized" });
    const items = db.wishlists.filter((entry) => entry.userId === auth.user.id).map((entry) => db.products.find((product) => product.id === entry.productId)).filter(Boolean);
    return sendJson(res, 200, { items });
  }

  if (pathname === "/api/wishlist" && req.method === "POST") {
    if (!auth.user) return sendJson(res, 401, { error: "Unauthorized" });
    const body = await readJson(req);
    const productId = requireString(body.productId, "Product is required");
    const existing = db.wishlists.find((entry) => entry.userId === auth.user.id && entry.productId === productId);
    if (existing) {
      db.wishlists = db.wishlists.filter((entry) => entry.id !== existing.id);
      writeDb(db);
      return sendJson(res, 200, { saved: false });
    }
    db.wishlists.push({ id: crypto.randomUUID(), userId: auth.user.id, productId, createdAt: new Date().toISOString() });
    writeDb(db);
    return sendJson(res, 201, { saved: true });
  }

  if (pathname.startsWith("/api/wishlist/") && req.method === "DELETE") {
    if (!auth.user) return sendJson(res, 401, { error: "Unauthorized" });
    const productId = pathname.split("/")[3];
    db.wishlists = db.wishlists.filter((entry) => !(entry.userId === auth.user.id && entry.productId === productId));
    writeDb(db);
    return sendEmpty(res, 204);
  }

  if (pathname === "/api/cart" && req.method === "GET") {
    if (!auth.user) return sendJson(res, 401, { error: "Unauthorized" });
    return sendJson(res, 200, buildCartResponse(db, auth.user.id));
  }

  if (pathname === "/api/cart" && req.method === "POST") {
    if (!auth.user) return sendJson(res, 401, { error: "Unauthorized" });
    const body = await readJson(req);
    const product = getProductOrThrow(db, body.productId);
    validateStock(product, Number(body.quantity || 1));
    const size = requireString(body.size, "Size is required");
    const color = requireString(body.color, "Color is required");
    const quantity = Math.max(1, Number(body.quantity || 1));
    const existing = db.carts.find((entry) => entry.userId === auth.user.id && entry.productId === product.id && entry.size === size && entry.color === color);
    if (existing) existing.quantity += quantity;
    else {
      db.carts.push({
        id: crypto.randomUUID(),
        userId: auth.user.id,
        productId: product.id,
        quantity,
        size,
        color,
        createdAt: new Date().toISOString()
      });
    }
    writeDb(db);
    return sendJson(res, 201, buildCartResponse(db, auth.user.id));
  }

  if (pathname.startsWith("/api/cart/") && req.method === "PATCH") {
    if (!auth.user) return sendJson(res, 401, { error: "Unauthorized" });
    const cartId = pathname.split("/")[3];
    const body = await readJson(req);
    const item = db.carts.find((entry) => entry.id === cartId && entry.userId === auth.user.id);
    if (!item) return sendJson(res, 404, { error: "Cart item not found" });
    item.quantity = Math.max(1, Number(body.quantity || item.quantity));
    const product = getProductOrThrow(db, item.productId);
    validateStock(product, item.quantity);
    writeDb(db);
    return sendJson(res, 200, buildCartResponse(db, auth.user.id));
  }

  if (pathname.startsWith("/api/cart/") && req.method === "DELETE") {
    if (!auth.user) return sendJson(res, 401, { error: "Unauthorized" });
    const cartId = pathname.split("/")[3];
    db.carts = db.carts.filter((entry) => !(entry.id === cartId && entry.userId === auth.user.id));
    writeDb(db);
    return sendJson(res, 200, buildCartResponse(db, auth.user.id));
  }

  if (pathname === "/api/reviews" && req.method === "POST") {
    const body = await readJson(req);
    const product = getProductOrThrow(db, body.productId);
    const rating = clamp(Number(body.rating || 5), 1, 5);
    const userName = requireString(body.userName || auth.user?.name || "Guest", "Name is required");
    const comment = requireString(body.comment, "Comment is required");
    db.reviews.unshift({
      id: crypto.randomUUID(),
      productId: product.id,
      userId: auth.user?.id || null,
      userName,
      rating,
      comment,
      createdAt: new Date().toISOString()
    });
    writeDb(db);
    return sendJson(res, 201, { ok: true });
  }

  if (pathname.startsWith("/api/reviews/") && req.method === "DELETE") {
    if (!auth.user) return sendJson(res, 401, { error: "Unauthorized" });
    const reviewId = pathname.split("/")[3];
    const review = db.reviews.find((entry) => entry.id === reviewId);
    if (!review) return sendJson(res, 404, { error: "Review not found" });
    if (auth.user.role !== "admin" && review.userId !== auth.user.id) {
      return sendJson(res, 403, { error: "Forbidden" });
    }
    db.reviews = db.reviews.filter((entry) => entry.id !== reviewId);
    writeDb(db);
    return sendEmpty(res, 204);
  }

  if (pathname === "/api/orders" && req.method === "GET") {
    if (!auth.user) return sendJson(res, 401, { error: "Unauthorized" });
    const orders = auth.user.role === "admin" ? db.orders : db.orders.filter((entry) => entry.userId === auth.user.id);
    return sendJson(res, 200, { orders });
  }

  if (pathname === "/api/orders" && req.method === "POST") {
    if (!auth.user) return sendJson(res, 401, { error: "Unauthorized" });
    const body = await readJson(req);
    const cartItems = db.carts.filter((entry) => entry.userId === auth.user.id);
    if (!cartItems.length) return sendJson(res, 400, { error: "Cart is empty" });

    const lineItems = cartItems.map((item) => {
      const product = getProductOrThrow(db, item.productId);
      validateStock(product, item.quantity);
      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: product.price
      };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal ? 5000 : 0;
    const total = subtotal + shipping;
    const paymentMethod = requireString(body.paymentMethod, "Payment method is required");
    const payment = buildPaymentState(paymentMethod, total);
    const order = {
      id: `ORD-${Date.now()}`,
      userId: auth.user.id,
      customerName: requireString(body.name, "Name is required"),
      email: requireEmail(body.email),
      phone: requireString(body.phone, "Phone is required"),
      address: requireString(body.address, "Address is required"),
      country: requireString(body.country, "Country is required"),
      deliveryMethod: requireString(body.deliveryMethod, "Delivery method is required"),
      paymentMethod,
      paymentStatus: payment.paymentStatus,
      paymentReference: payment.reference,
      status: payment.orderStatus,
      subtotal,
      shipping,
      total,
      items: lineItems,
      createdAt: new Date().toISOString()
    };

    if (payment.success) {
      for (const item of cartItems) {
        const product = getProductOrThrow(db, item.productId);
        product.stock = Math.max(0, product.stock - item.quantity);
        product.sales += item.quantity;
      }
      db.orders.unshift(order);
      db.carts = db.carts.filter((entry) => entry.userId !== auth.user.id);
      auth.user.address = order.address;
      writeEmailOutbox(order);
      writeDb(db);
      return sendJson(res, 201, { order, payment });
    }

    db.failedPayments.unshift({
      id: crypto.randomUUID(),
      userId: auth.user.id,
      orderDraft: order,
      createdAt: new Date().toISOString()
    });
    writeDb(db);
    return sendJson(res, 402, { error: "Payment failed", payment });
  }

  if (pathname.startsWith("/api/orders/") && req.method === "PATCH") {
    if (!auth.user || auth.user.role !== "admin") return sendJson(res, 403, { error: "Forbidden" });
    const orderId = pathname.split("/")[3];
    const body = await readJson(req);
    const order = db.orders.find((entry) => entry.id === orderId);
    if (!order) return sendJson(res, 404, { error: "Order not found" });
    order.status = requireString(body.status, "Status is required");
    writeDb(db);
    return sendJson(res, 200, { order });
  }

  if (pathname === "/api/admin/analytics" && req.method === "GET") {
    if (!auth.user || auth.user.role !== "admin") return sendJson(res, 403, { error: "Forbidden" });
    const revenue = db.orders.reduce((sum, order) => sum + order.total, 0);
    const totalStockUnits = db.products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
    const totalSoldUnits = db.products.reduce((sum, product) => sum + Number(product.sales || 0), 0);
    const inventoryValue = db.products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);
    return sendJson(res, 200, {
      totalProducts: db.products.length,
      totalUsers: db.users.length,
      totalOrders: db.orders.length,
      revenue,
      newsletterSignups: db.newsletter.length,
      pendingOrders: db.orders.filter((order) => order.status === "Pending").length,
      totalStockUnits,
      totalSoldUnits,
      inventoryValue,
      outOfStockCount: db.products.filter((product) => Number(product.stock || 0) === 0).length,
      lowStockCount: db.products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 5).length,
      failedPayments: db.failedPayments.length
    });
  }

  if (pathname === "/api/admin/users" && req.method === "GET") {
    if (!auth.user || auth.user.role !== "admin") return sendJson(res, 403, { error: "Forbidden" });
    return sendJson(res, 200, { users: db.users.map(sanitizeUser) });
  }

  if (pathname.startsWith("/api/admin/users/") && req.method === "DELETE") {
    if (!auth.user || auth.user.role !== "admin") return sendJson(res, 403, { error: "Forbidden" });
    const userId = pathname.split("/")[4];
    db.users = db.users.filter((user) => user.id !== userId || user.role === "admin");
    db.carts = db.carts.filter((entry) => entry.userId !== userId);
    db.wishlists = db.wishlists.filter((entry) => entry.userId !== userId);
    db.orders = db.orders.filter((entry) => entry.userId !== userId);
    writeDb(db);
    return sendEmpty(res, 204);
  }

  if (pathname === "/api/admin/categories" && req.method === "POST") {
    if (!auth.user || auth.user.role !== "admin") return sendJson(res, 403, { error: "Forbidden" });
    const body = await readJson(req);
    const name = requireString(body.name, "Category name is required");
    if (!db.categories.includes(name)) db.categories.push(name);
    writeDb(db);
    return sendJson(res, 201, { categories: db.categories });
  }

  if (pathname.startsWith("/api/admin/categories/") && req.method === "DELETE") {
    if (!auth.user || auth.user.role !== "admin") return sendJson(res, 403, { error: "Forbidden" });
    const name = decodeURIComponent(pathname.split("/")[4]);
    if (db.products.some((product) => product.category === name)) {
      return sendJson(res, 400, { error: "Category still has products" });
    }
    db.categories = db.categories.filter((entry) => entry !== name);
    writeDb(db);
    return sendEmpty(res, 204);
  }

  if (pathname === "/api/admin/uploads" && req.method === "POST") {
    if (!auth.user || auth.user.role !== "admin") return sendJson(res, 403, { error: "Forbidden" });
    const body = await readJson(req);
    const files = Array.isArray(body.files) ? body.files : [];
    const uploaded = files.map(saveBase64Image);
    return sendJson(res, 201, { files: uploaded });
  }

  if (pathname === "/api/admin/products" && req.method === "POST") {
    if (!auth.user || auth.user.role !== "admin") return sendJson(res, 403, { error: "Forbidden" });
    const product = normalizeProductPayload(await readJson(req), db);
    db.products.unshift(product);
    writeDb(db);
    return sendJson(res, 201, { product });
  }

  if (pathname.startsWith("/api/admin/products/") && req.method === "PUT") {
    if (!auth.user || auth.user.role !== "admin") return sendJson(res, 403, { error: "Forbidden" });
    const productId = pathname.split("/")[4];
    const index = db.products.findIndex((product) => product.id === productId);
    if (index < 0) return sendJson(res, 404, { error: "Product not found" });
    db.products[index] = normalizeProductPayload(await readJson(req), db, db.products[index]);
    writeDb(db);
    return sendJson(res, 200, { product: db.products[index] });
  }

  if (pathname.startsWith("/api/admin/products/") && req.method === "DELETE") {
    if (!auth.user || auth.user.role !== "admin") return sendJson(res, 403, { error: "Forbidden" });
    const productId = pathname.split("/")[4];
    db.products = db.products.filter((product) => product.id !== productId);
    db.carts = db.carts.filter((item) => item.productId !== productId);
    db.wishlists = db.wishlists.filter((entry) => entry.productId !== productId);
    db.reviews = db.reviews.filter((entry) => entry.productId !== productId);
    writeDb(db);
    return sendEmpty(res, 204);
  }

  if (pathname === "/api/newsletter" && req.method === "POST") {
    const body = await readJson(req);
    const email = requireEmail(body.email);
    db.newsletter.unshift({ id: crypto.randomUUID(), email, createdAt: new Date().toISOString() });
    writeDb(db);
    return sendJson(res, 201, { ok: true });
  }

  if (pathname === "/api/contact" && req.method === "POST") {
    const body = await readJson(req);
    db.contacts.unshift({
      id: crypto.randomUUID(),
      name: requireString(body.name, "Name is required"),
      email: requireEmail(body.email),
      message: requireString(body.message, "Message is required"),
      createdAt: new Date().toISOString()
    });
    writeDb(db);
    return sendJson(res, 201, { ok: true });
  }

  return sendJson(res, 404, { error: "Not found" });
}

function queryProducts(db, url) {
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.max(1, Math.min(24, Number(url.searchParams.get("pageSize") || 8)));
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const category = url.searchParams.get("category") || "All";
  const tag = url.searchParams.get("tag") || "all";
  const size = url.searchParams.get("size") || "all";
  const color = url.searchParams.get("color") || "all";
  const priceMin = Number(url.searchParams.get("priceMin") || 0);
  const priceMax = Number(url.searchParams.get("priceMax") || Number.MAX_SAFE_INTEGER);
  const sort = url.searchParams.get("sort") || "featured";

  let items = [...db.products];
  if (search) items = items.filter((product) => `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search));
  if (category !== "All") items = items.filter((product) => product.category === category);
  if (tag !== "all") items = items.filter((product) => product.tags.includes(tag));
  if (size !== "all") items = items.filter((product) => product.sizes.includes(size));
  if (color !== "all") items = items.filter((product) => product.colors.includes(color));
  items = items.filter((product) => product.price >= priceMin && product.price <= priceMax);

  if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
  if (sort === "newest") items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sort === "best-sellers") items.sort((a, b) => b.sales - a.sales);

  const total = items.length;
  const paged = items.slice((page - 1) * pageSize, page * pageSize);
  return { items: paged, total, page, pageSize };
}

function buildCartResponse(db, userId) {
  const items = db.carts
    .filter((entry) => entry.userId === userId)
    .map((entry) => ({ ...entry, product: db.products.find((product) => product.id === entry.productId) }))
    .filter((entry) => entry.product);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal ? 5000 : 0;
  return { items, subtotal, shipping, total: subtotal + shipping };
}

function buildPaymentState(method, total) {
  const realProviders = getGatewayStatus();
  const reference = `PAY-${Date.now()}`;
  if (PAYMENT_MODE === "mock") {
    return { success: true, provider: method, paymentStatus: "Paid", orderStatus: "Pending", reference, amount: total, mode: "mock" };
  }
  if (method === "Paystack" && realProviders.paystack) {
    return { success: true, provider: method, paymentStatus: "Paid", orderStatus: "Pending", reference, amount: total, mode: "configured" };
  }
  if (method === "Flutterwave" && realProviders.flutterwave) {
    return { success: true, provider: method, paymentStatus: "Paid", orderStatus: "Pending", reference, amount: total, mode: "configured" };
  }
  if (method === "Stripe" && realProviders.stripe) {
    return { success: true, provider: method, paymentStatus: "Paid", orderStatus: "Pending", reference, amount: total, mode: "configured" };
  }
  if (method === "PayPal" && realProviders.paypal) {
    return { success: true, provider: method, paymentStatus: "Paid", orderStatus: "Pending", reference, amount: total, mode: "configured" };
  }
  return { success: false, provider: method, paymentStatus: "Failed", orderStatus: "Cancelled", reference, amount: total, mode: "missing-credentials" };
}

function getGatewayStatus() {
  return {
    paystack: Boolean(process.env.PAYSTACK_PUBLIC_KEY && process.env.PAYSTACK_SECRET_KEY),
    flutterwave: Boolean(process.env.FLUTTERWAVE_PUBLIC_KEY && process.env.FLUTTERWAVE_SECRET_KEY),
    stripe: Boolean(process.env.STRIPE_PUBLIC_KEY && process.env.STRIPE_SECRET_KEY),
    paypal: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    smtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  };
}

function normalizeProductPayload(body, db, existing = null) {
  const category = requireString(body.category, "Category is required");
  if (!db.categories.includes(category)) db.categories.push(category);
  return {
    id: existing?.id || crypto.randomUUID(),
    name: requireString(body.name, "Name is required"),
    category,
    price: Number(body.price || 0),
    oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
    colors: normalizeArray(body.colors),
    sizes: normalizeArray(body.sizes),
    stock: Number(body.stock || 0),
    tags: normalizeArray(body.tags),
    description: requireString(body.description, "Description is required"),
    rating: existing?.rating || 4.5,
    images: Array.isArray(body.images) && body.images.length ? body.images : existing?.images || [],
    imageSeed: existing?.imageSeed || Math.floor(Math.random() * 360),
    createdAt: existing?.createdAt || new Date().toISOString(),
    sales: existing?.sales || 0
  };
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  return [];
}

function saveBase64Image(file) {
  const name = requireString(file.name, "File name is required");
  const dataUrl = requireString(file.dataUrl, "File content is required");
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid image payload");
  const extension = matches[1].split("/")[1] === "jpeg" ? "jpg" : matches[1].split("/")[1];
  const filename = `${Date.now()}-${slugify(path.parse(name).name)}.${extension}`;
  const target = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(target, Buffer.from(matches[2], "base64"));
  return { url: `/uploads/${filename}`, name: filename };
}

function writeEmailOutbox(order) {
  const payload = [
    `To: ${order.email}`,
    `Subject: Order Confirmation ${order.id}`,
    "",
    `Hi ${order.customerName},`,
    `Your order ${order.id} has been received.`,
    `Payment status: ${order.paymentStatus}`,
    `Order status: ${order.status}`,
    `Total: ${order.total}`,
    "",
    "Items:",
    ...order.items.map((item) => `- ${item.name} x${item.quantity} (${item.size}/${item.color})`)
  ].join("\n");
  fs.writeFileSync(path.join(OUTBOX_DIR, `${order.id}.txt`), payload);
}

function authenticate(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { user: null };
  try {
    const payload = verifyToken(token);
    const user = db.users.find((entry) => entry.id === payload.sub);
    return { user: user || null };
  } catch {
    return { user: null };
  }
}

function createToken(user) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  }));
  const signature = signToken(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) throw new Error("Invalid token");
  if (signToken(`${header}.${payload}`) !== signature) throw new Error("Invalid signature");
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (parsed.exp < Math.floor(Date.now() / 1000)) throw new Error("Expired token");
  return parsed;
}

function signToken(value) {
  return crypto.createHmac("sha256", JWT_SECRET).update(value).digest("base64url");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    address: user.address || "",
    createdAt: user.createdAt
  };
}

function readDb() {
  if (!fs.existsSync(DATA_FILE)) {
    const seeded = createSeedDb();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  const db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  let changed = false;
  db.products = db.products.map((product) => {
    if (!Array.isArray(product.images) || !product.images.length) {
      changed = true;
      return { ...product, images: defaultProductImages[product.name] || [] };
    }
    return product;
  });
  changed = ensureCatalogCompleteness(db) || changed;
  if (changed) fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  return db;
}

function writeDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function createSeedDb() {
  const categories = ["Men", "Women", "Hoodies", "Tees", "Outerwear", "Accessories"];
  const adminId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  const products = [
    seedProduct("Chaos Hoodie", "Men", 45000, 52000, ["Black", "Ash"], ["S", "M", "L", "XL"], 12, ["new", "sale", "featured", "limited"], "Oversized fleece hoodie with raw hem energy and high-density front script."),
    seedProduct("Metro Hoodie", "Hoodies", 47000, null, ["Black", "Olive"], ["M", "L", "XL"], 8, ["featured"], "Heavyweight graphic hoodie made for night movement and clean layering."),
    seedProduct("Vanta Hoodie", "Men", 49000, 56000, ["Black", "Wine"], ["S", "M", "L"], 5, ["sale", "limited"], "Statement embroidery and structured shoulder line with thermal interior."),
    seedProduct("Noir Track Jacket", "Outerwear", 62000, null, ["Black", "Gold"], ["M", "L", "XL"], 7, ["new", "featured"], "Performance trim jacket with contrast piping and low-gloss finish."),
    seedProduct("Reflect Tee", "Tees", 24000, null, ["Bone", "Black"], ["S", "M", "L", "XL"], 18, ["new"], "Soft jersey tee with minimal chest hit and oversized drape."),
    seedProduct("Soft Armor Set", "Women", 68000, 76000, ["Stone", "Black"], ["S", "M", "L"], 6, ["sale", "featured"], "Cropped zip jacket and wide-leg bottom set for elevated off-duty wear."),
    seedProduct("Limited Cargo", "Men", 58000, null, ["Black", "Graphite"], ["M", "L", "XL"], 11, ["limited"], "Structured cargo trouser with metal trim and adjustable ankle opening."),
    seedProduct("Studio Cap", "Accessories", 15000, null, ["Black"], ["One Size"], 22, ["featured"], "Low-profile cap with tonal mark and brushed cotton feel.")
  ];
  return {
    categories,
    users: [
      { id: adminId, name: "Admin User", email: "admin@nevermind.com", passwordHash: hashPassword("admin123"), role: "admin", address: "12 Victoria Island, Lagos", createdAt: now },
      { id: userId, name: "Amina James", email: "amina@example.com", passwordHash: hashPassword("demo123"), role: "user", address: "45 Admiralty Way, Lekki", createdAt: now }
    ],
    products,
    carts: [],
    wishlists: [],
    orders: [],
    reviews: [
      { id: crypto.randomUUID(), productId: products[0].id, userId, userName: "Amina", rating: 5, comment: "The fit is clean and the fabric feels premium.", createdAt: now },
      { id: crypto.randomUUID(), productId: products[5].id, userId, userName: "Amina", rating: 5, comment: "Looks expensive in person and sizes match perfectly.", createdAt: now }
    ],
    newsletter: [],
    contacts: [],
    failedPayments: []
  };
}

function seedProduct(name, category, price, oldPrice, colors, sizes, stock, tags, description) {
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
    rating: 4.5,
    images: defaultProductImages[name] || [],
    imageSeed: Math.floor(Math.random() * 360),
    createdAt: new Date().toISOString(),
    sales: Math.floor(Math.random() * 80) + 10
  };
}

function ensureCatalogCompleteness(db) {
  let changed = false;
  changed = appendSupplementalProducts(db, "Men", supplementalCatalog.men) || changed;
  changed = appendSupplementalProducts(db, "Women", supplementalCatalog.women) || changed;
  return changed;
}

function appendSupplementalProducts(db, category, items) {
  let changed = false;
  for (const entry of items) {
    const [name, price, oldPrice, colors, sizes, stock, tags, description, image] = entry;
    if (db.products.some((product) => product.name === name)) continue;
    db.products.push({
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
      rating: 4.6,
      images: [image],
      imageSeed: Math.floor(Math.random() * 360),
      createdAt: new Date().toISOString(),
      sales: Math.floor(Math.random() * 20) + 5
    });
    changed = true;
  }
  return changed;
}

function getProductOrThrow(db, productId) {
  const product = db.products.find((entry) => entry.id === productId);
  if (!product) throw new HttpError(404, "Product not found");
  return product;
}

function validateStock(product, quantity) {
  if (product.stock < quantity) throw new HttpError(400, "Product is out of stock");
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function addCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
}

function allowRequest(req, res) {
  const key = `${req.socket.remoteAddress}:${new Date().getUTCMinutes()}`;
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);
  if (bucket.count > RATE_LIMIT_MAX) {
    sendJson(res, 429, { error: "Too many requests" });
    return false;
  }
  return true;
}

async function readJson(req) {
  const body = await readBody(req);
  return body ? JSON.parse(body) : {};
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 5_000_000) reject(new HttpError(413, "Payload too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function serveFile(res, filePath) {
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) return sendJson(res, 404, { error: "Not found" });
  const extension = path.extname(filePath).toLowerCase();
  const type = mimeTypes[extension] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store, no-cache, must-revalidate"
  });
  fs.createReadStream(filePath).pipe(res);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendEmpty(res, statusCode) {
  res.writeHead(statusCode);
  res.end();
}

function requireString(value, message) {
  const normalized = String(value || "").trim();
  if (!normalized) throw new HttpError(400, message);
  return normalized;
}

function requireEmail(value) {
  const email = requireString(value, "Email is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Invalid email");
  return email;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function base64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

process.on("uncaughtException", (error) => {
  console.error(error);
});

process.on("unhandledRejection", (error) => {
  console.error(error);
});
