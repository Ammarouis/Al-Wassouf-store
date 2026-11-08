/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Product images are served via Supabase *signed URLs* and rendered with plain <img>,
  // exactly as in the original app, so no next/image remotePatterns are required.
  async headers() {
    return [
      {
        source: "/admin",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};
export default nextConfig;
