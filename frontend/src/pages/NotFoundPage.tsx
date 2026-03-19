import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        Go back to <Link className="text-slate-900 underline" to="/">Home</Link>.
      </p>
    </div>
  );
}

