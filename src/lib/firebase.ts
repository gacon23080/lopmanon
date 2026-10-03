import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Get config from imported json or injected meta object
let app = null;
let db: Firestore | null = null;

try {
  const metaConfigStr = typeof document !== 'undefined' ? document.querySelector('meta[name="firebase-applet-config"]')?.getAttribute('content') : null;
  const config = metaConfigStr ? JSON.parse(metaConfigStr) : firebaseConfigJson;

  if (config && config.projectId) {
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    const databaseId = config.firestoreDatabaseId || "ai-studio-c5650459-d7dc-498f-8012-722352bb0b7e";
    
    try {
      // Use initializeFirestore with experimentalAutoDetectLongPolling for ultra-reliable connection
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      }, databaseId);
    } catch (e) {
      // If already initialized, get existing instance
      db = getFirestore(app, databaseId);
    }
  }
} catch (error) {
  console.warn("Failed to initialize Firebase with custom databaseId, trying default:", error);
  try {
    if (app) {
      db = getFirestore(app);
    }
  } catch (err2) {
    console.warn("Failed to initialize fallback Firestore:", err2);
  }
}

export { db };
