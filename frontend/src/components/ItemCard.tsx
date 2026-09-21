import { Play, Trash2, ArrowUpRight } from "lucide-react";
import { Item } from "../lib/api";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
export function ItemCard({
  item,
  kind,
  onResearch,
  onDelete,
  onOpen,
}: {
  item: Item;
  kind: "hurdles" | "visions";
  onResearch: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef4f0] text-sm font-bold text-[#52796f]">
          {String(item.priority).padStart(2, "0")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#2f3e46]">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
            <span className="rounded-full bg-[#f0f5f2] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#52796f]">
              {item.status}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onResearch}>
              <Play size={14} />
              Research
            </Button>
            <Button variant="ghost" onClick={onOpen}>
              <ArrowUpRight size={14} />
              View
            </Button>
            <Button variant="ghost" onClick={onDelete}>
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
