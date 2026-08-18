import { BadRequestError } from "../errors/AppError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as taskService from "../service/task.service.js";

export const listTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getAllTasks();
  res.json(tasks);
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.taskId);
  res.json(task);
});

export const getTaskDependencyChain = asyncHandler(async (req, res) => {
  const chain = await taskService.getDependencyChain(req.params.taskId);
  res.json(chain);
});

export const getEmployeeImpact = asyncHandler(async (req, res) => {
  const impact = await taskService.getEmployeeImpact(req.params.employeeId);
  res.json(impact);
});

export const getProjectOverview = asyncHandler(async (req, res) => {
  const tasks = await taskService.getProjectOverview(req.params.projectId);
  res.json(tasks);
});

export const listEmployees = asyncHandler(async (req, res) => {
  const employees = await taskService.getAllEmployees();
  res.json(employees);
});

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await taskService.getAllProjects();
  res.json(projects);
});

export const createTask = asyncHandler(async (req, res) => {
  const { id, title, priority, estimatedDays, projectId, employeeId } =
    req.body;

  if (!id || !title || !projectId) {
    throw new BadRequestError("id, title, and projectId are required");
  }

  const task = await taskService.createTask({
    id,
    title,
    priority,
    estimatedDays,
    projectId,
    employeeId,
  });
  res.status(201).json(task);
});
export const addDependency = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { dependsOnId } = req.body;

  if (!dependsOnId) {
    throw new BadRequestError('dependsOnId is required');
  }

  const chain = await taskService.addDependency(taskId, dependsOnId);
  res.status(201).json(chain);
});

export const removeDependency = asyncHandler(async (req, res) => {
  const { taskId, dependsOnId } = req.params;
  const chain = await taskService.removeDependency(taskId, dependsOnId);
  res.json(chain);
});
export const reassignTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { employeeId } = req.body;

  if (!employeeId) {
    throw new BadRequestError('employeeId is required');
  }

  const task = await taskService.reassignTask(taskId, employeeId);
  res.json(task);
});