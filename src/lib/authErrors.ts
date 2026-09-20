/**
 * authErrors.ts
 * Centralized error sanitization for authentication and session flows.
 *
 * Eliminates raw browser runtime exceptions (e.g. "TypeError: Failed to fetch", SQL codes)
 * and translates auth failures into clear, user-friendly, professional messages.
 */

export function formatAuthError(error: unknown, isInitialLoad = false): string {
  if (!error) return '';

  const rawMessage = (
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : typeof (error as any)?.error_description === 'string'
      ? (error as any).error_description
      : typeof (error as any)?.message === 'string'
      ? (error as any).message
      : String(error)
  ).trim();

  if (!rawMessage) return '';

  const lower = rawMessage.toLowerCase();

  // Network / server connection failures
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('fetch failed') ||
    lower.includes('load failed') ||
    lower.includes('network request failed') ||
    lower.includes('err_connection_refused') ||
    lower.includes('econnrefused')
  ) {
    if (isInitialLoad) {
      // Suppress on initial page load / passive background probes
      return '';
    }
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Invalid credentials
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_grant') ||
    lower.includes('invalid_credentials') ||
    lower.includes('invalid email or password') ||
    lower.includes('incorrect password') ||
    lower.includes('the password you entered is incorrect')
  ) {
    return 'The email or password you entered is incorrect.';
  }

  // Rate limiting / throttling
  if (
    lower.includes('too many requests') ||
    lower.includes('rate limit') ||
    lower.includes('over_request_rate_limit') ||
    lower.includes('security purposes')
  ) {
    return 'Too many sign-in attempts. Please wait a moment before trying again.';
  }

  // Account unconfirmed / inactive
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Your email address has not been verified yet. Please check your inbox.';
  }

  // User not found
  if (lower.includes('user not found')) {
    return "We couldn't find an account with that email address.";
  }

  // TOTP / MFA verification failures
  if (
    lower.includes('invalid totp') ||
    lower.includes('invalid code') ||
    lower.includes('incorrect code') ||
    lower.includes('factor not found')
  ) {
    return 'Incorrect authenticator code. Please check your authenticator app and try again.';
  }

  // Password change / validation failures
  if (lower.includes('passwords do not match')) {
    return 'The new passwords do not match.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }

  // Suppress technical internal / database errors
  if (
    lower.includes('pgrst') ||
    lower.includes('supabase') ||
    lower.includes('jwt') ||
    lower.includes('token') ||
    lower.includes('internal server error') ||
    lower.includes('database error')
  ) {
    return 'Unable to complete sign-in at this time. Please try again.';
  }

  // If already a clean user-facing sentence without code syntax
  if (rawMessage.length < 120 && !rawMessage.includes('{') && !rawMessage.includes('HTTP')) {
    return rawMessage;
  }

  return 'An unexpected error occurred. Please try again.';
}

