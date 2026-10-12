# Receptor desechable — Reservas v0.1 (FACTORY 003)

Instala el paquete certificado `@alquimia/module-reservas` **sin** el monorepo ALQUIMIA, Supabase ni APIs de staging.

## Contenido de la entrega

- `alquimia-module-reservas-0.1.0.tar.gz` — artefacto firmado por manifiesto
- `package-manifest.json` — SHA-256 por archivo y agregado
- `factory-delivery.json` — trazabilidad (commit origen, artefacto)
- Scripts `verify` / `install:module` y pruebas con PostgreSQL propio

## Requisitos

- Node.js 20+
- PostgreSQL 15+ (instancia del negocio)

## Instalación limpia

```bash
cp .env.example .env   # editar DATABASE_URL
npm ci
npm run verify
npm run install:module
npm test
npm start
```

## Integridad

`npm run verify` falla si el manifiesto no coincide con `factory-delivery.json` o si el tarball fue alterado.

No incluye secretos de ALQUIMIA.
