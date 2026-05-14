import type { Metadata } from "next";
import "./globals.css";

import { ChunkReloadGuard } from "@/components/chunk-reload-guard";

export const metadata: Metadata = {
  title: "LegalReview",
  description: "Bảng điều phối rà soát tài liệu pháp lý",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <ChunkReloadGuard />
        {children}
      </body>
    </html>
  );
}
