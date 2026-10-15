import type { Metadata } from "next";
import { NewMeetingView } from "@/features/meetings/components/NewMeetingView";

export const metadata: Metadata = { title: "새 회의록" };

export default function NewMeetingPage() {
  return <NewMeetingView />;
}
