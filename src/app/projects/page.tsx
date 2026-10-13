import type { Metadata } from "next";
import { PlainLayout } from "@/components/layout/PlainLayout";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { ProjectsView } from "@/features/projects/components/ProjectsView";

export const metadata: Metadata = { title: "내 프로젝트" };

export default function ProjectsPage() {
  return (
    <PlainLayout>
      <AuthGate require="signed-in">
        <ProjectsView />
      </AuthGate>
    </PlainLayout>
  );
}
