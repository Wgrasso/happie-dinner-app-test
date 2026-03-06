-- Migration: Add group_messages table for ephemeral group chat
-- Messages are deleted at midnight (via cleanup query on app load or scheduled job)

CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_group_messages_group_date ON public.group_messages (group_id, created_at DESC);
CREATE INDEX idx_group_messages_cleanup ON public.group_messages (created_at);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Members can read messages in their groups
CREATE POLICY "Group members can read messages"
  ON public.group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_messages.group_id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

-- Members can insert messages in their groups
CREATE POLICY "Group members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_messages.group_id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON public.group_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Cleanup function: delete messages older than today
CREATE OR REPLACE FUNCTION public.cleanup_old_group_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.group_messages
  WHERE created_at < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_old_group_messages() TO authenticated;
