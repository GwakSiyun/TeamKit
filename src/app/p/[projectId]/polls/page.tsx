import type { Metadata } from "next";
import { PollsView } from "@/features/polls/components/PollsView";

export const metadata: Metadata = { title: "일정 맞추기" };

export default function PollsPage() {
  return <PollsView />;
}
