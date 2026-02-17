import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';
import type {
  AuthOrganization,
  AuthSession,
  AuthUser
} from '@/lib/auth-client';

function createMockUser(): AuthUser {
  return {
    id: 'user-' + faker.string.alphanumeric(8),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatarUrl: faker.image.avatar()
  };
}

function createMockOrganization(): AuthOrganization {
  return {
    id: 'org-' + faker.string.alphanumeric(6),
    name: faker.company.name(),
    role: 'owner'
  };
}

let currentSession: AuthSession | null = null;

export const authHandlers = [
  http.post('/auth/login', async ({ request }) => {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (!body.username || !body.password) {
      return HttpResponse.json(
        { message: '账号或密码不能为空' },
        { status: 400 }
      );
    }

    // 简单规则：任何非空账号密码均视为合法；后续接真实接口时替换这里的逻辑。
    const user = createMockUser();
    const organization = createMockOrganization();

    const token = faker.string.alphanumeric(24);
    currentSession = {
      accessToken: token,
      user,
      organization
    };

    return HttpResponse.json<AuthSession>(currentSession, {
      status: 200
    });
  }),

  http.get('/auth/me', () => {
    // 简单实现：如果当前进程内存在 session，就返回；否则视为未登录
    if (!currentSession) {
      return HttpResponse.json<null>(null, { status: 200 });
    }
    return HttpResponse.json<AuthSession>(currentSession, { status: 200 });
  }),

  http.post('/auth/logout', () => {
    currentSession = null;
    return HttpResponse.json({ success: true }, { status: 200 });
  })
];
