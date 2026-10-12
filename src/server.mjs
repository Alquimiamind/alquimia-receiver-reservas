import { createReservasPgRouter } from "@alquimia/module-reservas/pg";

const databaseUrl = process.env.DATABASE_URL;
const tenantId = process.env.RESERVAS_TENANT_ID ?? "negocio-1";

if (!databaseUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const { app } = await createReservasPgRouter({
  databaseUrl,
  config: { tenantId, defaultTimezone: process.env.RESERVAS_DEFAULT_TIMEZONE ?? "UTC" },
  allowAdminWrites: true,
});

export default app;
