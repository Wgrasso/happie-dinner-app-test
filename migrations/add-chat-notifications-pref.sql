-- Migration: Add chat_notifications preference to profiles
-- Users can toggle this off in settings to stop receiving push notifications for chat messages

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chat_notifications BOOLEAN DEFAULT true;
