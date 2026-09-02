import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useCurrency } from './CurrencyContext.jsx';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isTelegramUser, setIsTelegramUser] = useState(false);
  const unsubscribeRef = useRef(null);
  const { locality, loading: currencyLoading } = useCurrency();
  const localityRef = useRef(locality);

  // Keep localityRef updated with latest locality value
  useEffect(() => {
    localityRef.current = locality;
  }, [locality]);

  // Check if user is admin
  const checkAdminStatus = useCallback((email) => {
    return (
      email === 'kkibetkkoir@gmail.com' || email === 'arovanzgamez@gmail.com'
    );
  }, []);

  // Check if subscription is still valid
  const checkSubscriptionValidity = useCallback((userData) => {
    if (!userData?.isPremium || !userData?.subDate || !userData?.subscription) {
      return false;
    }

    const currentTime = new Date();
    const subDate = new Date(userData.subDate);
    const timeDiff = currentTime - subDate;
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    switch (userData.subscription) {
      case 'Daily':
        return daysDiff <= 1;
      case 'Weekly':
        return daysDiff <= 7;
      case 'Monthly':
        return daysDiff <= 30;
      case 'Yearly':
        return daysDiff <= 365;
      default:
        return false;
    }
  }, []);
  
  // Device Detection
  function getUserPlatform() {
    const ua = navigator.userAgent;
    
    // Test for mobile platforms first
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      return { platform: 'ios', isMobile: true };
    }
    if (/Android/.test(ua)) {
      return { platform: 'android', isMobile: true };
    }
    
    // Test for desktop platforms
    if (/Windows/.test(ua)) {
      return { platform: 'windows', isMobile: false };
    }
    if (/Macintosh/.test(ua)) {
      return { platform: 'mac', isMobile: false };
    }
    
    // Default fallback
    return { platform: 'pwa', isMobile: false };
  }
  

  // Get Telegram user from localStorage
  const getTelegramUser = useCallback(() => {
    const telegramLoggedIn = localStorage.getItem('telegram_logged_in');
    const telegramUser = localStorage.getItem('telegram_user');
    
    if (telegramLoggedIn === 'true' && telegramUser) {
      try {
        return JSON.parse(telegramUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  // Set Telegram user as current user
  const setTelegramUserAsCurrent = useCallback((telegramUser) => {
    if (telegramUser) {
      const fakeUser = {
        email: telegramUser.email,
        displayName: telegramUser.username,
        uid: `telegram_${telegramUser.telegramId}`,
        emailVerified: true,
        isAnonymous: false,
        providerData: [{ providerId: 'telegram.com' }],
        telegramId: telegramUser.telegramId,
        photoURL: telegramUser.photoUrl || null
      };
      setCurrentUser(fakeUser);
      setIsTelegramUser(true);
      return true;
    }
    return false;
  }, []);

  // Handle Telegram logout
  const logoutTelegram = useCallback(() => {
    localStorage.removeItem('telegram_logged_in');
    localStorage.removeItem('telegram_user');
    setIsTelegramUser(false);
    setCurrentUser(null);
    setUserData(null);
    setIsPremium(false);
    setIsAdmin(false);
  }, []);

  // Real-time user data listener (works for both Firebase and Telegram users)
  const subscribeToUserData = useCallback(
    (email) => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const userDocRef = doc(db, 'users', email);
      const unsubscribe = onSnapshot(
        userDocRef,
        (doc) => {
          if (doc.exists()) {
            const data = { id: doc.id, ...doc.data() };

            console.log(data)

            // Check subscription validity
            const isValidSubscription = checkSubscriptionValidity(data);

            // Auto-update if subscription expired
            if (data.isPremium && !isValidSubscription) {
              // Subscription expired - trigger update
              import('../services/firestore.service').then(
                ({ userService }) => {
                  userService.updateUser(email, {
                    isPremium: false,
                    subscription: null,
                    subDate: null,
                  });
                }
              );
              data.isPremium = false;
              data.subscription = null;
              data.subDate = null;
            }

            // Update locality if not set - using ref to get latest value
            if (data && !data.locality) {
              const currentLocality = localityRef.current;
              if (currentLocality) {
                import('../services/firestore.service').then(
                  ({ userService }) => {
                    userService.updateUserLocality(email, currentLocality);
                  }
                );
              }
            }

            const device = getUserPlatform();

            // Check if this website is already recorded recently
            const lastVisit = data.visitedWebsites?.[window.location.hostname.replace(/\./g, '_')];
            const shouldRecord = !lastVisit || (Date.now() - lastVisit.lastVisitedAt?.toMillis?.() || 0) > 3600000; // 1 hour

            if (data && navigator.userAgentData && shouldRecord) {
              navigator.userAgentData.getHighEntropyValues([
                "architecture", 
                "model", 
                "platformVersion", 
                "fullVersionList"
              ]).then(info => {
                import('../services/firestore.service').then(
                  ({ userService }) => {
                    userService.recordWebsiteVisit(email, window.location.hostname, {device,...info});
                  }
                );
              });
            }

            setUserData(data);
            setIsPremium(data.isPremium && isValidSubscription);
            setIsAdmin(checkAdminStatus(email));
          } else {
            // User document doesn't exist yet
            setUserData(null);
            setIsPremium(false);
            setIsAdmin(false);
          }
        },
        (error) => {
          console.error('Error listening to user data:', error);
        }
      );

      unsubscribeRef.current = unsubscribe;
    },
    [checkAdminStatus, checkSubscriptionValidity]
  );

  // Listen to auth state changes (Firebase only)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Check if there's a Telegram user first
      const telegramUser = getTelegramUser();
      
      if (telegramUser) {
        // Telegram user takes precedence
        setTelegramUserAsCurrent(telegramUser);
        subscribeToUserData(telegramUser.email);
        setLoading(false);
      } else if (user) {
        // Firebase user
        setCurrentUser(user);
        setIsTelegramUser(false);
        subscribeToUserData(user.email);
        setLoading(false);
      } else {
        // No user logged in
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setCurrentUser(null);
        setUserData(null);
        setIsPremium(false);
        setIsAdmin(false);
        setIsTelegramUser(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [subscribeToUserData, getTelegramUser, setTelegramUserAsCurrent]);

  // Update locality when currency loads and user exists
  useEffect(() => {
    if (!currencyLoading && locality && currentUser?.email) {
      const userEmail = currentUser.email;
      // Check if user has locality set, if not - update it
      import('../services/firestore.service').then(({ userService }) => {
        userService.getUser(userEmail).then((userData) => {
          if (userData && !userData.locality) {
            userService.updateUserLocality(userEmail, locality);
          }
        });
      });
    }
  }, [currencyLoading, locality, currentUser]);

  // Manual refresh function (works for both auth methods)
  const refreshUserData = useCallback(async () => {
    const telegramUser = getTelegramUser();
    const userEmail = telegramUser?.email || currentUser?.email;
    
    if (userEmail) {
      const { userService } = await import('../services/firestore.service');
      const data = await userService.getUser(userEmail);
      setUserData(data);
      setIsPremium(data?.isPremium && checkSubscriptionValidity(data));
      setIsAdmin(checkAdminStatus(userEmail));
    }
  }, [currentUser, getTelegramUser, checkAdminStatus, checkSubscriptionValidity]);

  // Login with Telegram (to be called from components)
  const loginWithTelegram = useCallback(async (telegramData) => {
    try {
      const email = telegramData.username 
        ? `${telegramData.username}@telegram.user`
        : `telegram_${telegramData.id}@telegram.user`;
      
      const username = telegramData.username || 
        `${telegramData.first_name}${telegramData.last_name ? `_${telegramData.last_name}` : ''}`;
      
      // Check if user exists in Firestore
      const { userService } = await import('../services/firestore.service');
      let existingUser = await userService.getUser(email);
      
      if (!existingUser) {
        // Create new user
        await userService.createUser(email, username, false);
        await userService.updateUser(email, {
          telegramId: telegramData.id,
          telegramFirstName: telegramData.first_name,
          telegramLastName: telegramData.last_name,
          telegramPhotoUrl: telegramData.photo_url,
          authProvider: 'telegram',
          emailVerified: true
        });
      }
      
      // Store in localStorage
      localStorage.setItem('telegram_logged_in', 'true');
      localStorage.setItem('telegram_user', JSON.stringify({
        email: email,
        username: username,
        telegramId: telegramData.id,
        firstName: telegramData.first_name,
        lastName: telegramData.last_name,
        photoUrl: telegramData.photo_url
      }));
      
      // Set as current user
      setTelegramUserAsCurrent({
        email: email,
        username: username,
        telegramId: telegramData.id,
        photoUrl: telegramData.photo_url
      });
      
      // Subscribe to user data
      subscribeToUserData(email);
      
      return { success: true };
    } catch (error) {
      console.error('Telegram login error:', error);
      return { success: false, error: error.message };
    }
  }, [setTelegramUserAsCurrent, subscribeToUserData]);

  // Logout function (handles both Firebase and Telegram)
  const logout = useCallback(async () => {
    // Clear Telegram session if exists
    logoutTelegram();
    
    // Clear Firebase session if exists
    if (auth.currentUser) {
      await import('firebase/auth').then(({ signOut }) => signOut(auth));
    }
    
    // Clear any other stored data
    localStorage.removeItem('telegram_logged_in');
    localStorage.removeItem('telegram_user');
    
    setCurrentUser(null);
    setUserData(null);
    setIsPremium(false);
    setIsAdmin(false);
    setIsTelegramUser(false);
  }, [logoutTelegram]);

  const value = {
    currentUser,
    userData,
    loading,
    isAdmin,
    isPremium,
    isTelegramUser,
    refreshUserData,
    loginWithTelegram,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};