// utils/paymentUtils.js
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { userService } from "../../services/firestore.service";
import Swal from "sweetalert2";

// Subscription plans mapping for different payment methods
export const SUBSCRIPTION_PLANS = {
  shillings: [
    {
      id: "daily",
      value: 250,
      label: "Daily VIP",
      price: "KSH 250",
      period: "Daily",
    },
    {
      id: "weekly",
      value: 800,
      label: "7 Days VIP",
      price: "KSH 800",
      period: "Weekly",
    },
    {
      id: "monthly",
      value: 2500,
      label: "30 Days VIP",
      price: "KSH 2500",
      period: "Monthly",
    },
    {
      id: "yearly",
      value: 8000,
      label: "1 Year VIP",
      price: "KSH 8000",
      period: "Yearly",
    },
  ],
  dollars: [
    { id: "2", value: 2, label: "Daily", price: "$2", period: "Daily" },
    { id: "7", value: 7, label: "Weekly", price: "$7", period: "Weekly" },
    {
      id: "20",
      value: 20,
      label: "Monthly",
      price: "$23",
      period: "Monthly",
    },
    { id: "65", value: 65, label: "Yearly", price: "$65", period: "Yearly" },
  ],
};

// Get subscription period based on price
export const getSubscriptionPeriod = (price) => {
  if (price === 250 || price === 2) return "Daily";
  if (price === 800 || price === 7) return "Weekly";
  if (price === 2500 || price === 20) return "Monthly";
  if (price === 8000 || price === 65) return "Yearly";
  return "Weekly";
};

// Get plan name based on price
export const getPlanName = (price) => {
  if (price === 250 || price === 2) return "Daily";
  if (price === 800 || price === 7) return "Weekly";
  if (price === 2500 || price === 20) return "Monthly";
  if (price === 8000 || price === 65) return "Yearly";
  return "Weekly";
};

// Add transaction record
export const addTransaction = async (userEmail, transactionData) => {
  try {
    const { transactionService } = await import("../../services/firestore.service");
    return await transactionService.addTransaction(userEmail, {
      ...transactionData,
      timestamp: new Date().toISOString(),
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    // Don't throw - allow the upgrade to complete even if transaction logging fails
    return null;
  }
};

// Handle user upgrade after successful payment
export const handleUpgrade = async (currentUser, transactionData, setUserData) => {
  if (!currentUser || !currentUser.email) {
    Swal.fire({
      title: "Error",
      text: "User not found. Please login again.",
      icon: "error",
    });
    return;
  }

  try {
    const subscriptionPeriod = getSubscriptionPeriod(transactionData.amount);
    const userDocRef = doc(db, "users", currentUser.email);
    
    await setDoc(
      userDocRef,
      {
        isPremium: true,
        subscription: subscriptionPeriod,
        subDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    
    // Refresh user data
    if (setUserData) {
      const updatedUser = await userService.getUser(currentUser.email);
      setUserData(updatedUser);
    }

    // Add transaction record (non-blocking)
    addTransaction(currentUser.email, transactionData).catch(error => {
      console.warn("Transaction logging failed:", error);
    });

    Swal.fire({
      title: "Upgrade Successful! 🎉",
      html: `You have upgraded to <strong>${subscriptionPeriod} VIP</strong> plan!`,
      icon: "success",
      confirmButtonText: "Continue",
      confirmButtonColor: "#00ae58",
    }).then(() => {
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    Swal.fire({
      title: "Error",
      text: error.message || "Failed to upgrade. Please contact support.",
      icon: "error",
      confirmButtonText: "OK",
    });
  }
};

// Format phone number for M-Pesa
export const formatPhoneNumber = (phone) => {
  let p = phone.toString().replace(/\D/g, "");

  if (p.startsWith("0")) {
    return "254" + p.substring(1);
  }
  if (p.startsWith("7") || p.startsWith("1")) {
    return "254" + p;
  }
  if (p.startsWith("254")) {
    return p;
  }
  if (phone.toString().startsWith("+")) {
    return p;
  }
  return p;
};

// Validate Kenyan phone number
export const isValidPhoneNumber = (phone) => {
  let p = phone.toString().replace(/\D/g, "");

  const isValidKenyan =
    (p.length === 10 && (p.startsWith("07") || p.startsWith("01"))) ||
    (p.length === 12 && p.startsWith("254")) ||
    (p.length === 9 && (p.startsWith("7") || p.startsWith("1")));

  return isValidKenyan;
};

// Generate random email (fallback)
export const generateRandomEmail = () => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const domains = ["gmail.com", "yahoo.com", "outlook.com"];

  let username = "";
  const usernameLength = Math.floor(Math.random() * 5) + 8;

  for (let i = 0; i < usernameLength; i++) {
    if (i < 6) {
      username += letters.charAt(Math.floor(Math.random() * letters.length));
    } else {
      if (Math.random() < 0.6) {
        username += letters.charAt(Math.floor(Math.random() * letters.length));
      } else {
        username += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
    }
  }

  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username}@${domain}`;
};

// Get default plan for payment type
export const getDefaultPlan = (paymentType) => {
  if (paymentType === "crypto" || paymentType === "paypal") {
    return SUBSCRIPTION_PLANS.dollars[0];
  }
  return SUBSCRIPTION_PLANS.shillings[0];
};

// ============================================
// RECURRING SUBSCRIPTION UTILITIES
// ============================================

/**
 * Calculate subscription end date based on period
 * @param {string} period - "Daily", "Weekly", "Monthly", "Yearly"
 * @returns {Date} - End date
 */
export const calculateSubscriptionEndDate = (period) => {
  const now = new Date();
  switch (period) {
    case "Daily":
      return new Date(now.setDate(now.getDate() + 1));
    case "Weekly":
      return new Date(now.setDate(now.getDate() + 7));
    case "Monthly":
      return new Date(now.setMonth(now.getMonth() + 1));
    case "Yearly":
      return new Date(now.setFullYear(now.getFullYear() + 1));
    default:
      return new Date(now.setDate(now.getDate() + 7));
  }
};

/**
 * Check if subscription is still valid
 * @param {Object} userData - User data object
 * @returns {boolean} - True if subscription is valid
 */
export const isSubscriptionValid = (userData) => {
  if (!userData?.isPremium || !userData?.subDate || !userData?.subscription) {
    return false;
  }
  
  const currentTime = new Date();
  const subDate = new Date(userData.subDate);
  const timeDiff = currentTime - subDate;
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  
  switch (userData.subscription) {
    case "Daily":
      return daysDiff <= 1;
    case "Weekly":
      return daysDiff <= 7;
    case "Monthly":
      return daysDiff <= 30;
    case "Yearly":
      return daysDiff <= 365;
    default:
      return false;
  }
};

/**
 * Get remaining days for subscription
 * @param {Object} userData - User data object
 * @returns {number} - Remaining days (0 if expired or not premium)
 */
export const getRemainingSubscriptionDays = (userData) => {
  if (!userData?.isPremium || !userData?.subDate || !userData?.subscription) {
    return 0;
  }
  
  const currentTime = new Date();
  const subDate = new Date(userData.subDate);
  const timeDiff = currentTime - subDate;
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  
  switch (userData.subscription) {
    case "Daily":
      return Math.max(0, 1 - daysDiff);
    case "Weekly":
      return Math.max(0, 7 - daysDiff);
    case "Monthly":
      return Math.max(0, 30 - daysDiff);
    case "Yearly":
      return Math.max(0, 365 - daysDiff);
    default:
      return 0;
  }
};

/**
 * Auto-update expired subscriptions
 * @param {Object} userData - User data object
 * @param {Function} updateCallback - Callback to update user data
 */
export const autoUpdateExpiredSubscription = async (userData, updateCallback) => {
  if (!isSubscriptionValid(userData) && userData?.isPremium) {
    try {
      const { userService } = await import("../../services/firestore.service");
      await userService.updateUser(userData.email, {
        isPremium: false,
        subscription: null,
        subDate: null,
      });
      if (updateCallback) {
        await updateCallback();
      }
      return true;
    } catch (error) {
      console.error("Error updating expired subscription:", error);
      return false;
    }
  }
  return false;
};