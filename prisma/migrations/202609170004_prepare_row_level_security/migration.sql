CREATE SCHEMA IF NOT EXISTS "cafeflow";

CREATE OR REPLACE FUNCTION "cafeflow"."current_tenant_id"()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('cafeflow.tenant_id', true), '')::UUID;
$$;

CREATE OR REPLACE FUNCTION "cafeflow"."current_branch_ids"()
RETURNS UUID[]
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE
    WHEN NULLIF(current_setting('cafeflow.branch_ids', true), '') IS NULL THEN NULL::UUID[]
    ELSE string_to_array(current_setting('cafeflow.branch_ids', true), ',')::UUID[]
  END;
$$;

-- This migration intentionally does not enable RLS yet. The application must set
-- cafeflow.tenant_id and cafeflow.branch_ids with SET LOCAL inside every request
-- transaction before FORCE ROW LEVEL SECURITY is enabled. See the deployment
-- checklist for the required rollout order.

COMMENT ON FUNCTION "cafeflow"."current_tenant_id"() IS 'Request tenant GUC used by the CafeFlow RLS rollout';
COMMENT ON FUNCTION "cafeflow"."current_branch_ids"() IS 'Request branch GUC used by the CafeFlow RLS rollout';