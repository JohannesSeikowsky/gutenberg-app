# Supabase OTP Reference (gathered 2026-03-20)

## Overview
Supabase Auth supports email OTP (6-digit code) as passwordless login. Email OTP is enabled by default. No SMS provider needed for email OTP.

## Flow
1. Call `signInWithOtp({ email })` → Supabase sends 6-digit code to email
2. User enters code → call `verifyOtp({ email, token, type: 'email' })` → returns session

## JavaScript API

### Send OTP
```js
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: true,   // auto-signup if new user (default: true)
    emailRedirectTo: 'https://example.com/welcome',  // for magic links only
  },
})
// Success: { data: { user: null, session: null }, error: null }
```

### Verify OTP
```js
const { data: { session }, error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456',
  type: 'email',
})
// Success: returns session with access_token, refresh_token, user object
```

## Python API

### Send OTP
```python
response = supabase.auth.sign_in_with_otp({
    "email": "user@example.com",
    "options": {
        "should_create_user": True,
    },
})
```

### Verify OTP
```python
response = supabase.auth.verify_otp({
    "email": "user@example.com",
    "token": "123456",
    "type": "email",
})
```

## Configuration
- **Email template**: To send OTP instead of magic link, change template to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`
  - Dashboard: Auth → Email Templates → Magic Link
- **OTP expiry**: Default 1 hour, configurable up to 86400s (1 day)
  - Dashboard: Auth → Providers → Email → Email OTP Expiration
- **Rate limit**: 1 request per 60 seconds per email by default

## verifyOtp types
| Type | Use case |
|------|----------|
| `email` | Sign-in/sign-up OTP |
| `sms` | Phone OTP |
| `recovery` | Password recovery |
| `email_change` | Email change verification |
| `phone_change` | Phone change verification |

## Key gotchas
- `signInWithOtp` auto-creates users by default — set `shouldCreateUser: false` to prevent
- Magic links and OTP share the same implementation; template determines which is sent
- OTP codes are 6 digits
- Phone OTP requires an SMS provider (Twilio, MessageBird, Vonage, or TextLocal)

## Sources
- https://supabase.com/docs/guides/auth/passwordless-login/auth-email-otp
- https://supabase.com/docs/reference/javascript/auth-signinwithotp
- https://supabase.com/docs/reference/javascript/auth-verifyotp
- https://supabase.com/docs/reference/python/auth-signinwithotp
- https://supabase.com/docs/reference/python/auth-verifyotp
