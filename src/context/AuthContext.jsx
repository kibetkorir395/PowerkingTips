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
  const unsubscribeRef = useRef(null);

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

  // Real-time user data listener
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

            setUserData(data);
            setIsPremium(data.isPremium && isValidSubscription);
            setIsAdmin(checkAdminStatus(email));
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

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        subscribeToUserData(user.email);
      } else {
        // Clean up listener on logout
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setUserData(null);
        setIsPremium(false);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [subscribeToUserData]);

  // Manual refresh function
  const refreshUserData = useCallback(async () => {
    if (currentUser?.email) {
      const { userService } = await import('../services/firestore.service');
      const data = await userService.getUser(currentUser.email);
      setUserData(data);
      setIsPremium(data?.isPremium && checkSubscriptionValidity(data));
      setIsAdmin(checkAdminStatus(currentUser.email));
    }
  }, [currentUser, checkAdminStatus, checkSubscriptionValidity]);

  const value = {
    currentUser,
    userData,
    loading,
    isAdmin,
    isPremium,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
