import type { Metadata } from "next";
import { MeetingDetailView } from "@/features/meetings/components/MeetingDetailView";

export const metadata: Metadata = { title: "회의록" };

export default function MeetingDetailPage() {
  return <MeetingDetailView />;
}
