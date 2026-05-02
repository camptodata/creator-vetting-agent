"use client";

interface Props {
  error?: string;
  message?: string;
}

const ERROR_COPY: Record<string, string> = {
  anon_disabled: "Guest sign-in is not enabled. Use email sign-in instead.",
  auth_callback_failed: "Sign-in failed. Try again.",
  missing_token: "Sign-in link is invalid or expired. Try again.",
};

function resolveError(code: string): string {
  return ERROR_COPY[code] ?? code;
}

export function SignInMessages({ error, message }: Props) {
  if (!error && !message) return null;

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {resolveError(error)}
        </div>
      )}
      {message && (
        <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {message}
        </div>
      )}
    </div>
  );
}
