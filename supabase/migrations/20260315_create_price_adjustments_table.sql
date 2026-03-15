CREATE TABLE public.appointment_price_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  note TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_price_adjustments_appointment_id ON public.appointment_price_adjustments(appointment_id);
ALTER TABLE public.appointment_price_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage price adjustments"
  ON public.appointment_price_adjustments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
