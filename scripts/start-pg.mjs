import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".pgdata");
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "password",
  port: 5432,
  persistent: true,
});

if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) {
  await pg.initialise();
}

await pg.start();

try {
  await pg.createDatabase("sms_registry");
} catch {
  // database already exists
}

const url =
  'postgresql://postgres:password@127.0.0.1:5432/sms_registry?schema=public';
fs.writeFileSync(".env", `DATABASE_URL="${url}"\n`);
console.log("Embedded Postgres ready at", url);

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pg.stop();
  process.exit(0);
});
