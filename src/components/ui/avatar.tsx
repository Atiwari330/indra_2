import { getInitials, avatarHue } from '@/lib/format';

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
}

export function Avatar({ firstName, lastName, size = 40 }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const hue = avatarHue(`${firstName} ${lastName}`);
  const fontSize = size * 0.4;

  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize,
        background: `hsl(${hue}, 60%, 50%)`,
      }}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}
