/**
 * Verifica manifiesto local vs registro de entrega (factory-delivery.json).
 */
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function sha256File(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (c) => hash.update(c))
      .on("end", resolve)
      .on("error", reject);
  });
  return hash.digest("hex");
}

async function main() {
  const delivery = JSON.parse(await readFile(path.join(root, "factory-delivery.json"), "utf8"));
  const manifest = JSON.parse(await readFile(path.join(root, "package-manifest.json"), "utf8"));
  if (manifest.artifact_sha256 !== delivery.artifact_sha256) {
    throw new Error("DELIVERY_MISMATCH:manifest_vs_factory_record");
  }
  if (delivery.source_commit && process.env.EXPECTED_SOURCE_COMMIT?.trim()) {
    if (delivery.source_commit !== process.env.EXPECTED_SOURCE_COMMIT.trim()) {
      throw new Error("DELIVERY_MISMATCH:source_commit");
    }
  }
  const tarPath = path.join(root, delivery.tarball);
  const tarSha = await sha256File(tarPath);
  if (manifest.tarball_sha256 && tarSha !== manifest.tarball_sha256) {
    throw new Error("INTEGRITY_FAIL:tarball_sha256");
  }
  const aggregate = createHash("sha256");
  aggregate.update(JSON.stringify(manifest.files));
  if (aggregate.digest("hex") !== manifest.artifact_sha256) {
    throw new Error("INTEGRITY_FAIL:artifact_aggregate");
  }
  console.log(`VERIFY_OK:artifact=${manifest.artifact_sha256}`);
}

main().catch((err) => {
  console.error("VERIFY_FAIL", err.message);
  process.exit(1);
});
