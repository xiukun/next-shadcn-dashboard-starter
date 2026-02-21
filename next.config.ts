import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'clerk.com',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist'],
  // 减少构建输出大小（Next.js 16 默认启用压缩）
  compress: true,
  // 优化生产构建（禁用 source maps 以加快构建速度）
  productionBrowserSourceMaps: false,
  // 使用 webpack 而不是 Turbopack（Turbopack 在某些情况下可能卡住）
  // 如果需要使用 Turbopack，可以通过命令行参数 --turbo 启用
  experimental: {
    // 禁用可能导致构建卡住的实验性功能
    optimizePackageImports: ['@tabler/icons-react', 'lucide-react']
  }
};

let configWithPlugins = withNextIntl(baseConfig);

// Conditionally enable Sentry configuration
// Only enable Sentry if explicitly configured (not disabled and has required env vars)
// 在本地构建时完全禁用 Sentry，避免网络连接问题导致构建卡住
const sentryEnabled =
  process.env.CI && // 只在 CI 环境中启用
  !process.env.NEXT_PUBLIC_SENTRY_DISABLED &&
  process.env.NEXT_PUBLIC_SENTRY_DSN &&
  process.env.NEXT_PUBLIC_SENTRY_ORG &&
  process.env.NEXT_PUBLIC_SENTRY_PROJECT;

if (sentryEnabled) {
  configWithPlugins = withSentryConfig(configWithPlugins, {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options
    // FIXME: Add your Sentry organization and project names
    org: process.env.NEXT_PUBLIC_SENTRY_ORG,
    project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    reactComponentAnnotation: {
      enabled: true
    },

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Disable Sentry telemetry
    telemetry: false
  });
}

const nextConfig = configWithPlugins;
export default nextConfig;
