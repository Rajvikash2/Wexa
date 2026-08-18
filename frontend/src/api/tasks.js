// src/api/tasks.js
import client from "./client";

export const getEmployees = () => client.get("/employees").then((r) => r.data);
export const getProjects = () => client.get("/projects").then((r) => r.data);
export const getProjectTasks = (projectId) =>
  client.get(`/projects/${projectId}/tasks`).then((r) => r.data);
export const getTask = (taskId) =>
  client.get(`/tasks/${taskId}`).then((r) => r.data);
export const getDependencyChain = (taskId) =>
  client.get(`/tasks/${taskId}/dependency-chain`).then((r) => r.data);
export const getEmployeeImpact = (employeeId) =>
  client.get(`/employees/${employeeId}/impact`).then((r) => r.data);

export const createTask = (payload) =>
  client.post("/tasks", payload).then((r) => r.data);
export const reassignTask = (taskId, employeeId) =>
  client.patch(`/tasks/${taskId}/assignee`, { employeeId }).then((r) => r.data);
export const addDependency = (taskId, dependsOnId) =>
  client
    .post(`/tasks/${taskId}/dependencies`, { dependsOnId })
    .then((r) => r.data);
export const removeDependency = (taskId, dependsOnId) =>
  client
    .delete(`/tasks/${taskId}/dependencies/${dependsOnId}`)
    .then((r) => r.data);
