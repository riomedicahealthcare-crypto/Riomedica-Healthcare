import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { jsPDF } from 'jspdf';
import { App as CapApp } from '@capacitor/app';
import { 
  getProducts, getCategories, getCollections, getOffers, createCollection, 
  deleteCollection, registerUser, loginUser, IMAGE_BASE, getLocalFallbackStatus, 
  resetOfflineDb, sendMobileOtp, verifyMobileOtp, sendEmailOtp, verifyEmailReset,
  getBranding, updateBranding, getBanners, getMRs, addMR, deleteMR, getVisits, addVisit,
  getMROffers, addMROffer, deleteMROffer, updateProduct, sendAiMessage, addOrder,
  getOrders, updateOrderStatus, deleteOrder, changeUserPassword, resetMRPassword,
  sendGmailOtp, verifyGmailOtp
} from '../utils';
import {
  syncAllToFirebase, pullFullBackupFromFirebase,
  subscribeToProducts, subscribeToCategories, subscribeToOffers,
  subscribeToBanners, subscribeToBranding, subscribeToOrders,
  subscribeToUsers, fbAddOrder, fbSetRegistration, subscribeToConnection
} from '../firebaseDb';
import CanvasDraw from './CanvasDraw';

// ─── SWIPE-TO-UNLOCK LANDING BUTTON ─────────────────────────────────────────
const SwipeButton = ({ onSwipeSuccess }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef(null);
  const [maxDrag, setMaxDrag] = useState(260);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setMaxDrag(containerRef.current.clientWidth - 56);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStart = (clientX) => {
    setIsDragging(true);
    startX.current = clientX - dragX;
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    let x = clientX - startX.current;
    if (x < 0) x = 0;
    if (x > maxDrag) x = maxDrag;
    setDragX(x);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragX >= maxDrag * 0.85) {
      setDragX(maxDrag);
      setTimeout(() => {
        onSwipeSuccess();
        setDragX(0);
      }, 150);
    } else {
      setDragX(0);
    }
  };

  const onTouchStart = (e) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  const onMouseDown = (e) => {
    handleStart(e.clientX);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => handleMove(e.clientX);
  const onMouseUp = () => {
    handleEnd();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        bottom: '4.2%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '88%',
        maxWidth: '350px',
        height: '56px',
        background: '#49832d',
        borderRadius: '28px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        overflow: 'hidden',
        zIndex: 20
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${dragX + 28}px`,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '28px 0 0 28px',
          pointerEvents: 'none'
        }}
      />
      <span
        style={{
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '0.85rem',
          letterSpacing: '0.5px',
          opacity: Math.max(0.1, 1 - (dragX / maxDrag) * 1.5),
          transition: isDragging ? 'none' : 'opacity 0.2s ease-out',
          textAlign: 'center',
          paddingLeft: '35px',
          pointerEvents: 'none'
        }}
      >
        Let's Build a Healthier Tomorrow Together
      </span>
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{
          position: 'absolute',
          left: '5px',
          width: '46px',
          height: '46px',
          background: '#ffffff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex: 25
        }}
      >
        <Icons.ArrowRight size={22} style={{ color: '#49832d', pointerEvents: 'none' }} />
      </div>
    </div>
  );
};

// ─── INLINE SWIPE BUTTON (sits in solid bar, no absolute positioning) ─────────
const SwipeButtonInline = ({ onSwipeSuccess }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef(null);
  const [maxDrag, setMaxDrag] = useState(260);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) setMaxDrag(containerRef.current.clientWidth - 56);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStart = (clientX) => { setIsDragging(true); startX.current = clientX - dragX; };
  const handleMove = (clientX) => {
    if (!isDragging) return;
    let x = clientX - startX.current;
    if (x < 0) x = 0;
    if (x > maxDrag) x = maxDrag;
    setDragX(x);
  };
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX >= maxDrag * 0.85) {
      setDragX(maxDrag);
      setTimeout(() => { onSwipeSuccess(); setDragX(0); }, 150);
    } else { setDragX(0); }
  };

  const onTouchStart = (e) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();
  const onMouseDown = (e) => {
    handleStart(e.clientX);
    const onMove = (ev) => handleMove(ev.clientX);
    const onUp = () => { handleEnd(); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '56px',
        background: '#49832d',
        borderRadius: '28px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${dragX + 28}px`, background: 'rgba(255,255,255,0.15)', borderRadius: '28px 0 0 28px', pointerEvents: 'none' }} />
      <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.82rem', letterSpacing: '0.4px', opacity: Math.max(0.1, 1 - (dragX / maxDrag) * 1.5), transition: isDragging ? 'none' : 'opacity 0.2s ease-out', paddingLeft: '40px', pointerEvents: 'none' }}>
        Let's Build a Healthier Tomorrow Together
      </span>
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onMouseDown={onMouseDown}
        style={{ position: 'absolute', left: '5px', width: '46px', height: '46px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', transform: `translateX(${dragX}px)`, transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', zIndex: 5 }}
      >
        <Icons.ArrowRight size={22} style={{ color: '#49832d', pointerEvents: 'none' }} />
      </div>
    </div>
  );
};


export default function MobileApp() {
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('mobile-theme') || 'dark');
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('mobile-theme', nextTheme);
  };

  // Authentication & View States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userRole, setUserRole] = useState('distributor'); // distributor, mr
  const [mrs, setMrs] = useState([]);
  const [doctorVisits, setDoctorVisits] = useState([]);
  const [mrOffers, setMrOffers] = useState([]);
  const [orders, setOrders] = useState([]);

  // Doctor Selection States for MR Orders
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [doctorLocation, setDoctorLocation] = useState('');
  const [isNewDoctorMode, setIsNewDoctorMode] = useState(false);

  // B2B Cart States & Helpers
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('919999999999');

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + qty } 
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const updateCartQuantity = (productId, qty) => {
    const targetQty = Math.max(0, qty);
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: targetQty } 
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getProductCartQty = (productId) => {
    const item = cart.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId) => {
    return cart.some(item => item.product.id === productId);
  };

  // Welcome & Launch Popup States
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showLaunchPopup, setShowLaunchPopup] = useState(false);
  const [launchPopupProduct, setLaunchPopupProduct] = useState(null);

  // Form states for creating MR offers
  const [mrOfferTitle, setMrOfferTitle] = useState('');
  const [mrOfferDesc, setMrOfferDesc] = useState('');
  const [mrOfferDiscount, setMrOfferDiscount] = useState('');
  const [mrOfferProdId, setMrOfferProdId] = useState('');
  const [mrOfferExpiry, setMrOfferExpiry] = useState('');
  const [isAddingMrOffer, setIsAddingMrOffer] = useState(false);
  const [mrOfferFormError, setMrOfferFormError] = useState('');

  // Form states for creating MRs
  const [mrName, setMrName] = useState('');
  const [mrMobile, setMrMobile] = useState('');
  const [mrEmail, setMrEmail] = useState('');
  const [mrTerritory, setMrTerritory] = useState('');
  const [mrUsername, setMrUsername] = useState('');
  const [mrPassword, setMrPassword] = useState('');
  const [isAddingMr, setIsAddingMr] = useState(false);
  const [mrFormError, setMrFormError] = useState('');

  // MR OTP verification states
  const [showMrOtpModal, setShowMrOtpModal] = useState(false);
  const [mrOtpCode, setMrOtpCode] = useState('');
  const [mrOtpError, setMrOtpError] = useState('');
  const [isVerifyingMrOtp, setIsVerifyingMrOtp] = useState(false);
  const [pendingMrData, setPendingMrData] = useState(null);
  const [mrOtpHint, setMrOtpHint] = useState('');

  // Form states for logging doctor visits
  const [visitDoctorName, setVisitDoctorName] = useState('');
  const [visitSpecialty, setVisitSpecialty] = useState('General');
  const [visitMrId, setVisitMrId] = useState('self');
  const [visitLocation, setVisitLocation] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitProductsDetailed, setVisitProductsDetailed] = useState([]);
  const [visitRemarks, setVisitRemarks] = useState('');
  const [isLoggingVisit, setIsLoggingVisit] = useState(false);
  const [visitFormError, setVisitFormError] = useState('');
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  const [authView, setAuthView] = useState('landing'); // landing, login, signup, pending
  const [showGetStartedSheet, setShowGetStartedSheet] = useState(false);
  const [showLoginOtpModal, setShowLoginOtpModal] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [loginOtpError, setLoginOtpError] = useState('');
  const [isVerifyingLoginOtp, setIsVerifyingLoginOtp] = useState(false);
  const [pendingLoginUser, setPendingLoginUser] = useState(null);
  const [pendingUserRole, setPendingUserRole] = useState('');
  const [mockLoginSmsHint, setMockLoginSmsHint] = useState('');
  
  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginRoleTab, setLoginRoleTab] = useState('distributor'); // distributor, mr

  // Forgot Password Form States
  const [forgotUsernameOrEmail, setForgotUsernameOrEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Username/Email, 2 = Enter OTP & New Password
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isSendingForgotCode, setIsSendingForgotCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [mockEmailHint, setMockEmailHint] = useState('');

  // Signup Form States
  const [regFirmName, setRegFirmName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDrugFile, setRegDrugFile] = useState(null);
  const [regGstFile, setRegGstFile] = useState(null);
  const [regPanFile, setRegPanFile] = useState(null);
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showMobileOtpModal, setShowMobileOtpModal] = useState(false);
  const [regMobileOtpCode, setRegMobileOtpCode] = useState('');
  const [regMobileOtpError, setRegMobileOtpError] = useState('');
  const [isVerifyingMobileOtp, setIsVerifyingMobileOtp] = useState(false);
  const [mockSmsHint, setMockSmsHint] = useState('');

  // Navigation & Page States
  const [activeTab, setActiveTab] = useState('home'); // home, catalog, launches, offers, collections, profile
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, product-detail, presentation, add-collection
  
  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [offers, setOffers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Detailing / Presentation States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('packshot'); // packshot, aids, lbl, video
  const [presentationMode, setPresentationMode] = useState(false); // fullscreen detailing
  const [presentationSlides, setPresentationSlides] = useState([]); // Array of slide image urls
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  
  // Collection Builder States
  const [newCollName, setNewCollName] = useState('');
  const [newCollDesc, setNewCollDesc] = useState('');
  const [newCollSelectedProducts, setNewCollSelectedProducts] = useState([]);

  // AI Assistant Chat States
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'model',
      text: "Hello! This is Ani from the Riomedica team. I am here to assist you just like a real support representative. I can help you search our catalog, check prices (MRP), active offers, chemical compositions, or standard dosages.\n\nFeel free to type in English, Hindi, Tamil, Marathi, or any Indian language, and I will reply to you in the same language. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatMessagesEndRef = React.useRef(null);
  const recognitionRef = React.useRef(null);
  
  // Voice Capabilities States
  const [isAiVoiceEnabled, setIsAiVoiceEnabled] = useState(true);
  const [isAiListening, setIsAiListening] = useState(false);

  // Wake Word & Hands-free Loop States
  const [isWakeWordActive, setIsWakeWordActive] = useState(true);
  const [isContinuousTalkEnabled, setIsContinuousTalkEnabled] = useState(false);
  const [speechLangCode, setSpeechLangCode] = useState('en-IN');
  
  const wakeWordRecRef = React.useRef(null);
  const activeUtterancesCountRef = React.useRef(0);
  const isContinuousTalkEnabledRef = React.useRef(false);
  const isAiChatOpenRef = React.useRef(false);
  const isAiListeningRef = React.useRef(false);

  React.useEffect(() => { isContinuousTalkEnabledRef.current = isContinuousTalkEnabled; }, [isContinuousTalkEnabled]);
  React.useEffect(() => { isAiChatOpenRef.current = isAiChatOpen; }, [isAiChatOpen]);
  React.useEffect(() => { isAiListeningRef.current = isAiListening; }, [isAiListening]);
  // Password Change States
  const [changeOldPassword, setChangeOldPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!changeOldPassword || !changeNewPassword || !changeConfirmPassword) {
      setChangePasswordError('All password fields are required.');
      return;
    }
    if (changeNewPassword !== changeConfirmPassword) {
      setChangePasswordError('New passwords do not match.');
      return;
    }
    setChangePasswordError('');
    setChangePasswordSuccess('');
    setIsChangingPassword(true);
    try {
      await changeUserPassword(loggedInUser.id, changeOldPassword, changeNewPassword);
      setChangePasswordSuccess('Password updated successfully!');
      setChangeOldPassword('');
      setChangeNewPassword('');
      setChangeConfirmPassword('');
    } catch (err) {
      setChangePasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetMrPassword = async (mrId, name) => {
    const newPassword = window.prompt(`Enter new password for MR "${name}":`);
    if (newPassword === null) return;
    if (newPassword.trim() === '') {
      alert('Password cannot be empty.');
      return;
    }

    try {
      await resetMRPassword(mrId, newPassword.trim());
      alert(`Password for MR "${name}" reset successfully!`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to reset MR password.');
    }
  };

  // Background Voice Wake-Word Listener Effect
  useEffect(() => {
    if (!isLoggedIn || currentView !== 'dashboard' || isAiChatOpen || !isWakeWordActive) {
      if (wakeWordRecRef.current) {
        try { wakeWordRecRef.current.stop(); } catch (e) {}
        wakeWordRecRef.current = null;
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let localWakeRec = null;
    try {
      localWakeRec = new SpeechRecognition();
      localWakeRec.continuous = true;
      localWakeRec.interimResults = false;
      localWakeRec.lang = 'en-IN'; // Good for Hinglish name recognition

      localWakeRec.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("Wake word background recognition:", transcript);
        if (transcript.includes('ani') || transcript.includes('अनी') || transcript.includes('அனி')) {
          console.log("Wake word detected! Opening Ani Chat overlay.");
          setIsAiChatOpen(true);
          setIsContinuousTalkEnabled(true); // Automatically turn on hands-free mode
          
          // Small delay to allow chat overlay slide animation, then start listening
          setTimeout(() => {
            startSpeechRecognition();
          }, 800);
        }
      };

      localWakeRec.onend = () => {
        // Auto-restart if we are still active and closed
        if (isLoggedIn && currentView === 'dashboard' && !isAiChatOpenRef.current && isWakeWordActive) {
          try { localWakeRec.start(); } catch (e) {}
        }
      };

      wakeWordRecRef.current = localWakeRec;
      localWakeRec.start();
    } catch (err) {
      console.warn("Failed to start background wake word recognition:", err);
    }

    return () => {
      if (wakeWordRecRef.current) {
        try { wakeWordRecRef.current.stop(); } catch (e) {}
        wakeWordRecRef.current = null;
      }
    };
  }, [isLoggedIn, currentView, isAiChatOpen, isWakeWordActive]);

  // Helper to dynamically detect Indian language in AI text response
  const detectLanguage = (text) => {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil script range
    if (/[\u0900-\u097F]/.test(text)) { // Devanagari script range
      // Differentiate Hindi and Marathi with typical verbs/pronouns
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
      window.speechSynthesis.cancel(); // Stop any currently speaking voice
      activeUtterancesCountRef.current = 0;
    }

    if (!isAiVoiceEnabled) return;

    // Filter markdown symbols, bullet points, and mock warnings for cleaner voice readouts
    const cleanText = text
      .replace(/[\*\#\_]/g, '')
      .replace(/•/g, ', ')
      .replace(/\(.*?\)/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;

    // Load available voices
    const voices = window.speechSynthesis.getVoices();
    const langLower = lang.toLowerCase();
    
    // Filter voices matching the language code (or base prefix)
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
      voice = matchedVoices[0]; // Fallback to first matched dialect voice
    }

    if (!voice) {
      // General generic female voice fallback
      voice = voices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes('female') || name.includes('zira') || name.includes('hazel');
      });
    }

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang; // Enforce voice-language alignment to avoid silent failures
    }

    utterance.pitch = 1.15; // Set higher pitch for a beautiful female voice tone
    utterance.rate = 0.95;  // Slightly slower rate for clear B2B pronunciation

    // Utterance lifecycle callbacks for continuous hands-free talking loop
    utterance.onstart = () => {
      // If microphone is currently recording, stop it immediately to prevent echo
      if (isAiListeningRef.current) {
        stopSpeechRecognition();
      }
    };

    const handleSpeechEnded = () => {
      activeUtterancesCountRef.current = Math.max(0, activeUtterancesCountRef.current - 1);
      if (activeUtterancesCountRef.current === 0) {
        console.log("Ani finished speaking. Checking if hands-free is enabled:", isContinuousTalkEnabledRef.current);
        if (isContinuousTalkEnabledRef.current && isAiChatOpenRef.current && !isAiListeningRef.current) {
          startSpeechRecognition();
        }
      }
    };

    utterance.onend = handleSpeechEnded;
    utterance.onerror = (errEvent) => {
      console.error("Speech synthesis error event:", errEvent);
      handleSpeechEnded();
    };

    activeUtterancesCountRef.current += 1;
    console.log(`TTS speaking: "${cleanText}" | Lang: ${utterance.lang} | Active Queue Count: ${activeUtterancesCountRef.current}`);
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
      activeUtterancesCountRef.current = 0;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Fix: continuous listening so user isn't cut off early
    recognition.interimResults = true; // Fix: show real-time transcription feedback
    recognition.lang = speechLangCode; // Use dynamic speech language code selected by user

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
        alert("Microphone permission is blocked. Please allow microphone access in your browser settings.");
      }
    };

    recognition.onend = () => {
      setIsAiListening(false);
      if (silenceTimer) clearTimeout(silenceTimer);

      // Auto-restart recognition if continuous talking is active, chat is open, and Priya is not speaking
      setTimeout(() => {
        if (isContinuousTalkEnabledRef.current && isAiChatOpenRef.current && !isAiListeningRef.current && activeUtterancesCountRef.current === 0) {
          console.log("Auto-restarting speech recognition in loop");
          try { recognition.start(); } catch (e) {}
        }
      }, 300);
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

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollTop = chatMessagesEndRef.current.scrollHeight;
    }
  }, [aiMessages, isAiTyping, isAiChatOpen]);

  // Clean speech synthesis & recognition on unmount, and preload voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Speak and show personalized greeting when opening the AI assistant
  useEffect(() => {
    if (isAiChatOpen) {
      let greetingText = '';
      if (userRole === 'mr') {
        greetingText = `Hello ${loggedInUser?.ownerName || 'Representative'}! This is Ani from the Riomedica team. How can I help you today?`;
      } else {
        greetingText = `Hello ${loggedInUser?.ownerName || 'Partner'} from ${loggedInUser?.firmName || 'Riomedica'}! This is Ani from the Riomedica team. How can I help you today?`;
      }

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
  }, [isAiChatOpen, loggedInUser, userRole]);

  const handleSendAiMessage = async (textToSend) => {
    if (!textToSend || !textToSend.trim() || isAiTyping) return;

    // Cancel speech recognition recording if active
    stopSpeechRecognition();

    const userMsg = {
      role: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages(prev => [...prev, userMsg]);
    setAiInputText('');
    setIsAiTyping(true);

    // Cancel any ongoing speaking immediately when a new user query begins
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      // Map history to simple { role, text } format for backend API
      const historyPayload = aiMessages.map(m => ({ role: m.role, text: m.text }));

      // Create model message placeholder with unique ID to target it
      const modelMsgId = 'model-' + Date.now();
      const modelMsgPlaceholder = {
        id: modelMsgId,
        role: 'model',
        text: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setAiMessages(prev => [...prev, modelMsgPlaceholder]);

      // Calculate api base dynamically (bypass safeFetch to consume streaming reader)
      let apiBase = 'http://localhost:5000/api';
      if (import.meta.env.VITE_API_URL) {
        apiBase = import.meta.env.VITE_API_URL.endsWith('/api') 
          ? import.meta.env.VITE_API_URL 
          : `${import.meta.env.VITE_API_URL}/api`;
      } else if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        if (!origin.includes(':517')) { // Production served assets
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

      // Set typing indicator off once stream chunks start arriving
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
      
      // Local typing simulation fallback for offline/localStorage mode
      try {
        const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
        const lowerMsg = userMsg.text.toLowerCase();
        let reply = "";
        let detectedLang = "en";

        if (speechLangCode === 'hi-IN') {
          detectedLang = "hi";
        } else if (speechLangCode === 'ta-IN') {
          detectedLang = "ta";
        } else if (speechLangCode === 'mr-IN') {
          detectedLang = "mr";
        } else if (lowerMsg.includes('kya') || lowerMsg.includes('hai') || lowerMsg.includes('batao') || lowerMsg.includes('daam') || lowerMsg.includes('namaste')) {
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
            reply = `नमस्ते, मैं अनी हूँ रियोमेडिका से। ${matchedProduct.name} के बारे में मैं आपको जानकारी दे देती हूँ। इसकी संरचना ${matchedProduct.composition} है। यह मुख्य रूप से ${matchedProduct.indications || 'सामान्य उपयोग'} के लिए उपयोग किया जाता है। इसकी सामान्य खुराक ${matchedProduct.dosage || 'चिकित्सक के निर्देशानुसार'} है और इसका एमआरपी ${mrpVal} है। यह एक उत्कृष्ट उत्पाद है। क्या मैं आपकी कुछ और मदद करूँ? (ऑफ़लाइन सिमुलेशन मोड)`;
          } else if (detectedLang === "ta") {
            reply = `வணக்கம், நான் அனி பேசுறேன். ${matchedProduct.name} பற்றி சொல்கிறேன். இதில் ${matchedProduct.composition} உள்ளது. இது பொதுவாக ${matchedProduct.indications || 'பொதுவான பயன்பாட்டிற்கு'} பயன்படுகிறது. இதனுடைய விலை ${mrpVal} ஆகும். உங்களுக்கு வேறு ஏதேனும் விவரங்கள் வேண்டுமா? (ஆஃப்லைன் சிமுலேஷன் முறை)`;
          } else if (detectedLang === "mr") {
            reply = `नमस्कार, मी अनी बोलत आहे. ${matchedProduct.name} बद्दल सांगायचे तर, यामध्ये ${matchedProduct.composition} घटक आहेत. याचा वापर प्रामुख्याने ${matchedProduct.indications || 'सामान्य वापरासाठी'} केला जातो. याची किंमत ${mrpVal} आहे. तुम्हाला इसबद्दल अजून काही माहिती हवी आहे का? (ऑफलाइन सिम्युलेशन मोड)`;
          } else {
            reply = `Hello, this is Ani from the Riomedica team. I can certainly help you with ${matchedProduct.name}. It contains ${matchedProduct.composition}. For indications, it is generally used for ${matchedProduct.indications || 'general clinical use'}, and the MRP for this medicine is ${mrpVal}. Please let me know if you would like me to help with anything else. (Offline Simulation Mode)`;
          }
        } else {
          if (detectedLang === "hi") {
            reply = "नमस्ते! मैं अनी बोल रही हूँ रियोमेडिका टीम से। मैं एक असली प्रतिनिधि की तरह आपकी सहायता करने के लिए यहाँ हूँ। आप मुझसे किसी भी दवा जैसे 'Rabrio 20' या 'Rioceft' के बारे में पूछ सकते हैं। (ऑफ़ライン सिमुलेशन मोड)";
          } else if (detectedLang === "ta") {
            reply = "வணக்கம்! நான் அனி பேசுறேன். தயாரிப்புகள் அல்லது விலைகளைப் பற்றி கேட்கலாம். (ஆஃப்லைன் சிமுலேஷன் முறை)";
          } else if (detectedLang === "mr") {
            reply = "नमस्कार! मी अनी बोलत आहे. तुम्ही मला औषधांबद्दल विचारू शकता. (ऑफलाइन सिम्युलेशन मोड)";
          } else {
            reply = "Hello! This is Ani from the Riomedica customer support team. I am here to help you just like a real support coordinator. Ask me about any of our brands, such as 'Tell me about Rabrio 20'. (Offline Simulation Mode)";
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

            // Speak sentence-by-sentence for offline mode too
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
        }, 20); // 20ms simulated stream speed
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
  
  // Offline / Fallback State indicators
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [branding, setBranding] = useState({ companyName: 'RIOMEDICA', tagline: 'Healthcare', logo: '' });
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Admin Logo Upload States
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);

  // Firebase Sync States
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState(''); // '', 'success', 'error'
  const [firebaseSyncMsg, setFirebaseSyncMsg] = useState('');
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);

  // Mobile Direct Product Edit States
  const [isMobileEditModalOpen, setIsMobileEditModalOpen] = useState(false);
  const [editProdId, setEditProdId] = useState('');
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('');
  const [editProdComposition, setEditProdComposition] = useState('');
  const [editProdIndications, setEditProdIndications] = useState('');
  const [editProdDosage, setEditProdDosage] = useState('');
  const [editProdLbl, setEditProdLbl] = useState('');
  const [editProdVideoUrl, setEditProdVideoUrl] = useState('');
  const [editProdPackshotFile, setEditProdPackshotFile] = useState(null);
  const [editProdVisualAidsFiles, setEditProdVisualAidsFiles] = useState([]);
  const [editKeepExistingAids, setEditKeepExistingAids] = useState(true);
  const [editProdIsNewLaunch, setEditProdIsNewLaunch] = useState(false);
  const [editProdMrp, setEditProdMrp] = useState('');
  const [isSavingMobileEdit, setIsSavingMobileEdit] = useState(false);

  const openMobileEditModal = (product) => {
    setEditProdId(product.id);
    setEditProdName(product.name);
    setEditProdCategory(product.categoryId);
    setEditProdComposition(product.composition);
    setEditProdIndications(product.indications || '');
    setEditProdDosage(product.dosage || '');
    setEditProdLbl(product.lbl || '');
    setEditProdVideoUrl(product.videoUrl || '');
    setEditProdPackshotFile(null);
    setEditProdVisualAidsFiles([]);
    setEditKeepExistingAids(true);
    setEditProdIsNewLaunch(!!product.isNewLaunch);
    setEditProdMrp(product.mrp || '');
    setIsMobileEditModalOpen(true);
  };

  const handleMobileEditSubmit = async (e) => {
    e.preventDefault();
    setIsSavingMobileEdit(true);
    
    const formData = new FormData();
    formData.append('name', editProdName);
    formData.append('categoryId', editProdCategory);
    formData.append('composition', editProdComposition);
    formData.append('indications', editProdIndications);
    formData.append('dosage', editProdDosage);
    formData.append('lbl', editProdLbl);
    formData.append('videoUrl', editProdVideoUrl);
    formData.append('isNewLaunch', editProdIsNewLaunch.toString());
    formData.append('mrp', editProdMrp);
    formData.append('keepExistingAids', editKeepExistingAids.toString());
    
    if (editProdPackshotFile) {
      formData.append('packshot', editProdPackshotFile);
    }
    
    if (editProdVisualAidsFiles.length > 0) {
      for (let i = 0; i < editProdVisualAidsFiles.length; i++) {
        formData.append('visualAids', editProdVisualAidsFiles[i]);
      }
    }

    try {
      const updated = await updateProduct(editProdId, formData);
      
      // Reload products list in state
      const prods = await getProducts();
      setProducts(prods || []);
      
      // Update local state of the currently viewed product
      setSelectedProduct(updated);
      
      setIsMobileEditModalOpen(false);
      alert("Product updated successfully directly from detail view!");
    } catch (err) {
      alert("Failed to update product: " + err.message);
    } finally {
      setIsSavingMobileEdit(false);
    }
  };

  // Load database
  const loadData = async () => {
    try {
      const cats = await getCategories();
      const prods = await getProducts();
      const colls = await getCollections();
      const offs = await getOffers();
      const brand = await getBranding();
      const ban = await getBanners();
      const team = await getMRs();
      const visits = await getVisits();
      const teamOffers = await getMROffers();
      const ords = await getOrders().catch(() => []);
      
      setCategories(cats || []);
      setProducts(prods || []);
      setCollections(colls || []);
      setOffers(offs || []);
      setBranding(brand || { companyName: 'RIOMEDICA', tagline: 'Healthcare', logo: '' });
      setBanners(ban || []);
      setMrs(team || []);
      setDoctorVisits(visits || []);
      setMrOffers(teamOffers || []);
      setOrders(ords || []);
      setIsOfflineMode(getLocalFallbackStatus());
    } catch (err) {
      console.error("Failed loading data", err);
    }
  };

  useEffect(() => {
    // Load non-Firebase data once (MRs, visits, MR offers, collections)
    const loadLocalData = async () => {
      try {
        const colls   = await getCollections();
        const team    = await getMRs();
        const visits  = await getVisits();
        const teamOff = await getMROffers();
        const ords    = await getOrders().catch(() => []);
        setCollections(colls || []);
        setMrs(team || []);
        setDoctorVisits(visits || []);
        setMrOffers(teamOff || []);
        setOrders(ords || []);
        setIsOfflineMode(getLocalFallbackStatus());
      } catch (err) {
        console.error('Failed loading local data', err);
      }
    };
    loadLocalData();

    // 🔥 Firebase real-time listeners — rep app auto-updates when admin makes changes
    const unsubProducts   = subscribeToProducts((data)   => { 
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
    const unsubOffers     = subscribeToOffers((data)     => { 
      if (data) {
        setOffers(data); 
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.offers = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      } 
    });
    const unsubBanners    = subscribeToBanners((data)    => { 
      if (data) {
        setBanners(data); 
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.banners = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      } 
    });
    const unsubBranding   = subscribeToBranding((data)   => { 
      if (data) {
        setBranding(data); 
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.branding = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      } 
    });
    const unsubOrders     = subscribeToOrders((data)     => { 
      if (data) {
        setOrders(data); 
        try {
          const db = JSON.parse(localStorage.getItem('riomedica_db') || '{}');
          db.orders = data;
          localStorage.setItem('riomedica_db', JSON.stringify(db));
        } catch (_) {}
      } 
    });
    const unsubUsers      = subscribeToUsers((data)      => { 
      if (data) {
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

    // Fallback: if Firebase has no data yet, load from local server
    const fallbackTimer = setTimeout(async () => {
      try {
        const prods = await getProducts();
        const cats  = await getCategories();
        const offs  = await getOffers();
        const ban   = await getBanners();
        const brand = await getBranding();
        if (prods?.length) setProducts(prods);
        if (cats?.length) setCategories(cats);
        if (offs?.length) setOffers(offs);
        if (ban?.length) setBanners(ban);
        if (brand) setBranding(brand);
      } catch (e) { /* server offline — Firebase is the source of truth */ }
    }, 2000);

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOffers();
      unsubBanners();
      unsubBranding();
      unsubOrders();
      unsubUsers();
      unsubConnection();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Sync offline status state when API calls run
  useEffect(() => {
    setIsOfflineMode(getLocalFallbackStatus());
  }, [products]);

  // Reset banner index when the banners list changes
  useEffect(() => {
    setCurrentBannerIndex(0);
  }, [banners]);

  // Handle native back button press
  useEffect(() => {
    if (!(window.Capacitor && window.Capacitor.isNativePlatform())) return;

    const handleBackButton = async () => {
      // 1. If any modal, drawer, or temporary overlay is open, close/revert it first
      if (presentationMode) {
        setPresentationMode(false);
        return;
      }
      if (showGetStartedSheet) {
        setShowGetStartedSheet(false);
        return;
      }
      if (showLoginOtpModal) {
        setShowLoginOtpModal(false);
        return;
      }
      if (isCartOpen) {
        setIsCartOpen(false);
        return;
      }
      if (isAiChatOpen) {
        setIsAiChatOpen(false);
        return;
      }
      if (isVisitModalOpen) {
        setIsVisitModalOpen(false);
        return;
      }
      if (isMobileEditModalOpen) {
        setIsMobileEditModalOpen(false);
        return;
      }
      if (selectedProduct) {
        setSelectedProduct(null);
        return;
      }
      if (showWelcomePopup) {
        setShowWelcomePopup(false);
        return;
      }
      if (showLaunchPopup) {
        setShowLaunchPopup(false);
        return;
      }
      if (showMobileOtpModal) {
        setShowMobileOtpModal(false);
        return;
      }
      if (isAddingMrOffer) {
        setIsAddingMrOffer(false);
        return;
      }
      if (isAddingMr) {
        setIsAddingMr(false);
        return;
      }
      if (isNewDoctorMode) {
        setIsNewDoctorMode(false);
        return;
      }

      // 2. If logged out and on a sub-view of the auth flow (signup, forgot-password, pending, login), return to landing
      if (!isLoggedIn && authView !== 'landing') {
        setAuthView('landing');
        setForgotStep(1);
        return;
      }

      // 3. If viewing a sub-screen or not on the dashboard home tab, return to dashboard home tab
      if (isLoggedIn && (currentView !== 'dashboard' || activeTab !== 'home')) {
        setCurrentView('dashboard');
        setActiveTab('home');
        return;
      }

      // 4. If on dashboard home or on landing welcome screen, prompt app exit
      if (isLoggedIn || (!isLoggedIn && authView === 'landing')) {
        const confirmExit = window.confirm("Do you really want to exit the application?");
        if (confirmExit) {
          CapApp.exitApp();
        }
      }
    };

    const backButtonListener = CapApp.addListener('backButton', () => {
      handleBackButton();
    });

    return () => {
      backButtonListener.then(l => l.remove());
    };
  }, [
    isLoggedIn, authView, currentView, activeTab, isCartOpen, isAiChatOpen, 
    isVisitModalOpen, isMobileEditModalOpen, selectedProduct, showWelcomePopup, 
    showLaunchPopup, showMobileOtpModal, isAddingMrOffer, isAddingMr, 
    isNewDoctorMode, presentationMode, showGetStartedSheet, showLoginOtpModal
  ]);

  // Slideshow auto-advance timer for promotional banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  // Handle clicking on banner links to navigate to appropriate tab or open linked product
  const handleBannerClick = (banner) => {
    if (!banner) return;
    
    // 1. If it has a linkProductId, open the product details view dynamically
    if (banner.linkProductId) {
      const prod = products.find(p => p.id === banner.linkProductId);
      if (prod) {
        setSelectedProduct(prod);
        setCurrentView('product-detail');
        setActiveDetailTab('packshot');
        return;
      }
    }

    // 2. Otherwise fallback to linkUrl mapping
    const linkUrl = banner.linkUrl;
    if (!linkUrl) return;
    const path = linkUrl.toLowerCase().trim();
    if (path.includes('offer')) {
      setActiveTab('offers');
    } else if (path.includes('launch') || path.includes('product-launch')) {
      setActiveTab('launches');
    } else if (path.includes('catalog') || path.includes('product')) {
      setActiveTab('catalog');
      setSelectedCategory('all');
    } else if (path.includes('collection')) {
      setActiveTab('collections');
    } else if (path.includes('profile')) {
      setActiveTab('profile');
      setCurrentView('dashboard');
    }
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) return;
    
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await loginUser({
        username: loginUsername,
        password: loginPassword
      });
      if (res.role !== 'admin' && res.role !== loginRoleTab) {
        throw new Error(`Invalid credentials for a ${loginRoleTab === 'mr' ? 'Medical Representative' : 'Franchise Partner'}.`);
      }

      // Complete login directly without OTP for all roles
      setIsLoggedIn(true);
      setLoggedInUser(res.user);
      setUserRole(res.role || 'distributor');
      setActiveTab('home');
      setCurrentView('dashboard');
      
      if (res.role === 'mr' && res.user.distributorMobile) {
        setWhatsappNumber(res.user.distributorMobile);
      } else {
        setWhatsappNumber('919999999999');
      }

      // ── Show Welcome Popup ──
      setShowWelcomePopup(true);

      // ── Show New Launch Popup after 3.2s ──
      setTimeout(async () => {
        try {
          const allProds = await getProducts();
          const newLaunches = (allProds || []).filter(p => p.isNewLaunch);
          if (newLaunches.length > 0) {
            setLaunchPopupProduct(newLaunches[0]);
            setShowLaunchPopup(true);
          }
        } catch (_) { /* silent fail */ }
      }, 3200);

    } catch (err) {
      setLoginError(err.message || 'Invalid username or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Verify Gmail OTP and complete login
  const handleLoginOtpVerify = async (e) => {
    e.preventDefault();
    if (!loginOtpCode || !pendingLoginUser) return;

    setLoginOtpError('');
    setIsVerifyingLoginOtp(true);

    try {
      await verifyGmailOtp(pendingLoginUser.email, loginOtpCode);
      
      setIsLoggedIn(true);
      setLoggedInUser(pendingLoginUser);
      setUserRole(pendingUserRole || 'distributor');
      setActiveTab('home');
      setCurrentView('dashboard');
      
      if (pendingUserRole === 'mr' && pendingLoginUser.distributorMobile) {
        setWhatsappNumber(pendingLoginUser.distributorMobile);
      } else {
        setWhatsappNumber('919999999999');
      }

      // ── Show Welcome Popup ──
      setShowWelcomePopup(true);

      // ── Show New Launch Popup after 3.2s ──
      setTimeout(async () => {
        try {
          const allProds = await getProducts();
          const newLaunches = (allProds || []).filter(p => p.isNewLaunch);
          if (newLaunches.length > 0) {
            setLaunchPopupProduct(newLaunches[0]);
            setShowLaunchPopup(true);
          }
        } catch (_) { /* silent fail */ }
      }, 3200);

      setShowLoginOtpModal(false);
      setPendingLoginUser(null);
      setPendingUserRole('');
    } catch (err) {
      setLoginOtpError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsVerifyingLoginOtp(false);
    }
  };


  // Handle MR Registration Submission - Send OTP to MR email first
  const handleAddMr = async (e) => {
    e.preventDefault();
    setMrFormError('');

    if (!mrEmail) {
      setMrFormError('Email address is required to verify and register the MR.');
      return;
    }

    setIsAddingMr(true);

    try {
      // Send Gmail OTP to MR's email for verification
      const otpRes = await sendGmailOtp(mrEmail, 'registration');
      setMrOtpHint(otpRes.mockOtp || '');
      setPendingMrData({
        distributorId: loggedInUser.id,
        name: mrName,
        mobile: mrMobile,
        email: mrEmail,
        territory: mrTerritory,
        username: mrUsername,
        password: mrPassword
      });
      setMrOtpCode('');
      setMrOtpError('');
      setShowMrOtpModal(true);
    } catch (err) {
      setMrFormError(err.message || 'Failed to send verification email to MR. Please check the email address.');
    } finally {
      setIsAddingMr(false);
    }
  };

  // Verify MR email OTP and complete MR registration
  const handleVerifyMrOtp = async (e) => {
    e.preventDefault();
    if (!mrOtpCode || !pendingMrData) return;

    setMrOtpError('');
    setIsVerifyingMrOtp(true);

    try {
      // Verify Gmail OTP sent to MR's email
      await verifyGmailOtp(pendingMrData.email, mrOtpCode);

      // Register the MR after email verification
      const newMr = await addMR(pendingMrData);
      setMrs((prev) => [...prev, newMr]);
      setMrName('');
      setMrMobile('');
      setMrEmail('');
      setMrTerritory('');
      setMrUsername('');
      setMrPassword('');
      setShowMrOtpModal(false);
      setPendingMrData(null);
      setMrOtpHint('');
      alert(`Medical Representative "${newMr.name}" registered successfully! Their email has been verified.`);
    } catch (err) {
      setMrOtpError(err.message || 'OTP verification failed. Please check the code sent to the MR\'s email.');
    } finally {
      setIsVerifyingMrOtp(false);
    }
  };

  // Handle MR Deletion
  const handleDeleteMr = async (mrId) => {
    if (!window.confirm('Are you sure you want to delete this MR?')) return;
    try {
      await deleteMR(mrId);
      setMrs((prev) => prev.filter((m) => m.id !== mrId));
      alert('MR deleted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to delete MR.');
    }
  };

  // Handle Add MR Offer Submission
  const handleAddMrOffer = async (e) => {
    e.preventDefault();
    setMrOfferFormError('');
    setIsAddingMrOffer(true);

    try {
      const newOffer = await addMROffer({
        distributorId: loggedInUser.id,
        title: mrOfferTitle,
        description: mrOfferDesc,
        discount: mrOfferDiscount,
        productId: mrOfferProdId || null,
        expiry: mrOfferExpiry
      });

      setMrOffers((prev) => [...prev, newOffer]);
      setMrOfferTitle('');
      setMrOfferDesc('');
      setMrOfferDiscount('');
      setMrOfferProdId('');
      setMrOfferExpiry('');
      alert('MR Scheme/Offer published successfully!');
    } catch (err) {
      setMrOfferFormError(err.message || 'Failed to add MR Offer.');
    } finally {
      setIsAddingMrOffer(false);
    }
  };

  // Handle MR Offer Deletion
  const handleDeleteMrOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this MR Offer?')) return;
    try {
      await deleteMROffer(id);
      setMrOffers((prev) => prev.filter(o => o.id !== id));
      alert('MR Offer deleted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to delete MR Offer.');
    }
  };

  // Handle Logging Doctor Visit
  const handleLogVisit = async (e) => {
    e.preventDefault();
    setVisitFormError('');
    setIsLoggingVisit(true);

    try {
      const parentId = userRole === 'mr' ? loggedInUser.distributorId : loggedInUser.id;
      const mrId = userRole === 'mr' ? loggedInUser.id : visitMrId;

      const newVisit = await addVisit({
        distributorId: parentId,
        mrId: mrId,
        doctorName: visitDoctorName,
        specialty: visitSpecialty,
        location: visitLocation,
        date: visitDate,
        productsDetailed: visitProductsDetailed,
        remarks: visitRemarks
      });

      setDoctorVisits((prev) => [newVisit, ...prev]);
      setVisitDoctorName('');
      setVisitSpecialty('General');
      setVisitLocation('');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setVisitProductsDetailed([]);
      setVisitRemarks('');
      setIsVisitModalOpen(false);
      alert('Doctor visit logged successfully!');
    } catch (err) {
      setVisitFormError(err.message || 'Failed to log visit.');
    } finally {
      setIsLoggingVisit(false);
    }
  };

  // Handle sending OTP code for Password Reset
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setIsSendingForgotCode(true);
    setMockEmailHint('');

    try {
      const res = await sendEmailOtp(forgotUsernameOrEmail);
      setMockEmailHint(res.mockOtp || '654321');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Failed to send OTP verification code.');
    } finally {
      setIsSendingForgotCode(false);
    }
  };

  // Handle validating OTP and resetting user password
  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New passwords do not match.');
      return;
    }

    setIsResettingPassword(true);

    try {
      await verifyEmailReset(forgotUsernameOrEmail, forgotOtpCode, forgotNewPassword);
      setForgotSuccess(true);
    } catch (err) {
      setForgotError(err.message || 'Password reset failed. Please check the code.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle Registration / Sign-Up Submission - Trigger Mobile Verification OTP
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    if (!regFirmName || !regOwnerName || !regMobile || !regEmail) {
      setRegError('All text fields are required.');
      return;
    }

    if (!regDrugFile) {
      setRegError('Drug License Copy is required.');
      return;
    }

    if (!regGstFile && !regPanFile) {
      setRegError('Please upload either GST Copy or PAN Card.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      setRegError('Please enter a valid email address.');
      return;
    }

    setIsRegistering(true);

    try {
      // Send Gmail OTP to the user's email address for verification
      const res = await sendGmailOtp(regEmail, 'registration');
      setMockSmsHint(res.mockOtp || '');
      setRegMobileOtpCode('');
      setRegMobileOtpError('');
      setShowMobileOtpModal(true);
    } catch (err) {
      setRegError(err.message || 'Failed to send verification email. Please check your email address.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Verify Gmail OTP and complete registration
  const handleVerifyMobileAndRegister = async (e) => {
    e.preventDefault();
    setRegMobileOtpError('');
    setIsVerifyingMobileOtp(true);

    try {
      // 1. Verify Gmail OTP sent to the user's email
      await verifyGmailOtp(regEmail, regMobileOtpCode);

      // 2. Submit the registration details and files
      const formData = new FormData();
      formData.append('firmName', regFirmName);
      formData.append('ownerName', regOwnerName);
      formData.append('mobile', regMobile);
      formData.append('email', regEmail);
      formData.append('drugLicence', regDrugFile);
      
      if (regGstFile) {
        formData.append('gst', regGstFile);
      }
      if (regPanFile) {
        formData.append('pan', regPanFile);
      }

      const registered = await registerUser(formData);
      try {
        if (registered && registered.id) {
          await fbSetRegistration(registered.id, registered);
          console.log('[Register] Registration auto-synced to Firebase');
        }
      } catch (fbErr) {
        console.warn('[Register] Firebase sync skipped:', fbErr.message);
      }
      setShowMobileOtpModal(false);
      setAuthView('pending');
    } catch (err) {
      setRegMobileOtpError(err.message || 'Verification failed. Please check the OTP sent to your email.');
    } finally {
      setIsVerifyingMobileOtp(false);
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Unassigned';
  };

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.composition.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.indications.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const newLaunchProducts = products.filter(p => p.isNewLaunch);

  // Start single product slideshow
  const startSingleProductPresentation = (product) => {
    const slides = [];
    
    if (product.packshot) {
      slides.push({
        url: product.packshot.startsWith('http') ? product.packshot : `${IMAGE_BASE}${product.packshot}`,
        title: `${product.name} - Packshot`,
        sub: product.composition
      });
    } else {
      slides.push({
        isMock: true,
        type: 'packshot',
        product: product,
        title: `${product.name} - Packshot Info`,
        sub: product.composition
      });
    }

    if (product.visualAids && product.visualAids.length > 0) {
      product.visualAids.forEach((aid, i) => {
        slides.push({
          url: aid.startsWith('http') ? aid : `${IMAGE_BASE}${aid}`,
          title: `${product.name} - Detailer Page ${i + 1}`,
          sub: product.indications
        });
      });
    } else {
      slides.push({
        isMock: true,
        type: 'visualAid',
        product: product,
        title: `${product.name} - Medical Detailing`,
        sub: product.indications
      });
    }

    setPresentationSlides(slides);
    setCurrentSlideIndex(0);
    setPresentationMode(true);
    setIsDrawingActive(false);
  };

  // Start collection presentation
  const startCollectionPresentation = (collection) => {
    const slides = [];
    collection.productIds.forEach(pid => {
      const prod = products.find(p => p.id === pid);
      if (!prod) return;

      if (prod.packshot) {
        slides.push({
          url: prod.packshot.startsWith('http') ? prod.packshot : `${IMAGE_BASE}${prod.packshot}`,
          title: `${prod.name} - Packshot`,
          sub: prod.composition
        });
      } else {
        slides.push({
          isMock: true,
          type: 'packshot',
          product: prod,
          title: `${prod.name} - Packshot Info`,
          sub: prod.composition
        });
      }

      if (prod.visualAids && prod.visualAids.length > 0) {
        prod.visualAids.forEach((aid, i) => {
          slides.push({
            url: aid.startsWith('http') ? aid : `${IMAGE_BASE}${aid}`,
            title: `${prod.name} - Slide ${i + 1}`,
            sub: prod.indications
          });
        });
      } else {
        slides.push({
          isMock: true,
          type: 'visualAid',
          product: prod,
          title: `${prod.name} - Detailing Sheet`,
          sub: prod.indications
        });
      }
    });

    if (slides.length === 0) {
      alert("No products in this collection to present!");
      return;
    }

    setPresentationSlides(slides);
    setCurrentSlideIndex(0);
    setPresentationMode(true);
    setIsDrawingActive(false);
  };

  // Collection creation handler
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollName) return;
    try {
      await createCollection({
        name: newCollName,
        description: newCollDesc,
        productIds: newCollSelectedProducts
      });
      setNewCollName('');
      setNewCollDesc('');
      setNewCollSelectedProducts([]);
      loadData();
      setCurrentView('dashboard');
      setActiveTab('collections');
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductSelectForCollection = (pid) => {
    setNewCollSelectedProducts(prev => 
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  const handleDeleteCollection = async (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this collection?")) {
      await deleteCollection(id);
      loadData();
    }
  };

  const navigateToProductDetails = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setSelectedProduct(prod);
      setCurrentView('product-detail');
      setActiveDetailTab('packshot');
    } else {
      alert("Product details are not available or it was deleted.");
    }
  };

  // Render Authentication / Verification Flow (Login, Signup, Pending)
  if (!isLoggedIn) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: authView === 'landing' ? '0' : '24px',
          background: authView === 'landing' ? '#fff' : 'linear-gradient(180deg, #090d16 0%, #06090e 100%)',
          color: authView === 'landing' ? '#334155' : '#fff',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {/* Header branding */}
        {authView !== 'landing' && (
          <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '24px' }}>
            <div 
              style={{
                width: '60px',
                height: '60px',
                background: '#fff',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)',
                overflow: 'hidden'
              }}
            >
              {branding.logo ? (
                <img src={branding.logo.startsWith('http') ? branding.logo : `${IMAGE_BASE}${branding.logo}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', textTransform: 'uppercase' }}>
              {branding.companyName || 'RIOMEDICA'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {branding.tagline || 'Healthcare'}
            </span>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
              Interactive Detailing & B2B Portal
            </p>
          </div>
        )}

        {/* VIEW: Welcome Landing View - Split layout: image top, solid bar bottom */}
        {authView === 'landing' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.4s ease-out'
            }}
          >
            {/* Top: background image only - no swipe button behind it */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <img
                src="/landing-bg.jpg"
                alt="Riomedica Landing"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block'
                }}
              />
            </div>

            {/* Bottom: SOLID opaque bar — completely hides background image, no overlap */}
            <div
              style={{
                flexShrink: 0,
                background: '#132b13',
                padding: '12px 20px 28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '8px'
              }}
            >
              <p style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '1px',
                margin: 0,
                textAlign: 'center',
                textTransform: 'uppercase'
              }}>
                Swipe to get started
              </p>
              <SwipeButtonInline onSwipeSuccess={() => setShowGetStartedSheet(true)} />
            </div>
          </div>
        )}

        {/* VIEW: Login View */}
        {authView === 'login' && (
          <div style={{ animation: 'fadeIn 0.25s ease-out', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Back to Welcome Link */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '-4px' }}>
              <button 
                type="button"
                onClick={() => setAuthView('landing')} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-mobile-secondary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '0.8rem', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  padding: '4px 0',
                  outline: 'none'
                }}
              >
                <Icons.ArrowLeft size={16} /> Back to Welcome
              </button>
            </div>
            
            {/* Sliding Role Tab Switcher */}
            <div style={{
              display: 'flex',
              background: 'rgba(9, 13, 22, 0.4)',
              border: '1px solid var(--border-mobile)',
              borderRadius: '12px',
              padding: '4px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setLoginRoleTab('distributor');
                  setLoginError('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 6px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: loginRoleTab === 'distributor' ? '#fff' : 'var(--text-mobile-secondary)',
                  background: loginRoleTab === 'distributor' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  boxShadow: loginRoleTab === 'distributor' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Icons.Building size={14} /> Franchise Partner
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginRoleTab('mr');
                  setLoginError('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 6px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: loginRoleTab === 'mr' ? '#fff' : 'var(--text-mobile-secondary)',
                  background: loginRoleTab === 'mr' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  boxShadow: loginRoleTab === 'mr' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Icons.UserCheck size={14} /> Medical Rep (MR)
              </button>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-display)', textAlign: 'center', color: '#fff' }}>
              {loginRoleTab === 'mr' ? 'Representative Sign-In' : 'Partner Sign-In'}
            </h3>
            
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="auth-input-container">
                <Icons.User size={18} />
                <input 
                  type="text" 
                  placeholder={loginRoleTab === 'mr' ? 'MR Login Username' : 'Username'} 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-container">
                <Icons.Lock size={18} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              {loginError && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Icons.AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>{loginError}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary-mobile"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '4px' }}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>Verifying Credentials...</>
                ) : (
                  <><Icons.LogIn size={16} /> Sign In</>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '6px', borderTop: '1px solid #1f2b45', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <button 
                  onClick={() => {
                    setAuthView('forgot-password');
                    setForgotStep(1);
                    setForgotUsernameOrEmail('');
                    setForgotOtpCode('');
                    setForgotNewPassword('');
                    setForgotConfirmPassword('');
                    setForgotError('');
                    setForgotSuccess(false);
                    setMockEmailHint('');
                  }}
                  style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Forgot Password?
                </button>
              </div>
              {loginRoleTab !== 'mr' && (
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Are you a new franchise owner?</span>
                  <button 
                    onClick={() => setAuthView('signup')}
                    style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700, display: 'block', margin: '6px auto 0 auto', borderBottom: '1.5px solid #10b981' }}
                  >
                    Register Your Firm
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: Registration / Sign-Up Form */}
        {authView === 'signup' && (
          <div style={{ animation: 'fadeIn 0.25s ease-out', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setAuthView('login')} style={{ color: '#fff', padding: '4px' }}>
                <Icons.ArrowLeft size={18} />
              </button>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                Register Pharmacy / Franchise
              </h3>
            </div>

            <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Pharmacy / Firm Brand Name *
                </label>
                <div className="auth-input-container">
                  <Icons.Building size={16} />
                  <input 
                    type="text" 
                    placeholder="e.g., Pooja Medicos" 
                    value={regFirmName}
                    onChange={(e) => setRegFirmName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Owner / Proprietor Full Name *
                </label>
                <div className="auth-input-container">
                  <Icons.User size={16} />
                  <input 
                    type="text" 
                    placeholder="e.g., Mr. Pooja Patel" 
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                    Mobile Number *
                  </label>
                  <div className="auth-input-container" style={{ padding: '14px 10px' }}>
                    <Icons.Phone size={16} />
                    <input 
                      type="tel" 
                      placeholder="Mobile" 
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                    Email Address *
                  </label>
                  <div className="auth-input-container" style={{ padding: '14px 10px' }}>
                    <Icons.Mail size={16} />
                    <input 
                      type="email" 
                      placeholder="Email" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Document upload dropzones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                    Drug License Copy *
                  </label>
                  <div 
                    className="auth-file-box"
                    onClick={() => document.getElementById('reg-dl-input').click()}
                  >
                    <Icons.FileText size={20} color={regDrugFile ? '#10b981' : 'rgba(16, 185, 129, 0.4)'} />
                    <span style={{ fontSize: '0.65rem', color: regDrugFile ? '#10b981' : '#fff', fontWeight: 600, display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {regDrugFile ? regDrugFile.name : 'Upload Drug License'}
                    </span>
                  </div>
                  <input 
                    id="reg-dl-input"
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => setRegDrugFile(e.target.files[0])}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                      GST Copy (Option 1)
                    </label>
                    <div 
                      className="auth-file-box"
                      onClick={() => document.getElementById('reg-gst-input').click()}
                    >
                      <Icons.FileText size={20} color={regGstFile ? '#10b981' : 'rgba(16, 185, 129, 0.4)'} />
                      <span style={{ fontSize: '0.65rem', color: regGstFile ? '#10b981' : '#fff', fontWeight: 600, display: 'block', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {regGstFile ? regGstFile.name : 'Upload GST Copy'}
                      </span>
                    </div>
                    <input 
                      id="reg-gst-input"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => setRegGstFile(e.target.files[0])}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                      PAN Card (Option 2)
                    </label>
                    <div 
                      className="auth-file-box"
                      onClick={() => document.getElementById('reg-pan-input').click()}
                    >
                      <Icons.FileText size={20} color={regPanFile ? '#10b981' : 'rgba(16, 185, 129, 0.4)'} />
                      <span style={{ fontSize: '0.65rem', color: regPanFile ? '#10b981' : '#fff', fontWeight: 600, display: 'block', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {regPanFile ? regPanFile.name : 'Upload PAN Card'}
                      </span>
                    </div>
                    <input 
                      id="reg-pan-input"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => setRegPanFile(e.target.files[0])}
                    />
                  </div>
                </div>
              </div>

              {regError && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: '10px' }}>
                  {regError}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary-mobile"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px' }}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>Submitting files...</>
                ) : (
                  <><Icons.UserPlus size={16} /> Submit Documents</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* VIEW: Forgot / Reset Password Form */}
        {authView === 'forgot-password' && (
          <div style={{ animation: 'fadeIn 0.25s ease-out', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => setAuthView('login')} 
                style={{ color: '#fff', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                disabled={isSendingForgotCode || isResettingPassword}
              >
                <Icons.ArrowLeft size={18} />
              </button>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                Reset Password
              </h3>
            </div>

            {forgotSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0', textAlign: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                <div 
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    background: 'rgba(16,185,129,0.15)', 
                    border: '2px solid #10b981', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#10b981', 
                    boxShadow: '0 0 15px rgba(16,185,129,0.2)' 
                  }}
                >
                  <Icons.CheckCheck size={28} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Password Updated!</h4>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px', lineHeight: '1.4' }}>
                    Your password has been successfully verified by OTP and updated. You can now log in.
                  </p>
                </div>
                <button 
                  className="btn-primary-mobile"
                  onClick={() => setAuthView('login')}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <div>
                {forgotStep === 1 ? (
                  <form onSubmit={handleForgotSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                      Enter your registered username or email address below. We'll send a 6-digit OTP code to verify your request.
                    </p>

                    <div className="auth-input-container">
                      <Icons.Mail size={18} />
                      <input 
                        type="text" 
                        placeholder="Username or Email" 
                        value={forgotUsernameOrEmail}
                        onChange={(e) => setForgotUsernameOrEmail(e.target.value)}
                        required
                      />
                    </div>

                    {forgotError && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                        {forgotError}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn-primary-mobile"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px' }}
                      disabled={isSendingForgotCode}
                    >
                      {isSendingForgotCode ? 'Sending OTP...' : 'Send Verification OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                      We've sent a 6-digit verification code. Please enter it below along with your new password.
                    </p>

                    <div className="auth-input-container">
                      <Icons.Key size={18} />
                      <input 
                        type="text" 
                        placeholder="Enter 6-digit OTP" 
                        maxLength={6}
                        value={forgotOtpCode}
                        onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, ''))}
                        style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.1rem', fontWeight: 700 }}
                        required
                      />
                    </div>

                    <div className="auth-input-container">
                      <Icons.Lock size={18} />
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="auth-input-container">
                      <Icons.Lock size={18} />
                      <input 
                        type="password" 
                        placeholder="Confirm New Password" 
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    {forgotError && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                        {forgotError}
                      </div>
                    )}


                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button 
                        type="button" 
                        className="btn-secondary-mobile"
                        onClick={() => setForgotStep(1)}
                        style={{ flex: 1, padding: '12px' }}
                        disabled={isResettingPassword}
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary-mobile"
                        style={{ flex: 2, padding: '12px' }}
                        disabled={isResettingPassword}
                      >
                        {isResettingPassword ? 'Updating...' : 'Reset Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Registration Pending Screen */}
        {authView === 'pending' && (
          <div style={{ animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', flex: 1, padding: '20px 0' }}>
            <div 
              style={{
                width: '72px',
                height: '72px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                boxShadow: '0 0 20px rgba(16,185,129,0.2)'
              }}
            >
              <Icons.CheckCheck size={36} strokeWidth={2.5} />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800 }}>
                Verification Pending
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-mobile-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                Your firm details, Drug License, and GST or PAN card copy have been successfully uploaded and sent to <strong>Riomedica Admin</strong>.
              </p>
              <p style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '16px', fontWeight: '700', border: '1px dashed rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.05)', padding: '12px', borderRadius: '12px' }}>
                Login details will be generated and sent to you once verified!
              </p>
            </div>

            <button 
              onClick={() => {
                setAuthView('login');
                setRegFirmName('');
                setRegOwnerName('');
                setRegMobile('');
                setRegEmail('');
                setRegDrugFile(null);
                setRegGstFile(null);
                setRegPanFile(null);
              }}
              className="btn-secondary-mobile"
              style={{ width: '100%', marginTop: '20px' }}
            >
              Back to Login
            </button>
          </div>
        )}

        {/* --- BOTTOM SHEET SELECTOR FOR GETTING STARTED --- */}
        {showGetStartedSheet && (
          <div
            onClick={() => setShowGetStartedSheet(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(9, 13, 22, 0.65)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            {/* Sheet Body */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(20, 30, 48, 0.95)',
                borderTop: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '24px 24px 0px 0px',
                padding: '28px 24px 40px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                color: '#fff'
              }}
            >
              {/* Handle Bar */}
              <div
                style={{
                  width: '40px',
                  height: '5px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '3px',
                  margin: '0 auto 8px auto'
                }}
              />

              {/* Header Content */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div 
                  style={{
                    width: '56px',
                    height: '56px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    margin: '0 auto 12px auto',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Icons.Activity size={26} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '6px', lineHeight: 1.3 }}>
                  Login &amp; Signup as Franchise Partner
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-mobile-secondary)', maxWidth: '280px', margin: '0 auto' }}>
                  Sign in to your existing account or register your firm as a new Riomedica franchise partner
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Login Button */}
                <button
                  onClick={() => {
                    setShowGetStartedSheet(false);
                    setAuthView('login');
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icons.LogIn size={18} /> Sign In to Portal
                </button>

                {/* Register Button */}
                <button
                  onClick={() => {
                    setShowGetStartedSheet(false);
                    setAuthView('signup');
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icons.UserPlus size={18} /> Register Your Firm
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setShowGetStartedSheet(false)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: 'var(--text-mobile-secondary)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- GLASSMORPHIC EMAIL OTP VERIFICATION MODAL (REGISTRATION) --- */}
        {showMobileOtpModal && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(9, 13, 22, 0.9)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '24px',
              animation: 'fadeIn 0.25s ease-out'
            }}
          >
            <div 
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid var(--border-mobile)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div 
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10b981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  margin: '0 auto'
                }}
              >
                <Icons.Mail size={28} />
              </div>
 
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800 }}>Verify Email Address</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
                  A 6-digit verification code has been sent to your email <strong>{regEmail}</strong>.
                </p>
              </div>
 
              <form onSubmit={handleVerifyMobileAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="auth-input-container">
                  <Icons.Key size={18} />
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    maxLength={6}
                    value={regMobileOtpCode}
                    onChange={(e) => setRegMobileOtpCode(e.target.value.replace(/\D/g, ''))}
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.1rem', fontWeight: 700 }}
                    required
                  />
                </div>
 
                {regMobileOtpError && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                    {regMobileOtpError}
                  </div>
                )}
 

 
 
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button 
                    type="button" 
                    className="btn-secondary-mobile"
                    onClick={() => setShowMobileOtpModal(false)}
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary-mobile"
                    style={{ flex: 2, padding: '12px' }}
                    disabled={isVerifyingMobileOtp}
                  >
                    {isVerifyingMobileOtp ? 'Verifying...' : 'Verify & Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- GLASSMORPHIC EMAIL OTP VERIFICATION MODAL (LOGIN) --- */}
        {showLoginOtpModal && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(9, 13, 22, 0.9)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '24px',
              animation: 'fadeIn 0.25s ease-out'
            }}
          >
            <div 
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid var(--border-mobile)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div 
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10b981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  margin: '0 auto'
                }}
              >
                <Icons.Mail size={28} />
              </div>

              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800 }}>Verify Sign-In</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
                  A 6-digit verification code has been sent to your email <strong>{pendingLoginUser?.email}</strong>.
                </p>
              </div>

              <form onSubmit={handleLoginOtpVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="auth-input-container">
                  <Icons.Key size={18} />
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    maxLength={6}
                    value={loginOtpCode}
                    onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, ''))}
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.1rem', fontWeight: 700 }}
                    required
                  />
                </div>

                {loginOtpError && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                    {loginOtpError}
                  </div>
                )}


                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button 
                    type="button" 
                    className="btn-secondary-mobile"
                    onClick={() => {
                      setShowLoginOtpModal(false);
                      setPendingLoginUser(null);
                      setPendingUserRole('');
                    }}
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary-mobile"
                    style={{ flex: 2, padding: '12px' }}
                    disabled={isVerifyingLoginOtp}
                  >
                    {isVerifyingLoginOtp ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '24px', fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>
          Restricted access for pharmacy franchise owners & verified detailers.
        </div>
      </div>
    );
  }

  // Render Presentation Fullscreen Mode
  if (presentationMode) {
    const slide = presentationSlides[currentSlideIndex];
    return (
      <div className="presentation-overlay">
        {/* Presentation Header */}
        <div className="presentation-header">
          <div className="presentation-title-block">
            <h4>{slide.title}</h4>
            <p>{slide.sub}</p>
          </div>
          <div className="presentation-controls">
            <button 
              className={`btn-pres-action ${isDrawingActive ? 'active' : ''}`}
              onClick={() => setIsDrawingActive(!isDrawingActive)}
              title="Toggle Pen Annotations"
            >
              <Icons.PenTool size={18} />
            </button>
            <button 
              className="btn-pres-action"
              onClick={() => setPresentationMode(false)}
              style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
              title="Exit Detailer"
            >
              <Icons.X size={18} />
            </button>
          </div>
        </div>

        {/* Presentation Body */}
        <div className="presentation-body">
          <CanvasDraw isActive={isDrawingActive} />

          {currentSlideIndex > 0 && !isDrawingActive && (
            <button 
              className="nav-arrow nav-arrow-left" 
              onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}
            >
              <Icons.ChevronLeft size={24} />
            </button>
          )}

          {currentSlideIndex < presentationSlides.length - 1 && !isDrawingActive && (
            <button 
              className="nav-arrow nav-arrow-right" 
              onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
            >
              <Icons.ChevronRight size={24} />
            </button>
          )}

          {/* Current Slide View */}
          <div className="slide-image-wrapper">
            {slide.isMock ? (
              <div 
                style={{
                  width: '90%',
                  height: '80%',
                  background: 'linear-gradient(135deg, #131b2e 0%, #0d1220 100%)',
                  border: '2px solid #1f2b45',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '40px',
                  justifyContent: 'space-between',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  userSelect: 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 800, letterSpacing: '1.5px' }}>
                        {getCategoryName(slide.product.categoryId)}
                      </span>
                      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.5rem', color: '#fff', marginTop: '4px' }}>
                        {slide.product.name}
                      </h1>
                    </div>
                    <div style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px' }}>
                      <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.9rem' }}>RIOMEDICA</span>
                    </div>
                  </div>
 
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: '#10b981', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px', fontWeight: 700 }}>
                      Active Composition
                    </h4>
                    <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 500, lineHeight: '1.4' }}>
                      {slide.product.composition}
                    </p>
                  </div>
 
                  {slide.type === 'packshot' ? (
                    <div>
                      <h4 style={{ color: '#10b981', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px', fontWeight: 700 }}>
                        Dosage & Administration
                      </h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>{slide.product.dosage || 'As directed by the physician.'}</p>
                    </div>
                  ) : (
                    <div>
                      <h4 style={{ color: '#10b981', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px', fontWeight: 700 }}>
                        Key Medical Indications
                      </h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>{slide.product.indications}</p>
                    </div>
                  )}
                </div>

                <div 
                  style={{ 
                    borderTop: '1px solid #1f2b45', 
                    paddingTop: '20px', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: '#64748b'
                  }}
                >
                  <span>Riomedica Scientific Detailing Desk</span>
                  <span>Swipe to proceed &gt;</span>
                </div>
              </div>
            ) : (
              <img src={slide.url} alt={slide.title} />
            )}
          </div>
        </div>

        {/* Presentation Footer */}
        <div className="presentation-footer">
          {presentationSlides.map((_, i) => (
            <div 
              key={i} 
              className={`dot-indicator ${currentSlideIndex === i ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    );
  }

  const generateOrderPdf = () => {
    const activeItems = cart.filter(item => item.quantity > 0);
    if (activeItems.length === 0) {
      alert("Your cart is empty. Please specify a quantity for at least one item.");
      return false;
    }
    const doc = new jsPDF();
    
    // Header design
    doc.setFillColor(16, 185, 129); // Riomedica Green
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(branding.companyName || 'RIOMEDICA HEALTHCARE', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(branding.tagline || 'B2B Detailing & Partner Portal', 20, 32);
    
    // Invoice details
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('B2B ORDER RECEIPT', 20, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Order ID: ORD-${Date.now()}`, 20, 65);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 72);
    doc.text(`Firm Name: ${loggedInUser?.firmName || 'N/A'}`, 20, 79);
    doc.text(`Representative: ${loggedInUser?.ownerName || 'N/A'} (${userRole.toUpperCase()})`, 20, 86);
    
    let currentYPos = 95;
    if (userRole === 'mr' && selectedDoctorName) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Target Doctor: ${selectedDoctorName} (${doctorSpecialty || 'General'}, ${doctorLocation || 'N/A'})`, 20, 93);
      doc.setFont('helvetica', 'normal');
      currentYPos = 101;
    }
    
    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(20, currentYPos, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Product Name', 22, currentYPos + 5);
    doc.text('Quantity (Qty)', 150, currentYPos + 5);
    
    // Table items
    doc.setFont('helvetica', 'normal');
    let yPos = currentYPos + 15;
    
    activeItems.forEach(item => {
      doc.text(item.product.name, 22, yPos);
      doc.text(String(item.quantity), 150, yPos);
      yPos += 8;
    });
    
    // Draw line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    
    // Footer note
    yPos += 20;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for ordering with Riomedica Healthcare.', 20, yPos);
    doc.text('This is a computer-generated order receipt.', 20, yPos + 5);
    
    // Save the PDF
    doc.save(`order_${Date.now()}.pdf`);
    return true;
  };

  const sendWhatsAppOrder = () => {
    // Automatically trigger PDF download first
    if (!generateOrderPdf()) return;
    
    // Build WhatsApp text message
    let messageText = `*RIOMEDICA B2B ORDER DETAILS*\n\n`;
    messageText += `*Firm Name:* ${loggedInUser?.firmName || 'N/A'}\n`;
    messageText += `*Ordered By:* ${loggedInUser?.ownerName || 'N/A'} (${userRole.toUpperCase()})\n`;
    if (userRole === 'mr' && selectedDoctorName) {
      messageText += `*Target Doctor:* ${selectedDoctorName} (${doctorSpecialty || 'General'}, ${doctorLocation || 'N/A'})\n`;
    }
    messageText += `*Date:* ${new Date().toLocaleDateString()}\n\n`;
    messageText += `*Order Items:*\n`;
    
    cart.filter(item => item.quantity > 0).forEach(item => {
      messageText += `• ${item.product.name} x ${item.quantity}\n`;
    });
    
    messageText += `\n_Note: PDF receipt has been downloaded to my device. I am sending this order summary for quick verification._`;
    
    const encodedText = encodeURIComponent(messageText);
    const cleanedPhone = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanedPhone}?text=${encodedText}`, '_blank');
  };

  const submitOrderToAdmin = async () => {
    const activeItems = cart.filter(i => i.quantity > 0);
    if (activeItems.length === 0) {
      alert("Your cart is empty. Please specify a quantity for at least one item.");
      return;
    }
    if (userRole === 'mr' && !selectedDoctorName.trim()) {
      alert("Please select or enter a Doctor Name for this order.");
      return;
    }

    const orderPayload = {
      firmName: loggedInUser?.firmName || 'Unknown Pharmacy',
      userName: loggedInUser?.ownerName || 'Anonymous Rep',
      createdByRole: userRole,
      distributorId: userRole === 'mr' ? loggedInUser.distributorId : loggedInUser?.id,
      mrId: userRole === 'mr' ? loggedInUser.id : undefined,
      status: 'Pending',
      doctorDetails: userRole === 'mr' ? {
        name: selectedDoctorName,
        specialty: doctorSpecialty || 'General',
        location: doctorLocation || 'N/A'
      } : undefined,
      items: activeItems.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity
      }))
    };

    try {
      // 🔥 Write to Firebase first (primary store)
      await fbAddOrder(orderPayload);

      // Also try local server (non-blocking)
      addOrder(orderPayload).catch(() => {});

      alert(userRole === 'mr' ? "Order submitted to Franchise successfully!" : "Order submitted to Admin successfully!");
      clearCart();
      setIsCartOpen(false);
      setSelectedDoctorName('');
      setDoctorSpecialty('');
      setDoctorLocation('');
      setIsNewDoctorMode(false);
    } catch (err) {
      console.error("Order submission error:", err);
      // Fallback to local server if Firebase fails
      try {
        const res = await addOrder(orderPayload);
        if (res && res.success) {
          alert(userRole === 'mr' ? "Order submitted to Franchise successfully!" : "Order submitted to Admin successfully!");
          clearCart();
          setIsCartOpen(false);
          setSelectedDoctorName('');
          setDoctorSpecialty('');
          setDoctorLocation('');
          setIsNewDoctorMode(false);
        }
      } catch (localErr) {
        alert("Order saved locally. Will sync when connection is restored.");
        clearCart();
        setIsCartOpen(false);
      }
    }
  };

  // Main UI Wrapper
  return (
    <div className={`mobile-app-container mobile-${theme}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg-mobile)', color: 'var(--text-mobile-primary)' }}>
      {/* Mobile App Header */}
      <div className="mobile-header">
        <div className="mobile-header-logo">
          {branding.logo ? (
            <img 
              src={branding.logo.startsWith('http') ? branding.logo : `${IMAGE_BASE}${branding.logo}`} 
              alt="Logo" 
              style={{ width: '75px', height: '75px', borderRadius: '12px', objectFit: 'contain', background: '#fff', padding: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            />
          ) : (
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ width: '75px', height: '75px', borderRadius: '12px', objectFit: 'contain', background: '#fff', padding: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            />
          )}
          <div>
            <div className="logo-text" style={{ textTransform: 'uppercase' }}>
              {branding.companyName || 'RIOMEDICA'}
            </div>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#10b981', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', lineHeight: '1.3', marginTop: '2px' }}>
              {branding.tagline || 'Healthcare'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: theme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
              color: theme === 'dark' ? '#f59e0b' : '#475569',
              border: theme === 'dark' ? '1px solid var(--border-mobile)' : '1px solid var(--border-mobile)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Icons.Sun size={14} /> : <Icons.Moon size={14} />}
          </button>
          {isFirebaseConnected ? (
            <span 
              style={{
                fontSize: '0.6rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '800'
              }}
            >
              FIREBASE LIVE
            </span>
          ) : isOfflineMode ? (
            <span 
              style={{
                fontSize: '0.6rem',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '800'
              }}
            >
              LOCAL
            </span>
          ) : null}
          {/* Shopping Cart Header Button */}
          {isLoggedIn && (
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: isCartOpen ? 'linear-gradient(135deg, #10b981, #34d399)' : '#1e293b',
                color: '#fff',
                border: isCartOpen ? 'none' : '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              title="Shopping Cart"
            >
              <Icons.ShoppingCart size={14} />
              {cart.length > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#e11d48',
                    color: '#fff',
                    borderRadius: '50%',
                    fontSize: '0.6rem',
                    width: '15px',
                    height: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 0 5px rgba(225,29,72,0.6)'
                  }}
                >
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
          )}
          {/* Relocated Profile Avatar Button in Header */}
          <button 
            onClick={() => { setActiveTab('profile'); setCurrentView('dashboard'); }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: activeTab === 'profile' ? 'linear-gradient(135deg, #10b981, #34d399)' : '#1e293b',
              color: '#fff',
              border: activeTab === 'profile' ? 'none' : '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="User Profile"
          >
            <Icons.User size={14} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mobile-content">
        
        {/* VIEW: Home Dashboard */}
        {currentView === 'dashboard' && activeTab === 'home' && (
          <>
            {/* Search */}
            <div className="search-container">
              <Icons.Search size={18} />
              <input 
                type="text" 
                placeholder="Search medicines, compositions..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveTab('catalog');
                }}
              />
            </div>

            {/* Banners Slideshow Carousel (Relocated: Product Advertisement Showcase) */}
            <div 
              style={{ 
                position: 'relative', 
                height: '145px', 
                borderRadius: '20px', 
                overflow: 'hidden', 
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
                border: '1px solid var(--border-mobile)',
                marginBottom: '16px',
                cursor: (banners.length > 0 && (banners[currentBannerIndex]?.linkUrl || banners[currentBannerIndex]?.linkProductId)) ? 'pointer' : 'default',
                background: 'linear-gradient(135deg, #06b6d4, #10b981)'
              }}
              onClick={() => {
                if (banners.length > 0) {
                  handleBannerClick(banners[currentBannerIndex]);
                }
              }}
            >
              {banners.length > 0 ? (
                banners.map((banner, idx) => {
                  const isCurrent = idx === currentBannerIndex;
                  return (
                    <div
                      key={banner.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: isCurrent ? 1 : 0,
                        transform: isCurrent ? 'scale(1)' : 'scale(1.05)',
                        transition: 'opacity 0.8s ease, transform 0.8s ease',
                        pointerEvents: isCurrent ? 'auto' : 'none',
                      }}
                    >
                      {/* Banner image */}
                      <img
                        src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `${IMAGE_BASE}${banner.imageUrl}`}
                        alt={banner.title || 'Promotional Banner'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {/* Visual gradient overlay for title readability */}
                      {banner.title && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
                            padding: '24px 16px 12px 16px',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <h4 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                            {banner.title}
                          </h4>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Fallback Default Advertisement Banner when banners are empty */
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '20px', color: '#fff', position: 'relative' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px', width: 'max-content' }}>
                    Featured Advertisement
                  </span>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                    Riomedica Healthcare Portfolio
                  </h4>
                  <p style={{ fontSize: '0.75rem', margin: 0, color: 'rgba(255,255,255,0.85)', maxWidth: '85%', lineHeight: '1.4' }}>
                    Explore our range of premium formulations, critical care infusions, and B2B offers.
                  </p>
                  <Icons.Award size={80} style={{ position: 'absolute', right: '-10px', bottom: '-10px', color: 'rgba(255,255,255,0.12)' }} />
                </div>
              )}

              {/* Custom dots */}
              {banners.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '12px',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 10,
                  }}
                >
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentBannerIndex(idx);
                      }}
                      style={{
                        width: idx === currentBannerIndex ? '16px' : '6px',
                        height: '6px',
                        borderRadius: '3px',
                        background: idx === currentBannerIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Welcome banner custom tailored for logged in Pharmacy Firm */}
            <div 
              style={{
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                padding: '20px',
                borderRadius: '20px',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>
                Active Session: {loggedInUser?.firmName || 'Franchise Partner'}
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '4px' }}>
                Digital Detailing Suite
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, maxWidth: '75%' }}>
                Select and present our medical portfolio to doctors dynamically. Draw notes on-screen.
              </p>
              <Icons.Presentation 
                size={80} 
                style={{ 
                  position: 'absolute', 
                  right: '-10px', 
                  bottom: '-10px', 
                  color: 'rgba(255,255,255,0.15)' 
                }} 
              />
            </div>

            {/* Field Operations Panel */}
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
                {userRole === 'mr' ? 'Field Representative Actions' : 'Franchise & Field Operations'}
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {userRole !== 'mr' ? (
                  <>
                    {/* MR Team Directory Card */}
                    <button 
                      className="premium-op-card"
                      onClick={() => {
                        setCurrentView('mr-team');
                      }}
                      style={{
                        background: 'var(--bg-mobile-card)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '10px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#10b981' 
                      }}>
                        <Icons.Users size={22} />
                      </div>
                      <div>
                        <h5 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>MR Team Directory</h5>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                          Manage and create login IDs for your Medical Reps.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', marginTop: 'auto' }}>
                        View Team <Icons.ArrowRight size={12} />
                      </span>
                    </button>

                    {/* Doctor Visit Logs Card */}
                    <button 
                      className="premium-op-card"
                      onClick={() => {
                        setCurrentView('doctor-visits');
                      }}
                      style={{
                        background: 'var(--bg-mobile-card)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '10px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#10b981' 
                      }}>
                        <Icons.ClipboardList size={22} />
                      </div>
                      <div>
                        <h5 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>Doctor Visit Logs</h5>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                          Track and inspect detailed visit reports by your team.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', marginTop: 'auto' }}>
                        View Logs <Icons.ArrowRight size={12} />
                      </span>
                    </button>

                    {/* Incoming MR Orders Card */}
                    <button 
                      className="premium-op-card"
                      onClick={() => {
                        setCurrentView('mr-orders');
                      }}
                      style={{
                        background: 'var(--bg-mobile-card)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '10px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#10b981' 
                      }}>
                        <Icons.ShoppingCart size={22} />
                      </div>
                      <div>
                        <h5 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>MRs Upcoming Orders</h5>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                          View and manage upcoming orders sent by your Medical Reps.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', marginTop: 'auto' }}>
                        View Orders <Icons.ArrowRight size={12} />
                      </span>
                    </button>

                    {/* Territory Coverage Map Card */}
                    <button 
                      className="premium-op-card"
                      onClick={() => {
                        setCurrentView('territory-map');
                      }}
                      style={{
                        background: 'var(--bg-mobile-card)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '10px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#10b981' 
                      }}>
                        <Icons.Map size={22} />
                      </div>
                      <div>
                        <h5 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>Territory Coverage Map</h5>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                          Visual zone map highlighting medical call density.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', marginTop: 'auto' }}>
                        Open Map <Icons.ArrowRight size={12} />
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Log Doctor Call Card */}
                    <button 
                      className="premium-op-card"
                      onClick={() => {
                        setVisitDoctorName('');
                        setVisitSpecialty('General');
                        setVisitLocation('');
                        setVisitRemarks('');
                        setVisitProductsDetailed([]);
                        setVisitMrId(loggedInUser.id);
                        setIsVisitModalOpen(true);
                      }}
                      style={{
                        background: 'var(--bg-mobile-card)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '10px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#10b981' 
                      }}>
                        <Icons.UserPlus size={22} />
                      </div>
                      <div>
                        <h5 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>Log Doctor Call</h5>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                          Record a new scientific detailing call in the field.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', marginTop: 'auto' }}>
                        Start Log <Icons.Plus size={12} />
                      </span>
                    </button>

                    {/* My Call History Card */}
                    <button 
                      className="premium-op-card"
                      onClick={() => {
                        setCurrentView('doctor-visits');
                      }}
                      style={{
                        background: 'var(--bg-mobile-card)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '10px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#10b981' 
                      }}>
                        <Icons.History size={22} />
                      </div>
                      <div>
                        <h5 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>My Call History</h5>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                          Inspect your personal logged detailing calls.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', marginTop: 'auto' }}>
                        View History <Icons.ArrowRight size={12} />
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Categories */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>Therapeutic Classes</h4>
                <button 
                  onClick={() => { setActiveTab('catalog'); setSelectedCategory('all'); }} 
                  style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  View All
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {categories.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setActiveTab('catalog');
                    }}
                    style={{
                      background: 'var(--bg-mobile-card)',
                      border: '1px solid var(--border-mobile)',
                      padding: '12px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'center',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ color: '#10b981' }}>
                      {c.id === 'gastro' && <Icons.Activity size={20} />}
                      {c.id === 'injections' && <Icons.Droplet size={20} />}
                      {c.id === 'dental' && <Icons.ShieldAlert size={20} />}
                      {c.id === 'pain' && <Icons.Zap size={20} />}
                      {c.id === 'derma' && <Icons.Sparkles size={20} />}
                      {c.id === 'cough' && <Icons.Wind size={20} />}
                      {!['gastro', 'injections', 'dental', 'pain', 'derma', 'cough'].includes(c.id) && <Icons.HeartPulse size={20} />}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-mobile-primary)' }}>
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Product Spotlights */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '12px' }}>
                Featured Formulations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {products.slice(0, 3).map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setSelectedProduct(prod);
                      setCurrentView('product-detail');
                      setActiveDetailTab('packshot');
                    }}
                    style={{
                      background: 'var(--bg-mobile-card)',
                      border: '1px solid var(--border-mobile)',
                      borderRadius: '16px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="product-image-container" style={{ width: '48px', height: '48px' }}>
                      {prod.packshot ? (
                        <img src={prod.packshot.startsWith('http') ? prod.packshot : `${IMAGE_BASE}${prod.packshot}`} alt={prod.name} />
                      ) : (
                        <span className="fallback-image-text" style={{ fontSize: '0.65rem' }}>{prod.name.split(' ')[0]}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{prod.name}</h5>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-mobile-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                        {prod.composition}
                      </p>
                    </div>
                    <Icons.ChevronRight size={16} color="var(--text-mobile-secondary)" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* VIEW: Franchise MR Team Directory */}
        {currentView === 'mr-team' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setCurrentView('dashboard')} 
                style={{ color: '#fff', padding: '4px' }}
              >
                <Icons.ArrowLeft size={20} />
              </button>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 800 }}>
                  Franchise Portal
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
                  Medical Reps (MRs)
                </h3>
              </div>
            </div>

            {/* Registration Form Box */}
            <div 
              style={{
                background: 'var(--bg-mobile-card)',
                border: '1px solid var(--border-mobile)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
              }}
            >
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                <Icons.UserPlus size={16} /> Register New Representative
              </h4>

              <form onSubmit={handleAddMr} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rohan Mehta"
                      value={mrName}
                      onChange={(e) => setMrName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.4)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                      Mobile Number *
                    </label>
                    <input 
                      type="tel" 
                      placeholder="10-digit number"
                      value={mrMobile}
                      onChange={(e) => setMrMobile(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.4)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      placeholder="name@company.com"
                      value={mrEmail}
                      onChange={(e) => setMrEmail(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.4)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                      Assigned Territory *
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. West Zone"
                      value={mrTerritory}
                      onChange={(e) => setMrTerritory(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.4)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#10b981', display: 'block', marginBottom: '4px', fontWeight: 800 }}>
                      Set Login Username *
                    </label>
                    <input 
                      type="text" 
                      placeholder="login username"
                      value={mrUsername}
                      onChange={(e) => setMrUsername(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(9, 13, 22, 0.4)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#10b981', display: 'block', marginBottom: '4px', fontWeight: 800 }}>
                      Set Login Password *
                    </label>
                    <input 
                      type="text" 
                      placeholder="login password"
                      value={mrPassword}
                      onChange={(e) => setMrPassword(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(9, 13, 22, 0.4)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                </div>

                {mrFormError && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
                    {mrFormError}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn-primary-mobile"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', marginTop: '6px' }}
                  disabled={isAddingMr}
                >
                  {isAddingMr ? 'Creating Representative Account...' : 'Register and Grant ID'}
                </button>
              </form>
            </div>

            {/* List of Registered MRs */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '12px', color: '#fff' }}>
                Your Active Representatives ({mrs.filter(mr => mr.distributorId === loggedInUser?.id).length})
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mrs.filter(mr => mr.distributorId === loggedInUser?.id).length > 0 ? (
                  mrs.filter(mr => mr.distributorId === loggedInUser?.id).map((mr) => (
                    <div 
                      key={mr.id}
                      style={{
                        background: 'var(--bg-mobile-card)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h5 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>{mr.name}</h5>
                          <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '1px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px', fontWeight: 700 }}>
                            Territory: {mr.territory}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleResetMrPassword(mr.id, mr.name)}
                            style={{ color: '#10b981', padding: '4px' }}
                            title="Reset MR Password"
                          >
                            <Icons.Key size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteMr(mr.id)}
                            style={{ color: '#ef4444', padding: '4px' }}
                            title="Revoke Credentials & Delete MR"
                          >
                            <Icons.UserX size={18} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: 'var(--text-mobile-secondary)', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                        <div>
                          <span style={{ display: 'block', color: 'var(--text-mobile-muted)', fontSize: '0.65rem' }}>Login User</span>
                          <strong style={{ color: '#fff' }}>{mr.loginDetails?.username || mr.username}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: 'var(--text-mobile-muted)', fontSize: '0.65rem' }}>Login Pass</span>
                          <strong style={{ color: '#fff' }}>{mr.loginDetails?.password || mr.password}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: 'var(--text-mobile-muted)', fontSize: '0.65rem' }}>Mobile</span>
                          <span>{mr.mobile}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: 'var(--text-mobile-muted)', fontSize: '0.65rem' }}>Email</span>
                          <span style={{ wordBreak: 'break-all' }}>{mr.email}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-mobile-muted)', background: 'var(--bg-mobile-card)', border: '1px dashed var(--border-mobile)', borderRadius: '16px' }}>
                    <Icons.Users size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.8rem' }}>No MRs registered under this franchise yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Incoming MR Orders */}
        {currentView === 'mr-orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setCurrentView('dashboard')} 
                style={{ color: '#fff', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Icons.ArrowLeft size={20} />
              </button>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 800 }}>
                  Franchise Portal
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
                  MRs Upcoming Orders
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.filter(o => o.createdByRole === 'mr' && o.distributorId === loggedInUser?.id).length > 0 ? (
                orders
                  .filter(o => o.createdByRole === 'mr' && o.distributorId === loggedInUser?.id)
                  .map((ord) => {
                    const dateStr = new Date(ord.createdAt).toLocaleString();
                    return (
                      <div 
                        key={ord.id}
                        style={{
                          background: 'var(--bg-mobile-card)',
                          border: '1px solid var(--border-mobile)',
                          borderRadius: '20px',
                          padding: '16px',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-mobile-muted)', display: 'block' }}>
                              {dateStr}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff', marginTop: '2px', display: 'block' }}>
                              MR: {ord.userName}
                            </span>
                            {ord.doctorDetails && (
                              <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 'bold', display: 'block', marginTop: '3px' }}>
                                For Doctor: {ord.doctorDetails.name} ({ord.doctorDetails.specialty || 'General'}, {ord.doctorDetails.location || 'N/A'})
                              </span>
                            )}
                          </div>
                          <span 
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: '800',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              textTransform: 'uppercase',
                              background: ord.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: ord.status === 'Completed' ? '#10b981' : '#fbbf24',
                              border: ord.status === 'Completed' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                            }}
                          >
                            {ord.status}
                          </span>
                        </div>

                        {/* Items list */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                            Ordered Products
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {ord.items.map((item, idx) => (
                              <div key={idx} style={{ fontSize: '0.78rem', color: '#fff', display: 'flex', justifySelf: 'flex-start', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                  x{item.quantity}
                                </span>
                                <span>{item.productName}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            onClick={async () => {
                              const nextStatus = ord.status === 'Completed' ? 'Pending' : 'Completed';
                              try {
                                await updateOrderStatus(ord.id, nextStatus);
                                loadData();
                              } catch (err) {
                                alert("Failed to update order status.");
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: '10px',
                              background: ord.status === 'Completed' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              border: ord.status === 'Completed' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                              color: ord.status === 'Completed' ? '#fbbf24' : '#10b981',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            {ord.status === 'Completed' ? <Icons.Clock size={12} /> : <Icons.Check size={12} />}
                            {ord.status === 'Completed' ? "Mark Pending" : "Mark Completed"}
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm("Are you sure you want to delete this order record?")) {
                                try {
                                  await deleteOrder(ord.id);
                                  loadData();
                                } catch (err) {
                                  alert("Failed to delete order.");
                                }
                              }
                            }}
                            style={{
                              padding: '10px',
                              borderRadius: '10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#f87171',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Icons.Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-mobile-muted)', background: 'var(--bg-mobile-card)', border: '1px dashed var(--border-mobile)', borderRadius: '16px' }}>
                  <Icons.ShoppingCart size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.8rem' }}>No upcoming orders from your MRs yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: Doctor Visit Logs */}
        {currentView === 'doctor-visits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => setCurrentView('dashboard')} 
                  style={{ color: '#fff', padding: '4px' }}
                >
                  <Icons.ArrowLeft size={20} />
                </button>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 800 }}>
                    {userRole === 'mr' ? 'MR Call Book' : 'Franchise Portal'}
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
                    Doctor Visits
                  </h3>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setVisitDoctorName('');
                  setVisitSpecialty('General');
                  setVisitLocation('');
                  setVisitRemarks('');
                  setVisitProductsDetailed([]);
                  setVisitMrId(userRole === 'mr' ? loggedInUser.id : 'self');
                  setIsVisitModalOpen(true);
                }}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Icons.Plus size={14} /> Log Call
              </button>
            </div>

            {/* Visit Log Cards */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '12px', color: '#fff' }}>
                {userRole === 'mr' ? 'Your Logged Calls' : 'Team Coverage Logs'}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {doctorVisits.length > 0 ? (
                  doctorVisits
                    .filter(visit => {
                      if (userRole === 'mr') {
                        // MR only sees their own visits
                        return visit.mrId === loggedInUser.id;
                      } else {
                        // Franchise owner sees all visits under their distributorId
                        return visit.distributorId === loggedInUser.id;
                      }
                    })
                    .map((visit) => {
                      // Find visitor details
                      const visitorName = visit.mrId === 'self' 
                        ? 'Franchise Owner (Self)' 
                        : (mrs.find(m => m.id === visit.mrId)?.name || `MR ID: ${visit.mrId}`);
                      
                      return (
                        <div 
                          key={visit.id}
                          style={{
                            background: 'var(--bg-mobile-card)',
                            border: '1px solid var(--border-mobile)',
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h5 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{visit.doctorName}</h5>
                              <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                                {visit.specialty}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.Calendar size={12} /> {visit.date}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-mobile-secondary)' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <Icons.MapPin size={12} color="var(--text-mobile-muted)" />
                              <span>{visit.location}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <Icons.User size={12} color="var(--text-mobile-muted)" />
                              <span>Logged By: <strong style={{ color: '#fff' }}>{visitorName}</strong></span>
                            </div>
                          </div>

                          {visit.productsDetailed && visit.productsDetailed.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                              {visit.productsDetailed.map((pid, idx) => {
                                const prod = products.find(p => p.id === pid);
                                return (
                                  <span 
                                    key={idx}
                                    style={{
                                      fontSize: '0.6rem',
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      color: '#10b981',
                                      border: '1px solid rgba(16, 185, 129, 0.2)',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontWeight: '700'
                                    }}
                                  >
                                    {prod ? prod.name : pid}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {visit.remarks && (
                            <div style={{ background: 'rgba(9, 13, 22, 0.4)', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: 'var(--text-mobile-secondary)', marginTop: '4px', borderLeft: '3px solid #10b981' }}>
                              <strong>Remarks:</strong> {visit.remarks}
                            </div>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-mobile-muted)', background: 'var(--bg-mobile-card)', border: '1px dashed var(--border-mobile)', borderRadius: '16px' }}>
                    <Icons.FileText size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.8rem' }}>No visits logged yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Territory Coverage Map */}
        {currentView === 'territory-map' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setCurrentView('dashboard')} 
                style={{ color: '#fff', padding: '4px' }}
              >
                <Icons.ArrowLeft size={20} />
              </button>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 800 }}>
                  Franchise Portal
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
                  Territory Coverage Map
                </h3>
              </div>
            </div>

            {/* Map Statistics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
              <div style={{ background: 'var(--bg-mobile-card)', border: '1px solid var(--border-mobile)', padding: '12px 14px', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-mobile-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Coverage Zones</span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>3 Active</h4>
              </div>
              <div style={{ background: 'var(--bg-mobile-card)', border: '1px solid var(--border-mobile)', padding: '12px 14px', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-mobile-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Call Density</span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{doctorVisits.length} Logs</h4>
              </div>
            </div>

            {/* Interactive Vector Map Mockup */}
            <div 
              style={{
                background: 'var(--bg-mobile-card)',
                border: '1px solid var(--border-mobile)',
                borderRadius: '24px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
                position: 'relative'
              }}
            >
              <div style={{ width: '100%', aspectRatio: '1.3/1', background: 'rgba(9, 13, 22, 0.4)', borderRadius: '16px', border: '1px dashed rgba(16, 185, 129, 0.2)', position: 'relative', overflow: 'hidden' }}>
                
                {/* Visual grid pattern */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundSize: '15px 15px', backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)' }} />

                {/* SVG Vector Zones */}
                <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.5))' }}>
                  {/* Sector 1: West Zone */}
                  <path 
                    d="M 20 20 L 220 20 L 150 180 L 20 200 Z" 
                    fill="rgba(16, 185, 129, 0.08)" 
                    stroke="rgba(16, 185, 129, 0.3)" 
                    strokeWidth="2" 
                    strokeDasharray="4 4"
                  />
                  {/* Sector 2: East Zone */}
                  <path 
                    d="M 220 20 L 380 20 L 380 220 L 260 250 L 150 180 Z" 
                    fill="rgba(16, 185, 129, 0.15)" 
                    stroke="rgba(16, 185, 129, 0.4)" 
                    strokeWidth="2"
                  />
                  {/* Sector 3: Central Zone */}
                  <path 
                    d="M 20 200 L 150 180 L 260 250 L 220 280 L 40 280 Z" 
                    fill="rgba(16, 185, 129, 0.05)" 
                    stroke="rgba(16, 185, 129, 0.2)" 
                    strokeWidth="2"
                  />

                  {/* Hotspots / Markers (interactive pulse dots) */}
                  {/* City Hospital */}
                  <g>
                    <circle cx="100" cy="110" r="10" fill="rgba(16, 185, 129, 0.2)" />
                    <circle cx="100" cy="110" r="4" fill="#10b981" />
                    <text x="115" y="114" fill="#fff" fontSize="10" fontWeight="bold">City Hospital (4 Doctors)</text>
                  </g>

                  {/* Sector 2: East Clinic */}
                  <g>
                    <circle cx="280" cy="90" r="12" fill="rgba(52, 211, 153, 0.25)" />
                    <circle cx="280" cy="90" r="5" fill="#34d399" />
                    <text x="210" y="75" fill="#fff" fontSize="10" fontWeight="bold">East Clinic Hub</text>
                  </g>

                  {/* Sector 3: Central Clinic */}
                  <g>
                    <circle cx="130" cy="230" r="8" fill="rgba(16, 185, 129, 0.15)" />
                    <circle cx="130" cy="230" r="3.5" fill="#10b981" />
                    <text x="145" y="234" fill="#fff" fontSize="10" fontWeight="bold">Metro Plaza MDs</text>
                  </g>
                </svg>

                {/* Legend Overlay */}
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(19, 27, 46, 0.85)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-mobile)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Map Legend</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                    <span>High Density (8+ calls)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    <span>Active Zone (1-7 calls)</span>
                  </div>
                </div>
              </div>

              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px', marginTop: '14px' }}>
                <h5 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: '4px' }}>Zone Coverage Breakdown</h5>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-mobile-secondary)', lineHeight: '1.4' }}>
                  Territory density is calculated dynamically from visits logged by your team. Target <strong>East Zone - Sector 2</strong> for higher brand conversion.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Catalog Search & Filter */}
        {activeTab === 'catalog' && currentView === 'dashboard' && (
          <>
            <div className="search-container">
              <Icons.Search size={18} />
              <input 
                type="text" 
                placeholder="Search all medicines..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="categories-horizontal">
              <button 
                className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`category-chip ${selectedCategory === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="products-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="product-card"
                    onClick={() => {
                      setSelectedProduct(prod);
                      setCurrentView('product-detail');
                      setActiveDetailTab('packshot');
                    }}
                  >
                    <div className="product-image-container">
                      {prod.packshot ? (
                        <img src={prod.packshot.startsWith('http') ? prod.packshot : `${IMAGE_BASE}${prod.packshot}`} alt={prod.name} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Icons.Container size={24} color="#64748b" />
                          <span className="fallback-image-text">{prod.name.split(' ')[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="product-card-info">
                      <h4 className="product-card-title">{prod.name}</h4>
                      <p className="product-card-composition">{prod.composition}</p>
                      {prod.mrp && (
                        <p style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#34d399', margin: '2px 0 4px 0' }}>
                          MRP: {String(prod.mrp).includes('₹') ? prod.mrp : `₹${prod.mrp}`}
                        </p>
                      )}
                      <span className="product-card-tag">{getCategoryName(prod.categoryId)}</span>

                      {/* B2B Cart Add/Qty Control */}
                      {isLoggedIn && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          style={{ 
                            marginTop: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%'
                          }}
                        >
                          {isInCart(prod.id) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', border: '1px solid #10b981', borderRadius: '20px', padding: '2px 8px', width: '100%', justifyContent: 'space-between' }}>
                              <button 
                                onClick={() => {
                                  const current = getProductCartQty(prod.id);
                                  if (current <= 1) {
                                    removeFromCart(prod.id);
                                  } else {
                                    updateCartQuantity(prod.id, current - 1);
                                  }
                                }}
                                style={{ background: 'none', border: 'none', color: '#10b981', padding: '2px 4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={getProductCartQty(prod.id) === 0 ? '' : getProductCartQty(prod.id)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  updateCartQuantity(prod.id, isNaN(val) ? 0 : val);
                                }}
                                onBlur={() => {
                                  if (getProductCartQty(prod.id) <= 0) {
                                    removeFromCart(prod.id);
                                  }
                                }}
                                style={{
                                  width: '32px',
                                  background: 'none',
                                  border: 'none',
                                  color: '#fff',
                                  textAlign: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  outline: 'none',
                                  padding: 0,
                                }}
                              />
                              <button 
                                onClick={() => updateCartQuantity(prod.id, getProductCartQty(prod.id) + 1)}
                                style={{ background: 'none', border: 'none', color: '#10b981', padding: '2px 4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(prod)}
                              style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                border: 'none',
                                color: '#fff',
                                borderRadius: '20px',
                                padding: '4px 12px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: '100%',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Icons.ShoppingCart size={10} /> Add to Cart
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-mobile-secondary)' }}>
                  <Icons.SearchX size={48} style={{ margin: '0 auto 12px auto', color: '#475569' }} />
                  <p>No products found matching your search.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW: New Launches Tab */}
        {activeTab === 'launches' && currentView === 'dashboard' && (
          <>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                Scientific Innovation
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: '#fff', marginTop: '2px' }}>
                New Product Launches
              </h3>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', lineHeight: '1.4' }}>
              Present our latest releases and therapeutic compositions to practitioners with detailing visual aids.
            </p>

            <div className="products-grid" style={{ marginTop: '8px' }}>
              {newLaunchProducts.length > 0 ? (
                newLaunchProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="product-card"
                    style={{ borderColor: 'rgba(16, 185, 129, 0.25)', background: 'linear-gradient(135deg, #131b2e 0%, #0d2825 100%)' }}
                    onClick={() => {
                      setSelectedProduct(prod);
                      setCurrentView('product-detail');
                      setActiveDetailTab('packshot');
                    }}
                  >
                    <div className="product-image-container" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                      {prod.packshot ? (
                        <img src={prod.packshot.startsWith('http') ? prod.packshot : `${IMAGE_BASE}${prod.packshot}`} alt={prod.name} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Icons.Sparkles size={24} color="#10b981" />
                          <span className="fallback-image-text" style={{ color: '#10b981' }}>{prod.name.split(' ')[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="product-card-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 className="product-card-title">{prod.name}</h4>
                        <span style={{ background: '#10b981', color: '#fff', fontSize: '0.55rem', fontWeight: 900, padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          New
                        </span>
                      </div>
                      <p className="product-card-composition" style={{ color: '#a7f3d0' }}>{prod.composition}</p>
                      {prod.mrp && (
                        <p style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#a7f3d0', margin: '2px 0 4px 0' }}>
                          MRP: {String(prod.mrp).includes('₹') ? prod.mrp : `₹${prod.mrp}`}
                        </p>
                      )}
                      <span className="product-card-tag" style={{ background: 'rgba(16,185,129,0.2)', color: '#a7f3d0' }}>
                        {getCategoryName(prod.categoryId)}
                      </span>

                      {/* B2B Cart Add/Qty Control */}
                      {isLoggedIn && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          style={{ 
                            marginTop: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%'
                          }}
                        >
                          {isInCart(prod.id) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', border: '1px solid #10b981', borderRadius: '20px', padding: '2px 8px', width: '100%', justifyContent: 'space-between' }}>
                              <button 
                                onClick={() => {
                                  const current = getProductCartQty(prod.id);
                                  if (current <= 1) {
                                    removeFromCart(prod.id);
                                  } else {
                                    updateCartQuantity(prod.id, current - 1);
                                  }
                                }}
                                style={{ background: 'none', border: 'none', color: '#10b981', padding: '2px 4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={getProductCartQty(prod.id) === 0 ? '' : getProductCartQty(prod.id)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  updateCartQuantity(prod.id, isNaN(val) ? 0 : val);
                                }}
                                onBlur={() => {
                                  if (getProductCartQty(prod.id) <= 0) {
                                    removeFromCart(prod.id);
                                  }
                                }}
                                style={{
                                  width: '32px',
                                  background: 'none',
                                  border: 'none',
                                  color: '#fff',
                                  textAlign: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  outline: 'none',
                                  padding: 0,
                                }}
                              />
                              <button 
                                onClick={() => updateCartQuantity(prod.id, getProductCartQty(prod.id) + 1)}
                                style={{ background: 'none', border: 'none', color: '#10b981', padding: '2px 4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(prod)}
                              style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                border: 'none',
                                color: '#fff',
                                borderRadius: '20px',
                                padding: '4px 12px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: '100%',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Icons.ShoppingCart size={10} /> Add to Cart
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-mobile-secondary)' }}>
                  <Icons.Sparkles size={48} style={{ margin: '0 auto 12px auto', color: '#475569' }} />
                  <p>No new products launched at the moment.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW: Offers Tab — Role-Aware */}
        {activeTab === 'offers' && currentView === 'dashboard' && (
          <>
            {/* ── MR VIEW: Only see franchise partner schemes ── */}
            {userRole === 'mr' && (
              <>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    Your Franchise Schemes
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: '#fff', marginTop: '2px' }}>
                    MR Offers &amp; Incentives
                  </h3>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', lineHeight: '1.4' }}>
                  Promotions and product schemes set by your franchise partner exclusively for the field team.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
                  {mrOffers.length > 0 ? (
                    mrOffers.map((offer) => {
                      const linkedProduct = products.find(p => p.id === offer.productId);
                      return (
                        <div
                          key={offer.id}
                          style={{
                            background: 'linear-gradient(135deg, #0d2825 0%, #131b2e 100%)',
                            border: '1px solid rgba(16,185,129,0.25)',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(16,185,129,0.08)',
                          }}
                        >
                          {/* Header banner */}
                          <div style={{
                            background: 'linear-gradient(90deg, rgba(16,185,129,0.18) 0%, rgba(52,211,153,0.08) 100%)',
                            borderBottom: '1px solid rgba(16,185,129,0.15)',
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, boxShadow: '0 4px 10px rgba(16,185,129,0.3)'
                            }}>
                              <Icons.Gift size={18} color="#fff" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {offer.title}
                              </h4>
                              {linkedProduct && (
                                <span style={{ fontSize: '0.65rem', color: '#a7f3d0', fontWeight: 600 }}>
                                  {linkedProduct.name}
                                </span>
                              )}
                            </div>
                            <span style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#fff',
                              padding: '4px 10px',
                              borderRadius: '10px',
                              fontSize: '0.8rem',
                              fontWeight: 900,
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(16,185,129,0.35)'
                            }}>
                              {offer.discount}
                            </span>
                          </div>

                          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', lineHeight: '1.5' }}>
                              {offer.description}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-mobile-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Icons.Clock size={11} /> Expires: {offer.expiry || 'Open-ended'}
                              </span>
                              {linkedProduct && (
                                <button
                                  onClick={() => navigateToProductDetails(offer.productId)}
                                  style={{ color: '#34d399', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Icons.ExternalLink size={12} /> View Product
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-mobile-muted)', background: 'var(--bg-mobile-card)', border: '1px dashed rgba(16,185,129,0.2)', borderRadius: '20px' }}>
                      <Icons.Gift size={40} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No schemes published yet.</p>
                      <p style={{ fontSize: '0.72rem', marginTop: '4px' }}>Your franchise partner will post offers here.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── DISTRIBUTOR VIEW: Admin Offers + Manage MR Schemes ── */}
            {userRole === 'distributor' && (
              <>
                {/* Section 1: Admin (Global) Bumper Offers */}
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    Company Schemes
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: '#fff', marginTop: '2px' }}>
                    Bumper Offers &amp; Deals
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', lineHeight: '1.4' }}>
                  Company-wide promotions for bulk franchise orders.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                  {offers.length > 0 ? (
                    offers.map((offer) => (
                      <div
                        key={offer.id}
                        style={{
                          background: 'var(--bg-mobile-card)',
                          border: '1px solid var(--border-mobile)',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        {offer.imageUrl ? (
                          <div style={{ width: '100%', height: '120px', overflow: 'hidden' }}>
                            <img
                              src={offer.imageUrl.startsWith('http') ? offer.imageUrl : `${IMAGE_BASE}${offer.imageUrl}`}
                              alt={offer.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '90px', background: 'linear-gradient(135deg, #1e3a8a, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            <Icons.BadgePercent size={44} style={{ color: 'rgba(255,255,255,0.1)' }} />
                            <span style={{ position: 'absolute', bottom: '12px', right: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 800 }}>
                              Company Schemes
                            </span>
                          </div>
                        )}
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{offer.title}</h4>
                            <span style={{ background: '#fef3c7', color: '#d97706', padding: '3px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0 }}>
                              {offer.discount}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', lineHeight: '1.4' }}>{offer.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid var(--border-mobile)', paddingTop: '12px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-mobile-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.Calendar size={12} /> {offer.expiry || 'Valid till stock lasts'}
                            </span>
                            {offer.productId && (
                              <button onClick={() => navigateToProductDetails(offer.productId)} style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Icons.Eye size={12} /> View Product
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-mobile-secondary)', background: 'var(--bg-mobile-card)', border: '1px dashed var(--border-mobile)', borderRadius: '16px' }}>
                      <Icons.Percent size={36} style={{ margin: '0 auto 8px auto', color: '#475569' }} />
                      <p style={{ fontSize: '0.8rem' }}>No active company offers at the moment.</p>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(16,185,129,0.2)' }} />
                  <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', whiteSpace: 'nowrap' }}>
                    MR Field Schemes (Your Offers)
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(16,185,129,0.2)' }} />
                </div>

                {/* Section 2: Create MR Offer Form */}
                <div style={{
                  background: 'linear-gradient(135deg, #0d2825 0%, #131b2e 100%)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: '20px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.Gift size={16} color="#10b981" />
                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                      Publish New MR Scheme
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-mobile-secondary)', marginTop: '-8px' }}>
                    Offers created here are visible <strong style={{ color: '#10b981' }}>only to your MRs</strong> — not shown in admin portal.
                  </p>

                  <form onSubmit={handleAddMrOffer} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.62rem', color: '#10b981', display: 'block', marginBottom: '4px', fontWeight: 800, textTransform: 'uppercase' }}>Offer Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Buy 10 Get 2 Free"
                          value={mrOfferTitle}
                          onChange={(e) => setMrOfferTitle(e.target.value)}
                          required
                          style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(9,13,22,0.5)', color: '#fff', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.62rem', color: '#10b981', display: 'block', marginBottom: '4px', fontWeight: 800, textTransform: 'uppercase' }}>Discount / Incentive *</label>
                        <input
                          type="text"
                          placeholder="e.g. 20% Off / 2+1 Free"
                          value={mrOfferDiscount}
                          onChange={(e) => setMrOfferDiscount(e.target.value)}
                          required
                          style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(9,13,22,0.5)', color: '#fff', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.62rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 800, textTransform: 'uppercase' }}>Description *</label>
                      <textarea
                        placeholder="Scheme terms, conditions, product scope..."
                        value={mrOfferDesc}
                        onChange={(e) => setMrOfferDesc(e.target.value)}
                        required
                        rows={2}
                        style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9,13,22,0.5)', color: '#fff', fontSize: '0.78rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.62rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 800, textTransform: 'uppercase' }}>Link Product</label>
                        <select
                          value={mrOfferProdId}
                          onChange={(e) => setMrOfferProdId(e.target.value)}
                          style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: '#131b2e', color: '#fff', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="">-- None --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} style={{ background: '#131b2e' }}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.62rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 800, textTransform: 'uppercase' }}>Expiry Date</label>
                        <input
                          type="date"
                          value={mrOfferExpiry}
                          onChange={(e) => setMrOfferExpiry(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9,13,22,0.5)', color: '#fff', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {mrOfferFormError && (
                      <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                        {mrOfferFormError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAddingMrOffer}
                      style={{
                        width: '100%', padding: '11px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff', fontWeight: 800, fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)', cursor: 'pointer',
                        opacity: isAddingMrOffer ? 0.7 : 1
                      }}
                    >
                      <Icons.PlusCircle size={16} />
                      {isAddingMrOffer ? 'Publishing...' : 'Publish MR Scheme'}
                    </button>
                  </form>
                </div>

                {/* Section 3: My Published MR Offers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.ListChecks size={16} color="#10b981" /> Published MR Schemes
                  </h4>

                  {mrOffers.filter(o => o.distributorId === loggedInUser?.id).length > 0 ? (
                    mrOffers.filter(o => o.distributorId === loggedInUser?.id).map((offer) => {
                      const linkedProduct = products.find(p => p.id === offer.productId);
                      return (
                        <div
                          key={offer.id}
                          style={{
                            background: 'var(--bg-mobile-card)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: '16px',
                            padding: '14px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h5 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{offer.title}</h5>
                              {linkedProduct && (
                                <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>{linkedProduct.name}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid rgba(16,185,129,0.2)' }}>
                                {offer.discount}
                              </span>
                              <button
                                onClick={() => handleDeleteMrOffer(offer.id)}
                                style={{ color: '#ef4444', padding: '2px', flexShrink: 0 }}
                                title="Delete offer"
                              >
                                <Icons.Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.75rem', color: 'var(--text-mobile-secondary)', lineHeight: '1.4' }}>{offer.description}</p>

                          {offer.expiry && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-mobile-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.Clock size={11} /> Expires: {offer.expiry}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-mobile-muted)', background: 'var(--bg-mobile-card)', border: '1px dashed rgba(16,185,129,0.2)', borderRadius: '16px' }}>
                      <Icons.Gift size={30} style={{ margin: '0 auto 8px auto', opacity: 0.35 }} />
                      <p style={{ fontSize: '0.8rem' }}>No MR schemes published yet.</p>
                      <p style={{ fontSize: '0.72rem', marginTop: '4px', color: 'var(--text-mobile-muted)' }}>Use the form above to create your first scheme.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* VIEW: Product Details Page */}
        {currentView === 'product-detail' && selectedProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => setCurrentView('dashboard')} 
                  style={{ color: '#fff', padding: '4px' }}
                >
                  <Icons.ArrowLeft size={20} />
                </button>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 800 }}>
                    {getCategoryName(selectedProduct.categoryId)}
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>
                    {selectedProduct.name}
                  </h3>
                </div>
              </div>
              
              {userRole === 'admin' && (
                <button
                  onClick={() => openMobileEditModal(selectedProduct)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    color: '#34d399',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Edit Medicine (Admin)"
                >
                  <Icons.Edit3 size={12} />
                  Edit
                </button>
              )}
            </div>

            {/* Inline Cart Selector inside Product Details */}
            {isLoggedIn && (
              <div 
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-mobile-secondary)', fontWeight: 500 }}>
                    Order Quantity
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold', marginTop: '2px' }}>
                    {isInCart(selectedProduct.id) 
                      ? `${getProductCartQty(selectedProduct.id)} item(s) in Cart` 
                      : 'Not in Cart'}
                  </span>
                </div>
                
                {isInCart(selectedProduct.id) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0f172a', border: '1px solid #10b981', borderRadius: '20px', padding: '4px 12px' }}>
                    <button 
                      onClick={() => {
                        const current = getProductCartQty(selectedProduct.id);
                        if (current <= 1) {
                          removeFromCart(selectedProduct.id);
                        } else {
                          updateCartQuantity(selectedProduct.id, current - 1);
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#10b981', padding: '2px 6px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={getProductCartQty(selectedProduct.id) === 0 ? '' : getProductCartQty(selectedProduct.id)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateCartQuantity(selectedProduct.id, isNaN(val) ? 0 : val);
                      }}
                      onBlur={() => {
                        if (getProductCartQty(selectedProduct.id) <= 0) {
                          removeFromCart(selectedProduct.id);
                        }
                      }}
                      style={{
                        width: '40px',
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        outline: 'none',
                        padding: 0,
                      }}
                    />
                    <button 
                      onClick={() => updateCartQuantity(selectedProduct.id, getProductCartQty(selectedProduct.id) + 1)}
                      style={{ background: 'none', border: 'none', color: '#10b981', padding: '2px 6px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(selectedProduct)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '20px',
                      padding: '8px 16px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icons.ShoppingCart size={14} /> Add to Cart
                  </button>
                )}
              </div>
            )}

            <div className="detail-tab-container">
              <button 
                className={`detail-tab ${activeDetailTab === 'packshot' ? 'active' : ''}`}
                onClick={() => setActiveDetailTab('packshot')}
              >
                Packshot
              </button>
              <button 
                className={`detail-tab ${activeDetailTab === 'aids' ? 'active' : ''}`}
                onClick={() => setActiveDetailTab('aids')}
              >
                Detailer
              </button>
              <button 
                className={`detail-tab ${activeDetailTab === 'lbl' ? 'active' : ''}`}
                onClick={() => setActiveDetailTab('lbl')}
              >
                LBL Sheet
              </button>
              <button 
                className={`detail-tab ${activeDetailTab === 'video' ? 'active' : ''}`}
                onClick={() => setActiveDetailTab('video')}
              >
                Video
              </button>
            </div>

            <div className="tab-pane-content">
              {/* TAB: Packshot */}
              {activeDetailTab === 'packshot' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  <div 
                    style={{
                      width: '180px',
                      height: '180px',
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, #131b2e 0%, #1e2942 100%)',
                      border: '1px solid var(--border-mobile)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                    }}
                  >
                    {selectedProduct.packshot ? (
                      <img 
                        src={selectedProduct.packshot.startsWith('http') ? selectedProduct.packshot : `${IMAGE_BASE}${selectedProduct.packshot}`} 
                        alt={selectedProduct.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Icons.Package size={48} color="#10b981" style={{ marginBottom: '10px' }} />
                        <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>{selectedProduct.name}</h4>
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>No Packshot Uploaded</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="info-badge-group" style={{ width: '100%' }}>
                    <div className="info-badge-item">
                      <div className="info-badge-label">Chemical Composition</div>
                      <div className="info-badge-val">{selectedProduct.composition}</div>
                    </div>
                    {selectedProduct.mrp && (
                      <div className="info-badge-item">
                        <div className="info-badge-label">Maximum Retail Price (MRP)</div>
                        <div className="info-badge-val" style={{ color: '#34d399', fontWeight: 'bold' }}>
                          {String(selectedProduct.mrp).includes('₹') ? selectedProduct.mrp : `₹${selectedProduct.mrp}`}
                        </div>
                      </div>
                    )}
                    <div className="info-badge-item">
                      <div className="info-badge-label">Recommended Dosage</div>
                      <div className="info-badge-val">{selectedProduct.dosage || 'As directed by the physician.'}</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => startSingleProductPresentation(selectedProduct)}
                    className="btn-primary-mobile"
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    <Icons.Presentation size={18} /> Launch Detailing Slideshow
                  </button>
                </div>
              )}

              {/* TAB: Visual Aids Detailer */}
              {activeDetailTab === 'aids' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-mobile-secondary)' }}>
                    Visual cards to present. Launch presentation mode to unlock full-screen swipe/zoom/draw.
                  </p>
                  
                  <div className="slides-thumb-grid">
                    {selectedProduct.visualAids && selectedProduct.visualAids.length > 0 ? (
                      selectedProduct.visualAids.map((aid, idx) => (
                        <div 
                          key={idx} 
                          className="slide-thumb-card"
                          onClick={() => {
                            startSingleProductPresentation(selectedProduct);
                            setCurrentSlideIndex(selectedProduct.packshot ? idx + 1 : idx);
                          }}
                        >
                          <img src={aid.startsWith('http') ? aid : `${IMAGE_BASE}${aid}`} alt="slide" />
                          <div style={{ position: 'absolute', bottom: '4px', right: '6px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px' }}>
                            Slide {idx + 1}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div 
                        onClick={() => startSingleProductPresentation(selectedProduct)}
                        className="slide-thumb-card" 
                        style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px', height: '120px' }}
                      >
                        <Icons.ImagePlay size={28} color="#64748b" />
                        <span style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                          Using fallback detailing slide template. Click to view.
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => startSingleProductPresentation(selectedProduct)}
                    className="btn-primary-mobile"
                    style={{ width: '100%', marginTop: '12px' }}
                  >
                    <Icons.PlayCircle size={18} /> Present Fullscreen Detailing
                  </button>
                </div>
              )}

              {/* TAB: Leave Behind Literature */}
              {activeDetailTab === 'lbl' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div 
                    style={{
                      background: 'var(--bg-mobile-card)',
                      border: '1px solid var(--border-mobile)',
                      borderRadius: '16px',
                      padding: '20px',
                      fontFamily: 'sans-serif',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      color: 'var(--text-mobile-primary)'
                    }}
                  >
                    <div style={{ borderBottom: '1px solid var(--border-mobile)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        Leave Behind Literature (LBL)
                      </span>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', marginTop: '4px' }}>
                        {selectedProduct.name}
                      </h4>
                    </div>
                    
                    <p style={{ fontStyle: 'italic', color: '#94a3b8', marginBottom: '16px', fontSize: '0.85rem' }}>
                      &quot;A clinical summary document for practitioners.&quot;
                    </p>
                    
                    {selectedProduct.lbl ? (
                      <div style={{ color: '#cbd5e1' }}>
                        {selectedProduct.lbl.split('\n').map((para, i) => (
                          <p key={i} style={{ marginBottom: '10px' }}>{para}</p>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#cbd5e1' }}>
                        <p><strong>Product composition:</strong> {selectedProduct.composition}</p>
                        <p><strong>Primary Indications:</strong> {selectedProduct.indications}</p>
                        <p><strong>Dosing regimens:</strong> {selectedProduct.dosage || 'As directed by the healthcare professional.'}</p>
                        <p>For more detailed scientific data, please contact the medical affairs division at Riomedica Healthcare.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: Video Panel */}
              {activeDetailTab === 'video' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedProduct.videoUrl ? (
                    <div 
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-mobile)',
                        background: '#000'
                      }}
                    >
                      <iframe
                        width="100%"
                        height="100%"
                        src={selectedProduct.videoUrl}
                        title="Product Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div 
                      style={{
                        padding: '40px 20px',
                        background: 'var(--bg-mobile-card)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '16px',
                        textAlign: 'center',
                        color: 'var(--text-mobile-secondary)'
                      }}
                    >
                      <Icons.VideoOff size={40} style={{ margin: '0 auto 12px auto', color: '#475569' }} />
                      <h5 style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>No Video Resource</h5>
                      <p style={{ fontSize: '0.8rem' }}>No detailing video link is linked to this product by admin portal.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: Collections Directory */}
        {activeTab === 'collections' && currentView === 'dashboard' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
                Bookmarked Presentations
              </h4>
              <button 
                onClick={() => setCurrentView('add-collection')}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Icons.Plus size={14} /> Create New
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {collections.length > 0 ? (
                collections.map((coll) => (
                  <div
                    key={coll.id}
                    onClick={() => startCollectionPresentation(coll)}
                    style={{
                      background: 'var(--bg-mobile-card)',
                      border: '1px solid var(--border-mobile)',
                      borderRadius: '16px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h5 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{coll.name}</h5>
                      <button 
                        onClick={(e) => handleDeleteCollection(coll.id, e)}
                        style={{ color: '#ef4444', padding: '4px' }}
                      >
                        <Icons.Trash2 size={16} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', marginBottom: '12px' }}>
                      {coll.description || 'No description provided.'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.FileStack size={12} /> {coll.productIds.length} Medicines
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.Play size={12} /> Present Collection &gt;
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-mobile-secondary)' }}>
                  <Icons.FolderHeart size={48} style={{ margin: '0 auto 12px auto', color: '#475569' }} />
                  <p>You haven't created any custom presentations yet.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW: Add Custom Collection Form */}
        {currentView === 'add-collection' && (
          <form onSubmit={handleCreateCollection} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setCurrentView('dashboard')} 
                style={{ color: '#fff', padding: '4px' }}
              >
                <Icons.ArrowLeft size={20} />
              </button>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
                New Custom Presentation
              </h3>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                Doctor or Presentation Name
              </label>
              <input
                type="text"
                placeholder="e.g., Dr. Sharma Pediatric List"
                value={newCollName}
                onChange={(e) => setNewCollName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-mobile)',
                  background: 'var(--bg-mobile-card)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                Brief Description
              </label>
              <input
                type="text"
                placeholder="e.g., Focus on pediatric syrups"
                value={newCollDesc}
                onChange={(e) => setNewCollDesc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-mobile)',
                  background: 'var(--bg-mobile-card)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                Select Medicines to Include ({newCollSelectedProducts.length})
              </label>
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  maxHeight: '220px', 
                  overflowY: 'auto',
                  border: '1px solid var(--border-mobile)',
                  borderRadius: '10px',
                  padding: '8px'
                }}
              >
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleProductSelectForCollection(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '8px',
                      background: newCollSelectedProducts.includes(p.id) ? 'rgba(16, 185, 129, 0.15)' : 'none',
                      border: '1px solid',
                      borderColor: newCollSelectedProducts.includes(p.id) ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <div 
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: '2px solid',
                        borderColor: newCollSelectedProducts.includes(p.id) ? '#10b981' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: newCollSelectedProducts.includes(p.id) ? '#10b981' : 'none'
                      }}
                    >
                      {newCollSelectedProducts.includes(p.id) && <Icons.Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{p.name}</span>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)' }}>{p.composition}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary-mobile"
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Icons.FolderHeart size={16} /> Save Presentation Folder
            </button>
          </form>
        )}

        {/* VIEW: Profile & Settings */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', padding: '24px 0', borderBottom: '1px solid var(--border-mobile)' }}>
              <div 
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  color: '#fff',
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                {loggedInUser?.firmName ? loggedInUser.firmName.charAt(0) : 'R'}
              </div>
              <h4 style={{ fontWeight: 800, fontSize: '1.18rem' }}>{loggedInUser?.firmName || 'Pharmacy Partner'}</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-mobile-secondary)', marginTop: '4px' }}>
                Licensed Owner: <strong>{loggedInUser?.ownerName}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div 
                style={{ 
                  background: 'var(--bg-mobile-card)', 
                  border: '1px solid var(--border-mobile)', 
                  borderRadius: '12px', 
                  padding: '16px' 
                }}
              >
                <h5 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase', color: '#10b981' }}>
                  Sync Information
                </h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', marginBottom: '8px' }}>
                  <span>Contact Mobile</span>
                  <span style={{ color: '#fff', fontWeight: '700' }}>{loggedInUser?.mobile}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', marginBottom: '8px' }}>
                  <span>Contact Email</span>
                  <span style={{ color: '#fff', fontWeight: '700' }}>{loggedInUser?.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', marginBottom: '8px' }}>
                  <span>Total Products Loaded</span>
                  <span style={{ color: '#fff', fontWeight: '700' }}>{products.length} medicines</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-mobile-secondary)' }}>
                  <span>Local Sync Database</span>
                  <span style={{ color: isFirebaseConnected ? '#10b981' : (isOfflineMode ? '#f59e0b' : '#10b981'), fontWeight: '700' }}>
                    {isFirebaseConnected ? 'Firebase Realtime Live' : (isOfflineMode ? 'LocalStorage (Mock)' : 'Connected API Server')}
                  </span>
                </div>
              </div>

              {/* ── Admin Only: Change Logo ── */}
              {loggedInUser?.role === 'admin' && (
                <div
                  style={{
                    background: 'var(--bg-mobile-card)',
                    border: '1px solid rgba(16,185,129,0.35)',
                    borderRadius: '16px',
                    padding: '18px',
                    marginTop: '10px'
                  }}
                >
                  <h5 style={{ fontWeight: 700, marginBottom: '14px', fontSize: '0.85rem', textTransform: 'uppercase', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Image size={14} /> Change App Logo
                  </h5>

                  {/* Current logo preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '14px', border: '2px solid rgba(16,185,129,0.3)', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {(logoPreview || branding.logo) ? (
                        <img
                          src={logoPreview || (branding.logo.startsWith('http') ? branding.logo : `${IMAGE_BASE}${branding.logo}`)}
                          alt="Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Icons.HeartPulse size={28} color="#10b981" />
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-mobile-primary)', fontWeight: 700 }}>
                        {logoPreview ? 'New logo selected' : (branding.logo ? 'Current logo' : 'No logo set')}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginTop: '2px' }}>
                        Recommended: Square image, min 200×200px
                      </p>
                    </div>
                  </div>

                  {/* File picker */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1.5px dashed rgba(16,185,129,0.5)',
                      background: 'rgba(16,185,129,0.06)',
                      color: '#10b981',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginBottom: '12px'
                    }}
                  >
                    <Icons.Upload size={15} />
                    {logoFile ? logoFile.name : 'Choose Logo Image'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setLogoFile(file);
                          setLogoPreview(URL.createObjectURL(file));
                          setLogoUploadSuccess(false);
                        }
                      }}
                    />
                  </label>

                  {/* Upload button */}
                  {logoFile && (
                    <button
                      onClick={async () => {
                        setIsUploadingLogo(true);
                        setLogoUploadSuccess(false);
                        try {
                          const fd = new FormData();
                          fd.append('logo', logoFile);
                          const updated = await updateBranding(fd);
                          setBranding(prev => ({ ...prev, logo: updated.logo }));
                          setLogoUploadSuccess(true);
                          setLogoFile(null);
                          setLogoPreview('');
                        } catch (err) {
                          alert('Failed to upload logo. Please try again.');
                        } finally {
                          setIsUploadingLogo(false);
                        }
                      }}
                      disabled={isUploadingLogo}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '10px',
                        background: isUploadingLogo ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        border: 'none',
                        cursor: isUploadingLogo ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                      }}
                    >
                      {isUploadingLogo ? (
                        <><Icons.Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</>
                      ) : (
                        <><Icons.CheckCircle size={15} /> Save New Logo</>
                      )}
                    </button>
                  )}

                  {/* Success message */}
                  {logoUploadSuccess && (
                    <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icons.CheckCircle size={14} /> Logo updated successfully!
                    </div>
                  )}
                </div>
              )}

              <div 
                style={{ 
                  background: 'var(--bg-mobile-card)', 
                  border: '1px solid var(--border-mobile)', 
                  borderRadius: '12px', 
                  padding: '16px',
                  marginTop: '10px'
                }}
              >
                <h5 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Key size={14} /> Change Password
                </h5>
                <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginBottom: '4px' }}>Old Password</label>
                    <input 
                      type="password" 
                      value={changeOldPassword}
                      onChange={(e) => setChangeOldPassword(e.target.value)}
                      placeholder="Enter old password"
                      style={{
                        width: '100%',
                        background: 'var(--bg-mobile-body)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        color: 'var(--text-mobile-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginBottom: '4px' }}>New Password</label>
                    <input 
                      type="password" 
                      value={changeNewPassword}
                      onChange={(e) => setChangeNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      style={{
                        width: '100%',
                        background: 'var(--bg-mobile-body)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        color: 'var(--text-mobile-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginBottom: '4px' }}>Confirm New Password</label>
                    <input 
                      type="password" 
                      value={changeConfirmPassword}
                      onChange={(e) => setChangeConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      style={{
                        width: '100%',
                        background: 'var(--bg-mobile-body)',
                        border: '1px solid var(--border-mobile)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        color: 'var(--text-mobile-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {changePasswordError && (
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{changePasswordError}</div>
                  )}
                  {changePasswordSuccess && (
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{changePasswordSuccess}</div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isChangingPassword}
                    className="btn-primary-mobile"
                    style={{ 
                      marginTop: '8px',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {isOfflineMode && (
                <button
                  onClick={resetOfflineDb}
                  className="btn-secondary-mobile"
                  style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                >
                  <Icons.RotateCcw size={16} /> Reset Offline LocalStorage Data
                </button>
              )}
              
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  setLoggedInUser(null);
                  setUserRole('distributor');
                  setLoginUsername('');
                  setLoginPassword('');
                  setWhatsappNumber('919999999999');
                }} 
                className="btn-secondary-mobile"
                style={{ marginTop: '12px' }}
              >
                <Icons.LogOut size={16} /> Sign Out B2B Session
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#475569' }}>
              &copy; 2026 Riomedica Healthcare Private Limited.<br />All rights reserved.
            </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation Tab Bar (5 tabs structure) */}
      {currentView === 'dashboard' && (
        <div className="mobile-nav-bar">
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => { setActiveTab('home'); setSearchQuery(''); setSelectedCategory('all'); }}
          >
            <Icons.Home />
            <span>Home</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => { setActiveTab('catalog'); }}
          >
            <Icons.BookOpen />
            <span>Catalog</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'launches' ? 'active' : ''}`}
            onClick={() => { setActiveTab('launches'); }}
          >
            <Icons.Sparkles />
            <span>Launches</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('offers'); }}
          >
            <Icons.BadgePercent />
            <span>Offers</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => { setActiveTab('collections'); }}
          >
            <Icons.Briefcase />
            <span>Collections</span>
          </button>
        </div>
      )}

      {/* Floating AI Assistant Chat Button */}
      {isLoggedIn && currentView === 'dashboard' && activeTab !== 'profile' && !isAiChatOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '88px',
            right: '24px',
            width: '56px',
            height: '56px',
            zIndex: 10500
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
              zIndex: 10499,
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
              zIndex: 10500,
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            title="Chat with Ani"
          >
            <img src="/female_ai_assistant_avatar.png" alt="Ani Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
          </button>
        </div>
      )}

      {/* AI Assistant Chat Sheet Overlay */}
      {isAiChatOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#090d16',
            zIndex: 11000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.25s ease-out',
            pointerEvents: 'auto'
          }}
        >
          {/* Header */}
          <div
            style={{
              height: '64px',
              padding: '0 20px',
              background: '#131b2e',
              borderBottom: '1px solid var(--border-mobile)',
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
                <h4 style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', margin: 0 }}>Ani (Support Desk)</h4>
                <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  Customer Care Agent Online
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
                  color: isAiVoiceEnabled ? '#10b981' : 'var(--text-mobile-muted)',
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
              
              {/* Hands-Free Loop Toggle */}
              <button
                onClick={() => setIsContinuousTalkEnabled(prev => !prev)}
                style={{
                  color: isContinuousTalkEnabled ? '#10b981' : 'var(--text-mobile-muted)',
                  padding: '6px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isContinuousTalkEnabled ? "Continuous Hands-Free Mode: Active" : "Continuous Hands-Free Mode: Muted"}
              >
                {isContinuousTalkEnabled ? (
                  <Icons.RefreshCw size={18} style={{ color: '#10b981', animation: 'spin 3s linear infinite' }} />
                ) : (
                  <Icons.RefreshCw size={18} style={{ opacity: 0.4 }} />
                )}
              </button>

              <button
                onClick={() => {
                  setIsAiChatOpen(false);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  stopSpeechRecognition();
                }}
                style={{ color: 'var(--text-mobile-secondary)', padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
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
              gap: '14px'
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
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-mobile)',
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
                <span style={{ fontSize: '0.62rem', color: 'var(--text-mobile-muted)', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.time}
                </span>
              </div>
            ))}
            {isAiTyping && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '6px', alignItems: 'center', background: '#131b2e', border: '1px solid var(--border-mobile)', padding: '12px 16px', borderRadius: '18px 18px 18px 2px' }}>
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
                "Rabrio 20 की संरचना क्या है?",
                "Active offers on products"
              ].map((sug, sidx) => (
                <button
                  key={sidx}
                  onClick={() => handleSendAiMessage(sug)}
                  style={{
                    flex: '0 0 auto',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-mobile)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    color: 'var(--text-mobile-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: 600
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
              borderTop: '1px solid var(--border-mobile)',
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
                <span style={{ color: 'var(--text-mobile-muted)', fontWeight: 700, marginRight: '2px' }}>Speak:</span>
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
                        color: isActive ? '#34d399' : 'var(--text-mobile-muted)',
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
                  color: isWakeWordActive ? '#34d399' : 'var(--text-mobile-muted)',
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
                    background: isWakeWordActive ? '#10b981' : 'var(--text-mobile-muted)', 
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
                  borderColor: isAiListening ? '#ef4444' : 'var(--border-mobile)',
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
                  <Icons.Mic size={18} style={{ color: 'var(--text-mobile-secondary)' }} />
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
                  border: '1px solid var(--border-mobile)',
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
                  color: (aiInputText && aiInputText.trim() && !isAiTyping) ? '#fff' : 'var(--text-mobile-muted)',
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


      {/* --- DOCTOR VISIT LOG MODAL OVERLAY --- */}
      {isVisitModalOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(9, 13, 22, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            style={{
              background: '#131b2e',
              border: '1px solid var(--border-mobile)',
              borderRadius: '24px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              maxHeight: '90%',
              overflowY: 'auto',
              animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.ClipboardList size={20} /> Log Detailing Call
              </h3>
              <button 
                onClick={() => setIsVisitModalOpen(false)} 
                style={{ color: 'var(--text-mobile-secondary)', padding: '4px' }}
              >
                <Icons.X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogVisit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  Doctor Name *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Dr. Ramesh Gupta"
                  value={visitDoctorName}
                  onChange={(e) => setVisitDoctorName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    Specialty *
                  </label>
                  <select 
                    value={visitSpecialty}
                    onChange={(e) => setVisitSpecialty(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  >
                    <option value="General" style={{ background: '#131b2e' }}>General Medicine</option>
                    <option value="Pediatrician" style={{ background: '#131b2e' }}>Pediatrician</option>
                    <option value="Cardiologist" style={{ background: '#131b2e' }}>Cardiologist</option>
                    <option value="Dermatologist" style={{ background: '#131b2e' }}>Dermatologist</option>
                    <option value="Gastroenterologist" style={{ background: '#131b2e' }}>Gastroenterologist</option>
                    <option value="Gynecologist" style={{ background: '#131b2e' }}>Gynecologist</option>
                    <option value="Orthopedic" style={{ background: '#131b2e' }}>Orthopedic Surgeon</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    Visit Date *
                  </label>
                  <input 
                    type="date" 
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>
              </div>

              {userRole !== 'mr' && (
                <div>
                  <label style={{ fontSize: '0.65rem', color: '#10b981', display: 'block', marginBottom: '4px', fontWeight: 800 }}>
                    Assign Visitor *
                  </label>
                  <select 
                    value={visitMrId}
                    onChange={(e) => setVisitMrId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  >
                    <option value="self" style={{ background: '#131b2e' }}>Franchise Owner (Self)</option>
                    {mrs.filter(mr => mr.distributorId === loggedInUser?.id).map((mr) => (
                      <option key={mr.id} value={mr.id} style={{ background: '#131b2e' }}>{mr.name} ({mr.territory})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  Hospital / Clinic Location *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. City Care Clinic, Sector 5"
                  value={visitLocation}
                  onChange={(e) => setVisitLocation(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Medicines Detailed * (Select at least one)
                </label>
                <div 
                  style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border-mobile)', 
                    borderRadius: '8px', 
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    background: 'rgba(9, 13, 22, 0.3)'
                  }}
                >
                  {products.map((p) => {
                    const isSelected = visitProductsDetailed.includes(p.id);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          if (isSelected) {
                            setVisitProductsDetailed(prev => prev.filter(id => id !== p.id));
                          } else {
                            setVisitProductsDetailed(prev => [...prev, p.id]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '3px',
                          border: '1.5px solid',
                          borderColor: isSelected ? '#10b981' : '#475569',
                          background: isSelected ? '#10b981' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <Icons.Check size={10} color="#fff" strokeWidth={4} />}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: isSelected ? 700 : 500 }}>{p.name}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-mobile-muted)', marginLeft: 'auto' }}>{p.composition.slice(0, 20)}...</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  Detailing Remarks & Feedback *
                </label>
                <textarea 
                  placeholder="Doctor's response, sampling, LBL requests..."
                  value={visitRemarks}
                  onChange={(e) => setVisitRemarks(e.target.value)}
                  required
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none', resize: 'none' }}
                />
              </div>

              {visitFormError && (
                <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                  {visitFormError}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary-mobile"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', marginTop: '6px' }}
                disabled={isLoggingVisit || visitProductsDetailed.length === 0}
              >
                {isLoggingVisit ? 'Recording Call...' : 'Save & Submit Call Log'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          POPUP 1 — Welcome Greeting
      ════════════════════════════════════════════ */}
      {showWelcomePopup && loggedInUser && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(6, 9, 14, 0.75)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease-out',
            padding: '16px'
          }}
          onClick={() => setShowWelcomePopup(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              background: 'linear-gradient(160deg, #131b2e 0%, #0d2825 60%, #091a14 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '28px',
              padding: '28px 24px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
              boxShadow: '0 -4px 60px rgba(16,185,129,0.18), 0 30px 60px rgba(0,0,0,0.6)',
              position: 'relative',
              overflow: 'hidden',
              animation: 'slideUpBounce 0.55s cubic-bezier(0.34,1.56,0.64,1)'
            }}
          >
            {/* Animated background shimmer strip */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: 'linear-gradient(90deg, #059669, #10b981, #34d399, #6ee7b7, #10b981, #059669)',
              backgroundSize: '300% auto',
              animation: 'shimmerSlide 2.5s linear infinite'
            }} />

            {/* Floating sparkle particles */}
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${10 + i * 11}%`,
                bottom: '20%',
                width: i % 2 === 0 ? '6px' : '4px',
                height: i % 2 === 0 ? '6px' : '4px',
                borderRadius: '50%',
                background: i % 3 === 0 ? '#34d399' : i % 3 === 1 ? '#10b981' : '#6ee7b7',
                animation: `floatParticle ${1.8 + i * 0.3}s ease-out ${i * 0.15}s forwards`,
                opacity: 0
              }} />
            ))}

            {/* Avatar ring + icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '18px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {/* Pulsing ring */}
                <div style={{
                  position: 'absolute', inset: '-6px',
                  borderRadius: '50%',
                  border: '2px solid rgba(16,185,129,0.4)',
                  animation: 'pulseRing 2s ease-in-out infinite'
                }} />
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
                  animation: 'popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both'
                }}>
                  {userRole === 'mr'
                    ? <Icons.UserCheck size={28} color="#fff" strokeWidth={2.5} />
                    : <Icons.Building2 size={28} color="#fff" strokeWidth={2.5} />
                  }
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    background: userRole === 'mr'
                      ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.1))'
                      : 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.1))',
                    border: `1px solid ${userRole === 'mr' ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)'}`,
                    color: userRole === 'mr' ? '#34d399' : '#fbbf24',
                    padding: '2px 8px', borderRadius: '6px',
                    fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px'
                  }}>
                    {userRole === 'mr' ? '⚕ Medical Rep' : '🏢 Franchise Partner'}
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-mobile-secondary)', lineHeight: 1.3 }}>
                  {(() => {
                    const h = new Date().getHours();
                    return h < 12 ? 'Good Morning! ☀️' : h < 17 ? 'Good Afternoon! 🌤️' : 'Good Evening! 🌙';
                  })()}
                </p>
              </div>
            </div>

            {/* Name headline */}
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.55rem',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.1,
                marginBottom: '6px'
              }}>
                Welcome back,{' '}
                <span style={{
                  background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  backgroundSize: '200% auto',
                  animation: 'shimmerSlide 3s linear infinite'
                }}>
                  {loggedInUser.ownerName || loggedInUser.name || loggedInUser.firmName || loginUsername}!
                </span>
              </h2>
              {(loggedInUser.firmName || loggedInUser.territory) && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-mobile-secondary)' }}>
                  {userRole === 'mr'
                    ? `🗺️ Territory: ${loggedInUser.territory || 'Assigned Zone'}`
                    : `🏢 ${loggedInUser.firmName}`
                  }
                </p>
              )}
            </div>

            {/* Stats row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px', marginBottom: '20px'
            }}>
              {[
                { label: 'Products', val: products.length || '—', icon: <Icons.Package size={14} /> },
                { label: userRole === 'mr' ? 'My Visits' : 'Team MRs', val: userRole === 'mr' ? doctorVisits.filter(v => v.mrId === loggedInUser.id).length : mrs.filter(mr => mr.distributorId === loggedInUser?.id).length, icon: <Icons.Users size={14} /> },
                { label: 'Offers', val: userRole === 'mr' ? mrOffers.length : offers.length + mrOffers.filter(o => o.distributorId === loggedInUser.id).length, icon: <Icons.Gift size={14} /> }
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(16,185,129,0.07)',
                  border: '1px solid rgba(16,185,129,0.15)',
                  borderRadius: '14px', padding: '10px 8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#10b981', marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{s.val}</div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-mobile-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <button
              onClick={() => setShowWelcomePopup(false)}
              style={{
                width: '100%', padding: '14px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
                letterSpacing: '0.3px'
              }}
            >
              <Icons.Zap size={18} /> Let's Go!
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-mobile-muted)', marginTop: '10px' }}>
              Tap anywhere outside or press the button to continue
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          POPUP 2 — New Product Launch Spotlight
      ════════════════════════════════════════════ */}
      {showLaunchPopup && launchPopupProduct && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(6, 9, 14, 0.8)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.3s ease-out',
            padding: '20px'
          }}
          onClick={() => setShowLaunchPopup(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '340px',
              background: 'linear-gradient(160deg, #131b2e 0%, #0e1f3a 100%)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.1)',
              animation: 'slideUpBounce 0.55s cubic-bezier(0.34,1.56,0.64,1)'
            }}
          >
            {/* TOP: Glowing image banner */}
            <div style={{
              position: 'relative',
              height: '180px',
              background: 'linear-gradient(135deg, #0a1628, #0d2825)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {/* Animated gradient bg */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #0d2825, #1e3a8a, #0d2825)',
                backgroundSize: '300% 300%',
                animation: 'gradientShift 5s ease infinite',
                opacity: 0.7
              }} />

              {/* Concentric pulse rings */}
              {[60, 80, 100].map((size, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: `${size}px`, height: `${size}px`,
                  borderRadius: '50%',
                  border: '1px solid rgba(16,185,129,0.2)',
                  animation: `pulseRing ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`
                }} />
              ))}

              {launchPopupProduct.packshot ? (
                <img
                  src={launchPopupProduct.packshot.startsWith('http')
                    ? launchPopupProduct.packshot
                    : `${IMAGE_BASE}${launchPopupProduct.packshot}`}
                  alt={launchPopupProduct.name}
                  style={{
                    maxHeight: '140px', maxWidth: '80%',
                    objectFit: 'contain', position: 'relative', zIndex: 1,
                    filter: 'drop-shadow(0 10px 30px rgba(16,185,129,0.4))',
                    animation: 'popIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both'
                  }}
                />
              ) : (
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <Icons.Sparkles size={52} color="#10b981" style={{ animation: 'popIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }} />
                </div>
              )}

              {/* NEW badge */}
              <div style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', padding: '4px 12px', borderRadius: '20px',
                fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 12px rgba(16,185,129,0.5)',
                animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.4s both'
              }}>
                🚀 New Launch
              </div>

              {/* Shimmer top border */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: 'linear-gradient(90deg, #059669, #34d399, #6ee7b7, #34d399, #059669)',
                backgroundSize: '300% auto',
                animation: 'shimmerSlide 2s linear infinite'
              }} />
            </div>

            {/* BOTTOM: Product info */}
            <div style={{ padding: '20px 22px 22px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                  Admin Featured — New Product Launch
                </span>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem', fontWeight: 900,
                  color: '#fff', marginTop: '4px', lineHeight: 1.1
                }}>
                  {launchPopupProduct.name}
                </h3>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-mobile-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: '#a7f3d0' }}>Composition:</strong>{' '}
                {launchPopupProduct.composition}
              </p>

              {launchPopupProduct.indications && (
                <div style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.15)',
                  borderRadius: '12px', padding: '10px 14px'
                }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-mobile-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: '#10b981' }}>Indications:</strong>{' '}
                    {launchPopupProduct.indications.slice(0, 80)}{launchPopupProduct.indications.length > 80 ? '...' : ''}
                  </p>
                </div>
              )}

              {/* B2B Cart Add/Qty Control in Popup */}
              {isLoggedIn && (
                <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick B2B Ordering
                  </span>
                  {isInCart(launchPopupProduct.id) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#090d16', border: '1px solid #10b981', borderRadius: '14px', padding: '10px 16px', justifyContent: 'space-between' }}>
                      <button 
                        onClick={() => {
                          const current = getProductCartQty(launchPopupProduct.id);
                          if (current <= 1) {
                            removeFromCart(launchPopupProduct.id);
                          } else {
                            updateCartQuantity(launchPopupProduct.id, current - 1);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#10b981', padding: '2px 8px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                      >
                        -
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.ShoppingCart size={14} style={{ color: '#10b981' }} />
                        <input
                          type="number"
                          min="0"
                          value={getProductCartQty(launchPopupProduct.id) === 0 ? '' : getProductCartQty(launchPopupProduct.id)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateCartQuantity(launchPopupProduct.id, isNaN(val) ? 0 : val);
                          }}
                          onBlur={() => {
                            if (getProductCartQty(launchPopupProduct.id) <= 0) {
                              removeFromCart(launchPopupProduct.id);
                            }
                          }}
                          style={{
                            width: '40px',
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            outline: 'none',
                            padding: 0,
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-mobile-secondary)' }}>in Cart</span>
                      </div>
                      <button 
                        onClick={() => updateCartQuantity(launchPopupProduct.id, getProductCartQty(launchPopupProduct.id) + 1)}
                        style={{ background: 'none', border: 'none', color: '#10b981', padding: '2px 8px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(launchPopupProduct)}
                      style={{
                        width: '100%', padding: '12px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff', fontWeight: 800, fontSize: '0.8rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <Icons.ShoppingCart size={15} /> Add to Cart
                    </button>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => {
                    setShowLaunchPopup(false);
                    setSelectedProduct(launchPopupProduct);
                    setCurrentView('product-detail');
                    setActiveDetailTab('packshot');
                    setActiveTab('catalog');
                  }}
                  style={{
                    flex: 1, padding: '13px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontWeight: 800, fontSize: '0.82rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    boxShadow: '0 6px 18px rgba(16,185,129,0.35)'
                  }}
                >
                  <Icons.Sparkles size={16} /> View Details
                </button>
                <button
                  onClick={() => setShowLaunchPopup(false)}
                  style={{
                    padding: '13px 16px', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-mobile-secondary)', fontWeight: 700, fontSize: '0.8rem'
                  }}
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          POPUP 3 — Admin Direct Product Editor
      ════════════════════════════════════════════ */}
      {isMobileEditModalOpen && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(6, 9, 14, 0.85)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.25s ease-out',
            padding: '12px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxHeight: '92%',
              background: 'linear-gradient(165deg, #131b2e 0%, #0d2825 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '24px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(16,185,129,0.1)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUpBounce 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Edit3 size={18} /> Edit Product (Admin)
              </h3>
              <button 
                type="button"
                onClick={() => setIsMobileEditModalOpen(false)} 
                style={{ color: 'var(--text-mobile-secondary)', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <Icons.X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleMobileEditSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Brand Name */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    Medicine Brand Name *
                  </label>
                  <input 
                    type="text" 
                    value={editProdName}
                    onChange={(e) => setEditProdName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>

                {/* Composition */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    Chemical Composition *
                  </label>
                  <input 
                    type="text" 
                    value={editProdComposition}
                    onChange={(e) => setEditProdComposition(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>

                {/* Grid Category & MRP */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                      Category *
                    </label>
                    <select 
                      value={editProdCategory}
                      onChange={(e) => setEditProdCategory(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} style={{ background: '#131b2e' }}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                      MRP (Price)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 150.00"
                      value={editProdMrp}
                      onChange={(e) => setEditProdMrp(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Indications */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    Clinical Indications
                  </label>
                  <input 
                    type="text" 
                    value={editProdIndications}
                    onChange={(e) => setEditProdIndications(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>

                {/* Dosage */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    Dosage & Administration
                  </label>
                  <input 
                    type="text" 
                    value={editProdDosage}
                    onChange={(e) => setEditProdDosage(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>

                {/* LBL Sheet */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    LBL Literature Highlights
                  </label>
                  <textarea 
                    rows="3" 
                    value={editProdLbl}
                    onChange={(e) => setEditProdLbl(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {/* Video URL */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    Promotional Video (YouTube Embed URL)
                  </label>
                  <input 
                    type="url" 
                    placeholder="https://www.youtube.com/embed/..."
                    value={editProdVideoUrl}
                    onChange={(e) => setEditProdVideoUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: 'rgba(9, 13, 22, 0.5)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>

                {/* New Launch Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-mobile-secondary)' }}>
                    <input 
                      type="checkbox" 
                      checked={editProdIsNewLaunch}
                      onChange={(e) => setEditProdIsNewLaunch(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Mark as New Product Launch
                  </label>
                </div>

                {/* Packshot Image Upload Dropzone */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    Product Packshot Carton Image
                  </label>
                  <div 
                    onClick={() => document.getElementById('mobile-edit-packshot-input').click()}
                    style={{
                      border: '1px dashed rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      background: 'rgba(16, 185, 129, 0.03)',
                      cursor: 'pointer'
                    }}
                  >
                    <Icons.UploadCloud size={20} style={{ color: '#10b981', margin: '0 auto 4px auto' }} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)' }}>
                      {editProdPackshotFile ? editProdPackshotFile.name : 'Select packshot carton image'}
                    </div>
                  </div>
                  <input 
                    id="mobile-edit-packshot-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => setEditProdPackshotFile(e.target.files[0])}
                  />
                </div>

                {/* Visual Aids Slides Dropzone */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    Detailer Visual Aid Slides (Multiple)
                  </label>
                  <div 
                    onClick={() => document.getElementById('mobile-edit-aids-input').click()}
                    style={{
                      border: '1px dashed rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      background: 'rgba(16, 185, 129, 0.03)',
                      cursor: 'pointer'
                    }}
                  >
                    <Icons.Images size={20} style={{ color: '#10b981', margin: '0 auto 4px auto' }} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)' }}>
                      {editProdVisualAidsFiles.length > 0 
                        ? `${editProdVisualAidsFiles.length} files selected` 
                        : 'Select detailing slides'
                      }
                    </div>
                  </div>
                  <input 
                    id="mobile-edit-aids-input"
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setEditProdVisualAidsFiles(Array.from(e.target.files));
                      }
                    }}
                  />

                  {selectedProduct.visualAids && selectedProduct.visualAids.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'var(--text-mobile-secondary)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={editKeepExistingAids}
                          onChange={(e) => setEditKeepExistingAids(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        Keep existing ({selectedProduct.visualAids.length}) slides
                      </label>
                    </div>
                  )}
                </div>

              </div>

              {/* Form Footer Buttons */}
              <div style={{ display: 'flex', gap: '10px', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6, 9, 14, 0.4)', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setIsMobileEditModalOpen(false)}
                  style={{
                    flex: 1, padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMobileEdit}
                  style={{
                    flex: 1, padding: '12px',
                    borderRadius: '12px',
                    background: isSavingMobileEdit ? '#475569' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontWeight: 800, fontSize: '0.8rem',
                    cursor: isSavingMobileEdit ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    border: 'none',
                    boxShadow: isSavingMobileEdit ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {isSavingMobileEdit ? (
                    <><Icons.Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                  ) : (
                    <><Icons.CheckCircle size={14} /> Save Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ════════════════════════════════════════════
          POPUP 4 — B2B Shopping Cart Drawer Sheet
      ════════════════════════════════════════════ */}
      {isCartOpen && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(6, 9, 14, 0.85)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.25s ease-out',
            padding: '12px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxHeight: '92%',
              background: 'linear-gradient(165deg, #131b2e 0%, #0d2825 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '24px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(16,185,129,0.1)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUpBounce 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.ShoppingCart size={18} /> B2B Shopping Cart
              </h3>
              <button 
                onClick={() => setIsCartOpen(false)} 
                style={{ color: 'var(--text-mobile-secondary)', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Icons.X size={20} />
              </button>
            </div>

            {/* Scrollable Cart Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.length > 0 ? (
                <>
                  {/* Doctor Selection (MR only) */}
                  {userRole === 'mr' && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Select Target Doctor *
                      </label>
                      
                      <select
                        value={isNewDoctorMode ? 'new' : selectedDoctorName}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'new') {
                            setIsNewDoctorMode(true);
                            setSelectedDoctorName('');
                            setDoctorSpecialty('');
                            setDoctorLocation('');
                          } else if (val === '') {
                            setIsNewDoctorMode(false);
                            setSelectedDoctorName('');
                            setDoctorSpecialty('');
                            setDoctorLocation('');
                          } else {
                            setIsNewDoctorMode(false);
                            setSelectedDoctorName(val);
                            // Auto-fill details from existing visit log if found
                            const matchedVisit = doctorVisits.find(v => v.doctorName === val && v.mrId === loggedInUser?.id);
                            if (matchedVisit) {
                              setDoctorSpecialty(matchedVisit.specialty || '');
                              setDoctorLocation(matchedVisit.location || '');
                            } else {
                              setDoctorSpecialty('');
                              setDoctorLocation('');
                            }
                          }
                        }}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: '#090d16', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                      >
                        <option value="">-- Choose Visited Doctor --</option>
                        {Array.from(new Set(doctorVisits.filter(v => v.mrId === loggedInUser?.id).map(v => v.doctorName)))
                          .map(docName => (
                            <option key={docName} value={docName}>{docName}</option>
                          ))
                        }
                        <option value="new">+ Enter New Doctor...</option>
                      </select>

                      {/* New Doctor Input Fields */}
                      {(isNewDoctorMode || Array.from(new Set(doctorVisits.filter(v => v.mrId === loggedInUser?.id).map(v => v.doctorName))).length === 0) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                          <input 
                            type="text" 
                            placeholder="Doctor Name (e.g. Dr. Sen) *" 
                            value={selectedDoctorName}
                            onChange={(e) => {
                              setIsNewDoctorMode(true);
                              setSelectedDoctorName(e.target.value);
                            }}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: '#090d16', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                          />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input 
                              type="text" 
                              placeholder="Specialty (e.g. Cardiologist)" 
                              value={doctorSpecialty}
                              onChange={(e) => setDoctorSpecialty(e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: '#090d16', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <input 
                              type="text" 
                              placeholder="Clinic / Hospital Location" 
                              value={doctorLocation}
                              onChange={(e) => setDoctorLocation(e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: '#090d16', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cart Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cart.map((item) => {
                      return (
                        <div 
                          key={item.product.id}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '16px',
                            padding: '12px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{item.product.name}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-mobile-secondary)', marginTop: '2px' }}>{item.product.composition}</p>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', border: '1px solid #10b981', borderRadius: '20px', padding: '2px 8px' }}>
                            <button 
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  removeFromCart(item.product.id);
                                } else {
                                  updateCartQuantity(item.product.id, item.quantity - 1);
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: '#10b981', padding: '2px 4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateCartQuantity(item.product.id, isNaN(val) ? 0 : val);
                              }}
                              onBlur={() => {
                                if (item.quantity <= 0) {
                                  removeFromCart(item.product.id);
                                }
                              }}
                              style={{
                                width: '40px',
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                textAlign: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                outline: 'none',
                                padding: 0,
                              }}
                            />
                            <button 
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              style={{ background: 'none', border: 'none', color: '#10b981', padding: '2px 4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* WhatsApp Contact Config */}
                  <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '14px' }}>
                    <label style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 800, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Recipient WhatsApp Number
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="e.g. 919999999999 (with country code)" 
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-mobile)', background: '#090d16', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-mobile-secondary)', display: 'block', marginTop: '6px' }}>
                      Enter the recipient's WhatsApp number with country code (e.g., 91 for India) without '+' or spaces.
                    </span>
                  </div>


                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--text-mobile-secondary)', gap: '16px', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                    <Icons.ShoppingCart size={32} style={{ margin: 'auto' }} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>Your Cart is Empty</h4>
                    <p style={{ fontSize: '0.72rem', marginTop: '4px', lineHeight: 1.4 }}>
                      Choose quantities for medicines in the catalog to add them here.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', borderRadius: '20px', padding: '8px 20px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Browse Catalog
                  </button>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            {cart.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6, 9, 14, 0.4)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Download PDF */}
                  <button
                    onClick={generateOrderPdf}
                    style={{
                      flex: 1, padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontWeight: 700, fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <Icons.Download size={14} /> PDF Receipt
                  </button>

                  {/* Send WhatsApp */}
                  <button
                    onClick={sendWhatsAppOrder}
                    style={{
                      flex: 1, padding: '12px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #25d366, #128c7e)',
                      color: '#fff', fontWeight: 800, fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      border: 'none'
                    }}
                  >
                    <Icons.MessageCircle size={14} /> WhatsApp
                  </button>
                </div>

                {/* Submit to Admin */}
                <button
                  onClick={submitOrderToAdmin}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontWeight: 800, fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Icons.CheckCircle size={14} /> {userRole === 'mr' ? 'Submit Order to Partner' : 'Submit Order to Admin'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MR EMAIL OTP VERIFICATION MODAL (Dashboard) --- */}
      {showMrOtpModal && (
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(9, 13, 22, 0.93)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div 
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '20px',
              padding: '28px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div 
              style={{
                width: '64px', height: '64px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '2px solid #10b981',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#10b981',
                margin: '0 auto'
              }}
            >
              <Icons.UserCheck size={30} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                Verify MR Email
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-mobile-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                A 6-digit verification code has been sent to<br/>
                <strong style={{ color: '#10b981' }}>{pendingMrData?.email}</strong><br/>
                Ask the MR to share the code to complete registration.
              </p>

            </div>
            <form onSubmit={handleVerifyMrOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="auth-input-container">
                <Icons.Key size={18} />
                <input 
                  type="text" 
                  id="mr-otp-input"
                  placeholder="Enter 6-digit code" 
                  maxLength={6}
                  value={mrOtpCode}
                  onChange={(e) => setMrOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.2rem', fontWeight: 800 }}
                  autoFocus
                  required
                />
              </div>
              {mrOtpError && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
                  {mrOtpError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="btn-secondary-mobile"
                  onClick={() => { setShowMrOtpModal(false); setPendingMrData(null); setMrOtpHint(''); setMrOtpCode(''); }}
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary-mobile"
                  style={{ flex: 2, padding: '12px' }}
                  disabled={isVerifyingMrOtp || mrOtpCode.length < 6}
                >
                  {isVerifyingMrOtp ? 'Verifying...' : 'Verify & Register MR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
