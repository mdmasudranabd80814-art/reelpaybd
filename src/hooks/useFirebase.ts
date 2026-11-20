import { useState, useEffect, useCallback } from 'react';
import {
  onIdTokenChanged,
  User as FirebaseUser,
  signInWithPopup,
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
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
    return lang === 'bn'
      ? 'Firebase Console-এ Email/Password Sign-in চালু নেই। Authentication → Sign-in method থেকে Email/Password Enable করুন, অথবা নিচের Google Sign-in ব্যবহার করুন।'
      : 'Email/Password sign-in is not enabled in Firebase Console (Authentication → Sign-in method). Please enable it or use Google Sign-in.';
  }
  if (code === 'auth/email-already-in-use') {
    return lang === 'bn'
      ? 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা আছে। অনুগ্রহ করে লগইন করুন।'
      : 'An account with this email already exists. Please log in.';
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
  if (code === 'auth/popup-closed-by-user') {
    return lang === 'bn' ? 'সাইন-ইন পপআপ বন্ধ করা হয়েছে।' : 'Sign-in popup was closed.';
  }
  return error instanceof Error
    ? error.message
    : lang === 'bn'
    ? 'লগইন সম্পন্ন করা যায়নি।'
    : 'Authentication failed.';
}

export function useFirebase() {
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [emailVerified, setEmailVerified] = useState<boolean>(Boolean(auth.currentUser?.emailVerified));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (u) => {
      setUser(u);
      setEmailVerified(Boolean(u?.emailVerified));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const cred = await signInWithPopup(auth, provider);
      setUser(cred.user);
      setEmailVerified(Boolean(cred.user.emailVerified));
      return { user: cred.user, error: null as unknown };
    } catch (error) {
      console.error('Google login failed:', error);
      return { user: null, error };
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
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${colPath}/${id}`);
    }
  }, []);

  const getCollection = useCallback(async (colPath: string, constraints: QueryConstraint[] = []) => {
    try {
      const q = query(collection(db, colPath), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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
          callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, colPath);
        }
      );
    },
    []
  );

  return {
    user,
    emailVerified,
    loading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resendVerificationEmail,
    refreshVerificationStatus,
    resetPassword,
    logout,
    getDocument,
    getCollection,
    setDocument,
    updateDocument,
    deleteDocument,
    addDocument,
    onSnapshot: subscribeSnapshot,
  };
}
