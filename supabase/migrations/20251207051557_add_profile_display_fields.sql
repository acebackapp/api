-- Add display name fields to profiles table
-- username: unique handle chosen by user
-- full_name: user's full name
-- display_preference: whether to show username or full_name publicly

-- Create enum for display preference
CREATE TYPE "public"."display_preference" AS ENUM('username', 'full_name');

-- Add new columns to profiles
ALTER TABLE "public"."profiles"
ADD COLUMN "username" text UNIQUE,
ADD COLUMN "full_name" text,
ADD COLUMN "display_preference" "display_preference" DEFAULT 'username';

-- Create index for username lookups
CREATE INDEX "profiles_username_idx" ON "public"."profiles"("username");

-- Add comment
COMMENT ON COLUMN "public"."profiles"."username" IS 'Unique handle chosen by user';
COMMENT ON COLUMN "public"."profiles"."full_name" IS 'User full name';
COMMENT ON COLUMN "public"."profiles"."display_preference" IS 'Whether to show username or full_name publicly';
