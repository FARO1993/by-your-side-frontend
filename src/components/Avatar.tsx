export default function Avatar({
  avatarUrl,
  name,
  size = 'md',
}: {
  avatarUrl: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = { sm: 'h-8 w-8 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-20 w-20 text-xl' }[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-mist font-medium text-dusk`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}