import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AccessDeniedPage: React.FC<{
  requiredRoles: UserRole[];
}> = ({ requiredRoles }) => {
  const navigate = useNavigate();
  const { user, switchRole } = useAuth();

  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const availableTargetRoles = userRoles.filter((r) => requiredRoles.includes(r));

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-surface-container-low border border-outline-variant p-6 sm:p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">lock</span>
        </div>

        <div className="space-y-2">
          <span className="px-2 py-0.5 bg-error text-on-error font-mono text-xs uppercase tracking-wider font-bold">
            SECURITY // 403 FORBIDDEN
          </span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Workspace Access Restricted
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Your authenticated session is active as{' '}
            <strong className="text-on-surface uppercase font-mono">{user?.role || 'Guest'}</strong>, but this sector requires{' '}
            <strong className="text-secondary font-mono uppercase">[{requiredRoles.join(', ')}]</strong> security clearance.
          </p>
        </div>

        <div className="p-4 bg-surface-container border border-outline-variant/60 text-left font-mono text-xs space-y-1">
          <div className="text-outline">PRINCIPLE: LEAST_PRIVILEGE_ENFORCEMENT</div>
          <div className="text-on-surface">Identity: {user?.email || 'Anonymous'}</div>
          <div className="text-on-surface">Granted Roles: [{userRoles.join(', ')}]</div>
          <div className="text-error font-semibold">Violation: Direct Route Traversal Disallowed</div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/app')}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary text-on-primary font-bold font-label-md text-label-md uppercase tracking-wider shadow-sm hover:translate-y-[-1px] transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Return to My Workspace
          </button>

          {availableTargetRoles.length > 0 && (
            <button
              onClick={() => switchRole(availableTargetRoles[0])}
              className="w-full sm:w-auto px-5 py-2.5 bg-secondary-fixed text-on-secondary-fixed font-bold font-label-md text-label-md uppercase tracking-wider shadow-sm hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">switch_account</span>
              Switch to {availableTargetRoles[0].toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
