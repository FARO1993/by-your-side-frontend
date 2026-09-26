import './auth-screen.css';

export function AuthLogoMotion() {
  return (
    <span className="auth-logo">
      <svg className="auth-logo-mark" viewBox="0 0 48 48" overflow="visible" aria-hidden="true">
        <g className="auth-logo-presence">
          <circle cx="18" cy="24" r="14" fill="none" stroke="var(--presence)" strokeWidth="3" />
        </g>
        <g className="auth-logo-listening">
          <circle cx="30" cy="24" r="14" fill="none" stroke="var(--listening)" strokeWidth="3" />
        </g>
      </svg>
    </span>
  );
}
