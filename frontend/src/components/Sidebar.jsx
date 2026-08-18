import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getEmployees, getProjects } from "@/api/tasks";

export default function Sidebar({
  currentUserId,
  onUserChange,
  currentProjectId,
  onProjectChange,
}) {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedEmployee = employees.find((e) => e.id === currentUserId);
  const selectedProject = projects.find((p) => p.id === currentProjectId);
  useEffect(() => {
    Promise.all([getEmployees(), getProjects()])
      .then(([emps, projs]) => {
        setEmployees(emps);
        setProjects(projs);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#0B1120] p-5 flex flex-col gap-6">
      <div>
        <h1 className="font-[Space_Grotesk] text-lg font-semibold text-slate-100 tracking-tight">
          TaskGraph
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Dependency tracker</p>
      </div>

      <Separator className="bg-slate-800" />

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wide text-slate-500 font-medium">
          Signed in as
        </label>
        <Select
          value={currentUserId}
          onValueChange={onUserChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full bg-[#1E293B] border-slate-700 text-slate-200">
          <SelectValue placeholder="Select who you are">
  {selectedEmployee ? `${selectedEmployee.name} · ${selectedEmployee.role}` : undefined}
</SelectValue>
          </SelectTrigger>
          <SelectContent className="backdrop-blur-3xl w-full border-slate-700 text-slate-200">
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} · {e.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wide text-slate-500 font-medium">
          Project
        </label>
        <Select
          value={currentProjectId}
          onValueChange={onProjectChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full bg-[#1E293B] border-slate-700 text-slate-200">
           <SelectValue placeholder="Select a project">
  {selectedProject ? selectedProject.name : undefined}
</SelectValue>
          </SelectTrigger>
          <SelectContent className="w-full backdrop-blur-2xl border-slate-700 text-slate-200">
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}
