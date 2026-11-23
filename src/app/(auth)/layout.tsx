export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        {/* ---- Brand mark ---- */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            V
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Volley Stats
          </span>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}
