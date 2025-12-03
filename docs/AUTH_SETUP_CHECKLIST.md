# Auth Setup Checklist

This checklist tracks the manual configuration steps for Issue #3 (1.3: Supabase
Auth Configuration).

## Email/Password Authentication

- [ ] Navigate to Supabase Dashboard → Authentication → Providers
- [ ] Verify Email provider is enabled
- [ ] Go to Authentication → Settings
- [ ] Under "Email Auth", toggle OFF "Enable email confirmations"
- [ ] Test: Create a test user via Authentication → Users → Add User
- [ ] Verify: User appears in users list without requiring email confirmation

## Google OAuth Configuration

### Google Cloud Console Setup

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create new project named `discr-mvp`
- [ ] Navigate to "APIs & Services" → "OAuth consent screen"
- [ ] Select "External" user type
- [ ] Configure OAuth consent screen (App name: `Discr`, support email: your email)
- [ ] Save and continue through scopes (skip adding scopes)
- [ ] Add test users if needed (optional)
- [ ] Go to "APIs & Services" → "Credentials"
- [ ] Click "Create Credentials" → "OAuth client ID"
- [ ] Select "Web application"
- [ ] Name: `Discr Web Client`
- [ ] Add Authorized redirect URI:
  `https://xhaogdigrsiwxdjmjzgx.supabase.co/auth/v1/callback`
- [ ] Click "Create"
- [ ] Copy Client ID and Client Secret

### Supabase Configuration

- [ ] Go to Supabase Dashboard → Authentication → Providers
- [ ] Find "Google" provider
- [ ] Toggle Google provider ON
- [ ] Paste Client ID from Google Cloud Console
- [ ] Paste Client Secret from Google Cloud Console
- [ ] Click "Save"

## Testing

### Email Auth Test

- [ ] Create test user in Supabase dashboard
- [ ] Verify user can be created without email confirmation
- [ ] User appears in Authentication → Users list

### Google OAuth Test

- [ ] Test Google login via Supabase Auth UI or app
- [ ] Should redirect to Google login page
- [ ] After Google login, should redirect back successfully
- [ ] New user should appear in Supabase users list

## Apple Sign-In (Deferred)

- [ ] Noted for post-MVP implementation
- [ ] No action required at this time

## Completion

Once all checklist items are complete:

1. Update this checklist with completion status
1. Commit documentation changes
1. Create PR for Issue #3
1. Close issue after PR is merged

## Notes

Add any notes, issues, or observations during setup:

-
