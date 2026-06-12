import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

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

// Database helper functions
const readDb = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, returning default structure", err);
    return { categories: [], products: [], collections: [], offers: [], registrations: [] };
  }
};

const writeDb = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to database file", err);
  }
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

// Branding logo upload configuration
const brandingUpload = upload.single('logo');

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
  res.json(db.categories);
});

app.post('/api/categories', (req, res) => {
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

app.delete('/api/categories/:id', (req, res) => {
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
  res.json(db.products);
});

app.post('/api/products', productUploads, (req, res) => {
  const { name, categoryId, composition, indications, dosage, lbl, videoUrl, isNewLaunch, mrp } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name is required' });

  const db = readDb();
  const id = `prod_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

  // Retrieve file paths
  let packshotUrl = '';
  let visualAidsUrls = [];

  if (req.files) {
    if (req.files['packshot'] && req.files['packshot'][0]) {
      packshotUrl = `/uploads/${req.files['packshot'][0].filename}`;
    }
    if (req.files['visualAids']) {
      visualAidsUrls = req.files['visualAids'].map(file => `/uploads/${file.filename}`);
    }
  }

  const newProduct = {
    id,
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
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', productUploads, (req, res) => {
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
      packshotUrl = `/uploads/${req.files['packshot'][0].filename}`;
    }
    if (req.files['visualAids'] && req.files['visualAids'].length > 0) {
      const newAids = req.files['visualAids'].map(file => `/uploads/${file.filename}`);
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
  res.json(updatedProduct);
});

app.delete('/api/products/:id', (req, res) => {
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
  res.json({ message: 'Product deleted successfully' });
});

// Reset all products (clear product catalog)
app.post('/api/products/reset', (req, res) => {
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

app.post('/api/collections', (req, res) => {
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

app.put('/api/collections/:id', (req, res) => {
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

app.delete('/api/collections/:id', (req, res) => {
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

app.post('/api/offers', offerUpload, (req, res) => {
  const { title, description, discount, productId, expiry } = req.body;
  if (!title) return res.status(400).json({ error: 'Offer title is required' });

  const db = readDb();
  const id = `offer_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

  let imageUrl = '';
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
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

app.delete('/api/offers/:id', (req, res) => {
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
      drugLicenceUrl = `/uploads/${req.files['drugLicence'][0].filename}`;
    }
    if (req.files['gst'] && req.files['gst'][0]) {
      gstUrl = `/uploads/${req.files['gst'][0].filename}`;
    }
    if (req.files['pan'] && req.files['pan'][0]) {
      panUrl = `/uploads/${req.files['pan'][0].filename}`;
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
app.get('/api/registrations', (req, res) => {
  const db = readDb();
  res.json(db.registrations || []);
});

// Approve registration request & generate login details
app.post('/api/registrations/:id/approve', (req, res) => {
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

  writeDb(db);
  res.json(db.registrations[index]);
});

// Deny registration request
app.post('/api/registrations/:id/deny', (req, res) => {
  const db = readDb();
  if (!db.registrations) db.registrations = [];

  const index = db.registrations.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Registration request not found' });

  db.registrations[index].status = 'denied';
  db.registrations[index].loginDetails = null;

  writeDb(db);
  res.json(db.registrations[index]);
});

// Authenticate user login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Admin account login bypass
  if (username.toLowerCase() === 'admin' && password === 'admin123') {
    return res.json({
      message: 'Login successful',
      role: 'admin',
      user: {
        id: 'admin_root',
        firmName: 'Riomedica Admin Head Office',
        ownerName: 'Riomedica Admin',
        mobile: '0000000000',
        email: 'admin@riomedica.com'
      }
    });
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

// Short-term memory store for active OTP codes
const activeOtps = {
  mobile: {}, // mobile -> { otp, expiresAt }
  email: {}   // emailOrUsername -> { otp, expiresAt }
};

// Helper to generate a 6-digit random number string
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

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
app.post('/api/otp/send-email', (req, res) => {
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

  console.log(`\n--- [MOCK EMAIL GATEWAY] ---`);
  console.log(`To Email: ${user.email}`);
  console.log(`Reset Code: ${otp}`);
  console.log(`----------------------------\n`);

  res.json({ message: 'OTP sent to registered email address', mockOtp: otp, email: user.email });
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
  res.json(db.branding || { companyName: "RIOMEDICA", tagline: "Healthcare", logo: "" });
});

app.post('/api/branding', brandingUpload, (req, res) => {
  const { companyName, tagline } = req.body;
  const db = readDb();

  if (!db.branding) {
    db.branding = { companyName: "RIOMEDICA", tagline: "Healthcare", logo: "" };
  }

  if (companyName !== undefined) db.branding.companyName = companyName;
  if (tagline !== undefined) db.branding.tagline = tagline;

  if (req.file) {
    db.branding.logo = `/uploads/${req.file.filename}`;
  }

  writeDb(db);
  res.json(db.branding);
});

// --- SETTINGS ROUTES ---
app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings || { geminiApiKey: "" });
});

app.post('/api/settings', (req, res) => {
  const { geminiApiKey } = req.body;
  const db = readDb();
  db.settings = db.settings || {};
  db.settings.geminiApiKey = geminiApiKey || "";
  writeDb(db);
  res.json(db.settings);
});

// --- BANNERS ROUTES ---
app.get('/api/banners', (req, res) => {
  const db = readDb();
  res.json(db.banners || []);
});

app.post('/api/banners', bannerUpload, (req, res) => {
  const { title, linkUrl } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'Banner image file is required' });
  }

  const db = readDb();
  const id = `banner_${Date.now().toString(36)}`;
  
  const newBanner = {
    id,
    title: title || '',
    imageUrl: `/uploads/${req.file.filename}`,
    linkUrl: linkUrl || ''
  };

  if (!db.banners) db.banners = [];
  db.banners.push(newBanner);
  writeDb(db);

  res.status(201).json(newBanner);
});

app.delete('/api/banners/:id', (req, res) => {
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
  res.status(201).json(newMr);
});

app.delete('/api/mrs/:id', (req, res) => {
  const db = readDb();
  if (!db.mrs) db.mrs = [];

  const index = db.mrs.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'MR not found' });

  db.mrs.splice(index, 1);
  writeDb(db);
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
        reply = `**${matchedProduct.name}** के बारे में जानकारी:\n` +
                `• **संरचना (Composition):** ${matchedProduct.composition}\n` +
                `• **उपयोग (Indications):** ${matchedProduct.indications || 'सामान्य उपयोग'}\n` +
                `• **खुराक (Dosage):** ${matchedProduct.dosage}\n` +
                `• **मूल्य (MRP):** ${matchedProduct.mrp}\n` +
                `• **नई लॉन्च:** ${matchedProduct.isNewLaunch}\n\n` +
                `*(ऑफ़लाइन सिमुलेशन मोड)*`;
      } else if (detectedLang === "ta") {
        reply = `**${matchedProduct.name}** தயாரிப்பு विवरण:\n` +
                `• **கலவை (Composition):** ${matchedProduct.composition}\n` +
                `• **பயன்கள் (Indications):** ${matchedProduct.indications || 'பொதுவான பயன்பாடு'}\n` +
                `• **அளவு (Dosage):** ${matchedProduct.dosage}\n` +
                `• **விலை (MRP):** ${matchedProduct.mrp}\n` +
                `• **புதிய அறிமுகம்:** ${matchedProduct.isNewLaunch}\n\n` +
                `*(ஆஃப்லைன் சிமுலேஷன் முறை)*`;
      } else if (detectedLang === "mr") {
        reply = `**${matchedProduct.name}** बद्दल माहिती:\n` +
                `• **संयोजन (Composition):** ${matchedProduct.composition}\n` +
                `• **वापर (Indications):** ${matchedProduct.indications || 'सामान्य वापर'}\n` +
                `• **डोस (Dosage):** ${matchedProduct.dosage}\n` +
                `• **किंमत (MRP):** ${matchedProduct.mrp}\n` +
                `• **नवीन लॉन्च:** ${matchedProduct.isNewLaunch}\n\n` +
                `*(ऑफलाइन सिम्युलेशन मोड)*`;
      } else {
        reply = `Here are the details for **${matchedProduct.name}**:\n` +
                `• **Composition:** ${matchedProduct.composition}\n` +
                `• **Indications:** ${matchedProduct.indications || 'General clinical use'}\n` +
                `• **Dosage:** ${matchedProduct.dosage}\n` +
                `• **MRP:** ${matchedProduct.mrp}\n` +
                `• **New Launch:** ${matchedProduct.isNewLaunch}\n\n` +
                `*(Offline Simulation Mode)*`;
      }
    } else if (lowerMsg.includes('offer') || lowerMsg.includes('scheme') || lowerMsg.includes('सूट') || lowerMsg.includes('ऑफर')) {
      if (offersList.length > 0) {
        const offersStr = offersList.map(o => `• **${o.title}**: ${o.discount} (${o.description}) - Expiry: ${o.expiry}`).join('\n');
        if (detectedLang === "hi") {
          reply = `हमारे वर्तमान ऑफर्स:\n${offersStr}\n\n*(GEMINI_API_KEY सेट करके असली AI के साथ बात करें)*`;
        } else {
          reply = `Here are our active bumper offers:\n${offersStr}\n\n*(Configure GEMINI_API_KEY on the server for full multilingual AI)*`;
        }
      } else {
        reply = detectedLang === "hi" 
          ? "फिलहाल कोई सक्रिय ऑफर नहीं है।" 
          : "There are no active bumper offers at the moment.";
      }
    } else {
      if (detectedLang === "hi") {
        reply = "नमस्ते! मैं रियोबॉट हूँ, आपका Riomedica AI सहायक। आप मुझसे किसी भी दवा (जैसे 'Rabrio 20', 'Rioceft') के बारे में पूछ सकते हैं।\n\n*(नोट: पूर्ण बहुभाषी AI संवाद के लिए कृपया कृपया GEMINI_API_KEY पर्यावरण चर सेट करें)*";
      } else if (detectedLang === "ta") {
        reply = "வணக்கம்! நான் ரியோபாட், உங்கள் Riomedica AI உதவியாளர். நீங்கள் என்னிடம் தயாரிப்புகள் அல்லது விலைகளைப் பற்றி கேட்கலாம்.\n\n*(குறிப்பு: GEMINI_API_KEY ஐ உள்ளமைக்கவும்)*";
      } else if (detectedLang === "mr") {
        reply = "नमस्कार! मी रियोबॉट आहे, तुमचा Riomedica AI सहाय्यक. तुम्ही मला औषधांबद्दल विचारू शकता.\n\n*(टीप: GEMINI_API_KEY सेट करा)*";
      } else {
        reply = "Hello! I am **Riobot**, your Riomedica AI Assistant. You can ask me about any of our brands (e.g., 'Tell me about Rabrio 20', 'What is the price of ALCARIO-PRO?').\n\n*Configure GEMINI_API_KEY on the server to activate full multilingual Generative AI support.*";
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
    const systemPrompt = `You are the Riomedica AI Assistant (Riobot), a professional, smart, and friendly virtual assistant for Franchise Partners and Medical Representatives (MRs) of Riomedica Healthcare.
Your database of products and active offers is:
Products: ${JSON.stringify(productsList)}
Offers: ${JSON.stringify(offersList)}

CRITICAL INSTRUCTIONS:
1. Detect the language the user is speaking in (e.g. English, Hindi, Tamil, Marathi, Telugu, Gujarati, Bengali, etc.).
2. You MUST reply in the EXACT SAME language. If they ask in Hindi, reply in Hindi. If they ask in Tamil, reply in Tamil. If they ask in Marathi, reply in Marathi. If they use Hinglish (Hindi written in English alphabets), reply in Hinglish.
3. Be professional, friendly, and concise. Use bullet points for product details.
4. Only answer questions related to Riomedica products, compositions, prices (MRP), indications, dosages, active offers, or categories.
5. If the user asks about a product not in the database, tell them politely that the product is not in the Riomedica catalog.
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
app.post('/api/products/bulk-import', (req, res) => {
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
    id: 'ord-' + Date.now(),
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
  res.json({ success: true, order: newOrder });
});

app.get('/api/orders', (req, res) => {
  const db = readDb();
  res.json(db.orders || []);
});

app.put('/api/orders/:id/status', (req, res) => {
  const db = readDb();
  if (!db.orders) db.orders = [];
  const orderIndex = db.orders.findIndex(o => o.id === req.params.id);
  if (orderIndex !== -1) {
    db.orders[orderIndex].status = req.body.status || 'Pending';
    writeDb(db);
    return res.json({ success: true, order: db.orders[orderIndex] });
  }
  res.status(404).json({ error: 'Order not found' });
});

app.delete('/api/orders/:id', (req, res) => {
  const db = readDb();
  if (db.orders) {
    db.orders = db.orders.filter(o => o.id !== req.params.id);
    writeDb(db);
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
