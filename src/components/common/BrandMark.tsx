import { APP_NAME } from "@/constants/app";

export function BrandMark() {
  return (
    <span className="flex items-center gap-2 font-bold">
      <span className="inline-flex size-6 items-center justify-center rounded-md bg-ink text-[13px] text-white">
        {APP_NAME[0]}
      </span>
      {APP_NAME}
    </span>
  );
}
