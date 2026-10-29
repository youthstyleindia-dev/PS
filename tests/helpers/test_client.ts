import request, { SuperTest, Test } from 'supertest';
import type { Express } from 'express';
import { createContractApp } from '../fixtures/contract_app';
import { createTestDb } from '../fixtures/test_db';
import Database from 'better-sqlite3';

let sharedApp: Express | null = null;
let sharedDb: Database.Database | null = null;

export async function getTestApp(): Promise<Express> {
  if (sharedApp) return sharedApp;

  // 1. Try to load production app if implemented
  try {
    const prodAppMod = await import('../../server/src/app.js');
    if (prodAppMod.app || prodAppMod.default) {
      sharedApp = prodAppMod.app || prodAppMod.default;
      return sharedApp!;
    }
  } catch {
    // Fall back to contract test app
  }

  sharedDb = createTestDb(true);
  sharedApp = createContractApp(sharedDb);
  return sharedApp;
}

export async function getTestClient(): Promise<SuperTest<Test>> {
  const app = await getTestApp();
  return request(app);
}

export function resetTestDb(): Database.Database {
  sharedDb = createTestDb(true);
  sharedApp = createContractApp(sharedDb);
  return sharedDb;
}
