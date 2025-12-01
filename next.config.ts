import type { NextConfig } from "next";

// next-pwaはCommonJS形式なので、動的インポートを使用
const withPWA = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === 'development',
    });
  } catch (e) {
    // next-pwaがインストールされていない場合
    return (config: NextConfig) => config;
  }
})();

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
