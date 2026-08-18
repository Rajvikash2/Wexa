const STATUS_DOT = {
  done: "bg-cyan-400",
  in_progress: "bg-amber-400",
  todo: "bg-slate-500",
  blocked: "bg-red-500",
};

export default function DependencyNode({ task, onClick, muted = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md border border-slate-700 bg-[#1E293B] hover:border-cyan-400/50 transition-colors
        ${muted ? "opacity-70" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[task.status] || "bg-slate-500"}`}
        />
        <span className="text-sm text-slate-200 truncate">{task.title}</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-0.5 font-[JetBrains_Mono] pl-4">
        {task.id}
      </p>
    </button>
  );
}
