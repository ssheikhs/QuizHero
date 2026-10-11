import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;

const ERROR_MESSAGES = {
  USER_ALREADY_EXISTS: "An account with this email already exists. Please log in.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists. Please log in.",
  // One message for both "no account" and "wrong password", so emails can't be probed.
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  PASSWORD_TOO_LONG: "Password is too long.",
};

export function authErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  return ERROR_MESSAGES[error.code] ?? error.message ?? fallback;
}
