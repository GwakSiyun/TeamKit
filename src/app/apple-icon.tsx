import { ImageResponse } from "next/og";

// 애플 기기용 PNG 아이콘 (공유 창 · 홈 화면에 추가). SVG(icon.svg)는 여기서 안 읽어서 따로 만든다.
// 모서리는 기기가 둥글게 잘라 주므로 꽉 찬 사각형으로 그린다. 모양은 LogoMark 와 같음
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    (
      <svg width="180" height="180" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#37352F" />
        <path d="M10 18H50M30 18V48" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M30 34C30 26 40 26 50 18M30 34C30 41 40 42 50 48" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="10" cy="18" r="4" fill="#D3D1CB" />
        <circle cx="30" cy="34" r="4" fill="#D3D1CB" stroke="#37352F" strokeWidth="2" />
        <circle cx="50" cy="18" r="4" fill="#2383E2" />
        <circle cx="50" cy="48" r="4.6" fill="#4DAB9A" />
      </svg>
    ),
    size,
  );
}
