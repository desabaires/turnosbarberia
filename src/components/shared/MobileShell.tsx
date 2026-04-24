export function MobileShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-screen max-w-[440px] bg-bg">{children}</div>;
}
