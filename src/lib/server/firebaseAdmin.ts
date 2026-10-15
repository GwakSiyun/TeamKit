// 서버 전용 (API 라우트에서만 import). 브라우저 코드에서 쓰면 빌드에 서버 SDK 가 섞인다.
import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * App Hosting(Cloud Run) 에서는 서비스 계정 자격 증명(ADC)이 자동으로 잡힌다.
 * 로컬 개발 서버에는 자격 증명이 없어서 서버 API 가 동작하지 않는다 → 배포 주소에서 확인.
 */
function adminApp(): App {
  return getApps()[0] ?? initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}
