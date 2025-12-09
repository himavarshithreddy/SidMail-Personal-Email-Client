"use client";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4 p-6">
      <div className="text-3xl font-semibold">Page not found</div>
      <p className="text-muted-foreground">The page you’re looking for doesn’t exist.</p>
      <a
        href="/login"
        className="btn-primary px-4 py-2 rounded-md cursor-pointer"
      >
        Go to login
      </a>
    </div>
  );
}

