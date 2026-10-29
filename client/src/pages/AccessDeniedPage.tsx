import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AccessDeniedPage: React.FC<{
  requiredRoles: UserRole[];
}> = ({ requiredRoles }) => {
  const navigate = useNavigate();
  const { user, switchRole, logout } = useAuth();

  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const availableTargetRoles = userRoles.filter((r) => requiredRoles.includes(r));

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-surface-container-low border-2 border-error/50 p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-error text-on-error mx-auto flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-[36px]">no_accounts</span>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-error text-on-error font-mono text-xs uppercase tracking-wider font-extrabold shadow-sm">
            SECURITY ENCLAVE LOCKOUT // 403 FORBIDDEN
          </span>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary mt-2">
            Sector Locked Out
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            You are locked out of this sector. Your authenticated account is signed in as{' '}
            <strong className="text-primary uppercase font-mono font-bold bg-surface-container px-1.5 py-0.5 border border-outline-variant">
              {user?.role || 'Guest'}
            </strong>
            , but this sector strictly requires{' '}
            <strong className="text-secondary font-mono uppercase font-bold bg-surface-container px-1.5 py-0.5 border border-outline-variant">
              [{requiredRoles.join(', ')}]
            </strong>{' '}
            clearance.
          </p>
        </div>

        <div className="p-4 bg-surface-container-lowest border border-outline-variant text-left font-mono text-xs space-y-1.5 shadow-inner">
          <div className="text-secondary font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
            ZERO_TRUST_LEAST_PRIVILEGE_ENFORCEMENT
          </div>
          <div className="text-on-surface">Authenticated User: <span className="font-bold">{user?.email || 'Anonymous'}</span></div>
          <div className="text-on-surface">Assigned Role Clearances: <span className="text-primary font-bold">[{userRoles.join(', ')}]</span></div>
          <div className="text-error font-bold pt-1 border-t border-outline-variant/50">
            Status: Unauthorized cross-role navigation blocked &amp; recorded.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/app')}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary text-on-primary font-bold font-label-md text-label-md uppercase tracking-wider shadow-sm hover:bg-secondary transition-colors flex items-center justify-center gap-2 cursor-pointer font-mono"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Return to My Workspace
          </button>

          {availableTargetRoles.length > 0 ? (
            <button
              onClick={() => switchRole(availableTargetRoles[0])}
              className="w-full sm:w-auto px-5 py-2.5 bg-secondary-fixed text-on-secondary-fixed font-bold font-label-md text-label-md uppercase tracking-wider shadow-sm hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              <span className="material-symbols-outlined text-[18px]">switch_account</span>
              Switch to {availableTargetRoles[0].toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => {
                logout();
                navigate(`/login/${requiredRoles[0]}`);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant font-bold font-label-md text-label-md uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Log In as Authorized Persona
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
