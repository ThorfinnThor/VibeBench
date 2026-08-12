import type { NextConfig } from "next";

const scriptSources = process.env.NODE_ENV === "development" ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src ${scriptSources}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self'; upgrade-insecure-requests`
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" }
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  }
};

export default nextConfig;
