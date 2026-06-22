// Firebase Database Service - Riomedica Healthcare
// Full read/write/realtime service for Admin → Firebase → Rep App sync

import { db } from './firebase';
import {
  ref, set, get, push, remove, update, onValue, off, serverTimestamp
} from 'firebase/database';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const withTimeout = (promise, timeoutMs = 3000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firebase operation timed out')), timeoutMs)
    )
  ]);
};

export const safeGet = async (path) => {
  try {
    const snap = await withTimeout(get(ref(db, path)));
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    console.error(`[FB] read error @ ${path}:`, err.message);
    return null;
  }
};

export const safeSet = async (path, data) => {
  try {
    await withTimeout(set(ref(db, path), data));
    return true;
  } catch (err) {
    console.error(`[FB] write error @ ${path}:`, err.message);
    return false;
  }
};

export const safeUpdate = async (updates) => {
  try {
    await withTimeout(update(ref(db), updates));
    return true;
  } catch (err) {
    console.error(`[FB] update error:`, err.message);
    return false;
  }
};

// Convert Firebase object-map to array (firebase stores arrays as objects with keys)
export const toArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return Object.entries(obj).map(([key, val]) => ({ ...val, _fbKey: key }));
};

// ─── REAL-TIME LISTENERS (for Rep App) ───────────────────────────────────────

/**
 * Subscribe to a Firebase path with a callback.
 * Returns an unsubscribe function — call it on component unmount.
 */
export const subscribeToPath = (path, callback) => {
  const r = ref(db, path);
  const handler = (snap) => {
    callback(snap.exists() ? snap.val() : null);
  };
  onValue(r, handler);
  return () => off(r, 'value', handler);
};

export const subscribeToProducts   = (cb) => subscribeToPath('products',   (v) => cb(toArray(v)));
export const subscribeToCategories = (cb) => subscribeToPath('categories', (v) => cb(toArray(v)));
export const subscribeToOffers     = (cb) => subscribeToPath('offers',     (v) => cb(toArray(v)));
export const subscribeToBanners    = (cb) => subscribeToPath('banners',    (v) => cb(toArray(v)));
export const subscribeToBranding   = (cb) => subscribeToPath('branding',   cb);
export const subscribeToOrders     = (cb) => subscribeToPath('orders',     (v) => cb(toArray(v)));
export const subscribeToUsers      = (cb) => subscribeToPath('users',      (v) => cb(toArray(v)));
export const subscribeToMRs        = (cb) => subscribeToPath('mrs',        (v) => cb(toArray(v)));
export const subscribeToRegistrations = (cb) => subscribeToPath('registrations', (v) => cb(toArray(v)));
export const subscribeToCollections   = (cb) => subscribeToPath('collections',   (v) => cb(toArray(v)));
export const subscribeToDoctorVisits  = (cb) => subscribeToPath('doctor_visits',  (v) => cb(toArray(v)));
export const subscribeToMROffers      = (cb) => subscribeToPath('mr_offers',      (v) => cb(toArray(v)));
export const subscribeToConnection = (cb) => {
  const r = ref(db, '.info/connected');
  const handler = (snap) => {
    cb(snap.exists() ? snap.val() === true : false);
  };
  onValue(r, handler);
  return () => off(r, 'value', handler);
};


// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export const fbGetProducts    = () => safeGet('products').then(toArray);
export const fbSetProducts    = (products) => safeSet('products', products);
export const fbSetProduct     = (id, product) => safeSet(`products/${id}`, product);
export const fbUpdateProducts = async (products) => {
  const updates = {};
  for (const p of products) {
    updates[`products/${p.id}`] = p;
  }
  return safeUpdate(updates);
};
export const fbDeleteProduct  = (id) => remove(ref(db, `products/${id}`));

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export const fbGetCategories   = () => safeGet('categories').then(toArray);
export const fbSetCategories   = (cats) => safeSet('categories', cats);
export const fbSetCategory     = (id, cat) => safeSet(`categories/${id}`, cat);
export const fbDeleteCategory  = (id) => remove(ref(db, `categories/${id}`));

// ─── OFFERS ──────────────────────────────────────────────────────────────────

export const fbGetOffers   = () => safeGet('offers').then(toArray);
export const fbSetOffers   = (offers) => safeSet('offers', offers);
export const fbAddOffer    = (offer) => push(ref(db, 'offers'), offer);
export const fbSetOffer    = (id, offer) => safeSet(`offers/${id}`, offer);
export const fbDeleteOffer = (id) => remove(ref(db, `offers/${id}`));

// ─── BANNERS ─────────────────────────────────────────────────────────────────

export const fbGetBanners   = () => safeGet('banners').then(toArray);
export const fbSetBanners   = (banners) => safeSet('banners', banners);
export const fbAddBanner    = (banner) => push(ref(db, 'banners'), banner);
export const fbSetBanner    = (id, banner) => safeSet(`banners/${id}`, banner);
export const fbDeleteBanner = (id) => remove(ref(db, `banners/${id}`));

// ─── BRANDING ────────────────────────────────────────────────────────────────


export const fbGetBranding = () => safeGet('branding');
export const fbSetBranding = (branding) => safeSet('branding', branding);

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export const fbGetOrders = () => safeGet('orders').then(toArray);

/**
 * Submit a new order to Firebase.
 * Returns the new Firebase key for the order.
 */
export const fbAddOrder = async (order) => {
  const newRef = push(ref(db, 'orders'));
  await set(newRef, {
    ...order,
    firebaseId: newRef.key,
    createdAt: new Date().toISOString(),
    _ts: serverTimestamp()
  });
  return newRef.key;
};

export const fbUpdateOrderStatus = (id, status) =>
  update(ref(db, `orders/${id}`), { status, updatedAt: new Date().toISOString() });

export const fbDeleteOrder = (id) => remove(ref(db, `orders/${id}`));

// ─── USERS (for login auth from Firebase) ────────────────────────────────────

export const fbGetUsers    = () => safeGet('users').then(toArray);
export const fbSetUsers    = (users) => safeSet('users', users);
export const fbAddUser     = (user) => push(ref(db, 'users'), user);
export const fbUpdateUser  = (id, data) => update(ref(db, `users/${id}`), data);
export const fbDeleteUser  = (id) => remove(ref(db, `users/${id}`));

// Login: find user by username + password in Firebase
export const fbLoginUser = async (username, password) => {
  const users = await fbGetUsers();
  const found = users.find(
    u => (u.username === username || u.mobile === username || u.email === username)
      && u.password === password
      && u.status === 'approved'
  );
  return found || null;
};

// ─── MRS ─────────────────────────────────────────────────────────────────────

export const fbGetMRs   = () => safeGet('mrs').then(toArray);
export const fbSetMRs   = (mrs) => safeSet('mrs', mrs);
export const fbAddMR    = (mr) => push(ref(db, 'mrs'), mr);
export const fbDeleteMR = (id) => remove(ref(db, `mrs/${id}`));

// ─── REGISTRATIONS ───────────────────────────────────────────────────────────

export const fbGetRegistrations = () => safeGet('registrations').then(toArray);
export const fbSetRegistration  = (id, reg) => safeSet(`registrations/${id}`, reg);
export const fbAddRegistration  = (reg) => push(ref(db, 'registrations'), reg);

// ─── BULK SYNC — push everything from local server to Firebase ────────────────

export const syncAllToFirebase = async (data) => {
  const ops = [];
  if (data.products)    ops.push(safeSet('products',    data.products));
  if (data.categories)  ops.push(safeSet('categories',  data.categories));
  if (data.offers)      ops.push(safeSet('offers',      data.offers));
  if (data.banners)     ops.push(safeSet('banners',     data.banners));
  if (data.branding)    ops.push(safeSet('branding',    data.branding));
  if (data.mrs)         ops.push(safeSet('mrs',         data.mrs));
  if (data.users)         ops.push(safeSet('users',       data.users));
  if (data.registrations) ops.push(safeSet('registrations', data.registrations));
  if (data.orders)      ops.push(safeSet('orders',      data.orders));
  if (data.collections) ops.push(safeSet('collections', data.collections));

  const results = await Promise.allSettled(ops);
  const ok = results.filter(r => r.status === 'fulfilled').length;
  console.log(`[FB] Sync: ${ok}/${results.length} collections written`);
  return ok;
};

export const pullFullBackupFromFirebase = () => safeGet('backup');

// ─── COLLECTIONS ─────────────────────────────────────────────────────────────
export const fbGetCollections = () => safeGet('collections').then(toArray);
export const fbSetCollection  = (id, coll) => safeSet(`collections/${id}`, coll);
export const fbDeleteCollection = (id) => remove(ref(db, `collections/${id}`));

// ─── DOCTOR VISITS ───────────────────────────────────────────────────────────
export const fbGetDoctorVisits = () => safeGet('doctor_visits').then(toArray);
export const fbAddDoctorVisit = async (visit) => {
  const newRef = push(ref(db, 'doctor_visits'));
  await set(newRef, { ...visit, id: newRef.key });
  return newRef.key;
};

// ─── MR OFFERS ───────────────────────────────────────────────────────────────
export const fbGetMROffers = () => safeGet('mr_offers').then(toArray);
export const fbAddMROffer = async (offer) => {
  const newRef = push(ref(db, 'mr_offers'));
  await set(newRef, { ...offer, id: newRef.key });
  return newRef.key;
};
export const fbDeleteMROffer = (id) => remove(ref(db, `mr_offers/${id}`));

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export const fbGetSettings = () => safeGet('settings');
export const fbSetSettings = (settings) => safeSet('settings', settings);
export const fbGetAdmin = () => safeGet('admin');

// ─── FIREBASE OTP STORAGE & VERIFICATION ─────────────────────────────────────

// Sanitize keys for Firebase compatibility (replace . # $ [ ] with _)
export const sanitizeFirebaseKey = (str) => {
  if (!str) return 'unknown';
  return str.toLowerCase().replace(/[.#$[\]]/g, '_');
};
// Write active OTP code to Firebase Realtime Database
export const fbWriteOtp = async (type, key, otp, expiresAt = Date.now() + 5 * 60 * 1000) => {
  const cleanKey = sanitizeFirebaseKey(key);
  return safeSet(`active_otps/${type}/${cleanKey}`, {
    otp,
    expiresAt,
    createdAt: new Date().toISOString(),
    originalKey: key,
    isSent: false
  });
};
// Delete OTP code from Firebase
export const fbDeleteOtp = async (type, key) => {
  const cleanKey = sanitizeFirebaseKey(key);
  try {
    await withTimeout(remove(ref(db, `active_otps/${type}/${cleanKey}`)));
    return true;
  } catch (err) {
    console.error(`[FB] delete OTP error @ active_otps/${type}/${cleanKey}:`, err.message);
    return false;
  }
};

// Verify OTP code in Firebase, delete if valid
export const fbVerifyOtp = async (type, key, otp) => {
  const cleanKey = sanitizeFirebaseKey(key);
  const data = await safeGet(`active_otps/${type}/${cleanKey}`);
  if (!data) return false;
  if (Date.now() > data.expiresAt) {
    await fbDeleteOtp(type, key);
    return false;
  }
  if (data.otp === otp) {
    await fbDeleteOtp(type, key);
    return true;
  }
  return false;
};

export default db;
