/**
 * Extrae tarball certificado, verifica integridad e instala migraciones.
 */
import { execSync } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  execSync("node scripts/verify-delivery.mjs", { cwd: root, stdio: "inherit" });
  const delivery = JSON.parse(await readFile(path.join(root, "factory-delivery.json"), "utf8"));
  const manifest = JSON.parse(await readFile(path.join(root, "package-manifest.json"), "utf8"));
  const vendor = path.join(root, "vendor/module-reservas");
  await rm(vendor, { recursive: true, force: true });
  await mkdir(vendor, { recursive: true });
  execSync(
    `tar xzf ${JSON.stringify(path.join(root, delivery.tarball))} -C ${JSON.stringify(vendor)}`,
    { stdio: "inherit", shell: true }
  );
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("INSTALL_FAIL:missing_DATABASE_URL");
    process.exit(1);
  }
  execSync("node install/install.mjs", {
    cwd: vendor,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      PACKAGE_ROOT: vendor,
      EXPECTED_ARTIFACT_SHA256: manifest.artifact_sha256,
    },
    stdio: "inherit",
  });
  console.log("INSTALL_MODULE_OK");
}

main().catch((err) => {
  console.error("INSTALL_MODULE_FAIL", err.message);
  process.exit(1);
});
