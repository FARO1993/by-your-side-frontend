import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Bell,
  Compass,
  Heart,
  Home,
  LifeBuoy,
  LogOut,
  MessageCircle,
  Plus,
  User,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import Avatar from '../Avatar';
import { Button, IconButton } from './ui';
import { Logo } from './logo';

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
  unread?: { messages?: number; notifications?: number };
  authenticated?: boolean;
  user?: AppShellUser | null;
  onLogout?: () => void;
};

const widthClass: Record<AppShellWidth, string> = {
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '5xl': 'max-w-5xl',
};

const primaryNav = [
  { id: 'feed' as const, label: 'Inicio', icon: Home },
  { id: 'discover' as const, label: 'Descubrir', icon: Compass },
  { id: 'notifications' as const, label: 'Novedades', icon: Bell },
  { id: 'profile' as const, label: 'Perfil', icon: User },
];

export function AppShell({
  active,
  onNavigate,
  children,
  width = 'xl',
  bare = false,
  unread,
  authenticated = false,
  user = null,
  onLogout,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DesktopNav
        active={active}
        onNavigate={onNavigate}
        unread={unread}
        authenticated={authenticated}
        user={user}
        onLogout={onLogout}
      />
      <MobileTopBar
        active={active}
        onNavigate={onNavigate}
        unread={unread}
      />

      {bare ? (
        <div className="flex-1">{children}</div>
      ) : (
        <main
          className={cn(
            'mx-auto w-full px-4 pt-6 pb-28 sm:px-6 md:pt-8 md:pb-16',
            widthClass[width],
          )}
        >
          {children}
        </main>
      )}

      <MobileTabBar
        active={active}
        onNavigate={onNavigate}
        unread={unread}
        authenticated={authenticated}
      />
    </div>
  );
}

function DesktopNav({
  active,
  onNavigate,
  unread,
  authenticated,
  user,
  onLogout,
}: Omit<AppShellProps, 'children' | 'width' | 'bare'>) {
  return (
    <header className="sticky top-0 z-30 hidden h-16 border-b border-border/60 bg-background/80 backdrop-blur-md md:block">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-6">
        <button type="button" onClick={() => onNavigate('feed')} className="shrink-0 focus-visible:outline-none">
          <Logo wordmark />
        </button>

        <nav className="mx-auto flex items-center gap-1" aria-label="Principal">
          {primaryNav.map(({ id, label, icon: Icon }) => {
            const current = id === 'feed' ? active === 'feed' || active === 'post' : active === id;
            return (
              <button
                key={id}
                type="button"
                aria-current={current ? 'page' : undefined}
                onClick={() => onNavigate(id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ease-[var(--ease-calm)]',
                  current
                    ? 'bg-presence-soft text-presence-strong'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <IconButton
            label="Mensajes"
            className={active === 'messages' ? 'bg-presence-soft' : undefined}
            onClick={() => onNavigate('messages')}
          >
            <MessageCircle className="size-5" />
            {unread?.messages && unread.messages > 0 ? (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-presence ring-2 ring-background" />
            ) : null}
          </IconButton>
          <IconButton
            label="Ayuda"
            className={active === 'help' ? 'bg-listening-soft' : undefined}
            onClick={() => onNavigate('help')}
          >
            <LifeBuoy className="size-5" />
          </IconButton>
          <IconButton
            label="Modo compañía"
            className={active === 'companion' ? 'bg-listening-soft' : undefined}
            onClick={() => onNavigate('companion')}
          >
            <Heart className="size-5" />
          </IconButton>
          <Button size="sm" className="ml-2" onClick={() => onNavigate('create')}>
            <Plus className="size-4" />
            Compartir
          </Button>
          {authenticated && user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <Button size="sm" variant="outline" className="ml-1" onClick={() => onNavigate('login')}>
              Ingresar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileTopBar({
  active,
  onNavigate,
  unread,
}: Pick<AppShellProps, 'active' | 'onNavigate' | 'unread'>) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md md:hidden">
      <div className="flex h-14 items-center gap-2">
        <button type="button" onClick={() => onNavigate('feed')} className="mr-auto focus-visible:outline-none">
          <Logo wordmark />
        </button>
        <IconButton label="Mensajes" onClick={() => onNavigate('messages')}>
          <MessageCircle className="size-5" />
          {unread?.messages && unread.messages > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-presence ring-2 ring-background" />
          ) : null}
        </IconButton>
        <IconButton
          label="Ayuda"
          className={active === 'help' ? 'bg-listening-soft' : undefined}
          onClick={() => onNavigate('help')}
        >
          <LifeBuoy className="size-5" />
        </IconButton>
        <IconButton
          label="Modo compañía"
          className={active === 'companion' ? 'bg-listening-soft' : undefined}
          onClick={() => onNavigate('companion')}
        >
          <Heart className="size-5" />
        </IconButton>
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
  const tabs = [
    { id: 'feed' as const, label: 'Inicio', icon: Home },
    { id: 'discover' as const, label: 'Descubrir', icon: Compass },
    { id: 'create' as const, label: 'Compartir', icon: Plus, fab: true },
    { id: 'notifications' as const, label: 'Novedades', icon: Bell },
    { id: 'profile' as const, label: 'Perfil', icon: User },
  ];

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-end">
        {tabs.map(({ id, label, icon: Icon, fab }) => {
          if (fab) {
            return (
              <div key={id} className="flex flex-1 justify-center pb-2">
                <button
                  type="button"
                  aria-label="Compartir"
                  onClick={() => onNavigate('create')}
                  className="flex size-11 items-center justify-center rounded-full bg-presence text-presence-foreground shadow-soft active:scale-95"
                >
                  <Plus className="size-5" strokeWidth={2.5} />
                </button>
              </div>
            );
          }

          const current =
            id === 'feed' ? active === 'feed' || active === 'post' : active === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={current ? 'page' : undefined}
              onClick={() => onNavigate(id === 'profile' && !authenticated ? 'login' : id)}
              className={cn(
                'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium',
                current ? 'text-presence-strong' : 'text-muted-foreground',
              )}
            >
              <span className="relative">
                <Icon className="size-5" strokeWidth={current ? 2.4 : 2} />
                {id === 'notifications' && unread?.notifications && unread.notifications > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-presence" />
                ) : null}
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function UserMenu({
  user,
  onLogout,
}: {
  user: AppShellUser;
  onLogout?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = user.displayName || user.username;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative ml-1">
      <button
        type="button"
        data-testid="user-menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full transition-transform hover:scale-[1.03] focus-visible:outline-none"
      >
        <Avatar avatarUrl={user.avatarUrl} name={name} size="sm" />
      </button>
      {open ? (
        <div className="absolute top-12 right-0 z-30 w-48 rounded-2xl border border-border/60 bg-card p-1 shadow-lift">
          <p className="truncate px-3 py-2 text-sm font-medium">{name}</p>
          <button
            type="button"
            data-testid="logout-button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
          >
            <LogOut className="size-3.5" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
