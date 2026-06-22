import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import nodemailer from 'nodemailer';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, set, get } from 'firebase/database';
import crypto from 'crypto';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
// 50MB limit to handle Base64 image payloads in bulk-update requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup static uploads folder
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));


// Ensure db.json exists
const dbPath = path.join(__dirname, 'data', 'db.json');
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Native base32 decoding for Google Authenticator TOTP secrets
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let clean = base32.toUpperCase().replace(/=+$/, '');
  let length = clean.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8));

  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      buffer[index++] = (value >> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return buffer;
}

// Verify TOTP 6-digit code against base32 secret
function verifyTOTP(secret, code, window = 1) {
  if (!code || code.length !== 6) return false;
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(epoch / 30);
    
    for (let i = -window; i <= window; i++) {
      const counter = currentCounter + i;
      const buffer = Buffer.alloc(8);
      let tmp = counter;
      for (let j = 7; j >= 0; j--) {
        buffer[j] = tmp & 0xff;
        tmp = tmp >> 8;
      }

      const hmac = crypto.createHmac('sha1', key);
      hmac.update(buffer);
      const hmacResult = hmac.digest();

      const offset = hmacResult[hmacResult.length - 1] & 0xf;
      const computedCodeVal =
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff);

      const otp = (computedCodeVal % 1000000).toString().padStart(6, '0');
      if (otp === code) return true;
    }
  } catch (err) {
    console.error("Error verifying TOTP code:", err);
  }
  return false;
}

// Generate base32 secret key
function generateBase32Secret(length = 16) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < length; i++) {
    const rand = crypto.randomInt(0, alphabet.length);
    secret += alphabet[rand];
  }
  return secret;
}

// Session authentication variables
let activeAdminSessionToken = null;

// Middleware to secure administrator-only API routes
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token !== activeAdminSessionToken) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired administrator session' });
  }
  next();
}

const fileToDataUrl = (file) => {
  if (!file || !file.path) return '';
  try {
    const fileBuffer = fs.readFileSync(file.path);
    const ext = path.extname(file.originalname).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    
    const base64 = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    // Clean up local file to save space and prevent accumulation
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.warn(`[Base64 Sync] Failed to delete temporary file ${file.path}:`, err.message);
    }
    
    return dataUrl;
  } catch (err) {
    console.error(`[Base64 Sync] Error converting file ${file.path} to Data URL:`, err.message);
    return '';
  }
};

const ensureArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
};

// Database helper functions
const readDb = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(data);
    if (!db.admin) {
      db.admin = {
        username: "admin",
        password: "", // starts empty (verify by email otp first to set it)
        email: "Riomedicahealthcare@gmail.com",
        twoFactorSecret: "",
        twoFactorEnabled: false
      };
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    }
    db.categories = ensureArray(db.categories);
    db.products = ensureArray(db.products);
    db.collections = ensureArray(db.collections);
    db.offers = ensureArray(db.offers);
    db.registrations = ensureArray(db.registrations);
    db.mrs = ensureArray(db.mrs);
    db.doctorVisits = ensureArray(db.doctorVisits);
    db.orders = ensureArray(db.orders);
    return db;
  } catch (err) {
    console.error("Error reading database file, returning default structure", err);
    return { 
      categories: [], 
      products: [], 
      collections: [], 
      offers: [], 
      registrations: [],
      mrs: [],
      doctorVisits: [],
      orders: [],
      admin: {
        username: "admin",
        password: "",
        email: "Riomedicahealthcare@gmail.com",
        twoFactorSecret: "",
        twoFactorEnabled: false
      }
    };
  }
};

const saveBase64ToCloud = async (type, id, base64Str) => {
  if (!firebaseDb || !base64Str || !base64Str.startsWith('data:')) return;
  try {
    const path = `${type}s/${id}`; // e.g. packshots/prod_xxx, categorys/cat_xxx
    await set(ref(firebaseDb, path), base64Str);
    console.log(`[Firebase Cloud Storage] Saved raw Base64 for ${type} ${id} to cloud`);
  } catch (err) {
    console.error(`[Firebase Cloud Storage] Failed to save Base64 for ${type} ${id}:`, err.message);
  }
};

const base64ToFile = (base64Str, prefix, id, extension = 'png') => {
  if (!base64Str) return '';
  if (!base64Str.startsWith('data:')) return base64Str;
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Str;

    const ext = matches[1].split('/')[1] || extension;
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}_${id}.${ext}`;
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Save Base64 to cloud in the background asynchronously
    saveBase64ToCloud(prefix, id, base64Str).catch(err => {
      console.error(`[Firebase Cloud Storage] Error backing up ${prefix} ${id}:`, err.message);
    });

    return `/uploads/${filename}`;
  } catch (err) {
    console.error(`[Base64 Sync] Error writing file for ${prefix}_${id}:`, err.message);
    return base64Str;
  }
};

const processDbImagesInPlace = (db) => {
  if (!db) return;
  
  db.categories = ensureArray(db.categories);
  db.products = ensureArray(db.products);
  db.banners = ensureArray(db.banners);
  db.registrations = ensureArray(db.registrations);

  const toUrl = (base64Str, prefix, id) => {
    if (!base64Str) return '';
    if (!base64Str.startsWith('data:')) return base64Str;
    return base64ToFile(base64Str, prefix, id);
  };

  db.categories.forEach(cat => {
    cat.icon = toUrl(cat.icon, 'category', cat.id);
  });

  db.products.forEach(p => {
    p.packshot = toUrl(p.packshot, 'packshot', p.id);
    if (Array.isArray(p.visualAids)) {
      p.visualAids = p.visualAids.map((aid, idx) => toUrl(aid, 'visualaid', `${p.id}_${idx}`));
    }
  });

  if (db.branding) {
    db.branding.logo = toUrl(db.branding.logo, 'branding', 'logo');
    db.branding.landingBgImage = toUrl(db.branding.landingBgImage, 'branding', 'landingBgImage');
    db.branding.topRightBadge = toUrl(db.branding.topRightBadge, 'branding', 'topRightBadge');
  }

  db.banners.forEach(b => {
    b.imageUrl = toUrl(b.imageUrl, 'banner', b.id);
  });

  db.registrations.forEach(r => {
    r.drugLicenceUrl = toUrl(r.drugLicenceUrl, 'reg_licence', r.id);
    r.gstUrl = toUrl(r.gstUrl, 'reg_gst', r.id);
    r.panUrl = toUrl(r.panUrl, 'reg_pan', r.id);
  });
};

const rebuildUploadsFromDb = (db) => {
  // processDbImagesInPlace will automatically write files and back them up to Firebase.
  processDbImagesInPlace(db);
};

const cleanDbForClient = (db) => {
  if (!db) return db;
  // db is already clean of Base64 strings since we clean in-place during writeDb!
  // Return a copy to ensure safe client responses.
  return JSON.parse(JSON.stringify(db));
};

const writeDb = (data) => {
  try {
    // Process images (write physical files, trigger separate backups, and replace with URL strings in-place)
    processDbImagesInPlace(data);

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    // NOTE: Bulk Firebase root sync is disabled to protect client-side direct Base64 image uploads.
    // Target-specific changes (orders, MRs, registrations, approvals) are synced directly at the endpoint level.
  } catch (err) {
    console.error("Error writing to database file", err);
  }
};


const syncFromFirebaseOnStartup = async () => {
  console.log("[Firebase Sync] Startup database sync is permanently disabled to prevent payload overflow and memory crashes on Render.");
  try {
    const db = readDb();
    rebuildUploadsFromDb(db);
  } catch (err) {}
};


// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// Product upload configurations
const productUploads = upload.fields([
  { name: 'packshot', maxCount: 1 },
  { name: 'visualAids', maxCount: 10 }
]);

// Offer upload configuration
const offerUpload = upload.single('image');

// Registration upload configuration
const registerUploads = upload.fields([
  { name: 'drugLicence', maxCount: 1 },
  { name: 'gst', maxCount: 1 },
  { name: 'pan', maxCount: 1 }
]);

// Branding logo, landing background, and badge uploads configuration
const brandingUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'landingBgImage', maxCount: 1 },
  { name: 'topRightBadge', maxCount: 1 }
]);

// Banner image upload configuration
const bannerUpload = upload.single('image');

// Excel / CSV bulk upload configuration (memory storage for parsing)
const excelStorage = multer.memoryStorage();
const excelUpload = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx, .xls, and .csv files are allowed.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
}).single('file');

// --- CATEGORIES ROUTES ---
app.get('/api/categories', (req, res) => {
  const db = readDb();
  res.json(cleanDbForClient(db).categories);
});

app.post('/api/categories', requireAdminAuth, (req, res) => {
  const { name, description, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const db = readDb();
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  if (db.categories.find(c => c.id === id)) {
    return res.status(400).json({ error: 'Category already exists' });
  }

  const newCategory = { id, name, description: description || '', icon: icon || 'activity' };
  db.categories.push(newCategory);
  writeDb(db);
  res.status(201).json(newCategory);
});

app.delete('/api/categories/:id', requireAdminAuth, (req, res) => {
  const db = readDb();
  const index = db.categories.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Category not found' });

  // Delete category and unassign products from it
  db.categories.splice(index, 1);
  db.products = db.products.map(p => p.categoryId === req.params.id ? { ...p, categoryId: '' } : p);
  
  writeDb(db);
  res.json({ message: 'Category deleted successfully' });
});

// --- PRODUCTS ROUTES ---
app.get('/api/products', (req, res) => {
  const db = readDb();
  res.json(cleanDbForClient(db).products);
});

// Fallback image endpoint — serves the raw Base64 image from Firebase RTDB or local backup when the
// static /uploads/ file has been lost (e.g. after Render container restart).
// Client hits this URL: /api/image/packshot/<productId>
app.get('/api/image/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    let base64Str = '';

    // 1. Try to fetch from Firebase separate cloud storage (high priority)
    if (firebaseDb) {
      if (type === 'packshot') {
        const snap = await get(ref(firebaseDb, `packshots/${id}`));
        base64Str = snap.exists() ? snap.val() : '';
      } else if (type === 'visualaid') {
        const snap = await get(ref(firebaseDb, `visualaids/${id}`));
        base64Str = snap.exists() ? snap.val() : '';
      } else if (type === 'category') {
        const snap = await get(ref(firebaseDb, `categorys/${id}`));
        base64Str = snap.exists() ? snap.val() : '';
      } else if (type === 'banner') {
        const snap = await get(ref(firebaseDb, `banners/${id}`));
        base64Str = snap.exists() ? snap.val() : '';
      } else if (type === 'branding-logo') {
        const snap = await get(ref(firebaseDb, `brandings/logo`));
        base64Str = snap.exists() ? snap.val() : '';
      }
    }

    // 2. Offline fallback: search local db.json if Firebase was empty/offline
    if (!base64Str) {
      const db = readDb();
      if (type === 'packshot') {
        const product = (db.products || []).find(p => p.id === id);
        base64Str = product?.packshot || '';
      } else if (type === 'visualaid') {
        const parts = id.split('_');
        const prodId = parts.slice(0, -1).join('_');
        const idx = parseInt(parts[parts.length - 1], 10);
        const product = (db.products || []).find(p => p.id === prodId);
        base64Str = product?.visualAids?.[idx] || '';
      } else if (type === 'category') {
        const cat = (db.categories || []).find(c => c.id === id);
        base64Str = cat?.icon || '';
      } else if (type === 'banner') {
        const banner = (db.banners || []).find(b => b.id === id);
        base64Str = banner?.imageUrl || '';
      } else if (type === 'branding-logo') {
        base64Str = db.branding?.logo || '';
      }
    }

    if (!base64Str || !base64Str.startsWith('data:')) {
      return res.status(404).json({ error: 'Image not found in database or cloud storage' });
    }

    // Reconstruct the static file on disk so the next request hits nginx/static directly
    base64ToFile(base64Str, type, id);

    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid image data' });

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 1 day
    res.send(buffer);
  } catch (err) {
    console.error('[Image Fallback] Error serving image:', err.message);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});


app.post('/api/products', requireAdminAuth, productUploads, (req, res) => {
  const { id, name, categoryId, composition, indications, dosage, lbl, videoUrl, isNewLaunch, mrp } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name is required' });

  const db = readDb();
  const prodId = id || `prod_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

  // Retrieve file paths
  let packshotUrl = '';
  let visualAidsUrls = [];

  if (req.files) {
    if (req.files['packshot'] && req.files['packshot'][0]) {
      packshotUrl = fileToDataUrl(req.files['packshot'][0]);
    }
    if (req.files['visualAids']) {
      visualAidsUrls = req.files['visualAids'].map(file => fileToDataUrl(file));
    }
  }

  const newProduct = {
    id: prodId,
    categoryId: categoryId || '',
    name,
    composition: composition || '',
    indications: indications || '',
    dosage: dosage || '',
    packshot: packshotUrl,
    visualAids: visualAidsUrls,
    lbl: lbl || '',
    videoUrl: videoUrl || '',
    isNewLaunch: isNewLaunch === 'true' || isNewLaunch === true,
    mrp: mrp || ''
  };

  db.products.push(newProduct);
  writeDb(db);

  if (firebaseDb) {
    const savedProduct = db.products.find(p => p.id === prodId);
    if (savedProduct) {
      set(ref(firebaseDb, `products/${prodId}`), savedProduct).catch(() => {});
    }
  }

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAdminAuth, productUploads, (req, res) => {
  const db = readDb();
  const productIndex = db.products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) return res.status(404).json({ error: 'Product not found' });

  const existingProduct = db.products[productIndex];
  
  // Extract fields from body
  const { name, categoryId, composition, indications, dosage, lbl, videoUrl, keepExistingAids, isNewLaunch, mrp } = req.body;
  
  let packshotUrl = existingProduct.packshot;
  let visualAidsUrls = existingProduct.visualAids;

  // If new files uploaded
  if (req.files) {
    if (req.files['packshot'] && req.files['packshot'][0]) {
      packshotUrl = fileToDataUrl(req.files['packshot'][0]);
    }
    if (req.files['visualAids'] && req.files['visualAids'].length > 0) {
      const newAids = req.files['visualAids'].map(file => fileToDataUrl(file));
      if (keepExistingAids === 'true') {
        visualAidsUrls = [...visualAidsUrls, ...newAids];
      } else {
        visualAidsUrls = newAids;
      }
    }
  }

  const updatedProduct = {
    ...existingProduct,
    name: name !== undefined ? name : existingProduct.name,
    categoryId: categoryId !== undefined ? categoryId : existingProduct.categoryId,
    composition: composition !== undefined ? composition : existingProduct.composition,
    indications: indications !== undefined ? indications : existingProduct.indications,
    dosage: dosage !== undefined ? dosage : existingProduct.dosage,
    lbl: lbl !== undefined ? lbl : existingProduct.lbl,
    videoUrl: videoUrl !== undefined ? videoUrl : existingProduct.videoUrl,
    packshot: packshotUrl,
    visualAids: visualAidsUrls,
    isNewLaunch: isNewLaunch !== undefined ? (isNewLaunch === 'true' || isNewLaunch === true) : existingProduct.isNewLaunch,
    mrp: mrp !== undefined ? mrp : existingProduct.mrp
  };

  db.products[productIndex] = updatedProduct;
  writeDb(db);

  if (firebaseDb) {
    const savedProduct = db.products[productIndex];
    set(ref(firebaseDb, `products/${req.params.id}`), savedProduct).catch(() => {});
  }

  res.json(updatedProduct);
});

app.post('/api/products/bulk-insert', requireAdminAuth, (req, res) => {
  const { products, categories } = req.body;
  const db = readDb();
  let productsAdded = 0;
  let categoriesAdded = 0;

  if (Array.isArray(categories)) {
    categories.forEach(cat => {
      if (!db.categories.find(c => c.id === cat.id)) {
        db.categories.push(cat);
        categoriesAdded++;
      }
    });
  }

  if (Array.isArray(products)) {
    products.forEach(prod => {
      if (!db.products.find(p => p.id === prod.id)) {
        db.products.push(prod);
        productsAdded++;
      }
    });
  }

  writeDb(db);
  res.json({ success: true, productsAdded, categoriesAdded });
});

app.post('/api/products/bulk-update', requireAdminAuth, (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products)) {
    return res.status(400).json({ error: 'Products array is required' });
  }

  const db = readDb();
  let updatedCount = 0;

  db.products = db.products.map(p => {
    const matched = products.find(u => u.id === p.id);
    if (matched) {
      updatedCount++;
      const updatedItem = {
        ...p,
        ...matched
      };
      if (firebaseDb) {
        set(ref(firebaseDb, `products/${p.id}`), updatedItem).catch(() => {});
      }
      return updatedItem;
    }
    return p;
  });

  writeDb(db);
  res.json({ message: `Successfully updated ${updatedCount} products.`, count: updatedCount });
});

app.delete('/api/products/:id', requireAdminAuth, (req, res) => {
  const db = readDb();
  const productIndex = db.products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) return res.status(404).json({ error: 'Product not found' });

  db.products.splice(productIndex, 1);
  
  // Remove product from any collections
  db.collections = db.collections.map(c => ({
    ...c,
    productIds: c.productIds.filter(id => id !== req.params.id)
  }));

  writeDb(db);

  if (firebaseDb) {
    remove(ref(firebaseDb, `products/${req.params.id}`)).catch(() => {});
    remove(ref(firebaseDb, `packshots/${req.params.id}`)).catch(() => {});
  }

  res.json({ message: 'Product deleted successfully' });
});

// Reset all products (clear product catalog)
app.post('/api/products/reset', requireAdminAuth, (req, res) => {
  const db = readDb();
  db.products = [];
  db.categories = []; // Reset Category Manager list for a fresh slate!
  
  // Also clear product associations in other tables to maintain reference integrity
  if (db.offers) db.offers = [];
  if (db.mrOffers) db.mrOffers = [];
  if (db.collections) {
    db.collections = db.collections.map(c => ({ ...c, productIds: [] }));
  }
  db.orders = []; // Clear B2B orders list on catalog reset
  
  writeDb(db);
  res.json({ message: 'Product catalog reset successfully' });
});

// --- COLLECTIONS ROUTES ---
app.get('/api/collections', (req, res) => {
  const db = readDb();
  res.json(db.collections);
});

app.post('/api/collections', requireAdminAuth, (req, res) => {
  const { name, description, productIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Collection name is required' });

  const db = readDb();
  const id = `coll_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
  
  const newCollection = {
    id,
    name,
    description: description || '',
    productIds: Array.isArray(productIds) ? productIds : []
  };

  db.collections.push(newCollection);
  writeDb(db);
  res.status(201).json(newCollection);
});

app.put('/api/collections/:id', requireAdminAuth, (req, res) => {
  const db = readDb();
  const index = db.collections.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Collection not found' });

  const { name, description, productIds } = req.body;
  const existingCollection = db.collections[index];

  const updatedCollection = {
    ...existingCollection,
    name: name !== undefined ? name : existingCollection.name,
    description: description !== undefined ? description : existingCollection.description,
    productIds: productIds !== undefined ? productIds : existingCollection.productIds
  };

  db.collections[index] = updatedCollection;
  writeDb(db);
  res.json(updatedCollection);
});

app.delete('/api/collections/:id', requireAdminAuth, (req, res) => {
  const db = readDb();
  const index = db.collections.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Collection not found' });

  db.collections.splice(index, 1);
  writeDb(db);
  res.json({ message: 'Collection deleted successfully' });
});

// --- OFFERS ROUTES ---
app.get('/api/offers', (req, res) => {
  const db = readDb();
  res.json(db.offers || []);
});

app.post('/api/offers', requireAdminAuth, offerUpload, (req, res) => {
  const { title, description, discount, productId, expiry } = req.body;
  if (!title) return res.status(400).json({ error: 'Offer title is required' });

  const db = readDb();
  const id = `offer_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

  let imageUrl = '';
  if (req.file) {
    imageUrl = fileToDataUrl(req.file);
  }

  const newOffer = {
    id,
    title,
    description: description || '',
    discount: discount || '',
    productId: productId || '',
    expiry: expiry || '',
    imageUrl
  };

  if (!db.offers) db.offers = [];
  db.offers.push(newOffer);
  writeDb(db);
  res.status(201).json(newOffer);
});

app.delete('/api/offers/:id', requireAdminAuth, (req, res) => {
  const db = readDb();
  if (!db.offers) db.offers = [];

  const index = db.offers.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Offer not found' });

  db.offers.splice(index, 1);
  writeDb(db);
  res.json({ message: 'Offer deleted successfully' });
});

// --- REGISTRATIONS / USER AUTH ROUTES ---

// Submit new registration
app.post('/api/register', registerUploads, (req, res) => {
  const { firmName, ownerName, mobile, email } = req.body;
  if (!firmName || !ownerName || !mobile || !email) {
    return res.status(400).json({ error: 'All fields (Firm Name, Owner, Mobile, Email) are required' });
  }

  const db = readDb();
  const id = `reg_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

  let drugLicenceUrl = '';
  let gstUrl = '';
  let panUrl = '';

  if (req.files) {
    if (req.files['drugLicence'] && req.files['drugLicence'][0]) {
      drugLicenceUrl = fileToDataUrl(req.files['drugLicence'][0]);
    }
    if (req.files['gst'] && req.files['gst'][0]) {
      gstUrl = fileToDataUrl(req.files['gst'][0]);
    }
    if (req.files['pan'] && req.files['pan'][0]) {
      panUrl = fileToDataUrl(req.files['pan'][0]);
    }
  }

  const newReg = {
    id,
    firmName,
    ownerName,
    mobile,
    email,
    drugLicence: drugLicenceUrl,
    gst: gstUrl,
    pan: panUrl,
    status: 'pending',
    createdAt: new Date().toISOString(),
    loginDetails: null
  };

  if (!db.registrations) db.registrations = [];
  db.registrations.push(newReg);
  writeDb(db);

  res.status(201).json(newReg);
});

// Get registrations lists (for Admin Dashboard)
app.get('/api/registrations', requireAdminAuth, (req, res) => {
  const db = readDb();
  res.json(cleanDbForClient(db).registrations || []);
});

// Approve registration request & generate login details
app.post('/api/registrations/:id/approve', requireAdminAuth, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required to approve and generate user details' });
  }

  const db = readDb();
  if (!db.registrations) db.registrations = [];

  const index = db.registrations.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Registration request not found' });

  db.registrations[index].status = 'approved';
  db.registrations[index].loginDetails = { username, password };

  const approvedReg = db.registrations[index];
  writeDb(db);

  if (firebaseDb) {
    set(ref(firebaseDb, `registrations/${req.params.id}`), approvedReg).catch(() => {});
    set(ref(firebaseDb, `users/${req.params.id}`), {
      id: req.params.id,
      username,
      password,
      status: 'approved',
      firmName: approvedReg.firmName,
      ownerName: approvedReg.ownerName,
      mobile: approvedReg.mobile,
      email: approvedReg.email,
      createdAt: approvedReg.createdAt
    }).catch(() => {});
  }

  res.json(db.registrations[index]);
});

// Deny registration request
app.post('/api/registrations/:id/deny', requireAdminAuth, (req, res) => {
  const db = readDb();
  if (!db.registrations) db.registrations = [];

  const index = db.registrations.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Registration request not found' });

  db.registrations[index].status = 'denied';
  db.registrations[index].loginDetails = null;

  writeDb(db);

  if (firebaseDb) {
    set(ref(firebaseDb, `registrations/${req.params.id}`), db.registrations[index]).catch(() => {});
  }

  res.json(db.registrations[index]);
});

// Terminate franchise partner account and delete associated MRs
app.delete('/api/registrations/:id', requireAdminAuth, (req, res) => {
  const db = readDb();
  if (!db.registrations) db.registrations = [];
  if (!db.mrs) db.mrs = [];

  const index = db.registrations.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Franchise Partner not found' });

  const mrsToDelete = db.mrs.filter(m => m.distributorId === req.params.id);

  // Remove the registration
  db.registrations.splice(index, 1);

  // Cascade delete MRs
  db.mrs = db.mrs.filter(m => m.distributorId !== req.params.id);

  writeDb(db);

  if (firebaseDb) {
    remove(ref(firebaseDb, `registrations/${req.params.id}`)).catch(() => {});
    remove(ref(firebaseDb, `users/${req.params.id}`)).catch(() => {});
    mrsToDelete.forEach(m => {
      remove(ref(firebaseDb, `mrs/${m.id}`)).catch(() => {});
    });
  }

  res.json({ message: 'Franchise Partner account and all associated MR profiles terminated successfully.' });
});

// User change password (Franchise Partner or MR)
app.post('/api/user/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'userId, oldPassword, and newPassword are required' });
  }

  const db = readDb();
  if (!db.registrations) db.registrations = [];
  if (!db.mrs) db.mrs = [];

  // Search in Franchise Partners (approved registrations)
  const regIndex = db.registrations.findIndex(r => r.id === userId);
  if (regIndex !== -1) {
    const reg = db.registrations[regIndex];
    if (reg.loginDetails && reg.loginDetails.password === oldPassword) {
      db.registrations[regIndex].loginDetails.password = newPassword;
      writeDb(db);
      if (firebaseDb) {
        update(ref(firebaseDb, `registrations/${userId}/loginDetails`), { password: newPassword }).catch(() => {});
        update(ref(firebaseDb, `users/${userId}`), { password: newPassword }).catch(() => {});
      }
      return res.json({ message: 'Password changed successfully.' });
    } else {
      return res.status(400).json({ error: 'Incorrect old password' });
    }
  }

  // Search in MRs
  const mrIndex = db.mrs.findIndex(m => m.id === userId);
  if (mrIndex !== -1) {
    const mr = db.mrs[mrIndex];
    if (mr.loginDetails && mr.loginDetails.password === oldPassword) {
      db.mrs[mrIndex].loginDetails.password = newPassword;
      writeDb(db);
      if (firebaseDb) {
        update(ref(firebaseDb, `mrs/${userId}/loginDetails`), { password: newPassword }).catch(() => {});
      }
      return res.json({ message: 'Password changed successfully.' });
    } else {
      return res.status(400).json({ error: 'Incorrect old password' });
    }
  }

  return res.status(404).json({ error: 'User not found' });
});

// Admin reset user password
app.post('/api/admin/reset-password', requireAdminAuth, (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'userId and newPassword are required' });
  }

  const db = readDb();
  if (!db.registrations) db.registrations = [];
  if (!db.mrs) db.mrs = [];

  // Search in registrations (Franchise Partners)
  const regIndex = db.registrations.findIndex(r => r.id === userId);
  if (regIndex !== -1) {
    if (!db.registrations[regIndex].loginDetails) {
      db.registrations[regIndex].loginDetails = {};
    }
    db.registrations[regIndex].loginDetails.password = newPassword;
    writeDb(db);
    if (firebaseDb) {
      update(ref(firebaseDb, `registrations/${userId}/loginDetails`), { password: newPassword }).catch(() => {});
      update(ref(firebaseDb, `users/${userId}`), { password: newPassword }).catch(() => {});
    }
    return res.json({ message: 'Password reset successfully.' });
  }

  return res.status(404).json({ error: 'User not found' });
});

// Franchise resets MR password
app.post('/api/mrs/reset-password', (req, res) => {
  const { mrId, newPassword } = req.body;
  if (!mrId || !newPassword) {
    return res.status(400).json({ error: 'mrId and newPassword are required' });
  }

  const db = readDb();
  if (!db.mrs) db.mrs = [];

  const mrIndex = db.mrs.findIndex(m => m.id === mrId);
  if (mrIndex !== -1) {
    if (!db.mrs[mrIndex].loginDetails) {
      db.mrs[mrIndex].loginDetails = {};
    }
    db.mrs[mrIndex].loginDetails.password = newPassword;
    writeDb(db);
    if (firebaseDb) {
      update(ref(firebaseDb, `mrs/${mrId}/loginDetails`), { password: newPassword }).catch(() => {});
    }
    return res.json({ message: 'MR password reset successfully.' });
  }

  return res.status(404).json({ error: 'MR not found' });
});


// Authenticate user login
app.post('/api/login', (req, res) => {
  const { username, password, otp } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Admin account login validation
  if (username.toLowerCase() === 'admin') {
    const db = readDb();
    let firstFactorPassed = false;

    if (otp) {
      // Validate OTP
      const key = db.admin.email.toLowerCase();
      const record = activeOtps.email[key];
      if (record && Date.now() <= record.expiresAt && record.otp === otp) {
        firstFactorPassed = true;
        delete activeOtps.email[key]; // clear OTP
      } else {
        return res.status(400).json({ error: 'Invalid or expired administrator verification OTP' });
      }
    } else {
      if (!password) {
        return res.status(400).json({ error: 'Password or OTP is required for administrator login' });
      }
      // Validate password (only if password is not empty)
      if (db.admin.password && db.admin.password === password) {
        firstFactorPassed = true;
      } else {
        return res.status(401).json({ error: 'Invalid administrator password credentials' });
      }
    }

    if (firstFactorPassed) {
      // Check if 2FA (Google Authenticator) is enabled
      if (db.admin.twoFactorEnabled && db.admin.twoFactorSecret) {
        return res.json({
          message: 'First factor verified. 2-Step Verification required.',
          require2FA: true,
          adminEmail: db.admin.email
        });
      } else {
        // Log in directly
        activeAdminSessionToken = crypto.randomBytes(32).toString('hex');
        return res.json({
          message: 'Login successful',
          role: 'admin',
          token: activeAdminSessionToken,
          user: {
            id: 'admin_root',
            firmName: 'Riomedica Admin Head Office',
            ownerName: 'Riomedica Admin',
            mobile: '0000000000',
            email: db.admin.email
          }
        });
      }
    }
  }

  // Distributor/MR login validation
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const db = readDb();
  if (!db.registrations) db.registrations = [];

  // Look for approved registration with matching credentials
  const account = db.registrations.find(
    r => r.status === 'approved' &&
         r.loginDetails &&
         r.loginDetails.username.toLowerCase() === username.toLowerCase() &&
         r.loginDetails.password === password
  );

  if (account) {
    return res.json({
      message: 'Login successful',
      role: 'distributor',
      user: {
        id: account.id,
        firmName: account.firmName,
        ownerName: account.ownerName,
        mobile: account.mobile,
        email: account.email
      }
    });
  }

  // If not found in registrations, look in MRs
  if (!db.mrs) db.mrs = [];
  const mr = db.mrs.find(
    m => m.loginDetails &&
         m.loginDetails.username.toLowerCase() === username.toLowerCase() &&
         m.loginDetails.password === password
  );

  if (mr) {
    // Find parent distributor name
    const parent = db.registrations.find(r => r.id === mr.distributorId);
    return res.json({
      message: 'Login successful',
      role: 'mr',
      user: {
        id: mr.id,
        distributorId: mr.distributorId,
        firmName: parent ? parent.firmName : 'Franchise Partner',
        distributorMobile: parent ? parent.mobile : '',
        ownerName: mr.name,
        mobile: mr.mobile,
        email: mr.email,
        territory: mr.territory
      }
    });
  }

  return res.status(401).json({ error: 'Invalid credentials or account is still pending verification by Admin' });
});

// Admin 2FA Code Verification
app.post('/api/admin/verify-2fa', (req, res) => {
  const { username, totpCode, fallbackOtp } = req.body;
  if (!username || username.toLowerCase() !== 'admin') {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const db = readDb();

  if (totpCode) {
    if (db.admin.twoFactorEnabled && db.admin.twoFactorSecret && verifyTOTP(db.admin.twoFactorSecret, totpCode)) {
      activeAdminSessionToken = crypto.randomBytes(32).toString('hex');
      return res.json({
        message: 'Login successful',
        role: 'admin',
        token: activeAdminSessionToken,
        user: {
          id: 'admin_root',
          firmName: 'Riomedica Admin Head Office',
          ownerName: 'Riomedica Admin',
          mobile: '0000000000',
          email: db.admin.email
        }
      });
    } else {
      return res.status(400).json({ error: 'Invalid 2-Step Verification code' });
    }
  } else if (fallbackOtp) {
    const key = db.admin.email.toLowerCase();
    const record = activeOtps.email[key];
    if (record && Date.now() <= record.expiresAt && record.otp === fallbackOtp) {
      delete activeOtps.email[key]; // clear OTP
      activeAdminSessionToken = crypto.randomBytes(32).toString('hex');
      return res.json({
        message: 'Login successful (Backup Verified)',
        role: 'admin',
        token: activeAdminSessionToken,
        user: {
          id: 'admin_root',
          firmName: 'Riomedica Admin Head Office',
          ownerName: 'Riomedica Admin',
          mobile: '0000000000',
          email: db.admin.email
        }
      });
    } else {
      return res.status(400).json({ error: 'Invalid or expired backup verification OTP' });
    }
  }

  return res.status(400).json({ error: 'Verification code is required' });
});

// Get Admin Security Status
app.get('/api/admin/status', requireAdminAuth, (req, res) => {
  const db = readDb();
  res.json({
    twoFactorEnabled: !!(db.admin && db.admin.twoFactorEnabled),
    email: db.admin ? db.admin.email : 'Riomedicahealthcare@gmail.com'
  });
});

// Generate 2FA Secret
app.post('/api/admin/setup-2fa', requireAdminAuth, (req, res) => {
  const db = readDb();
  const secret = generateBase32Secret();
  const label = encodeURIComponent(`RiomedicaAdmin:${db.admin.email}`);
  const issuer = encodeURIComponent('RiomedicaAdmin');
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
  
  res.json({ secret, qrCodeUrl });
});

// Enable 2FA
app.post('/api/admin/enable-2fa', requireAdminAuth, (req, res) => {
  const { secret, code } = req.body;
  if (!secret || !code) {
    return res.status(400).json({ error: 'Secret and verification code are required' });
  }

  if (verifyTOTP(secret, code)) {
    const db = readDb();
    db.admin.twoFactorSecret = secret;
    db.admin.twoFactorEnabled = true;
    writeDb(db);
    res.json({ success: true, message: 'Google Authenticator 2-Step Verification enabled successfully' });
  } else {
    res.status(400).json({ error: 'Invalid verification code. Setup failed.' });
  }
});

// Disable 2FA
app.post('/api/admin/disable-2fa', requireAdminAuth, (req, res) => {
  const { code, fallbackOtp } = req.body;
  const db = readDb();

  let verified = false;
  if (code) {
    if (db.admin.twoFactorSecret && verifyTOTP(db.admin.twoFactorSecret, code)) {
      verified = true;
    }
  } else if (fallbackOtp) {
    const key = db.admin.email.toLowerCase();
    const record = activeOtps.email[key];
    if (record && Date.now() <= record.expiresAt && record.otp === fallbackOtp) {
      delete activeOtps.email[key];
      verified = true;
    }
  }

  if (verified) {
    db.admin.twoFactorEnabled = false;
    db.admin.twoFactorSecret = '';
    writeDb(db);
    res.json({ success: true, message: 'Google Authenticator 2-Step Verification disabled successfully' });
  } else {
    res.status(400).json({ error: 'Invalid verification code' });
  }
});

// Change Admin Password
app.post('/api/admin/change-password', requireAdminAuth, (req, res) => {
  const { newPassword, otp } = req.body;
  if (!newPassword || !otp) {
    return res.status(400).json({ error: 'New password and verification OTP are required' });
  }

  const db = readDb();
  const key = db.admin.email.toLowerCase();
  const record = activeOtps.email[key];

  if (record && Date.now() <= record.expiresAt && record.otp === otp) {
    delete activeOtps.email[key];
    db.admin.password = newPassword;
    writeDb(db);
    res.json({ success: true, message: 'Administrator password updated successfully' });
  } else {
    res.status(400).json({ error: 'Invalid or expired verification OTP' });
  }
});

// Short-term memory store for active OTP codes
const activeOtps = {
  mobile: {}, // mobile -> { otp, expiresAt }
  email: {}   // emailOrUsername -> { otp, expiresAt }
};

// Helper to generate a 6-digit random number string
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper to send Gmail OTP via SMTP
const sendOtpMail = async (toEmail, otp, type) => {
  const db = readDb();
  let settings = db.settings || {};

  // Read settings from Firebase first — these persist across Render container restarts
  // so that gmailApiUrl / otpChannel configured via admin UI always take effect.
  try {
    const fbSnap = await get(ref(firebaseDb, 'settings'));
    if (fbSnap.exists()) {
      const fbSettings = fbSnap.val();
      // Firebase values override stale db.json values
      settings = { ...settings, ...fbSettings };
    }
  } catch (fbSettingsErr) {
    console.warn('[sendOtpMail] Firebase settings read failed, falling back to db.json:', fbSettingsErr.message);
  }

  const channel = settings.otpChannel || 'mock';
  const purpose = (type === 'register' || type === 'registration') ? 'Registration' : 'Sign In';

  console.log(`\n--- [GMAIL OTP GATEWAY] ---`);
  console.log(`To Email: ${toEmail}`);
  console.log(`Purpose: ${purpose}`);
  console.log(`Verification Code: ${otp}`);
  console.log(`Mode: ${channel.toUpperCase()}`);
  console.log(`---------------------------\n`);

  // 1. Google Apps Script Web App (Gmail API)
  if (channel === 'gmailApi') {
    if (!settings.gmailApiUrl) {
      console.error(`[GMAIL API ERROR] Google Apps Script URL not configured.`);
      return { success: false, mock: true, error: 'Google Apps Script URL not configured' };
    }
    try {
      const emailBody = `Please use the following 6-digit security code to verify your account for ${purpose}. This code is valid for 5 minutes.\n\nCode: ${otp}\n\nThis is an automated message from Riomedica Healthcare.`;
      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">RIOMEDICA HEALTHCARE</h2>
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Secure Verification Service</span>
          </div>
          <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
            <p style="margin-top: 0;">Hello,</p>
            <p>Please use the following 6-digit security code to verify your account for <strong>${purpose}</strong>. This code is valid for 5 minutes.</p>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: 800; color: #0f172a; letter-spacing: 6px; display: inline-block;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">If you did not request this verification code, please ignore this email or contact support.</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.4;">
            <p style="margin: 0;">&copy; 2026 Riomedica Healthcare Private Limited.</p>
            <p style="margin: 4px 0 0 0;">All Rights Reserved.</p>
          </div>
        </div>
      `;

      const response = await fetch(settings.gmailApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject: `Riomedica Verification Code: ${otp}`,
          body: emailBody,
          htmlBody: emailHtml
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resJson = await response.json();
      console.log(`[GMAIL API SUCCESS] Apps Script response:`, resJson);
      return { success: true, mock: false };
    } catch (err) {
      console.error(`[GMAIL API ERROR] Failed to send Gmail OTP email to ${toEmail}:`, err.message);
      return { success: false, mock: false, error: err.message };
    }
  }

  // 2. Brevo Transactional REST API
  if (channel === 'brevo') {
    if (!settings.brevoApiKey || !settings.brevoSenderEmail) {
      console.error(`[BREVO API ERROR] Brevo API Key or Sender Email not configured.`);
      return { success: false, mock: true, error: 'Brevo API configuration incomplete' };
    }
    try {
      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">RIOMEDICA HEALTHCARE</h2>
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Secure Verification Service</span>
          </div>
          <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
            <p style="margin-top: 0;">Hello,</p>
            <p>Please use the following 6-digit security code to verify your account for <strong>${purpose}</strong>. This code is valid for 5 minutes.</p>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: 800; color: #0f172a; letter-spacing: 6px; display: inline-block;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">If you did not request this verification code, please ignore this email or contact support.</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.4;">
            <p style="margin: 0;">&copy; 2026 Riomedica Healthcare Private Limited.</p>
            <p style="margin: 4px 0 0 0;">All Rights Reserved.</p>
          </div>
        </div>
      `;

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': settings.brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: "Riomedica Healthcare",
            email: settings.brevoSenderEmail
          },
          to: [
            {
              email: toEmail,
              name: "Recipient"
            }
          ],
          subject: `Riomedica Verification Code: ${otp}`,
          htmlContent: emailHtml
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Brevo HTTP ${response.status}: ${errText}`);
      }

      console.log(`[BREVO API SUCCESS] Email sent to ${toEmail}`);
      return { success: true, mock: false };
    } catch (err) {
      console.error(`[BREVO API ERROR] Failed to send Brevo OTP email to ${toEmail}:`, err.message);
      return { success: false, mock: false, error: err.message };
    }
  }

  // 3. Gmail SMTP Relay
  if (channel === 'smtp') {
    if (!settings.smtpEmail || !settings.smtpPassword) {
      console.warn(`[SMTP WARN] SMTP email/password not configured. Mocking OTP.`);
      return { success: true, mock: true };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Direct SSL/TLS (faster & bypasses STARTTLS inspection)
        auth: {
          user: settings.smtpEmail,
          pass: settings.smtpPassword
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
        family: 4 // Force IPv4 resolution to prevent ENETUNREACH on environments without IPv6 (like Render)
      });

      const mailOptions = {
        from: `"Riomedica Healthcare" <${settings.smtpEmail}>`,
        to: toEmail,
        subject: `Riomedica Verification Code: ${otp}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">RIOMEDICA HEALTHCARE</h2>
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Secure Verification Service</span>
            </div>
            <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
              <p style="margin-top: 0;">Hello,</p>
              <p>Please use the following 6-digit security code to verify your account for <strong>${purpose}</strong>. This code is valid for 5 minutes.</p>
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 36px; font-weight: 800; color: #0f172a; letter-spacing: 6px; display: inline-block;">${otp}</span>
              </div>
              <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">If you did not request this verification code, please ignore this email or contact support.</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.4;">
              <p style="margin: 0;">&copy; 2026 Riomedica Healthcare Private Limited.</p>
              <p style="margin: 4px 0 0 0;">All Rights Reserved.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true, mock: false };
    } catch (err) {
      console.error(`[SMTP ERROR] Failed to send Gmail OTP email to ${toEmail}:`, err.message);
      return { success: false, mock: true, error: err.message };
    }
  }

  // Fallback
  return { success: true, mock: true };
};

// ─── FIREBASE REALTIME DATABASE OTP LISTENER ─────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBhbOn155u8Pxi9BGaPxP9DMai0TOX7eo4",
  authDomain: "riomedica-healthcare.firebaseapp.com",
  databaseURL: "https://riomedica-healthcare-default-rtdb.firebaseio.com",
  projectId: "riomedica-healthcare",
  storageBucket: "riomedica-healthcare.firebasestorage.app",
  messagingSenderId: "502281093407",
  appId: "1:502281093407:android:c67abd87f164de1dfc702a"
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseDb = getDatabase(firebaseApp);

const startFirebaseOtpListener = () => {
  const activeOtpsRef = ref(firebaseDb, 'active_otps');
  console.log("[Firebase Server] Listening for active OTP requests on Firebase RTDB...");
  
  onValue(activeOtpsRef, async (snapshot) => {
    try {
      if (!snapshot.exists()) return;

      // Load active settings dynamically
      const db = readDb();
      const settings = db.settings || {};
      const channel = settings.otpChannel || 'mock';

      // If running on Render and channel is SMTP or Mock, we ignore it here
      // to let local listeners process it.
      if (process.env.RENDER === 'true' && (channel === 'smtp' || channel === 'mock')) {
        return;
      }

      const data = snapshot.val();
      
      // Process email OTPs
      if (data.email) {
        for (const [cleanKey, record] of Object.entries(data.email)) {
          if (record && record.isSent === false && record.originalKey && record.otp) {
            console.log(`[Firebase Server] Found unsent email OTP request for ${record.originalKey}. Code: ${record.otp}`);
            
            try {
              // Mark as processing to prevent duplicate sends
              await update(ref(firebaseDb, `active_otps/email/${cleanKey}`), { isSent: 'sending' }).catch(() => {});
              
              const mailRes = await sendOtpMail(record.originalKey, record.otp, record.type || 'login');
              if (mailRes.success && !mailRes.mock) {
                console.log(`[Firebase Server] Email sent successfully to ${record.originalKey}`);
                await update(ref(firebaseDb, `active_otps/email/${cleanKey}`), { 
                  isSent: true, 
                  sentAt: new Date().toISOString() 
                }).catch(() => {});
              } else {
                const status = mailRes.mock ? 'mocked' : 'failed';
                console.error(`[Firebase Server] Failed to send email to ${record.originalKey} (status: ${status}):`, mailRes.error);
                await update(ref(firebaseDb, `active_otps/email/${cleanKey}`), { 
                  isSent: status, 
                  error: mailRes.error || (mailRes.mock ? 'SMTP settings not configured' : 'SMTP Error') 
                }).catch(() => {});
              }
            } catch (innerErr) {
              console.error(`[Firebase Server] Error processing email OTP for ${record.originalKey}:`, innerErr.message);
            }
          }
        }
      }

      // Process password reset email OTPs
      if (data.email_reset) {
        for (const [cleanKey, record] of Object.entries(data.email_reset)) {
          if (record && record.isSent === false && record.originalKey && record.otp) {
            console.log(`[Firebase Server] Found unsent password reset OTP request for ${record.originalKey}. Code: ${record.otp}`);
            
            try {
              // Mark as processing
              await update(ref(firebaseDb, `active_otps/email_reset/${cleanKey}`), { isSent: 'sending' }).catch(() => {});
              
              const mailRes = await sendOtpMail(record.originalKey, record.otp, 'register');
              if (mailRes.success && !mailRes.mock) {
                console.log(`[Firebase Server] Reset email sent successfully to ${record.originalKey}`);
                await update(ref(firebaseDb, `active_otps/email_reset/${cleanKey}`), { 
                  isSent: true, 
                  sentAt: new Date().toISOString() 
                }).catch(() => {});
              } else {
                const status = mailRes.mock ? 'mocked' : 'failed';
                console.error(`[Firebase Server] Failed to send reset email to ${record.originalKey} (status: ${status}):`, mailRes.error);
                await update(ref(firebaseDb, `active_otps/email_reset/${cleanKey}`), { 
                  isSent: status, 
                  error: mailRes.error || (mailRes.mock ? 'SMTP settings not configured' : 'SMTP Error') 
                }).catch(() => {});
              }
            } catch (innerErr) {
              console.error(`[Firebase Server] Error processing reset email OTP for ${record.originalKey}:`, innerErr.message);
            }
          }
        }
      }
    } catch (outerErr) {
      console.error("[Firebase Server] Error in OTP listener callback:", outerErr.message);
    }
  });
};

// Start Firebase listener on load
try {
  // Disabled to prevent infinite optimistic update loop on Firebase write errors (permission_denied).
  // The client handles all email OTP dispatches directly via backend endpoints or browser Google Apps Script fallback.
  // startFirebaseOtpListener();
} catch (fbInitErr) {
  console.error("Failed to start Firebase OTP listener:", fbInitErr.message);
}

// Route to send general email OTP (either register or login)
app.post('/api/otp/send-email-otp', async (req, res) => {
  const { email, type } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute expiry
  const key = email.toLowerCase();

  activeOtps.email[key] = { otp, expiresAt };

  const mailRes = await sendOtpMail(email, otp, type || 'login');

  if (!mailRes.success) {
    delete activeOtps.email[key];
    return res.status(500).json({ error: mailRes.error || 'Failed to send verification email. Please verify SMTP setup.' });
  }

  res.json({ 
    message: 'Verification code sent successfully', 
    email,
    // Expose whether this was mocked (no real email sent) so the client can
    // trigger Google Apps Script directly as an additional delivery channel.
    mock: mailRes.mock || false
  });
});

// Route to verify email OTP
app.post('/api/otp/verify-email-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP code are required' });
  }

  const key = email.toLowerCase();
  const record = activeOtps.email[key];

  if (!record) {
    return res.status(400).json({ error: 'No verification code requested for this email' });
  }

  if (Date.now() > record.expiresAt) {
    delete activeOtps.email[key];
    return res.status(400).json({ error: 'Verification code has expired' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  // OTP verified, clear it
  delete activeOtps.email[key];
  res.json({ message: 'Email verified successfully' });
});

// Route to send mobile OTP
app.post('/api/otp/send-mobile', (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute expiry

  activeOtps.mobile[mobile] = { otp, expiresAt };

  console.log(`\n--- [MOCK SMS GATEWAY] ---`);
  console.log(`To Mobile: ${mobile}`);
  console.log(`Verification Code: ${otp}`);
  console.log(`--------------------------\n`);

  res.json({ message: 'OTP sent successfully', mockOtp: otp });
});

// Route to verify mobile OTP
app.post('/api/otp/verify-mobile', (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Mobile and OTP code are required' });
  }

  const record = activeOtps.mobile[mobile];
  if (!record) {
    return res.status(400).json({ error: 'No OTP requested for this mobile number' });
  }

  if (Date.now() > record.expiresAt) {
    delete activeOtps.mobile[mobile];
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP code' });
  }

  // OTP verified, clear it
  delete activeOtps.mobile[mobile];
  res.json({ message: 'Mobile verified successfully' });
});

// Route to send email OTP for password reset
app.post('/api/otp/send-email', async (req, res) => {
  const { usernameOrEmail } = req.body;
  if (!usernameOrEmail) {
    return res.status(400).json({ error: 'Username or email is required' });
  }

  const db = readDb();
  if (!db.registrations) db.registrations = [];

  // Find an approved partner matching the username or email
  const user = db.registrations.find(
    r => r.status === 'approved' &&
         ((r.email && r.email.toLowerCase() === usernameOrEmail.toLowerCase()) ||
          (r.loginDetails && r.loginDetails.username.toLowerCase() === usernameOrEmail.toLowerCase()))
  );

  if (!user) {
    return res.status(404).json({ error: 'No approved partner account found with this email or username' });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute expiry
  const key = usernameOrEmail.toLowerCase();

  activeOtps.email[key] = { otp, expiresAt };

  const mailRes = await sendOtpMail(user.email, otp, 'register');

  if (!mailRes.success) {
    delete activeOtps.email[key];
    return res.status(500).json({ error: mailRes.error || 'Failed to send verification email. Please verify SMTP setup.' });
  }

  res.json({ 
    message: 'OTP sent to registered email address', 
    email: user.email
  });
});

// Route to verify email OTP and reset password
app.post('/api/otp/verify-email-reset', (req, res) => {
  const { usernameOrEmail, otp, newPassword } = req.body;
  if (!usernameOrEmail || !otp || !newPassword) {
    return res.status(400).json({ error: 'All fields (Username/Email, OTP, New Password) are required' });
  }

  const key = usernameOrEmail.toLowerCase();
  const record = activeOtps.email[key];

  if (!record) {
    return res.status(400).json({ error: 'No OTP requested for this user' });
  }

  if (Date.now() > record.expiresAt) {
    delete activeOtps.email[key];
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP code' });
  }

  // Reset the password
  const db = readDb();
  if (!db.registrations) db.registrations = [];

  const index = db.registrations.findIndex(
    r => r.status === 'approved' &&
         ((r.email && r.email.toLowerCase() === key) ||
          (r.loginDetails && r.loginDetails.username.toLowerCase() === key))
  );

  if (index === -1) {
    delete activeOtps.email[key];
    return res.status(404).json({ error: 'User account not found' });
  }

  db.registrations[index].loginDetails.password = newPassword;
  writeDb(db);

  // Clear OTP
  delete activeOtps.email[key];

  res.json({ message: 'Password reset successful' });
});

// --- BRANDING ROUTES ---
app.get('/api/branding', (req, res) => {
  const db = readDb();
  res.json(cleanDbForClient(db).branding || { companyName: "RIOMEDICA", tagline: "Healthcare", logo: "", landingTitle: "", landingDescription: "", landingBgImage: "", topRightBadge: "" });
});

app.post('/api/branding', requireAdminAuth, brandingUpload, (req, res) => {
  const { companyName, tagline, landingTitle, landingDescription } = req.body;
  const db = readDb();

  if (!db.branding) {
    db.branding = { 
      companyName: "RIOMEDICA", 
      tagline: "Healthcare", 
      logo: "", 
      landingTitle: "Welcome to Riomedica", 
      landingDescription: "Interactive Detailing & B2B Portal. We provide premium pharmaceutical products, from tablets and syrups to ointments and more.", 
      landingBgImage: "", 
      topRightBadge: "" 
    };
  }

  if (companyName !== undefined) db.branding.companyName = companyName;
  if (tagline !== undefined) db.branding.tagline = tagline;
  if (landingTitle !== undefined) db.branding.landingTitle = landingTitle;
  if (landingDescription !== undefined) db.branding.landingDescription = landingDescription;

  if (req.files) {
    if (req.files.logo && req.files.logo[0]) {
      db.branding.logo = fileToDataUrl(req.files.logo[0]);
    }
    if (req.files.landingBgImage && req.files.landingBgImage[0]) {
      db.branding.landingBgImage = fileToDataUrl(req.files.landingBgImage[0]);
    }
    if (req.files.topRightBadge && req.files.topRightBadge[0]) {
      db.branding.topRightBadge = fileToDataUrl(req.files.topRightBadge[0]);
    }
  }

  writeDb(db);
  res.json(db.branding);
});

// --- SETTINGS ROUTES ---
app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings || { 
    geminiApiKey: "", 
    otpChannel: "mock", 
    smtpEmail: "", 
    smtpPassword: "",
    gmailApiUrl: "",
    brevoApiKey: "",
    brevoSenderEmail: ""
  });
});

app.post('/api/settings', requireAdminAuth, (req, res) => {
  const { 
    geminiApiKey, 
    otpChannel, 
    smtpEmail, 
    smtpPassword,
    gmailApiUrl,
    brevoApiKey,
    brevoSenderEmail
  } = req.body;
  const db = readDb();
  db.settings = db.settings || {};
  if (geminiApiKey !== undefined) db.settings.geminiApiKey = geminiApiKey || "";
  if (otpChannel !== undefined) db.settings.otpChannel = otpChannel || "mock";
  if (smtpEmail !== undefined) db.settings.smtpEmail = smtpEmail || "";
  if (smtpPassword !== undefined) db.settings.smtpPassword = smtpPassword || "";
  if (gmailApiUrl !== undefined) db.settings.gmailApiUrl = gmailApiUrl || "";
  if (brevoApiKey !== undefined) db.settings.brevoApiKey = brevoApiKey || "";
  if (brevoSenderEmail !== undefined) db.settings.brevoSenderEmail = brevoSenderEmail || "";
  writeDb(db);
  res.json(db.settings);
});

// --- BANNERS ROUTES ---
app.get('/api/banners', (req, res) => {
  const db = readDb();
  res.json(cleanDbForClient(db).banners || []);
});

app.post('/api/banners', requireAdminAuth, bannerUpload, (req, res) => {
  const { title, linkUrl, linkProductId } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'Banner image file is required' });
  }

  const db = readDb();
  const id = `banner_${Date.now().toString(36)}`;
  
  const newBanner = {
    id,
    title: title || '',
    imageUrl: fileToDataUrl(req.file),
    linkUrl: linkUrl || '',
    linkProductId: linkProductId || ''
  };

  if (!db.banners) db.banners = [];
  db.banners.push(newBanner);
  writeDb(db);

  res.status(201).json(newBanner);
});

app.delete('/api/banners/:id', requireAdminAuth, (req, res) => {
  const db = readDb();
  if (!db.banners) db.banners = [];

  const index = db.banners.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Banner not found' });

  db.banners.splice(index, 1);
  writeDb(db);

  res.json({ message: 'Banner deleted successfully' });
});

// --- MEDICAL REPRESENTATIVES (MR) ROUTES ---
app.get('/api/mrs', (req, res) => {
  const db = readDb();
  res.json(db.mrs || []);
});

app.post('/api/mrs', (req, res) => {
  const { distributorId, name, mobile, email, territory, username, password } = req.body;
  if (!distributorId || !name || !username || !password) {
    return res.status(400).json({ error: 'Distributor, Name, Username, and Password are required' });
  }

  const db = readDb();
  if (!db.mrs) db.mrs = [];

  // Check for duplicate username in registrations or MRs
  const isDuplicate = db.mrs.some(m => m.loginDetails?.username?.toLowerCase() === username.toLowerCase()) ||
                      (db.registrations && db.registrations.some(r => r.loginDetails?.username?.toLowerCase() === username.toLowerCase()));
  if (isDuplicate) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const newMr = {
    id: `mr_${Date.now().toString(36)}`,
    distributorId,
    name,
    mobile: mobile || '',
    email: email || '',
    territory: territory || '',
    loginDetails: { username, password }
  };

  db.mrs.push(newMr);
  writeDb(db);

  if (firebaseDb) {
    set(ref(firebaseDb, `mrs/${newMr.id}`), newMr).catch(() => {});
  }

  res.status(201).json(newMr);
});

app.delete('/api/mrs/:id', (req, res) => {
  const db = readDb();
  if (!db.mrs) db.mrs = [];

  const index = db.mrs.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'MR not found' });

  db.mrs.splice(index, 1);
  writeDb(db);

  if (firebaseDb) {
    remove(ref(firebaseDb, `mrs/${req.params.id}`)).catch(() => {});
  }

  res.json({ message: 'MR deleted successfully' });
});

// --- DOCTOR VISITS ROUTES ---
app.get('/api/visits', (req, res) => {
  const db = readDb();
  res.json(db.doctorVisits || []);
});

app.post('/api/visits', (req, res) => {
  const { distributorId, mrId, doctorName, specialty, location, date, productsDetailed, remarks } = req.body;
  if (!distributorId || !doctorName || !date) {
    return res.status(400).json({ error: 'Distributor ID, Doctor Name, and Date are required' });
  }

  const db = readDb();
  if (!db.doctorVisits) db.doctorVisits = [];

  const newVisit = {
    id: `visit_${Date.now().toString(36)}`,
    distributorId,
    mrId: mrId || 'self',
    doctorName,
    specialty: specialty || 'General',
    location: location || '',
    date,
    productsDetailed: Array.isArray(productsDetailed) ? productsDetailed : [],
    remarks: remarks || ''
  };

  db.doctorVisits.push(newVisit);
  writeDb(db);

  if (firebaseDb) {
    set(ref(firebaseDb, `doctorVisits/${newVisit.id}`), newVisit).catch(() => {});
  }
  res.status(201).json(newVisit);
});

// --- MR OFFERS ROUTES ---
app.get('/api/mr-offers', (req, res) => {
  const db = readDb();
  if (!db.mrOffers) db.mrOffers = [];
  res.json(db.mrOffers);
});

app.post('/api/mr-offers', (req, res) => {
  const { distributorId, title, description, discount, productId, expiry } = req.body;
  if (!distributorId || !title || !discount) {
    return res.status(400).json({ error: 'Distributor ID, Title, and Discount are required' });
  }

  const db = readDb();
  if (!db.mrOffers) db.mrOffers = [];

  const newOffer = {
    id: `mroffer_${Date.now().toString(36)}`,
    distributorId,
    title,
    description: description || '',
    discount,
    productId: productId || null,
    expiry: expiry || ''
  };

  db.mrOffers.push(newOffer);
  writeDb(db);
  res.status(201).json(newOffer);
});

app.delete('/api/mr-offers/:id', (req, res) => {
  const db = readDb();
  if (!db.mrOffers) db.mrOffers = [];

  const index = db.mrOffers.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'MR offer not found' });

  db.mrOffers.splice(index, 1);
  writeDb(db);
  res.json({ message: 'MR offer deleted successfully' });
});

// --- AI CHAT ENDPOINT ---
app.post('/api/ai/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const db = readDb();
  const productsList = db.products.map(p => ({
    name: p.name,
    composition: p.composition,
    indications: p.indications,
    dosage: p.dosage || 'As directed by physician',
    mrp: p.mrp ? (String(p.mrp).includes('₹') ? p.mrp : `₹${p.mrp}`) : 'Price on request',
    isNewLaunch: p.isNewLaunch ? 'Yes' : 'No',
    category: db.categories.find(c => c.id === p.categoryId)?.name || 'General'
  }));

  const offersList = (db.offers || []).map(o => ({
    title: o.title,
    description: o.description,
    discount: o.discount,
    expiry: o.expiry
  }));

  const apiKey = req.body.apiKey || db.settings?.geminiApiKey || process.env.GEMINI_API_KEY;

  // Helper function to stream mock responses with phonetic spelling correction
  const streamMockResponse = (msg) => {
    const lowerMsg = msg.toLowerCase();
    let reply = "";
    let detectedLang = "en";

    // Simple language detection
    if (lowerMsg.includes('kya') || lowerMsg.includes('hai') || lowerMsg.includes('batao') || lowerMsg.includes('daam') || lowerMsg.includes('namaste')) {
      detectedLang = "hi";
    } else if (lowerMsg.includes('enna') || lowerMsg.includes('irukku') || lowerMsg.includes('solla') || lowerMsg.includes('vanakkam')) {
      detectedLang = "ta";
    } else if (lowerMsg.includes('kay') || lowerMsg.includes('aahe') || lowerMsg.includes('sang') || lowerMsg.includes('namaskar')) {
      detectedLang = "mr";
    }

    // Advanced phonetic correction map for common STT transcription spelling mistakes
    const phoneticMap = {
      'rabrio': 'rabrio',
      'robbie': 'rabrio',
      'ribery': 'rabrio',
      'ray brio': 'rabrio',
      'rabri': 'rabrio',
      'alcario': 'alcario',
      'al cario': 'alcario',
      'carry': 'alcario',
      'elcario': 'alcario',
      'rioceft': 'rioceft',
      'rio ceft': 'rioceft',
      'reo shift': 'rioceft',
      'riomol': 'riomol',
      'rio mol': 'riomol',
      'ryomol': 'riomol'
    };

    let matchedProduct = null;
    for (const [typo, correctName] of Object.entries(phoneticMap)) {
      if (lowerMsg.includes(typo)) {
        matchedProduct = productsList.find(p => p.name.toLowerCase().includes(correctName));
        if (matchedProduct) break;
      }
    }

    if (!matchedProduct) {
      matchedProduct = productsList.find(p => lowerMsg.includes(p.name.toLowerCase()));
    }

    if (matchedProduct) {
      if (detectedLang === "hi") {
        reply = `नमस्ते, मैं अनी हूँ रियोमेडिका से। ${matchedProduct.name} के बारे में मैं आपको जानकारी दे देती हूँ। इसकी संरचना ${matchedProduct.composition} है। यह मुख्य रूप से ${matchedProduct.indications || 'सामान्य उपयोग'} के लिए उपयोग किया जाता है। इसकी सामान्य खुराक ${matchedProduct.dosage} है और इसका एमआरपी ${matchedProduct.mrp} है। यह एक उत्कृष्ट उत्पाद है। क्या मैं आपकी कुछ और मदद करूँ? (ऑफ़लाइन सिमुलेशन मोड)`;
      } else if (detectedLang === "ta") {
        reply = `வணக்கம், நான் அனி பேசுறேன். ${matchedProduct.name} பற்றி சொல்கிறேன். இதில் ${matchedProduct.composition} உள்ளது. இது பொதுவாக ${matchedProduct.indications || 'பொதுவான பயன்பாட்டிற்கு'} பயன்படுகிறது. இதனுடைய அளவு ${matchedProduct.dosage} மற்றும் இதன் விலை ${matchedProduct.mrp} ஆகும். உங்களுக்கு வேறு ஏதேனும் விவரங்கள் வேண்டுமா? (ஆஃப்லைன் சிமுலேஷன் முறை)`;
      } else if (detectedLang === "mr") {
        reply = `नमस्कार, मी अनी बोलत आहे. ${matchedProduct.name} बद्दल सांगायचे तर, यामध्ये ${matchedProduct.composition} घटक आहेत. याचा वापर प्रामुख्याने ${matchedProduct.indications || 'सामान्य वापरासाठी'} केला जातो. याचा डोस ${matchedProduct.dosage} असून याची किंमत ${matchedProduct.mrp} आहे. तुम्हाला इसबद्दल अजून काही माहिती हवी आहे का? (ऑफलाइन सिम्युलेशन मोड)`;
      } else {
        reply = `Hello, this is Ani from the Riomedica team. I can certainly help you with ${matchedProduct.name}. It contains ${matchedProduct.composition}. For indications, it is generally used for ${matchedProduct.indications || 'general clinical use'}, and the standard dosage is ${matchedProduct.dosage}. The MRP for this medicine is ${matchedProduct.mrp}. Please let me know if you would like me to help with anything else. (Offline Simulation Mode)`;
      }
    } else if (lowerMsg.includes('offer') || lowerMsg.includes('scheme') || lowerMsg.includes('सूट') || lowerMsg.includes('ऑफर')) {
      if (offersList.length > 0) {
        const offersStr = offersList.map(o => `${o.title} has an offer of ${o.discount} with details as ${o.description}, expiring on ${o.expiry}`).join('. ');
        if (detectedLang === "hi") {
          reply = `हमारे वर्तमान ऑफर्स इस प्रकार हैं: ${offersStr}. (GEMINI_API_KEY सेट करके असली AI के साथ बात करें)`;
        } else {
          reply = `Here are our active bumper offers: ${offersStr}. (Configure GEMINI_API_KEY on the server for full multilingual AI)`;
        }
      } else {
        reply = detectedLang === "hi" 
          ? "फिलहाल कोई सक्रिय ऑफर नहीं है।" 
          : "There are no active bumper offers at the moment.";
      }
    } else {
      if (detectedLang === "hi") {
        reply = "नमस्ते! मैं अनी बोल रही हूँ रियोमेडिका टीम से। मैं एक असली प्रतिनिधि की तरह आपकी सहायता करने के लिए यहाँ हूँ। आप मुझसे किसी भी दवा जैसे 'Rabrio 20' या 'Rioceft' के बारे में पूछ सकते हैं। (पूर्ण बहुभाषी AI संवाद के लिए कृपया GEMINI_API_KEY सेट करें)";
      } else if (detectedLang === "ta") {
        reply = "வணக்கம்! நான் அனி பேசுறேன். தயாரிப்புகள் அல்லது விலைகளைப் பற்றி கேட்கலாம். (முழுமையான AI சேவைக்கு GEMINI_API_KEY ஐ உள்ளமைக்கவும்)";
      } else if (detectedLang === "mr") {
        reply = "नमस्कार! मी अनी बोलत आहे. तुम्ही मला औषधांबद्दल विचारू शकता. (पूर्ण AI संवादासाठी GEMINI_API_KEY सेट करा)";
      } else {
        reply = "Hello! This is Ani from the Riomedica customer support team. I am here to help you just like a real support coordinator. You can ask me about any of our brands, such as 'Tell me about Rabrio 20' or 'What is the price of ALCARIO-PRO?'. (Configure GEMINI_API_KEY on the server to activate full multilingual Generative AI support.)";
      }
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const words = reply.split(/(\s+)/);
    let index = 0;
    
    const sendNextWord = () => {
      if (index < words.length) {
        res.write(words[index]);
        index++;
        setTimeout(sendNextWord, 20); // 20ms typing speed
      } else {
        res.end();
      }
    };
    sendNextWord();
  };

  if (!apiKey) {
    return streamMockResponse(message);
  }

  // GEMINI ACTIVE STREAMING MODE
  try {
    const systemPrompt = `You are Ani, a warm, friendly, and highly professional human customer support representative at the Riomedica Healthcare service desk.
Never refer to yourself as an AI assistant, AI bot, or virtual robot. Speak and behave as a real human agent talking to the user over the phone.
Your database of products and active offers is:
Products: ${JSON.stringify(productsList)}
Offers: ${JSON.stringify(offersList)}

CRITICAL INSTRUCTIONS FOR HUMAN-LIKE RESPONSE AND NATURAL SPEECH:
1. Tone & Character: Act as a friendly, helpful human sales coordinator. Use warm human-like expressions and conversational transitions where natural (e.g., "Oh, absolutely!", "Sure thing, let me check that for you...", "I'd be happy to help with that!", "Yes, indeed!").
2. NO ROBOTIC MARKDOWN OR FORMATTING: To ensure the speech synthesis engine sounds completely natural and like a real human speaking, do NOT use lists (no bullets, no dashes, no numbers), do NOT use bold marks (do not write **text** or *text*), do NOT use hash headers, and do NOT use tables. Write exclusively in complete, grammatically correct sentences and flowing paragraphs separated by standard punctuation (commas, periods, question marks).
3. Language Matching: Detect the language the user is speaking in (English, Hindi, Tamil, Marathi, Telugu, Hinglish, etc.) and you MUST reply in the EXACT SAME language with natural, colloquial human vocabulary of that language. For example, in Hindi, respond as a polite support executive: "नमस्ते, मैं अनी बोल रही हूँ रियोमेडिका टीम से। आपकी किस प्रकार सहायता कर सकती हूँ?"
4. Scope: Only answer questions related to Riomedica products, compositions, prices (MRP), indications, dosages, active offers, or categories.
5. If the user asks about a product not in the database, tell them politely as a human support representative that the item is currently not in our catalog.
6. Do not make up facts. Only use the provided database details.
7. CRITICAL STT CORRECTION: The user's input is transcribed via a Speech-to-Text (STT) voice engine which frequently makes spelling/phonetic mistakes. For example, "Rabrio" might be transcribed as "Robbie row", "Ribery", "Rabri", "Ray brio", "Robbie support", etc. "Alcario" might be transcribed as "Al cario", "I'll carry", "Elcario", etc. "Rioceft" might be transcribed as "Rio ceft", "Ryoceft", "Reo shift", etc. Always use phonetic matching to map transcription typos to the actual Riomedica products in the database before answering.`;

    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        // Filter out empty messages to prevent Gemini API 400 errors
        if (h.text && h.text.trim()) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text.trim() }]
          });
        }
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      console.error('Gemini API Error details:', errorJson);
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let buffer = '';
    // Stream reader using async iteration over response.body (Node global fetch)
    for await (const chunk of response.body) {
      buffer += chunk.toString();
      let boundary = buffer.indexOf('\n');
      while (boundary !== -1) {
        const line = buffer.substring(0, boundary).trim();
        buffer = buffer.substring(boundary + 1);

        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6).trim();
            const parsed = JSON.parse(jsonStr);
            const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              res.write(textChunk);
            }
          } catch (e) {
            // Put it back to buffer if JSON is split
            buffer = line + '\n' + buffer;
            break;
          }
        }
        boundary = buffer.indexOf('\n');
      }
    }
    res.end();
  } catch (err) {
    console.error('AI Assistant Live Gemini Mode Error, falling back to mock mode:', err);
    // Graceful fallback to streaming mock response instead of throwing a blank block
    return streamMockResponse(message);
  }
});

// --- BULK PRODUCT IMPORT ROUTE ---
app.post('/api/products/bulk-import', requireAdminAuth, (req, res) => {
  excelUpload(req, res, (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
      // Parse the workbook from buffer
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rows || rows.length === 0) {
        return res.status(400).json({ error: 'The Excel file is empty or has no data rows.' });
      }

      const db = readDb();
      const inserted = [];
      const errors = [];

      rows.forEach((row, idx) => {
        const rowNum = idx + 2; // 1-indexed + header row
        const name = (row['Product Name'] || row['name'] || '').toString().trim();
        if (!name) {
          errors.push(`Row ${rowNum}: Missing product name.`);
          return;
        }

        // Map category name → id (dynamically auto-create categories from Excel rows)
        const catNameRaw = (row['Category'] || row['categoryId'] || '').toString().trim();
        let categoryId = '';
        if (catNameRaw) {
          const catSlug = catNameRaw.toLowerCase().replace(/[^a-z0-9]/g, '-');
          let matchedCat = db.categories.find(
            c => c.name.toLowerCase() === catNameRaw.toLowerCase() || c.id === catSlug
          );
          if (!matchedCat) {
            // Match keywords for dynamic Lucide theme icon assignment
            let icon = 'activity';
            const catNameLower = catNameRaw.toLowerCase();
            if (catNameLower.includes('inject')) icon = 'droplet';
            else if (catNameLower.includes('dent') || catNameLower.includes('oral')) icon = 'shield';
            else if (catNameLower.includes('pain') || catNameLower.includes('analge') || catNameLower.includes('gel')) icon = 'zap';
            else if (catNameLower.includes('derm') || catNameLower.includes('skin') || catNameLower.includes('soap') || catNameLower.includes('cream')) icon = 'heart';
            else if (catNameLower.includes('cough') || catNameLower.includes('cold') || catNameLower.includes('syrup')) icon = 'wind';
            else if (catNameLower.includes('neuro') || catNameLower.includes('brain') || catNameLower.includes('psych')) icon = 'brain';
            else if (catNameLower.includes('eye') || catNameLower.includes('ophthal')) icon = 'eye';

            matchedCat = {
              id: catSlug,
              name: catNameRaw,
              description: `Formulations belonging to the ${catNameRaw} therapeutic category.`,
              icon
            };
            db.categories.push(matchedCat);
          }
          categoryId = matchedCat.id;
        }

        const id = `prod_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}_${idx}`;

        const isNewLaunch = ['yes', 'true', '1', 'y'].includes(
          (row['New Launch'] || row['isNewLaunch'] || '').toString().trim().toLowerCase()
        );

        const newProduct = {
          id,
          categoryId,
          name,
          composition: (row['Composition'] || row['composition'] || '').toString().trim(),
          indications: (row['Indications'] || row['indications'] || '').toString().trim(),
          dosage:      (row['Dosage'] || row['dosage'] || '').toString().trim(),
          lbl:         (row['LBL'] || row['lbl'] || '').toString().trim(),
          videoUrl:    (row['Video URL'] || row['videoUrl'] || '').toString().trim(),
          packshot:    '',
          visualAids:  [],
          isNewLaunch,
          mrp:         (row['MRP'] || row['mrp'] || '').toString().trim()
        };

        db.products.push(newProduct);
        inserted.push(newProduct);
      });

      writeDb(db);

      return res.status(201).json({
        message: `Bulk import complete. ${inserted.length} products added.`,
        inserted: inserted.length,
        errors
      });
    } catch (parseErr) {
      console.error('Excel parse error:', parseErr);
      return res.status(500).json({ error: 'Failed to parse the Excel file. Make sure it follows the required template.' });
    }
  });
});

// B2B Order Management Endpoints
app.post('/api/orders', (req, res) => {
  const db = readDb();
  if (!db.orders) db.orders = [];
  const newOrder = {
    id: req.body.id || 'ord-' + Date.now(),
    firmName: req.body.firmName || 'Unknown',
    userName: req.body.userName || 'Anonymous',
    createdByRole: req.body.createdByRole,
    distributorId: req.body.distributorId,
    mrId: req.body.mrId,
    doctorDetails: req.body.doctorDetails,
    items: req.body.items || [],
    totalPrice: req.body.totalPrice || 0,
    createdAt: new Date().toISOString(),
    status: 'Pending'
  };
  db.orders.push(newOrder);
  writeDb(db);

  if (firebaseDb) {
    set(ref(firebaseDb, `orders/${newOrder.id}`), newOrder).catch(() => {});
  }

  res.json({ success: true, order: newOrder });
});

app.get('/api/orders', (req, res) => {
  const db = readDb();
  res.json(db.orders || []);
});

app.put('/api/orders/:id/status', requireAdminAuth, (req, res) => {
  const db = readDb();
  if (!db.orders) db.orders = [];
  const orderIndex = db.orders.findIndex(o => o.id === req.params.id);
  if (orderIndex !== -1) {
    db.orders[orderIndex].status = req.body.status || 'Pending';
    writeDb(db);

    if (firebaseDb) {
      update(ref(firebaseDb, `orders/${req.params.id}`), { status: req.body.status || 'Pending' }).catch(() => {});
    }

    return res.json({ success: true, order: db.orders[orderIndex] });
  }
  res.status(404).json({ error: 'Order not found' });
});

app.delete('/api/orders/:id', requireAdminAuth, (req, res) => {
  const db = readDb();
  if (db.orders) {
    db.orders = db.orders.filter(o => o.id !== req.params.id);
    writeDb(db);

    if (firebaseDb) {
      remove(ref(firebaseDb, `orders/${req.params.id}`)).catch(() => {});
    }
  }
  res.json({ success: true });
});

// Serve static frontend files from client/dist folder in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    // If request starts with /api or /uploads, don't serve index.html (let other handlers catch it)
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log(`Client build detected: Serving static frontend from ${clientDistPath}`);
} else {
  console.log(`No client build folder found at ${clientDistPath}. Running API-only server.`);
}

// Start server — bind to 0.0.0.0 as required by Render and other cloud hosts
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  syncFromFirebaseOnStartup();
});

