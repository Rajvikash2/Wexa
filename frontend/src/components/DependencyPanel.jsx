// src/components/DependencyPanel.jsx
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import DependencyNode from "./DependencyNode";
import {
  getTask,
  getDependencyChain,
  removeDependency,
  reassignTask,
  getEmployees,
} from "@/api/tasks";

export default function DependencyPanel({
  taskId,
  onSelectTask,
  onAddDependencyClick,
  onClose,
}) {
  const [task, setTask] = useState(null);
  const [chain, setChain] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reassigning, setReassigning] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([getTask(taskId), getDependencyChain(taskId), getEmployees()])
      .then(([t, c, emps]) => {
        setTask(t);
        setChain(c);
        setEmployees(emps);
      })
      .catch(() =>
        setError("Could not load this task. The database may be unreachable."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, [taskId]);

  const handleReassign = async (employeeId) => {
    setReassigning(true);
    try {
      const updated = await reassignTask(taskId, employeeId);
      setTask(updated);
    } catch {
      setError("Could not reassign this task.");
    } finally {
      setReassigning(false);
    }
  };

  const currentAssignee = employees.find((e) => e.id === task?.assignee?.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          {!loading && !error && (
            <>
              <h3 className="font-[Space_Grotesk] text-base font-semibold text-slate-100">
                {task.title}
              </h3>
              <p className="text-xs text-slate-500 font-[JetBrains_Mono] mt-0.5">
                {task.id}
              </p>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full bg-slate-800" />
          <Skeleton className="h-16 w-full bg-slate-800" />
          <Skeleton className="h-16 w-full bg-slate-800" />
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-2">
              Waiting on{" "}
              {chain.dependsOn.length > 0 ? `(${chain.dependsOn.length})` : ""}
            </p>
            {chain.dependsOn.length === 0 ? (
              <p className="text-xs text-slate-600 italic">
                Nothing — ready to start.
              </p>
            ) : (
              <div className="flex flex-col gap-2 relative pl-3 border-l border-slate-700">
                {chain.dependsOn.map((dep) => (
                  <DependencyNode
                    key={dep.id}
                    task={dep}
                    onClick={() => onSelectTask(dep.id)}
                    muted
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border border-cyan-400/40 bg-cyan-400/5 px-3 py-2.5 flex flex-col gap-2.5">
            <div>
              <p className="text-sm font-medium text-cyan-300">{task.title}</p>
              <p className="text-[11px] text-slate-500 font-[JetBrains_Mono] mt-0.5">
                {task.status} · {task.priority} priority
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">
                Assigned to
              </label>
              <Select
                value={task.assignee?.id || ""}
                onValueChange={handleReassign}
                disabled={reassigning}
              >
                <SelectTrigger className="bg-[#0B1120] border-slate-700 h-8 text-sm">
                  <SelectValue placeholder="Unassigned">
                    {currentAssignee
                      ? currentAssignee.name
                      : (task.assignee?.name ?? undefined)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="backdrop-blur-3xl w-full border-slate-700 text-slate-200">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-2">
              Blocks {chain.blocks.length > 0 ? `(${chain.blocks.length})` : ""}
            </p>
            {chain.blocks.length === 0 ? (
              <p className="text-xs text-slate-600 italic">
                Nothing depends on this yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2 relative pl-3 border-l border-slate-700">
                {chain.blocks.map((dep) => (
                  <DependencyNode
                    key={dep.id}
                    task={dep}
                    onClick={() => onSelectTask(dep.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => onAddDependencyClick(taskId)}
          >
            Add dependency
          </Button>
        </>
      )}
    </div>
  );
}
