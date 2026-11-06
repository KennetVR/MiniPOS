# Supabase backend setup

This change defines the database contract only. It does not create or link a Supabase project, deploy migrations, provision users, or transfer local SQLite data. Keep existing SQLite files untouched.

## Schema and access

Apply migrations in `supabase/migrations` to a user-authorized Supabase project. Supabase Auth UUIDs map to `profiles.id`; the auth trigger creates a seller profile for newly invited Auth users. Disable public sign-up and provision accounts through a trusted invitation process; assign administrator roles only through an authorized administrative process. Administrators can list/update profile role and active status. Never accept a user ID from a client as the actor. RPCs derive the actor from `auth.uid()`. Do not place a service-role key in desktop or mobile configuration.

For local desktop configuration, copy `docs/supabase-env.example` to a root `.env` file and replace both placeholders with values from the authorized project. The publishable/anon key is client-visible and relies on RLS; never put a service-role key in a `VITE_` variable. `.env` is Git-ignored. Missing configuration reports Supabase as unavailable; the desktop must not silently treat local SQLite as synchronized cloud data.

All business tables enable RLS. Authenticated users can read inventory; sellers and administrators can read sales and income; expense and receipt/stock-movement history is administrator-only. Administrators may manage categories and suppliers and edit product metadata. Product stock is not writable through table grants: stock changes only through the transactional RPCs. Inventory receipts, adjustments, expenses, and settings changes require the administrator role; sales require an authenticated seller or administrator.

## Transactional operations

- `create_inventory_receipt(p_id_proveedor bigint, p_numero_comprobante text, p_items jsonb)` accepts item objects `{id_producto, cantidad, precio_compra}`, updates stock and records receipt details, totals, and before/after movements in one transaction. Returns the numeric receipt ID.
- `create_sale(p_detalles jsonb, p_forma_pago text, p_descuento numeric)` accepts item objects `{id_producto, cantidad, descuento?}`; derives prices from `producto`, checks/decrements stock under row locks, and records the sale, generated receipt number, details, income, and movements atomically. Returns the numeric sale ID; fetch the sale row for its generated `numero_boleta` and totals.
- `adjust_inventory(p_id_producto bigint, p_stock_real integer, p_motivo text)` requires an administrator and non-empty reason; it locks the product row and records the stock delta and before/after values.
- `create_expense(p_fecha date, p_tipo text, p_concepto text, p_monto numeric, p_comprobante text, p_beneficiario text, p_id_proveedor bigint)` creates an expense using the authenticated actor rather than a client-supplied user ID; returns the numeric expense ID.
- `create_product(...)` creates product metadata and, when requested, records initial stock through the server-side operation; direct product updates never write stock.
- `void_sale(p_id_venta bigint, p_motivo text)` restores stock, records compensating movements, marks the sale as voided, and marks its linked income as voided; it requires an administrator.

Migration `202611050002_desktop_workflow_contract.sql` adds fields already used by the desktop schema, plus shared income, expense, and settings tables. Product image values are text URLs/paths; the existing local SQLite BLOBs are not copied or converted. User accounts are Supabase Auth identities, not migrated SQLite users; new accounts must be invited separately.

Any failed RPC rolls back all its database writes. Clients should report connectivity/RPC errors as failures, not as completed synchronization. The desktop renderer now routes business reads/writes through this contract; local SQLite remains untouched and is not a silent fallback.

## Local checks

The focused database contract tests are in `supabase/tests/shared_inventory.test.sql` and use pgTAP. With the Supabase CLI and its local database runtime available, run `supabase test db`. No remote project or credentials are needed for local tests. Do not use service-role credentials in client builds. This local contract has not been applied to a user project.
