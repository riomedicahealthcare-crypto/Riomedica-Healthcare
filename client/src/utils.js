// client/src/utils.js
import {
  fbWriteOtp, fbDeleteOtp, fbVerifyOtp,
  fbGetProducts, fbSetProduct, fbSetProducts, fbDeleteProduct,
  fbGetCategories, fbSetCategory, fbDeleteCategory,
  fbGetOffers, fbSetOffer, fbDeleteOffer,
  fbGetBanners, fbSetBanner, fbDeleteBanner,
  fbGetBranding, fbSetBranding,
  fbGetOrders, fbAddOrder, fbUpdateOrderStatus, fbDeleteOrder,
  fbGetMRs, fbAddMR, fbDeleteMR,
  fbGetRegistrations, fbSetRegistration, fbAddRegistration,
  fbGetUsers, fbAddUser, fbUpdateUser, fbDeleteUser,
  fbGetCollections, fbSetCollection, fbDeleteCollection,
  fbGetDoctorVisits, fbAddDoctorVisit,
  fbGetMROffers, fbAddMROffer, fbDeleteMROffer,
  fbGetSettings, fbSetSettings,
  fbLoginUser,
  fbGetAdmin,
  fbUpdateProducts,
  safeUpdate
} from './firebaseDb';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.endsWith('/api') 
      ? import.meta.env.VITE_API_URL 
      : `${import.meta.env.VITE_API_URL}/api`;
  }
  if (typeof window === 'undefined') return 'http://localhost:5000/api';
  const origin = window.location.origin;
  
  // Detect Capacitor/Native App environment running on localhost or custom scheme
  const isCapacitor = window.Capacitor || 
    (origin.includes('localhost') && !origin.includes(':5000') && !origin.includes(':517') && !origin.includes(':3000'));
    
  if (isCapacitor) {
    return 'https://riomedica-healthcare-1.onrender.com/api';
  }
  
  if (origin.includes(':517')) { // Vite dev server
    return 'http://localhost:5000/api';
  }
  return `${origin}/api`;
};

const getImageBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '');
  }
  if (typeof window === 'undefined') return 'http://localhost:5000';
  const origin = window.location.origin;

  // Detect Capacitor/Native App environment running on localhost or custom scheme
  const isCapacitor = window.Capacitor || 
    (origin.includes('localhost') && !origin.includes(':5000') && !origin.includes(':517') && !origin.includes(':3000'));
    
  if (isCapacitor) {
    return 'https://riomedica-healthcare-1.onrender.com';
  }

  if (origin.includes(':517')) { // Vite dev server
    return 'http://localhost:5000';
  }
  return origin;
};

const API_BASE = getApiBase();
export const IMAGE_BASE = getImageBase();

export const getImgUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${IMAGE_BASE}${url}`;
};

// Fallback Initial Data matching server/data/db.json
const FALLBACK_DATA = {
  categories: [
    { id: "gastro", name: "Gastrointestinal & Antacids", description: "Formulations for acid reflux, peptic ulcers, bloating, and gut health", icon: "activity" },
    { id: "injections", name: "Injections & Critical Care", description: "Intravenous and intramuscular critical care solutions and ampoules", icon: "droplet" },
    { id: "infusions", name: "Infusions & IV Fluids", description: "Large volume parenterals, electrolyte infusions, and hydration liquids", icon: "droplet" },
    { id: "multivitamins", name: "Multivitamins & Antioxidants", description: "Nutritional supplements, health capsules, syrup tonics, and immunity boosters", icon: "zap" },
    { id: "cough-cold", name: "Cough, Cold & Anti-allergic", description: "Expectorants, mucolytics, antihistamines, and decongestant syrups", icon: "wind" },
    { id: "tablets", name: "Tablets & Oral Solids", description: "General oral solid dosage formulations, capsules, and systemic medicines", icon: "layers" },
    { id: "pain-management", name: "Analgesics & Pain Management", description: "NSAIDs, pain relief gels, sprays, and anti-inflammatory formulations", icon: "zap" },
    { id: "derma", name: "Dermatological & Topical Creams", description: "Moisturizing soaps, medicated dusting powders, and anti-fungal ointments", icon: "heart" },
    { id: "dental", name: "Dental Care & Oral Hygiene", description: "Medicated tooth gels, gum paints, mouthwashes, and oral hygiene solutions", icon: "shield" },
    { id: "cardio-diabetic", name: "Cardiovascular & Anti-diabetic", description: "Formulations for blood pressure control, heart health, and glucose management", icon: "heart" },
    { id: "antibiotics", name: "Antibiotics & Anti-infectives", description: "Broad-spectrum antibacterial, anti-parasitic, and anti-infective formulations", icon: "shield" },
    { id: "pediatric", name: "Pediatric Care & Oral Drops", description: "Formulations, suspensions, and drops specifically calibrated for infant care", icon: "wind" },
    { id: "neurology", name: "Neurology & Psychotropics", description: "Nervous system regulators, neuropathic pain relievers, and brain health boosters", icon: "brain" },
    { id: "ophthalmic", name: "Ophthalmic & Ear Drops", description: "Medicated sterile drops for eye lubrication, ear infections, and allergies", icon: "eye" }
  ],
  products: [
    {
      id: "prod_rabrio20",
      categoryId: "gastro",
      name: "Rabrio 20 Tablet",
      composition: "Rabeprazole Sodium 20mg",
      indications: "Gastroesophageal Reflux Disease (GERD), Gastric and Duodenal Ulcers, Zollinger-Ellison Syndrome",
      dosage: "1 tablet daily in the morning, 30 minutes before breakfast, or as directed by the physician.",
      packshot: "",
      visualAids: [],
      lbl: "Rabrio 20 offers fast and sustained relief from acid hypersecretion. It inhibits H+/K+-ATPase enzyme system at the secretory surface of gastric parietal cells, blocking the final step of acid secretion.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      isNewLaunch: true
    },
    {
      id: "prod_rabriod",
      categoryId: "gastro",
      name: "Rabrio D Capsule SR",
      composition: "Rabeprazole Sodium 20mg + Domperidone 30mg SR",
      indications: "Acid reflux accompanied by nausea, vomiting, dyspepsia, and bloating.",
      dosage: "1 capsule daily in the morning, 30 minutes before breakfast.",
      packshot: "",
      visualAids: [],
      lbl: "Double action control: Rabeprazole suppresses acid at the source, while Domperidone increases lower esophageal sphincter tone and gastric emptying to prevent nausea and reflux.",
      videoUrl: "",
      isNewLaunch: false
    },
    {
      id: "prod_rioceft",
      categoryId: "injections",
      name: "Rioceft 1000 Injection",
      composition: "Ceftriaxone Sodium 1gm",
      indications: "Severe respiratory tract infections, meningitis, surgical prophylaxis, typhoid fever, bone and joint infections",
      dosage: "As directed by the physician. Administered via IV or IM route after reconstitution.",
      packshot: "",
      visualAids: [],
      lbl: "Rioceft 1000 is a broad-spectrum, third-generation cephalosporin antibiotic. It has high bactericidal activity against a wide range of Gram-negative and Gram-positive pathogens.",
      videoUrl: "",
      isNewLaunch: false
    },
    {
      id: "prod_riomol",
      categoryId: "injections",
      name: "Riomol-IV Infusion",
      composition: "Paracetamol 1000mg / 100ml Infusion",
      indications: "Short-term treatment of moderate pain (especially after surgery) and short-term treatment of fever",
      dosage: "Administered as a 15-minute intravenous infusion. Dosage adjusted based on body weight.",
      packshot: "",
      visualAids: [],
      lbl: "Provides rapid onset of analgesic and antipyretic action. Reaches peak plasma concentration in 15 minutes, ensuring prompt post-operative patient comfort.",
      videoUrl: "",
      isNewLaunch: true
    },
    {
      id: "prod_riodentk",
      categoryId: "dental",
      name: "Riodent-K Tooth Gel",
      composition: "Potassium Nitrate 5.0% w/w, Sodium Monofluorophosphate 0.7% w/w, Triclosan 0.3% w/w",
      indications: "Dentinal hypersensitivity (sensitivity to hot/cold), dental plaque prevention, cavity protection",
      dosage: "Brush twice daily or apply a small amount to the sensitive area as directed by the dentist.",
      packshot: "",
      visualAids: [],
      lbl: "Potassium nitrate desensitizes the nerve endings in dentinal tubules. Fluoride strengthens enamel, and Triclosan offers long-lasting antibacterial protection against gum disease.",
      videoUrl: "",
      isNewLaunch: false
    },
    {
      id: "prod_riodic",
      categoryId: "pain",
      name: "Riodic Gel",
      composition: "Diclofenac Diethylamine 1.16% w/w, Methyl Salicylate 10.0% w/w, Linseed Oil 3.0% w/w, Menthol 5.0% w/w",
      indications: "Musculoskeletal pain, joint inflammation, sprains, strains, low back pain, sports injuries",
      dosage: "Apply 3-4 times daily to the affected area, massage gently until absorbed.",
      packshot: "",
      visualAids: [],
      lbl: "Quadruple action pain relief: Diclofenac reduces inflammation, Linseed Oil aids penetration, Methyl Salicylate acts as a counter-irritant, and Menthol provides a soothing cooling sensation.",
      videoUrl: "",
      isNewLaunch: false
    },
    {
      id: "prod_riosilk",
      categoryId: "derma",
      name: "Riosilk Moisturizing Soap",
      composition: "Vitamin E, Glycerine, Aloe Vera Extract, Shea Butter",
      indications: "Dry skin, rough skin conditions, daily skin moisturizing and cleansing",
      dosage: "Use daily during bath. Lather and rinse thoroughly.",
      packshot: "",
      visualAids: [],
      lbl: "Riosilk is a syndet soap enriched with natural skin conditioners. It restores skin pH, prevents moisture loss, and keeps the skin hydrated and supple throughout the day.",
      videoUrl: "",
      isNewLaunch: false
    },
    {
      id: "prod_cufriodx",
      categoryId: "cough",
      name: "Cufrio DX Syrup",
      composition: "Dextromethorphan Hydrobromide 10mg + Phenylephrine Hydrochloride 5mg + Chlorpheniramine Maleate 2mg per 5ml",
      indications: "Dry cough, nasal congestion, runny nose, sneezing, and throat irritation associated with common cold or allergies",
      dosage: "Adults: 5-10ml 3-4 times daily. Children (6-12 years): 2.5-5ml 3-4 times daily, or as directed by the physician.",
      packshot: "",
      visualAids: [],
      lbl: "Comprehensive relief from dry cough and cold. Dextromethorphan suppresses the cough reflex, Phenylephrine clears nasal blockages, and Chlorpheniramine alleviates allergic reactions.",
      videoUrl: "",
      isNewLaunch: false
    }
  ],
  collections: [
    {
      id: "coll_gastro_detail",
      name: "Gastroenterology Core",
      description: "Standard products presentation for gastroenterologists",
      productIds: [
        "prod_rabrio20",
        "prod_rabriod"
      ]
    },
    {
      id: "coll_general_surgery",
      name: "Surgical Ward Mix",
      description: "Critical care injections and pain relief products for general surgeons",
      productIds: [
        "prod_rioceft",
        "prod_riomol",
        "prod_riodic"
      ]
    }
  ],
  offers: [
    {
      id: "offer_rabrio_launch",
      title: "Rabrio Launch Special",
      description: "Stock up on the newly launched Rabrio 20mg Tablet. Enjoy extra margins for bulk bookings.",
      discount: "Buy 15 Boxes, Get 2 Free",
      productId: "prod_rabrio20",
      expiry: "Valid till 31st July 2026",
      imageUrl: ""
    },
    {
      id: "offer_rioceft_scheme",
      title: "Critical Care Scheme",
      description: "Monsoon scheme on Rioceft 1000 Injection for healthcare franchise partners.",
      discount: "Flat 8% Additional Discount",
      productId: "prod_rioceft",
      expiry: "Valid till 15th August 2026",
      imageUrl: ""
    }
  ],
  registrations: [
    {
      id: "reg_vardhaman",
      firmName: "Vardhaman Pharma Distributors",
      ownerName: "Mr. Vardhaman Shah",
      mobile: "9876543210",
      email: "vardhaman@pharma.com",
      drugLicence: "",
      gst: "",
      pan: "",
      status: "pending",
      createdAt: "2026-06-10T11:45:00Z",
      loginDetails: null
    },
    {
      id: "reg_pooja",
      firmName: "Pooja Medicos",
      ownerName: "Mr. Pooja Patel",
      mobile: "8765432109",
      email: "pooja@medicos.com",
      drugLicence: "",
      gst: "",
      pan: "",
      status: "approved",
      createdAt: "2026-06-09T10:30:00Z",
      loginDetails: {
        "username": "poojapharma",
        "password": "password123"
      }
    },
    {
      id: "reg_invalid",
      firmName: "Standard Pharmacy Box",
      ownerName: "Unknown Applicant",
      mobile: "7654321098",
      email: "fraud@pharma.com",
      drugLicence: "",
      gst: "",
      pan: "",
      status: "denied",
      createdAt: "2026-06-08T09:15:00Z",
      loginDetails: null
    }
  ],
  branding: {
    companyName: "RIOMEDICA",
    tagline: "Healthcare",
    logo: "",
    landingTitle: "Welcome to Riomedica",
    landingDescription: "Interactive Detailing & B2B Portal. We provide premium pharmaceutical products, from tablets and syrups to ointments and more. Our commitment is to deliver excellence in every product, prioritizing your health and well-being.",
    landingBgImage: "",
    topRightBadge: ""
  },
  banners: [
    {
      id: "banner_1",
      title: "Welcome to Riomedica Detailing Desk",
      imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800",
      linkUrl: ""
    }
  ],
  mrs: [
    {
      id: "mr_1",
      distributorId: "reg_pooja",
      name: "Rohan Mehta",
      mobile: "9911223344",
      email: "rohan@poojamedicos.com",
      territory: "West Zone - Sector 2",
      loginDetails: {
        username: "rohan_mr",
        password: "password123"
      }
    }
  ],
  doctorVisits: [
    {
      id: "visit_1",
      distributorId: "reg_pooja",
      mrId: "mr_1",
      doctorName: "Dr. Anjali Sen",
      specialty: "Gastroenterologist",
      location: "City Civil Hospital Area",
      date: "2026-06-11",
      productsDetailed: ["prod_rabrio20"],
      remarks: "Highly interested in Rabrio 20 launch"
    }
  ],
  orders: [],
  admin: {
    username: "admin",
    password: "", // starts empty
    email: "Riomedicahealthcare@gmail.com",
    twoFactorSecret: "",
    twoFactorEnabled: false
  }
};

// Initialize LocalStorage if empty
const initLocalStorage = () => {
  if (!localStorage.getItem('riomedica_db')) {
    localStorage.setItem('riomedica_db', JSON.stringify(FALLBACK_DATA));
  } else {
    const oldDb = JSON.parse(localStorage.getItem('riomedica_db'));
    let modified = false;
    if (!oldDb.offers) {
      oldDb.offers = FALLBACK_DATA.offers;
      modified = true;
    }
    if (!oldDb.registrations) {
      oldDb.registrations = FALLBACK_DATA.registrations;
      modified = true;
    }
    if (!oldDb.branding) {
      oldDb.branding = FALLBACK_DATA.branding;
      modified = true;
    }
    if (!oldDb.banners) {
      oldDb.banners = FALLBACK_DATA.banners;
      modified = true;
    }
    if (!oldDb.mrs) {
      oldDb.mrs = FALLBACK_DATA.mrs;
      modified = true;
    }
    if (!oldDb.doctorVisits) {
      oldDb.doctorVisits = FALLBACK_DATA.doctorVisits;
      modified = true;
    }
    if (!oldDb.orders) {
      oldDb.orders = [];
      modified = true;
    }
    if (!oldDb.admin) {
      oldDb.admin = {
        username: "admin",
        password: "", // starts empty
        email: "Riomedicahealthcare@gmail.com",
        twoFactorSecret: "",
        twoFactorEnabled: false
      };
      modified = true;
    }
    if (modified) {
      try {
        localStorage.setItem('riomedica_db', JSON.stringify(oldDb));
      } catch (err) {
        console.warn("[LocalStorage] Quota exceeded on init:", err.message);
      }
    }
  }
};
initLocalStorage();

const getLocalDb = () => {
  try {
    return JSON.parse(localStorage.getItem('riomedica_db'));
  } catch (err) {
    return null;
  }
};

const saveLocalDb = (data) => {
  try {
    localStorage.setItem('riomedica_db', JSON.stringify(data));
  } catch (err) {
    console.warn("[LocalStorage] Quota exceeded on saveLocalDb:", err.message);
  }
};

// State fallback flag
let isUsingLocalFallback = false;

// Custom wrapper to fetch from server or fallback
async function safeFetch(url, options = {}) {
  try {
    const adminToken = sessionStorage.getItem('adminSessionToken');
    if (adminToken) {
      if (!options.headers) {
        options.headers = {};
      }
      if (options.body instanceof FormData) {
        options.headers['Authorization'] = `Bearer ${adminToken}`;
      } else {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${adminToken}`
        };
      }
    }
    
    const res = await fetch(url, options);
    
    if (res.status === 401) {
      // Only reload if this was an admin-authenticated request (session expired)
      // Regular user 401s (wrong password etc.) should NOT reload the page
      if (adminToken) {
        sessionStorage.removeItem('adminSessionToken');
        sessionStorage.removeItem('adminLoggedIn');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.error || 'Session expired or unauthorized. Please login again.');
    }
    
    if (!res.ok) {
      // In case of 401 login error, we want the client to receive the error details
      const errorObj = await res.json().catch(() => ({}));
      throw new Error(errorObj.error || `Server responded with ${res.status}`);
    }
    isUsingLocalFallback = false;
    return await res.json();
  } catch (err) {
    // If it's a validation credential error or session error, don't fall back, throw the specific error!
    if (err.message && (
      err.message.includes('Invalid credentials') || 
      err.message.includes('still pending') || 
      err.message.includes('unauthorized') || 
      err.message.includes('expired') ||
      err.message.includes('verification code') ||
      err.message.includes('OTP')
    )) {
      throw err;
    }
    if (!isUsingLocalFallback) {
      console.warn("API Server unavailable, falling back to client LocalStorage:", err.message);
      isUsingLocalFallback = true;
    }
    return handleLocalFallback(url, options);
  }
}

// Local Storage handler to mock server requests
function handleLocalFallback(url, options) {
  const db = getLocalDb();
  const path = url.replace(API_BASE, '');
  const method = options.method || 'GET';

  // --- CATEGORIES ---
  if (path === '/categories') {
    if (method === 'GET') return db.categories;
    if (method === 'POST') {
      const { name, description, icon } = JSON.parse(options.body);
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (db.categories.find(c => c.id === id)) throw new Error('Category already exists');
      const newCat = { id, name, description, icon: icon || 'activity' };
      db.categories.push(newCat);
      saveLocalDb(db);
      return newCat;
    }
  }
  if (path.startsWith('/categories/')) {
    if (method === 'DELETE') {
      const id = path.split('/')[2];
      db.categories = db.categories.filter(c => c.id !== id);
      db.products = db.products.map(p => p.categoryId === id ? { ...p, categoryId: '' } : p);
      saveLocalDb(db);
      return { message: 'Category deleted' };
    }
  }

  // --- PRODUCTS ---
  if (path === '/products') {
    if (method === 'GET') return db.products;
    if (method === 'POST') {
      let newProduct = {};
      if (options.body instanceof FormData) {
        const formData = options.body;
        newProduct = {
          id: 'prod_' + Date.now().toString(36),
          name: formData.get('name'),
          categoryId: formData.get('categoryId') || '',
          composition: formData.get('composition') || '',
          indications: formData.get('indications') || '',
          dosage: formData.get('dosage') || '',
          lbl: formData.get('lbl') || '',
          videoUrl: formData.get('videoUrl') || '',
          isNewLaunch: formData.get('isNewLaunch') === 'true',
          packshot: '',
          visualAids: [],
          mrp: formData.get('mrp') || ''
        };
        const packshotFile = formData.get('packshot');
        if (packshotFile && packshotFile.name) {
          newProduct.packshot = `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200`;
        }
        const visualAidsFiles = formData.getAll('visualAids');
        if (visualAidsFiles && visualAidsFiles.length > 0 && visualAidsFiles[0].name) {
          newProduct.visualAids = visualAidsFiles.map((f, i) => `https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800`);
        }
      } else {
        const bodyObj = JSON.parse(options.body || '{}');
        newProduct = {
          id: 'prod_' + Date.now().toString(36),
          ...bodyObj,
          packshot: bodyObj.packshot || '',
          visualAids: bodyObj.visualAids || [],
          isNewLaunch: !!bodyObj.isNewLaunch
        };
      }
      db.products.push(newProduct);
      saveLocalDb(db);
      return newProduct;
    }
  }
  if (path === '/products/bulk-update') {
    if (method === 'POST') {
      const { products } = JSON.parse(options.body || '{}');
      if (Array.isArray(products)) {
        db.products = db.products.map(p => {
          const matched = products.find(u => u.id === p.id);
          return matched ? { ...p, ...matched } : p;
        });
        saveLocalDb(db);
        return { message: `Successfully updated ${products.length} products (Offline Mock)`, count: products.length };
      }
    }
  }
  if (path === '/products/reset') {
    if (method === 'POST') {
      db.products = [];
      if (db.offers) db.offers = [];
      if (db.mrOffers) db.mrOffers = [];
      if (db.collections) {
        db.collections = db.collections.map(c => ({ ...c, productIds: [] }));
      }
      saveLocalDb(db);
      return { message: 'Product catalog reset successful (Offline Mock)' };
    }
  }
  if (path.startsWith('/products/')) {
    const id = path.split('/')[2];
    if (method === 'DELETE') {
      db.products = db.products.filter(p => p.id !== id);
      db.collections = db.collections.map(c => ({
        ...c,
        productIds: c.productIds.filter(pid => pid !== id)
      }));
      saveLocalDb(db);
      return { message: 'Product deleted' };
    }
    if (method === 'PUT') {
      const idx = db.products.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Product not found');
      
      let updatedFields = {};
      if (options.body instanceof FormData) {
        const formData = options.body;
        updatedFields = {
          name: formData.get('name') !== null ? formData.get('name') : db.products[idx].name,
          categoryId: formData.get('categoryId') !== null ? formData.get('categoryId') : db.products[idx].categoryId,
          composition: formData.get('composition') !== null ? formData.get('composition') : db.products[idx].composition,
          indications: formData.get('indications') !== null ? formData.get('indications') : db.products[idx].indications,
          dosage: formData.get('dosage') !== null ? formData.get('dosage') : db.products[idx].dosage,
          lbl: formData.get('lbl') !== null ? formData.get('lbl') : db.products[idx].lbl,
          videoUrl: formData.get('videoUrl') !== null ? formData.get('videoUrl') : db.products[idx].videoUrl,
          isNewLaunch: formData.get('isNewLaunch') !== null ? (formData.get('isNewLaunch') === 'true') : db.products[idx].isNewLaunch,
          mrp: formData.get('mrp') !== null ? formData.get('mrp') : db.products[idx].mrp
        };
        const packshotFile = formData.get('packshot');
        if (packshotFile && packshotFile.name) {
          updatedFields.packshot = `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200`;
        }
        const visualAidsFiles = formData.getAll('visualAids');
        if (visualAidsFiles && visualAidsFiles.length > 0 && visualAidsFiles[0].name) {
          const newAids = visualAidsFiles.map((f, i) => `https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800`);
          if (formData.get('keepExistingAids') === 'true') {
            updatedFields.visualAids = [...db.products[idx].visualAids, ...newAids];
          } else {
            updatedFields.visualAids = newAids;
          }
        }
      } else {
        updatedFields = JSON.parse(options.body || '{}');
      }

      db.products[idx] = { ...db.products[idx], ...updatedFields };
      saveLocalDb(db);
      return db.products[idx];
    }
  }

  // --- COLLECTIONS ---
  if (path === '/collections') {
    if (method === 'GET') return db.collections;
    if (method === 'POST') {
      const { name, description, productIds } = JSON.parse(options.body);
      const newColl = {
        id: 'coll_' + Date.now().toString(36),
        name,
        description: description || '',
        productIds: productIds || []
      };
      db.collections.push(newColl);
      saveLocalDb(db);
      return newColl;
    }
  }
  if (path.startsWith('/collections/')) {
    const id = path.split('/')[2];
    if (method === 'DELETE') {
      db.collections = db.collections.filter(c => c.id !== id);
      saveLocalDb(db);
      return { message: 'Collection deleted' };
    }
    if (method === 'PUT') {
      const idx = db.collections.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Collection not found');
      const fields = JSON.parse(options.body);
      db.collections[idx] = { ...db.collections[idx], ...fields };
      saveLocalDb(db);
      return db.collections[idx];
    }
  }

  // --- OFFERS ---
  if (path === '/offers') {
    if (method === 'GET') return db.offers || [];
    if (method === 'POST') {
      let newOffer = {};
      if (options.body instanceof FormData) {
        const formData = options.body;
        newOffer = {
          id: 'offer_' + Date.now().toString(36),
          title: formData.get('title'),
          description: formData.get('description') || '',
          discount: formData.get('discount') || '',
          productId: formData.get('productId') || '',
          expiry: formData.get('expiry') || '',
          imageUrl: ''
        };
        const imageFile = formData.get('image');
        if (imageFile && imageFile.name) {
          newOffer.imageUrl = `https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500`;
        }
      } else {
        const bodyObj = JSON.parse(options.body || '{}');
        newOffer = {
          id: 'offer_' + Date.now().toString(36),
          ...bodyObj
        };
      }
      if (!db.offers) db.offers = [];
      db.offers.push(newOffer);
      saveLocalDb(db);
      return newOffer;
    }
  }
  if (path.startsWith('/offers/')) {
    const id = path.split('/')[2];
    if (method === 'DELETE') {
      if (!db.offers) db.offers = [];
      db.offers = db.offers.filter(o => o.id !== id);
      saveLocalDb(db);
      return { message: 'Offer deleted' };
    }
  }

  // --- REGISTRATIONS ---
  if (path === '/register') {
    if (method === 'POST') {
      let newReg = {};
      if (options.body instanceof FormData) {
        const formData = options.body;
        newReg = {
          id: 'reg_' + Date.now().toString(36),
          firmName: formData.get('firmName'),
          ownerName: formData.get('ownerName'),
          mobile: formData.get('mobile'),
          email: formData.get('email'),
          status: 'pending',
          createdAt: new Date().toISOString(),
          loginDetails: null,
          drugLicence: 'https://images.unsplash.com/photo-1586075010923-2dd45e9b2d4f?w=800',
          gst: formData.get('gst') ? 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800' : '',
          pan: formData.get('pan') ? 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800' : ''
        };
      } else {
        const bodyObj = JSON.parse(options.body || '{}');
        newReg = {
          id: 'reg_' + Date.now().toString(36),
          ...bodyObj,
          status: 'pending',
          createdAt: new Date().toISOString(),
          loginDetails: null
        };
      }
      if (!db.registrations) db.registrations = [];
      db.registrations.push(newReg);
      saveLocalDb(db);
      return newReg;
    }
  }
  if (path === '/registrations') {
    if (method === 'GET') return db.registrations || [];
  }
  if (path.startsWith('/registrations/')) {
    const id = path.split('/')[2];
    const subPath = path.split('/')[3];
    const idx = db.registrations.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Registration not found');

    if (method === 'DELETE' && !subPath) {
      db.registrations.splice(idx, 1);
      if (!db.mrs) db.mrs = [];
      db.mrs = db.mrs.filter(m => m.distributorId !== id);
      saveLocalDb(db);
      return { message: 'Franchise Partner account and all associated MR profiles have been terminated.' };
    }

    if (subPath === 'approve' && method === 'POST') {
      const { username, password } = JSON.parse(options.body);
      db.registrations[idx].status = 'approved';
      db.registrations[idx].loginDetails = { username, password };
      saveLocalDb(db);
      return db.registrations[idx];
    }
    if (subPath === 'deny' && method === 'POST') {
      db.registrations[idx].status = 'denied';
      db.registrations[idx].loginDetails = null;
      saveLocalDb(db);
      return db.registrations[idx];
    }
  }

  // --- LOGIN ---
  if (path === '/login') {
    if (method === 'POST') {
      const { username, password, otp } = JSON.parse(options.body);
      if (username.toLowerCase() === 'admin') {
        let firstFactorPassed = false;
        
        if (otp) {
          const key = db.admin.email.toLowerCase();
          const savedOtp = window.activeLocalOtps?.email?.[key];
          if (savedOtp && savedOtp === otp) {
            firstFactorPassed = true;
            delete window.activeLocalOtps.email[key];
          } else {
            throw new Error('Invalid verification OTP code');
          }
        } else {
          // If no password set, force OTP login
          if (db.admin.password === '') {
            throw new Error('No administrator password configured. Please log in using Email OTP first.');
          }
          if (db.admin.password === password) {
            firstFactorPassed = true;
          } else {
            throw new Error('Invalid credentials');
          }
        }

        if (firstFactorPassed) {
          if (db.admin.twoFactorEnabled && db.admin.twoFactorSecret) {
            return {
              message: 'First factor verified. 2-Step Verification required.',
              require2FA: true,
              adminEmail: db.admin.email
            };
          } else {
            return {
              message: 'Login successful',
              role: 'admin',
              token: 'mock_admin_token',
              user: {
                id: 'admin_root',
                firmName: 'Riomedica Admin Head Office',
                ownerName: 'Riomedica Admin',
                mobile: '0000000000',
                email: db.admin.email
              }
            };
          }
        }
      }
      const reg = db.registrations.find(
        r => r.status === 'approved' &&
             r.loginDetails &&
             r.loginDetails.username.toLowerCase() === username.toLowerCase() &&
             r.loginDetails.password === password
      );
      if (reg) {
        return {
          message: 'Login successful',
          role: 'distributor',
          user: {
            id: reg.id,
            firmName: reg.firmName,
            ownerName: reg.ownerName,
            mobile: reg.mobile,
            email: reg.email
          }
        };
      }

      // Check MRs
      if (!db.mrs) db.mrs = [];
      const mr = db.mrs.find(
        m => m.loginDetails &&
             m.loginDetails.username.toLowerCase() === username.toLowerCase() &&
             m.loginDetails.password === password
      );
      if (mr) {
        const parent = db.registrations.find(r => r.id === mr.distributorId);
        return {
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
        };
      }

      throw new Error('Invalid credentials or account is still pending verification by Admin');
    }
  }

  // --- OTP MOCKS ---
  if (path === '/otp/send-email-otp') {
    if (method === 'POST') {
      const { email, type } = JSON.parse(options.body);
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      if (!window.activeLocalOtps) {
        window.activeLocalOtps = { mobile: {}, email: {} };
      }
      window.activeLocalOtps.email[email.toLowerCase()] = mockOtp;
      console.log(`[OFFLINE MOCK EMAIL OTP] Code to ${email} is: ${mockOtp}`);
      return { message: 'Verification code sent successfully (Offline Mock)', mockOtp, email };
    }
  }

  if (path === '/otp/verify-email-otp') {
    if (method === 'POST') {
      const { email, otp } = JSON.parse(options.body);
      const savedOtp = window.activeLocalOtps?.email?.[email.toLowerCase()];
      if (!savedOtp || savedOtp !== otp) {
        throw new Error('Invalid verification OTP code');
      }
      return { message: 'Email verified successfully (Offline Mock)' };
    }
  }

  if (path === '/otp/send-mobile') {
    if (method === 'POST') {
      const { mobile } = JSON.parse(options.body);
      const mockOtp = "123456";
      if (!window.activeLocalOtps) {
        window.activeLocalOtps = { mobile: {}, email: {} };
      }
      window.activeLocalOtps.mobile[mobile] = mockOtp;
      console.log(`[OFFLINE MOCK SMS] Code to ${mobile} is: ${mockOtp}`);
      return { message: 'OTP sent successfully (Offline Mock)', mockOtp };
    }
  }

  if (path === '/otp/verify-mobile') {
    if (method === 'POST') {
      const { mobile, otp } = JSON.parse(options.body);
      const savedOtp = window.activeLocalOtps?.mobile?.[mobile];
      if (!savedOtp || savedOtp !== otp) {
        throw new Error('Invalid verification OTP code');
      }
      return { message: 'Mobile verified (Offline Mock)' };
    }
  }

  if (path === '/otp/send-email') {
    if (method === 'POST') {
      const { usernameOrEmail } = JSON.parse(options.body);
      const user = db.registrations.find(
        r => r.status === 'approved' &&
             ((r.email && r.email.toLowerCase() === usernameOrEmail.toLowerCase()) ||
              (r.loginDetails && r.loginDetails.username.toLowerCase() === usernameOrEmail.toLowerCase()))
      );
      if (!user) {
        throw new Error('No approved account found with this email or username');
      }
      const mockOtp = "654321";
      if (!window.activeLocalOtps) {
        window.activeLocalOtps = { mobile: {}, email: {} };
      }
      window.activeLocalOtps.email[usernameOrEmail.toLowerCase()] = mockOtp;
      console.log(`[OFFLINE MOCK EMAIL] Reset code to ${user.email} is: ${mockOtp}`);
      return { message: 'OTP sent (Offline Mock)', mockOtp, email: user.email };
    }
  }

  if (path === '/otp/verify-email-reset') {
    if (method === 'POST') {
      const { usernameOrEmail, otp, newPassword } = JSON.parse(options.body);
      const key = usernameOrEmail.toLowerCase();
      const savedOtp = window.activeLocalOtps?.email?.[key];
      if (!savedOtp || savedOtp !== otp) {
        throw new Error('Invalid verification OTP code');
      }
      const idx = db.registrations.findIndex(
        r => r.status === 'approved' &&
             ((r.email && r.email.toLowerCase() === key) ||
              (r.loginDetails && r.loginDetails.username.toLowerCase() === key))
      );
      if (idx === -1) {
        throw new Error('User account not found');
      }
      db.registrations[idx].loginDetails.password = newPassword;
      saveLocalDb(db);
      return { message: 'Password reset successful (Offline Mock)' };
    }
  }

  if (path === '/user/change-password') {
    if (method === 'POST') {
      const { userId, oldPassword, newPassword } = JSON.parse(options.body);
      const regIdx = db.registrations.findIndex(r => r.id === userId);
      if (regIdx !== -1) {
        if (db.registrations[regIdx].loginDetails && db.registrations[regIdx].loginDetails.password === oldPassword) {
          db.registrations[regIdx].loginDetails.password = newPassword;
          saveLocalDb(db);
          return { message: 'Password changed successfully.' };
        } else {
          throw new Error('Incorrect old password.');
        }
      }
      const mrIdx = db.mrs.findIndex(m => m.id === userId);
      if (mrIdx !== -1) {
        if (db.mrs[mrIdx].loginDetails && db.mrs[mrIdx].loginDetails.password === oldPassword) {
          db.mrs[mrIdx].loginDetails.password = newPassword;
          saveLocalDb(db);
          return { message: 'Password changed successfully.' };
        } else {
          throw new Error('Incorrect old password.');
        }
      }
      throw new Error('User not found.');
    }
  }

  if (path === '/admin/reset-password') {
    if (method === 'POST') {
      const { userId, newPassword } = JSON.parse(options.body);
      const regIdx = db.registrations.findIndex(r => r.id === userId);
      if (regIdx !== -1) {
        if (!db.registrations[regIdx].loginDetails) {
          db.registrations[regIdx].loginDetails = {};
        }
        db.registrations[regIdx].loginDetails.password = newPassword;
        saveLocalDb(db);
        return { message: 'Password reset successfully.' };
      }
      throw new Error('User not found.');
    }
  }

  if (path === '/mrs/reset-password') {
    if (method === 'POST') {
      const { mrId, newPassword } = JSON.parse(options.body);
      if (!db.mrs) db.mrs = [];
      const mrIdx = db.mrs.findIndex(m => m.id === mrId);
      if (mrIdx !== -1) {
        if (!db.mrs[mrIdx].loginDetails) {
          db.mrs[mrIdx].loginDetails = {};
        }
        db.mrs[mrIdx].loginDetails.password = newPassword;
        saveLocalDb(db);
        return { message: 'MR password reset successfully.' };
      }
      throw new Error('MR not found.');
    }
  }

  // --- ADMIN SECURITY ENDPOINTS ---
  if (path === '/admin/status') {
    if (method === 'GET') {
      return {
        twoFactorEnabled: !!(db.admin && db.admin.twoFactorEnabled),
        email: db.admin ? db.admin.email : 'Riomedicahealthcare@gmail.com'
      };
    }
  }

  if (path === '/admin/verify-2fa') {
    if (method === 'POST') {
      const { username, totpCode, fallbackOtp } = JSON.parse(options.body);
      if (totpCode) {
        // Accept offline test code 123456 or a valid code matching mock secret
        if (totpCode === '123456' || (db.admin.twoFactorSecret && totpCode === '123456')) {
          return {
            message: 'Login successful (Offline Mock)',
            role: 'admin',
            token: 'mock_admin_token',
            user: { id: 'admin_root', firmName: 'Riomedica Admin', ownerName: 'Riomedica Admin', email: db.admin.email }
          };
        } else {
          throw new Error('Invalid 2-Step Verification code');
        }
      } else if (fallbackOtp) {
        const key = db.admin.email.toLowerCase();
        const savedOtp = window.activeLocalOtps?.email?.[key];
        if (savedOtp && savedOtp === fallbackOtp) {
          delete window.activeLocalOtps.email[key];
          return {
            message: 'Login successful (Offline Backup Mock)',
            role: 'admin',
            token: 'mock_admin_token',
            user: { id: 'admin_root', firmName: 'Riomedica Admin', ownerName: 'Riomedica Admin', email: db.admin.email }
          };
        } else {
          throw new Error('Invalid backup verification OTP');
        }
      }
    }
  }

  if (path === '/admin/setup-2fa') {
    if (method === 'POST') {
      const secret = 'MOCKSECRET2FA123';
      const label = encodeURIComponent(`RiomedicaAdmin:${db.admin.email}`);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/${label}?secret=${secret}&issuer=RiomedicaAdmin`;
      return { secret, qrCodeUrl };
    }
  }

  if (path === '/admin/enable-2fa') {
    if (method === 'POST') {
      const { secret, code } = JSON.parse(options.body);
      if (code === '123456') {
        db.admin.twoFactorEnabled = true;
        db.admin.twoFactorSecret = secret;
        saveLocalDb(db);
        return { success: true, message: 'Google Authenticator 2-Step Verification enabled successfully (Offline Mock)' };
      } else {
        throw new Error('Invalid verification code. Use 123456 for offline test.');
      }
    }
  }

  if (path === '/admin/disable-2fa') {
    if (method === 'POST') {
      const { code, fallbackOtp } = JSON.parse(options.body);
      let verified = false;
      if (code === '123456') {
        verified = true;
      } else if (fallbackOtp) {
        const key = db.admin.email.toLowerCase();
        const savedOtp = window.activeLocalOtps?.email?.[key];
        if (savedOtp && savedOtp === fallbackOtp) {
          delete window.activeLocalOtps.email[key];
          verified = true;
        }
      }
      if (verified) {
        db.admin.twoFactorEnabled = false;
        db.admin.twoFactorSecret = '';
        saveLocalDb(db);
        return { success: true, message: 'Google Authenticator 2-Step Verification disabled successfully (Offline Mock)' };
      } else {
        throw new Error('Invalid verification code.');
      }
    }
  }

  if (path === '/admin/change-password') {
    if (method === 'POST') {
      const { newPassword, otp } = JSON.parse(options.body);
      const key = db.admin.email.toLowerCase();
      const savedOtp = window.activeLocalOtps?.email?.[key];
      if (savedOtp && savedOtp === otp) {
        delete window.activeLocalOtps.email[key];
        db.admin.password = newPassword;
        saveLocalDb(db);
        return { success: true, message: 'Administrator password updated successfully (Offline Mock)' };
      } else {
        throw new Error('Invalid verification OTP code');
      }
    }
  }

  // --- BRANDING ---
  if (path === '/branding') {
    if (method === 'GET') return db.branding || { companyName: "RIOMEDICA", tagline: "Healthcare", logo: "", landingTitle: "", landingDescription: "", landingBgImage: "", topRightBadge: "" };
    if (method === 'POST') {
      if (!db.branding) {
        db.branding = { companyName: "RIOMEDICA", tagline: "Healthcare", logo: "", landingTitle: "", landingDescription: "", landingBgImage: "", topRightBadge: "" };
      }
      if (options.body instanceof FormData) {
        const formData = options.body;
        if (formData.get('companyName') !== null) db.branding.companyName = formData.get('companyName');
        if (formData.get('tagline') !== null) db.branding.tagline = formData.get('tagline');
        if (formData.get('landingTitle') !== null) db.branding.landingTitle = formData.get('landingTitle');
        if (formData.get('landingDescription') !== null) db.branding.landingDescription = formData.get('landingDescription');
        
        const logoFile = formData.get('logo');
        if (logoFile && logoFile.name) {
          db.branding.logo = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200';
        }
        const bgFile = formData.get('landingBgImage');
        if (bgFile && bgFile.name) {
          db.branding.landingBgImage = 'https://images.unsplash.com/photo-1584515901367-f1c21b5297e2?w=800';
        }
        const badgeFile = formData.get('topRightBadge');
        if (badgeFile && badgeFile.name) {
          db.branding.topRightBadge = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100';
        }
      } else {
        const bodyObj = JSON.parse(options.body || '{}');
        db.branding = { ...db.branding, ...bodyObj };
      }
      saveLocalDb(db);
      return db.branding;
    }
  }

  // --- SETTINGS ---
  if (path === '/settings') {
    if (method === 'GET') return db.settings || { geminiApiKey: "" };
    if (method === 'POST') {
      const { geminiApiKey } = JSON.parse(options.body);
      db.settings = db.settings || {};
      db.settings.geminiApiKey = geminiApiKey || "";
      saveLocalDb(db);
      return db.settings;
    }
  }

  // --- BANNERS ---
  if (path === '/banners') {
    if (method === 'GET') return db.banners || [];
    if (method === 'POST') {
      let newBanner = {};
      if (options.body instanceof FormData) {
        const formData = options.body;
        newBanner = {
          id: 'banner_' + Date.now().toString(36),
          title: formData.get('title') || '',
          imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
          linkUrl: formData.get('linkUrl') || '',
          linkProductId: formData.get('linkProductId') || ''
        };
      } else {
        const bodyObj = JSON.parse(options.body || '{}');
        newBanner = {
          id: 'banner_' + Date.now().toString(36),
          title: '',
          imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
          linkUrl: '',
          linkProductId: '',
          ...bodyObj
        };
      }
      if (!db.banners) db.banners = [];
      db.banners.push(newBanner);
      saveLocalDb(db);
      return newBanner;
    }
  }

  if (path.startsWith('/banners/')) {
    if (method === 'DELETE') {
      const id = path.split('/')[2];
      if (!db.banners) db.banners = [];
      db.banners = db.banners.filter(b => b.id !== id);
      saveLocalDb(db);
      return { message: 'Banner deleted (Offline Mock)' };
    }
  }

  // --- MRS ---
  if (path === '/mrs') {
    if (method === 'GET') return db.mrs || [];
    if (method === 'POST') {
      const { distributorId, name, mobile, email, territory, username, password } = JSON.parse(options.body);
      if (!db.mrs) db.mrs = [];
      const isDuplicate = db.mrs.some(m => m.loginDetails?.username?.toLowerCase() === username.toLowerCase()) ||
                          db.registrations?.some(r => r.loginDetails?.username?.toLowerCase() === username.toLowerCase());
      if (isDuplicate) throw new Error('Username is already taken');
      const newMr = {
        id: 'mr_' + Date.now().toString(36),
        distributorId,
        name,
        mobile: mobile || '',
        email: email || '',
        territory: territory || '',
        loginDetails: { username, password }
      };
      db.mrs.push(newMr);
      saveLocalDb(db);
      return newMr;
    }
  }

  if (path.startsWith('/mrs/')) {
    if (method === 'DELETE') {
      const id = path.split('/')[2];
      if (!db.mrs) db.mrs = [];
      db.mrs = db.mrs.filter(m => m.id !== id);
      saveLocalDb(db);
      return { message: 'MR deleted (Offline Mock)' };
    }
  }

  // --- VISITS ---
  if (path === '/visits') {
    if (method === 'GET') return db.doctorVisits || [];
    if (method === 'POST') {
      const { distributorId, mrId, doctorName, specialty, location, date, productsDetailed, remarks } = JSON.parse(options.body);
      if (!db.doctorVisits) db.doctorVisits = [];
      const newVisit = {
        id: 'visit_' + Date.now().toString(36),
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
      saveLocalDb(db);
      return newVisit;
    }
  }

  // --- MR OFFERS ---
  if (path === '/mr-offers') {
    if (method === 'GET') return db.mrOffers || [];
    if (method === 'POST') {
      const { distributorId, title, description, discount, productId, expiry } = JSON.parse(options.body);
      if (!db.mrOffers) db.mrOffers = [];
      const newOffer = {
        id: 'mroffer_' + Date.now().toString(36),
        distributorId,
        title,
        description: description || '',
        discount,
        productId: productId || null,
        expiry: expiry || ''
      };
      db.mrOffers.push(newOffer);
      saveLocalDb(db);
      return newOffer;
    }
  }

  if (path.startsWith('/mr-offers/')) {
    if (method === 'DELETE') {
      const id = path.split('/')[2];
      if (!db.mrOffers) db.mrOffers = [];
      db.mrOffers = db.mrOffers.filter(o => o.id !== id);
      saveLocalDb(db);
      return { message: 'MR offer deleted (Offline Mock)' };
    }
  }

  if (path === '/ai/chat') {
    if (method === 'POST') {
      const { message, history } = JSON.parse(options.body);
      const lowerMsg = message.toLowerCase();
      let reply = "";
      let detectedLang = "en";

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
          matchedProduct = db.products.find(p => p.name.toLowerCase().includes(correctName));
          if (matchedProduct) break;
        }
      }

      if (!matchedProduct) {
        matchedProduct = db.products.find(p => lowerMsg.includes(p.name.toLowerCase()));
      }

      if (matchedProduct) {
        const mrpVal = matchedProduct.mrp ? (String(matchedProduct.mrp).includes('₹') ? matchedProduct.mrp : `₹${matchedProduct.mrp}`) : 'Price on request';
        if (detectedLang === "hi") {
          reply = `नमस्ते, मैं प्रिया हूँ रियोमेडिका से। ${matchedProduct.name} के बारे में मैं आपको जानकारी दे देती हूँ। इसकी संरचना ${matchedProduct.composition} है। यह मुख्य रूप से ${matchedProduct.indications || 'सामान्य उपयोग'} के लिए उपयोग किया जाता है। इसकी सामान्य खुराक ${matchedProduct.dosage || 'चिकित्सक के निर्देशानुसार'} है और इसका एमआरपी ${mrpVal} है। यह एक उत्कृष्ट उत्पाद है। क्या मैं आपकी कुछ और मदद करूँ? (ऑफ़लाइन सिमुलेशन मोड)`;
        } else if (detectedLang === "ta") {
          reply = `வணக்கம், நான் பிரியா பேசுறேன். ${matchedProduct.name} பற்றி சொல்கிறேன். இதில் ${matchedProduct.composition} உள்ளது. இது பொதுவாக ${matchedProduct.indications || 'பொதுவான பயன்பாட்டிற்கு'} பயன்படுகிறது. இதனுடைய விலை ${mrpVal} ஆகும். உங்களுக்கு வேறு ஏதேனும் விவரங்கள் வேண்டுமா? (ஆஃப்லைன் சிமுலேஷன் முறை)`;
        } else if (detectedLang === "mr") {
          reply = `नमस्कार, मी प्रिया बोलत आहे. ${matchedProduct.name} बद्दल सांगायचे तर, यामध्ये ${matchedProduct.composition} घटक आहेत. याचा वापर प्रामुख्याने ${matchedProduct.indications || 'सामान्य वापरासाठी'} केला जातो. याची किंमत ${mrpVal} आहे. तुम्हाला याबद्दल अजून काही माहिती हवी आहे का? (ऑफलाइन सिम्युलेशन मोड)`;
        } else {
          reply = `Hello, this is Priya from the Riomedica team. I can certainly help you with ${matchedProduct.name}. It contains ${matchedProduct.composition}. For indications, it is generally used for ${matchedProduct.indications || 'general clinical use'}, and the MRP for this medicine is ${mrpVal}. Please let me know if you would like me to help with anything else. (Offline Simulation Mode)`;
        }
      } else {
        if (detectedLang === "hi") {
          reply = "नमस्ते! मैं प्रिया बोल रही हूँ रियोमेडिका टीम से। मैं एक असली प्रतिनिधि की तरह आपकी सहायता करने के लिए यहाँ हूँ। आप मुझसे किसी भी दवा जैसे 'Rabrio 20' या 'Rioceft' के बारे में पूछ सकते हैं। (ऑफ़लाइन सिमुलेशन मोड)";
        } else if (detectedLang === "ta") {
          reply = "வணக்கம்! நான் பிரியா பேசுறேன். தயாரிப்புகள் அல்லது விலைகளைப் பற்றி கேட்கலாம். (ஆஃப்லைன் சிமுலேஷன் முறை)";
        } else if (detectedLang === "mr") {
          reply = "नमस्कार! मी प्रिया बोलत आहे. तुम्ही मला औषधांबद्दल विचारू शकता. (ऑफलाइन सिम्युलेशन मोड)";
        } else {
          reply = "Hello! This is Priya from the Riomedica customer support team. I am here to help you just like a real support coordinator. Ask me about any of our brands, such as 'Tell me about Rabrio 20'. (Offline Simulation Mode)";
        }
      }

      return { reply };
    }
  }

  // --- ORDERS ---
  if (path === '/orders') {
    if (method === 'GET') {
      return db.orders || [];
    }
    if (method === 'POST') {
      if (!db.orders) db.orders = [];
      const orderData = JSON.parse(options.body);
      const newOrder = {
        id: 'ord-' + Date.now(),
        firmName: orderData.firmName || 'Unknown',
        userName: orderData.userName || 'Anonymous',
        createdByRole: orderData.createdByRole,
        distributorId: orderData.distributorId,
        mrId: orderData.mrId,
        doctorDetails: orderData.doctorDetails,
        items: orderData.items || [],
        totalPrice: orderData.totalPrice || 0,
        createdAt: new Date().toISOString(),
        status: 'Pending'
      };
      db.orders.push(newOrder);
      saveLocalDb(db);
      return { success: true, order: newOrder };
    }
  }

  if (path.startsWith('/orders/')) {
    const parts = path.split('/');
    const id = parts[2];
    if (parts[3] === 'status' && method === 'PUT') {
      if (!db.orders) db.orders = [];
      const { status } = JSON.parse(options.body);
      const orderIndex = db.orders.findIndex(o => o.id === id);
      if (orderIndex !== -1) {
        db.orders[orderIndex].status = status;
        saveLocalDb(db);
        return { success: true, order: db.orders[orderIndex] };
      }
      throw new Error('Order not found');
    }
    if (method === 'DELETE') {
      if (db.orders) {
        db.orders = db.orders.filter(o => o.id !== id);
        saveLocalDb(db);
      }
      return { success: true };
    }
  }

  throw new Error('Not Found ' + path);
}

// --- API EXPORTS ---

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

export const getCategories = async () => {
  const cats = await fbGetCategories();
  return cats && cats.length > 0 ? cats : [];
};

export const addCategory = async (category) => {
  const id = category.id || category.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanCat = { ...category, id };
  await fbSetCategory(id, cleanCat);
  safeFetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanCat)
  }).catch(() => {});
  return cleanCat;
};

export const deleteCategory = async (id) => {
  await fbDeleteCategory(id);
  safeFetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' }).catch(() => {});
  return { message: 'Category deleted successfully' };
};

export const getProducts = async () => {
  const prods = await fbGetProducts();
  return prods && prods.length > 0 ? prods : [];
};

export const addProduct = async (formData) => {
  let productData = {};
  if (formData instanceof FormData) {
    const id = formData.get('id') || 'prod_' + Math.random().toString(36).substr(2, 9);
    
    let packshotBase64 = '';
    const packshotFile = formData.get('packshot');
    if (packshotFile && packshotFile instanceof File && packshotFile.name) {
      packshotBase64 = await fileToBase64(packshotFile);
    } else {
      packshotBase64 = formData.get('packshot') || '';
    }

    let visualAidsBase64s = [];
    const visualAidsFiles = formData.getAll('visualAids');
    if (visualAidsFiles && visualAidsFiles.length > 0) {
      visualAidsBase64s = await Promise.all(
        visualAidsFiles.map(async (file) => {
          if (file instanceof File && file.name) {
            return await fileToBase64(file);
          }
          return file;
        })
      );
    }

    productData = {
      id,
      name: formData.get('name'),
      categoryId: formData.get('categoryId') || '',
      composition: formData.get('composition') || '',
      indications: formData.get('indications') || '',
      dosage: formData.get('dosage') || '',
      lbl: formData.get('lbl') || '',
      videoUrl: formData.get('videoUrl') || '',
      isNewLaunch: formData.get('isNewLaunch') === 'true',
      mrp: formData.get('mrp') || '',
      packshot: packshotBase64,
      visualAids: visualAidsBase64s
    };
  } else {
    productData = formData;
  }

  await fbSetProduct(productData.id, productData);
  
  if (formData instanceof FormData) {
    safeFetch(`${API_BASE}/products`, { method: 'POST', body: formData }).catch(() => {});
  } else {
    safeFetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    }).catch(() => {});
  }
  return productData;
};

export const updateProduct = async (id, formData) => {
  let productData = {};
  if (formData instanceof FormData) {
    let packshotBase64 = '';
    const packshotFile = formData.get('packshot');
    if (packshotFile && packshotFile instanceof File && packshotFile.name) {
      packshotBase64 = await fileToBase64(packshotFile);
    } else {
      packshotBase64 = formData.get('packshot') || '';
    }

    let visualAidsBase64s = [];
    const visualAidsFiles = formData.getAll('visualAids');
    if (visualAidsFiles && visualAidsFiles.length > 0) {
      visualAidsBase64s = await Promise.all(
        visualAidsFiles.map(async (file) => {
          if (file instanceof File && file.name) {
            return await fileToBase64(file);
          }
          return file;
        })
      );
    }

    productData = {
      id,
      name: formData.get('name'),
      categoryId: formData.get('categoryId') || '',
      composition: formData.get('composition') || '',
      indications: formData.get('indications') || '',
      dosage: formData.get('dosage') || '',
      lbl: formData.get('lbl') || '',
      videoUrl: formData.get('videoUrl') || '',
      isNewLaunch: formData.get('isNewLaunch') === 'true',
      mrp: formData.get('mrp') || '',
      packshot: packshotBase64,
      visualAids: visualAidsBase64s
    };
  } else {
    productData = { ...formData, id };
  }

  await fbSetProduct(id, productData);

  if (formData instanceof FormData) {
    safeFetch(`${API_BASE}/products/${id}`, { method: 'PUT', body: formData }).catch(() => {});
  } else {
    safeFetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    }).catch(() => {});
  }
  return productData;
};

export const bulkUpdateProducts = async (products, skipFirebase = false) => {
  if (!skipFirebase && Array.isArray(products) && products.length > 0) {
    await fbUpdateProducts(products);
  }
  safeFetch(`${API_BASE}/products/bulk-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products })
  }).catch(() => {});
  return { success: true };
};

export const deleteProduct = async (id) => {
  await fbDeleteProduct(id);
  safeFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }).catch(() => {});
  return { message: 'Product deleted successfully' };
};

export const resetProducts = async () => {
  await fbSetProducts([]);
  safeFetch(`${API_BASE}/products/reset`, { method: 'POST' }).catch(() => {});
  return { success: true };
};

export const getCollections = async () => {
  const colls = await fbGetCollections();
  return colls && colls.length > 0 ? colls : [];
};

export const createCollection = async (collection) => {
  const id = collection.id || 'coll_' + Math.random().toString(36).substr(2, 9);
  const cleanColl = { ...collection, id };
  await fbSetCollection(id, cleanColl);
  safeFetch(`${API_BASE}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanColl)
  }).catch(() => {});
  return cleanColl;
};

export const updateCollection = async (id, collection) => {
  const cleanColl = { ...collection, id };
  await fbSetCollection(id, cleanColl);
  safeFetch(`${API_BASE}/collections/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanColl)
  }).catch(() => {});
  return cleanColl;
};

export const deleteCollection = async (id) => {
  await fbDeleteCollection(id);
  safeFetch(`${API_BASE}/collections/${id}`, { method: 'DELETE' }).catch(() => {});
  return { message: 'Collection deleted successfully' };
};

export const getOffers = async () => {
  const offs = await fbGetOffers();
  return offs && offs.length > 0 ? offs : [];
};

export const addOffer = async (formData) => {
  let offerData = {};
  if (formData instanceof FormData) {
    const id = formData.get('id') || 'offer_' + Math.random().toString(36).substr(2, 9);
    let imageBase64 = '';
    const imageFile = formData.get('image');
    if (imageFile && imageFile instanceof File && imageFile.name) {
      imageBase64 = await fileToBase64(imageFile);
    } else {
      imageBase64 = formData.get('image') || '';
    }
    offerData = {
      id,
      title: formData.get('title'),
      description: formData.get('description'),
      discount: formData.get('discount') || '',
      productId: formData.get('productId') || '',
      expiry: formData.get('expiry') || '',
      imageUrl: imageBase64
    };
  } else {
    offerData = formData;
  }
  await fbSetOffer(offerData.id, offerData);
  if (formData instanceof FormData) {
    safeFetch(`${API_BASE}/offers`, { method: 'POST', body: formData }).catch(() => {});
  } else {
    safeFetch(`${API_BASE}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offerData)
    }).catch(() => {});
  }
  return offerData;
};

export const deleteOffer = async (id) => {
  await fbDeleteOffer(id);
  safeFetch(`${API_BASE}/offers/${id}`, { method: 'DELETE' }).catch(() => {});
  return { message: 'Offer deleted successfully' };
};

export const registerUser = async (formData) => {
  let regData = {};
  if (formData instanceof FormData) {
    const id = 'reg_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    let drugLicenceBase64 = '';
    const dlFile = formData.get('drugLicence');
    if (dlFile && dlFile instanceof File && dlFile.name) {
      drugLicenceBase64 = await fileToBase64(dlFile);
    }
    
    let gstBase64 = '';
    const gstFile = formData.get('gst');
    if (gstFile && gstFile instanceof File && gstFile.name) {
      gstBase64 = await fileToBase64(gstFile);
    }

    let panBase64 = '';
    const panFile = formData.get('pan');
    if (panFile && panFile instanceof File && panFile.name) {
      panBase64 = await fileToBase64(panFile);
    }

    regData = {
      id,
      shopName: formData.get('shopName'),
      ownerName: formData.get('ownerName'),
      email: formData.get('email'),
      mobile: formData.get('mobile'),
      address: formData.get('address'),
      drugLicenceNo: formData.get('drugLicenceNo'),
      gstNo: formData.get('gstNo'),
      panNo: formData.get('panNo'),
      drugLicenceUrl: drugLicenceBase64,
      gstUrl: gstBase64,
      panUrl: panBase64,
      status: 'pending',
      createdAt: new Date().toISOString(),
      loginDetails: {
        username: formData.get('username') || formData.get('mobile'),
        password: formData.get('password')
      }
    };
  } else {
    regData = formData;
  }
  await fbSetRegistration(regData.id, regData);
  
  if (formData instanceof FormData) {
    safeFetch(`${API_BASE}/register`, { method: 'POST', body: formData }).catch(() => {});
  } else {
    safeFetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData)
    }).catch(() => {});
  }
  return regData;
};

export const getRegistrations = async () => {
  const regs = await fbGetRegistrations();
  return regs && regs.length > 0 ? regs : [];
};

export const approveRegistration = async (id, credentials) => {
  const regs = await fbGetRegistrations();
  const reg = regs.find(r => r.id === id);
  if (!reg) throw new Error('Registration not found');

  const approvedReg = { ...reg, status: 'approved' };
  await fbSetRegistration(id, approvedReg);

  const user = {
    id,
    username: reg.loginDetails.username,
    password: reg.loginDetails.password,
    name: reg.ownerName,
    email: reg.email,
    mobile: reg.mobile,
    role: 'retailer',
    status: 'approved',
    createdAt: new Date().toISOString()
  };
  
  const currentUsers = await fbGetUsers();
  await fbSetUsers([...currentUsers.filter(u => u.id !== id), user]);

  safeFetch(`${API_BASE}/registrations/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  }).catch(() => {});

  return approvedReg;
};

export const denyRegistration = async (id) => {
  const regs = await fbGetRegistrations();
  const reg = regs.find(r => r.id === id);
  if (!reg) throw new Error('Registration not found');

  const deniedReg = { ...reg, status: 'denied' };
  await fbSetRegistration(id, deniedReg);

  safeFetch(`${API_BASE}/registrations/${id}/deny`, { method: 'POST' }).catch(() => {});
  return deniedReg;
};

export const terminateFranchisePartner = async (id) => {
  await fbSetRegistration(id, null);
  await fbDeleteUser(id);
  safeFetch(`${API_BASE}/registrations/${id}`, { method: 'DELETE' }).catch(() => {});
  return { success: true };
};

export const changeUserPassword = async (userId, oldPassword, newPassword) => {
  const users = await fbGetUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].password = newPassword;
    await fbSetUsers(users);
  }
  
  const regs = await fbGetRegistrations();
  const regIndex = regs.findIndex(r => r.id === userId);
  if (regIndex !== -1) {
    regs[regIndex].loginDetails.password = newPassword;
    await fbSetRegistration(userId, regs[regIndex]);
  }

  return safeFetch(`${API_BASE}/user/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, oldPassword, newPassword })
  }).catch(() => {
    return { success: true, message: 'Password updated successfully via Firebase fallback' };
  });
};

export const adminResetPassword = async (userId, newPassword) => {
  const users = await fbGetUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].password = newPassword;
    await fbSetUsers(users);
  }

  const regs = await fbGetRegistrations();
  const regIndex = regs.findIndex(r => r.id === userId);
  if (regIndex !== -1) {
    regs[regIndex].loginDetails.password = newPassword;
    await fbSetRegistration(userId, regs[regIndex]);
  }

  safeFetch(`${API_BASE}/admin/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newPassword })
  }).catch(() => {});

  return { success: true };
};

export const resetMRPassword = async (mrId, newPassword) => {
  const mrs = await fbGetMRs();
  const mrIndex = mrs.findIndex(m => m.id === mrId);
  if (mrIndex !== -1) {
    mrs[mrIndex].loginDetails.password = newPassword;
    await fbSetMRs(mrs);
  }

  safeFetch(`${API_BASE}/mrs/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mrId, newPassword })
  }).catch(() => {});

  return { success: true };
};

export const loginUser = async (credentials) => {
  try {
    return await safeFetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
  } catch (err) {
    if (err.message && (err.message.includes('pending') || err.message.includes('Invalid credentials'))) {
      throw err;
    }
    if (credentials.username && credentials.username.toLowerCase() === 'admin') {
      const adminData = await fbGetAdmin();
      if (adminData && adminData.password === credentials.password) {
        return {
          success: true,
          user: {
            id: 'admin_root',
            firmName: 'Riomedica Admin Head Office',
            ownerName: 'Riomedica Admin',
            mobile: '0000000000',
            email: adminData.email || 'Riomedicahealthcare@gmail.com',
            role: 'admin'
          },
          token: 'firebase_mock_token_' + Math.random().toString(36).substr(2)
        };
      }
    }
    const user = await fbLoginUser(credentials.username, credentials.password);
    if (user) {
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
          mobile: user.mobile
        },
        token: 'firebase_mock_token_' + Math.random().toString(36).substr(2)
      };
    }
    throw new Error(err.message || 'Invalid credentials or authentication server offline');
  }
};

export const sendMobileOtp = async (mobile) => {
  try {
    const res = await safeFetch(`${API_BASE}/otp/send-mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    });
    if (res && res.mockOtp) {
      fbWriteOtp('mobile', mobile, res.mockOtp).catch((fbErr) => {
        console.warn('[FB] failed to write mobile OTP to Firebase:', fbErr.message);
      });
    }
    return res;
  } catch (err) {
    console.warn("[utils] Backend mobile OTP error. Falling back to client-side direct dispatch...", err.message);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await fbWriteOtp('mobile', mobile, otp);
    return { success: true, message: 'Verification OTP sent successfully (fallback)', mockOtp: otp };
  }
};

export const verifyMobileOtp = async (mobile, otp) => {
  try {
    const res = await safeFetch(`${API_BASE}/otp/verify-mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp })
    });
    try {
      await fbDeleteOtp('mobile', mobile);
    } catch (e) {}
    return res;
  } catch (err) {
    const verified = await fbVerifyOtp('mobile', mobile, otp);
    if (verified) {
      return { success: true, message: 'Mobile verified successfully via Firebase fallback' };
    }
    throw err;
  }
};

export const sendEmailOtp = async (usernameOrEmail) => {
  const res = await safeFetch(`${API_BASE}/otp/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail })
  });
  if (res && res.mockOtp) {
    fbWriteOtp('email_reset', usernameOrEmail, res.mockOtp).catch((fbErr) => {
      console.warn('[FB] failed to write email reset OTP to Firebase:', fbErr.message);
    });
  }
  return res;
};

export const verifyEmailReset = async (usernameOrEmail, otp, newPassword) => {
  try {
    const res = await safeFetch(`${API_BASE}/otp/verify-email-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, otp, newPassword })
    });
    try {
      await fbDeleteOtp('email_reset', usernameOrEmail);
    } catch (e) {}
    return res;
  } catch (err) {
    const verified = await fbVerifyOtp('email_reset', usernameOrEmail, otp);
    if (verified) {
      const db = getOfflineDbData();
      const key = usernameOrEmail.toLowerCase();
      const idx = db.registrations.findIndex(
        r => r.status === 'approved' &&
             ((r.email && r.email.toLowerCase() === key) ||
              (r.loginDetails && r.loginDetails.username.toLowerCase() === key))
      );
      if (idx !== -1) {
        db.registrations[idx].loginDetails.password = newPassword;
        saveLocalDb(db);
      }
      return { success: true, message: 'Password reset successful via Firebase fallback' };
    }
    throw err;
  }
};

export const getBranding = async () => {
  const brand = await fbGetBranding();
  return brand || { companyName: 'RIOMEDICA', tagline: 'Healthcare', logo: '' };
};

export const updateBranding = async (formData) => {
  let brandingData = {};
  if (formData instanceof FormData) {
    let logoBase64 = '';
    const logoFile = formData.get('logo');
    if (logoFile && logoFile instanceof File && logoFile.name) {
      logoBase64 = await fileToBase64(logoFile);
    } else {
      logoBase64 = formData.get('logo') || '';
    }

    let landingBgBase64 = '';
    const landingBgFile = formData.get('landingBgImage');
    if (landingBgFile && landingBgFile instanceof File && landingBgFile.name) {
      landingBgBase64 = await fileToBase64(landingBgFile);
    } else {
      landingBgBase64 = formData.get('landingBgImage') || '';
    }

    let badgeBase64 = '';
    const badgeFile = formData.get('topRightBadge');
    if (badgeFile && badgeFile instanceof File && badgeFile.name) {
      badgeBase64 = await fileToBase64(badgeFile);
    } else {
      badgeBase64 = formData.get('topRightBadge') || '';
    }

    brandingData = {
      companyName: formData.get('companyName'),
      tagline: formData.get('tagline'),
      landingTitle: formData.get('landingTitle'),
      landingDescription: formData.get('landingDescription'),
      logo: logoBase64,
      landingBgImage: landingBgBase64,
      topRightBadge: badgeBase64
    };
  } else {
    brandingData = formData;
  }
  await fbSetBranding(brandingData);
  if (formData instanceof FormData) {
    safeFetch(`${API_BASE}/branding`, { method: 'POST', body: formData }).catch(() => {});
  } else {
    safeFetch(`${API_BASE}/branding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brandingData)
    }).catch(() => {});
  }
  return brandingData;
};

export const getSettings = async () => {
  const settings = await fbGetSettings();
  return settings || { geminiApiKey: '' };
};

export const updateSettings = async (settings) => {
  await fbSetSettings(settings);
  safeFetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  }).catch(() => {});
  return settings;
};

export const getBanners = async () => {
  const ban = await fbGetBanners();
  return ban && ban.length > 0 ? ban : [];
};

export const addBanner = async (formData) => {
  let bannerData = {};
  if (formData instanceof FormData) {
    const id = 'banner_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    let imageBase64 = '';
    const imageFile = formData.get('image');
    if (imageFile && imageFile instanceof File && imageFile.name) {
      imageBase64 = await fileToBase64(imageFile);
    }
    bannerData = {
      id,
      title: formData.get('title') || '',
      linkUrl: formData.get('linkUrl') || '',
      imageUrl: imageBase64
    };
  } else {
    bannerData = formData;
  }
  await fbSetBanner(bannerData.id, bannerData);
  if (formData instanceof FormData) {
    safeFetch(`${API_BASE}/banners`, { method: 'POST', body: formData }).catch(() => {});
  } else {
    safeFetch(`${API_BASE}/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannerData)
    }).catch(() => {});
  }
  return bannerData;
};

export const deleteBanner = async (id) => {
  await fbDeleteBanner(id);
  safeFetch(`${API_BASE}/banners/${id}`, { method: 'DELETE' }).catch(() => {});
  return { message: 'Banner deleted successfully' };
};

export const getMRs = async () => {
  const team = await fbGetMRs();
  return team && team.length > 0 ? team : [];
};

export const addMR = async (mrData) => {
  const id = mrData.id || 'mr_' + Math.random().toString(36).substr(2, 9);
  const cleanMr = { ...mrData, id };
  await fbAddMR(cleanMr);
  safeFetch(`${API_BASE}/mrs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanMr)
  }).catch(() => {});
  return cleanMr;
};

export const deleteMR = async (id) => {
  await fbDeleteMR(id);
  safeFetch(`${API_BASE}/mrs/${id}`, { method: 'DELETE' }).catch(() => {});
  return { message: 'MR deleted successfully' };
};

export const getVisits = async () => {
  const visits = await fbGetDoctorVisits();
  return visits && visits.length > 0 ? visits : [];
};

export const addVisit = async (visitData) => {
  const key = await fbAddDoctorVisit(visitData);
  const cleanVisit = { ...visitData, id: key };
  safeFetch(`${API_BASE}/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanVisit)
  }).catch(() => {});
  return cleanVisit;
};

export const getMROffers = async () => {
  const teamOffers = await fbGetMROffers();
  return teamOffers && teamOffers.length > 0 ? teamOffers : [];
};

export const addMROffer = async (offerData) => {
  const key = await fbAddMROffer(offerData);
  const cleanOffer = { ...offerData, id: key };
  safeFetch(`${API_BASE}/mr-offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanOffer)
  }).catch(() => {});
  return cleanOffer;
};

export const deleteMROffer = async (id) => {
  await fbDeleteMROffer(id);
  safeFetch(`${API_BASE}/mr-offers/${id}`, { method: 'DELETE' }).catch(() => {});
  return { message: 'MR offer deleted successfully' };
};

export const sendAiMessage = (message, history) => safeFetch(`${API_BASE}/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, history })
});

export const getOrders = async () => {
  const ords = await fbGetOrders();
  return ords && ords.length > 0 ? ords : [];
};

export const addOrder = async (orderData) => {
  const key = await fbAddOrder(orderData);
  const cleanOrder = { ...orderData, id: key, firebaseId: key };
  safeFetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanOrder)
  }).catch(() => {});
  return cleanOrder;
};

export const updateOrderStatus = async (id, status) => {
  await fbUpdateOrderStatus(id, status);
  safeFetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).catch(() => {});
  return { success: true };
};

export const deleteOrder = async (id) => {
  await fbDeleteOrder(id);
  safeFetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' }).catch(() => {});
  return { success: true };
};

// --- BULK PRODUCT IMPORT ---
export const bulkImportProducts = async (formData) => {
  // This always goes direct to server (no localStorage fallback for file import)
  const res = await fetch(`${API_BASE}/products/bulk-import`, {
    method: 'POST',
    body: formData  // FormData with key 'file'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown server error' }));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  return res.json();
};

export const bulkInsertProductsAndCategories = async (products, categories) => {
  return safeFetch(`${API_BASE}/products/bulk-insert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products, categories })
  }).catch(() => {});
};

export const getLocalFallbackStatus = () => isUsingLocalFallback;
export const getOfflineDbData = () => getLocalDb();
export const resetOfflineDb = () => {
  localStorage.setItem('riomedica_db', JSON.stringify(FALLBACK_DATA));
  window.location.reload();
};

export const sendGmailOtp = async (email, type = 'login') => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    const res = await safeFetch(`${API_BASE}/otp/send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type })
    });
    // Write code to Firebase for double validation path
    await fbWriteOtp('email', email, res.mockOtp || otp).catch(() => {});
    return res;
  } catch (err) {
    console.warn("[utils] Backend OTP endpoint error. Falling back to client-side direct dispatch...", err.message);
    
    // 1. Write the locally generated code to Firebase active_otps
    await fbWriteOtp('email', email, otp);
    
    // 2. Trigger Google Apps Script Web App directly from the browser
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwSlRmU5LdUmdzqinS4f-f_uaI-MeKr5bHVLWMeufPbyOSL8WQSiXlTFcArQw3VXq5eOQ/exec';
    
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Avoid preflight OPTIONS check
      body: JSON.stringify({
        action: 'sendOtp',
        to: email,
        otp: otp,
        type: type
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send email verification. Please verify network access.`);
    }
    
    return { success: true, message: 'Verification code sent successfully via direct script', email };
  }
};

export const verifyGmailOtp = async (email, otp) => {
  try {
    const res = await safeFetch(`${API_BASE}/otp/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    try {
      await fbDeleteOtp('email', email);
    } catch (e) {}
    return res;
  } catch (err) {
    const verified = await fbVerifyOtp('email', email, otp);
    if (verified) {
      return { success: true, message: 'Email verified successfully via Firebase fallback' };
    }
    throw err;
  }
};

export const getAdminSecurityStatus = () => safeFetch(`${API_BASE}/admin/status`);

export const verifyAdmin2FA = (data) => safeFetch(`${API_BASE}/admin/verify-2fa`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

export const setupAdmin2FA = () => safeFetch(`${API_BASE}/admin/setup-2fa`, {
  method: 'POST'
});

export const enableAdmin2FA = (secret, code) => safeFetch(`${API_BASE}/admin/enable-2fa`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret, code })
});

export const disableAdmin2FA = (data) => safeFetch(`${API_BASE}/admin/disable-2fa`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

export const changeAdminPassword = (newPassword, otp) => safeFetch(`${API_BASE}/admin/change-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ newPassword, otp })
});

// Helper to clean base64 data URLs client-side to prevent QuotaExceededError and keep state small
export const getCleanUrl = (base64Str, prefix, id) => {
  if (!base64Str) return '';
  if (!base64Str.startsWith('data:')) return base64Str;
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return base64Str;
  const ext = matches[1].split('/')[1] || 'png';
  return `/uploads/${prefix}_${id}.${ext}`;
};

export const cleanProductsForClient = (products) => {
  if (!Array.isArray(products)) return products;
  return products.map(p => {
    const clean = { ...p };
    clean.packshot = getCleanUrl(clean.packshot, 'packshot', clean.id);
    if (Array.isArray(clean.visualAids)) {
      clean.visualAids = clean.visualAids.map((aid, idx) => getCleanUrl(aid, 'visualaid', `${clean.id}_${idx}`));
    }
    return clean;
  });
};

export const cleanCategoriesForClient = (categories) => {
  if (!Array.isArray(categories)) return categories;
  return categories.map(cat => ({
    ...cat,
    icon: getCleanUrl(cat.icon, 'category', cat.id)
  }));
};

export const cleanBrandingForClient = (branding) => {
  if (!branding) return branding;
  return {
    ...branding,
    logo: getCleanUrl(branding.logo, 'branding', 'logo'),
    landingBgImage: getCleanUrl(branding.landingBgImage, 'branding', 'landingBgImage'),
    topRightBadge: getCleanUrl(branding.topRightBadge, 'branding', 'topRightBadge')
  };
};

export const cleanBannersForClient = (banners) => {
  if (!Array.isArray(banners)) return banners;
  return banners.map(b => ({
    ...b,
    imageUrl: getCleanUrl(b.imageUrl, 'banner', b.id)
  }));
};

export const cleanOffersForClient = (offers) => {
  if (!Array.isArray(offers)) return offers;
  return offers.map(o => ({
    ...o,
    imageUrl: getCleanUrl(o.imageUrl, 'offer', o.id)
  }));
};

export const cleanRegistrationsForClient = (registrations) => {
  if (!Array.isArray(registrations)) return registrations;
  return registrations.map(r => ({
    ...r,
    drugLicenceUrl: getCleanUrl(r.drugLicenceUrl, 'reg_licence', r.id),
    gstUrl: getCleanUrl(r.gstUrl, 'reg_gst', r.id),
    panUrl: getCleanUrl(r.panUrl, 'reg_pan', r.id)
  }));
};

export const analyzeMedicine = (name = '', composition = '') => {
  const comp = (composition || '').toLowerCase();
  const nm = (name || '').toLowerCase();

  // Initialize variables
  let categoryId = 'tablets'; // Default category
  let indications = '';
  let dosage = '';
  let lbl = '';

  // 1. Check for Ophthalmic & Ear Drops
  if (comp.includes('eye drop') || comp.includes('ear drop') || comp.includes('ophthalmic') || comp.includes('eye/ear drop') || comp.includes('carboxymethylcellulose') || nm.includes('eye drop') || nm.includes('ear drop') || (comp.includes('drops') && (comp.includes('moxifloxacin') || comp.includes('ciprofloxacin') || comp.includes('ofloxacin') || comp.includes('tobramycin') || comp.includes('timolol') || comp.includes('carboxymethyl') || comp.includes('lubricant') || comp.includes('naphazoline')))) {
    categoryId = 'ophthalmic';
    indications = "Bacterial conjunctivitis, eye irritation, dry eye syndrome, otitis externa, and general ear/eye infections.";
    dosage = "Instill 1-2 drops in the affected eye/ear 3-4 times daily or as advised by the ophthalmologist/ENT specialist.";
    lbl = "Sterile topical drops providing immediate antimicrobial action or lubrication to soothe ocular tissues, reduce redness, and clear localized infections.";
  }
  // 2. Check for Dental Care & Oral Hygiene
  else if (comp.includes('chlorhexidine') || comp.includes('potassium nitrate') || comp.includes('toothpaste') || comp.includes('mouthwash') || comp.includes('gum paint') || comp.includes('dental') || nm.includes('dent') || nm.includes('shine') || nm.includes('gum') || comp.includes('monofluorophosphate') || comp.includes('triclosan') || comp.includes('tannic acid')) {
    categoryId = 'dental';
    indications = "Dental plaque, gingivitis, tooth sensitivity, mouth ulcers, and oral hygiene maintenance.";
    dosage = "Rinse mouth with 10ml solution twice daily for 30 seconds, or apply gel to affected gums as directed.";
    lbl = "Medicated oral care formulation containing active antiseptics or desensitizing agents to protect enamel, eliminate harmful microbes, and soothe inflamed oral tissues.";
  }
  // 3. Check for Injections & Critical Care
  else if (comp.includes('injection') || comp.includes('inj.') || comp.includes('vial') || comp.includes('ampoule') || nm.includes(' inj') || nm.includes('-inj') || comp.includes('ceftriaxone injection') || comp.includes('pantoprazole injection') || comp.includes('methylprednisolone injection') || comp.includes('amikacin injection')) {
    categoryId = 'injections';
    indications = "Severe systemic infections, acute severe pain, emergency acid suppression, and critical care management.";
    dosage = "To be administered intravenously (IV) or intramuscularly (IM) as directed by a physician or healthcare professional.";
    lbl = "Sterile parenteral formulation designed for rapid systemic availability and immediate therapeutic effect in critical or acute care settings.";
  }
  // 4. Check for Infusions & IV Fluids
  else if (comp.includes('infusion') || comp.includes('dextrose') || comp.includes('normal saline') || comp.includes('sodium chloride i.v.') || comp.includes('mannitol') || comp.includes('dns') || comp.includes('iv fluid')) {
    categoryId = 'infusions';
    indications = "Dehydration, electrolyte imbalance, fluid resuscitation, and vehicle for intravenous drug administration.";
    dosage = "To be administered via intravenous infusion under strict medical supervision. Flow rate as prescribed.";
    lbl = "Isotonic or hypertonic sterile infusion fluid carefully calibrated to restore intravascular volume, replenish essential electrolytes, and maintain acid-base balance.";
  }
  // 5. Check for Pediatric Drops / Care
  else if (comp.includes('pediatric') || comp.includes('oral drops') || comp.includes('infant drops') || comp.includes('baby drops') || (comp.includes('drops') && (comp.includes('paracetamol') || comp.includes('multivitamin') || comp.includes('zinc') || comp.includes('lactobacillus') || comp.includes('enzyme') || comp.includes('colic')))) {
    categoryId = 'pediatric';
    indications = "Infantile colic, fever, pain, cold, cough, and nutritional supplementation in infants and children.";
    dosage = "Administer the specified volume (in ml or drops) using the calibrated dropper/measuring cup, strictly as directed by the pediatrician.";
    lbl = "Calibrated pediatric formulation designed for optimal dosing accuracy, pleasant taste, and gentle gastrointestinal tolerance in infants and children.";
  }
  // 6. Check for Dermatological & Topical Creams
  else if (comp.includes('ketoconazole') || comp.includes('clotrimazole') || comp.includes('miconazole') || comp.includes('luliconazole') || comp.includes('terbinafine') || comp.includes('permethrin') || comp.includes('clobetasol') || comp.includes('beclomethasone') || comp.includes('fusidic') || comp.includes('mupirocin') || comp.includes('adapalene') || comp.includes('benzoyl peroxide') || comp.includes('coal tar') || comp.includes('sertaconazole') || comp.includes('ebastine') || comp.includes('calamine') || comp.includes('cream') || comp.includes('ointment') || comp.includes('dusting powder') || comp.includes('lotion') || comp.includes('shampoo') || comp.includes('soap') || nm.includes('soap') || nm.includes('cream') || (nm.includes('gel') && !nm.includes('dent') && !comp.includes('diclofenac') && !comp.includes('aceclofenac'))) {
    categoryId = 'derma';
    indications = "Fungal skin infections (ringworm, athlete's foot), bacterial dermatitis, eczema, psoriasis, acne vulgaris, and dry skin conditions.";
    dosage = "Apply a thin layer to the affected area 2-3 times daily, or wash/dust as directed by the dermatologist.";
    lbl = "Topical therapeutic agent providing targeted anti-fungal, anti-inflammatory, or antibacterial action, restoring the skin's protective barrier and relieving itching.";
  }
  // 7. Check for Cardio & Anti-diabetic
  else if (comp.includes('amlodipine') || comp.includes('atenolol') || comp.includes('telmisartan') || comp.includes('losartan') || comp.includes('metoprolol') || comp.includes('ramipril') || comp.includes('atorvastatin') || comp.includes('rosuvastatin') || comp.includes('clopidogrel') || comp.includes('glimepiride') || comp.includes('metformin') || comp.includes('vildagliptin') || comp.includes('teneligliptin') || comp.includes('dapagliflozin') || comp.includes('empagliflozin') || comp.includes('gliclazide') || comp.includes('pioglitazone') || comp.includes('cardio') || comp.includes('diabetic') || nm.includes('diab') || nm.includes('card') || nm.includes('bp') || nm.includes('vas') || nm.includes('stat') || nm.includes('tensa')) {
    categoryId = 'cardio-diabetic';
    indications = "Hypertension (high blood pressure), angina pectoris (chest pain), chronic heart failure, and blood glucose control in Type 2 Diabetes Mellitus.";
    dosage = "1 tablet daily in the morning or evening at the same time, or as directed by the cardiologist/endocrinologist.";
    lbl = "Advanced cardiovascular/anti-diabetic therapeutic agent designed to optimize metabolic control and reduce cardiovascular complications.";
  }
  // 8. Check for Neurology & Psychotropics
  else if (comp.includes('citicoline') || comp.includes('piracetam') || comp.includes('donepezil') || comp.includes('memantine') || comp.includes('pregabalin') || comp.includes('gabapentin') || comp.includes('amitriptyline') || comp.includes('nortriptyline') || comp.includes('duloxetine') || comp.includes('fluoxetine') || comp.includes('sertraline') || comp.includes('escitalopram') || comp.includes('clonazepam') || comp.includes('alprazolam') || comp.includes('diazepam') || comp.includes('lorazepam') || comp.includes('olanzapine') || comp.includes('quetiapine') || comp.includes('risperidone') || nm.includes('neuro') || nm.includes('brain') || (nm.includes('cobal') && (comp.includes('pregabalin') || comp.includes('gabapentin')))) {
    categoryId = 'neurology';
    indications = "Neuropathic pain, fibromyalgia, generalized anxiety disorder, cognitive impairment, stroke rehabilitation, and nerve health support.";
    dosage = "1 tablet/capsule once or twice daily, preferably at bedtime, or as prescribed by the neurologist.";
    lbl = "Neuroprotective or neuromodulating agent that stabilizes hyperexcited neurons, supports myelin sheath repair, and enhances neurotransmitter levels for optimal cognitive function.";
  }
  // 9. Check for Antibiotics & Anti-infectives
  else if (comp.includes('cefpodoxime') || comp.includes('cefixime') || comp.includes('azithromycin') || comp.includes('clarithromycin') || comp.includes('amoxicillin') || comp.includes('moxifloxacin') || comp.includes('ofloxacin') || comp.includes('cefuroxime') || comp.includes('clavulanic') || comp.includes('clavulanate') || comp.includes('sulbactam') || comp.includes('ornidazole') || comp.includes('secnidazole') || comp.includes('linezolid') || comp.includes('linzolid') || comp.includes('clindamycin') || comp.includes('ciprofloxacin') || comp.includes('levofloxacin') || comp.includes('antibiotic') || comp.includes('meropenem') || comp.includes('piperacillin') || comp.includes('tazobactam') || comp.includes('ceftriaxone') || comp.includes('cefoperazone') || comp.includes('amikacin') || comp.includes('gentamicin') || comp.includes('colistin') || comp.includes('metronidazole') || comp.includes('doxycycline') || comp.includes('minocycline') || comp.includes('rifaximin') || comp.includes('norfloxacin') || nm.includes('pod') || nm.includes('cefi') || nm.includes('moxi') || nm.includes('flox') || nm.includes('clav') || nm.includes('amox') || nm.includes('cef')) {
    categoryId = 'antibiotics';
    indications = "Bacterial infections of the respiratory tract (bronchitis, pneumonia), ENT (otitis media, tonsillitis), urinary tract (UTI), and skin structures.";
    dosage = "1 tablet once or twice daily after meals, completing the full course as prescribed by the physician.";
    lbl = "Broad-spectrum antibacterial agent that inhibits bacterial cell wall synthesis or blocks vital protein production, effectively eliminating the pathogen and preventing drug resistance.";
  }
  // 10. Check for Cough, Cold & Anti-allergic
  else if (comp.includes('montelukast') || comp.includes('levocetirizine') || comp.includes('cetirizine') || comp.includes('fexofenadine') || comp.includes('ambroxol') || comp.includes('guaiphenesin') || comp.includes('phenylephrine') || comp.includes('dextromethorphan') || comp.includes('terbutaline') || comp.includes('bromhexine') || comp.includes('chlorpheniramine') || comp.includes('salbutamol') || comp.includes('levosalbutamol') || comp.includes('ipratropium') || comp.includes('budesonide') || comp.includes('fluticasone') || comp.includes('cough') || comp.includes('cold') || comp.includes('allergy') || comp.includes('asthma') || nm.includes('cough') || nm.includes('cold') || nm.includes('kof') || nm.includes('cof') || nm.includes('hist') || nm.includes('allerg')) {
    categoryId = 'cough-cold';
    indications = "Productive or dry cough, allergic rhinitis, sneezing, running nose, congestion, and asthma prophylaxis.";
    dosage = "1 tablet daily at bedtime, or 5-10ml syrup twice daily as prescribed by the physician.";
    lbl = "Synergistic antihistamine, mucolytic, and bronchodilator formulation that relaxes airway smooth muscles, thins bronchial secretions, and blocks allergic receptors for rapid relief.";
  }
  // 11. Check for Analgesics & Pain Management
  else if (comp.includes('aceclofenac') || comp.includes('paracetamol') || comp.includes('diclofenac') || comp.includes('nimesulide') || comp.includes('ibuprofen') || comp.includes('trypsin') || comp.includes('chymotrypsin') || comp.includes('serratiopeptidase') || comp.includes('diacerein') || comp.includes('glucosamine') || comp.includes('etoricoxib') || comp.includes('tramadol') || comp.includes('mefenamic') || comp.includes('ketorolac') || comp.includes('lornoxicam') || comp.includes('thiocolchicoside') || comp.includes('pain') || comp.includes('analgesic') || nm.includes('spas') || nm.includes('para') || nm.includes('fenac') || nm.includes('pain') || nm.includes('nimo') || nm.includes('flam') || nm.includes('ortho')) {
    categoryId = 'pain-management';
    indications = "Mild to moderate pain, fever, post-operative inflammation, muscle spasms, osteoarthritis, and rheumatoid arthritis.";
    dosage = "1 tablet twice daily after meals or as directed by a physician for symptomatic pain relief.";
    lbl = "Effective NSAID and proteolytic enzyme combination that inhibits COX enzymes (reducing pain-inducing prostaglandins) and resolves tissue edema to accelerate healing and restore mobility.";
  }
  // 12. Check for Gastrointestinal & Antacids
  else if (comp.includes('pantoprazole') || comp.includes('rabeprazole') || comp.includes('omeprazole') || comp.includes('esomeprazole') || comp.includes('ranitidine') || comp.includes('domperidone') || comp.includes('sucralfate') || comp.includes('itopride') || comp.includes('levosulpiride') || comp.includes('digestive') || comp.includes('antacid') || comp.includes('magaldrate') || comp.includes('megaldrate') || comp.includes('simethicone') || comp.includes('sodium alginate') || comp.includes('charcoal') || comp.includes('gastro') || (comp.includes('acid') && !comp.includes('folic') && !comp.includes('amino') && !comp.includes('salicylic') && !comp.includes('ascorbic') && !comp.includes('clavulanic') && !comp.includes('ursodeoxycholic') && !comp.includes('tannic') && !comp.includes('alpha lipoic') && !comp.includes('hyaluronic')) || nm.includes('panto') || nm.includes('rab') || nm.includes('ome') || nm.includes('eso') || nm.includes('acid') || nm.includes('zyme') || nm.includes('cid') || nm.includes('gast')) {
    categoryId = 'gastro';
    indications = "Acidity, GERD (Gastroesophageal Reflux Disease), peptic ulcers, heartburn, bloating, and dyspepsia.";
    dosage = "1 tablet/capsule daily in the morning before breakfast (on empty stomach) or as directed by a physician.";
    lbl = "Proton pump inhibitor (PPI) or gastroprokinetic formulation that reduces stomach acid secretion and enhances gut motility for fast, long-lasting relief from acid reflux and digestive discomfort.";
  }
  // 13. Check for Multivitamins & Antioxidants
  else if (comp.includes('calcium') || comp.includes('vitamin') || comp.includes('methylcobalamin') || comp.includes('zinc') || comp.includes('folate') || comp.includes('folic') || comp.includes('iron') || comp.includes('multivitamins') || comp.includes('antioxidant') || comp.includes('biotin') || comp.includes('lycopene') || comp.includes('coenzyme') || comp.includes('amino acid') || comp.includes('protein') || comp.includes('ginseng') || comp.includes('cranberry') || comp.includes('d-mannose') || comp.includes('nutrition') || comp.includes('supplement') || comp.includes('ferrous') || comp.includes('cholecalciferol') || comp.includes('calcitriol') || comp.includes('macobalamin') || comp.includes('omega') || nm.includes('vit') || nm.includes('cal') || nm.includes('iron') || nm.includes('gold') || nm.includes('plus') || nm.includes('multi') || nm.includes('nutri') || nm.includes('neuro') || nm.includes('active') || nm.includes('keto')) {
    categoryId = 'multivitamins';
    indications = "Nutritional deficiencies, calcium and bone mineralization support, neuropathies, fatigue, and general convalescence.";
    dosage = "1 tablet/capsule daily after meals, preferably at bedtime, or as directed by a physician.";
    lbl = "Comprehensive nutritional supplement that enhances bone density, supports hemoglobin synthesis, promotes myelin sheath regeneration, and neutralizes free radicals for cellular vitality.";
  }
  // 14. Tablets & Oral Solids (Default)
  else {
    categoryId = 'tablets';
    indications = "Symptomatic relief and therapeutic management of indications associated with the active ingredients.";
    dosage = "As directed by the physician or specialist.";
    lbl = "High-efficacy pharmaceutical formulation manufactured under strict quality standards to ensure target bioavailability and patient compliance.";
  }

  return {
    categoryId,
    indications,
    dosage,
    lbl
  };
};



