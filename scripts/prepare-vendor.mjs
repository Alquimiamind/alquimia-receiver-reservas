/**
 * Extrae el tarball certificado a vendor/ (sin migraciones).
 */
import { execSync } from "node:child_process";
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  execSync("node scripts/verify-delivery.mjs", { cwd: root, stdio: "inherit" });
  const delivery = JSON.parse(await readFile(path.join(root, "factory-delivery.json"), "utf8"));
  const vendor = path.join(root, "vendor/module-reservas");
  await rm(vendor, { recursive: true, force: true });
  await mkdir(vendor, { recursive: true });
  execSync(
    `tar xzf ${JSON.stringify(path.join(root, delivery.tarball))} -C ${JSON.stringify(vendor)}`,
    { stdio: "inherit", shell: true }
  );
  const publishPkg = path.join(vendor, "package.publish.json");
  try {
    await copyFile(publishPkg, path.join(vendor, "package.json"));
  } catch {
    /* legacy tarball */
  }
  console.log("PREPARE_VENDOR_OK");
}

main().catch((err) => {
  console.error("PREPARE_VENDOR_FAIL", err.message);
  process.exit(1);
});
