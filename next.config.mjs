/** @type {import('next').NextConfig} */
const nextConfig = {
  // sharp is a native module; keep it out of the server bundle.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
