// client/src/components/AdminLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  getProducts, getCategories, getCollections, addProduct, 
  updateProduct, deleteProduct, resetProducts, addCategory, deleteCategory, 
  getOffers, addOffer, deleteOffer, getRegistrations, approveRegistration,
  denyRegistration, IMAGE_BASE, getLocalFallbackStatus, getBranding, updateBranding,
  getBanners, addBanner, deleteBanner, bulkImportProducts, getSettings, updateSettings,
  getOrders, updateOrderStatus, deleteOrder,
  loginUser, sendGmailOtp,
  verifyAdmin2FA, setupAdmin2FA, enableAdmin2FA, disableAdmin2FA, changeAdminPassword, getAdminSecurityStatus
} from '../utils';
import { 
  syncAllToFirebase, 
  subscribeToProducts, 
  subscribeToCategories, 
  subscribeToOffers, 
  subscribeToBanners, 
  subscribeToBranding, 
  subscribeToOrders, 
  subscribeToRegistrations,
  subscribeToConnection
} from '../firebaseDb';

export default function AdminLayout() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
  });

  // --- Admin Login States ---
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' | 'password'
  const [adminOtp, setAdminOtp] = useState('');
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [adminOtpLoading, setAdminOtpLoading] = useState(false);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [useBackupOtp, setUseBackupOtp] = useState(false);
  const [backupOtpSent, setBackupOtpSent] = useState(false);
  const [backupOtpCode, setBackupOtpCode] = useState('');

  // --- Admin Security Panel States ---
  const [securityStatus, setSecurityStatus] = useState({ twoFactorEnabled: false });
  const [setup2FAData, setSetup2FAData] = useState(null);
  const [setup2FACode, setSetup2FACode] = useState('');
  const [setup2FALoading, setSetup2FALoading] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState('');
  const [disable2FALoading, setDisable2FALoading] = useState(false);
  const [useDisableBackupOtp, setUseDisableBackupOtp] = useState(false);
  const [disableBackupOtpSent, setDisableBackupOtpSent] = useState(false);
  const [disableBackupOtp, setDisableBackupOtp] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [changePwdOtp, setChangePwdOtp] = useState('');
  const [changePwdOtpSent, setChangePwdOtpSent] = useState(false);
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [securityMsg, setSecurityMsg] = useState({ type: '', text: '' });

  const ADMIN_EMAIL = 'Riomedicahealthcare@gmail.com';

  const handleSendAdminOtp = async () => {
    setAdminOtpLoading(true);
    setAdminLoginError('');
    try {
      await sendGmailOtp(ADMIN_EMAIL);
      setAdminOtpSent(true);
    } catch (err) {
      setAdminLoginError('Failed to send OTP. Please try again.');
    } finally {
      setAdminOtpLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError('');
    try {
      const body = loginMethod === 'otp'
        ? { username: 'admin', otp: adminOtp }
        : { username: 'admin', password: adminPassword };
      const data = await loginUser(body);
      if (data.require2FA) {
        setRequire2FA(true);
        setAdminLoginLoading(false);
        return;
      }
      if (data.token) {
        sessionStorage.setItem('adminSessionToken', data.token);
      }
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('adminLoggedIn', 'true');
      setAdminLoginError('');
    } catch (err) {
      setAdminLoginError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    setAdminLoginLoading(true);
    setAdminLoginError('');
    try {
      const data = await verifyAdmin2FA({ username: 'admin', totpCode });
      if (data.token) sessionStorage.setItem('adminSessionToken', data.token);
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('adminLoggedIn', 'true');
      setRequire2FA(false);
    } catch (err) {
      setAdminLoginError(err.message || 'Invalid 2FA code.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleSendBackupOtp = async () => {
    setAdminLoginLoading(true);
    setAdminLoginError('');
    try {
      await sendGmailOtp(ADMIN_EMAIL);
      setBackupOtpSent(true);
    } catch (err) {
      setAdminLoginError('Failed to send backup OTP. Try again.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleVerifyBackupOtp = async () => {
    setAdminLoginLoading(true);
    setAdminLoginError('');
    try {
      const data = await verifyAdmin2FA({ username: 'admin', fallbackOtp: backupOtpCode });
      if (data.token) sessionStorage.setItem('adminSessionToken', data.token);
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('adminLoggedIn', 'true');
      setRequire2FA(false);
    } catch (err) {
      setAdminLoginError(err.message || 'Invalid backup OTP.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminSessionToken');
    setAdminUsername('admin');
    setAdminPassword('');
    setAdminOtp('');
    setAdminOtpSent(false);
    setRequire2FA(false);
    setTotpCode('');
    setUseBackupOtp(false);
    setBackupOtpSent(false);
    setBackupOtpCode('');
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBrandingInitialized, setIsBrandingInitialized] = useState(false);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard'); // dashboard, products, categories, offers, approvals, orders
  const [orders, setOrders] = useState([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  
  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [offers, setOffers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  
  // Registration approvals views
  const [activeRegTab, setActiveRegTab] = useState('pending'); // pending, approved, denied
  const [approvingReg, setApprovingReg] = useState(null); // Registration object currently being approved
  const [genUsername, setGenUsername] = useState('');
  const [genPassword, setGenPassword] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null); // image url to zoom preview

  // Modal / Form States (Products)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodComposition, setProdComposition] = useState('');
  const [prodIndications, setProdIndications] = useState('');
  const [prodDosage, setProdDosage] = useState('');
  const [prodLbl, setProdLbl] = useState('');
  const [prodVideoUrl, setProdVideoUrl] = useState('');
  const [prodPackshotFile, setProdPackshotFile] = useState(null);
  const [prodVisualAidsFiles, setProdVisualAidsFiles] = useState([]);
  const [keepExistingAids, setKeepExistingAids] = useState(true);
  const [prodIsNewLaunch, setProdIsNewLaunch] = useState(false);
  const [prodMrp, setProdMrp] = useState('');

  // Modal / Form States (Offers)
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerDiscount, setOfferDiscount] = useState('');
  const [offerProduct, setOfferProduct] = useState('');
  const [offerExpiry, setOfferExpiry] = useState('');
  const [offerImageFile, setOfferImageFile] = useState(null);
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('activity');

  // Branding & Banners Settings States
  const [branding, setBranding] = useState({ companyName: 'RIOMEDICA', tagline: 'Healthcare', logo: '' });
  const [banners, setBanners] = useState([]);
  const [brandName, setBrandName] = useState('');
  const [brandTag, setBrandTag] = useState('');
  const [brandFile, setBrandFile] = useState(null);
  const [brandLandingTitle, setBrandLandingTitle] = useState('');
  const [brandLandingDesc, setBrandLandingDesc] = useState('');
  const [brandLandingBgFile, setBrandLandingBgFile] = useState(null);
  const [brandBadgeFile, setBrandBadgeFile] = useState(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isAddingBanner, setIsAddingBanner] = useState(false);

  // Settings & Gemini API States
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [otpChannel, setOtpChannel] = useState('mock');
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Admin AI Assistant Test Chat States
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'model',
      text: "Hello! I am Ani, your Riomedica AI Assistant (Admin Testing Interface).\n\nUse this screen to test the Gemini integration, compositions, pricing checks, and voice capabilities.\n\nSpeak or type naturally, and I will reply in your language!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isAiVoiceEnabled, setIsAiVoiceEnabled] = useState(true);
  const [isAiListening, setIsAiListening] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Excel Bulk Import States
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelPreviewRows, setExcelPreviewRows] = useState([]);
  const [excelPreviewError, setExcelPreviewError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [excelDragging, setExcelDragging] = useState(false);
  const excelFileRef = useRef(null);

  // Load database
  const loadData = async () => {
    try {
      const cats = await getCategories();
      const prods = await getProducts();
      const colls = await getCollections();
      const offs = await getOffers();
      const regs = await getRegistrations();
      const brand = await getBranding();
      const ban = await getBanners();
      const settings = await getSettings().catch(() => ({ geminiApiKey: "" }));
      const ords = await getOrders().catch(() => []);
      
      setCategories(cats || []);
      setProducts(prods || []);
      setCollections(colls || []);
      setOffers(offs || []);
      setRegistrations(regs || []);
      setBranding(brand || { companyName: 'RIOMEDICA', tagline: 'Healthcare', logo: '' });
      setBanners(ban || []);
      if (!isSettingsInitialized) {
        let currentApiKey = settings.geminiApiKey || '';
        let currentOtpChannel = settings.otpChannel || 'mock';
        let currentSmtpEmail = settings.smtpEmail || '';
        let currentSmtpPassword = settings.smtpPassword || '';

        // If server settings are empty, check client LocalStorage fallback!
        if (!currentSmtpEmail || !currentSmtpPassword) {
          try {
            const localDb = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
            const localSettings = localDb.settings || {};
            if (localSettings.smtpEmail && localSettings.smtpPassword) {
              currentApiKey = localSettings.geminiApiKey || currentApiKey;
              currentOtpChannel = localSettings.otpChannel || currentOtpChannel;
              currentSmtpEmail = localSettings.smtpEmail;
              currentSmtpPassword = localSettings.smtpPassword;
              
              // Proactively save these back to the server now that connection is active!
              console.log("[Admin] Syncing LocalStorage SMTP settings to server...");
              updateSettings({
                geminiApiKey: currentApiKey,
                otpChannel: currentOtpChannel,
                smtpEmail: currentSmtpEmail,
                smtpPassword: currentSmtpPassword
              }).catch(e => console.warn("Failed to auto-sync settings to server:", e));
            }
          } catch (e) {
            console.error("Failed to read from localStorage settings fallback", e);
          }
        }

        setGeminiApiKey(currentApiKey);
        setOtpChannel(currentOtpChannel);
        setSmtpEmail(currentSmtpEmail);
        setSmtpPassword(currentSmtpPassword);
        setIsSettingsInitialized(true);
      }
      setOrders((ords || []).filter(o => o.createdByRole !== 'mr'));
      setIsOfflineMode(getLocalFallbackStatus());

      // After loading, push a fresh snapshot to Firebase
      return { cats, prods, offs, brand, ban, ords, colls, regs };
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Helper: sync current local data to Firebase Realtime Database
  const syncToFirebase = async () => {
    try {
      const data = await loadData();
      if (!data) return;
      await syncAllToFirebase({
        products: data.prods,
        categories: data.cats,
        offers: data.offs,
        branding: data.brand,
        banners: data.ban,
        orders: data.ords,
        collections: data.colls,
        users: data.regs,
        registrations: data.regs
      });
      console.log('[Admin] Firebase synced successfully');
    } catch (err) {
      console.warn('[Admin] Firebase sync failed (non-critical):', err.message);
    }
  };

  useEffect(() => {
    if (!isAdminLoggedIn) return;

    loadData();
    syncToFirebase(); // 🔥 Push database to Firebase on mount to ensure synchronization
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    // Subscribe to all Firebase data tables in real-time
    const unsubProducts = subscribeToProducts((data) => {
      if (data && data.length > 0) {
        setProducts(data);
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.products = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      }
    });

    const unsubCategories = subscribeToCategories((data) => {
      if (data && data.length > 0) {
        setCategories(data);
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.categories = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      }
    });

    const unsubOffers = subscribeToOffers((data) => {
      if (data) {
        setOffers(data);
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.offers = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      }
    });

    const unsubBanners = subscribeToBanners((data) => {
      if (data) {
        setBanners(data);
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.banners = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      }
    });

    const unsubBranding = subscribeToBranding((data) => {
      if (data) {
        setBranding(data);
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.branding = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      }
    });

    const unsubOrders = subscribeToOrders((data) => {
      if (data) {
        const filtered = data.filter(o => o.createdByRole !== 'mr');
        setOrders(filtered);
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.orders = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      }
    });

    const unsubRegs = subscribeToRegistrations((data) => {
      if (data && data.length > 0) {
        setRegistrations(data);
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.registrations = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      }
    });

    const unsubConnection = subscribeToConnection((isConnected) => {
      setIsFirebaseConnected(isConnected);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOffers();
      unsubBanners();
      unsubBranding();
      unsubOrders();
      unsubRegs();
      unsubConnection();
    };
  }, [isAdminLoggedIn]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      getAdminSecurityStatus()
        .then(data => {
          if (data) setSecurityStatus(data);
        })
        .catch(err => {
          console.warn('Failed to fetch admin security status:', err.message);
        });
    }
  }, [isAdminLoggedIn]);

  // Initialize input fields once branding data is fetched
  useEffect(() => {
    if (branding && !isBrandingInitialized) {
      setBrandName(branding.companyName || '');
      setBrandTag(branding.tagline || '');
      setBrandLandingTitle(branding.landingTitle || '');
      setBrandLandingDesc(branding.landingDescription || '');
      setIsBrandingInitialized(true);
    }
  }, [branding, isBrandingInitialized]);

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Unassigned';
  };

  const getProductName = (prodId) => {
    const prod = products.find(p => p.id === prodId);
    return prod ? prod.name : 'General Promotion';
  };

  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const approvedRegistrations = registrations.filter(r => r.status === 'approved');
  const deniedRegistrations = registrations.filter(r => r.status === 'denied');

  // Open product modal in Create Mode
  const openCreateProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory(categories[0]?.id || '');
    setProdComposition('');
    setProdIndications('');
    setProdDosage('');
    setProdLbl('');
    setProdVideoUrl('');
    setProdPackshotFile(null);
    setProdVisualAidsFiles([]);
    setProdIsNewLaunch(false);
    setProdMrp('');
    setIsProductModalOpen(true);
  };

  // Open product modal in Edit Mode
  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdCategory(product.categoryId);
    setProdComposition(product.composition);
    setProdIndications(product.indications);
    setProdDosage(product.dosage || '');
    setProdLbl(product.lbl || '');
    setProdVideoUrl(product.videoUrl || '');
    setProdPackshotFile(null);
    setProdVisualAidsFiles([]);
    setKeepExistingAids(true);
    setProdIsNewLaunch(!!product.isNewLaunch);
    setProdMrp(product.mrp || '');
    setIsProductModalOpen(true);
  };

  // Open Offer Modal
  const openCreateOfferModal = () => {
    setOfferTitle('');
    setOfferDesc('');
    setOfferDiscount('');
    setOfferProduct(products[0]?.id || '');
    setOfferExpiry('');
    setOfferImageFile(null);
    setIsOfferModalOpen(true);
  };

  // Open Approvals Modal & Auto-Generate Credentials
  const openApprovalModal = (reg) => {
    setApprovingReg(reg);
    
    // Auto-generate clean username
    const baseUser = reg.firmName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    const randNum = Math.floor(100 + Math.random() * 900);
    setGenUsername(`${baseUser}${randNum}`);
    
    // Auto-generate secure password
    const randPass = Math.random().toString(36).substring(2, 10);
    setGenPassword(randPass);
  };

  // Handle Product Form Submit (Create & Update)
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', prodName);
    formData.append('categoryId', prodCategory);
    formData.append('composition', prodComposition);
    formData.append('indications', prodIndications);
    formData.append('dosage', prodDosage);
    formData.append('lbl', prodLbl);
    formData.append('videoUrl', prodVideoUrl);
    formData.append('isNewLaunch', prodIsNewLaunch.toString());
    formData.append('mrp', prodMrp);
    
    if (prodPackshotFile) {
      formData.append('packshot', prodPackshotFile);
    }
    
    if (prodVisualAidsFiles.length > 0) {
      for (let i = 0; i < prodVisualAidsFiles.length; i++) {
        formData.append('visualAids', prodVisualAidsFiles[i]);
      }
    }

    try {
      if (editingProduct) {
        formData.append('keepExistingAids', keepExistingAids.toString());
        await updateProduct(editingProduct.id, formData);
      } else {
        await addProduct(formData);
      }
      setIsProductModalOpen(false);
      await syncToFirebase(); // 🔥 Auto-sync to Firebase
    } catch (err) {
      alert("Failed to save product: " + err.message);
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        await syncToFirebase(); // 🔥 Auto-sync to Firebase
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Handle Reset Product Catalog
  const handleResetCatalog = async () => {
    if (confirm("⚠️ WARNING: This will permanently delete ALL products in the catalog, along with active offers and collection assignments. This action cannot be undone.\n\nAre you sure you want to proceed?")) {
      const confirmation = prompt("To confirm deletion, please type 'RESET' in the box below:");
      if (confirmation === 'RESET') {
        try {
          await resetProducts();
          alert("Product catalog has been reset successfully.");
          loadData();
        } catch (err) {
          alert("Failed to reset catalog: " + err.message);
        }
      } else {
        alert("Reset cancelled. Confirmation phrase did not match.");
      }
    }
  };

  // Handle Offer Submit
  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', offerTitle);
    formData.append('description', offerDesc);
    formData.append('discount', offerDiscount);
    formData.append('productId', offerProduct);
    formData.append('expiry', offerExpiry);
    
    if (offerImageFile) {
      formData.append('image', offerImageFile);
    }

    try {
      await addOffer(formData);
      setIsOfferModalOpen(false);
      await syncToFirebase(); // 🔥 Auto-sync to Firebase
    } catch (err) {
      alert("Failed to save offer: " + err.message);
    }
  };

  // Handle Offer Delete
  const handleDeleteOffer = async (id) => {
    if (confirm("Are you sure you want to remove this offer?")) {
      try {
        await deleteOffer(id);
        await syncToFirebase(); // 🔥 Auto-sync to Firebase
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Handle Save Branding Settings
  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setIsSavingBranding(true);

    const formData = new FormData();
    formData.append('companyName', brandName);
    formData.append('tagline', brandTag);
    formData.append('landingTitle', brandLandingTitle);
    formData.append('landingDescription', brandLandingDesc);
    if (brandFile) {
      formData.append('logo', brandFile);
    }
    if (brandLandingBgFile) {
      formData.append('landingBgImage', brandLandingBgFile);
    }
    if (brandBadgeFile) {
      formData.append('topRightBadge', brandBadgeFile);
    }

    try {
      const updated = await updateBranding(formData);
      setBranding(updated);
      setIsBrandingInitialized(false);
      setBrandFile(null);
      setBrandLandingBgFile(null);
      setBrandBadgeFile(null);
      await syncToFirebase(); // 🔥 Auto-sync to Firebase
      alert('Branding settings saved and synced to all devices!');
    } catch (err) {
      alert(err.message || 'Failed to update branding settings.');
    } finally {
      setIsSavingBranding(false);
    }
  };

  // Handle Save Settings (Gemini API Key, SMTP & OTP Configuration)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      // Try updating server settings directly
      try {
        await updateSettings({ geminiApiKey, otpChannel, smtpEmail, smtpPassword });
      } catch (serverErr) {
        console.warn("Could not save settings directly to server:", serverErr);
      }

      // Update client-side localStorage settings
      try {
        const localDb = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
        localDb.settings = localDb.settings || {};
        localDb.settings.geminiApiKey = geminiApiKey;
        localDb.settings.otpChannel = otpChannel;
        localDb.settings.smtpEmail = smtpEmail;
        localDb.settings.smtpPassword = smtpPassword;
        localStorage.setItem('riomedica_db', JSON.stringify(localDb));
      } catch (err) {
        console.error("Failed to write settings to localStorage", err);
      }

      alert('Configuration saved successfully!');
      setIsSettingsInitialized(false);
      loadData(); // Reload settings and updates
    } catch (err) {
      alert(err.message || 'Failed to save configuration settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Helper to dynamically detect Indian language in AI text response
  const detectLanguage = (text) => {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil script range
    if (/[\u0900-\u097F]/.test(text)) { // Devanagari script range
      if (text.includes('आहे') || text.includes('बद्दल') || text.includes('किंमत') || text.includes('नवीन') || text.includes('डोस')) {
        return 'mr-IN';
      }
      return 'hi-IN';
    }
    return 'en-IN'; // Default to Indian English
  };

  // Text-To-Speech function featuring high-quality female system voices
  const speakText = (text, lang, shouldCancel = true) => {
    if (!window.speechSynthesis) return;

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    if (shouldCancel) {
      window.speechSynthesis.cancel();
    }

    if (!isAiVoiceEnabled) return;

    const cleanText = text
      .replace(/[\*\#\_]/g, '')
      .replace(/•/g, ', ')
      .replace(/\(.*?\)/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;

    const voices = window.speechSynthesis.getVoices();
    const langLower = lang.toLowerCase();
    
    const matchedVoices = voices.filter(v => 
      v.lang.toLowerCase().replace('_', '-').startsWith(langLower.split('-')[0])
    );

    // Prioritize Indian female voice names first
    let voice = matchedVoices.find(v => {
      const name = v.name.toLowerCase();
      return (name.includes('veena') || name.includes('kalpana') || name.includes('neerja') || name.includes('heera') || name.includes('swara') || name.includes('sangeeta') || name.includes('raveena') || name.includes('google in') || name.includes('india'));
    });

    if (!voice) {
      // Fallback to general female voices
      voice = matchedVoices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes('female') || name.includes('zira') || name.includes('hazel') || name.includes('google');
      });
    }

    if (!voice && matchedVoices.length > 0) {
      voice = matchedVoices[0];
    }

    if (!voice) {
      voice = voices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes('female') || name.includes('zira') || name.includes('hazel');
      });
    }

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang; // Enforce voice-language alignment to avoid silent failures
    }

    utterance.pitch = 1.15;
    utterance.rate = 0.95;

    utterance.onerror = (errEvent) => {
      console.error("Speech synthesis error event:", errEvent);
    };

    console.log(`TTS speaking: "${cleanText}" | Lang: ${utterance.lang} | Voice: ${voice ? voice.name : 'Default'}`);
    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text Recognition Functions
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Safari.");
      return;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Fix: continuous listening so user isn't cut off early
    recognition.interimResults = true; // Fix: show real-time transcription feedback
    recognition.lang = 'en-IN'; // Default to Indian English

    let silenceTimer = null;
    let finalTranscript = '';

    recognition.onstart = () => {
      setIsAiListening(true);
      setAiInputText(''); // Clear input for fresh dictation
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsAiListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone permission is blocked. Please allow microphone access in browser settings.");
      }
    };

    recognition.onend = () => {
      setIsAiListening(false);
      if (silenceTimer) clearTimeout(silenceTimer);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const currentText = (finalTranscript + interimTranscript).trim();
      setAiInputText(currentText); // Show transcription in input box in real-time!

      // Reset the silence timer. If user is silent for 1.6 seconds, auto-submit.
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        if (currentText) {
          recognition.stop();
          handleSendAiMessage(currentText);
        }
      }, 1600);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsAiListening(false);
  };

  const toggleSpeechRecognition = () => {
    if (isAiListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const handleSendAiMessage = async (textToSend) => {
    if (!textToSend || !textToSend.trim() || isAiTyping) return;

    stopSpeechRecognition();

    const userMsg = {
      role: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages(prev => [...prev, userMsg]);
    setAiInputText('');
    setIsAiTyping(true);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const historyPayload = aiMessages.map(m => ({ role: m.role, text: m.text }));

      const modelMsgId = 'model-' + Date.now();
      const modelMsgPlaceholder = {
        id: modelMsgId,
        role: 'model',
        text: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setAiMessages(prev => [...prev, modelMsgPlaceholder]);

      let apiBase = 'http://localhost:5000/api';
      if (import.meta.env.VITE_API_URL) {
        apiBase = import.meta.env.VITE_API_URL.endsWith('/api') 
          ? import.meta.env.VITE_API_URL 
          : `${import.meta.env.VITE_API_URL}/api`;
      } else if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        if (!origin.includes(':517')) {
          apiBase = `${origin}/api`;
        }
      }

      let clientApiKey = '';
      try {
        const localDb = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
        clientApiKey = localDb.settings?.geminiApiKey || '';
      } catch (e) {}

      const response = await fetch(`${apiBase}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text, history: historyPayload, apiKey: clientApiKey })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';
      let textToDisplay = '';
      let spokenLength = 0;

      setIsAiTyping(false);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: !done });
        
        if (chunk) {
          accumulatedText += chunk;
          textToDisplay = accumulatedText;
          const trimmed = accumulatedText.trim();
          
          // If the server response is wrapped in a JSON object (older server process running), decode it automatically
          if (trimmed.startsWith('{')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.reply) {
                textToDisplay = parsed.reply;
              }
            } catch (e) {
              const match = accumulatedText.match(/"reply"\s*:\s*"(.*?)"/s);
              if (match) {
                textToDisplay = match[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\t/g, '\t')
                  .replace(/\\\\/g, '\\');
              } else {
                const replyKeyIndex = accumulatedText.indexOf('"reply"');
                if (replyKeyIndex !== -1) {
                  const firstQuoteIndex = accumulatedText.indexOf('"', replyKeyIndex + 7);
                  if (firstQuoteIndex !== -1) {
                    const textStart = firstQuoteIndex + 1;
                    let textEnd = accumulatedText.length;
                    if (accumulatedText.endsWith('"}') || accumulatedText.endsWith('"} ')) {
                      textEnd = accumulatedText.lastIndexOf('"}');
                    }
                    textToDisplay = accumulatedText.substring(textStart, textEnd)
                      .replace(/\\n/g, '\n')
                      .replace(/\\"/g, '"')
                      .replace(/\\t/g, '\t')
                      .replace(/\\\\/g, '\\');
                  }
                }
              }
            }
          }

          setAiMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: textToDisplay } : m));

          // Speak new clauses/sentences from clean decoded text instantly
          let unspokedText = textToDisplay.substring(spokenLength);
          let processedSomething = true;

          while (processedSomething && unspokedText.length > 0) {
            processedSomething = false;
            // Find first occurrence of any clause punctuation: , . ! ? ; : \n ।
            const match = unspokedText.match(/[,.!?।;:\n]/);
            if (match) {
              const boundaryIndex = match.index;
              const clause = unspokedText.substring(0, boundaryIndex + 1).trim();
              if (clause) {
                const langCode = detectLanguage(clause);
                speakText(clause, langCode, false);
              }
              const consumedLength = boundaryIndex + 1;
              spokenLength += consumedLength;
              unspokedText = unspokedText.substring(consumedLength);
              processedSomething = true;
            } else if (unspokedText.length >= 45) {
              // No punctuation, but buffer has accumulated at least 45 chars.
              // Find the last space within the first 45 chars to split on a word boundary
              const slice = unspokedText.substring(0, 45);
              const lastSpace = slice.lastIndexOf(' ');
              if (lastSpace > 10) {
                const clause = unspokedText.substring(0, lastSpace).trim();
                if (clause) {
                  const langCode = detectLanguage(clause);
                  speakText(clause, langCode, false);
                }
                const consumedLength = lastSpace + 1;
                spokenLength += consumedLength;
                unspokedText = unspokedText.substring(consumedLength);
                processedSomething = true;
              } else {
                const clause = unspokedText.substring(0, 45).trim();
                if (clause) {
                  const langCode = detectLanguage(clause);
                  speakText(clause, langCode, false);
                }
                const consumedLength = 45;
                spokenLength += consumedLength;
                unspokedText = unspokedText.substring(consumedLength);
                processedSomething = true;
              }
            }
          }
        }
      }

      if (textToDisplay) {
        const finalLeftover = textToDisplay.substring(spokenLength).trim();
        if (finalLeftover) {
          const langCode = detectLanguage(finalLeftover);
          speakText(finalLeftover, langCode, false);
        }
      }

    } catch (err) {
      console.warn("Direct stream fetch failed, falling back to LocalStorage offline mock stream:", err.message);
      
      try {
        const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
        const lowerMsg = userMsg.text.toLowerCase();
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
            matchedProduct = db.products?.find(p => p.name.toLowerCase().includes(correctName));
            if (matchedProduct) break;
          }
        }

        if (!matchedProduct) {
          matchedProduct = db.products?.find(p => lowerMsg.includes(p.name.toLowerCase()));
        }

        if (matchedProduct) {
          const mrpVal = matchedProduct.mrp ? (String(matchedProduct.mrp).includes('₹') ? matchedProduct.mrp : `₹${matchedProduct.mrp}`) : 'Price on request';
          if (detectedLang === "hi") {
            reply = `**${matchedProduct.name}** के बारे में जानकारी:\n` +
                    `• **संरचना (Composition):** ${matchedProduct.composition}\n` +
                    `• **उपयोग (Indications):** ${matchedProduct.indications || 'सामान्य उपयोग'}\n` +
                    `• **मूल्य (MRP):** ${mrpVal}\n\n` +
                    `*(ऑफ़लाइन सिमुलेशन मोड)*`;
          } else if (detectedLang === "ta") {
            reply = `**${matchedProduct.name}** தயாரிப்பு विवरण:\n` +
                    `• **கலவை (Composition):** ${matchedProduct.composition}\n` +
                    `• **பயன்கள் (Indications):** ${matchedProduct.indications || 'பொதுவான பயன்பாடு'}\n` +
                    `• **விலை (MRP):** ${mrpVal}\n\n` +
                    `*(ஆஃப்லைன் சிமுலேஷன் முறை)*`;
          } else if (detectedLang === "mr") {
            reply = `**${matchedProduct.name}** बद्दल माहिती:\n` +
                    `• **संयोजन (Composition):** ${matchedProduct.composition}\n` +
                    `• **वापर (Indications):** ${matchedProduct.indications || 'सामान्य वापर'}\n` +
                    `• **किंमत (MRP):** ${mrpVal}\n\n` +
                    `*(ऑफलाइन सिम्युलेशन मोड)*`;
          } else {
            reply = `Here are the details for **${matchedProduct.name}**:\n` +
                    `• **Composition:** ${matchedProduct.composition}\n` +
                    `• **Indications:** ${matchedProduct.indications || 'General clinical use'}\n` +
                    `• **MRP:** ${mrpVal}\n\n` +
                    `*(Offline Simulation Mode)*`;
          }
        } else {
          if (detectedLang === "hi") {
            reply = "नमस्ते! मैं अनी हूँ। आप मुझसे किसी भी ब्रांड (जैसे 'Rabrio 20') के बारे में पूछ सकते हैं।\n\n*(ऑफ़लाइन सिमुलेशन मोड)*";
          } else if (detectedLang === "ta") {
            reply = "வணக்கம்! நான் அனி. நீங்கள் தயாரிப்புகள் அல்லது விலைகளைப் பற்றி கேட்கலாம்.\n\n*(ஆஃப்லைன் சிமுலேஷன் முறை)*";
          } else if (detectedLang === "mr") {
            reply = "नमस्कार! मी अनी आहे. तुम्ही मला औषधांबद्दल विचारू शकता.\n\n*(ऑफलाइन सिम्युलेशन मोड)*";
          } else {
            reply = "Hello! I am **Ani**, your Riomedica AI Assistant. Ask me about any of our brands (e.g., 'Tell me about Rabrio 20').\n\n*(Offline Simulation Mode)*";
          }
        }

        setIsAiTyping(false);
        const words = reply.split(/(\s+)/);
        let index = 0;
        let accumulatedText = '';
        let speakBuffer = '';

        const modelMsgId = 'model-' + Date.now();
        const modelMsgPlaceholder = {
          id: modelMsgId,
          role: 'model',
          text: '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiMessages(prev => [...prev, modelMsgPlaceholder]);

        const streamInterval = setInterval(() => {
          if (index < words.length) {
            const nextWord = words[index];
            accumulatedText += nextWord;
            setAiMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: accumulatedText } : m));

            speakBuffer += nextWord;
            let unspokedText = speakBuffer;
            let processedSomething = true;
            let localSpokenLength = 0;

            while (processedSomething && unspokedText.length > 0) {
              processedSomething = false;
              const match = unspokedText.match(/[,.!?।;:\n]/);
              if (match) {
                const boundaryIndex = match.index;
                const clause = unspokedText.substring(0, boundaryIndex + 1).trim();
                if (clause) {
                  const langCode = detectLanguage(clause);
                  speakText(clause, langCode, false);
                }
                const consumedLength = boundaryIndex + 1;
                localSpokenLength += consumedLength;
                unspokedText = unspokedText.substring(consumedLength);
                processedSomething = true;
              } else if (unspokedText.length >= 45) {
                const slice = unspokedText.substring(0, 45);
                const lastSpace = slice.lastIndexOf(' ');
                if (lastSpace > 10) {
                  const clause = unspokedText.substring(0, lastSpace).trim();
                  if (clause) {
                    const langCode = detectLanguage(clause);
                    speakText(clause, langCode, false);
                  }
                  const consumedLength = lastSpace + 1;
                  localSpokenLength += consumedLength;
                  unspokedText = unspokedText.substring(consumedLength);
                  processedSomething = true;
                } else {
                  const clause = unspokedText.substring(0, 45).trim();
                  if (clause) {
                    const langCode = detectLanguage(clause);
                    speakText(clause, langCode, false);
                  }
                  const consumedLength = 45;
                  localSpokenLength += consumedLength;
                  unspokedText = unspokedText.substring(consumedLength);
                  processedSomething = true;
                }
              }
            }
            if (localSpokenLength > 0) {
              speakBuffer = speakBuffer.substring(localSpokenLength);
            }

            index++;
          } else {
            clearInterval(streamInterval);
            if (speakBuffer.trim()) {
              const remaining = speakBuffer.trim();
              const langCode = detectLanguage(remaining);
              speakText(remaining, langCode, false);
            }
          }
        }, 20);
      } catch (innerErr) {
        console.error("Local mock stream failed:", innerErr);
        const errorMsg = {
          role: 'model',
          text: "Sorry, I had trouble processing that request. Please make sure the server is online and try again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setIsAiTyping(false);
    }
  };

  // Cleanup speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Speak and show personalized greeting when opening the AI assistant
  useEffect(() => {
    if (isAiChatOpen) {
      const greetingText = `Hello Admin! I am Ani, your Riomedica AI Assistant. How can I help you test today?`;

      setAiMessages(prev => {
        if (prev.length <= 1) {
          return [
            {
              role: 'model',
              text: greetingText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ];
        }
        return prev;
      });

      // Play voice greeting
      setTimeout(() => {
        speakText(greetingText, 'en-IN', true);
      }, 600);
    }
  }, [isAiChatOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollTop = chatMessagesEndRef.current.scrollHeight;
    }
  }, [aiMessages, isAiTyping, isAiChatOpen]);


  // Handle Add New Banner
  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!bannerFile) {
      alert('Please select a banner image file.');
      return;
    }

    setIsAddingBanner(true);

    const formData = new FormData();
    formData.append('title', bannerTitle);
    formData.append('linkUrl', bannerLink);
    formData.append('image', bannerFile);

    try {
      const newBanner = await addBanner(formData);
      setBanners([...banners, newBanner]);
      setBannerTitle('');
      setBannerLink('');
      setBannerFile(null);
      
      // Reset file input element
      const fileInput = document.getElementById('banner-file-input');
      if (fileInput) fileInput.value = '';

      alert('Banner added successfully!');
    } catch (err) {
      alert(err.message || 'Failed to upload banner.');
    } finally {
      setIsAddingBanner(false);
    }
  };

  // Handle Delete Banner
  const handleDeleteBanner = async (bannerId) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      await deleteBanner(bannerId);
      setBanners(banners.filter(b => b.id !== bannerId));
    } catch (err) {
      alert(err.message || 'Failed to delete banner.');
    }
  };

  // Handle User Approval Confirmation
  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!genUsername || !genPassword) return;

    try {
      await approveRegistration(approvingReg.id, {
        username: genUsername,
        password: genPassword
      });
      setApprovingReg(null);
      await syncToFirebase(); // 🔥 Auto-sync users to Firebase
    } catch (err) {
      alert("Failed to approve user: " + err.message);
    }
  };

  // Handle User Deny Request
  const handleDenyRegistration = async (id) => {
    if (confirm("Are you sure you want to DENY this registration request?")) {
      try {
        await denyRegistration(id);
        await syncToFirebase(); // 🔥 Auto-sync to Firebase
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Handle Category Add
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await addCategory({
        name: newCatName,
        description: newCatDesc,
        icon: newCatIcon
      });
      setNewCatName('');
      setNewCatDesc('');
      setNewCatIcon('Activity');
      await syncToFirebase(); // 🔥 Auto-sync to Firebase
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Category Delete
  const handleDeleteCategory = async (id) => {
    if (confirm("Deleting a category will unassign its products. Proceed?")) {
      try {
        await deleteCategory(id);
        await syncToFirebase(); // 🔥 Auto-sync to Firebase
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // ── Excel Bulk Import Handlers ──

  // Parse file client-side for preview
  const handleExcelFileChange = (file) => {
    if (!file) return;
    setExcelFile(file);
    setExcelPreviewError('');
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!rows || rows.length === 0) {
          setExcelPreviewError('The file appears to be empty.');
          setExcelPreviewRows([]);
        } else {
          setExcelPreviewRows(rows.slice(0, 10)); // show up to 10 rows in preview
        }
      } catch {
        setExcelPreviewError('Could not read the file. Make sure it is a valid Excel or CSV file.');
        setExcelPreviewRows([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Upload to server for actual import
  const handleBulkImport = async () => {
    if (!excelFile) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', excelFile);
      const result = await bulkImportProducts(fd);
      setImportResult(result);
      await syncToFirebase(); // 🔥 Auto-sync to Firebase after bulk import
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  // Generate & download an Excel template
  const downloadExcelTemplate = () => {
    const templateData = [
      {
        'Product Name': 'Rabrio 20 Tablet',
        'Category': 'Gastrointestinal',
        'Composition': 'Rabeprazole Sodium 20mg',
        'Indications': 'GERD, Gastric Ulcers',
        'Dosage': '1 tablet daily before breakfast',
        'LBL': 'Inhibits H+/K+-ATPase enzyme for sustained acid relief',
        'Video URL': '',
        'New Launch': 'Yes',
        'MRP': '150.00'
      },
      {
        'Product Name': 'Example Product 2',
        'Category': 'Injections & Infusions',
        'Composition': 'Active Ingredient 500mg',
        'Indications': 'Indication description here',
        'Dosage': 'As directed by physician',
        'LBL': 'Leave behind literature text',
        'Video URL': 'https://youtube.com/embed/...',
        'New Launch': 'No',
        'MRP': '299.00'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, { wch: 25 }, { wch: 35 }, { wch: 40 },
      { wch: 35 }, { wch: 45 }, { wch: 40 }, { wch: 12 }, { wch: 12 }
    ];
    XLSX.writeFile(wb, 'Product_Catalog_Template.xlsx');
  };

  const resetExcelImport = () => {
    setExcelFile(null);
    setExcelPreviewRows([]);
    setExcelPreviewError('');
    setImportResult(null);
    if (excelFileRef.current) excelFileRef.current.value = '';
  };


  if (!isAdminLoggedIn) {
    const inputStyle = {
      width: '100%', padding: '13px 16px 13px 44px', background: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', color: '#fff',
      fontSize: '0.93rem', outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box'
    };
    const labelStyle = { display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' };

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', background: 'radial-gradient(ellipse at 70% 10%, #0d2318 0%, #04080c 60%)', fontFamily: 'var(--font-primary)', padding: '20px', boxSizing: 'border-box' }}>
        <div style={{ background: 'rgba(10, 15, 30, 0.78)', backdropFilter: 'blur(24px)', border: '1px solid rgba(16, 185, 129, 0.22)', borderRadius: '28px', padding: '40px 32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 50px rgba(16,185,129,0.09)', textAlign: 'center' }}>

          {/* Icon */}
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', width: '64px', height: '64px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
            <Icons.ShieldCheck size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '4px', letterSpacing: '-0.5px' }}>Riomedica Admin</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '28px' }}>Secure Administrator Portal — Authorized Access Only</p>

          {!require2FA ? (
            <>
              {/* Login Method Tabs */}
              <div style={{ display: 'flex', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '24px' }}>
                <button onClick={() => { setLoginMethod('otp'); setAdminLoginError(''); }} style={{ flex: 1, padding: '11px', background: loginMethod === 'otp' ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent', color: loginMethod === 'otp' ? '#fff' : '#64748b', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                  <Icons.Mail size={15} /> Email OTP
                </button>
                <button onClick={() => { setLoginMethod('password'); setAdminLoginError(''); }} style={{ flex: 1, padding: '11px', background: loginMethod === 'password' ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent', color: loginMethod === 'password' ? '#fff' : '#64748b', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                  <Icons.Lock size={15} /> Password
                </button>
              </div>

              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>

                {loginMethod === 'otp' ? (
                  <div>
                    <label style={labelStyle}>Registered Admin Email</label>
                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                      <Icons.Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input type="email" value={ADMIN_EMAIL} readOnly style={{ ...inputStyle, color: '#94a3b8', cursor: 'not-allowed' }} />
                    </div>
                    <label style={labelStyle}>One-Time Passcode</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Icons.KeyRound size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={adminOtp} onChange={e => setAdminOtp(e.target.value)} required style={{ ...inputStyle, letterSpacing: '4px', fontWeight: 700, fontSize: '1.1rem' }}
                          onFocus={e => { e.target.style.borderColor='#10b981'; e.target.style.boxShadow='0 0 10px rgba(16,185,129,0.18)'; }}
                          onBlur={e => { e.target.style.borderColor='rgba(16,185,129,0.2)'; e.target.style.boxShadow='none'; }}
                        />
                      </div>
                      <button type="button" onClick={handleSendAdminOtp} disabled={adminOtpLoading || adminOtpSent}
                        style={{ padding: '0 18px', background: adminOtpSent ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', color: adminOtpSent ? '#34d399' : '#10b981', fontWeight: 700, fontSize: '0.78rem', cursor: adminOtpSent ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {adminOtpLoading ? '...' : adminOtpSent ? '✓ Sent' : 'Send OTP'}
                      </button>
                    </div>
                    {adminOtpSent && <p style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '8px' }}>✓ OTP sent to {ADMIN_EMAIL}</p>}
                  </div>
                ) : (
                  <div>
                    <label style={labelStyle}>Admin Password</label>
                    <div style={{ position: 'relative' }}>
                      <Icons.Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input type="password" placeholder="Enter administrator password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required style={inputStyle}
                        onFocus={e => { e.target.style.borderColor='#10b981'; e.target.style.boxShadow='0 0 10px rgba(16,185,129,0.18)'; }}
                        onBlur={e => { e.target.style.borderColor='rgba(16,185,129,0.2)'; e.target.style.boxShadow='none'; }}
                      />
                    </div>
                  </div>
                )}

                {adminLoginError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#f87171', fontSize: '0.83rem' }}>
                    <Icons.AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{adminLoginError}</span>
                  </div>
                )}

                <button type="submit" disabled={adminLoginLoading || (loginMethod === 'otp' && !adminOtpSent)}
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: '1rem', border: 'none', borderRadius: '12px', padding: '15px', cursor: (adminLoginLoading || (loginMethod === 'otp' && !adminOtpSent)) ? 'not-allowed' : 'pointer', opacity: (adminLoginLoading || (loginMethod === 'otp' && !adminOtpSent)) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.25s' }}
                  onMouseOver={e => { if (!adminLoginLoading) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(16,185,129,0.3)'; }}}
                  onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
                >
                  {adminLoginLoading ? <><Icons.Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</> : <><Icons.LogIn size={18} /> Sign In to Portal</>}
                </button>
              </form>
            </>
          ) : (
            /* 2FA Verification Overlay */
            <div style={{ textAlign: 'left' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Icons.ShieldCheck size={26} color="#10b981" />
                </div>
                <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800, marginBottom: '4px' }}>2-Step Verification</h3>
                <p style={{ color: '#64748b', fontSize: '0.82rem' }}>{useBackupOtp ? 'Enter the backup OTP sent to your email.' : 'Enter the 6-digit code from Google Authenticator.'}</p>
              </div>

              {!useBackupOtp ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Authenticator Code</label>
                    <div style={{ position: 'relative' }}>
                      <Icons.Smartphone size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={totpCode} onChange={e => setTotpCode(e.target.value)} style={{ ...inputStyle, letterSpacing: '8px', fontWeight: 800, fontSize: '1.3rem', textAlign: 'center', paddingLeft: '16px' }}
                        onFocus={e => { e.target.style.borderColor='#10b981'; e.target.style.boxShadow='0 0 12px rgba(16,185,129,0.2)'; }}
                        onBlur={e => { e.target.style.borderColor='rgba(16,185,129,0.2)'; e.target.style.boxShadow='none'; }}
                        onKeyDown={e => { if (e.key === 'Enter' && totpCode.length === 6) handleVerifyTOTP(); }}
                      />
                    </div>
                  </div>

                  {adminLoginError && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#f87171', fontSize: '0.82rem' }}>
                      <Icons.AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} /><span>{adminLoginError}</span>
                    </div>
                  )}

                  <button onClick={handleVerifyTOTP} disabled={totpCode.length !== 6 || adminLoginLoading}
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '12px', padding: '14px', cursor: totpCode.length !== 6 ? 'not-allowed' : 'pointer', opacity: totpCode.length !== 6 ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', transition: 'all 0.2s' }}>
                    {adminLoginLoading ? 'Verifying...' : <><Icons.ShieldCheck size={16} /> Verify & Sign In</>}
                  </button>

                  <button onClick={() => { setUseBackupOtp(true); setAdminLoginError(''); }} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', textAlign: 'center', padding: '4px' }}>
                    Can't access authenticator? Use backup email OTP
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {!backupOtpSent ? (
                    <>
                      <p style={{ color: '#94a3b8', fontSize: '0.83rem', textAlign: 'center' }}>A backup OTP will be sent to <strong style={{ color: '#34d399' }}>{ADMIN_EMAIL}</strong></p>
                      <button onClick={handleSendBackupOtp} disabled={adminLoginLoading}
                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontWeight: 700, borderRadius: '12px', padding: '13px', cursor: 'pointer', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Icons.Mail size={16} /> Send Backup OTP
                      </button>
                    </>
                  ) : (
                    <>
                      <p style={{ color: '#34d399', fontSize: '0.78rem', textAlign: 'center' }}>✓ Backup OTP sent to {ADMIN_EMAIL}</p>
                      <div>
                        <label style={labelStyle}>Backup OTP</label>
                        <div style={{ position: 'relative' }}>
                          <Icons.KeyRound size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                          <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit backup OTP" value={backupOtpCode} onChange={e => setBackupOtpCode(e.target.value)} style={{ ...inputStyle, letterSpacing: '4px', fontWeight: 700, textAlign: 'center', paddingLeft: '16px' }}
                            onFocus={e => { e.target.style.borderColor='#10b981'; e.target.style.boxShadow='0 0 10px rgba(16,185,129,0.18)'; }}
                            onBlur={e => { e.target.style.borderColor='rgba(16,185,129,0.2)'; e.target.style.boxShadow='none'; }}
                          />
                        </div>
                      </div>

                      {adminLoginError && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#f87171', fontSize: '0.82rem' }}>
                          <Icons.AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} /><span>{adminLoginError}</span>
                        </div>
                      )}

                      <button onClick={handleVerifyBackupOtp} disabled={backupOtpCode.length < 4 || adminLoginLoading}
                        style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '12px', padding: '14px', cursor: backupOtpCode.length < 4 ? 'not-allowed' : 'pointer', opacity: backupOtpCode.length < 4 ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.93rem' }}>
                        {adminLoginLoading ? 'Verifying...' : <><Icons.ShieldCheck size={16} /> Verify Backup OTP</>}
                      </button>
                    </>
                  )}
                  <button onClick={() => { setUseBackupOtp(false); setBackupOtpSent(false); setBackupOtpCode(''); setAdminLoginError(''); }} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.76rem', cursor: 'pointer', textDecoration: 'underline', textAlign: 'center' }}>
                    ← Back to Authenticator
                  </button>
                </div>
              )}

              <button onClick={() => { setRequire2FA(false); setTotpCode(''); setUseBackupOtp(false); setBackupOtpSent(false); setBackupOtpCode(''); setAdminLoginError(''); }} style={{ width: '100%', marginTop: '12px', background: 'transparent', border: 'none', color: '#475569', fontSize: '0.76rem', cursor: 'pointer', textDecoration: 'underline' }}>
                ← Back to Sign-in
              </button>
            </div>
          )}

          <p style={{ color: '#1e293b', fontSize: '0.7rem', marginTop: '24px' }}>Riomedica Healthcare — Admin Portal v2.0 — Secured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Sidebar Navigation */}
      <div className="admin-sidebar">
        <div className="admin-logo-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {branding.logo ? (
              <img 
                src={branding.logo.startsWith('http') ? branding.logo : `${IMAGE_BASE}${branding.logo}`} 
                alt="Logo" 
                style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }}
              />
            ) : (
              <div 
                style={{
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  color: '#fff'
                }}
              >
                {branding.companyName ? branding.companyName.charAt(0) : 'R'}
              </div>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{branding.companyName || 'RIOMEDICA'}</h1>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#10b981', fontWeight: 700 }}>{branding.tagline || 'Healthcare'}</span>
            </div>
          </div>
          
          {/* Hamburger Menu Toggle (Only visible on mobile) */}
          <button 
            className="admin-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isMobileMenuOpen ? <Icons.X size={24} /> : <Icons.Menu size={24} />}
          </button>
        </div>

        {/* Sidebar Content wrapper (collapses on mobile) */}
        <div className={`admin-sidebar-content ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="admin-menu">
            <button 
              className={`admin-menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('dashboard');
                setIsMobileMenuOpen(false);
              }}
            >
              <Icons.LayoutDashboard size={18} /> Dashboard
            </button>
            <button 
              className={`admin-menu-item ${activeMenu === 'products' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('products');
                setIsMobileMenuOpen(false);
              }}
            >
              <Icons.Layers size={18} /> Product Catalog
            </button>
            <button 
              className={`admin-menu-item ${activeMenu === 'categories' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('categories');
                setIsMobileMenuOpen(false);
              }}
            >
              <Icons.Tags size={18} /> Category Manager
            </button>
            <button 
              className={`admin-menu-item ${activeMenu === 'offers' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('offers');
                setIsMobileMenuOpen(false);
              }}
            >
              <Icons.BadgePercent size={18} /> Bumper Offers
            </button>
            <button 
              className={`admin-menu-item ${activeMenu === 'approvals' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('approvals');
                setIsMobileMenuOpen(false);
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icons.UserCheck size={18} /> User Approvals
              </span>
              {pendingRegistrations.length > 0 && (
                <span className="admin-notification-badge">{pendingRegistrations.length}</span>
              )}
            </button>
            <button 
              className={`admin-menu-item ${activeMenu === 'branding' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('branding');
                setIsMobileMenuOpen(false);
              }}
            >
              <Icons.Palette size={18} /> Branding & Banners
            </button>
            <button 
              className={`admin-menu-item ${activeMenu === 'orders' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('orders');
                setIsMobileMenuOpen(false);
              }}
            >
              <Icons.ShoppingCart size={18} /> B2B Orders
            </button>
            <button 
              className={`admin-menu-item ${activeMenu === 'security' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('security');
                setIsMobileMenuOpen(false);
              }}
              style={activeMenu === 'security' ? {} : { color: '#94a3b8' }}
            >
              <Icons.ShieldCheck size={18} /> Security
            </button>
            <button 
              className="admin-menu-item"
              onClick={() => {
                handleAdminLogout();
                setIsMobileMenuOpen(false);
              }}
              style={{ 
                marginTop: 'auto', 
                color: '#ef4444', 
                background: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer'
              }}
            >
              <Icons.LogOut size={18} /> Sign Out
            </button>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div 
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isFirebaseConnected ? '#10b981' : (isOfflineMode ? '#f59e0b' : '#10b981')
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                {isFirebaseConnected ? 'Firebase Realtime Live' : (isOfflineMode ? 'Offline Sync Active' : 'API Connection Live')}
              </span>
            </div>
            {!isFirebaseConnected && isOfflineMode && (
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                Warning: Backend server and Firebase are unreachable. Changes are currently cached locally in browser Storage.
              </p>
            )}
            {isFirebaseConnected && (
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                Firebase Sync Active. Changes are syncing in real time.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="admin-main">
        {/* Header Title block */}
        <div className="admin-header-bar">
          <div className="admin-title-block">
            {activeMenu === 'dashboard' && (
              <>
                <h2>Welcome back, Administrator</h2>
                <p>Monitor your detailing catalog, offers schemes, and verify new user registrations.</p>
              </>
            )}
            {activeMenu === 'products' && (
              <>
                <h2>Product Catalog</h2>
                <p>Manage medicine compositions, package details, literature sheets, and detailing slides.</p>
              </>
            )}
            {activeMenu === 'categories' && (
              <>
                <h2>Category Manager</h2>
                <p>Organize products into therapeutic classes to assist detailers in finding medicines.</p>
              </>
            )}
            {activeMenu === 'offers' && (
              <>
                <h2>Bumper Offers Manager</h2>
                <p>Publish active schemes, discounts, and promotional offers for medical detailers.</p>
              </>
            )}
            {activeMenu === 'approvals' && (
              <>
                <h2>User Sign-Up Approvals</h2>
                <p>Verify applicant firm details, drug license papers, and GST copy or PAN card to generate logins.</p>
              </>
            )}
            {activeMenu === 'branding' && (
              <>
                <h2>Branding & Banners</h2>
                <p>Customize company logo, brand labels, and publish sliding homepage promotion banners.</p>
              </>
            )}
            {activeMenu === 'orders' && (
              <>
                <h2>B2B Orders Tracker</h2>
                <p>Monitor incoming medicine order receipts, total amounts, and toggle order status.</p>
              </>
            )}
            {activeMenu === 'security' && (
              <>
                <h2>Security & Access Control</h2>
                <p>Manage 2-Step Verification, Google Authenticator, and administrator password settings.</p>
              </>
            )}
          </div>
          <div className="admin-actions">
            {activeMenu === 'products' && (
              <>
                <button
                  className="btn-admin-secondary"
                  onClick={downloadExcelTemplate}
                  title="Download a pre-filled Excel template"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icons.Download size={16} /> Download Template
                </button>
                <button
                  className="btn-admin-secondary"
                  onClick={() => { setShowExcelImport(v => !v); resetExcelImport(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showExcelImport ? 'rgba(16,185,129,0.15)' : '', borderColor: showExcelImport ? '#10b981' : '' }}
                >
                  <Icons.FileSpreadsheet size={16} /> {showExcelImport ? 'Hide Import' : 'Bulk Import Excel'}
                </button>
                <button
                  className="btn-admin-secondary"
                  onClick={handleResetCatalog}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  title="Clear all products from the catalog"
                >
                  <Icons.Trash2 size={16} /> Reset Catalog
                </button>
                <button className="btn-admin-primary" onClick={openCreateProductModal}>
                  <Icons.Plus size={16} /> Add New Medicine
                </button>
              </>
            )}
            {activeMenu === 'offers' && (
              <button className="btn-admin-primary" onClick={openCreateOfferModal}>
                <Icons.Plus size={16} /> Create Running Offer
              </button>
            )}
          </div>
        </div>

        {/* --- MENU: Dashboard Overview --- */}
        {activeMenu === 'dashboard' && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <h3>Medicines Listed</h3>
                  <p>{products.length}</p>
                </div>
                <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <Icons.Package size={24} />
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <h3>Therapeutic Classes</h3>
                  <p>{categories.length}</p>
                </div>
                <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <Icons.Tag size={24} />
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <h3>Pending Approvals</h3>
                  <p>{pendingRegistrations.length}</p>
                </div>
                <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <Icons.Users size={24} />
                </div>
              </div>
            </div>

            <div className="admin-card-container">
              <div className="table-header-row">
                <h3>Latest Registration Requests</h3>
                <button className="btn-admin-secondary" onClick={() => setActiveMenu('approvals')}>
                  Go to Approvals Portal
                </button>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Firm Name</th>
                      <th>Owner Name</th>
                      <th>Contact info</th>
                      <th>Status</th>
                      <th>Date Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.slice(-5).reverse().map((reg) => (
                      <tr key={reg.id}>
                        <td className="product-row-title">{reg.firmName}</td>
                        <td>{reg.ownerName}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                            <span>{reg.mobile}</span>
                            <span style={{ color: '#64748b' }}>{reg.email}</span>
                          </div>
                        </td>
                        <td>
                          {reg.status === 'pending' && <span className="badge-status-pending">Pending</span>}
                          {reg.status === 'approved' && <span className="badge-status-approved">Approved</span>}
                          {reg.status === 'denied' && <span className="badge-status-denied">Denied</span>}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* --- MENU: Products List & CRUD --- */}
        {activeMenu === 'products' && (
          <div className="admin-card-container">

            {/* ── Excel Bulk Import Panel ── */}
            {showExcelImport && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '2px solid #10b981',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(16,185,129,0.1)'
              }}>
                {/* Panel Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                      <Icons.FileSpreadsheet size={22} color="#fff" />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>Bulk Product Import via Excel</h3>
                      <p style={{ fontSize: '0.8rem', color: '#475569' }}>Upload .xlsx, .xls or .csv — all products added instantly to the catalog</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowExcelImport(false); resetExcelImport(); }} style={{ color: '#94a3b8', padding: '4px' }}>
                    <Icons.X size={20} />
                  </button>
                </div>

                {/* Column Guide */}
                <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    📋 Required Column Headers
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['Product Name *', 'Category', 'Composition', 'Indications', 'Dosage', 'LBL', 'Video URL', 'New Launch', 'MRP'].map((col, i) => (
                      <span key={i} style={{
                        background: col.includes('*') ? 'rgba(16,185,129,0.15)' : '#f1f5f9',
                        color: col.includes('*') ? '#059669' : '#475569',
                        border: `1px solid ${col.includes('*') ? 'rgba(16,185,129,0.3)' : '#e2e8f0'}`,
                        padding: '3px 10px', borderRadius: '6px',
                        fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace'
                      }}>
                        {col}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px' }}>
                    * Required. Category must match an existing category name. New Launch: Yes/No.
                  </p>
                </div>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setExcelDragging(true); }}
                  onDragLeave={() => setExcelDragging(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setExcelDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleExcelFileChange(file);
                  }}
                  onClick={() => excelFileRef.current?.click()}
                  style={{
                    border: `2px dashed ${excelDragging ? '#10b981' : excelFile ? '#10b981' : '#cbd5e1'}`,
                    borderRadius: '12px',
                    padding: '28px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: excelDragging ? 'rgba(16,185,129,0.06)' : excelFile ? 'rgba(16,185,129,0.04)' : '#fafafa',
                    transition: 'all 0.2s',
                    marginBottom: '16px'
                  }}
                >
                  <input
                    ref={excelFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={e => handleExcelFileChange(e.target.files[0])}
                  />
                  {excelFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <Icons.FileCheck size={32} color="#10b981" />
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{excelFile.name}</p>
                        <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{(excelFile.size / 1024).toFixed(1)} KB • Click to replace</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Icons.Upload size={36} color={excelDragging ? '#10b981' : '#94a3b8'} style={{ margin: '0 auto 10px auto' }} />
                      <p style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                        {excelDragging ? 'Drop your file here!' : 'Drag & Drop or Click to Browse'}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>Supports .xlsx, .xls, .csv — max 5 MB</p>
                    </>
                  )}
                </div>

                {/* Preview Error */}
                {excelPreviewError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'center', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
                    <Icons.AlertTriangle size={16} style={{ flexShrink: 0 }} /> {excelPreviewError}
                  </div>
                )}

                {/* Data Preview Table */}
                {excelPreviewRows.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icons.Table size={16} color="#10b981" />
                        Preview (first {excelPreviewRows.length} rows)
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                        {excelPreviewRows.length} rows shown
                      </span>
                    </div>
                    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead>
                          <tr style={{ background: 'linear-gradient(90deg, #10b981, #059669)' }}>
                            {Object.keys(excelPreviewRows[0]).map((col, i) => (
                              <th key={i} style={{ padding: '10px 12px', color: '#fff', fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap' }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {excelPreviewRows.map((row, ri) => (
                            <tr key={ri} style={{ borderBottom: '1px solid #f1f5f9', background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              {Object.values(row).map((val, ci) => (
                                <td key={ci} style={{ padding: '8px 12px', color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {String(val) || <span style={{ color: '#cbd5e1' }}>—</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Import Result */}
                {importResult && (
                  <div style={{
                    borderRadius: '10px',
                    padding: '14px 16px',
                    marginBottom: '16px',
                    background: importResult.error ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${importResult.error ? '#fecaca' : '#bbf7d0'}`,
                    display: 'flex', flexDirection: 'column', gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', color: importResult.error ? '#dc2626' : '#16a34a' }}>
                      {importResult.error
                        ? <><Icons.XCircle size={18} /> Import Failed</>
                        : <><Icons.CheckCircle size={18} /> Import Successful — {importResult.inserted} products added!</>
                      }
                    </div>
                    {importResult.error && <p style={{ fontSize: '0.8rem', color: '#dc2626' }}>{importResult.error}</p>}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>⚠️ Row Warnings ({importResult.errors.length})</p>
                        {importResult.errors.map((e, i) => (
                          <p key={i} style={{ fontSize: '0.72rem', color: '#b45309' }}>• {e}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={resetExcelImport}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Icons.RotateCcw size={15} /> Reset
                  </button>
                  <button
                    onClick={handleBulkImport}
                    disabled={!excelFile || excelPreviewRows.length === 0 || isImporting}
                    style={{
                      padding: '10px 22px', borderRadius: '10px',
                      background: (!excelFile || isImporting) ? '#cbd5e1' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', fontWeight: 800, fontSize: '0.88rem',
                      cursor: (!excelFile || isImporting) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: (!excelFile || isImporting) ? 'none' : '0 4px 12px rgba(16,185,129,0.3)'
                    }}
                  >
                    {isImporting
                      ? <><Icons.Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Importing...</>
                      : <><Icons.Upload size={16} /> Import {excelPreviewRows.length > 0 ? `${excelPreviewRows.length}+ Products` : 'Products'}</>
                    }
                  </button>
                </div>
              </div>
            )}

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Packshot</th>
                    <th>Medicine Name</th>
                    <th>Composition</th>
                    <th>Therapeutic Category</th>
                    <th>MRP</th>
                    <th>New Launch</th>
                    <th>Slides / Video</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((prod) => (
                      <tr key={prod.id}>
                        <td>
                          <div 
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-admin)',
                              background: '#f8fafc',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {prod.packshot ? (
                              <img 
                                src={prod.packshot.startsWith('http') ? prod.packshot : `${IMAGE_BASE}${prod.packshot}`} 
                                alt="pack" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <Icons.Package size={20} color="#94a3b8" />
                            )}
                          </div>
                        </td>
                        <td className="product-row-title">{prod.name}</td>
                        <td style={{ fontSize: '0.85rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prod.composition}
                        </td>
                        <td>
                          <span className="badge-category">{getCategoryName(prod.categoryId)}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                          {prod.mrp ? (String(prod.mrp).includes('₹') ? prod.mrp : `₹${prod.mrp}`) : '—'}
                        </td>
                        <td>
                          {prod.isNewLaunch ? (
                            <span style={{ color: '#10b981', fontWeight: '800', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.Sparkles size={12} /> Yes
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem', fontWeight: 600 }}>
                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.Image size={12} /> {prod.visualAids?.length || 0} slides
                            </span>
                            <span style={{ color: prod.videoUrl ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.Video size={12} /> {prod.videoUrl ? 'Link active' : 'No link'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-action-icon" 
                              title="Edit Product"
                              onClick={() => openEditProductModal(prod)}
                            >
                              <Icons.Edit2 size={14} />
                            </button>
                            <button 
                              className="btn-action-icon delete" 
                              title="Delete Product"
                              onClick={() => handleDeleteProduct(prod.id)}
                            >
                              <Icons.Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-admin-muted)' }}>
                        No products found. Click &quot;Add New Medicine&quot; to begin building your catalog.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MENU: Categories Manager --- */}
        {activeMenu === 'categories' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'start' }}>
            {/* Create Category form */}
            <div className="admin-card-container" style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '16px' }}>
                Add New Class
              </h3>
              <form onSubmit={handleCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Cardiology, Gastrointestinal"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Short Description</label>
                  <textarea
                    placeholder="Brief description of formulations in this therapeutic class"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="form-control"
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>UI Theme Icon</label>
                  <select 
                    value={newCatIcon} 
                    onChange={(e) => setNewCatIcon(e.target.value)} 
                    className="form-control"
                  >
                    <option value="Activity">Activity (Gastro)</option>
                    <option value="Droplet">Droplet (Injections)</option>
                    <option value="Shield">Shield (Dental)</option>
                    <option value="Zap">Zap (Pain Relief)</option>
                    <option value="Heart">Heart (Derma)</option>
                    <option value="Wind">Wind (Cough/Cold)</option>
                    <option value="Brain">Brain (Neurology)</option>
                    <option value="Eye">Eye (Ophthalmology)</option>
                  </select>
                </div>
                <button type="submit" className="btn-admin-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Icons.FolderPlus size={16} /> Save Category
                </button>
              </form>
            </div>

            {/* Categories list table */}
            <div className="admin-card-container">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Icon</th>
                      <th>Class Title</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td style={{ color: '#10b981' }}>
                          {c.icon === 'Activity' && <Icons.Activity size={20} />}
                          {c.icon === 'Droplet' && <Icons.Droplet size={20} />}
                          {c.icon === 'Shield' && <Icons.Shield size={20} />}
                          {c.icon === 'Zap' && <Icons.Zap size={20} />}
                          {c.icon === 'Heart' && <Icons.Heart size={20} />}
                          {c.icon === 'Wind' && <Icons.Wind size={20} />}
                          {c.icon === 'Brain' && <Icons.Brain size={20} />}
                          {c.icon === 'Eye' && <Icons.Eye size={20} />}
                          {!['Activity', 'Droplet', 'Shield', 'Zap', 'Heart', 'Wind', 'Brain', 'Eye'].includes(c.icon) && <Icons.Layers size={20} />}
                        </td>
                        <td className="product-row-title">{c.name}</td>
                        <td style={{ fontSize: '0.85rem' }}>{c.description || 'No description provided.'}</td>
                        <td>
                          <button 
                            className="btn-action-icon delete" 
                            title="Delete Category"
                            onClick={() => handleDeleteCategory(c.id)}
                          >
                            <Icons.Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- MENU: Bumper Offers CRUD --- */}
        {activeMenu === 'offers' && (
          <div className="admin-card-container">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Flyer</th>
                    <th>Offer Title</th>
                    <th>Scheme / Discount</th>
                    <th>Linked Product</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.length > 0 ? (
                    offers.map((offer) => (
                      <tr key={offer.id}>
                        <td>
                          <div 
                            style={{
                              width: '56px',
                              height: '40px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-admin)',
                              background: '#f8fafc',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {offer.imageUrl ? (
                              <img 
                                src={offer.imageUrl.startsWith('http') ? offer.imageUrl : `${IMAGE_BASE}${offer.imageUrl}`} 
                                alt="flyer" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Icons.BadgePercent size={20} color="#94a3b8" />
                            )}
                          </div>
                        </td>
                        <td className="product-row-title">{offer.title}</td>
                        <td>
                          <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
                            {offer.discount}
                          </span>
                        </td>
                        <td>{getProductName(offer.productId)}</td>
                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{offer.expiry || 'N/A'}</td>
                        <td>
                          <button 
                            className="btn-action-icon delete" 
                            title="Delete Offer"
                            onClick={() => handleDeleteOffer(offer.id)}
                          >
                            <Icons.Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-admin-muted)' }}>
                        No active offers found. Click &quot;Create Running Offer&quot; to publish bumper schemes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MENU: User Registration Verification Approvals --- */}
        {activeMenu === 'approvals' && (
          <>
            {/* Table Tabs Filter */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-admin)', paddingBottom: '12px' }}>
              <button 
                onClick={() => setActiveRegTab('pending')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: activeRegTab === 'pending' ? '#10b981' : '#64748b',
                  background: activeRegTab === 'pending' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Pending Requests <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>{pendingRegistrations.length}</span>
              </button>
              <button 
                onClick={() => setActiveRegTab('approved')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: activeRegTab === 'approved' ? '#10b981' : '#64748b',
                  background: activeRegTab === 'approved' ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                }}
              >
                Approved Partners ({approvedRegistrations.length})
              </button>
              <button 
                onClick={() => setActiveRegTab('denied')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: activeRegTab === 'denied' ? '#ef4444' : '#64748b',
                  background: activeRegTab === 'denied' ? 'rgba(239, 68, 68, 0.08)' : 'transparent'
                }}
              >
                Denied Applications ({deniedRegistrations.length})
              </button>
            </div>

            {/* List Table */}
            <div className="admin-card-container">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Firm details</th>
                      <th>Owner name</th>
                      <th>Contact details</th>
                      <th>Drug License</th>
                      <th>GST / PAN Copy</th>
                      {activeRegTab === 'approved' && <th>Generated Credentials</th>}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeRegTab === 'pending' ? pendingRegistrations : 
                      activeRegTab === 'approved' ? approvedRegistrations : deniedRegistrations
                     ).length > 0 ? (
                      (activeRegTab === 'pending' ? pendingRegistrations : 
                       activeRegTab === 'approved' ? approvedRegistrations : deniedRegistrations
                      ).map((reg) => (
                        <tr key={reg.id}>
                          <td className="product-row-title" style={{ fontSize: '1rem' }}>
                            {reg.firmName}
                            <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#64748b', marginTop: '2px' }}>
                              Applied: {new Date(reg.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td>{reg.ownerName}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                              <span style={{ fontWeight: 600 }}>{reg.mobile}</span>
                              <span style={{ color: '#64748b' }}>{reg.email}</span>
                            </div>
                          </td>
                          {/* Drug license view with click-zoom handler */}
                          <td>
                            <div 
                              className="doc-thumbnail"
                              onClick={() => setZoomedImage(reg.drugLicence || 'https://images.unsplash.com/photo-1586075010923-2dd45e9b2d4f?w=800')}
                              title="Click to zoom license paper"
                            >
                              {reg.drugLicence ? (
                                <img src={reg.drugLicence.startsWith('http') ? reg.drugLicence : `${IMAGE_BASE}${reg.drugLicence}`} alt="License" />
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '6px', fontSize: '0.65rem', color: '#94a3b8' }}>
                                  <Icons.FileText size={18} /> View Document
                                </div>
                              )}
                            </div>
                          </td>
                          {/* GST / PAN Certificate view with click-zoom handler */}
                          <td>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              {reg.gst ? (
                                <div 
                                  className="doc-thumbnail"
                                  onClick={() => setZoomedImage(reg.gst)}
                                  title="Click to zoom GST copy"
                                  style={{ width: '60px', height: '45px', flexShrink: 0, position: 'relative' }}
                                >
                                  <img src={reg.gst.startsWith('http') ? reg.gst : `${IMAGE_BASE}${reg.gst}`} alt="GST" />
                                  <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.55rem', textAlign: 'center', fontWeight: 'bold' }}>GST</span>
                                </div>
                              ) : null}
                              {reg.pan ? (
                                <div 
                                  className="doc-thumbnail"
                                  onClick={() => setZoomedImage(reg.pan)}
                                  title="Click to zoom PAN card"
                                  style={{ width: '60px', height: '45px', flexShrink: 0, position: 'relative' }}
                                >
                                  <img src={reg.pan.startsWith('http') ? reg.pan : `${IMAGE_BASE}${reg.pan}`} alt="PAN" />
                                  <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.55rem', textAlign: 'center', fontWeight: 'bold' }}>PAN</span>
                                </div>
                              ) : null}
                              {!reg.gst && !reg.pan && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '6px', fontSize: '0.65rem', color: '#94a3b8' }}>
                                  <Icons.FileText size={18} /> No Document
                                </div>
                              )}
                            </div>
                          </td>
                          {/* If approved, show username/password */}
                          {activeRegTab === 'approved' && (
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', gap: '2px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'max-content' }}>
                                <span>Username: <strong style={{ color: '#0f172a' }}>{reg.loginDetails?.username}</strong></span>
                                <span>Password: <strong style={{ color: '#0f172a' }}>{reg.loginDetails?.password}</strong></span>
                              </div>
                            </td>
                          )}
                          <td>
                            {reg.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="btn-admin-primary" 
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 2px 6px rgba(16,185,129,0.2)' }}
                                  onClick={() => openApprovalModal(reg)}
                                >
                                  <Icons.Check size={14} /> Approve
                                </button>
                                <button 
                                  className="btn-admin-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                                  onClick={() => handleDenyRegistration(reg.id)}
                                >
                                  <Icons.X size={14} /> Deny
                                </button>
                              </div>
                            ) : reg.status === 'approved' ? (
                              <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Icons.UserCheck size={16} /> Activated
                              </span>
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Icons.UserX size={16} /> Rejected
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={activeRegTab === 'approved' ? "7" : "6"} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-admin-muted)' }}>
                          No records found in this category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* --- MENU: Branding & Homepage Banners Settings --- */}
        {activeMenu === 'branding' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', animation: 'fadeIn 0.25s ease-out' }}>
            {/* Column 1: Branding & Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Card 1: Branding settings */}
              <div className="admin-card-container" style={{ padding: '24px', height: 'max-content' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid var(--border-admin)', paddingBottom: '12px' }}>
                  <Icons.Palette size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                  Company Branding
                </h3>

                <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. RIOMEDICA" 
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Tagline / Department</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Healthcare" 
                      value={brandTag}
                      onChange={(e) => setBrandTag(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Brand Logo Image (Square)</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                      <div 
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-admin)',
                          background: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        {brandFile ? (
                          <img src={URL.createObjectURL(brandFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : branding.logo ? (
                          <img src={branding.logo.startsWith('http') ? branding.logo : `${IMAGE_BASE}${branding.logo}`} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Icons.Image size={24} color="#94a3b8" />
                        )}
                      </div>
                      <div>
                        <button 
                          type="button" 
                          className="btn-admin-secondary"
                          onClick={() => document.getElementById('logo-file-input').click()}
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                        >
                          Change Logo
                        </button>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-admin-muted)', display: 'block', marginTop: '4px' }}>PNG or JPG, square aspect ratio recommended</span>
                      </div>
                    </div>
                    <input 
                      id="logo-file-input" 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setBrandFile(e.target.files[0])}
                    />
                  </div>

                   <div className="form-group">
                    <label>Landing Welcome Title</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Welcome to Intra Life" 
                      value={brandLandingTitle}
                      onChange={(e) => setBrandLandingTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Landing Welcome Description</label>
                    <textarea 
                      className="form-control"
                      placeholder="e.g. Where we provide premium pharmaceutical products..." 
                      value={brandLandingDesc}
                      onChange={(e) => setBrandLandingDesc(e.target.value)}
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Landing Background Image</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                      <div 
                        style={{
                          width: '96px',
                          height: '54px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-admin)',
                          background: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        {brandLandingBgFile ? (
                          <img src={URL.createObjectURL(brandLandingBgFile)} alt="Bg Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : branding.landingBgImage ? (
                          <img src={branding.landingBgImage.startsWith('http') ? branding.landingBgImage : `${IMAGE_BASE}${branding.landingBgImage}`} alt="Current Bg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Icons.Image size={24} color="#94a3b8" />
                        )}
                      </div>
                      <div>
                        <button 
                          type="button" 
                          className="btn-admin-secondary"
                          onClick={() => document.getElementById('landing-bg-file-input').click()}
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                        >
                          Change Background Image
                        </button>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-admin-muted)', display: 'block', marginTop: '4px' }}>PNG or JPG, 16:9 aspect ratio recommended</span>
                      </div>
                    </div>
                    <input 
                      id="landing-bg-file-input" 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setBrandLandingBgFile(e.target.files[0])}
                    />
                  </div>

                  <div className="form-group">
                    <label>Top-Right Corner Badge Image</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                      <div 
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-admin)',
                          background: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        {brandBadgeFile ? (
                          <img src={URL.createObjectURL(brandBadgeFile)} alt="Badge Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : branding.topRightBadge ? (
                          <img src={branding.topRightBadge.startsWith('http') ? branding.topRightBadge : `${IMAGE_BASE}${branding.topRightBadge}`} alt="Current Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Icons.Image size={24} color="#94a3b8" />
                        )}
                      </div>
                      <div>
                        <button 
                          type="button" 
                          className="btn-admin-secondary"
                          onClick={() => document.getElementById('badge-file-input').click()}
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                        >
                          Change Badge Image
                        </button>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-admin-muted)', display: 'block', marginTop: '4px' }}>PNG format recommended</span>
                      </div>
                    </div>
                    <input 
                      id="badge-file-input" 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setBrandBadgeFile(e.target.files[0])}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-admin-primary"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                    disabled={isSavingBranding}
                  >
                    <Icons.Save size={16} />
                    {isSavingBranding ? 'Saving Settings...' : 'Save Branding Changes'}
                  </button>
                </form>
              </div>

              {/* Card 2: System Configuration settings */}
              <div className="admin-card-container" style={{ padding: '24px', height: 'max-content' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid var(--border-admin)', paddingBottom: '12px' }}>
                  <Icons.Cpu size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                  System Configuration
                </h3>

                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label>Google Gemini API Key</label>
                    <input 
                      type="password" 
                      className="form-control"
                      placeholder="e.g. AIzaSy..." 
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-admin-muted)', display: 'block', marginTop: '4px' }}>
                      Allows Riobot AI Assistant to handle multilingual catalog searches and product details requests.
                    </span>
                  </div>

                  <div className="form-group" style={{ borderTop: '1px solid var(--border-admin)', paddingTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icons.Mail size={16} color="#10b981" /> OTP Delivery Channel
                    </label>
                    <select
                      className="form-control"
                      value={otpChannel}
                      onChange={(e) => setOtpChannel(e.target.value)}
                      style={{ marginTop: '8px' }}
                    >
                      <option value="mock">Simulated OTP (On-Screen Mock Alert)</option>
                      <option value="smtp">Gmail SMTP Email Gateway (Real-Time)</option>
                    </select>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-admin-muted)', display: 'block', marginTop: '4px' }}>
                      Choose how OTP codes are delivered for firm registration and user log-in.
                    </span>
                  </div>

                  {otpChannel === 'smtp' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-admin)' }}>
                      <div className="form-group">
                        <label>Sender Gmail Address</label>
                        <input 
                          type="email" 
                          className="form-control"
                          placeholder="e.g. yourname@gmail.com" 
                          value={smtpEmail}
                          onChange={(e) => setSmtpEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Gmail SMTP App Password</label>
                        <input 
                          type="password" 
                          className="form-control"
                          placeholder="16-character App Password" 
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-admin-muted)', display: 'block', marginTop: '4px' }}>
                          Create a 16-character Google App Password in your Google Account Security settings.
                        </span>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn-admin-primary"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                    disabled={isSavingSettings}
                  >
                    <Icons.Save size={16} />
                    {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
                  </button>
                </form>
              </div>
            </div>

            {/* Column 2: Banner manager */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Form to Add Banners */}
              <div className="admin-card-container" style={{ padding: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid var(--border-admin)', paddingBottom: '12px' }}>
                  <Icons.PlusCircle size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                  Add Homepage Banner
                </h3>

                <form onSubmit={handleAddBanner} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Banner Title / Headline</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="e.g. Monsoon Critical Care Offer" 
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Redirect link URL (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="e.g. /offers" 
                        value={bannerLink}
                        onChange={(e) => setBannerLink(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Promo Image *</label>
                    <div 
                      className="file-drop-zone"
                      onClick={() => document.getElementById('banner-file-input').click()}
                      style={{ padding: '16px' }}
                    >
                      <Icons.UploadCloud size={24} style={{ color: '#10b981', margin: '0 auto 6px auto' }} />
                      <div className="file-drop-text" style={{ fontSize: '0.8rem' }}>
                        {bannerFile ? bannerFile.name : 'Select promo slider banner image (16:9 recommended)'}
                      </div>
                    </div>
                    <input 
                      id="banner-file-input" 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setBannerFile(e.target.files[0])}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-admin-primary"
                    style={{ width: 'max-content', alignSelf: 'flex-end', padding: '10px 20px' }}
                    disabled={isAddingBanner}
                  >
                    <Icons.Upload size={16} />
                    {isAddingBanner ? 'Uploading...' : 'Add Banner to Slideshow'}
                  </button>
                </form>
              </div>

              {/* Banners List */}
              <div className="admin-card-container" style={{ padding: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid var(--border-admin)', paddingBottom: '12px' }}>
                  <Icons.Image size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                  Active Homepage Banners ({banners.length})
                </h3>

                {banners.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {banners.map((ban) => (
                      <div 
                        key={ban.id} 
                        style={{
                          border: '1px solid var(--border-admin)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: '#f8fafc',
                          position: 'relative'
                        }}
                      >
                        <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                          <img 
                            src={ban.imageUrl.startsWith('http') ? ban.imageUrl : `${IMAGE_BASE}${ban.imageUrl}`} 
                            alt={ban.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                        <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                          <div style={{ overflow: 'hidden' }}>
                            <h4 style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ban.title || 'Untitled Banner'}</h4>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-admin-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ban.linkUrl || 'No link action'}</span>
                          </div>
                          <button 
                            className="btn-action-icon delete"
                            onClick={() => handleDeleteBanner(ban.id)}
                            title="Delete Banner"
                            style={{ padding: '6px', width: '28px', height: '28px', flexShrink: 0 }}
                          >
                            <Icons.Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-admin-muted)', fontSize: '0.9rem' }}>
                    No active banners found. Upload one above!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- MENU: B2B Orders Tracker --- */}
        {activeMenu === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.25s ease-out' }}>
            <div className="admin-card-container" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-admin)', paddingBottom: '12px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800 }}>
                  <Icons.ShoppingCart size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                  Incoming Orders Logs
                </h3>
                <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {orders.length} Total Orders
                </span>
              </div>

              {orders.length > 0 ? (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Firm / Pharmacy Name</th>
                        <th>Rep / Owner</th>
                        <th>Ordered Products & Qty</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((ord) => {
                        const dateStr = new Date(ord.createdAt).toLocaleString();
                        return (
                          <tr key={ord.id}>
                            <td style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{dateStr}</td>
                            <td>
                              <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{ord.firmName}</strong>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: '#334155' }}>{ord.userName}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {ord.items.map((item, idx) => (
                                  <div key={idx} style={{ fontSize: '0.78rem', color: '#1e293b' }}>
                                    <span style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.1)', color: '#047857', padding: '1px 6px', borderRadius: '4px', marginRight: '6px', fontWeight: 'bold' }}>
                                      x{item.quantity}
                                    </span>
                                    {item.productName}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span 
                                style={{
                                  display: 'inline-block',
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  textTransform: 'uppercase',
                                  background: ord.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  color: ord.status === 'Completed' ? '#10b981' : '#d97706',
                                  border: ord.status === 'Completed' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                                }}
                              >
                                {ord.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  className="btn-action-icon"
                                  onClick={async () => {
                                    const nextStatus = ord.status === 'Completed' ? 'Pending' : 'Completed';
                                    try {
                                      await updateOrderStatus(ord.id, nextStatus);
                                      await syncToFirebase(); // 🔥 Auto-sync to Firebase
                                    } catch (err) {
                                      alert("Failed to update status");
                                    }
                                  }}
                                  title={ord.status === 'Completed' ? "Mark Pending" : "Mark Completed"}
                                  style={{
                                    background: ord.status === 'Completed' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: ord.status === 'Completed' ? '#d97706' : '#10b981',
                                    border: ord.status === 'Completed' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {ord.status === 'Completed' ? <Icons.Clock size={14} /> : <Icons.Check size={14} />}
                                </button>
                                <button
                                  className="btn-action-icon delete"
                                  onClick={async () => {
                                    if (confirm("Are you sure you want to delete this order record?")) {
                                      try {
                                        await deleteOrder(ord.id);
                                        await syncToFirebase(); // 🔥 Auto-sync to Firebase
                                      } catch (err) {
                                        alert("Failed to delete order");
                                      }
                                    }
                                  }}
                                  title="Delete Order Record"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Icons.Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-admin-muted)' }}>
                  <Icons.ShoppingCart size={48} style={{ margin: '0 auto 12px auto', color: '#cbd5e1' }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No B2B orders received yet.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Orders submitted by Franchise Partners via their shopping carts will show up here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MENU: Security & Access Control --- */}
        {activeMenu === 'security' && (() => {
          const cardStyle = { background: 'var(--bg-admin-card, rgba(10,15,30,0.7))', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '18px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.25s ease-out' };
          const sectionLabel = { fontSize: '0.7rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '6px', display: 'block' };
          const fieldStyle = { width: '100%', padding: '12px 16px 12px 42px', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
          const btnPrimary = { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '10px', padding: '12px 22px', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s' };
          const btnSecondary = { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontWeight: 700, borderRadius: '10px', padding: '11px 20px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '7px' };
          const btnDanger = { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontWeight: 700, borderRadius: '10px', padding: '11px 20px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '7px' };

          const handle2FASetup = async () => {
            setSetup2FALoading(true);
            setSecurityMsg({ type: '', text: '' });
            try {
              const data = await setupAdmin2FA();
              setSetup2FAData(data);
            } catch (err) {
              setSecurityMsg({ type: 'error', text: 'Failed to generate 2FA setup. Try again.' });
            } finally {
              setSetup2FALoading(false);
            }
          };

          const handleEnable2FA = async () => {
            if (!setup2FAData || !setup2FACode) return;
            setSetup2FALoading(true);
            setSecurityMsg({ type: '', text: '' });
            try {
              const res = await enableAdmin2FA(setup2FAData.secret, setup2FACode);
              setSecurityStatus({ twoFactorEnabled: true });
              setSetup2FAData(null);
              setSetup2FACode('');
              setSecurityMsg({ type: 'success', text: res.message || 'Google Authenticator 2FA enabled successfully!' });
            } catch (err) {
              setSecurityMsg({ type: 'error', text: err.message || 'Invalid code. Please try again.' });
            } finally {
              setSetup2FALoading(false);
            }
          };

          const handleDisable2FA = async () => {
            setDisable2FALoading(true);
            setSecurityMsg({ type: '', text: '' });
            try {
              const payload = useDisableBackupOtp ? { fallbackOtp: disableBackupOtp } : { code: disable2FACode };
              const res = await disableAdmin2FA(payload);
              setSecurityStatus({ twoFactorEnabled: false });
              setDisable2FACode('');
              setDisableBackupOtp('');
              setUseDisableBackupOtp(false);
              setDisableBackupOtpSent(false);
              setSecurityMsg({ type: 'success', text: res.message || '2FA disabled successfully.' });
            } catch (err) {
              setSecurityMsg({ type: 'error', text: err.message || 'Invalid code.' });
            } finally {
              setDisable2FALoading(false);
            }
          };

          const handleSendChangePwdOtp = async () => {
            setChangePwdLoading(true);
            setSecurityMsg({ type: '', text: '' });
            try {
              await sendGmailOtp(ADMIN_EMAIL);
              setChangePwdOtpSent(true);
              setSecurityMsg({ type: 'success', text: `OTP sent to ${ADMIN_EMAIL}` });
            } catch (err) {
              setSecurityMsg({ type: 'error', text: 'Failed to send OTP. Try again.' });
            } finally {
              setChangePwdLoading(false);
            }
          };

          const handleChangePassword = async () => {
            if (!newAdminPassword || newAdminPassword !== confirmAdminPassword) {
              setSecurityMsg({ type: 'error', text: 'Passwords do not match or are empty.' });
              return;
            }
            if (!changePwdOtp) {
              setSecurityMsg({ type: 'error', text: 'OTP is required to change password.' });
              return;
            }
            setChangePwdLoading(true);
            setSecurityMsg({ type: '', text: '' });
            try {
              const res = await changeAdminPassword(newAdminPassword, changePwdOtp);
              setNewAdminPassword('');
              setConfirmAdminPassword('');
              setChangePwdOtp('');
              setChangePwdOtpSent(false);
              setSecurityMsg({ type: 'success', text: res.message || 'Password changed successfully!' });
            } catch (err) {
              setSecurityMsg({ type: 'error', text: err.message || 'Failed to change password.' });
            } finally {
              setChangePwdLoading(false);
            }
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px', animation: 'fadeIn 0.25s ease-out' }}>

              {/* Global feedback message */}
              {securityMsg.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: securityMsg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${securityMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px', color: securityMsg.type === 'success' ? '#34d399' : '#f87171', fontSize: '0.88rem', fontWeight: 600 }}>
                  {securityMsg.type === 'success' ? <Icons.CheckCircle2 size={18} /> : <Icons.AlertTriangle size={18} />}
                  {securityMsg.text}
                </div>
              )}

              {/* ---- CARD 1: 2FA Status & Setup ---- */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.Smartphone size={22} color="#10b981" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Google Authenticator 2FA</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>2-Step Verification via TOTP authenticator app</p>
                    </div>
                  </div>
                  <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, background: securityStatus.twoFactorEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: securityStatus.twoFactorEnabled ? '#10b981' : '#64748b', border: `1px solid ${securityStatus.twoFactorEnabled ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)'}` }}>
                    {securityStatus.twoFactorEnabled ? '✓ ENABLED' : '✗ DISABLED'}
                  </span>
                </div>

                {!securityStatus.twoFactorEnabled ? (
                  <>
                    {!setup2FAData ? (
                      <button onClick={handle2FASetup} disabled={setup2FALoading} style={btnPrimary}>
                        {setup2FALoading ? <Icons.Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Icons.QrCode size={16} />}
                        {setup2FALoading ? 'Generating...' : 'Setup Google Authenticator'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          <div style={{ textAlign: 'center' }}>
                            <img src={setup2FAData.qrCodeUrl} alt="2FA QR Code" style={{ width: '160px', height: '160px', borderRadius: '12px', border: '2px solid rgba(16,185,129,0.3)', display: 'block' }} />
                            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px' }}>Scan with Google Authenticator</p>
                          </div>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <span style={sectionLabel}>Manual Entry Key</span>
                            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#34d399', letterSpacing: '2px', wordBreak: 'break-all' }}>
                              {setup2FAData.secret}
                            </div>
                            <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '8px', lineHeight: '1.5' }}>
                              Open Google Authenticator → tap + → scan QR or enter the key above. Then enter the 6-digit code shown in the app to verify and activate.
                            </p>
                          </div>
                        </div>
                        <div>
                          <span style={sectionLabel}>Verification Code from App</span>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <Icons.KeyRound size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                              <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={setup2FACode} onChange={e => setSetup2FACode(e.target.value)} style={{ ...fieldStyle, letterSpacing: '6px', fontWeight: 800, textAlign: 'center', fontSize: '1.1rem' }} />
                            </div>
                            <button onClick={handleEnable2FA} disabled={setup2FACode.length !== 6 || setup2FALoading} style={{ ...btnPrimary, opacity: setup2FACode.length !== 6 ? 0.6 : 1, cursor: setup2FACode.length !== 6 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                              {setup2FALoading ? 'Verifying...' : <><Icons.ShieldCheck size={15} /> Activate 2FA</>}
                            </button>
                            <button onClick={() => { setSetup2FAData(null); setSetup2FACode(''); }} style={{ ...btnDanger, whiteSpace: 'nowrap' }}>
                              <Icons.X size={15} /> Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '14px 16px' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                        <Icons.ShieldCheck size={14} style={{ display: 'inline', marginRight: '6px', color: '#10b981', verticalAlign: 'middle' }} />
                        Google Authenticator is active. Every login requires a valid TOTP code from your authenticator app.
                      </p>
                    </div>
                    <div>
                      <span style={sectionLabel}>Disable 2FA — Enter Authenticator Code</span>
                      {!useDisableBackupOtp ? (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                            <Icons.Smartphone size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit TOTP code" value={disable2FACode} onChange={e => setDisable2FACode(e.target.value)} style={{ ...fieldStyle, letterSpacing: '4px', fontWeight: 700 }} />
                          </div>
                          <button onClick={handleDisable2FA} disabled={disable2FACode.length !== 6 || disable2FALoading} style={{ ...btnDanger, opacity: disable2FACode.length !== 6 ? 0.6 : 1, cursor: disable2FACode.length !== 6 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                            {disable2FALoading ? 'Disabling...' : <><Icons.ShieldOff size={15} /> Disable 2FA</>}
                          </button>
                          <button onClick={() => setUseDisableBackupOtp(true)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.76rem', cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                            Use backup email OTP
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {!disableBackupOtpSent ? (
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>Send a backup OTP to <strong style={{ color: '#34d399' }}>{ADMIN_EMAIL}</strong> to disable 2FA.</p>
                              <button onClick={async () => { try { await sendGmailOtp(ADMIN_EMAIL); setDisableBackupOtpSent(true); } catch { setSecurityMsg({ type: 'error', text: 'Failed to send OTP.' }); } }} style={{ ...btnSecondary, whiteSpace: 'nowrap' }}>
                                <Icons.Mail size={14} /> Send OTP
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                                <Icons.KeyRound size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input type="text" inputMode="numeric" maxLength={6} placeholder="Backup OTP" value={disableBackupOtp} onChange={e => setDisableBackupOtp(e.target.value)} style={{ ...fieldStyle, letterSpacing: '4px', fontWeight: 700 }} />
                              </div>
                              <button onClick={handleDisable2FA} disabled={disableBackupOtp.length < 4 || disable2FALoading} style={{ ...btnDanger, opacity: disableBackupOtp.length < 4 ? 0.6 : 1, cursor: disableBackupOtp.length < 4 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                                {disable2FALoading ? 'Disabling...' : <><Icons.ShieldOff size={15} /> Disable 2FA</>}
                              </button>
                            </div>
                          )}
                          <button onClick={() => { setUseDisableBackupOtp(false); setDisableBackupOtpSent(false); setDisableBackupOtp(''); }} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', textAlign: 'left' }}>
                            ← Back to TOTP code
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ---- CARD 2: Change Admin Password ---- */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.KeyRound size={22} color="#10b981" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Change Administrator Password</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Requires email OTP verification to {ADMIN_EMAIL}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <span style={sectionLabel}>New Password</span>
                    <div style={{ position: 'relative' }}>
                      <Icons.Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input type="password" placeholder="Enter new password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} style={fieldStyle} />
                    </div>
                  </div>
                  <div>
                    <span style={sectionLabel}>Confirm Password</span>
                    <div style={{ position: 'relative' }}>
                      <Icons.Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input type="password" placeholder="Confirm new password" value={confirmAdminPassword} onChange={e => setConfirmAdminPassword(e.target.value)} style={{ ...fieldStyle, borderColor: confirmAdminPassword && newAdminPassword !== confirmAdminPassword ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.2)' }} />
                    </div>
                    {confirmAdminPassword && newAdminPassword !== confirmAdminPassword && (
                      <p style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '4px' }}>Passwords do not match</p>
                    )}
                  </div>
                </div>

                <div>
                  <span style={sectionLabel}>Gmail OTP Verification</span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                      <Icons.KeyRound size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={changePwdOtp} onChange={e => setChangePwdOtp(e.target.value)} style={{ ...fieldStyle, letterSpacing: '4px', fontWeight: 700 }} />
                    </div>
                    <button onClick={handleSendChangePwdOtp} disabled={changePwdLoading || changePwdOtpSent} style={{ ...btnSecondary, opacity: changePwdOtpSent ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                      {changePwdOtpSent ? <><Icons.Check size={14} /> Sent</> : <><Icons.Mail size={14} /> Send OTP</>}
                    </button>
                  </div>
                  {changePwdOtpSent && <p style={{ color: '#34d399', fontSize: '0.73rem', marginTop: '6px' }}>✓ OTP sent to {ADMIN_EMAIL}. Check your inbox.</p>}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleChangePassword} disabled={changePwdLoading || !changePwdOtpSent || !newAdminPassword || newAdminPassword !== confirmAdminPassword} style={{ ...btnPrimary, opacity: (changePwdLoading || !changePwdOtpSent || !newAdminPassword || newAdminPassword !== confirmAdminPassword) ? 0.55 : 1, cursor: (!changePwdOtpSent || !newAdminPassword || newAdminPassword !== confirmAdminPassword) ? 'not-allowed' : 'pointer' }}>
                    {changePwdLoading ? <><Icons.Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</> : <><Icons.ShieldCheck size={15} /> Update Password</>}
                  </button>
                  <button onClick={() => { setNewAdminPassword(''); setConfirmAdminPassword(''); setChangePwdOtp(''); setChangePwdOtpSent(false); setSecurityMsg({ type: '', text: '' }); }} style={{ ...btnSecondary }}>
                    <Icons.RotateCcw size={15} /> Reset
                  </button>
                </div>
              </div>

              {/* ---- CARD 3: Security Info ---- */}
              <div style={{ ...cardStyle, background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <Icons.Info size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, margin: '0 0 8px' }}>Security Notes</h4>
                    <ul style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: '1.8', margin: 0, paddingLeft: '18px' }}>
                      <li>All admin write operations (products, orders, settings, banners) require a valid session token.</li>
                      <li>When 2FA is enabled, every login requires your Google Authenticator code <em>after</em> first-factor verification.</li>
                      <li>Password changes always require an email OTP sent to <strong style={{ color: '#34d399' }}>{ADMIN_EMAIL}</strong>.</li>
                      <li>Backup email OTP can be used if Google Authenticator is unavailable.</li>
                      <li>Sessions are invalidated on logout and are not persisted across server restarts.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* --- MODAL: Add/Edit Product Form --- */}
      {isProductModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProduct ? 'Modify Medicine Details' : 'Add New Medicine to Catalog'}</h3>
              <button onClick={() => setIsProductModalOpen(false)} style={{ color: '#64748b' }}>
                <Icons.X size={20} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Medicine Brand Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., Rabrio D" 
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Therapeutic Category *</label>
                    <select 
                      className="form-control"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Chemical Composition *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., Rabeprazole Sodium 20mg + Domperidone 30mg SR" 
                      value={prodComposition}
                      onChange={(e) => setProdComposition(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Maximum Retail Price (MRP)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., 150.00" 
                      value={prodMrp}
                      onChange={(e) => setProdMrp(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ alignItems: 'center', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Clinical Indications (Treats...)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., Hyperacidity, GERD" 
                      value={prodIndications}
                      onChange={(e) => setProdIndications(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%', marginTop: '22px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-admin-secondary)' }}>
                      <input 
                        type="checkbox" 
                        checked={prodIsNewLaunch}
                        onChange={(e) => setProdIsNewLaunch(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      Mark as New Product Launch
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Dosage & Administration Guidelines</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g., 1 tablet daily, 30 minutes before breakfast" 
                    value={prodDosage}
                    onChange={(e) => setProdDosage(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Leave Behind Literature (LBL Highlights)</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Short scientific description or therapeutic benefits of the product..." 
                    value={prodLbl}
                    onChange={(e) => setProdLbl(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label>Promotional Detailing Video (YouTube Embed URL)</label>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="e.g., https://www.youtube.com/embed/..." 
                    value={prodVideoUrl}
                    onChange={(e) => setProdVideoUrl(e.target.value)}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Product Packshot (Packaging Image)</label>
                    <div 
                      className="file-drop-zone"
                      onClick={() => document.getElementById('packshot-file-input').click()}
                    >
                      <Icons.UploadCloud size={24} style={{ color: '#10b981', margin: '0 auto' }} />
                      <div className="file-drop-text">
                        {prodPackshotFile ? prodPackshotFile.name : 'Select packshot carton image'}
                      </div>
                    </div>
                    <input 
                      id="packshot-file-input" 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setProdPackshotFile(e.target.files[0])}
                    />
                    
                    {editingProduct && editingProduct.packshot && !prodPackshotFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-admin-muted)' }}>Current:</span>
                        <img 
                          src={editingProduct.packshot.startsWith('http') ? editingProduct.packshot : `${IMAGE_BASE}${editingProduct.packshot}`} 
                          alt="existing-pack" 
                          style={{ width: '40px', height: '40px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Detailer Visual Aids (Slides - Upload multiple)</label>
                    <div 
                      className="file-drop-zone"
                      onClick={() => document.getElementById('slides-file-input').click()}
                    >
                      <Icons.UploadCloud size={24} style={{ color: '#10b981', margin: '0 auto' }} />
                      <div className="file-drop-text">
                        {prodVisualAidsFiles.length > 0 
                          ? `${prodVisualAidsFiles.length} slides selected` 
                          : 'Select promotional presentation slides'}
                      </div>
                    </div>
                    <input 
                      id="slides-file-input" 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      style={{ display: 'none' }} 
                      onChange={(e) => setProdVisualAidsFiles(Array.from(e.target.files))}
                    />

                    {editingProduct && editingProduct.visualAids && editingProduct.visualAids.length > 0 && (
                      <div style={{ marginTop: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Has {editingProduct.visualAids.length} slides</span>
                        </div>
                        {prodVisualAidsFiles.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}>
                              <input 
                                type="checkbox" 
                                checked={keepExistingAids}
                                onChange={(e) => setKeepExistingAids(e.target.checked)}
                              /> Keep existing & append new
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-admin-secondary" onClick={() => setIsProductModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary">
                  <Icons.Save size={16} /> Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Add Offer Form --- */}
      {isOfferModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Running Bumper Offer</h3>
              <button onClick={() => setIsOfferModalOpen(false)} style={{ color: '#64748b' }}>
                <Icons.X size={20} />
              </button>
            </div>
            <form onSubmit={handleOfferSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Offer Scheme Title *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g., Buy 10 Get 1 Free, Stockist Discount" 
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Discount/Scheme Badge *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., 10% Off, Buy 15 Get 2 Free" 
                      value={offerDiscount}
                      onChange={(e) => setOfferDiscount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Scheme Expiry (Validity)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., Valid till 30th June 2026" 
                      value={offerExpiry}
                      onChange={(e) => setOfferExpiry(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Linked Product (Optional)</label>
                  <select 
                    className="form-control"
                    value={offerProduct}
                    onChange={(e) => setOfferProduct(e.target.value)}
                  >
                    <option value="">General (All Products)</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Scheme Description / Terms</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Details about ordering quantities, target distributors, and payment terms..." 
                    value={offerDesc}
                    onChange={(e) => setOfferDesc(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label>Scheme flyer flyer / Banner Image</label>
                  <div 
                    className="file-drop-zone"
                    onClick={() => document.getElementById('offer-file-input').click()}
                  >
                    <Icons.UploadCloud size={24} style={{ color: '#10b981', margin: '0 auto' }} />
                    <div className="file-drop-text">
                      {offerImageFile ? offerImageFile.name : 'Select promotional banner/flyer'}
                    </div>
                  </div>
                  <input 
                    id="offer-file-input" 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => setOfferImageFile(e.target.files[0])}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-admin-secondary" onClick={() => setIsOfferModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary">
                  <Icons.Save size={16} /> Publish Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Generate Credentials for Approval --- */}
      {approvingReg && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Generate User Credentials</h3>
              <button onClick={() => setApprovingReg(null)} style={{ color: '#64748b' }}>
                <Icons.X size={20} />
              </button>
            </div>
            <form onSubmit={handleConfirmApproval}>
              <div className="modal-body">
                <div 
                  style={{ 
                    background: '#f0fdf4', 
                    border: '1px solid #bbf7d0', 
                    borderRadius: '8px', 
                    padding: '12px 16px', 
                    marginBottom: '16px', 
                    fontSize: '0.85rem', 
                    color: '#166534',
                    lineHeight: '1.4'
                  }}
                >
                  <Icons.Info size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  You are approving <strong>{approvingReg.firmName}</strong>. Generate the username and password below. These will be used by the franchise partner to log in.
                </div>

                <div className="form-group">
                  <label>Assign Username *</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={genUsername}
                    onChange={(e) => setGenUsername(e.target.value.replace(/\s+/g, ''))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Assign Temporary Password *</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={genPassword}
                    onChange={(e) => setGenPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-admin-secondary" onClick={() => setApprovingReg(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary" style={{ background: '#10b981' }}>
                  <Icons.UserCheck size={16} /> Complete Approval & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- IMAGE ZOOM OVERLAY MODAL --- */}
      {zoomedImage && (
        <div 
          className="modal-backdrop gloss-modal-blur"
          onClick={() => setZoomedImage(null)}
          style={{ cursor: 'zoom-out', padding: '40px' }}
        >
          <button 
            style={{ position: 'fixed', top: '20px', right: '20px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '50%', zIndex: 1100 }}
            onClick={() => setZoomedImage(null)}
          >
            <Icons.X size={24} />
          </button>
          <div 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '90%', 
              boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#fff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={zoomedImage.startsWith('http') ? zoomedImage : `${IMAGE_BASE}${zoomedImage}`} 
              alt="Zoomed Document" 
              style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* --- FLOATING AI ASSISTANT TEST DRAWER FOR ADMIN --- */}
      {!isAiChatOpen ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            zIndex: 9999
          }}
        >
          {/* Pulsing Green Halo */}
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              left: '-6px',
              right: '-6px',
              bottom: '-6px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)',
              zIndex: 9998,
              animation: 'pulseRing 2s infinite'
            }}
          />
          <button
            onClick={() => setIsAiChatOpen(true)}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              zIndex: 9999,
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            title="Test Ani AI Assistant"
          >
            <img src="/female_ai_assistant_avatar.png" alt="Ani Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
          </button>
        </div>
      ) : (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: 'min(480px, calc(100vw - 48px))',
            height: 'min(750px, calc(100vh - 64px))',
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: '24px',
            background: 'rgba(9, 13, 22, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontFamily: 'sans-serif'
          }}
        >
          {/* Header */}
          <div
            style={{
              height: '64px',
              padding: '0 20px',
              background: '#131b2e',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', display: 'inline-block', width: '36px', height: '36px' }}>
                <img src="/female_ai_assistant_avatar.png" alt="Ani Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
                <span 
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid #131b2e',
                    boxShadow: '0 0 8px #10b981',
                    animation: 'pulse 1.2s infinite'
                  }}
                  title="Ani Online & Active"
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', margin: 0 }}>Ani AI Assistant</h4>
                <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  Multilingual AI Active (Admin Test)
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  setIsAiVoiceEnabled(prev => {
                    const newVal = !prev;
                    if (!newVal && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                    return newVal;
                  });
                }}
                style={{
                  color: isAiVoiceEnabled ? '#10b981' : '#64748b',
                  padding: '6px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isAiVoiceEnabled ? "Mute Voice Responses" : "Unmute Voice Responses"}
              >
                {isAiVoiceEnabled ? <Icons.Volume2 size={20} /> : <Icons.VolumeX size={20} />}
              </button>
              <button
                onClick={() => {
                  setIsAiChatOpen(false);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  stopSpeechRecognition();
                }}
                style={{ color: '#cbd5e1', padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Icons.X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: '#090d16'
            }}
          >
            {aiMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}
              >
                <div
                  style={{
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #10b981, #059669)' : '#131b2e',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    color: '#fff',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'left'
                  }}
                >
                  {msg.text}
                </div>
                <span style={{ fontSize: '0.62rem', color: '#64748b', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.time}
                </span>
              </div>
            ))}
            {isAiTyping && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '6px', alignItems: 'center', background: '#131b2e', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '18px 18px 18px 2px' }}>
                <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.2s infinite' }}></span>
                <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.2s infinite 0.2s' }}></span>
                <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.2s infinite 0.4s' }}></span>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {aiMessages.length <= 1 && (
            <div 
              style={{ 
                padding: '0 20px 10px 20px', 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto',
                flexShrink: 0
              }}
            >
              {[
                "Tell me about Rabrio 20",
                "What is the price of ALCARIO-PRO?",
                "Rabrio 20 ka dam kya hai?",
                "Active offers on products"
              ].map((sug, sidx) => (
                <button
                  key={sidx}
                  onClick={() => handleSendAiMessage(sug)}
                  style={{
                    flex: '0 0 auto',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    color: '#cbd5e1',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input */}
          <div
            style={{
              padding: '12px 16px 16px 16px',
              background: '#131b2e',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexShrink: 0,
              pointerEvents: 'auto'
            }}
          >
            {/* Top row: Language selection pills & wake word status */}
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                gap: '8px',
                width: '100%',
                fontSize: '0.72rem'
              }}
            >
              {/* Language Pills */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700, marginRight: '2px' }}>Speak:</span>
                {[
                  { code: 'en-IN', label: 'EN' },
                  { code: 'hi-IN', label: 'HI' },
                  { code: 'ta-IN', label: 'TA' },
                  { code: 'mr-IN', label: 'MR' }
                ].map((l) => {
                  const isActive = speechLangCode === l.code;
                  return (
                    <button
                      key={l.code}
                      onClick={() => setSpeechLangCode(l.code)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                        border: '1px solid',
                        borderColor: isActive ? '#10b981' : 'rgba(255,255,255,0.1)',
                        color: isActive ? '#34d399' : '#64748b',
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>

              {/* Wake Word Status Pill */}
              <div 
                onClick={() => setIsWakeWordActive(prev => !prev)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  background: isWakeWordActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: isWakeWordActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  color: isWakeWordActive ? '#34d399' : '#64748b',
                  fontSize: '0.62rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                title={isWakeWordActive ? "Wake Word Listener: Active (Click to disable)" : "Wake Word Listener: Disabled (Click to enable)"}
              >
                <span 
                  style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: isWakeWordActive ? '#10b981' : '#64748b',
                    display: 'inline-block',
                    animation: isWakeWordActive ? 'pulse 1.2s infinite' : 'none'
                  }} 
                />
                Priya Wake
              </div>
            </div>

            {/* Bottom row: Mic, Input, Send button */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
              {/* Microphone Trigger Button */}
              <button
                onClick={toggleSpeechRecognition}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: isAiListening 
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                    : 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: isAiListening ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: isAiListening ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none',
                  position: 'relative',
                  flexShrink: 0,
                  pointerEvents: 'auto'
                }}
                title={isAiListening ? "Listening... Click to stop" : "Speak to type"}
              >
                {isAiListening ? (
                  <>
                    <Icons.Mic size={18} style={{ animation: 'pulse 1.2s infinite' }} />
                    <span 
                      style={{
                        position: 'absolute',
                        top: '-1px',
                        right: '-1px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        border: '1px solid #131b2e'
                      }}
                    />
                  </>
                ) : (
                  <Icons.Mic size={18} style={{ color: '#cbd5e1' }} />
                )}
              </button>

              <input
                type="text"
                placeholder={isAiListening ? "Listening... Speak now!" : "Ask in Hindi, English, Tamil, Marathi..."}
                value={aiInputText}
                onChange={e => setAiInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendAiMessage(aiInputText); }}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  pointerEvents: 'auto'
                }}
              />

              {/* Clickable Send Button */}
              <button
                onClick={() => {
                  if (aiInputText && aiInputText.trim()) {
                    handleSendAiMessage(aiInputText);
                  }
                }}
                disabled={!aiInputText || !aiInputText.trim() || isAiTyping}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: (aiInputText && aiInputText.trim() && !isAiTyping) 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : 'rgba(255,255,255,0.02)',
                  border: '1px solid',
                  borderColor: (aiInputText && aiInputText.trim() && !isAiTyping) ? '#10b981' : 'rgba(255,255,255,0.05)',
                  color: (aiInputText && aiInputText.trim() && !isAiTyping) ? '#fff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (aiInputText && aiInputText.trim() && !isAiTyping) ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  pointerEvents: 'auto'
                }}
                title="Send Message"
              >
                <Icons.Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
