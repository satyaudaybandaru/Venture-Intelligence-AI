import { ReactNode } from "react";
import { X } from "lucide-react";
import { Card } from "./ui/Card";
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172a24]/35 p-4">
      <Card className="w-full max-w-lg p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2f3e46]">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}
