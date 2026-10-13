# TeamKit

소규모 개발팀(2~6명)의 협업 불편을 줄이는 웹 서비스. 빅데이터처리 개인 프로젝트.

- **할 일 보드** — 담당자·상태별 칸반, GitHub 커밋·PR로 진행상황 자동 반영
- **회의록** — 녹음 → CLOVA Speech 텍스트 변환 → 결정사항·할 일 후보 추출
- **일정 맞추기** — 기간 지정 가능 시간 입력 → 공통 시간 추천

## 기술 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Firebase (Authentication, Firestore, Cloud Functions, Storage)

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # Firebase 웹 앱 설정값 채우기
npm run dev                        # http://localhost:3000
```

Firestore 보안 규칙은 `firestore.rules` 를 Firebase 콘솔 → Firestore → 규칙에 게시한다.

## 브랜치 · 커밋

- 기능마다 브랜치 하나, PR 하나 (`feature/기능명`, `fix/기능명`) → `main` 에 머지
- 커밋: `[FEAT] 요약` · `[FIX]` · `[DESIGN]` · `[REFACTOR]` · `[CHORE]` · `[DOCS]`
