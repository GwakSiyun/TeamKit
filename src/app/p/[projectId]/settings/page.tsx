import type { Metadata } from "next";
import { ProjectSettingsView } from "@/features/projects/components/ProjectSettingsView";

export const metadata: Metadata = { title: "프로젝트 설정" };

export default function ProjectSettingsPage() {
  return <ProjectSettingsView />;
}
