import type { Metadata } from "next";
import { MeetingsView } from "@/features/meetings/components/MeetingsView";

export const metadata: Metadata = { title: "회의록" };

export default function MeetingsPage() {
  return <MeetingsView />;
}
