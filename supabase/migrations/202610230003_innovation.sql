-- Additive upgrade: existing accounts, projects and owner sign-in are unchanged.
begin;
create table public.innovation_entries (
 id uuid primary key default gen_random_uuid(),
 tree_id uuid not null references public.idea_trees(id) on delete cascade,
 node_id uuid not null references public.idea_nodes(id) on delete cascade,
 target_id uuid references public.idea_nodes(id),
 author_id uuid not null default auth.uid() references public.profiles(id),
 kind text not null check(kind in ('relationship','evidence','assumption','risk','question','analysis','contribution')),
 body text not null check(length(body) between 5 and 12000),
 relation text check(relation in ('improves','depends_on','combines_with','inspired_by','supports','challenges','conflicts_with')),
 source_url text check(source_url is null or source_url ~ '^https?://[^[:space:]]+$'),
 origin text not null default 'human' check(origin in ('human','ai')),
 status text not null default 'proposed' check(status in ('proposed','accepted','rejected','resolved')),
 reviewed_by uuid references public.profiles(id),
 created_at timestamptz not null default now(),
 check(target_id is null or target_id<>node_id),
 check(kind<>'relationship' or (target_id is not null and relation is not null))
);
create unique index innovation_relationship_unique on public.innovation_entries(node_id,target_id) where kind='relationship' and status<>'rejected';
create index innovation_tree_idx on public.innovation_entries(tree_id,created_at);
create table public.innovation_events(id uuid primary key default gen_random_uuid(), entry_id uuid not null references public.innovation_entries(id) on delete cascade, actor_id uuid references public.profiles(id), before_body jsonb, after_body jsonb not null, created_at timestamptz not null default now());
alter table public.innovation_entries enable row level security;
alter table public.innovation_events enable row level security;
create policy innovation_read on public.innovation_entries for select using(can_read_node(node_id) and (target_id is null or can_read_node(target_id)));
create policy innovation_insert on public.innovation_entries for insert to authenticated with check(author_id=auth.uid() and origin='human' and status='proposed' and reviewed_by is null and can_read_node(node_id) and exists(select 1 from public.idea_nodes n where n.id=node_id and n.tree_id=innovation_entries.tree_id) and (target_id is null or exists(select 1 from public.idea_nodes n where n.id=target_id and n.tree_id=innovation_entries.tree_id and can_read_node(n.id))));
create policy innovation_review on public.innovation_entries for update to authenticated using(owns_tree(tree_id)) with check(owns_tree(tree_id) and reviewed_by=auth.uid());
create policy innovation_event_read on public.innovation_events for select using(exists(select 1 from public.innovation_entries e where e.id=entry_id));
grant select on public.innovation_entries,public.innovation_events to anon,authenticated;
grant insert(tree_id,node_id,target_id,kind,body,relation,source_url) on public.innovation_entries to authenticated;
grant update(body,relation,status,reviewed_by) on public.innovation_entries to authenticated;
grant all on public.innovation_entries,public.innovation_events to service_role;
create function public.audit_innovation() returns trigger language plpgsql security definer set search_path=public as $$begin insert into innovation_events(entry_id,actor_id,before_body,after_body) values(new.id,auth.uid(),case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));return new;end;$$;
create trigger audit_innovation after insert or update on public.innovation_entries for each row execute function public.audit_innovation();
revoke execute on function public.audit_innovation() from public;
create table public.innovation_ai_usage(id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), created_at timestamptz not null default now());
alter table public.innovation_ai_usage enable row level security;
create function public.reserve_innovation_ai() returns void language plpgsql security definer set search_path=public as $$begin if auth.uid() is null then raise exception 'Sign in';end if;perform id from profiles where id=auth.uid() for update;if (select count(*) from innovation_ai_usage where user_id=auth.uid() and created_at>now()-interval '1 hour')>=8 then raise exception 'Hourly AI limit reached';end if;insert into innovation_ai_usage(user_id) values(auth.uid());end;$$;
revoke execute on function public.reserve_innovation_ai() from public;
grant execute on function public.reserve_innovation_ai() to authenticated;
alter table public.idea_nodes add column change_reason text not null default '' check(length(change_reason)<=1000);
alter table public.node_revisions add column reason text not null default '';
grant update(change_reason) on public.idea_nodes to authenticated;
create or replace function public.record_revision() returns trigger language plpgsql security definer set search_path=public as $$begin if (old.title,old.content,old.status) is distinct from (new.title,new.content,new.status) then insert into node_revisions(node_id,editor_id,title,content,status,reason) values(old.id,auth.uid(),old.title,old.content,old.status,new.change_reason);end if;return new;end;$$;
commit;
