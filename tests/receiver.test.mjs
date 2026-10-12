import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import { createReservasPgRouter } from "@alquimia/module-reservas/pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseUrl = process.env.DATABASE_URL ?? "";
const skip = !databaseUrl;

describe.skipIf(skip)("receptor — instalación independiente", () => {
  let pool;
  let app;

  beforeAll(async () => {
    execSync("node scripts/install-module.mjs", {
      cwd: root,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "inherit",
    });
    const built = await createReservasPgRouter({
      databaseUrl,
      config: { tenantId: "receiver-ci", defaultTimezone: "UTC" },
      allowAdminWrites: true,
    });
    app = built.app;
    pool = built.pool;
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("health sin backend ALQUIMIA", async () => {
    const res = await app.fetch(new Request("http://local/health"));
    const json = await res.json();
    expect(json.portable).toBe(true);
    expect(json.factory?.database).toBe("postgresql_receiver_isolated");
  });

  it("rechaza manifiesto adulterado", async () => {
    const manifestPath = path.join(root, "package-manifest.json");
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw);
    const tampered = raw.replace(parsed.artifact_sha256.slice(0, 8), "00000000");
    await writeFile(manifestPath, tampered);
    let failed = false;
    try {
      execSync("node scripts/verify-delivery.mjs", { cwd: root, stdio: "pipe" });
    } catch {
      failed = true;
    }
    await writeFile(manifestPath, raw);
    expect(failed).toBe(true);
  });
});
