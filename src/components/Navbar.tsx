import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatNotifications } from '../context/ChatNotificationsContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import Avatar from './Avatar';
import { MenuIcon, CloseIcon, HelpIcon, CompassIcon, ChatBubbleIcon, ChevronDownIcon, LogoutIcon } from './Icons';
import { UsersIcon } from './Icons';

function IconButton({
  to,
  title,
  children,
  badge,
}: {
  to: string;
  title: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      title={title}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-dusk transition-colors hover:bg-mist hover:text-ink"
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-calm text-[10px] font-medium text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useChatNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="border-b border-mist bg-paper">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/feed" className="flex items-center gap-2" onClick={closeMenu}>
          <Logo />
          <span className="font-serif text-xl font-semibold text-ink">ByYourSide</span>
        </Link>

        {/* Desktop: iconos con mas aire + menu de usuario */}
        <div className="hidden items-center gap-1 sm:flex">
          <IconButton to="/help" title="Ayuda">
            <HelpIcon />
          </IconButton>
          <IconButton to="/discover" title="Descubrir">
            <CompassIcon />
          </IconButton>
          <IconButton to="/companion" title="Modo compañía">
            <UsersIcon />
          </IconButton>
          <IconButton to="/messages" title="Mensajes" badge={unreadCount}>
            <ChatBubbleIcon />
          </IconButton>
            <NotificationBell />

          {user && (
            <div ref={userMenuRef} className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                data-testid="user-menu-trigger"
                className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-mist"
              >
                <Avatar avatarUrl={user.avatarUrl} name={user.displayName || user.username} size="sm" />
                <ChevronDownIcon className={`h-4 w-4 text-dusk transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 z-10 w-48 animate-fade-slide-in border border-mist bg-white p-1 shadow-sm">
                  <p className="truncate px-3 py-2 text-sm font-medium text-ink">
                    {user.displayName || user.username}
                  </p>
                  <Link
                    to={`/profile/${user.id}`}
                    onClick={() => setUserMenuOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-dusk hover:bg-paper hover:text-ink"
                  >
                    Mi perfil
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    data-testid="logout-button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-dusk hover:bg-paper hover:text-ink"
                  >
                    <LogoutIcon className="h-3.5 w-3.5" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile: campanita siempre visible + hamburguesa */}
        <div className="flex items-center gap-3 sm:hidden">
          <NotificationBell />
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Abrir menú"
            className="text-ink transition-transform active:scale-90"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Panel mobile: sin cambios */}
      {menuOpen && (
        <div className="flex animate-fade-slide-in flex-col gap-3 border-t border-mist px-4 py-4 sm:hidden">
          {user && (
            <Link to={`/profile/${user.id}`} onClick={closeMenu} className="flex items-center gap-2">
              <Avatar avatarUrl={user.avatarUrl} name={user.displayName || user.username} size="sm" />
              <span className="text-sm font-medium text-ink">
                {user.displayName || user.username}
              </span>
            </Link>
          )}
          <Link to="/help" onClick={closeMenu} className="text-sm font-medium text-calm">
            Ayuda
          </Link>
          <Link to="/discover" onClick={closeMenu} className="text-sm text-dusk">
            Descubrir
          </Link>
          <Link to="/messages" onClick={closeMenu} className="flex items-center gap-2 text-sm text-dusk">
            Mensajes
            {unreadCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-calm text-[10px] font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <button onClick={() => { closeMenu(); logout(); }} className="text-left text-sm text-dusk">
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}