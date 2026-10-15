import type { Metadata } from "next";
import { PollDetailView } from "@/features/polls/components/PollDetailView";

export const metadata: Metadata = { title: "일정 투표" };

export default function PollDetailPage() {
  return <PollDetailView />;
}
