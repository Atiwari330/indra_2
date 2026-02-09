/**
 * Permissive UUID format regex.
 * Accepts any 8-4-4-4-12 hex string without enforcing RFC 4122 version/variant bits.
 * PostgreSQL's uuid type doesn't enforce these bits either.
 */
export const uuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
