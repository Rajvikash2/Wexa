import { Skeleton } from "@/components/ui/skeleton";
import TaskCard from "./TaskCard";

export default function TaskList({
  tasks,
  loading,
  selectedTaskId,
  onSelectTask,
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-slate-800" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-slate-400 text-sm">No tasks in this project yet.</p>
        <p className="text-slate-600 text-xs mt-1">
          Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isSelected={task.id === selectedTaskId}
          onClick={() => onSelectTask(task.id)}
        />
      ))}
    </div>
  );
}
