import { AppShell } from "@/components/app-shell";

export default function DocumentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell area="client">{children}</AppShell>;
}

