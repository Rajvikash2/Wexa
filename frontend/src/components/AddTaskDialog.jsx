import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEmployees, createTask } from "@/api/tasks";

export default function AddTaskDialog({ open, onClose, projectId, onSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedEmployee = employees.find((e) => e.id === employeeId);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle("");
    setPriority("medium");
    setEstimatedDays("");
    setEmployeeId("");
    getEmployees().then(setEmployees);
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Give the task a title.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createTask({
        id: `t${Date.now()}`,
        title: title.trim(),
        priority,
        estimatedDays: Number(estimatedDays) || 1,
        projectId,
        employeeId: employeeId || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create this task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E293B] border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk]">New task</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-slate-500">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#0B1120] border-slate-700"
              placeholder="e.g. Write API docs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-slate-500">
              Priority
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-[#0B1120] border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-md bg-[#1E293B]/80 border-slate-700">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-slate-500">
              Estimated days
            </Label>
            <Input
              type="number"
              min="1"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              className="bg-[#0B1120] border-slate-700"
              placeholder="1"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-slate-500">
              Assign to (optional)
            </Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="w-full bg-[#0B1120] border-slate-700">
                <SelectValue placeholder="Unassigned">
                  {selectedEmployee ? selectedEmployee.name : undefined}
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

          {error && (
            <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400 cursor-pointer hover:text-slate-300">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="cursor-pointer">
            {submitting ? "Creating…" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
