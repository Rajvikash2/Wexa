import { Router } from "express";
import * as taskController from "../controllers/task.controller.js";

const router = Router();

router.get("/tasks", taskController.listTasks);
router.get("/tasks/:taskId", taskController.getTask);
router.get(
  "/tasks/:taskId/dependency-chain",
  taskController.getTaskDependencyChain,
);
router.post('/tasks', taskController.createTask);
router.get("/employees/:employeeId/impact", taskController.getEmployeeImpact);
router.get("/projects/:projectId/tasks", taskController.getProjectOverview);
router.get('/employees', taskController.listEmployees);
router.get('/projects', taskController.listProjects);
router.post('/tasks/:taskId/dependencies', taskController.addDependency);
router.delete('/tasks/:taskId/dependencies/:dependsOnId', taskController.removeDependency);
router.patch('/tasks/:taskId/assignee', taskController.reassignTask);
export default router;
