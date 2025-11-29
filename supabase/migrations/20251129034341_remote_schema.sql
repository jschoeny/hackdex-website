drop extension if exists "pg_net";

alter table "public"."hack_tags" add column "order" bigint not null default '0'::bigint;

alter table "public"."hacks" add column "published" boolean not null default false;

grant delete on table "public"."hack_covers" to "anon";

grant insert on table "public"."hack_covers" to "anon";

grant references on table "public"."hack_covers" to "anon";

grant select on table "public"."hack_covers" to "anon";

grant trigger on table "public"."hack_covers" to "anon";

grant truncate on table "public"."hack_covers" to "anon";

grant update on table "public"."hack_covers" to "anon";

grant delete on table "public"."hack_covers" to "authenticated";

grant insert on table "public"."hack_covers" to "authenticated";

grant references on table "public"."hack_covers" to "authenticated";

grant select on table "public"."hack_covers" to "authenticated";

grant trigger on table "public"."hack_covers" to "authenticated";

grant truncate on table "public"."hack_covers" to "authenticated";

grant update on table "public"."hack_covers" to "authenticated";

grant delete on table "public"."hack_covers" to "service_role";

grant insert on table "public"."hack_covers" to "service_role";

grant references on table "public"."hack_covers" to "service_role";

grant select on table "public"."hack_covers" to "service_role";

grant trigger on table "public"."hack_covers" to "service_role";

grant truncate on table "public"."hack_covers" to "service_role";

grant update on table "public"."hack_covers" to "service_role";

grant delete on table "public"."hack_tags" to "anon";

grant insert on table "public"."hack_tags" to "anon";

grant references on table "public"."hack_tags" to "anon";

grant select on table "public"."hack_tags" to "anon";

grant trigger on table "public"."hack_tags" to "anon";

grant truncate on table "public"."hack_tags" to "anon";

grant update on table "public"."hack_tags" to "anon";

grant delete on table "public"."hack_tags" to "authenticated";

grant insert on table "public"."hack_tags" to "authenticated";

grant references on table "public"."hack_tags" to "authenticated";

grant select on table "public"."hack_tags" to "authenticated";

grant trigger on table "public"."hack_tags" to "authenticated";

grant truncate on table "public"."hack_tags" to "authenticated";

grant update on table "public"."hack_tags" to "authenticated";

grant delete on table "public"."hack_tags" to "service_role";

grant insert on table "public"."hack_tags" to "service_role";

grant references on table "public"."hack_tags" to "service_role";

grant select on table "public"."hack_tags" to "service_role";

grant trigger on table "public"."hack_tags" to "service_role";

grant truncate on table "public"."hack_tags" to "service_role";

grant update on table "public"."hack_tags" to "service_role";

grant delete on table "public"."hacks" to "anon";

grant insert on table "public"."hacks" to "anon";

grant references on table "public"."hacks" to "anon";

grant select on table "public"."hacks" to "anon";

grant trigger on table "public"."hacks" to "anon";

grant truncate on table "public"."hacks" to "anon";

grant update on table "public"."hacks" to "anon";

grant delete on table "public"."hacks" to "authenticated";

grant insert on table "public"."hacks" to "authenticated";

grant references on table "public"."hacks" to "authenticated";

grant select on table "public"."hacks" to "authenticated";

grant trigger on table "public"."hacks" to "authenticated";

grant truncate on table "public"."hacks" to "authenticated";

grant update on table "public"."hacks" to "authenticated";

grant delete on table "public"."hacks" to "service_role";

grant insert on table "public"."hacks" to "service_role";

grant references on table "public"."hacks" to "service_role";

grant select on table "public"."hacks" to "service_role";

grant trigger on table "public"."hacks" to "service_role";

grant truncate on table "public"."hacks" to "service_role";

grant update on table "public"."hacks" to "service_role";

grant delete on table "public"."invite_codes" to "anon";

grant insert on table "public"."invite_codes" to "anon";

grant references on table "public"."invite_codes" to "anon";

grant select on table "public"."invite_codes" to "anon";

grant trigger on table "public"."invite_codes" to "anon";

grant truncate on table "public"."invite_codes" to "anon";

grant update on table "public"."invite_codes" to "anon";

grant delete on table "public"."invite_codes" to "authenticated";

grant insert on table "public"."invite_codes" to "authenticated";

grant references on table "public"."invite_codes" to "authenticated";

grant select on table "public"."invite_codes" to "authenticated";

grant trigger on table "public"."invite_codes" to "authenticated";

grant truncate on table "public"."invite_codes" to "authenticated";

grant update on table "public"."invite_codes" to "authenticated";

grant delete on table "public"."invite_codes" to "service_role";

grant insert on table "public"."invite_codes" to "service_role";

grant references on table "public"."invite_codes" to "service_role";

grant select on table "public"."invite_codes" to "service_role";

grant trigger on table "public"."invite_codes" to "service_role";

grant truncate on table "public"."invite_codes" to "service_role";

grant update on table "public"."invite_codes" to "service_role";

grant delete on table "public"."patch_downloads" to "anon";

grant insert on table "public"."patch_downloads" to "anon";

grant references on table "public"."patch_downloads" to "anon";

grant select on table "public"."patch_downloads" to "anon";

grant trigger on table "public"."patch_downloads" to "anon";

grant truncate on table "public"."patch_downloads" to "anon";

grant update on table "public"."patch_downloads" to "anon";

grant delete on table "public"."patch_downloads" to "authenticated";

grant insert on table "public"."patch_downloads" to "authenticated";

grant references on table "public"."patch_downloads" to "authenticated";

grant select on table "public"."patch_downloads" to "authenticated";

grant trigger on table "public"."patch_downloads" to "authenticated";

grant truncate on table "public"."patch_downloads" to "authenticated";

grant update on table "public"."patch_downloads" to "authenticated";

grant delete on table "public"."patch_downloads" to "service_role";

grant insert on table "public"."patch_downloads" to "service_role";

grant references on table "public"."patch_downloads" to "service_role";

grant select on table "public"."patch_downloads" to "service_role";

grant trigger on table "public"."patch_downloads" to "service_role";

grant truncate on table "public"."patch_downloads" to "service_role";

grant update on table "public"."patch_downloads" to "service_role";

grant delete on table "public"."patches" to "anon";

grant insert on table "public"."patches" to "anon";

grant references on table "public"."patches" to "anon";

grant select on table "public"."patches" to "anon";

grant trigger on table "public"."patches" to "anon";

grant truncate on table "public"."patches" to "anon";

grant update on table "public"."patches" to "anon";

grant delete on table "public"."patches" to "authenticated";

grant insert on table "public"."patches" to "authenticated";

grant references on table "public"."patches" to "authenticated";

grant select on table "public"."patches" to "authenticated";

grant trigger on table "public"."patches" to "authenticated";

grant truncate on table "public"."patches" to "authenticated";

grant update on table "public"."patches" to "authenticated";

grant delete on table "public"."patches" to "service_role";

grant insert on table "public"."patches" to "service_role";

grant references on table "public"."patches" to "service_role";

grant select on table "public"."patches" to "service_role";

grant trigger on table "public"."patches" to "service_role";

grant truncate on table "public"."patches" to "service_role";

grant update on table "public"."patches" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";


