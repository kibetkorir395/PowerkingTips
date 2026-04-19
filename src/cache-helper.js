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
export const isCacheExpired = () => {
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
export const updateLastVisit = () => {
  localStorage.setItem(CACHE_KEY, Date.now().toString());
};

// Function to perform full cache cleanup
export const performCacheCleanup = async () => {
  console.log('Performing cache cleanup...');
  await clearBrowserCache();
  clearStorages();
  updateLastVisit();
  
  // Optional: Reload the page to get fresh data
  // window.location.reload();
};
