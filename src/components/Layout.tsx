import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { ChatNotificationsProvider } from '../context/ChatNotificationsContext';

export default function Layout() {
  return (
    <ChatNotificationsProvider>
      <div className="relative flex h-dvh flex-col overflow-hidden bg-paper">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-aurora-a rounded-full bg-horizon/[0.05] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 animate-aurora-b rounded-full bg-calm/[0.05] blur-3xl"
        />

        <div className="relative flex flex-shrink-0 flex-col">
          <Navbar />
        </div>

        <main className="relative mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
    </ChatNotificationsProvider>
  );
}