import { runQuery } from "../db/connection.js";
import { NotFoundError, DatabaseUnavailableError, BadRequestError } from "../errors/AppError.js";

async function safeQuery(cypher, params) {
  try {
    return await runQuery(cypher, params);
  } catch (err) {
    if (err.message === "DATABASE_UNAVAILABLE") {
      throw new DatabaseUnavailableError();
    }
    throw err;
  }
}

export async function getAllTasks() {
  const records = await safeQuery(
    `MATCH (t:Task)-[:BELONGS_TO]->(p:Project)
     OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(e:Employee)
     RETURN t, p.name AS projectName, e.name AS assigneeName
     ORDER BY t.title`,
  );

  return records.map((r) => ({
    ...r.get("t").properties,
    projectName: r.get("projectName"),
    assigneeName: r.get("assigneeName"),
  }));
}

export async function getTaskById(taskId) {
  const records = await safeQuery(
    `MATCH (t:Task {id: $taskId})-[:BELONGS_TO]->(p:Project)
     OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(e:Employee)
     RETURN t, p.name AS projectName, e AS assignee`,
    { taskId },
  );

  if (records.length === 0) {
    throw new NotFoundError(`Task ${taskId} not found`);
  }

  const record = records[0];
  return {
    ...record.get("t").properties,
    projectName: record.get("projectName"),
    assignee: record.get("assignee")?.properties ?? null,
  };
}

// Multi-hop traversal: every task that is transitively blocked by taskId,
// i.e. all tasks reachable by walking DEPENDS_ON edges back to this task.
export async function getDependencyChain(taskId) {
  const exists = await safeQuery(`MATCH (t:Task {id: $taskId}) RETURN t`, {
    taskId,
  });
  if (exists.length === 0) {
    throw new NotFoundError(`Task ${taskId} not found`);
  }

  // Tasks this task directly/transitively depends ON (upstream — must finish first)
  const upstream = await safeQuery(
    `MATCH (t:Task {id: $taskId})-[:DEPENDS_ON*1..10]->(dep:Task)
     RETURN DISTINCT dep`,
    { taskId },
  );

  // Tasks that are blocked BY this task (downstream — waiting on this one)
  const downstream = await safeQuery(
    `MATCH (blocked:Task)-[:DEPENDS_ON*1..10]->(t:Task {id: $taskId})
     RETURN DISTINCT blocked`,
    { taskId },
  );

  return {
    taskId,
    dependsOn: upstream.map((r) => r.get("dep").properties),
    blocks: downstream.map((r) => r.get("blocked").properties),
  };
}

// Everything an employee is on the hook for, and what would be affected
// transitively if their tasks slipped.
export async function getEmployeeImpact(employeeId) {
  const exists = await safeQuery(
    `MATCH (e:Employee {id: $employeeId}) RETURN e`,
    { employeeId },
  );
  if (exists.length === 0) {
    throw new NotFoundError(`Employee ${employeeId} not found`);
  }

  const records = await safeQuery(
    `MATCH (e:Employee {id: $employeeId})<-[:ASSIGNED_TO]-(t:Task)
     OPTIONAL MATCH (blocked:Task)-[:DEPENDS_ON*1..10]->(t)
     RETURN t, collect(DISTINCT blocked) AS blockedTasks`,
    { employeeId },
  );

  return records.map((r) => ({
    task: r.get("t").properties,
    blockedTasks: r.get("blockedTasks").map((b) => b.properties),
  }));
}

export async function getProjectOverview(projectId) {
  const exists = await safeQuery(`MATCH (p:Project {id: $projectId}) RETURN p`, { projectId });
  if (exists.length === 0) {
    throw new NotFoundError(`Project ${projectId} not found`);
  }

  const records = await safeQuery(
    `MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(t:Task)
     OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(e:Employee)
     RETURN t, e.id AS assigneeId, e.name AS assigneeName
     ORDER BY t.title`,
    { projectId }
  );

  return records.map((r) => ({
    ...r.get('t').properties,
    assigneeId: r.get('assigneeId'),
    assigneeName: r.get('assigneeName'),
  }));
}

export async function getAllEmployees() {
  const records = await safeQuery(
    `MATCH (e:Employee) RETURN e ORDER BY e.name`,
  );
  return records.map((r) => r.get("e").properties);
}

export async function getAllProjects() {
  const records = await safeQuery(`MATCH (p:Project) RETURN p ORDER BY p.name`);
  return records.map((r) => r.get("p").properties);
}

export async function createTask({
  id,
  title,
  priority,
  estimatedDays,
  projectId,
  employeeId,
}) {
  const projectExists = await safeQuery(
    `MATCH (p:Project {id: $projectId}) RETURN p`,
    { projectId },
  );
  if (projectExists.length === 0) {
    throw new NotFoundError(`Project ${projectId} not found`);
  }

  if (employeeId) {
    const employeeExists = await safeQuery(
      `MATCH (e:Employee {id: $employeeId}) RETURN e`,
      { employeeId },
    );
    if (employeeExists.length === 0) {
      throw new NotFoundError(`Employee ${employeeId} not found`);
    }
  }

  await safeQuery(
    `CREATE (t:Task {id: $id, title: $title, status: 'todo', priority: $priority, estimated_days: $estimatedDays})
     WITH t
     MATCH (p:Project {id: $projectId})
     CREATE (t)-[:BELONGS_TO]->(p)`,
    { id, title, priority, estimatedDays, projectId },
  );

  if (employeeId) {
    await safeQuery(
      `MATCH (t:Task {id: $id}), (e:Employee {id: $employeeId})
       CREATE (t)-[:ASSIGNED_TO]->(e)`,
      { id, employeeId },
    );
  }

  return getTaskById(id);
}

export async function addDependency(taskId, dependsOnId) {
  if (taskId === dependsOnId) {
    throw new BadRequestError("A task cannot depend on itself");
  }

  const [taskExists, depExists] = await Promise.all([
    safeQuery(`MATCH (t:Task {id: $taskId}) RETURN t`, { taskId }),
    safeQuery(`MATCH (t:Task {id: $dependsOnId}) RETURN t`, { dependsOnId }),
  ]);
  if (taskExists.length === 0)
    throw new NotFoundError(`Task ${taskId} not found`);
  if (depExists.length === 0)
    throw new NotFoundError(`Task ${dependsOnId} not found`);

  // Cycle check
  const cycleCheck = await safeQuery(
    `MATCH (b:Task {id: $dependsOnId})-[:DEPENDS_ON*1..20]->(a:Task {id: $taskId})
     RETURN count(*) > 0 AS wouldCreateCycle`,
    { taskId, dependsOnId },
  );
  if (cycleCheck[0].get("wouldCreateCycle")) {
    throw new BadRequestError(
      `Cannot add dependency: ${taskId} -> ${dependsOnId} would create a circular dependency`,
    );
  }

  // Avoid duplicate edges
  const alreadyExists = await safeQuery(
    `MATCH (a:Task {id: $taskId})-[:DEPENDS_ON]->(b:Task {id: $dependsOnId}) RETURN a`,
    { taskId, dependsOnId },
  );
  if (alreadyExists.length > 0) {
    throw new BadRequestError("This dependency already exists");
  }

  await safeQuery(
    `MATCH (a:Task {id: $taskId}), (b:Task {id: $dependsOnId})
     CREATE (a)-[:DEPENDS_ON]->(b)`,
    { taskId, dependsOnId },
  );

  return getDependencyChain(taskId);
}

export async function removeDependency(taskId, dependsOnId) {
  const result = await safeQuery(
    `MATCH (a:Task {id: $taskId})-[r:DEPENDS_ON]->(b:Task {id: $dependsOnId})
     DELETE r
     RETURN count(r) AS deletedCount`,
    { taskId, dependsOnId },
  );

  if (result[0].get("deletedCount").toNumber() === 0) {
    throw new NotFoundError(
      `No dependency found from ${taskId} to ${dependsOnId}`,
    );
  }

  return getDependencyChain(taskId);
}
export async function reassignTask(taskId, employeeId) {
  const taskExists = await safeQuery(`MATCH (t:Task {id: $taskId}) RETURN t`, { taskId });
  if (taskExists.length === 0) throw new NotFoundError(`Task ${taskId} not found`);

  const empExists = await safeQuery(`MATCH (e:Employee {id: $employeeId}) RETURN e`, { employeeId });
  if (empExists.length === 0) throw new NotFoundError(`Employee ${employeeId} not found`);

  await safeQuery(
    `MATCH (t:Task {id: $taskId})-[r:ASSIGNED_TO]->(:Employee)
     DELETE r`,
    { taskId }
  );

  await safeQuery(
    `MATCH (t:Task {id: $taskId}), (e:Employee {id: $employeeId})
     CREATE (t)-[:ASSIGNED_TO]->(e)`,
    { taskId, employeeId }
  );

  return getTaskById(taskId);
}