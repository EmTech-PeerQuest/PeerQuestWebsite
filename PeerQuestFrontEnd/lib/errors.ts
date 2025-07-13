// lib/errors.ts

export class TokenInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenInvalidError";
  }
}

export class BannedUserError extends Error {
  reason: string;
  expiresAt?: string | null;
  constructor(reason: string, expiresAt?: string | null) {
    super("User is banned: " + reason);
    this.name = "BannedUserError";
    this.reason = reason;
    this.expiresAt = expiresAt;
  }
}

export function extractErrorMessages(errorData: any): string[] {
  if (!errorData) return [];
  if (typeof errorData === 'string') return [errorData];
  if (Array.isArray(errorData)) return errorData.flatMap(extractErrorMessages);
  if (typeof errorData === 'object') return Object.values(errorData).flatMap(extractErrorMessages);
  return [];
}
