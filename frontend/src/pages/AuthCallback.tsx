/** Shown briefly while AuthProvider finishes the Google OAuth code exchange. */
export default function AuthCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-emerald-50 px-6">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-900/20 border-t-emerald-900" />
        <h1 className="mt-5 text-lg font-semibold text-emerald-950">Signing you in…</h1>
        <p className="mt-1 text-sm text-emerald-950/60">Finishing Google sign-in. This only takes a moment.</p>
      </div>
    </div>
  );
}
