import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// 웹 앱 설정값은 공개돼도 되는 값이다(보안은 Firestore 규칙이 담당). 시크릿은 절대 NEXT_PUBLIC_ 에 두지 않는다.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return !!config.apiKey && !!config.projectId;
}

// 빌드(서버 프리렌더) 중에 초기화되지 않도록 브라우저에서 처음 호출될 때 만든다.
function firebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase 설정이 없습니다. .env.local 에 NEXT_PUBLIC_FIREBASE_* 값을 넣어주세요 (.env.local.example 참고).");
  }
  return initializeApp(config);
}

export function firebaseAuth(): Auth {
  return getAuth(firebaseApp());
}

export function firestore(): Firestore {
  return getFirestore(firebaseApp());
}
