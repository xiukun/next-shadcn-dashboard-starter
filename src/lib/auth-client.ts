let mocksReady: Promise<void> | null = null;

async function ensureMocksStarted() {
  if (typeof window === 'undefined') return;
  if (!mocksReady) {
    mocksReady = import('@/mocks')
      .then((m) => m.startMocks?.())
      .then(() => undefined)
      .catch(() => undefined);
  }
  await mocksReady;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type AuthOrganization = {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
  organization?: AuthOrganization;
};

export interface AuthClient {
  getSession(): Promise<AuthSession | null>;
  login(params: { username: string; password: string }): Promise<AuthSession>;
  logout(): Promise<void>;
}

const STORAGE_KEY = 'mock-auth-session';

function loadStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function storeSession(session: AuthSession | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // ignore storage errors in mock environment
  }
}

// 基础实现：通过 HTTP 调用后端（当前由 MSW 拦截），后续可以替换为真实接口
export function createHttpAuthClient(baseUrl = ''): AuthClient {
  const prefix = baseUrl || '';

  async function request<T>(input: string, init?: RequestInit): Promise<T> {
    // 在浏览器环境下，先确保 MSW 已经启动，再发起请求
    if (typeof window !== 'undefined') {
      await ensureMocksStarted();
    }

    const res = await fetch(prefix + input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      },
      credentials: 'include'
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Auth request failed: ${res.status}`);
    }

    return (await res.json()) as T;
  }

  return {
    async getSession() {
      // 浏览器环境下优先从本地缓存恢复 session，
      // 确保刷新页面后仍然保留登录状态。
      const cached = loadStoredSession();
      if (cached) {
        return cached;
      }

      try {
        const data = await request<AuthSession | null>('/auth/me', {
          method: 'GET'
        });
        if (data) {
          storeSession(data);
        }
        return data;
      } catch {
        return null;
      }
    },
    async login(params) {
      const data = await request<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      storeSession(data);
      return data;
    },
    async logout() {
      await request<unknown>('/auth/logout', { method: 'POST' });
      storeSession(null);
    }
  };
}
