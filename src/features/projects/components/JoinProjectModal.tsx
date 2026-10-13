"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { INVITE_CODE_LENGTH, normalizeInviteCode } from "../inviteCode";
import { joinProject } from "../services";

interface AlreadyMember {
  projectId: string;
  projectName: string;
}

export function JoinProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [already, setAlready] = useState<AlreadyMember | null>(null);
  const [pending, setPending] = useState(false);

  function reset(): void {
    setCode("");
    setError(null);
    setAlready(null);
  }

  function close(): void {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setPending(true);
    setError(null);
    setAlready(null);
    const result = await joinProject(code);
    setPending(false);
    if (result.status === "joined") router.push(`/p/${result.projectId}`);
    else if (result.status === "already-member") setAlready({ projectId: result.projectId, projectName: result.projectName });
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
            onChange={(e) => {
              setCode(normalizeInviteCode(e.target.value));
              setAlready(null);
            }}
            className="font-mono tracking-[0.15em]"
          />
          {already && (
            <Notice tone="info">
              이미 참여 중인 프로젝트예요 · <b>{already.projectName}</b>
            </Notice>
          )}
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={close} className={buttonClass("secondary")}>
            {already ? "닫기" : "취소"}
          </button>
          {already ? (
            <Link href={`/p/${already.projectId}`} className={buttonClass("primary")}>
              프로젝트로 이동
            </Link>
          ) : (
            <button type="submit" disabled={pending || code.length !== INVITE_CODE_LENGTH} className={buttonClass("primary")}>
              {pending ? "확인 중…" : "참여하기"}
            </button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
}
