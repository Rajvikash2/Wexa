// src/components/AddDependencyDialog.jsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProjectTasks, addDependency } from "@/api/tasks";

export default function AddDependencyDialog({
  open,
  onClose,
  taskId,
  projectId,
  onSuccess,
}) {
  const [tasks, setTasks] = useState([]);
  const [selectedDepId, setSelectedDepId] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedDepId("");
    getProjectTasks(projectId).then(setTasks);
  }, [open, projectId]);

  const handleSubmit = async () => {
    if (!selectedDepId) return;
    setSubmitting(true);
    setError(null);
    try {
      await addDependency(taskId, selectedDepId);
      onSuccess();
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.error || "Could not add this dependency.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const options = tasks.filter((t) => t.id !== taskId);
  const selectedTask = options.find((t) => t.id === selectedDepId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E293B] border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk]">
            Add dependency
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <label className="text-xs uppercase tracking-wide text-slate-500 font-medium">
            This task depends on
          </label>
          <Select value={selectedDepId} onValueChange={setSelectedDepId}>
            <SelectTrigger className="w-full bg-[#0B1120] border-slate-700">
              <SelectValue placeholder="Select a task">
                {selectedTask ? selectedTask.title : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="backdrop-blur-3xl border-slate-700 text-slate-200">
              {options.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {error && (
            <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDepId || submitting}
          >
            {submitting ? "Adding…" : "Add dependency"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}