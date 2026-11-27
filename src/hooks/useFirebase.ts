import { useState, useEffect, useCallback } from 'react';
import {
  onIdTokenChanged,
  User as FirebaseUser,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
  QueryConstraint,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function formatFirebaseAuthError(error: unknown, lang: 'bn' | 'en' = 'bn'): string {
  const code = (error as { code?: string })?.code || '';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
    return lang === 'bn'
      ? 'Firebase Console → Authentication → Sign-in method থেকে নির্বাচিত লগইন পদ্ধতি (Google / Email) চালু করা নেই।'
      : 'This sign-in provider is not enabled in Firebase Console (Authentication → Sign-in method).';
  }
  if (code === 'auth/email-already-in-use') {
    return lang === 'bn'
      ? 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা আছে। অনুগ্রহ করে লগইন করুন।'
      : 'An account with this email already exists. Please log in.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return lang === 'bn'
      ? 'এই ইমেইল দিয়ে ইতিমধ্যে অন্য পদ্ধতিতে অ্যাকাউন্ট রয়েছে। পূর্বের পদ্ধতিতে (ইমেইল/পাসওয়ার্ড) লগইন করুন।'
      : 'An account already exists with the same email using a different sign-in method.';
  }
  if (code === 'auth/user-disabled') {
    return lang === 'bn'
      ? 'নিরাপত্তাজনিত কারণে এই অ্যাকাউন্টটি সাময়িকভাবে বন্ধ করা হয়েছে।'
      : 'This account has been disabled.';
  }
  if (code === 'auth/invalid-email') {
    return lang === 'bn' ? 'সঠিক ইমেইল ঠিকানা লিখুন।' : 'Please enter a valid email address.';
  }
  if (code === 'auth/weak-password') {
    return lang === 'bn'
      ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
      : 'Password must be at least 6 characters.';
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return lang === 'bn' ? 'ভুল ইমেইল অথবা পাসওয়ার্ড!' : 'Invalid email or password!';
  }
  if (code === 'auth/too-many-requests') {
    return lang === 'bn'
      ? 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'
      : 'Too many attempts. Please try again later.';
  }
  if (code === 'auth/popup-blocked') {
    return lang === 'bn'
      ? 'ব্রাউজার Google সাইন-ইন পপআপ ব্লক করেছে। ব্রাউজারের Popup Allow করুন অথবা লিংকটি Chrome/Safari-তে সরাসরি ওপেন করে চেষ্টা করুন।'
      : 'Sign-in popup was blocked by your browser. Allow popups or open the app link directly in Chrome/Safari.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return lang === 'bn'
      ? 'আগের সাইন-ইন পপআপটি বাতিল হয়েছে। দয়া করে আবার বাটনে চাপ দিন।'
      : 'Previous sign-in popup was cancelled. Please try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return lang === 'bn'
      ? 'Google সাইন-ইন পপআপ সম্পন্ন হওয়ার আগেই বন্ধ হয়েছে। আবার চেষ্টা করুন।'
      : 'Sign-in popup was closed before completion. Please try again.';
  }
  if (code === 'auth/operation-not-supported-in-this-environment') {
    return lang === 'bn'
      ? 'এই ইন-অ্যাপ ব্রাউজারে Google পপআপ সাপোর্ট করছে না। অনুগ্রহ করে Chrome বা Safari ব্রাউজারে লিংকটি ওপেন করুন।'
      : 'Google popup sign-in is not supported in this browser environment. Open in Chrome or Safari.';
  }
  if (code === 'auth/unauthorized-domain') {
    return lang === 'bn'
      ? `এই ডোমেইনটি (${hostname || 'current domain'}) Firebase Authentication Authorized Domains-এ যুক্ত নেই। Firebase Console → Authentication → Settings → Authorized domains-এ "${hostname || 'this domain'}" যোগ করুন।`
      : `Domain "${hostname || 'current domain'}" is not in Firebase Authentication Authorized Domains.`;
  }
  if (code === 'auth/network-request-failed') {
    return lang === 'bn'
      ? 'ইন্টারনেট সংযোগে সমস্যা হয়েছে। নেটওয়ার্ক চেক করে আবার চেষ্টা করুন।'
      : 'Network error. Please check your connection and try again.';
  }
  return error instanceof Error
    ? error.message
    : lang === 'bn'
    ? 'লগইন সম্পন্ন করা যায়নি।'
    : 'Authentication failed.';
}

const isUserEmailVerified = (u: FirebaseUser | null): boolean => {
  if (!u) return false;
  return Boolean(u.emailVerified);
};

export function useFirebase() {
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [emailVerified, setEmailVerified] = useState<boolean>(isUserEmailVerified(auth.currentUser));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!active || !result?.user) return;
        await result.user.reload().catch(() => {});
        await result.user.getIdToken(true).catch(() => {});
        if (!active) return;
        setUser(result.user);
        setEmailVerified(isUserEmailVerified(result.user));
      })
      .catch((err) => {
        if (active) {
          console.error('Google redirect login error:', err);
          setAuthError(err);
        }
      });

    const unsubscribe = onIdTokenChanged(auth, (u) => {
      if (!active) return;
      setUser(u);
      setEmailVerified(isUserEmailVerified(u));
      setLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const cred = await signInWithPopup(auth, provider);
      await cred.user.reload().catch(() => {});
      await cred.user.getIdToken(true).catch(() => {});
      setUser(cred.user);
      setEmailVerified(isUserEmailVerified(cred.user));
      return { user: cred.user, redirecting: false, error: null as unknown };
    } catch (error) {
      const code = (error as { code?: string })?.code || '';
      const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
      if (
        !isInIframe &&
        (code === 'auth/popup-blocked' ||
          code === 'auth/operation-not-supported-in-this-environment' ||
          code === 'auth/cancelled-popup-request')
      ) {
        try {
          await signInWithRedirect(auth, provider);
          return { user: null, redirecting: true, error: null as unknown };
        } catch (redirectError) {
          console.error('Google redirect fallback failed:', redirectError);
          return { user: null, redirecting: false, error: redirectError };
        }
      }
      console.error('Google login failed:', error);
      return { user: null, redirecting: false, error };
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      setUser(cred.user);
      setEmailVerified(Boolean(cred.user.emailVerified));
      return { user: cred.user, error: null as unknown };
    } catch (error) {
      console.error('Email login failed:', error);
      return { user: null, error };
    }
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName && displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 100) }).catch(() => {});
      }
      await sendEmailVerification(cred.user);
      setUser(cred.user);
      setEmailVerified(Boolean(cred.user.emailVerified));
      return { user: cred.user, verificationSent: true, error: null as unknown };
    } catch (error) {
      console.error('Email registration failed:', error);
      return { user: null, verificationSent: false, error };
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) {
      return { ok: false, error: new Error('Not signed in') };
    }
    try {
      await sendEmailVerification(auth.currentUser);
      return { ok: true, error: null as unknown };
    } catch (error) {
      console.error('Resend verification failed:', error);
      return { ok: false, error };
    }
  }, []);

  const refreshVerificationStatus = useCallback(async () => {
    if (!auth.currentUser) return false;
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      const verified = Boolean(auth.currentUser.emailVerified);
      setUser(auth.currentUser);
      setEmailVerified(verified);
      return verified;
    } catch (error) {
      console.error('Refresh verification status failed:', error);
      return Boolean(auth.currentUser?.emailVerified);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { ok: true, error: null as unknown };
    } catch (error) {
      console.error('Password reset failed:', error);
      return { ok: false, error };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setEmailVerified(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  const getDocument = useCallback(async (colPath: string, id: string) => {
    try {
      const docRef = doc(db, colPath, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${colPath}/${id}`);
    }
  }, []);

  const getCollection = useCallback(async (colPath: string, constraints: QueryConstraint[] = []) => {
    try {
      const q = query(collection(db, colPath), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  }, []);

  const setDocument = useCallback(async (colPath: string, id: string, data: any) => {
    try {
      await setDoc(doc(db, colPath, id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${colPath}/${id}`);
    }
  }, []);

  const updateDocument = useCallback(async (colPath: string, id: string, data: any) => {
    try {
      await updateDoc(doc(db, colPath, id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${colPath}/${id}`);
    }
  }, []);

  const addDocument = useCallback(async (colPath: string, data: any) => {
    try {
      const docRef = await addDoc(collection(db, colPath), data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, colPath);
    }
  }, []);

  const deleteDocument = useCallback(async (colPath: string, id: string) => {
    try {
      await deleteDoc(doc(db, colPath, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${colPath}/${id}`);
    }
  }, []);

  const subscribeSnapshot = useCallback(
    (colPath: string, callback: (data: any[]) => void, constraints: QueryConstraint[] = []) => {
      const q = query(collection(db, colPath), ...constraints);
      return onSnapshot(
        q,
        (snapshot) => {
          callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, colPath);
        }
      );
    },
    []
  );

  const subscribeDocument = useCallback(
    (colPath: string, id: string, callback: (data: any | null) => void) => {
      const docRef = doc(db, colPath, id);
      return onSnapshot(
        docRef,
        (docSnap) => {
          callback(docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } : null);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `${colPath}/${id}`);
        }
      );
    },
    []
  );

  const verifyAdminAccess = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) {
      return false;
    }
    try {
      await getDocs(query(collection(db, 'admins'), limit(1)));
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    user,
    emailVerified,
    loading,
    authError,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resendVerificationEmail,
    refreshVerificationStatus,
    resetPassword,
    logout,
    verifyAdminAccess,
    getDocument,
    getCollection,
    setDocument,
    updateDocument,
    deleteDocument,
    addDocument,
    onSnapshot: subscribeSnapshot,
    onDocumentSnapshot: subscribeDocument,
  };
}
