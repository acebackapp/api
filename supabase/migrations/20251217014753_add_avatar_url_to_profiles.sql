-- Add avatar_url column to profiles table for custom profile photos
-- This stores the storage path (e.g., "{user_id}.jpg") for the profile-photos bucket
ALTER TABLE "public"."profiles"
ADD COLUMN "avatar_url" text;

COMMENT ON COLUMN "public"."profiles"."avatar_url"
IS 'Storage path for custom profile photo in profile-photos bucket';
