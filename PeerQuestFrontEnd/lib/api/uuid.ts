// Utility for UUID validation and conversion
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return typeof uuid === 'string' && uuidRegex.test(uuid.trim());
}

export function toUUIDString(id: string | number): string {
  if (typeof id === 'number') return String(id);
  if (typeof id === 'string') return id.trim();
  return '';
}
