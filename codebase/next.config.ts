import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist phải chạy nguyên bản trong Node (route tutor đọc PDF để lấy
  // text slide); bundle nó vào server chunk làm import vỡ.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
