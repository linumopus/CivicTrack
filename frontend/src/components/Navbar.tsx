import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../state/auth/AuthContext';
import { useMessages } from '../state/messages/useMessages';
import { Button } from './Button';

export function Navbar() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { unreadCount, latestUnreadThread } = useMessages(token);

  const isMessagesPage = location.pathname.includes('/messages');
  const [hidePingUntil, setHidePingUntil] = useState<number>(0);

  useEffect(() => {
    if (isMessagesPage) {
      setHidePingUntil(Date.now());
    }
  }, [isMessagesPage]);

  const isCitizen = user?.role === 'citizen';
  const dashboardHref = useMemo(() => (user?.role === 'admin' ? '/admin' : '/user'), [user?.role]);
  const messagesHref = useMemo(() => (user?.role === 'admin' ? '/admin/messages' : '/user/messages'), [user?.role]);

  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="font-semibold tracking-tight text-slate-900">
          CivicTrack
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isCitizen && (
                <Button variant="primary" onClick={() => navigate('/report')}>
                  Report Issue
                </Button>
              )}
              {isCitizen && (
                <NavLink
                  to="/user/community"
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  Community
                </NavLink>
              )}
              <NavLink
                to={dashboardHref}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to={messagesHref}
                className={({ isActive }) =>
                  `relative rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                Messages
                {(() => {
                  const pingTime = latestUnreadThread?.lastMessage
                    ? new Date(latestUnreadThread.lastMessage.createdAt).getTime()
                    : 0;
                  const showPing = !isMessagesPage && unreadCount > 0 && pingTime > hidePingUntil;

                  if (!showPing) return null;

                  let pingColorClass = 'bg-rose-500';
                  let pingGlowClass = 'bg-rose-400';

                  if (latestUnreadThread?.complaintStatus === 'Resolved') {
                    pingColorClass = 'bg-emerald-500';
                    pingGlowClass = 'bg-emerald-400';
                  } else if (latestUnreadThread?.complaintStatus === 'In-Progress') {
                    pingColorClass = 'bg-amber-400';
                    pingGlowClass = 'bg-amber-300';
                  }

                  return (
                    <span className="absolute right-1 top-1.5 flex h-2 w-2">
                      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${pingGlowClass}`}></span>
                      <span className={`relative inline-flex h-2 w-2 rounded-full ${pingColorClass}`}></span>
                    </span>
                  );
                })()}
              </NavLink>

              <div className="relative">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {user.name}
                </button>
                {open && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white p-2 shadow"
                    onMouseLeave={() => setOpen(false)}
                  >
                    <div className="px-2 py-1 text-xs text-slate-500">{user.email}</div>
                    {user.role === 'admin' && user.department && (
                      <div className="px-2 py-1 text-xs text-slate-500">
                        Dept: {user.department}
                      </div>
                    )}
                    <div className="my-1 h-px bg-slate-100" />
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full rounded px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="w-full rounded px-2 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button variant="secondary" onClick={() => navigate('/register')}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

