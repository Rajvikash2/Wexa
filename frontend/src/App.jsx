import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TaskList from "@/components/TaskList";
import DependencyPanel from "@/components/DependencyPanel";
import AddTaskDialog from "@/components/AddTaskDialog";
import AddDependencyDialog from "@/components/AddDependencyDialog";
import { Button } from "@/components/ui/button";
import { getProjectTasks } from "@/api/tasks";

function App() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addDepFor, setAddDepFor] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
  const visibleTasks = showMyTasksOnly
    ? tasks.filter((t) => t.assigneeId === currentUserId)
    : tasks;
  useEffect(() => {
    if (!currentProjectId) {
      setTasks([]);
      return;
    }
    setTasksLoading(true);
    getProjectTasks(currentProjectId)
      .then(setTasks)
      .finally(() => setTasksLoading(false));
  }, [currentProjectId, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-100 font-[Inter]">
      <Sidebar
        currentUserId={currentUserId}
        onUserChange={setCurrentUserId}
        currentProjectId={currentProjectId}
        onProjectChange={setCurrentProjectId}
      />

      <main className="flex-1 flex overflow-hidden">
        <section className="flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-[Space_Grotesk] text-xl font-semibold text-slate-100">
                Tasks
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Select a task to view its dependency chain
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentUserId && (
                <Button
                  variant={showMyTasksOnly ? "default" : "outline"}
                  onClick={() => setShowMyTasksOnly((v) => !v)}
                  className={
                    showMyTasksOnly ? "" : "border-slate-700 text-slate-300"
                  }
                >
                  My tasks
                </Button>
              )}
              {currentProjectId && (
                <Button onClick={() => setAddTaskOpen(true)}>New task</Button>
              )}
            </div>
          </div>

          {!currentProjectId ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-slate-400 text-sm">No project selected.</p>
              <p className="text-slate-600 text-xs mt-1">
                Pick a project from the sidebar to see its tasks.
              </p>
            </div>
          ) : (
            <TaskList
              tasks={visibleTasks}
              loading={tasksLoading}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          )}
        </section>

        {selectedTaskId && (
          <aside className="w-96 shrink-0 border-l border-slate-800 bg-[#0B1120] p-6 overflow-y-auto">
            <DependencyPanel
              key={refreshKey}
              taskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onAddDependencyClick={setAddDepFor}
              onClose={() => setSelectedTaskId(null)}
            />
          </aside>
        )}
      </main>

      <AddTaskDialog
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        projectId={currentProjectId}
        onSuccess={refresh}
      />

      <AddDependencyDialog
        open={!!addDepFor}
        onClose={() => setAddDepFor(null)}
        taskId={addDepFor}
        projectId={currentProjectId}
        onSuccess={refresh}
      />
    </div>
  );
}

export default App;
