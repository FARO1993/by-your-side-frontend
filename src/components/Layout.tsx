import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { ChatNotificationsProvider } from '../context/ChatNotificationsContext';

export default function Layout() {
  return (
    <ChatNotificationsProvider>
      <div className="min-h-screen bg-paper">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <Outlet />
        </main>
      </div>
    </ChatNotificationsProvider>
  );
}