import { useState } from "react";
import { ChevronDown, ExternalLink, UserRound } from "lucide-react";
import { Solution } from "../lib/api";
import { Card } from "./ui/Card";

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="mb-1 flex justify-between text-[11px] text-slate-500">
      <span>{label}</span>
      <span>{Math.round(value)}</span>
    </div>
    <div className="h-1.5 rounded-full bg-[#e7eee9]">
      <div
        className="h-full rounded-full bg-[#52796f]"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export function SolutionCard({
  solution,
  onViewImplementations,
}: {
  solution: Solution;
  onViewImplementations?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#84a98c]">
              Solution
            </div>
            <h3 className="text-lg font-bold text-[#2f3e46]">
              {solution.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {solution.description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="rounded-xl bg-[#eef4f0] px-3 py-2 text-center">
              <div className="text-lg font-bold text-[#2f3e46]">
                {solution.overall_score || 0}
              </div>
              <div className="text-[10px] uppercase text-slate-500">score</div>
            </div>
            <ChevronDown
              size={18}
              className={open ? "rotate-180 transition" : "transition"}
            />
          </div>
        </div>
      </button>
      {open && (
        <div className="border-t border-[#e4ebe7] p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric
              label="Observed success"
              value={solution.scores?.success_evidence || 0}
            />
            <Metric
              label="Practicality"
              value={solution.scores?.practicality || 0}
            />
            <Metric
              label="Budget fit"
              value={solution.scores?.budget_fit || 0}
            />
            <Metric
              label="Similarity"
              value={solution.scores?.similarity || 0}
            />
            <Metric
              label="Evidence"
              value={solution.scores?.evidence_quality || 0}
            />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 font-semibold">Comparable implementations</h4>
              <div className="space-y-3">
                <button
                  onClick={onViewImplementations}
                  disabled={
                    !solution.implementations ||
                    solution.implementations.length === 0
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-[#e1e9e4] bg-[#f7faf8] p-4 text-left font-semibold transition hover:bg-[#eef4f0] disabled:opacity-50"
                >
                  <span>
                    View {solution.implementations?.length || 0} implementation
                    {(solution.implementations?.length || 0) !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[#52796f]">→</span>
                </button>
              </div>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">Budget & evidence</h4>
              <div className="rounded-xl bg-[#f5f8f6] p-4">
                <div className="text-2xl font-bold text-[#2f3e46]">
                  ${solution.estimated_budget?.min?.toLocaleString()} – $
                  {solution.estimated_budget?.max?.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">
                  estimated implementation range
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
