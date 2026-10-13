import type { Metadata } from "next";
import { BoardView } from "@/features/tasks/components/BoardView";

export const metadata: Metadata = { title: "할 일" };

export default function BoardPage() {
  return <BoardView />;
}
