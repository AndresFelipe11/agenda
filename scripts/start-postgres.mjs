import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import EmbeddedPostgres from "embedded-postgres";

const root = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(root, "..", "data", "db");
const alreadyInit = fs.existsSync(path.join(databaseDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "agendas",
  password: "agendas",
  port: 5432,
  persistent: true,
});

if (!alreadyInit) {
  await pg.initialise();
}

await pg.start();

try {
  await pg.createDatabase("agendas");
} catch {
  // already exists
}

console.log("PostgreSQL listo en localhost:5432 (usuario agendas / base agendas)");

await new Promise(() => {
  // keep the cluster alive
});
