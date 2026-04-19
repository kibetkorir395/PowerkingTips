import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Cache for frequent queries
const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// User Service
export const userService = {
  async getUser(email) {
    const cacheKey = `user_${email}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const userDoc = await getDoc(doc(db, 'users', email));
    const data = userDoc.exists()
      ? { id: userDoc.id, ...userDoc.data() }
      : null;
    queryCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  },

  async updateUser(email, data) {
    const userRef = doc(db, 'users', email);
    await updateDoc(userRef, { ...data, updatedAt: Timestamp.now() });
    queryCache.delete(`user_${email}`);
    return true;
  },

  async createUser(email, username, isPremium = false) {
    const userRef = doc(db, 'users', email);
    await setDoc(userRef, {
      email,
      username,
      isPremium,
      subscription: null,
      subDate: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      transactions: [],
    });
    return true;
  },

  async getAllUsers(page = 1, pageSize = 20, filters = {}, lastDoc = null) {
    try {
      // Base query - ordering by createdAt descending (newest first)
      // This works fine alone but requires composite index when combined with where clause
      //let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      
      // Alternative: Use document ID which is always indexed (no composite index needed)
       let q = query(collection(db, 'users'), orderBy('__name__'));
  
      // Apply isPremium filter if specified
      // ⚠️ This creates a composite index requirement: isPremium + createdAt
      // Without the composite index, this query will fail silently or return no results
      if (filters.isPremium !== undefined) {
        q = query(q, where('isPremium', '==', filters.isPremium));
      }
  
      // Add pagination using startAfter for "Load More" functionality
      // startAfter tells Firestore to start from the last document we already have
      if (lastDoc) {
        q = query(q, startAfter(lastDoc), limit(pageSize));
      } else {
        q = query(q, limit(pageSize));
      }
  
      const snapshot = await getDocs(q);
      const users = [];
      let lastVisible = null;
      
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
        lastVisible = doc; // Store last document for next page
      });
  
      // Client-side sorting alternative (uncomment if you remove orderBy from query)
      // This sorts after fetching but is less efficient than database sorting
      /*users.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA; // descending
      });*/
    
      return { 
        users, 
        hasMore: users.length === pageSize, // If we got full page, there might be more
        lastDoc: lastVisible // Return last document for next pagination request
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      return { users: [], hasMore: false, lastDoc: null };
    }
  },
};

// Tips Service
export const tipsService = {
  async getTipsByDate(date, limit_count = 25, isPremium = false) {
    let q = query(
      collection(db, 'tips'),
      where('date', '==', date),
      where('premium', '==', isPremium),
      limit(limit_count)
    );

    const snapshot = await getDocs(q);
    const tips = [];
    snapshot.forEach((doc) => tips.push({ id: doc.id, ...doc.data() }));
    return tips;
  },

  async getAllTips(page = 1, pageSize = 20) {
    let q = query(collection(db, 'tips'), orderBy('date', 'desc'));
    const startAt = (page - 1) * pageSize;
    const paginatedQuery = query(q, limit(pageSize));

    const snapshot = await getDocs(paginatedQuery);
    const tips = [];
    snapshot.forEach((doc) => tips.push({ id: doc.id, ...doc.data() }));

    return { tips, hasMore: tips.length === pageSize };
  },

  /*async getAllTips(limit_count = 100) {
    const q = query(collection(db, "tips"), orderBy("date", "desc"), limit(limit_count));
    const snapshot = await getDocs(q);
    const tips = [];
    snapshot.forEach(doc => tips.push({ id: doc.id, ...doc.data() }));
    return tips;
  }*/

  async getWonTips(page = 1, pageSize = 20) {
    const q = query(
      collection(db, 'tips'),
      where('won', '==', 'won'),
      orderBy('date', 'desc'),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    const tips = [];
    snapshot.forEach((doc) => tips.push({ id: doc.id, ...doc.data() }));

    return { tips, hasMore: tips.length === pageSize };
  },

  async addTip(tipData) {
    const timestamp = Date.now();
    const customId =
      `${tipData.home}_${tipData.away}_${tipData.date}_${timestamp}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
    const tipRef = doc(db, 'tips', customId);
    await setDoc(tipRef, { ...tipData, createdAt: Timestamp.now() });
    return customId;
  },

  async updateTip(id, data) {
    const tipRef = doc(db, 'tips', id);
    await updateDoc(tipRef, { ...data, updatedAt: Timestamp.now() });
    return true;
  },
};

// Transaction Service
export const transactionService = {
  async addTransaction(userEmail, transaction) {
    const userRef = doc(db, 'users', userEmail);
    const newTransaction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...transaction,
      createdAt: Timestamp.now(),
    };
    await updateDoc(userRef, {
      transactions: arrayUnion(newTransaction),
    });
    return newTransaction;
  },

  async getUserTransactions(userEmail, page = 1, pageSize = 10) {
    const user = await userService.getUser(userEmail);
    if (!user || !user.transactions)
      return { transactions: [], hasMore: false };

    const transactions = [...(user.transactions || [])].reverse();
    const start = (page - 1) * pageSize;
    const paginated = transactions.slice(start, start + pageSize);

    return {
      transactions: paginated,
      hasMore: start + pageSize < transactions.length,
    };
  },
};

// Contact Service
export const contactService = {
  async addContact(data) {
    const contactRef = doc(collection(db, 'contacts'));
    await setDoc(contactRef, {
      ...data,
      responded: false,
      createdAt: Timestamp.now(),
    });
    return contactRef.id;
  },
};

// Clear cache on logout
export const clearCache = () => {
  queryCache.clear();
};
