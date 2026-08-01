import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { userService } from "./firestore.service";

// Add to auth.service.js imports
import { signInWithCustomToken } from "firebase/auth";

class AuthService {
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const userData = await userService.getUser(email);
      return { success: true, user: userCredential.user, userData };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  async register(email, password, username) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(userCredential.user, { displayName: username });
      await userService.createUser(email, username);
      await sendEmailVerification(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  async forgotPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + "/login",
        handleCodeInApp: false,
      });
      return {
        success: true,
        message: "Password reset email sent. Check your inbox.",
      };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not create
      const existingUser = await userService.getUser(user.email);

      if (!existingUser) {
        await userService.createUser(
          user.email,
          user.displayName || user.email.split("@")[0],
          false,
        );
      }

      return { success: true, user };
    } catch (error) {
      console.log(error);
      let errorMessage = this.getErrorMessage(error.code);

      // Handle specific Google auth errors
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign in cancelled. Please try again.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup was blocked. Please allow popups for this site.";
      }

      return { success: false, error: errorMessage };
    }
  }

  // Add to auth.service.js

  // Login with Telegram (client-side only version)
  async loginWithTelegram(email, telegramData) {
    try {
      // Check if user exists in Firestore
      const userData = await userService.getUser(email);

      if (!userData) {
        return { success: false, error: "User not found" };
      }

      // Verify this is actually a Telegram-linked account
      if (userData.authProvider !== "telegram" && !userData.telegramId) {
        return { success: false, error: "Account not linked with Telegram" };
      }

      // Store user data in localStorage for session (client-side only)
      localStorage.setItem("telegram_logged_in", "true");
      localStorage.setItem(
        "telegram_user",
        JSON.stringify({
          email: email,
          username: userData.username,
          telegramId: telegramData.id,
          firstName: telegramData.first_name,
          lastName: telegramData.last_name,
          photoUrl: telegramData.photo_url,
        }),
      );

      // Create a fake user object that matches Firebase User structure
      const fakeUser = {
        email: email,
        displayName: userData.username,
        uid: `telegram_${telegramData.id}`,
        emailVerified: true,
        isAnonymous: false,
        providerData: [{ providerId: "telegram.com" }],
      };

      return { success: true, user: fakeUser, userData: userData };
    } catch (error) {
      console.error("Telegram login error:", error);
      return { success: false, error: error.message };
    }
  }

  // Update your existing signInWithTelegram method (for registration)
  async signInWithTelegram(telegramData) {
    try {
      const email = telegramData.username
        ? `${telegramData.username}@telegram.user`
        : `telegram_${telegramData.id}@telegram.user`;

      const username =
        telegramData.username ||
        `${telegramData.first_name}${telegramData.last_name ? `_${telegramData.last_name}` : ""}`;

      // Check if user exists
      const existingUser = await userService.getUser(email);

      // Prepare update data - filter out undefined values
      const updateData = {
        telegramId: telegramData.id,
        telegramFirstName: telegramData.first_name,
        authProvider: "telegram",
        emailVerified: true,
      };

      // Only add lastName if it exists and is not undefined
      if (telegramData.last_name) {
        updateData.telegramLastName = telegramData.last_name;
      }

      // Only add photoUrl if it exists
      if (telegramData.photo_url) {
        updateData.telegramPhotoUrl = telegramData.photo_url;
      }

      // Only add username if it exists
      if (telegramData.username) {
        updateData.telegramUsername = telegramData.username;
      }

      if (!existingUser) {
        // Create new user
        await userService.createUser(email, username, false);
        await userService.updateUser(email, updateData);
      } else {
        // Update existing user
        await userService.updateUser(email, updateData);
      }

      return { success: true, userData: { email, username, ...updateData } };
    } catch (error) {
      console.error("Telegram sign in error:", error);
      return { success: false, error: error.message };
    }
  }

  // Add to auth.service.js

  // Get user by email from Firestore
  async getUserByEmail(email) {
    try {
      const userData = await userService.getUser(email);
      return userData;
    } catch (error) {
      return null;
    }
  }

  // Create a Telegram user without Firebase Auth password
  async createTelegramUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await userService.getUser(userData.email);
      if (existingUser) {
        return { success: false, error: "User already exists" };
      }

      // Create user in Firestore only (not in Firebase Auth)
      await userService.createUser(
        userData.email,
        userData.username,
        false, // isPremium
      );

      // Store additional Telegram metadata
      await userService.updateUser(userData.email, {
        telegramId: userData.telegramId,
        telegramFirstName: userData.firstName,
        telegramLastName: userData.lastName,
        telegramPhotoUrl: userData.photoUrl,
        authProvider: "telegram",
        emailVerified: true, // Telegram users are considered verified
      });

      return { success: true };
    } catch (error) {
      console.error("Create Telegram user error:", error);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    await signOut(auth);
    return true;
  }

  getErrorMessage(code) {
    const errors = {
      "auth/invalid-email": "Invalid email address.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/email-already-in-use": "An account already exists with this email.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
    };
    return errors[code] || "An error occurred. Please try again.";
  }
}

export const authService = new AuthService();
