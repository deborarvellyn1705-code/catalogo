-- Cole TUDO no Supabase > SQL Editor > Run
create table public.produtos(
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco numeric,
  descricao text,
  categorias text[] not null default '{}',
  imagem_url text not null,
  esgotado boolean not null default false,
  criado_em timestamptz not null default now()
);
alter table public.produtos enable row level security;
create policy "todos podem ver" on public.produtos for select using (true);
create policy "editor altera" on public.produtos for all to authenticated using (true) with check (true);

insert into storage.buckets(id,name,public) values('fotos-produtos','fotos-produtos',true) on conflict do nothing;
create policy "fotos: todos veem" on storage.objects for select using (bucket_id='fotos-produtos');
create policy "fotos: editor altera" on storage.objects for all to authenticated using (bucket_id='fotos-produtos') with check (bucket_id='fotos-produtos');
