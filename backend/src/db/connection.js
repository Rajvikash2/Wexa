import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const { COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD } = process.env;

if (!COGNODB_URI || !COGNODB_USER || !COGNODB_PASSWORD) {
  console.error('Missing env vars');
}

let driver;

export function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      COGNODB_URI,
      neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD),
      { maxConnectionPoolSize: 20 }
    );
  }
  return driver;
}

export async function runQuery(cypher, params = {}) {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } catch (err) {
    console.error('[db] Query failed:', err.message);
    throw new Error('DATABASE_UNAVAILABLE');
  } finally {
    await session.close();
  }
}

export async function verifyConnection() {
  try {
    await getDriver().verifyConnectivity();
    console.log('[db] Connected to CognoDB');
    return true;
  } catch (err) {
    console.error('[db] Could not connect to CognoDB:', err.message);
    return false;
  }
}

export async function closeDriver() {
  if (driver) await driver.close();
}