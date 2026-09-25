import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout, { HelpLayout } from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import DiscoverPage from './pages/DiscoverPage';
import HelpResourcesPage from './pages/HelpResourcesPage';
import ConversationsPage from './pages/ConversationsPage';
import ChatPage from './pages/ChatPage';
import PostPage from './pages/PostPage';
import CompanionModePage from './pages/CompanionModePage';
import CreatePostPage from './pages/CreatePostPage';
import NotificationsPage from './pages/NotificationsPage';

const WelcomePreviewPage = import.meta.env.DEV
  ? lazy(() => import('./pages/WelcomePreviewPage'))
  : null;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {WelcomePreviewPage ? (
            <Route
              path="/dev/welcome"
              element={
                <Suspense fallback={<div className="min-h-dvh bg-background" />}>
                  <WelcomePreviewPage />
                </Suspense>
              }
            />
          ) : null}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/help"
            element={
              <HelpLayout>
                <HelpResourcesPage />
              </HelpLayout>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/create" element={<CreatePostPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/messages" element={<ConversationsPage />} />
            <Route path="/messages/:conversationId" element={<ChatPage />} />
            <Route path="/posts/:postId" element={<PostPage />} />
            <Route path="/companion" element={<CompanionModePage />} />
          </Route>

          <Route path="/" element={<Navigate to="/feed" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
