import type { ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChatNotificationsProvider, useChatNotifications } from '../context/ChatNotificationsContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { AppShell, type AppShellRoute } from './byourside/app-shell';

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
    case 'feed':
    case 'create':
    case 'post':
      return '/feed';
    case 'notifications':
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
  if (pathname.startsWith('/login')) return 'login';
  if (pathname.startsWith('/register')) return 'register';
  return 'feed';
}

function RouterAppShell({
  children,
  unreadMessages = 0,
  notificationSlot,
}: {
  children: ReactNode;
  unreadMessages?: number;
  notificationSlot?: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const active = routeFromPath(location.pathname);
  const bare = location.pathname.startsWith('/messages');

  return (
    <AppShell
      active={active}
      onNavigate={(route) => {
        if (route === 'notifications') return;
        navigate(pathFromRoute(route, user?.id));
      }}
      width="2xl"
      bare={bare}
      unread={{ messages: unreadMessages }}
      authenticated={Boolean(user)}
      user={user}
      onLogout={logout}
      notificationSlot={notificationSlot}
    >
      {children}
    </AppShell>
  );
}

function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  const { unreadCount } = useChatNotifications();
  return (
    <RouterAppShell unreadMessages={unreadCount} notificationSlot={<NotificationBell />}>
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

  return <RouterAppShell>{children}</RouterAppShell>;
}
