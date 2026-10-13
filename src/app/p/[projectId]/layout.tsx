import type { ReactNode } from "react";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { ProjectShell } from "@/features/projects/components/shell/ProjectShell";

// 멤버 확인은 브라우저에서 Firestore 규칙(멤버만 읽기)을 거쳐 ProjectShell 이 한다.
export default function ProjectLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate require="signed-in">
      <ProjectShell>{children}</ProjectShell>
    </AuthGate>
  );
}
