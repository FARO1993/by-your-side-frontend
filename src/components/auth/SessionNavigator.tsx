import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { onSessionCleared } from '../../auth/session';

export function SessionNavigator() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return onSessionCleared((reason) => {
      if (reason !== 'expired') return;
      if (location.pathname === '/login') return;
      navigate('/login', { replace: true });
    });
  }, [location.pathname, navigate]);

  return null;
}
