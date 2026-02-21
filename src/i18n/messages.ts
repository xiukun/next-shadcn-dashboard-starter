/**
 * Messages loader utility
 * Dynamically loads and merges split message files
 */

export async function loadMessages(locale: string) {
  try {
    // Load all message files in parallel
    const [
      nav,
      common,
      metadata,
      language,
      settings,
      notifications,
      jsonRender
    ] = await Promise.all([
      import(`@/messages/${locale}/nav.json`).then((m) => m.default),
      import(`@/messages/${locale}/common.json`).then((m) => m.default),
      import(`@/messages/${locale}/metadata.json`).then((m) => m.default),
      import(`@/messages/${locale}/language.json`).then((m) => m.default),
      import(`@/messages/${locale}/settings.json`).then((m) => m.default),
      import(`@/messages/${locale}/notifications.json`).then((m) => m.default),
      import(`@/messages/${locale}/json-render.json`).then((m) => m.default)
    ]);

    // Merge all messages into a single object
    return {
      nav,
      common,
      metadata,
      language,
      settings,
      notifications,
      'json-render': jsonRender
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // Fallback to default locale if loading fails
    if (locale !== 'zh') {
      return loadMessages('zh');
    }
    // If default locale also fails, return empty messages
    return {
      nav: {},
      common: {},
      metadata: {},
      language: {},
      settings: {},
      notifications: {},
      'json-render': {}
    };
  }
}
