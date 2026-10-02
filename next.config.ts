import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOT "standalone" — we deploy via a custom server.js (needed to run the
  // DB schema sync at boot, since this host has no shell to migrate any
  // other way) with the full node_modules uploaded directly. "standalone"
  // generates and expects its own server.js/pruned node_modules, which
  // conflicts with that custom-server setup ("next start does not work
  // with output: standalone" at runtime) — plain output avoids the clash.
  images: {
    // next/image's optimizer needs `sharp`'s native binary, which is
    // platform-specific — the one traced into the bundle here is the
    // Windows build (built on Windows, deployed to Linux), so it would
    // fail at runtime. Serving images unresized instead of chasing a
    // cross-platform binary match.
    unoptimized: true,
  },
};

export default nextConfig;
