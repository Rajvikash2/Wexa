// backend/src/scripts/seed.js
import { getDriver, closeDriver } from "../db/connection.js";

async function seed() {
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log("Clearing existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Creating employees...");
    await session.run(
      `
      UNWIND $employees AS emp
      CREATE (e:Employee {id: emp.id, name: emp.name, role: emp.role, email: emp.email})
    `,
      {
        employees: [
          {
            id: "e1",
            name: "Riya Nair",
            role: "Backend Engineer",
            email: "riya@taskgraph.io",
          },
          {
            id: "e2",
            name: "Arjun Mehta",
            role: "Frontend Engineer",
            email: "arjun@taskgraph.io",
          },
          {
            id: "e3",
            name: "Sneha Kapoor",
            role: "PM",
            email: "sneha@taskgraph.io",
          },
          {
            id: "e4",
            name: "Karan Bose",
            role: "DevOps Engineer",
            email: "karan@taskgraph.io",
          },
          {
            id: "e5",
            name: "Divya Rao",
            role: "QA Engineer",
            email: "divya@taskgraph.io",
          },
        ],
      },
    );

    console.log("Creating projects...");
    await session.run(
      `
      UNWIND $projects AS proj
      CREATE (p:Project {id: proj.id, name: proj.name, status: proj.status, deadline: proj.deadline})
    `,
      {
        projects: [
          {
            id: "p1",
            name: "Checkout Revamp",
            status: "active",
            deadline: "2026-09-30",
          },
          {
            id: "p2",
            name: "Internal Analytics Dashboard",
            status: "active",
            deadline: "2026-10-15",
          },
        ],
      },
    );

    console.log("Linking employees to projects (WORKS_ON)...");
    await session.run(
      `
      UNWIND $links AS link
      MATCH (e:Employee {id: link.empId}), (p:Project {id: link.projId})
      CREATE (e)-[:WORKS_ON]->(p)
    `,
      {
        links: [
          { empId: "e1", projId: "p1" },
          { empId: "e2", projId: "p1" },
          { empId: "e3", projId: "p1" },
          { empId: "e3", projId: "p2" },
          { empId: "e4", projId: "p2" },
          { empId: "e5", projId: "p1" },
        ],
      },
    );

    console.log("Creating tasks...");
    await session.run(
      `
      UNWIND $tasks AS t
      CREATE (task:Task {id: t.id, title: t.title, status: t.status, priority: t.priority, estimated_days: t.days})
    `,
      {
        tasks: [
          {
            id: "t1",
            title: "Design DB schema",
            status: "done",
            priority: "high",
            days: 2,
          },
          {
            id: "t2",
            title: "Build payment API",
            status: "in_progress",
            priority: "high",
            days: 5,
          },
          {
            id: "t3",
            title: "Build checkout UI",
            status: "todo",
            priority: "high",
            days: 4,
          },
          {
            id: "t4",
            title: "Integrate payment gateway",
            status: "todo",
            priority: "high",
            days: 3,
          },
          {
            id: "t5",
            title: "Write checkout tests",
            status: "todo",
            priority: "medium",
            days: 2,
          },
          {
            id: "t6",
            title: "Deploy to staging",
            status: "todo",
            priority: "medium",
            days: 1,
          },
          {
            id: "t7",
            title: "Set up CI pipeline",
            status: "in_progress",
            priority: "medium",
            days: 2,
          },
          {
            id: "t8",
            title: "Provision staging server",
            status: "done",
            priority: "high",
            days: 1,
          },
          {
            id: "t9",
            title: "Design analytics schema",
            status: "todo",
            priority: "medium",
            days: 2,
          },
          {
            id: "t10",
            title: "Build analytics API",
            status: "todo",
            priority: "medium",
            days: 4,
          },
        ],
      },
    );

    console.log("Linking tasks to projects (BELONGS_TO)...");
    await session.run(
      `
      UNWIND $links AS link
      MATCH (t:Task {id: link.taskId}), (p:Project {id: link.projId})
      CREATE (t)-[:BELONGS_TO]->(p)
    `,
      {
        links: [
          { taskId: "t1", projId: "p1" },
          { taskId: "t2", projId: "p1" },
          { taskId: "t3", projId: "p1" },
          { taskId: "t4", projId: "p1" },
          { taskId: "t5", projId: "p1" },
          { taskId: "t6", projId: "p1" },
          { taskId: "t7", projId: "p1" },
          { taskId: "t8", projId: "p1" },
          { taskId: "t9", projId: "p2" },
          { taskId: "t10", projId: "p2" },
        ],
      },
    );

    console.log("Assigning tasks to employees (ASSIGNED_TO)...");
    await session.run(
      `
      UNWIND $links AS link
      MATCH (t:Task {id: link.taskId}), (e:Employee {id: link.empId})
      CREATE (t)-[:ASSIGNED_TO]->(e)
    `,
      {
        links: [
          { taskId: "t1", empId: "e1" },
          { taskId: "t2", empId: "e1" },
          { taskId: "t3", empId: "e2" },
          { taskId: "t4", empId: "e1" },
          { taskId: "t5", empId: "e5" },
          { taskId: "t6", empId: "e4" },
          { taskId: "t7", empId: "e4" },
          { taskId: "t8", empId: "e4" },
          { taskId: "t9", empId: "e3" },
          { taskId: "t10", empId: "e3" },
        ],
      },
    );

    console.log("Creating dependencies (DEPENDS_ON)...");
    // t3 (checkout UI) depends on t1 (schema) -> depends chain
    // t4 (integrate gateway) depends on t2 (payment API) which depends on t1
    // t5 (tests) depends on t3 AND t4 -> multi-hop convergence
    // t6 (deploy) depends on t5 and t7 (CI pipeline) which depends on t8 (server)
    // This gives a 3-hop chain: t6 -> t5 -> t3 -> t1, and t6 -> t7 -> t8
    await session.run(
      `
      UNWIND $deps AS dep
      MATCH (a:Task {id: dep.from}), (b:Task {id: dep.to})
      CREATE (a)-[:DEPENDS_ON]->(b)
    `,
      {
        deps: [
          { from: "t3", to: "t1" },
          { from: "t2", to: "t1" },
          { from: "t4", to: "t2" },
          { from: "t5", to: "t3" },
          { from: "t5", to: "t4" },
          { from: "t7", to: "t8" },
          { from: "t6", to: "t5" },
          { from: "t6", to: "t7" },
          { from: "t10", to: "t9" },
        ],
      },
    );

    console.log("Seed complete.");
  } finally {
    await session.close();
    await closeDriver();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
