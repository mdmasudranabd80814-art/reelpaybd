import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, getDocs, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { INITIAL_REELS, INITIAL_TASKS } from './data/initialData';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Validate connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
  } catch (error) {
    console.warn("Initial Firestore connection test failed (expected if DB is empty):", error);
  }
}

// Seed initial data if needed
export async function seedInitialData(currentUserUid: string) {
  try {
    const reelsSnap = await getDocs(collection(db, 'reels'));
    const batch = writeBatch(db);
    let needsCommit = false;

    // Seed or sync all new app reels
    INITIAL_REELS.forEach((reel) => {
      const docRef = doc(collection(db, 'reels'), reel.id);
      batch.set(docRef, { ...reel, userId: currentUserUid, createdAt: reel.createdAt || new Date().toISOString() }, { merge: true });
      needsCommit = true;
    });

    // Clean up old sample reels (reel_01, reel_02) if they exist
    reelsSnap.docs.forEach((snap) => {
      if (snap.id === 'reel_01' || snap.id === 'reel_02') {
        batch.delete(snap.ref);
        needsCommit = true;
      }
    });

    if (needsCommit) {
      await batch.commit();
    }
  } catch (error) {
    console.warn("Seeding note (proceeding gracefully):", error);
  }
}

testConnection();
