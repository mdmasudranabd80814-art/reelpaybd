import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
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
  where,
  orderBy,
  QueryConstraint
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
  }
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useFirebase() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getDocument = async (colPath: string, id: string) => {
    try {
      const docRef = doc(db, colPath, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${colPath}/${id}`);
    }
  };

  const getCollection = async (colPath: string, constraints: QueryConstraint[] = []) => {
    try {
      const q = query(collection(db, colPath), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  };

  const setDocument = async (colPath: string, id: string, data: any) => {
    try {
      await setDoc(doc(db, colPath, id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${colPath}/${id}`);
    }
  };

  const updateDocument = async (colPath: string, id: string, data: any) => {
    try {
      await updateDoc(doc(db, colPath, id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${colPath}/${id}`);
    }
  };

  const addDocument = async (colPath: string, data: any) => {
    try {
      const docRef = await addDoc(collection(db, colPath), data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, colPath);
    }
  };

  const deleteDocument = async (colPath: string, id: string) => {
    try {
      await deleteDoc(doc(db, colPath, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${colPath}/${id}`);
    }
  };

  return {
    user,
    loading,
    loginWithGoogle,
    logout,
    getDocument,
    getCollection,
    setDocument,
    updateDocument,
    deleteDocument,
    addDocument,
    onSnapshot: (colPath: string, callback: (data: any[]) => void, constraints: QueryConstraint[] = []) => {
      const q = query(collection(db, colPath), ...constraints);
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      });
    }
  };
}
