import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Purple gradient with decorative shapes */}
      <div className="relative hidden w-[58%] overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-purple-700 lg:flex lg:flex-col lg:justify-center lg:px-16">
        {/* Decorative diagonal shapes */}
        <div className="absolute bottom-12 left-8 flex gap-3" style={{ transform: 'rotate(-35deg)' }}>
          <div className="h-14 w-48 rounded-full bg-gradient-to-r from-orange-400 to-yellow-300 opacity-80" />
          <div className="h-14 w-32 rounded-full bg-gradient-to-r from-pink-400 to-orange-300 opacity-70" />
        </div>
        <div className="absolute bottom-32 left-20 flex gap-3" style={{ transform: 'rotate(-35deg)' }}>
          <div className="h-12 w-40 rounded-full bg-gradient-to-r from-orange-400 to-yellow-300 opacity-60" />
          <div className="h-12 w-28 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 opacity-50" />
        </div>
        <div className="absolute bottom-52 left-4 flex gap-3" style={{ transform: 'rotate(-35deg)' }}>
          <div className="h-10 w-36 rounded-full bg-gradient-to-r from-yellow-400 to-orange-300 opacity-50" />
          <div className="h-10 w-24 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 opacity-40" />
        </div>
        <div className="absolute bottom-4 left-40 flex gap-3" style={{ transform: 'rotate(-35deg)' }}>
          <div className="h-10 w-44 rounded-full bg-gradient-to-r from-pink-400 to-orange-300 opacity-60" />
        </div>

        {/* Welcome text */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold leading-tight text-white">
            Welcome to website
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-purple-100">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod
            tincidunt ut laoreet dolore magna aliquam erat volutpat.
          </p>
        </div>
      </div>

      {/* Right Panel - Login form */}
      <div className="flex w-full items-center justify-center bg-white px-8 lg:w-[42%]">
        <div className="w-full max-w-sm">
          <h2 className="mb-10 text-center text-xl font-medium tracking-wide text-gray-500">
            USER LOGIN
          </h2>

          {error && (
            <div className="mb-4">
              <ErrorAlert message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <UserIcon className="h-5 w-5" />
              </span>
              <input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border-b-2 border-gray-200 py-3 pl-10 pr-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Password field */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <LockClosedIcon className="h-5 w-5" />
              </span>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-b-2 border-gray-200 py-3 pl-10 pr-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Remember
              </label>
              <button type="button" className="text-xs text-gray-400 hover:text-purple-500">
                Forgot password?
              </button>
            </div>

            {/* Login button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-2 text-sm font-medium text-white shadow-md transition-all hover:from-purple-600 hover:to-pink-600 hover:shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Logging in...' : 'LOGIN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
