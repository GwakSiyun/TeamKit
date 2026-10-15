# TeamKit

소규모 개발팀(2~6명)의 협업 불편을 줄이는 웹 서비스 · 빅데이터처리 개인 프로젝트

**서비스 주소: https://teamkit.site**

| 문제 | 해결 기능 |
|---|---|
| 진행상황 공유 부재 — 마감 직전에야 문제를 앎 | **할 일 보드 + 간트 대시보드**, GitHub 커밋·PR로 카드 상태 **자동 반영** |
| 회의 내용 휘발 — 같은 논의 반복 | **회의록**: 녹음 → Whisper(음성 인식) 텍스트 변환 → 결정사항·할 일 후보 추출 |
| 일정 조율 어려움 — 메신저로 시간 소모 | **일정 맞추기**: 가능 시간 입력 → 공통 시간 추천 |

## 기술 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Firebase (Authentication, Firestore, Cloud Functions, Storage) · GitHub OAuth · Whisper large-v3-turbo (Groq API)

## 진행 상황

| 주차 | 내용 | 상태 |
|---|---|---|
| 5 | 기술 스택 · 개발 환경 · Firestore 설계 · 상세 기획 · 디자인 | ✅ |
| 6 | 이메일·GitHub 회원가입/로그인 (#1) | ✅ |
| 6 | 프로젝트 생성 · 초대 코드 참여 · 나가기 · 삭제 · 보안 규칙 자동 테스트 | ✅ |
| 6 | 프로젝트 내부 틀 (사이드바 · 상단바) · 프로젝트 설정 · 계정 설정 | ✅ |
| 7 | 할 일 보드 (칸반 · 카드 번호 · 상세 · 변경 기록) · 보안 규칙 테스트 | ✅ |
| 8 | 간트 대시보드 (진행률 · 지연 · 담당자별 기간 · 마감 임박) | ✅ |
| 8~9 | 회의록: 녹음 · 파일 · 직접 입력 → Groq Whisper 음성 인식 → 결정사항 · 할 일 후보 추출 → 보드에 추가 | ✅ |
| 10 | 일정 맞추기 (히트맵 · 드래그 입력 · 추천 · 확정 → 대시보드 다음 회의) | ✅ |
| 11~12 | GitHub 연동: 레포 연결(웹훅 자동 등록) · 브랜치/커밋/PR → 카드 자동 이동 · PR 배지 · 활동 기록 | ✅ |
| – | Firestore 보안 규칙 자동 테스트 67개 (에뮬레이터) | ✅ |

## 문서

| 문서 | 내용 |
|---|---|
| [보안 설계](docs/SECURITY.md) | 인증 흐름, Firestore 보안 규칙, 시크릿 관리, 알려진 한계 |
| [Firebase 구조](docs/FIREBASE.md) | 서비스 구성도, 컬렉션 · 필드, 설계 이유 |
| [파일 구조](docs/ARCHITECTURE.md) | 폴더 구성, 기능별 위치, 코드 흐름 |
| [개발 규칙](docs/DEVELOPMENT.md) | 브랜치 · 커밋 · PR 규칙, 코드 규칙 |
| [음성 인식(STT) 선택](docs/STT.md) | CLOVA → Whisper 변경 이유, 후보 비교, 처리 구조 |

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # Firebase 웹 앱 설정값 채우기
npm run dev                        # http://localhost:3000
```

## 배포

Firebase App Hosting (Blaze 요금제) — `main` 에 머지되면 자동으로 빌드 · 배포된다. 커스텀 도메인 `teamkit.site`(가비아 DNS: A · TXT · `_acme-challenge` 레코드), 기본 주소 `teamkit--teamkit-8c6d5.asia-east1.hosted.app` 도 그대로 동작한다. 환경 변수와 인스턴스 수는 [`apphosting.yaml`](apphosting.yaml).

Firestore 보안 규칙: [`firestore.rules`](firestore.rules) · 테스트 `npm run test:rules` · 게시 `npx firebase deploy --only firestore:rules`
