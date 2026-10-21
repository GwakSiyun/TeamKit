import { APP_NAME } from "@/constants/app";
import { LogoMark } from "./LogoMark";

export function BrandMark() {
  return (
    <span className="flex items-center gap-2 font-bold">
      <LogoMark size={24} />
      {APP_NAME}
    </span>
  );
}
