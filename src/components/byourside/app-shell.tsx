import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import Avatar from '../Avatar';
import {
  ChatBubbleIcon,
  CompassIcon,
  HelpIcon,
  HomeIcon,
  LogoutIcon,
  PlusIcon,
  UsersIcon,
} from '../Icons';
import { Button, IconButton, PresenceGlyph } from './ui';

export type AppShellRoute =
  | 'feed'
  | 'discover'
  | 'create'
  | 'notifications'
  | 'profile'
  | 'messages'
  | 'companion'
  | 'help'
  | 'login'
  | 'register'
  | 'post';

export type AppShellWidth = 'xl' | '2xl' | '5xl';

export type AppShellUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type AppShellProps = {
  active: AppShellRoute;
  onNavigate: (route: AppShellRoute) => void;
  children: ReactNode;
  width?: AppShellWidth;
  bare?: boolean;
  unread?: { messages?: number };
  authenticated?: boolean;
  user?: AppShellUser | null;
  onLogout?: () => void;
  notificationSlot?: ReactNode;
};

const widthClass: Record<AppShellWidth, string> = {
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '5xl': 'max-w-5xl',
};

export function AppShell({
  active,
  onNavigate,
  children,
  width = '2xl',
  bare = false,
  unread,
  authenticated = false,
  user = null,
  onLogout,
  notificationSlot,
}: AppShellProps) {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-aurora-a rounded-full bg-presence/[0.05] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 animate-aurora-b rounded-full bg-listening/[0.05] blur-3xl"
      />

      <AppHeader
        active={active}
        onNavigate={onNavigate}
        unread={unread}
        authenticated={authenticated}
        user={user}
        onLogout={onLogout}
        notificationSlot={notificationSlot}
      />
      <MobileTabBar
        active={active}
        onNavigate={onNavigate}
        unread={unread}
        authenticated={authenticated}
      />

      <main
        className={cn(
          'relative z-0 flex min-h-0 w-full flex-1 flex-col',
          bare
            ? 'overflow-hidden'
            : cn('mx-auto overflow-y-auto px-4 py-8 sm:px-6', widthClass[width], 'pb-28 md:pb-8'),
        )}
      >
        {children}
      </main>
    </div>
  );
}

function AppHeader({
  active,
  onNavigate,
  unread,
  authenticated,
  user,
  onLogout,
  notificationSlot,
}: Omit<AppShellProps, 'children' | 'width' | 'bare'>) {
  return (
    <header className="relative z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 md:h-16 md:gap-4 md:px-6">
        <button
          type="button"
          onClick={() => onNavigate('feed')}
          className="flex min-w-0 items-center gap-2 rounded-full pr-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:pr-2"
        >
          <PresenceGlyph className="h-7 w-7 shrink-0 md:h-8 md:w-8" />
          <span className="truncate font-serif text-lg text-foreground md:text-xl">ByYourSide</span>
        </button>

        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Principal">
          <NavTextButton
            label="Inicio"
            current={active === 'feed' || active === 'post'}
            onClick={() => onNavigate('feed')}
          />
          <NavTextButton
            label="Descubrir"
            current={active === 'discover'}
            onClick={() => onNavigate('discover')}
          />
          <NavTextButton
            label="Compañía"
            current={active === 'companion'}
            onClick={() => onNavigate('companion')}
          />
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <span className="md:hidden">
            <IconButton label="Modo compañía" onClick={() => onNavigate('companion')}>
              <UsersIcon />
            </IconButton>
          </span>
          <IconButton label="Ayuda" onClick={() => onNavigate('help')}>
            <HelpIcon />
            {active === 'help' ? <ActiveDot /> : null}
          </IconButton>
          <span className="hidden md:inline-flex">
            <IconButton label="Mensajes" onClick={() => onNavigate('messages')}>
              <ChatBubbleIcon />
              <UnreadDot count={unread?.messages} />
            </IconButton>
          </span>
          {notificationSlot}

          <span className="hidden md:inline-flex">
            <Button size="sm" className="ml-2" onClick={() => onNavigate('create')}>
              Compartir
            </Button>
          </span>

          {authenticated && user ? (
            <UserMenu user={user} onNavigate={onNavigate} onLogout={onLogout} />
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="ml-1"
              onClick={() => onNavigate('login')}
            >
              Ingresar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileTabBar({
  active,
  onNavigate,
  unread,
  authenticated,
}: Pick<AppShellProps, 'active' | 'onNavigate' | 'unread' | 'authenticated'>) {
  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="grid h-16 grid-cols-5 items-end px-2">
        <MobileTab
          label="Inicio"
          current={active === 'feed' || active === 'post'}
          onClick={() => onNavigate('feed')}
        >
          <HomeIcon />
        </MobileTab>
        <MobileTab
          label="Descubrir"
          current={active === 'discover'}
          onClick={() => onNavigate('discover')}
        >
          <CompassIcon />
        </MobileTab>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onNavigate('create')}
            aria-label="Compartir"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-presence text-presence-foreground shadow-lift transition-all duration-200 ease-[var(--ease-calm)] hover:bg-presence-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
        <MobileTab
          label="Mensajes"
          current={active === 'messages'}
          onClick={() => onNavigate('messages')}
          badge={unread?.messages}
        >
          <ChatBubbleIcon />
        </MobileTab>
        <MobileTab
          label="Perfil"
          current={active === 'profile'}
          onClick={() => onNavigate(authenticated ? 'profile' : 'login')}
        >
          <UsersIcon />
        </MobileTab>
      </div>
    </nav>
  );
}

function NavTextButton({
  label,
  current,
  onClick,
}: {
  label: string;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-[var(--ease-calm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        current
          ? 'bg-presence-soft text-presence-strong'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

function MobileTab({
  label,
  current,
  onClick,
  badge,
  children,
}: {
  label: string;
  current: boolean;
  onClick: () => void;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'relative flex min-h-12 flex-col items-center justify-center gap-0.5 pb-2 text-[0.65rem] font-medium transition-colors duration-200 ease-[var(--ease-calm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        current ? 'text-presence-strong' : 'text-muted-foreground',
      )}
    >
      <span className="relative">
        {children}
        <UnreadDot count={badge} />
      </span>
      {label}
    </button>
  );
}

function UnreadDot({ count }: { count?: number }) {
  if (!count || count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-listening px-1 text-[10px] font-medium text-listening-foreground">
      {count > 9 ? '9+' : count}
    </span>
  );
}

function ActiveDot() {
  return (
    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-presence" aria-hidden="true" />
  );
}

function UserMenu({
  user,
  onNavigate,
  onLogout,
}: {
  user: AppShellUser;
  onNavigate: (route: AppShellRoute) => void;
  onLogout?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = user.displayName || user.username;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        data-testid="user-menu-trigger"
        className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Avatar avatarUrl={user.avatarUrl} name={name} size="sm" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-30 w-48 animate-fade-slide-in rounded-2xl border border-border bg-card p-1 shadow-lift">
          <p className="truncate px-3 py-2 text-sm font-medium text-foreground">{name}</p>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onNavigate('profile');
            }}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Mi perfil
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            data-testid="logout-button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogoutIcon className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
