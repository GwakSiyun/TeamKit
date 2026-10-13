import type { Metadata } from "next";
import { PlainLayout } from "@/components/layout/PlainLayout";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { ProjectHome } from "@/features/projects/components/ProjectHome";

export const metadata: Metadata = { title: "프로젝트" };

// 프로젝트 데이터는 브라우저에서 Firestore 규칙(멤버만 읽기)을 거쳐 읽는다. projectId 는 ProjectHome 이 useParams 로 읽는다.
export default function ProjectPage() {
  return (
    <PlainLayout>
      <AuthGate require="signed-in">
        <ProjectHome />
      </AuthGate>
    </PlainLayout>
  );
}
