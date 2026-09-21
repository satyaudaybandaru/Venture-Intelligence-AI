import { ReactNode } from "react";
import { cn } from "./cn";
export function Card({
  children,
  className = "",
  ...p
}: {
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#dbe5df] bg-white shadow-[0_8px_30px_rgba(47,62,70,.05)]",
        className,
      )}
      {...p}
    >
      {children}
    </div>
  );
}
