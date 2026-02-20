import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { loadMessages } from './messages';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // 验证 locale 是否有效
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // 加载并合并拆分后的消息文件
  const messages = await loadMessages(locale);

  return {
    locale,
    messages
  };
});
