/**
 * TeamKit 로고: git 그래프로 그린 T + k.
 * 회색(할 일)에서 갈라진 브랜치가 파랑(진행)에서 다시 합쳐지고, 아래 초록(완료)으로 끝난다.
 * 같은 모양이 src/app/icon.svg(브라우저 탭) · opengraph-image(링크 미리보기)에도 있다.
 */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="TeamKit" className="shrink-0">
      <rect width="64" height="64" rx="14" fill="#37352F" />
      <path d="M10 18H50M30 18V48" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M30 34C30 26 40 26 50 18M30 34C30 41 40 42 50 48" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="10" cy="18" r="4" fill="#D3D1CB" />
      <circle cx="30" cy="34" r="4" fill="#D3D1CB" stroke="#37352F" strokeWidth="2" />
      <circle cx="50" cy="18" r="4" fill="#2383E2" />
      <circle cx="50" cy="48" r="4.6" fill="#4DAB9A" />
    </svg>
  );
}
