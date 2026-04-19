import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../config/firebase";
import { userService } from "./firestore.service";

class AuthService {
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
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
        password
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
        url: window.location.origin + '/login',
        handleCodeInApp: false,
      });
      return {
        success: true,
        message: 'Password reset email sent. Check your inbox.',
      };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore, if not create
      const existingUser = await userService.getUser(user.email);
      
      if (!existingUser) {
        await userService.createUser(
          user.email,
          user.displayName || user.email.split('@')[0],
          false
        );
      }
      
      return { success: true, user };
    } catch (error) {
      let errorMessage = this.getErrorMessage(error.code);
      
      // Handle specific Google auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site.';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  async logout() {
    await signOut(auth);
    return true;
  }

  getErrorMessage(code) {
    const errors = {
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account already exists with this email.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
    };
    return errors[code] || 'An error occurred. Please try again.';
  }
}

export const authService = new AuthService();
