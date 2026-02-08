/**
 * Get initials from a full name (up to 2 characters).
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Generate a deterministic hue (0-360) from a name string.
 * Used for avatar background colors.
 */
export function avatarHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

/**
 * Format a date string as "MMM D, YYYY" (e.g., "Jan 15, 1990").
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a full name from first + last.
 */
export function formatName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

/**
 * Compute age in years from a date-of-birth string (YYYY-MM-DD).
 */
export function computeAge(dob: string): number {
  const birth = new Date(dob + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
