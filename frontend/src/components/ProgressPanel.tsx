import { Activity, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Card } from "./ui/Card";
export type Event = {
  phase: string;
  message: string;
  progress: number;
  agent: string;
  status: string;
};
export function ProgressPanel({ events }: { events: Event[] }) {
  const latest = events.at(-1);
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity size={18} className="text-[#52796f]" />
        <h3 className="font-bold">Live research</h3>
        {latest && (
          <span className="ml-auto text-xs text-slate-500">
            {latest.progress}%
          </span>
        )}
      </div>
      {latest && (
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#e6eee9]">
          <div
            className="h-full rounded-full bg-[#52796f] transition-all"
            style={{ width: `${latest.progress}%` }}
          />
        </div>
      )}
      <div className="space-y-3">
        {events.map((e, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <div className="mt-0.5">
              {e.status === "complete" ||
              (i < events.length - 1 && e.status !== "error") ? (
                <CheckCircle2 size={16} className="text-[#52796f]" />
              ) : e.status === "error" ? (
                <AlertTriangle size={16} className="text-red-500" />
              ) : (
                <Loader2 size={16} className="animate-spin text-[#84a98c]" />
              )}
            </div>
            <div>
              <div className="font-medium text-[#2f3e46]">{e.message}</div>
              <div className="text-xs text-slate-500">
                {e.agent.replaceAll("_", " ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
