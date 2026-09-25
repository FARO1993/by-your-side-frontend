export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  role: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  displayName?: string;
  email: string;
  password: string;
}

// Espejo de ErrorResponse del backend (GlobalExceptionHandler)
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

export interface UserSummary {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  author: UserSummary;
  content: string;
  visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
  followedByCurrentUser: boolean;
  supportCount: number;
  supportedByCurrentUser: boolean;
}

// Espejo de Page<T> de Spring Data (lo que devuelve GET /api/posts/feed)
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // pagina actual, 0-indexed
  size: number;
  last: boolean;
}

export interface CreatePostRequest {
  content: string;
  visibility?: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
}

export interface Comment {
  id: string;
  postId: string;
  author: UserSummary;
  content: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface FollowResponse {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  followedByCurrentUser: boolean;
}

export interface DiscoverUser {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface SupportSummary {
  postId: string;
  supportCount: number;
  supportedByCurrentUser: boolean;
}

export interface Notification {
  id: string;
  actor: UserSummary;
  type: 'NEW_FOLLOWER' | 'NEW_COMMENT' | 'NEW_SUPPORT'| 'NEW_STATUS_REACTION';
  postId: string | null;
  read: boolean;
  createdAt: string;
}

export type StatusMood = 'WELL' | 'NEED_DISTRACTION' | 'DIFFICULT_DAY' | 'NEED_TO_TALK' | 'HERE_FOR_SOMEONE';
export type StatusReactionType = 'WITH_YOU' | 'WANT_TO_TALK' | 'HERE_READING' | 'NOT_ALONE';

export interface Status {
  id: string;
  user: UserSummary;
  mood: StatusMood;
  createdAt: string;
  expiresAt: string;
  reactionCount: number;
  reactedByCurrentUser: StatusReactionType | null;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: UserSummary;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  otherUser: UserSummary;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export type CompanionIntent = 'TALK' | 'DISTRACTION' | 'WATCH_TOGETHER' | 'MUSIC' | 'LAUGH' | 'JUST_COMPANY';

export interface Availability {
  id: string;
  user: UserSummary;
  intent: CompanionIntent;
  createdAt: string;
  expiresAt: string;
}