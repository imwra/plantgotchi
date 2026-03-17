/**
 * Setup file for auth tests: runs Better Auth migrations on the in-memory DB
 * so that auth.api.getSession works without a real database.
 */
import { getMigrations } from "better-auth/db/migration";
import { auth } from "../../src/lib/auth";

const { runMigrations } = await getMigrations(auth.options);
await runMigrations();
