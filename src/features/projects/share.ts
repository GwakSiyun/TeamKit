export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

export function inviteUrl(code: string): string {
  return `${window.location.origin}/join/${code}`;
}

/**
 * 초대 링크 공유: 휴대폰 · 사파리는 기본 공유 시트(카카오톡 · 메시지 등),
 * 공유를 못 하는 브라우저(PC 크롬 등)는 링크를 복사한다.
 */
export async function shareInvite(code: string, projectName: string): Promise<ShareOutcome> {
  const url = inviteUrl(code);
  const data: ShareData = {
    title: `「${projectName}」 프로젝트 초대 · TeamKit`,
    text: `TeamKit 「${projectName}」 프로젝트에 초대했어요. 링크를 누르고 참여하기만 하면 돼요.`,
    url,
  };
  if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      // 공유 창을 닫은 것 (실패 아님)
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
