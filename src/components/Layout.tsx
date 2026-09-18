import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { ChatNotificationsProvider } from '../context/ChatNotificationsContext';

export default function Layout() {
  return (
    <ChatNotificationsProvider>
      <div className="relative min-h-screen overflow-hidden bg-paper">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-aurora-a rounded-full bg-horizon/[0.05] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 animate-aurora-b rounded-full bg-calm/[0.05] blur-3xl"
        />

        <div className="relative">
          <Navbar />
          <main className="mx-auto max-w-2xl px-4 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ChatNotificationsProvider>
  );
}