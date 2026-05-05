import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';

export default function OAuthCallbackPage() {
  const { ingestTokens } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const access = params.get('access');
    const refresh = params.get('refresh');
    if (access && refresh) {
      ingestTokens(access, refresh).then(() => nav('/dashboard', { replace: true }));
    } else {
      nav('/login', { replace: true });
    }
  }, [ingestTokens, nav]);

  return (
    <div className="grid min-h-screen place-items-center text-slate-500">
      Completing sign-in…
    </div>
  );
}
