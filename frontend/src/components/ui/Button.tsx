import { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";
export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
        variant === "primary"
          ? "bg-[#2f3e46] text-white hover:bg-[#24333a]"
          : variant === "secondary"
            ? "bg-[#cad2c5] text-[#2f3e46] hover:bg-[#b9c4b8]"
            : variant === "danger"
              ? "bg-red-50 text-red-700 hover:bg-red-100"
              : "text-[#52796f] hover:bg-[#e8efeb]",
        className,
      )}
      {...props}
    />
  );
}
