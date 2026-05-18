export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex items-baseline gap-2">
        <span className="text-6xl font-medium tracking-tight">pointmarket</span>
        <span
          className="inline-block w-4 h-4 rounded-full"
          style={{ backgroundColor: "var(--accent-primary)" }}
        />
      </div>
      <p className="mt-4 text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
        scaffold ready. fase 1 pending.
      </p>
    </main>
  );
}
