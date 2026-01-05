/**
 * API Configuration
 * Central configuration for all API endpoints and settings
 */

// API base configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  TIMEOUT: 10000,
  ENV: import.meta.env.VITE_ENV || 'development',
};

// All API endpoints organized by feature
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    UPDATE_PROFILE: '/api/auth/profile',
    UPLOAD_AVATAR: '/api/auth/avatar',
    UPLOAD_RESUME: '/api/auth/resume',
    CHANGE_PASSWORD: '/api/auth/password',
    DELETE_ACCOUNT: '/api/auth/account',
    GET_PROFILE: '/api/auth/profile/:id',
    UPDATE_PREFERENCES: '/api/auth/preferences',
    GET_PREFERENCES: '/api/auth/preferences',
    // OTP authentication endpoints
    SEND_OTP: '/api/auth/otp/send',
    VERIFY_OTP: '/api/auth/otp/verify',
    RESEND_OTP: '/api/auth/otp/resend',
  },

  // Room endpoints
  ROOMS: {
    CREATE: '/api/rooms',
    JOIN: '/api/rooms/join',
    LIST: '/api/rooms',
    MY_ROOMS: '/api/rooms/my-rooms',
    PUBLIC: '/api/rooms/public',
    TODAYS_TASKS: '/api/rooms/todays-tasks',
    CHECK_LIMIT: '/api/rooms/check-limit',
    UPDATE_ACTIVITY: '/api/rooms/activity/update',
    GET_ACTIVITIES: '/api/rooms/activity/batch',
    GET: (id) => `/api/rooms/${id}`,
    LEAVE: (id) => `/api/rooms/${id}/leave`,
    READY: (id) => `/api/rooms/${id}/ready`,
  },

  // Chat endpoints
  CHAT: {
    MESSAGES: (roomId) => `/api/rooms/${roomId}/messages`,
    STATS: (roomId) => `/api/rooms/${roomId}/stats`,
  },

  // Channel endpoints
  CHANNELS: {
    CREATE: '/api/channels',
    LIST: '/api/channels',
    MY_CHANNELS: '/api/channels/my',
    GET: (id) => `/api/channels/${id}`,
    UPDATE: (id) => `/api/channels/${id}`,
    DELETE: (id) => `/api/channels/${id}`,
    // Note endpoints
    CREATE_NOTE: (channelId) => `/api/channels/${channelId}/notes`,
    GET_NOTES: (channelId) => `/api/channels/${channelId}/notes`,
    GET_NOTE: (channelId, noteId) => `/api/channels/${channelId}/notes/${noteId}`,
    UPDATE_NOTE: (channelId, noteId) => `/api/channels/${channelId}/notes/${noteId}`,
    DELETE_NOTE: (channelId, noteId) => `/api/channels/${channelId}/notes/${noteId}`,
  },

  // Task/Board endpoints
  TASKS: {
    CREATE_BOARD: '/api/boards',
    GET_BOARDS: '/api/boards',
    GET_BOARD: (id) => `/api/boards/${id}`,
    UPDATE_BOARD: (id) => `/api/boards/${id}`,
    DELETE_BOARD: (id) => `/api/boards/${id}`,
    CREATE_LIST: '/api/lists',
    UPDATE_LIST: (id) => `/api/lists/${id}`,
    DELETE_LIST: (id) => `/api/lists/${id}`,
    CREATE_TASK: '/api/tasks',
    GET_TASK: (id) => `/api/tasks/${id}`,
    UPDATE_TASK: (id) => `/api/tasks/${id}`,
    DELETE_TASK: (id) => `/api/tasks/${id}`,
  },

  // AI endpoints
  AI: {
    ROADMAP: '/api/ai/roadmap',
    QUIZ: '/api/ai/quiz',
    ROOM_SUMMARY: '/api/ai/room-summary',
    EMBED_PROFILE: '/api/ai/embed-profile',
    EMBEDDING_STATUS: (userId) => `/api/ai/embedding/${userId}`,
    GROUP_STUDENTS: '/api/ai/group-students',
    STATS: '/api/ai/stats',
  },

  // Content generation endpoints
  CONTENT: {
    GENERATE: '/api/content/generate',
  },

  // Notification endpoints
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: '/api/notifications/mark-read',
    MARK_ALL_READ: '/api/notifications/mark-all-read',
  },

  // Health check endpoints
  HEALTH: {
    CHECK: '/health',
    DB_CHECK: '/db-check',
    API_INFO: '/api',
  },
};

// API error codes
export const API_ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  SERVER_ERROR: 500,
  NETWORK_ERROR: 'NETWORK_ERROR',
};

// Default request configuration
export const DEFAULT_REQUEST_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
};
