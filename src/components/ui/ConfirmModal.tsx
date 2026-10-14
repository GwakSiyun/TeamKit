'use client';

import { useState, type ReactNode } from 'react';
import { buttonClass } from './button';
import { Modal, ModalBody, ModalFooter } from './Modal';
import { Notice } from './Notice';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  /** 실패하면 메시지를 돌려준다 (모달 안에 표시) */
  onConfirm: () => Promise<string | null>;
  tone?: 'danger' | 'primary';
}

/**
 * "정말 ~할까요?" 공통 확인 창. 다른 모달 위에 겹쳐 띄워도 된다(<dialog> 최상위 레이어).
 * 원래 화면의 버튼 위치는 바뀌지 않는다.
 */
export function ConfirmModal({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
  tone = 'danger',
}: ConfirmModalProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close(): void {
    setError(null);
    onClose();
  }

  async function handleConfirm(): Promise<void> {
    setPending(true);
    setError(null);
    const message = await onConfirm();
    setPending(false);
    if (message) setError(message);
    else close();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      width={400}
      hideCloseButton
    >
      <ModalBody>
        {children && (
          <div className="text-center leading-relaxed break-keep text-balance text-sub">
            {children}
          </div>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={close}
          className={buttonClass('secondary')}
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className={buttonClass(tone)}
        >
          {pending ? '처리 중…' : confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}
