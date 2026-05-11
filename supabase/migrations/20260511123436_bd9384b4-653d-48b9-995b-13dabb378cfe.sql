-- 1) Enforce unique transaction IDs at the DB level
ALTER TABLE public.orders
  ADD CONSTRAINT orders_transaction_id_unique UNIQUE (transaction_id);

-- 2) Server-side order creation with authoritative pricing
CREATE OR REPLACE FUNCTION public.create_order(
  _user_name text,
  _user_phone text,
  _user_email text,
  _payment_method text,
  _transaction_id text,
  _sender_phone text,
  _delivery_type text,
  _delivery_address text,
  _delivery_area text,
  _cart_items jsonb  -- [{ "id": "<menu_item_id>", "quantity": N }]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item record;
  v_subtotal numeric := 0;
  v_delivery_charge numeric := 0;
  v_min_order numeric := 0;
  v_total numeric;
  v_txn text;
  v_order_id uuid;
  v_product_details jsonb := '[]'::jsonb;
  v_qty int;
  v_menu record;
BEGIN
  -- Basic validation
  IF _user_name IS NULL OR length(btrim(_user_name)) < 1 OR length(_user_name) > 100 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF _user_phone IS NULL OR length(_user_phone) < 5 OR length(_user_phone) > 20 THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;
  IF _payment_method NOT IN ('bkash','nagad','cod') THEN
    RAISE EXCEPTION 'invalid_payment_method';
  END IF;
  IF _delivery_type NOT IN ('pickup','delivery') THEN
    RAISE EXCEPTION 'invalid_delivery_type';
  END IF;
  IF _cart_items IS NULL OR jsonb_typeof(_cart_items) <> 'array' OR jsonb_array_length(_cart_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart';
  END IF;

  -- Compute subtotal from authoritative menu_items prices
  FOR v_item IN
    SELECT (elem->>'id')::uuid AS id,
           COALESCE((elem->>'quantity')::int, 0) AS quantity
    FROM jsonb_array_elements(_cart_items) AS elem
  LOOP
    v_qty := v_item.quantity;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 1000 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;

    SELECT id, name, price, image_url, is_active
      INTO v_menu
    FROM public.menu_items
    WHERE id = v_item.id;

    IF NOT FOUND OR v_menu.is_active IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'item_unavailable';
    END IF;

    v_subtotal := v_subtotal + (v_menu.price * v_qty);

    v_product_details := v_product_details || jsonb_build_object(
      'id', v_menu.id,
      'name', v_menu.name,
      'price', v_menu.price,
      'quantity', v_qty,
      'image_url', v_menu.image_url
    );
  END LOOP;

  -- Delivery charge & min order from settings
  IF _delivery_type = 'delivery' THEN
    SELECT COALESCE((value->>'delivery_charge')::numeric, 0),
           COALESCE((value->>'min_order_amount')::numeric, 0)
      INTO v_delivery_charge, v_min_order
    FROM public.site_settings
    WHERE key = 'delivery_settings'
    LIMIT 1;

    IF v_subtotal < v_min_order THEN
      RAISE EXCEPTION 'below_min_order';
    END IF;

    IF _delivery_address IS NULL OR length(btrim(_delivery_address)) < 1 THEN
      RAISE EXCEPTION 'address_required';
    END IF;
  END IF;

  v_total := v_subtotal + COALESCE(v_delivery_charge, 0);

  -- Transaction ID handling
  IF _payment_method = 'cod' THEN
    v_txn := 'COD-' || gen_random_uuid()::text;
  ELSE
    IF _transaction_id IS NULL OR length(btrim(_transaction_id)) < 1 THEN
      RAISE EXCEPTION 'transaction_id_required';
    END IF;
    v_txn := _transaction_id;
  END IF;

  INSERT INTO public.orders (
    user_name, user_phone, user_email, product_details, total_amount,
    payment_method, transaction_id, sender_phone, order_status,
    delivery_type, delivery_address, delivery_area
  ) VALUES (
    _user_name, _user_phone, NULLIF(_user_email,''), v_product_details, v_total,
    _payment_method, v_txn, NULLIF(_sender_phone,''), 'pending',
    _delivery_type,
    CASE WHEN _delivery_type = 'delivery' THEN _delivery_address ELSE NULL END,
    CASE WHEN _delivery_type = 'delivery' THEN _delivery_area    ELSE NULL END
  )
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object('order_id', v_order_id, 'total_amount', v_total);
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'duplicate_transaction';
END;
$$;

-- Allow public callers (anon + authenticated) to invoke the RPC
GRANT EXECUTE ON FUNCTION public.create_order(
  text, text, text, text, text, text, text, text, text, jsonb
) TO anon, authenticated;