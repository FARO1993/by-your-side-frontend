type IconProps = { className?: string };

export function BellIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 8a6 6 0 1112 0c0 3 1 5 1.5 6H4.5C5 13 6 11 6 8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.5 17a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PencilIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 20l1-4L16.5 4.5a1.5 1.5 0 012 2L7 18l-3 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon({ className = 'h-4 w-4', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} className={className}>
      <path
        d="M12 20s-7-4.6-9.5-9C.8 7.4 2.6 4 6 4c2 0 3.3 1.1 4 2.2C10.7 5.1 12 4 14 4c3.4 0 5.2 3.4 3.5 7-2.5 4.4-9.5 9-9.5 9z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowLeftIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- Iconos de estado ("Estoy acá") ---

export function WellIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12.5l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DistractionIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="6" cy="17" r="1.6" fill="currentColor" />
      <circle cx="12" cy="7" r="1.6" fill="currentColor" />
      <circle cx="18" cy="17" r="1.6" fill="currentColor" />
      <path d="M6 17C9 12 15 12 18 17M12 7v0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function DifficultDayIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 15a4 4 0 010-8 5 5 0 019.6 1.5A3.5 3.5 0 0117 15H7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function NeedToTalkIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 5h16v10H9l-3 3v-3H4V5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Reusa el motivo del logo: dos circulos superpuestos.
export function HereForSomeoneIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}