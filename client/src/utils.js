// client/src/utils.js
import { fbWriteOtp, fbDeleteOtp, fbVerifyOtp } from './firebaseDb';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.endsWith('/api') 
      ? import.meta.env.VITE_API_URL 
      : `${import.meta.env.VITE_API_URL}/api`;
  }
  if (typeof window === 'undefined') return 'http://localhost:5000/api';
  const origin = window.location.origin;
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
      localStorage.setItem('riomedica_db', JSON.stringify(oldDb));
    }
  }
};
initLocalStorage();

const getLocalDb = () => JSON.parse(localStorage.getItem('riomedica_db'));
const saveLocalDb = (data) => localStorage.setItem('riomedica_db', JSON.stringify(data));

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
export const getCategories = () => safeFetch(`${API_BASE}/categories`);
export const addCategory = (category) => safeFetch(`${API_BASE}/categories`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(category)
});
export const deleteCategory = (id) => safeFetch(`${API_BASE}/categories/${id}`, {
  method: 'DELETE'
});

export const getProducts = () => safeFetch(`${API_BASE}/products`);
export const addProduct = (formData) => safeFetch(`${API_BASE}/products`, {
  method: 'POST',
  body: formData
});
export const updateProduct = (id, formData) => safeFetch(`${API_BASE}/products/${id}`, {
  method: 'PUT',
  body: formData
});
export const bulkUpdateProducts = (products) => safeFetch(`${API_BASE}/products/bulk-update`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ products })
});
export const deleteProduct = (id) => safeFetch(`${API_BASE}/products/${id}`, {
  method: 'DELETE'
});
export const resetProducts = () => safeFetch(`${API_BASE}/products/reset`, {
  method: 'POST'
});

export const getCollections = () => safeFetch(`${API_BASE}/collections`);
export const createCollection = (collection) => safeFetch(`${API_BASE}/collections`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(collection)
});
export const updateCollection = (id, collection) => safeFetch(`${API_BASE}/collections/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(collection)
});
export const deleteCollection = (id) => safeFetch(`${API_BASE}/collections/${id}`, {
  method: 'DELETE'
});

export const getOffers = () => safeFetch(`${API_BASE}/offers`);
export const addOffer = (formData) => safeFetch(`${API_BASE}/offers`, {
  method: 'POST',
  body: formData
});
export const deleteOffer = (id) => safeFetch(`${API_BASE}/offers/${id}`, {
  method: 'DELETE'
});

export const registerUser = (formData) => safeFetch(`${API_BASE}/register`, {
  method: 'POST',
  body: formData
});
export const getRegistrations = () => safeFetch(`${API_BASE}/registrations`);
export const approveRegistration = (id, credentials) => safeFetch(`${API_BASE}/registrations/${id}/approve`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials)
});
export const denyRegistration = (id) => safeFetch(`${API_BASE}/registrations/${id}/deny`, {
  method: 'POST'
});
export const terminateFranchisePartner = (id) => safeFetch(`${API_BASE}/registrations/${id}`, {
  method: 'DELETE'
});
export const changeUserPassword = (userId, oldPassword, newPassword) => safeFetch(`${API_BASE}/user/change-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, oldPassword, newPassword })
});
export const adminResetPassword = (userId, newPassword) => safeFetch(`${API_BASE}/admin/reset-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, newPassword })
});
export const resetMRPassword = (mrId, newPassword) => safeFetch(`${API_BASE}/mrs/reset-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mrId, newPassword })
});
export const loginUser = (credentials) => safeFetch(`${API_BASE}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials)
});

export const sendMobileOtp = async (mobile) => {
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

export const getBranding = () => safeFetch(`${API_BASE}/branding`);
export const updateBranding = (formData) => safeFetch(`${API_BASE}/branding`, {
  method: 'POST',
  body: formData
});

export const getSettings = () => safeFetch(`${API_BASE}/settings`);
export const updateSettings = (settings) => safeFetch(`${API_BASE}/settings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(settings)
});

export const getBanners = () => safeFetch(`${API_BASE}/banners`);
export const addBanner = (formData) => safeFetch(`${API_BASE}/banners`, {
  method: 'POST',
  body: formData
});
export const deleteBanner = (id) => safeFetch(`${API_BASE}/banners/${id}`, {
  method: 'DELETE'
});

export const getMRs = () => safeFetch(`${API_BASE}/mrs`);
export const addMR = (mrData) => safeFetch(`${API_BASE}/mrs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(mrData)
});
export const deleteMR = (id) => safeFetch(`${API_BASE}/mrs/${id}`, {
  method: 'DELETE'
});

export const getVisits = () => safeFetch(`${API_BASE}/visits`);
export const addVisit = (visitData) => safeFetch(`${API_BASE}/visits`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(visitData)
});

export const getMROffers = () => safeFetch(`${API_BASE}/mr-offers`);
export const addMROffer = (offerData) => safeFetch(`${API_BASE}/mr-offers`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(offerData)
});
export const deleteMROffer = (id) => safeFetch(`${API_BASE}/mr-offers/${id}`, {
  method: 'DELETE'
});

export const sendAiMessage = (message, history) => safeFetch(`${API_BASE}/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, history })
});

export const getOrders = () => safeFetch(`${API_BASE}/orders`);
export const addOrder = (orderData) => safeFetch(`${API_BASE}/orders`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
export const updateOrderStatus = (id, status) => safeFetch(`${API_BASE}/orders/${id}/status`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const deleteOrder = (id) => safeFetch(`${API_BASE}/orders/${id}`, {
  method: 'DELETE'
});

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

export const getLocalFallbackStatus = () => isUsingLocalFallback;
export const getOfflineDbData = () => getLocalDb();
export const resetOfflineDb = () => {
  localStorage.setItem('riomedica_db', JSON.stringify(FALLBACK_DATA));
  window.location.reload();
};

export const sendGmailOtp = async (email, type) => {
  const res = await safeFetch(`${API_BASE}/otp/send-email-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, type })
  });
  if (res && res.mockOtp) {
    fbWriteOtp('email', email, res.mockOtp).catch((fbErr) => {
      console.warn('[FB] failed to write Gmail OTP to Firebase:', fbErr.message);
    });
  }
  return res;
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

