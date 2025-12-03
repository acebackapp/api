# Authentication Setup Guide

This guide documents the authentication configuration for the Discr application
using Supabase Auth.

## Overview

Supabase Auth provides authentication with multiple providers:

- **Email/Password:** Basic authentication with email verification
- **Google OAuth:** Social login via Google accounts
- **Apple Sign-In:** Deferred to post-MVP

## Email/Password Authentication

### Configuration Steps

1. Navigate to Supabase Dashboard → Authentication → Providers
1. Ensure **Email** provider is enabled
1. For MVP, disable email confirmation for faster testing:
   - Go to Authentication → Settings
   - Under "Email Auth", toggle OFF "Enable email confirmations"
   - This allows immediate login after signup without email verification

### Testing Email Auth

Create a test user via Supabase dashboard:

1. Go to Authentication → Users
1. Click "Add User"
1. Enter email and password
1. Click "Create User"
1. User should appear in the users list

## Google OAuth Configuration

### Prerequisites

- Google Cloud Console account
- Access to Supabase project settings

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
1. Click "Select a project" → "New Project"
1. Enter project name: `discr-mvp`
1. Click "Create"

### Step 2: Configure OAuth Consent Screen

1. Navigate to "APIs & Services" → "OAuth consent screen"
1. Select "External" user type
1. Click "Create"
1. Fill in required fields:
   - App name: `Discr`
   - User support email: Your email
   - Developer contact email: Your email
1. Click "Save and Continue"
1. Skip "Scopes" (click "Save and Continue")
1. Add test users if needed (optional for MVP)
1. Click "Save and Continue"
1. Review and click "Back to Dashboard"

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
1. Click "Create Credentials" → "OAuth client ID"
1. Select "Web application"
1. Enter name: `Discr Web Client`
1. Add Authorized redirect URIs:

   ```text
   https://xhaogdigrsiwxdjmjzgx.supabase.co/auth/v1/callback
   ```

   Replace `xhaogdigrsiwxdjmjzgx` with your Supabase project reference ID

1. Click "Create"
1. Copy the **Client ID** and **Client Secret**

### Step 4: Configure Supabase

1. Go to Supabase Dashboard → Authentication → Providers
1. Find "Google" in the list
1. Toggle it ON
1. Paste the **Client ID** from Google Cloud Console
1. Paste the **Client Secret** from Google Cloud Console
1. Click "Save"

### Testing Google OAuth

Test via Supabase Auth UI or application:

1. Go to your application's login page
1. Click "Sign in with Google"
1. Should redirect to Google login
1. After successful Google login, should redirect back to your app
1. New user should appear in Supabase Authentication → Users

## Redirect URLs

The redirect URL structure is:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

For the `discr-mvp` project:

```text
https://xhaogdigrsiwxdjmjzgx.supabase.co/auth/v1/callback
```

This must be configured in:

- Google Cloud Console OAuth credentials (Authorized redirect URIs)
- Any other OAuth providers you add

## Security Notes

### Production Considerations

When moving to production:

1. **Enable email confirmation** - Prevents spam accounts
1. **Review OAuth consent screen** - Submit for verification if needed
1. **Rotate secrets** - Store Client Secret securely (never commit to repo)
1. **Rate limiting** - Configure auth rate limits in Supabase
1. **Custom SMTP** - Configure custom email provider for better deliverability

### Environment Variables

OAuth credentials should NEVER be committed to version control. They are stored
in:

- Supabase Dashboard (encrypted by Supabase)
- Google Cloud Console (encrypted by Google)

No code changes are required in this repository for basic auth configuration.

## Apple Sign-In (Post-MVP)

Apple Sign-In is deferred to post-MVP. When implementing:

1. Enroll in Apple Developer Program ($99/year)
1. Create App ID and Service ID
1. Configure Sign in with Apple capability
1. Add redirect URL to Apple Developer Console
1. Enable Apple provider in Supabase
1. Add Client ID and Secret to Supabase

## Troubleshooting

### Google OAuth Not Working

1. **Check redirect URL** - Must exactly match Google Cloud Console
1. **Verify credentials** - Client ID and Secret must be correct
1. **OAuth consent screen** - Must be published (even in testing mode)
1. **Test users** - Add your Google account as a test user if in testing mode

### Email Not Sending

1. **Check SMTP settings** - Supabase uses default SMTP for MVP
1. **Spam folder** - Check spam for confirmation emails
1. **Email confirmation disabled** - Verify it's OFF for MVP testing

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
