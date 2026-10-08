import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout, { HelpLayout } from './components/Layout';
import { SessionNavigator } from './components/auth/SessionNavigator';
import { WelcomeGate } from './components/auth/WelcomeGate';
import { PageFallback } from './components/PageFallback';
import LoginPage from './pages/LoginPage';

// Cada pantalla se baja recién cuando se visita (React.lazy). Login queda en
// el bundle inicial porque es la puerta de entrada de quien no tiene sesión.
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const loadFeedPage = () => import('./pages/FeedPage');
const FeedPage = lazy(loadFeedPage);
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const HelpResourcesPage = lazy(() => import('./pages/HelpResourcesPage'));
const GuidelinesPage = lazy(() => import('./pages/GuidelinesPage'));
const ConversationsPage = lazy(() => import('./pages/ConversationsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const PostPage = lazy(() => import('./pages/PostPage'));
const CompanionModePage = lazy(() => import('./pages/CompanionModePage'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const AnonymousSpacePage = lazy(() => import('./pages/AnonymousSpacePage'));
const DistraermePage = lazy(() => import('./pages/distraerme/DistraermePage'));
const MemoryGamePage = lazy(() => import('./pages/distraerme/MemoryGamePage'));
const BlocksGamePage = lazy(() => import('./pages/distraerme/BlocksGamePage'));
const ReboundGamePage = lazy(() => import('./pages/distraerme/ReboundGamePage'));
const GardenGamePage = lazy(() => import('./pages/distraerme/GardenGamePage'));
const PuzzleGamePage = lazy(() => import('./pages/distraerme/PuzzleGamePage'));
const LeavesGamePage = lazy(() => import('./pages/distraerme/LeavesGamePage'));
const GameInvitePage = lazy(() => import('./pages/distraerme/GameInvitePage'));
const GameRoomPage = lazy(() => import('./pages/distraerme/GameRoomPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

// El inicio es la pantalla más visitada: si se entra por ahí, su chunk se pide
// en paralelo con la sesión en vez de esperar a que ProtectedRoute la renderice.
if (typeof window !== 'undefined' && /^\/(feed)?$/.test(window.location.pathname)) {
  void loadFeedPage();
}

const WelcomePreviewPage = import.meta.env.DEV
  ? lazy(() => import('./pages/WelcomePreviewPage'))
  : null;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionNavigator />
        <WelcomeGate />
        <Suspense fallback={<PageFallback fullScreen />}>
          <Routes>
            {WelcomePreviewPage ? (
              <Route
                path="/dev/welcome"
                element={<WelcomePreviewPage />}
              />
            ) : null}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/help"
              element={
                <HelpLayout>
                  <HelpResourcesPage />
                </HelpLayout>
              }
            />

            <Route
              path="/normas"
              element={
                <HelpLayout>
                  <GuidelinesPage />
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
              <Route path="/account/password" element={<ChangePasswordPage />} />
              <Route path="/create" element={<CreatePostPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/anonimo" element={<AnonymousSpacePage />} />
              <Route path="/distraerme" element={<DistraermePage />} />
              <Route path="/distraerme/memoria" element={<MemoryGamePage />} />
              <Route path="/distraerme/bloques" element={<BlocksGamePage />} />
              <Route path="/distraerme/rebote" element={<ReboundGamePage />} />
              <Route path="/distraerme/jardin" element={<GardenGamePage />} />
              <Route path="/distraerme/puzzle" element={<PuzzleGamePage />} />
              <Route path="/distraerme/hojas" element={<LeavesGamePage />} />
              <Route path="/distraerme/invitar" element={<GameInvitePage />} />
              <Route path="/distraerme/sala/:roomId" element={<GameRoomPage />} />
              <Route path="/messages" element={<ConversationsPage />} />
              <Route path="/messages/:conversationId" element={<ChatPage />} />
              <Route path="/posts/:postId" element={<PostPage />} />
              <Route path="/companion" element={<CompanionModePage />} />
            </Route>

            <Route path="/" element={<Navigate to="/feed" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
