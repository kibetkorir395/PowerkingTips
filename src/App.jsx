import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from './AuthContext'
import { db, getUser, updateUser } from "./firebase";
import { getAuth } from "firebase/auth";

import Navbar from './components/Navbar/Navbar';
import Loader from './components/Loader/Loader';
import Footer from './components/Footer/Footer';

import Home from './pages/Home';
import About from './pages/About';
import AdminTips from "./pages/AdminTips";
import { Login } from "./pages/Login";
import Register from "./pages/Register";
import Error from './pages/Error';
import Payments from "./pages/Payments/Payments";
import EditTip from "./pages/EditTip";
import UserProfile from "./pages/userProfile/UserProfile";
import ListUsers from "./pages/ListUsers";
import EditUser from "./pages/EditUser";
import { doc, getDoc } from "firebase/firestore";
import Topbar from "./components/Topbar/Topbar";

// Cache management utility functions
const CACHE_KEY = 'powerking_last_visit';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Function to clear browser cache
const clearBrowserCache = async () => {
  if ('caches' in window) {
    try {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map(key => {
          console.log(`Clearing cache: ${key}`);
          return caches.delete(key);
        })
      );
      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }
};

// Function to clear localStorage/sessionStorage
const clearStorages = () => {
  try {
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear specific localStorage items (keep important ones)
    const importantKeys = ['theme', 'user_preferences']; // Add any keys you want to keep
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!importantKeys.includes(key) && key !== CACHE_KEY) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Storages cleared successfully');
  } catch (error) {
    console.error('Error clearing storages:', error);
  }
};

// Function to check if cache is expired
const isCacheExpired = () => {
  const lastVisit = localStorage.getItem(CACHE_KEY);
  if (!lastVisit) {
    return true; // No last visit recorded
  }
  
  const lastVisitTime = parseInt(lastVisit, 10);
  const currentTime = Date.now();
  const timeDifference = currentTime - lastVisitTime;
  
  return timeDifference >= CACHE_DURATION;
};

// Function to update last visit timestamp
const updateLastVisit = () => {
  localStorage.setItem(CACHE_KEY, Date.now().toString());
};

// Function to perform full cache cleanup
const performCacheCleanup = async () => {
  console.log('Performing cache cleanup...');
  await clearBrowserCache();
  clearStorages();
  updateLastVisit();
  
  // Optional: Reload the page to get fresh data
  // window.location.reload();
};

function App() {
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [cacheChecked, setCacheChecked] = useState(false);

  // Cache detection and cleanup on app start
  useEffect(() => {
    const checkAndClearCache = async () => {
      try {
        // Check if cache needs to be cleared
        if (isCacheExpired()) {
          console.log('Cache expired (more than 30 minutes since last visit). Clearing cache...');
          await performCacheCleanup();
        } else {
          console.log('Cache is still valid');
          updateLastVisit(); // Update last visit time
        }
      } catch (error) {
        console.error('Error during cache check:', error);
      } finally {
        setCacheChecked(true);
        setLoading(false);
      }
    };
    
    checkAndClearCache();
  }, []);

  // Optional: Clear cache when user logs out
  useEffect(() => {
    if (!currentUser && cacheChecked) {
      // Clear sensitive data on logout
      sessionStorage.clear();
    }
  }, [currentUser, cacheChecked]);

  useEffect(() => {
    if (loading) {
      if (window.document.readyState === "complete") {
        setLoading(!loading);
      } else {
        setLoading(false);
      }
    }
  }, [loading]);

  useEffect(() => {
    const fetchUserDataWithRetry = async () => {
      const email = currentUser?.email;
      if (!email) return;

      let retries = 0;
      while (retries < 5) {
        const userRef = doc(db, "users", email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
          break;
        }

        retries++;
        await new Promise((res) => setTimeout(res, 500));
      }

      if (retries === 5) {
        console.warn("User document still not found after retries");
      }
    };

    if (currentUser) {
      fetchUserDataWithRetry();
    }
  }, [currentUser]);

  useEffect(() => {
    if (userData && userData.isPremium) {
      const currentTime = new Date();
      const previousTime = new Date(userData.subDate);
      const { subscription } = userData;

      const timeDifference = currentTime - previousTime;

      const checkTimeAndUpdate = (timeLimitInMs) => {
        if (timeDifference >= timeLimitInMs) {
          updateUser(currentUser.email, false, null, null);
        }
      };

      switch (subscription) {
        case "Daily":
          checkTimeAndUpdate(24 * 60 * 60 * 1000);
          break;
        case "Weekly":
          checkTimeAndUpdate(7 * 24 * 60 * 60 * 1000);
          break;
        case "Monthly":
          if (currentTime.getFullYear() > previousTime.getFullYear() ||
            (currentTime.getFullYear() === previousTime.getFullYear() && currentTime.getMonth() > previousTime.getMonth())) {
            updateUser(currentUser.email, false, null, null);
          }
          break;
        case "Yearly":
          if (currentTime.getFullYear() > previousTime.getFullYear() ||
            (currentTime.getFullYear() === previousTime.getFullYear() && currentTime.getMonth() > previousTime.getMonth()) ||
            (currentTime.getFullYear() === previousTime.getFullYear() && currentTime.getMonth() === previousTime.getMonth() && currentTime.getDate() > previousTime.getDate())) {
            updateUser(currentUser.email, false, null, null);
          }
          break;
        default:
          return;
      }
    }
  }, [userData, currentUser]);

  // Don't render until cache check is complete
  if (!cacheChecked) {
    return <Loader />;
  }

  return (
    <HelmetProvider>
      <div className="App">
        {loading && <Loader />}
        {!loading && (
          <>
            <Topbar />
            <Navbar user={currentUser} />
            <Routes>
              <Route path="/" element={<Home userData={userData} />} />
              <Route
                path="pay"
                element={
                  currentUser ? (
                    <Payments setUserData={setUserData} />
                  ) : (
                    <Login />
                  )
                }
              />
              <Route
                path="admin/tips"
                element={currentUser ? <AdminTips /> : <Login />}
              />
              <Route
                path="edit"
                element={currentUser ? <EditTip /> : <Login />}
              />
              <Route
                path="users"
                element={currentUser ? <ListUsers /> : <Login />}
              />
              <Route
                path="users/:id"
                element={
                  currentUser ? <UserProfile data={userData} /> : <Login />
                }
              />
              <Route
                path="users-edit"
                element={
                  currentUser ? (
                    <EditUser userData={userData} setUserData={setUserData} />
                  ) : (
                    <Login />
                  )
                }
              />
              <Route path="about" element={<About />} />
              <Route path="*" element={<Error />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Routes>
            <Footer user={currentUser} />
          </>
        )}
      </div>
    </HelmetProvider>
  );
}

export default App;