-- 1. Master Templates Table
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    phase TEXT NOT NULL CHECK (phase IN ('before_ojt', 'in_ojt', 'final')),
    current_version_id UUID, -- References active document_template_versions.id
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Immutable Template Versions Table
CREATE TABLE IF NOT EXISTS public.document_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    schema_json JSONB NOT NULL, -- Holds the StructuredDocument layout tree
    mapping_rules JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of MappingRule objects
    status TEXT NOT NULL CHECK (status IN ('draft', 'needs_mapping', 'ready', 'published', 'archived')),
    published_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_template_version UNIQUE (template_id, version_number)
);

-- Circular foreign key for active version lookup
ALTER TABLE public.document_templates 
ADD CONSTRAINT fk_current_version 
FOREIGN KEY (current_version_id) 
REFERENCES public.document_template_versions(id) 
ON DELETE SET NULL;

-- 3. Student Document Instances Table
CREATE TABLE IF NOT EXISTS public.document_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE RESTRICT,
    template_version_id UUID NOT NULL REFERENCES public.document_template_versions(id) ON DELETE RESTRICT,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    instance_version INT NOT NULL DEFAULT 1, -- Incremented on atomic DB update
    field_values JSONB NOT NULL DEFAULT '{}'::jsonb, -- Key-value map of FieldValue objects
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'adviser_review', 'revision_required', 'approved', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_instances_updated_at
    BEFORE UPDATE ON public.document_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Document Instance Integrity & Monotonic Version Trigger Function
CREATE OR REPLACE FUNCTION validate_document_instance_integrity()
RETURNS TRIGGER AS $$
DECLARE
    parent_template_id UUID;
    user_role TEXT;
BEGIN
    -- Extract JWT Role using COALESCE (supports top-level, app_metadata, and user_metadata)
    user_role := COALESCE(
        auth.jwt() ->> 'role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        auth.jwt() -> 'user_metadata' ->> 'role'
    );

    -- Verify that template_version_id belongs to the template_id stated
    SELECT template_id INTO parent_template_id 
    FROM public.document_template_versions 
    WHERE id = NEW.template_version_id;

    IF parent_template_id IS NULL OR parent_template_id <> NEW.template_id THEN
        RAISE EXCEPTION 'Mismatched template_version_id and template_id.';
    END IF;

    -- On UPDATE, enforce immutable columns and monotonic instance_version increments
    IF TG_OP = 'UPDATE' THEN
        -- Enforce optimistic locking version integrity (must remain unchanged or increment by exactly 1)
        IF OLD.instance_version IS DISTINCT FROM NEW.instance_version 
           AND NEW.instance_version IS DISTINCT FROM (OLD.instance_version + 1) THEN
            RAISE EXCEPTION 'instance_version must increment by exactly 1 or remain unchanged.';
        END IF;

        -- Prevent non-admin/adviser roles from altering immutable structural references
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
$$ language 'plpgsql';

CREATE TRIGGER trigger_validate_document_instance_integrity
    BEFORE INSERT OR UPDATE ON public.document_instances
    FOR EACH ROW
    EXECUTE FUNCTION validate_document_instance_integrity();

-- Indexes for Fast Query Performance
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON public.document_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_document_instances_student_id ON public.document_instances(student_id);
CREATE INDEX IF NOT EXISTS idx_document_instances_template_version ON public.document_instances(template_version_id);
CREATE INDEX IF NOT EXISTS idx_document_instances_status ON public.document_instances(status);
CREATE INDEX IF NOT EXISTS idx_document_instances_student_status ON public.document_instances(student_id, status);
CREATE INDEX IF NOT EXISTS idx_document_templates_phase_cat ON public.document_templates(phase, category);

-- Partial Unique Index (Prevents duplicate in-flight active submissions per student per template)
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_student_instance 
ON public.document_instances(student_id, template_id) 
WHERE status NOT IN ('archived', 'approved');

-- Enable Row Level Security (RLS)
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_instances ENABLE ROW LEVEL SECURITY;

-- Note: Admin template creation/editing bypasses RLS via Supabase Service Role Key on the backend.
CREATE POLICY "Public templates are viewable by authenticated users" 
ON public.document_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public template versions are viewable by authenticated users" 
ON public.document_template_versions FOR SELECT TO authenticated USING (true);

-- Document Instances RLS Policies (Separated for Student vs Adviser Security)
CREATE POLICY "Students can view their own document instances" 
ON public.document_instances FOR SELECT TO authenticated 
USING (
    student_id = auth.uid()::text 
    OR COALESCE(auth.jwt() ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'adviser')
);

CREATE POLICY "Students can insert their own document instances" 
ON public.document_instances FOR INSERT TO authenticated 
WITH CHECK (
    student_id = auth.uid()::text 
    AND status = 'draft'
    AND EXISTS (
        SELECT 1 FROM public.document_template_versions v
        WHERE v.id = template_version_id AND v.status = 'published'
    )
);

CREATE POLICY "Students can update their own draft or revision instances" 
ON public.document_instances FOR UPDATE TO authenticated 
USING (student_id = auth.uid()::text AND status IN ('draft', 'revision_required'))
WITH CHECK (student_id = auth.uid()::text AND status IN ('draft', 'submitted', 'revision_required'));

CREATE POLICY "Advisers and admins can review and update instances" 
ON public.document_instances FOR UPDATE TO authenticated 
USING (
    COALESCE(auth.jwt() ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'adviser')
)
WITH CHECK (
    COALESCE(auth.jwt() ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'adviser')
);
