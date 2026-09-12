const TOKEN_KEY = 'callivo_token';
const USER_KEY = 'callivo_user';

export function getAuthToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    if (token && token !== 'undefined' && token !== 'null') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {}
}

export function removeAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export function getStoredUser(): any | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
    }
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// --- AUTH API ---
export const authApi = {
  register: (data: { email: string; password: string; name: string; phone?: string; avatar?: string }) =>
    apiRequest<{ success: boolean; token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest<{ success: boolean; token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  loginWithGoogle: (data?: { email?: string; name?: string; avatar?: string }) =>
    apiRequest<{ success: boolean; token: string; user: any }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  logout: () =>
    apiRequest<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  me: () =>
    apiRequest<{ success: boolean; user: any }>('/api/auth/me'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    apiRequest<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiRequest<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- MEETINGS API ---
export const meetingsApi = {
  create: (data: {
    title?: string;
    passcode?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    timezone?: string;
    waitingRoom?: boolean;
    muteOnEntry?: boolean;
    autoRecord?: boolean;
    allowScreenShare?: boolean;
    allowChat?: boolean;
    allowReactions?: boolean;
    inviteEmails?: string[];
  }) =>
    apiRequest<{ success: boolean; meeting: any }>('/api/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: () =>
    apiRequest<{ success: boolean; meetings: any[] }>('/api/meetings'),

  getById: (id: string) =>
    apiRequest<{ success: boolean; meeting: any }>(`/api/meetings/${id}`),

  joinLobby: (id: string, data: { guestName?: string; passcode?: string }) =>
    apiRequest<{ success: boolean; meeting: any; isHost: boolean; requiresWaitingRoom: boolean }>(
      `/api/meetings/${id}/lobby`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  update: (id: string, updates: any) =>
    apiRequest<{ success: boolean; meeting: any }>(`/api/meetings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  end: (id: string) =>
    apiRequest<{ success: boolean; meeting: any }>(`/api/meetings/${id}/end`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/api/meetings/${id}`, {
      method: 'DELETE',
    }),
};

// --- HELPDESK API ---
export const helpdeskApi = {
  submitTicket: (data: {
    name: string;
    email: string;
    phone?: string;
    category: string;
    subject: string;
    message: string;
    priority?: string;
  }) =>
    apiRequest<{ success: boolean; message: string; ticket: any }>('/api/helpdesk/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTickets: () =>
    apiRequest<{ success: boolean; tickets: any[] }>('/api/helpdesk/tickets'),

  getTicketByRef: (ref: string) =>
    apiRequest<{ success: boolean; ticket: any }>(`/api/helpdesk/tickets/${ref}`),
};

// --- CONTACTS API ---
export const contactsApi = {
  list: () =>
    apiRequest<{ success: boolean; contacts: any[] }>('/api/contacts'),

  add: (email: string) =>
    apiRequest<{ success: boolean; contact: any }>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  toggleFavorite: (contactId: string) =>
    apiRequest<{ success: boolean; contact: any }>(`/api/contacts/${contactId}/favorite`, {
      method: 'PATCH',
    }),

  remove: (contactId: string) =>
    apiRequest<{ success: boolean; message: string }>(`/api/contacts/${contactId}`, {
      method: 'DELETE',
    }),
};

// --- MESSAGES API ---
export const messagesApi = {
  getConversations: () =>
    apiRequest<{ success: boolean; conversations: any[] }>('/api/messages/conversations'),

  getMessages: (partnerId: string) =>
    apiRequest<{ success: boolean; messages: any[] }>(`/api/messages/${partnerId}`),

  send: (recipientId: string, content: string) =>
    apiRequest<{ success: boolean; message: any }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content }),
    }),
};

// --- CALENDAR API ---
export const calendarApi = {
  list: (month?: string) =>
    apiRequest<{ success: boolean; events: any[] }>(`/api/calendar${month ? `?month=${month}` : ''}`),

  create: (data: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    duration?: string;
    category?: string;
    description?: string;
    createMeetingLink?: boolean;
  }) =>
    apiRequest<{ success: boolean; event: any }>('/api/calendar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiRequest<{ success: boolean; event: any }>(`/api/calendar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/api/calendar/${id}`, {
      method: 'DELETE',
    }),
};

// --- RECORDINGS API ---
export const recordingsApi = {
  list: () =>
    apiRequest<{ success: boolean; recordings: any[] }>('/api/recordings'),

  create: (data: any) =>
    apiRequest<{ success: boolean; recording: any }>('/api/recordings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/api/recordings/${id}`, {
      method: 'DELETE',
    }),
};

// --- NOTIFICATIONS API ---
export const notificationsApi = {
  list: () =>
    apiRequest<{ success: boolean; notifications: any[]; unreadCount: number }>('/api/notifications'),

  markAsRead: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllAsRead: () =>
    apiRequest<{ success: boolean; message: string }>('/api/notifications/read-all', {
      method: 'PATCH',
    }),
};

// --- SETTINGS API ---
export const settingsApi = {
  get: () =>
    apiRequest<{ success: boolean; settings: any }>('/api/settings'),

  update: (data: any) =>
    apiRequest<{ success: boolean; settings: any }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// --- USERS API ---
export const usersApi = {
  getProfile: () =>
    apiRequest<{ success: boolean; data: any }>('/api/users/profile'),

  updateProfile: (data: any) =>
    apiRequest<{ success: boolean; data: any }>('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadAvatar: (dataUrl: string) =>
    apiRequest<{ success: boolean; avatar: string }>('/api/users/avatar', {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    }),

  deleteAvatar: () =>
    apiRequest<{ success: boolean; avatar: null }>('/api/users/avatar', {
      method: 'DELETE',
    }),

  search: (query: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/api/users/search?q=${encodeURIComponent(query)}`),
};
