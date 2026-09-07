import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(
  __dirname,
  "../supabase/migrations/202605210001_service_foundation.sql"
);
const physicalCardsMigrationPath = join(
  __dirname,
  "../supabase/migrations/202605280001_physical_business_cards.sql"
);
const adminWorkflowsMigrationPath = join(
  __dirname,
  "../supabase/migrations/202605300001_admin_workflows.sql"
);
const physicalCardPrintSpecsMigrationPath = join(
  __dirname,
  "../supabase/migrations/202606090001_physical_card_print_specs.sql"
);

test("service foundation migration defines core tables and RLS", () => {
  const sql = readFileSync(migrationPath, "utf8");

  [
    "create table if not exists public.profiles",
    "create table if not exists public.profile_skills",
    "create table if not exists public.profile_interests",
    "create table if not exists public.profile_projects",
    "create table if not exists public.projects",
    "create table if not exists public.project_roles",
    "create table if not exists public.project_skills",
    "create table if not exists public.project_interests",
    "create table if not exists public.project_applications",
    "create table if not exists public.contact_requests",
    "create table if not exists public.recommendation_runs",
    "create table if not exists public.recommendations",
    "alter table public.profiles enable row level security"
  ].forEach((requiredSql) => {
    assert.ok(sql.includes(requiredSql), `missing SQL: ${requiredSql}`);
  });
});

test("physical business card migration defines profile fields and order table", () => {
  const sql = readFileSync(physicalCardsMigrationPath, "utf8");

  [
    "alter table public.profiles add column if not exists organization text",
    "alter table public.profiles add column if not exists position text",
    "alter table public.profiles add column if not exists phone text",
    "alter table public.profiles add column if not exists website_url text",
    "alter table public.profiles add column if not exists business_address text",
    "alter table public.profiles add column if not exists card_tagline text",
    "create table if not exists public.physical_card_orders",
    "payment_pending",
    "alter table public.physical_card_orders enable row level security"
  ].forEach((requiredSql) => {
    assert.ok(sql.includes(requiredSql), `missing SQL: ${requiredSql}`);
  });
});

test("admin workflows migration expands physical card production statuses", () => {
  const sql = readFileSync(adminWorkflowsMigrationPath, "utf8");

  [
    "alter table public.physical_card_orders drop constraint if exists physical_card_orders_status_check",
    "production_pending",
    "printed",
    "create index if not exists project_applications_applicant_idx"
  ].forEach((requiredSql) => {
    assert.ok(sql.includes(requiredSql), `missing SQL: ${requiredSql}`);
  });
});

test("physical card print specs migration adds real card sizes and production papers", () => {
  const sql = readFileSync(physicalCardPrintSpecsMigrationPath, "utf8");

  [
    "alter table public.physical_card_orders add column if not exists card_size",
    "alter table public.physical_card_orders alter column paper_type set default 'snow_250'",
    "physical_card_orders_card_size_check",
    "kr_standard",
    "eu_standard",
    "us_standard",
    "snow_250",
    "art_300",
    "rendezvous_310"
  ].forEach((requiredSql) => {
    assert.ok(sql.includes(requiredSql), `missing SQL: ${requiredSql}`);
  });
});
