import type { ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChatNotificationsProvider, useChatNotifications } from '../context/ChatNotificationsContext';
import { useAuth } from '../context/AuthContext';
import { useNotificationUnread } from '../hooks/useNotificationUnread';
import { AppShell, type AppShellRoute, type AppShellWidth } from './byourside/app-shell';

function pathFromRoute(route: AppShellRoute, userId?: string): string {
  switch (route) {
    case 'discover':
      return '/discover';
    case 'messages':
      return '/messages';
    case 'companion':
      return '/companion';
    case 'help':
      return '/help';
    case 'profile':
      return userId ? `/profile/${userId}` : '/login';
    case 'login':
      return '/login';
    case 'register':
      return '/register';
    case 'create':
      return '/create';
    case 'notifications':
      return '/notifications';
    case 'feed':
    case 'post':
      return '/feed';
    default:
      return '/feed';
  }
}

function routeFromPath(pathname: string): AppShellRoute {
  if (pathname.startsWith('/messages')) return 'messages';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/posts')) return 'post';
  if (pathname.startsWith('/discover')) return 'discover';
  if (pathname.startsWith('/companion')) return 'companion';
  if (pathname.startsWith('/help')) return 'help';
  if (pathname.startsWith('/create')) return 'create';
  if (pathname.startsWith('/notifications')) return 'notifications';
  if (pathname.startsWith('/login')) return 'login';
  if (pathname.startsWith('/register')) return 'register';
  return 'feed';
}

function widthFromPath(pathname: string): AppShellWidth {
  if (pathname.startsWith('/profile') || pathname.startsWith('/discover') || pathname.startsWith('/companion') || pathname.startsWith('/help')) {
    return '2xl';
  }
  return 'xl';
}

function RouterAppShell({
  children,
  unreadMessages = 0,
  unreadNotifications = 0,
}: {
  children: ReactNode;
  unreadMessages?: number;
  unreadNotifications?: number;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const active = routeFromPath(location.pathname);
  const bare = location.pathname.startsWith('/messages');

  return (
    <AppShell
      active={active}
      onNavigate={(route) => navigate(pathFromRoute(route, user?.id))}
      width={widthFromPath(location.pathname)}
      bare={bare}
      unread={{ messages: unreadMessages, notifications: unreadNotifications }}
      authenticated={Boolean(user)}
      user={user}
      onLogout={() => {
        logout();
        navigate('/login');
      }}
    >
      {children}
    </AppShell>
  );
}

function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  const { unreadCount } = useChatNotifications();
  const { notificationUnread } = useNotificationUnread();
  return (
    <RouterAppShell unreadMessages={unreadCount} unreadNotifications={notificationUnread}>
      {children}
    </RouterAppShell>
  );
}

export default function Layout() {
  return (
    <ChatNotificationsProvider>
      <AuthenticatedAppShell>
        <Outlet />
      </AuthenticatedAppShell>
    </ChatNotificationsProvider>
  );
}

export function HelpLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user) {
    return (
      <ChatNotificationsProvider>
        <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
      </ChatNotificationsProvider>
    );
  }

  // Visitante sin sesion: layout minimo, sin tabs de navegacion de la app
  // (que llevan a rutas protegidas y solo generan confusion aca).
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
