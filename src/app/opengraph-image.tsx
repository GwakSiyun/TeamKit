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
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 24,
              background: "#37352F",
              color: "#FFFFFF",
              fontSize: 64,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            T
          </div>
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
