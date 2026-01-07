-- Create package_items normalized table and migrate existing JSONB skus into rows

create table if not exists package_items (
  id uuid not null default gen_random_uuid() primary key,
  package_id uuid not null references packages(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null default 1,
  position integer not null default 0,
  constraint package_items_unique unique (package_id, product_id)
);

-- Migrate existing JSONB skus from packages.skus into package_items
-- This will insert rows for each sku (expected to be product.id strings) with quantity 1
insert into package_items (package_id, product_id, quantity, position)
select p.id, (t.value)::uuid, 1, t.ord
from packages p,
     jsonb_array_elements_text(p.skus) with ordinality as t(value, ord)
where jsonb_array_length(p.skus) > 0;

-- Optional: remove skus column after migration if desired
-- alter table packages drop column if exists skus;