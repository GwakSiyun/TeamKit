import type { Metadata } from "next";
import { GithubView } from "@/features/github/components/GithubView";

export const metadata: Metadata = { title: "GitHub 연동" };

export default function GithubPage() {
  return <GithubView />;
}
