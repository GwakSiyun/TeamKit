import { ImageResponse } from "next/og";

// 링크 미리보기 이미지 (모든 화면 공통, 빌드 때 한 번 만든다).
// 카톡이 정사각형에 가깝게 잘라도 보이도록 로고 · 글자를 가운데에 크게
export const alt = "TeamKit — 개발팀의 할 일 · 회의록 · 일정을 한곳에서";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "TeamKit";
const TAGLINE = "개발팀의 할 일 · 회의록 · 일정을 한곳에서";

/**
 * 이미지 생성기 기본 글꼴엔 한글이 없어서, 쓰는 글자만 담은 Noto Sans KR(TTF)을 Google Fonts 에서 받는다.
 * 받지 못하면 null → 기본 글꼴 (빌드는 실패하지 않게)
 */
async function loadFont(text: string, weight: 500 | 700): Promise<ArrayBuffer | null> {
  // 빌드 때 한 번만 받아 두고 재사용 (요청마다 Google Fonts 를 부르지 않게)
  "use cache";
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}`, {
        // 오래된 브라우저인 척해야 woff2 대신 이미지 생성기가 읽는 truetype 을 준다
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1)" },
      })
    ).text();
    const url = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage(): Promise<ImageResponse> {
  const [bold, medium] = await Promise.all([loadFont(TITLE, 700), loadFont(TAGLINE, 500)]);
  const fonts = [
    ...(bold ? [{ name: "Noto Sans KR", data: bold, weight: 700 as const, style: "normal" as const }] : []),
    ...(medium ? [{ name: "Noto Sans KR", data: medium, weight: 500 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          fontFamily: "Noto Sans KR",
        }}
      >
        <svg width="300" height="300" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="14" fill="#37352F" />
          <path d="M10 18H50M30 18V48" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M30 34C30 26 40 26 50 18M30 34C30 41 40 42 50 48" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="10" cy="18" r="4" fill="#D3D1CB" />
          <circle cx="30" cy="34" r="4" fill="#D3D1CB" stroke="#37352F" strokeWidth="2" />
          <circle cx="50" cy="18" r="4" fill="#2383E2" />
          <circle cx="50" cy="48" r="4.6" fill="#4DAB9A" />
        </svg>
        <div style={{ marginTop: 28, fontSize: 80, fontWeight: 700, color: "#37352F", letterSpacing: -1 }}>{TITLE}</div>
        <div style={{ marginTop: 6, fontSize: 34, fontWeight: 500, color: "#787774" }}>{TAGLINE}</div>
      </div>
    ),
    { ...size, fonts },
  );
}
