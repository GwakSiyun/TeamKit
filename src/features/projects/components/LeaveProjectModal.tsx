"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { leaveProject } from "../services";
import type { Project } from "../types";

export function LeaveProjectModal({ project, open, onClose }: { project: Project; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function close(): void {
    setError(null);
    onClose();
  }

  async function handleLeave(): Promise<void> {
    setPending(true);
    setError(null);
    const result = await leaveProject(project);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    close();
    router.replace("/projects");
  }

  return (
    <Modal open={open} onClose={close} title={`${project.name}에서 나갈까요?`} width={440}>
      <ModalBody>
        <p className="leading-relaxed text-sub">나가면 이 프로젝트를 볼 수 없어요. 다시 들어오려면 팀원에게 초대 코드를 받아야 해요.</p>
        {error && <Notice tone="error">{error}</Notice>}
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={close} className={buttonClass("secondary")}>
          취소
        </button>
        <button type="button" onClick={handleLeave} disabled={pending} className={buttonClass("danger")}>
          {pending ? "나가는 중…" : "나가기"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
