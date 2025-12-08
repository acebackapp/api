-- Fix RLS policies to handle ownership transfers
-- After a disc is surrendered, the original owner should still be able to view
-- the recovery event they were part of, and the new owner needs access to photos.

-- Allow original owners to view recovery events where they were the original owner
CREATE POLICY "Original owners can view surrendered recovery events"
  ON "public"."recovery_events"
  FOR SELECT
  USING (original_owner_id = auth.uid());

-- Allow disc photos to be viewed by anyone who was involved in a recovery for that disc
-- This covers: current owner, finders, and original owners after surrender
DROP POLICY IF EXISTS "Users can read photos of own discs" ON "public"."disc_photos";

CREATE POLICY "Users can read photos of discs they own or are recovering"
  ON "public"."disc_photos"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "public"."discs"
      WHERE "discs"."id" = "disc_photos"."disc_id"
      AND "discs"."owner_id" = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "public"."recovery_events" re
      JOIN "public"."discs" d ON d.id = re.disc_id
      WHERE d.id = "disc_photos"."disc_id"
      AND (re.finder_id = auth.uid() OR re.original_owner_id = auth.uid())
    )
  );

-- Allow new owners to insert/delete photos for their discs
-- (existing policies already handle this since they check current owner_id)

-- Fix storage bucket policy for disc photos
-- The original policy only allowed reading files in folders matching the user's ID
-- After ownership transfer, the new owner needs to read files in the original owner's folder
DROP POLICY IF EXISTS "Users can read own disc photos" ON storage.objects;

CREATE POLICY "Users can read disc photos they own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'disc-photos' AND
  (
    -- Original behavior: user can read their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- New: current disc owner can read photos regardless of folder
    EXISTS (
      SELECT 1 FROM public.discs
      WHERE discs.id::text = (storage.foldername(name))[2]
      AND discs.owner_id = auth.uid()
    )
  )
);
