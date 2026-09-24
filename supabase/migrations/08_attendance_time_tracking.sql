-- Authenticated time-in/time-out attendance with supervisor verification.
-- Apply after 04_verified_auth.sql because this migration relies on portal_role()
-- and can_access_student().
BEGIN;

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  work_date date NOT NULL DEFAULT (timezone('Asia/Manila', now())::date),
  time_in timestamptz NOT NULL DEFAULT now(),
  time_out timestamptz,
  break_minutes integer NOT NULL DEFAULT 0 CHECK (break_minutes BETWEEN 0 AND 180),
  rendered_minutes integer NOT NULL DEFAULT 0 CHECK (rendered_minutes BETWEEN 0 AND 960),
  activity_note text,
  evidence_path text,
  evidence_mime text,
  evidence_bytes integer CHECK (evidence_bytes IS NULL OR evidence_bytes BETWEEN 1 AND 5242880),
  evidence_uploaded_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'verified', 'rejected')),
  reviewer_remarks text,
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_time_order CHECK (time_out IS NULL OR time_out > time_in),
  CONSTRAINT attendance_activity_length CHECK (activity_note IS NULL OR length(activity_note) <= 500),
  CONSTRAINT attendance_remarks_length CHECK (reviewer_remarks IS NULL OR length(reviewer_remarks) <= 500),
  CONSTRAINT attendance_evidence_shape CHECK (
    (evidence_path IS NULL AND evidence_mime IS NULL AND evidence_bytes IS NULL AND evidence_uploaded_at IS NULL)
    OR (evidence_path IS NOT NULL AND evidence_mime IN ('image/jpeg', 'image/png', 'image/webp')
      AND evidence_bytes IS NOT NULL AND evidence_uploaded_at IS NOT NULL)
  ),
  CONSTRAINT attendance_status_shape CHECK (
    (status = 'open' AND time_out IS NULL AND verified_by IS NULL AND verified_at IS NULL)
    OR (status IN ('pending', 'rejected') AND time_out IS NOT NULL AND evidence_path IS NOT NULL
      AND verified_by IS NULL AND verified_at IS NULL)
    OR (status = 'verified' AND time_out IS NOT NULL AND evidence_path IS NOT NULL
      AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
  ),
  UNIQUE (student_id, work_date)
);

CREATE INDEX IF NOT EXISTS attendance_student_date_idx
  ON public.attendance_records(student_id, work_date DESC);
CREATE INDEX IF NOT EXISTS attendance_review_queue_idx
  ON public.attendance_records(status, work_date DESC);

CREATE OR REPLACE FUNCTION public.set_attendance_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.set_attendance_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS attendance_updated_at ON public.attendance_records;
CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_attendance_updated_at();

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.attendance_records FROM anon, authenticated;
GRANT SELECT ON public.attendance_records TO authenticated;

DROP POLICY IF EXISTS attendance_read ON public.attendance_records;
CREATE POLICY attendance_read ON public.attendance_records FOR SELECT TO authenticated
  USING (public.can_access_student(student_id));

INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('attendance-evidence', 'attendance-evidence', false, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS attendance_evidence_insert ON storage.objects;
CREATE POLICY attendance_evidence_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'attendance-evidence'
  AND public.portal_role() = 'student'
  AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  AND split_part(name, '/', 2) ~ '^[0-9a-fA-F-]{36}$'
  AND EXISTS (
    SELECT 1 FROM public.attendance_records a
    WHERE a.id = split_part(name, '/', 2)::uuid
      AND a.student_id = (SELECT auth.uid())
      AND a.status IN ('open', 'rejected')
  )
);

DROP POLICY IF EXISTS attendance_evidence_read ON storage.objects;
CREATE POLICY attendance_evidence_read ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'attendance-evidence'
  AND split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
  AND public.can_access_student(split_part(name, '/', 1)::uuid)
);

CREATE OR REPLACE FUNCTION public.attendance_time_in()
RETURNS public.attendance_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  result public.attendance_records;
  today date := timezone('Asia/Manila', now())::date;
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only an authenticated student can time in.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.supervisor_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'A company supervisor must be assigned before attendance can be recorded.';
  END IF;

  INSERT INTO public.attendance_records(student_id, work_date, time_in, status)
  VALUES ((SELECT auth.uid()), today, now(), 'open')
  RETURNING * INTO result;
  RETURN result;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Attendance has already been started for today.';
END;
$$;

CREATE OR REPLACE FUNCTION public.attendance_time_out(activity text)
RETURNS public.attendance_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  current_record public.attendance_records;
  total_minutes integer;
  deducted_break integer;
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only an authenticated student can time out.';
  END IF;
  IF length(trim(coalesce(activity, ''))) NOT BETWEEN 3 AND 500 THEN
    RAISE EXCEPTION 'Describe today''s work in 3 to 500 characters.';
  END IF;

  SELECT * INTO current_record
  FROM public.attendance_records
  WHERE student_id = (SELECT auth.uid()) AND status = 'open' AND time_out IS NULL
  ORDER BY time_in DESC LIMIT 1 FOR UPDATE;

  IF current_record.id IS NULL THEN
    RAISE EXCEPTION 'No active time-in record was found.';
  END IF;
  IF current_record.evidence_path IS NULL THEN
    RAISE EXCEPTION 'Add a workplace photo before timing out.';
  END IF;
  total_minutes := floor(extract(epoch FROM (now() - current_record.time_in)) / 60);
  IF total_minutes < 1 THEN
    RAISE EXCEPTION 'Time out is available one minute after time in.';
  END IF;
  IF total_minutes > 960 THEN
    RAISE EXCEPTION 'This shift exceeds 16 hours and requires administrator review.';
  END IF;
  deducted_break := CASE WHEN total_minutes >= 300 THEN 60 ELSE 0 END;

  UPDATE public.attendance_records
  SET time_out = now(), break_minutes = deducted_break,
      rendered_minutes = greatest(total_minutes - deducted_break, 0),
      activity_note = trim(activity), status = 'pending', reviewer_remarks = NULL
  WHERE id = current_record.id
  RETURNING * INTO current_record;
  RETURN current_record;
END;
$$;

CREATE OR REPLACE FUNCTION public.attendance_attach_evidence(
  record_id uuid, object_path text, mime_type text, byte_size integer
)
RETURNS public.attendance_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result public.attendance_records;
BEGIN
  IF public.portal_role() <> 'student' THEN RAISE EXCEPTION 'Only a signed-in student can attach evidence.'; END IF;
  IF mime_type NOT IN ('image/jpeg', 'image/png', 'image/webp') OR byte_size NOT BETWEEN 1 AND 5242880 THEN
    RAISE EXCEPTION 'Use a JPEG, PNG, or WebP image up to 5 MB.';
  END IF;
  IF object_path !~ ('^' || (SELECT auth.uid())::text || '/' || record_id::text || '/[0-9a-fA-F-]+\.(jpg|png|webp)$') THEN
    RAISE EXCEPTION 'The evidence storage path is invalid.';
  END IF;

  UPDATE public.attendance_records
  SET evidence_path = object_path, evidence_mime = mime_type,
      evidence_bytes = byte_size, evidence_uploaded_at = now()
  WHERE id = record_id AND student_id = (SELECT auth.uid()) AND status IN ('open', 'rejected')
  RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Evidence can only be added to your open or returned record.'; END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.attendance_resubmit(record_id uuid, activity text)
RETURNS public.attendance_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result public.attendance_records;
BEGIN
  IF public.portal_role() <> 'student' OR length(trim(coalesce(activity, ''))) NOT BETWEEN 3 AND 500 THEN
    RAISE EXCEPTION 'A signed-in student and a 3 to 500 character work summary are required.';
  END IF;
  UPDATE public.attendance_records
  SET activity_note = trim(activity), status = 'pending', reviewer_remarks = NULL
  WHERE id = record_id AND student_id = (SELECT auth.uid()) AND status = 'rejected'
  RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Only your rejected attendance record can be resubmitted.'; END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_attendance(record_id uuid, decision text, remarks text DEFAULT NULL)
RETURNS public.attendance_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  result public.attendance_records;
  target_student uuid;
  reviewer_role text := public.portal_role();
BEGIN
  IF reviewer_role NOT IN ('supervisor', 'admin') THEN
    RAISE EXCEPTION 'Only the assigned supervisor or an administrator can verify attendance.';
  END IF;
  IF decision NOT IN ('verified', 'rejected') THEN RAISE EXCEPTION 'Choose verified or rejected.'; END IF;
  IF decision = 'rejected' AND length(trim(coalesce(remarks, ''))) NOT BETWEEN 3 AND 500 THEN
    RAISE EXCEPTION 'Rejection remarks must contain 3 to 500 characters.';
  END IF;

  SELECT student_id INTO target_student FROM public.attendance_records WHERE id = record_id AND status = 'pending';
  IF target_student IS NULL OR NOT public.can_access_student(target_student) THEN
    RAISE EXCEPTION 'This pending attendance record is not available to you.';
  END IF;

  UPDATE public.attendance_records
  SET status = decision,
      reviewer_remarks = nullif(trim(coalesce(remarks, '')), ''),
      verified_by = CASE WHEN decision = 'verified' THEN (SELECT auth.uid()) ELSE NULL END,
      verified_at = CASE WHEN decision = 'verified' THEN now() ELSE NULL END
  WHERE id = record_id AND status = 'pending'
  RETURNING * INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.attendance_time_in(), public.attendance_time_out(text),
  public.attendance_attach_evidence(uuid,text,text,integer), public.attendance_resubmit(uuid,text),
  public.review_attendance(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attendance_time_in(), public.attendance_time_out(text),
  public.attendance_attach_evidence(uuid,text,text,integer), public.attendance_resubmit(uuid,text),
  public.review_attendance(uuid,text,text) TO authenticated;

COMMIT;
