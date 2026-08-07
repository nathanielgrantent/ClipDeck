#!/usr/bin/env node
/**
 * Generates prisma/schema.postgres.prisma from prisma/schema.prisma.
 * The model definitions are identical (String-based); only the datasource
 * block differs, so the same generated client types are used in dev (SQLite)
 * and production (PostgreSQL).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const webPrisma = path.join(root, 'apps', 'web', 'prisma');
const schemaPath = path.join(webPrisma, 'schema.prisma');
const outPath = path.join(webPrisma, 'schema.postgres.prisma');

let content = fs.readFileSync(schemaPath, 'utf8');

const ds = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;

content = content.replace(/datasource db \{[\s\S]*?\n\}\n/, ds + '\n');

fs.writeFileSync(outPath, content);
console.log(`[gen-postgres-schema] wrote ${outPath}`);
