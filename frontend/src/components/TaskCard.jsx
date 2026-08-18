import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  done: "border-l-cyan-400",
  in_progress: "border-l-amber-400",
  todo: "border-l-slate-500",
  blocked: "border-l-red-500",
};

const PRIORITY_VARIANT = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export default function TaskCard({ task, onClick, isSelected }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded-md border-l-4 bg-[#1E293B] hover:bg-[#243247] transition-colors
        ${STATUS_COLORS[task.status] || "border-l-slate-500"}
        ${isSelected ? "ring-1 ring-cyan-400" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-100">{task.title}</p>
          <p className="text-xs text-slate-500 mt-1 font-[JetBrains_Mono]">
            {task.id} · {task.assigneeName || "Unassigned"}
          </p>
        </div>
        <Badge variant="outline" className={PRIORITY_VARIANT[task.priority]}>
          {task.priority}
        </Badge>
      </div>
    </button>
  );
}
