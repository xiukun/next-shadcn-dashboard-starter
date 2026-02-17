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
      try {
        const data = await request<AuthSession | null>('/auth/me', {
          method: 'GET'
        });
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
      return data;
    },
    async logout() {
      await request<unknown>('/auth/logout', { method: 'POST' });
    }
  };
}
