import { ImageResponse } from "next/og";

// 링크 미리보기 이미지 (모든 화면 공통). 기본 글꼴에 한글이 없어서 영문만 쓴다 — 한글 제목 · 설명은 메타데이터 글자로 보인다
export const alt = "TeamKit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage(): ImageResponse {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 96px", background: "#FFFFFF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="140" height="140" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#37352F" />
            <path d="M10 18H50M30 18V48" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M30 34C30 26 40 26 50 18M30 34C30 41 40 42 50 48" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="10" cy="18" r="4" fill="#D3D1CB" />
            <circle cx="30" cy="34" r="4" fill="#D3D1CB" stroke="#37352F" strokeWidth="2" />
            <circle cx="50" cy="18" r="4" fill="#2383E2" />
            <circle cx="50" cy="48" r="4.6" fill="#4DAB9A" />
          </svg>
          <div style={{ fontSize: 96, fontWeight: 700, color: "#37352F" }}>TeamKit</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 40, color: "#787774" }}>Tasks · Meeting notes · Scheduling · GitHub sync</div>
        <div style={{ marginTop: 48, display: "flex", gap: 14 }}>
          {[
            ["#D3D1CB", 180],
            ["#2383E2", 260],
            ["#4DAB9A", 140],
          ].map(([color, width]) => (
            <div key={String(color)} style={{ width: Number(width), height: 22, borderRadius: 6, background: String(color) }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
