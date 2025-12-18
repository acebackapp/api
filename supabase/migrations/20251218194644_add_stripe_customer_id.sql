-- Add stripe_customer_id to profiles table for billing address pre-fill
ALTER TABLE profiles
ADD COLUMN stripe_customer_id text UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe Customer ID for billing address pre-fill in checkout';
