"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { createProject } from "../services";

const NAME_MAX = 40;

export function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function close(): void {
    setName("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("프로젝트 이름을 입력해주세요.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await createProject(trimmed);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    // 모달을 닫고 입력값을 비운 뒤 이동 → 뒤로가기로 돌아와도 모달이 열려 있지 않다
    close();
    router.push(`/p/${result.projectId}`);
  }

  return (
    <Modal open={open} onClose={close} title="새 프로젝트" width={460}>
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody>
          <Field
            id="new-project-name"
            label="프로젝트 이름"
            placeholder="예) 쇼핑몰 클론"
            maxLength={NAME_MAX}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error ? <Notice tone="error">{error}</Notice> : <Notice tone="info">만들면 6자리 초대 코드가 생겨요. 팀원에게 공유하세요.</Notice>}
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={close} className={buttonClass("secondary")}>
            취소
          </button>
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? "만드는 중…" : "만들기"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
