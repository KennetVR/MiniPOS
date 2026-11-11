-- Migration: Add client_tx_id for idempotent sales and outbox synchronization
-- Date: 2026-11-10

alter table public.venta
  add column if not exists client_tx_id text unique;

create or replace function public.create_sale(
  p_detalles jsonb,
  p_forma_pago text,
  p_descuento numeric,
  p_client_tx_id text default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_id bigint;
  v_item jsonb;
  v_product bigint;
  v_qty integer;
  v_price numeric;
  v_item_discount numeric;
  v_line_subtotal numeric;
  v_subtotal numeric := 0;
  v_tax numeric;
  v_total numeric;
  v_stock integer;
  v_boleta text;
  v_clean_tx text := nullif(btrim(coalesce(p_client_tx_id, '')), '');
begin
  if v_actor is null or (public.current_role() is distinct from 'administrator'
    and public.current_role() is distinct from 'seller') then raise exception 'forbidden'; end if;

  -- Idempotency check: if client_tx_id exists, return already created sale ID without re-executing
  if v_clean_tx is not null then
    select id into v_id from public.venta where client_tx_id = v_clean_tx;
    if found then
      return v_id;
    end if;
  end if;

  if jsonb_typeof(p_detalles) <> 'array' or jsonb_array_length(p_detalles) = 0
    or nullif(btrim(p_forma_pago),'') is null or p_descuento < 0 then raise exception 'invalid_sale'; end if;

  perform p.id from public.producto p
    where p.id in (select (x->>'id_producto')::bigint from jsonb_array_elements(p_detalles) x)
    order by p.id for update;

  for v_item in select value from jsonb_array_elements(p_detalles) loop
    v_product := (v_item->>'id_producto')::bigint;
    v_qty := (v_item->>'cantidad')::integer;
    v_item_discount := coalesce((v_item->>'descuento')::numeric,0);
    if v_qty <= 0 or v_item_discount < 0 then raise exception 'invalid_item'; end if;
    select precio_venta,stock into v_price,v_stock from public.producto where id = v_product and activo;
    if not found then raise exception 'product_not_found'; end if;
    if v_stock < v_qty then raise exception 'insufficient_stock'; end if;
    v_line_subtotal := v_price * v_qty - v_item_discount * v_qty;
    if v_line_subtotal < 0 then raise exception 'invalid_item_discount'; end if;
    v_subtotal := v_subtotal + v_line_subtotal;
  end loop;

  if p_descuento > v_subtotal * 0.5 then raise exception 'invalid_discount'; end if;
  v_tax := round((v_subtotal - p_descuento) * 0.18, 2);
  v_total := v_subtotal - p_descuento + v_tax;
  v_boleta := extract(year from now())::text || '-' || lpad(nextval('public.venta_numero_boleta_seq')::text, 6, '0');

  insert into public.venta(id_usuario, numero_boleta, subtotal, forma_pago, descuento, igv, total, client_tx_id)
    values(v_actor, v_boleta, v_subtotal, p_forma_pago, p_descuento, v_tax, v_total, v_clean_tx)
    returning id into v_id;

  for v_item in select value from jsonb_array_elements(p_detalles) loop
    v_product := (v_item->>'id_producto')::bigint;
    v_qty := (v_item->>'cantidad')::integer;
    v_item_discount := coalesce((v_item->>'descuento')::numeric, 0);

    update public.producto set stock = stock - v_qty, updated_at = now()
      where id = v_product and activo and stock >= v_qty returning stock + v_qty into v_stock;
    if not found then raise exception 'insufficient_stock'; end if;

    select precio_venta into v_price from public.producto where id = v_product;

    insert into public.detalle_venta(id_venta, id_producto, cantidad, precio, descuento, subtotal)
      values(v_id, v_product, v_qty, v_price, v_item_discount, v_price * v_qty - v_item_discount * v_qty);

    insert into public.movimiento_stock(id_producto, id_usuario, tipo, cantidad, motivo, stock_anterior, stock_nuevo, referencia)
      values(v_product, v_actor, 'venta', -v_qty, 'Sale', v_stock, v_stock - v_qty, v_id::text);
  end loop;

  insert into public.ingreso(fecha, concepto, monto, forma_pago, id_venta, id_usuario)
    values(current_date, 'Sale ' || v_boleta, v_total, p_forma_pago, v_id, v_actor);

  return v_id;
end $$;

-- Drop the redundant 3-arg overload because p_client_tx_id has a default value (default null),
-- which causes PostgREST ambiguity (PGRST203: Could not choose the best candidate function).
drop function if exists public.create_sale(jsonb, text, numeric);

revoke all on function public.create_sale(jsonb,text,numeric,text) from public, anon;
grant execute on function public.create_sale(jsonb,text,numeric,text) to authenticated;


