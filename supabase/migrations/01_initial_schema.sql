-- ========================================================================
-- 01_initial_schema.sql
-- Master Document & Platform Database Schema, Triggers, and RLS Policies
-- ========================================================================

-- 1. Master Templates Table
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    phase TEXT NOT NULL CHECK (phase IN ('before_ojt', 'in_ojt', 'final')),
    current_version_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Immutable Template Versions Table
CREATE TABLE IF NOT EXISTS public.document_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    schema_json JSONB NOT NULL,
    mapping_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('draft', 'needs_mapping', 'ready', 'published', 'archived')),
    published_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_template_version UNIQUE (template_id, version_number)
);

-- Circular foreign key for active version lookup
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_current_version'
    ) THEN
        ALTER TABLE public.document_templates 
        ADD CONSTRAINT fk_current_version 
        FOREIGN KEY (current_version_id) 
        REFERENCES public.document_template_versions(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Student Document Instances Table
CREATE TABLE IF NOT EXISTS public.document_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE RESTRICT,
    template_version_id UUID NOT NULL REFERENCES public.document_template_versions(id) ON DELETE RESTRICT,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    instance_version INT NOT NULL DEFAULT 1,
    field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'adviser_review', 'revision_required', 'approved', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Runtime Tables (Used by submissionStorage.ts and templateStorage.ts)
CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    course TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending Adviser Review',
    urgency TEXT NOT NULL DEFAULT 'medium',
    file_path TEXT,
    ai_status TEXT DEFAULT 'Pending',
    ai_findings JSONB,
    adviser_feedback TEXT,
    comments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.template_metadata (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "group" TEXT NOT NULL,
    type TEXT NOT NULL,
    filename TEXT,
    version TEXT DEFAULT 'v1.0',
    size TEXT,
    updated TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================================
-- 5. Secure Trigger Functions (Explicit Search Path & Revoked Direct RPC)
-- ========================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS update_document_instances_updated_at ON public.document_instances;
CREATE TRIGGER update_document_instances_updated_at
    BEFORE UPDATE ON public.document_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_document_instance_integrity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    parent_template_id UUID;
    user_role TEXT;
BEGIN
    user_role := COALESCE(
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'),
        ((SELECT auth.jwt()) ->> 'role')
    );

    SELECT template_id INTO parent_template_id 
    FROM public.document_template_versions 
    WHERE id = NEW.template_version_id;

    IF parent_template_id IS NULL OR parent_template_id <> NEW.template_id THEN
        RAISE EXCEPTION 'Mismatched template_version_id and template_id.';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.instance_version IS DISTINCT FROM NEW.instance_version 
           AND NEW.instance_version IS DISTINCT FROM (OLD.instance_version + 1) THEN
            RAISE EXCEPTION 'instance_version must increment by exactly 1 or remain unchanged.';
        END IF;

        IF user_role NOT IN ('admin', 'adviser') THEN
            IF OLD.template_id IS DISTINCT FROM NEW.template_id THEN
                RAISE EXCEPTION 'Cannot modify template_id on an existing document instance.';
            END IF;
            IF OLD.template_version_id IS DISTINCT FROM NEW.template_version_id THEN
                RAISE EXCEPTION 'Cannot modify template_version_id on an existing document instance.';
            END IF;
            IF OLD.student_id IS DISTINCT FROM NEW.student_id THEN
                RAISE EXCEPTION 'Cannot modify student_id on an existing document instance.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_document_instance_integrity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_validate_document_instance_integrity ON public.document_instances;
CREATE TRIGGER trigger_validate_document_instance_integrity
    BEFORE INSERT OR UPDATE ON public.document_instances
    FOR EACH ROW
    EXECUTE FUNCTION validate_document_instance_integrity();

-- 6. Foreign Key & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_document_instances_template_id ON public.document_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_current_version_id ON public.document_templates(current_version_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON public.document_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_document_instances_student_id ON public.document_instances(student_id);
CREATE INDEX IF NOT EXISTS idx_document_instances_template_version ON public.document_instances(template_version_id);
CREATE INDEX IF NOT EXISTS idx_document_instances_status ON public.document_instances(status);
CREATE INDEX IF NOT EXISTS idx_document_instances_student_status ON public.document_instances(student_id, status);
CREATE INDEX IF NOT EXISTS idx_document_templates_phase_cat ON public.document_templates(phase, category);

CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_student_instance 
ON public.document_instances(student_id, template_id) 
WHERE status NOT IN ('archived', 'approved');

-- 7. Row Level Security & InitPlan-Optimized Policies
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public templates are viewable by authenticated users" ON public.document_templates;
CREATE POLICY "Public templates are viewable by authenticated users" 
ON public.document_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public template versions are viewable by authenticated users" ON public.document_template_versions;
CREATE POLICY "Public template versions are viewable by authenticated users" 
ON public.document_template_versions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "document_instances_select_policy" ON public.document_instances;
CREATE POLICY "document_instances_select_policy" 
ON public.document_instances FOR SELECT TO authenticated 
USING (
    student_id = (SELECT auth.uid())::text 
    OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
);

DROP POLICY IF EXISTS "document_instances_insert_policy" ON public.document_instances;
CREATE POLICY "document_instances_insert_policy" 
ON public.document_instances FOR INSERT TO authenticated 
WITH CHECK (
    student_id = (SELECT auth.uid())::text 
    AND status = 'draft'
    AND EXISTS (
        SELECT 1 FROM public.document_template_versions v
        WHERE v.id = template_version_id AND v.status = 'published'
    )
);

DROP POLICY IF EXISTS "document_instances_update_policy" ON public.document_instances;
CREATE POLICY "document_instances_update_policy" 
ON public.document_instances FOR UPDATE TO authenticated 
USING (
    (student_id = (SELECT auth.uid())::text AND status IN ('draft', 'revision_required'))
    OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
)
WITH CHECK (
    (student_id = (SELECT auth.uid())::text AND status IN ('draft', 'submitted', 'revision_required'))
    OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
);

-- Policies for Runtime Tables (Drops all legacy UI & prototype policies first)
DROP POLICY IF EXISTS "Public Access" ON public.student_documents;
DROP POLICY IF EXISTS "Public Read" ON public.student_documents;
DROP POLICY IF EXISTS "Public Insert" ON public.student_documents;
DROP POLICY IF EXISTS "Public Update" ON public.student_documents;
DROP POLICY IF EXISTS "Public Delete" ON public.student_documents;
DROP POLICY IF EXISTS "Enable all access for prototype" ON public.student_documents;
DROP POLICY IF EXISTS "Allow public read student_documents" ON public.student_documents;
DROP POLICY IF EXISTS "Allow public insert student_documents" ON public.student_documents;
DROP POLICY IF EXISTS "Allow public update student_documents" ON public.student_documents;
DROP POLICY IF EXISTS "Allow public delete student_documents" ON public.student_documents;
DROP POLICY IF EXISTS "student_documents_policy" ON public.student_documents;
DROP POLICY IF EXISTS "student_documents_select" ON public.student_documents;
DROP POLICY IF EXISTS "student_documents_insert" ON public.student_documents;
DROP POLICY IF EXISTS "student_documents_update" ON public.student_documents;
DROP POLICY IF EXISTS "student_documents_delete" ON public.student_documents;

CREATE POLICY "student_documents_select" ON public.student_documents 
FOR SELECT TO authenticated, anon 
USING (true);

CREATE POLICY "student_documents_insert" ON public.student_documents 
FOR INSERT TO authenticated, anon 
WITH CHECK (student_name IS NOT NULL AND length(trim(student_name)) > 0 AND doc_type IS NOT NULL);

CREATE POLICY "student_documents_update" ON public.student_documents 
FOR UPDATE TO authenticated 
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
)
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
);

CREATE POLICY "student_documents_delete" ON public.student_documents 
FOR DELETE TO authenticated 
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
);

DROP POLICY IF EXISTS "Public Access" ON public.template_metadata;
DROP POLICY IF EXISTS "Public Read" ON public.template_metadata;
DROP POLICY IF EXISTS "Public Insert" ON public.template_metadata;
DROP POLICY IF EXISTS "Public Update" ON public.template_metadata;
DROP POLICY IF EXISTS "Public Delete" ON public.template_metadata;
DROP POLICY IF EXISTS "Enable all access for prototype" ON public.template_metadata;
DROP POLICY IF EXISTS "Allow public read template_metadata" ON public.template_metadata;
DROP POLICY IF EXISTS "Allow public insert template_metadata" ON public.template_metadata;
DROP POLICY IF EXISTS "Allow public update template_metadata" ON public.template_metadata;
DROP POLICY IF EXISTS "Allow public delete template_metadata" ON public.template_metadata;
DROP POLICY IF EXISTS "template_metadata_policy" ON public.template_metadata;
DROP POLICY IF EXISTS "template_metadata_select" ON public.template_metadata;
DROP POLICY IF EXISTS "template_metadata_insert" ON public.template_metadata;
DROP POLICY IF EXISTS "template_metadata_update" ON public.template_metadata;
DROP POLICY IF EXISTS "template_metadata_delete" ON public.template_metadata;

CREATE POLICY "template_metadata_select" ON public.template_metadata 
FOR SELECT TO authenticated, anon 
USING (true);

CREATE POLICY "template_metadata_insert" ON public.template_metadata 
FOR INSERT TO authenticated 
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
);

CREATE POLICY "template_metadata_update" ON public.template_metadata 
FOR UPDATE TO authenticated 
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
)
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
);

CREATE POLICY "template_metadata_delete" ON public.template_metadata 
FOR DELETE TO authenticated 
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
    OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
);
