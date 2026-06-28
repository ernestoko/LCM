"use client";

import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True when the six required NEXT_PUBLIC_* values are present. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

/** When true, the client talks to the local Firebase Emulator Suite. */
const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const EMU_HOST = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1";

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;
let authConnected = false;
let dbConnected = false;
let storageConnected = false;

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Copy .env.local.example to .env.local and add your Firebase keys.",
    );
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
    if (USE_EMULATOR && !authConnected) {
      authConnected = true;
      connectAuthEmulator(authInstance, `http://${EMU_HOST}:9099`, { disableWarnings: true });
    }
  }
  return authInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
    if (USE_EMULATOR && !dbConnected) {
      dbConnected = true;
      connectFirestoreEmulator(dbInstance, EMU_HOST, 8080);
    }
  }
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseApp());
    if (USE_EMULATOR && !storageConnected) {
      storageConnected = true;
      connectStorageEmulator(storageInstance, EMU_HOST, 9199);
    }
  }
  return storageInstance;
}
