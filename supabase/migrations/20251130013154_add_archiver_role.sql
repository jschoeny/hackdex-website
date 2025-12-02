CREATE OR REPLACE FUNCTION public.is_archiver()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select 
  	coalesce(get_my_claim('archiver')::bool,false)
  	or
  	coalesce(get_my_claim('claims_admin')::bool,false)
$function$
;

