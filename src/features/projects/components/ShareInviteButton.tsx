"use client";

import { useState } from "react";
import { buttonClass, type ButtonVariant } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { shareInvite, type ShareOutcome } from "../share";
import type { Project } from "../types";

const FEEDBACK_MS = 1800;

const FEEDBACK: Partial<Record<ShareOutcome, string>> = {
  copied: "링크 복사됨",
  failed: "복사하지 못했어요",
};

/** 초대 링크 공유 버튼 (공유 시트, 안 되면 링크 복사). 프로젝트 설정 · 상단바 공통 */
export function ShareInviteButton({
  project,
  label = "초대 링크 공유",
  variant = "primary",
  extra = "",
}: {
  project: Pick<Project, "inviteCode" | "name">;
  label?: string;
  variant?: ButtonVariant;
  extra?: string;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    const outcome = await shareInvite(project.inviteCode, project.name);
    const text = FEEDBACK[outcome];
    if (!text) return;
    setFeedback(text);
    setTimeout(() => setFeedback(null), FEEDBACK_MS);
  }

  return (
    <button type="button" onClick={() => void handleClick()} className={buttonClass(variant, extra)}>
      <Icon name={feedback === FEEDBACK.copied ? "check" : "share"} size={15} />
      {feedback ?? label}
    </button>
  );
}
