"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { INVITE_CODE_LENGTH, normalizeInviteCode } from "../inviteCode";
import { joinProject } from "../services";

export function JoinProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function close(): void {
    setCode("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await joinProject(code);
    setPending(false);
    if (result.ok) router.push(`/p/${result.projectId}`);
    else setError(result.message);
  }

  return (
    <Modal open={open} onClose={close} title="초대 코드로 참여" description="팀원에게 받은 6자리 코드를 입력하세요." width={420}>
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody>
          <Field
            id="join-code"
            label="초대 코드"
            placeholder="ABC234"
            autoComplete="off"
            autoFocus
            maxLength={INVITE_CODE_LENGTH}
            value={code}
            error={error}
            onChange={(e) => setCode(normalizeInviteCode(e.target.value))}
            className="font-mono tracking-[0.15em]"
          />
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={close} className={buttonClass("secondary")}>
            취소
          </button>
          <button type="submit" disabled={pending || code.length !== INVITE_CODE_LENGTH} className={buttonClass("primary")}>
            {pending ? "확인 중…" : "참여하기"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
