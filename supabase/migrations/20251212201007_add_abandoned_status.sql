-- Add abandoned status to recovery_status enum
-- This status is used when an owner decides not to pick up a dropped-off disc
-- The disc becomes ownerless and can be claimed by anyone who finds it
ALTER TYPE recovery_status ADD VALUE 'abandoned';

-- Add disc_abandoned notification type for notifying the finder
ALTER TYPE notification_type ADD VALUE 'disc_abandoned';
