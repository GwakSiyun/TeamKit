"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { eulReul } from "@/lib/josa";
import { deleteProject } from "../services";
import type { Project } from "../types";

/** GitHub 레포 삭제처럼 프로젝트 이름을 똑같이 입력해야 삭제 버튼이 켜진다 */
export function DeleteProjectModal({ project, open, onClose }: { project: Project; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const matches = typed === project.name;

  function close(): void {
    setTyped("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!matches) return;
    setPending(true);
    setError(null);
    const result = await deleteProject(project);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    close();
    router.replace("/projects");
  }

  return (
    <Modal open={open} onClose={close} title="프로젝트를 삭제할까요?" width={460}>
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody>
          <Notice tone="error">
            <b>{project.name}</b> 프로젝트의 할 일 · 회의록 · 일정 투표가 모두 지워지고, 팀원 {project.memberIds.length}명 모두 더 이상 들어올 수 없어요.
            {project.github && " 연결된 GitHub 레포의 웹훅도 해제돼요."} <b>되돌릴 수 없어요.</b>
          </Notice>
          <Field
            id="delete-project-confirm"
            label={`확인을 위해 프로젝트 이름 "${project.name}"${eulReul(project.name)} 입력하세요`}
            autoComplete="off"
            autoFocus
            value={typed}
            error={error}
            onChange={(e) => setTyped(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={close} className={buttonClass("secondary")}>
            취소
          </button>
          <button type="submit" disabled={!matches || pending} className={buttonClass("danger")}>
            {pending ? "삭제하는 중…" : "프로젝트 삭제"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
