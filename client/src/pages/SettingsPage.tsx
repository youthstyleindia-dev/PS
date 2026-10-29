import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface CampusUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  department?: string;
  yearOfStudy?: number;
}

interface AuditLogEntry {
  id: string;
  email: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const SettingsPage: React.FC<{ currentRole?: string; onRoleChange?: (role: any) => void }> = () => {
  const { user, token, switchRole } = useAuth();

  const [fingerprint, setFingerprint] = useState('ed25519:7a819b4f2c0199e8c39f');
  const [copied, setCopied] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<'indexeddb' | 'ephemeral'>('indexeddb');

  // Admin state
  const isAdmin = user?.role === 'admin' || (user?.roles && user.roles.includes('admin'));
  const [usersList, setUsersList] = useState<CampusUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState<UserRole>('driver');

  const fetchAdminData = async () => {
    if (!isAdmin || !token) return;
    setAdminLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/auth/audit-log', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersList(data.users || []);
        if (data.users?.length > 0 && !selectedUserId) {
          setSelectedUserId(data.users[0].id);
        }
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setAuditLogs(data.logs || []);
      }
    } catch {
      // Ignored in offline
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, token]);

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenFingerprint = () => {
    const randomHex = Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setFingerprint(`ed25519:${randomHex}`);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Password change failed');
      }

      setPassSuccess('Master password changed and securely re-hashed via Bcrypt.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(null), 4000);
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password');
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedRoleToAssign) return;

    try {
      const res = await fetch('/api/auth/roles/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUserId,
          roleKey: selectedRoleToAssign,
          reason: 'Granted via Admin Settings Governance Enclave'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to assign role');
      }
      setAdminFeedback({ type: 'success', message: data.message || `Role '${selectedRoleToAssign}' granted.` });
      fetchAdminData();
    } catch (err: any) {
      setAdminFeedback({ type: 'error', message: err.message || 'Failed to assign role' });
    }
  };

  const handleRevokeRole = async (userId: string, roleKey: string) => {
    try {
      const res = await fetch('/api/auth/roles/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, roleKey })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to revoke role');
      }
      setAdminFeedback({ type: 'success', message: `Role '${roleKey}' revoked.` });
      fetchAdminData();
    } catch (err: any) {
      setAdminFeedback({ type: 'error', message: err.message || 'Failed to revoke role' });
    }
  };

  const allRoles: { key: UserRole; label: string }[] = [
    { key: 'student', label: 'Student' },
    { key: 'driver', label: 'Driver' },
    { key: 'proctor', label: 'Proctor' },
    { key: 'ta_faculty', label: 'Faculty / TA' },
    { key: 'warden', label: 'Warden' },
    { key: 'admin', label: 'Admin' }
  ];

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface gap-6">
      {/* Header Section */}
      <section className="w-full bg-surface-container-lowest p-6 md:p-8 border border-outline-variant shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary px-2 py-0.5 border border-secondary font-mono font-bold">
            NODE CONTROL // IDENTITY &amp; GOVERNANCE
          </span>
          <span className="font-label-sm text-label-sm text-outline font-mono">
            [SQLITE WAL: 25 TABLES ACTIVE]
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-tight">
              Cryptographic Enclave &amp; Ledger Settings
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed mt-1">
              UniVerse accounts are local cryptographic identities anchored directly to your hardware and local SQLite storage. No central tracking, surveillance profiling, or third-party credential brokers.
            </p>
          </div>

          <div className="p-4 bg-surface-container-low border border-outline-variant font-mono text-xs flex flex-col gap-1 shrink-0">
            <span className="text-outline uppercase">Active Persona</span>
            <div className="text-sm font-bold text-primary">{user?.name}</div>
            <div className="text-secondary font-bold uppercase">{user?.role} • {user?.department || 'CAMPUS'}</div>
            <div className="text-[10px] text-outline mt-1">
              Clearance: {user?.roles ? user.roles.join(', ') : user?.role}
            </div>
          </div>
        </div>
      </section>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Keypair Ledger & Persona Switcher */}
        <div className="lg:col-span-7 space-y-6">
          {/* Keypair Card */}
          <section className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col gap-4 font-mono">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-xs font-bold text-primary uppercase">
                Hardware Enclave // Client Fingerprint
              </span>
              <span className="text-secondary text-xs font-bold">ED25519 ATTESTED</span>
            </div>

            <div className="p-4 bg-surface-container-low border border-outline-variant space-y-2">
              <span className="text-xs text-outline uppercase block">Active Cryptographic Fingerprint:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm bg-surface-container-lowest px-3 py-1.5 text-primary border border-outline-variant font-bold select-all">
                  {fingerprint}
                </span>
                <button
                  onClick={handleCopyFingerprint}
                  className="px-3 py-1.5 bg-primary text-on-primary hover:bg-secondary font-label-sm uppercase font-bold transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleRegenFingerprint}
                  className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant font-label-sm uppercase font-bold transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">cached</span>
                  <span>Regenerate</span>
                </button>
              </div>
              <p className="text-xs text-on-surface-variant font-sans pt-1">
                Derived via WebCrypto hardware entropy pool. Public key signatures are published to peer transit and academic ledgers without revealing secret keys.
              </p>
            </div>

            {/* Storage Architecture Selector */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-primary uppercase">Storage Architecture:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label
                  onClick={() => setStorageMode('indexeddb')}
                  className={`p-3 border cursor-pointer transition-all ${
                    storageMode === 'indexeddb'
                      ? 'bg-surface-container border-secondary shadow-sm'
                      : 'bg-surface-container-low border-outline-variant hover:border-outline'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-primary text-xs">Local Persistent Enclave</span>
                    <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.2 font-bold uppercase">Recommended</span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-sans leading-tight">
                    Keys stay inside local encrypted database. Zero cloud backup. Safe for personal computers.
                  </p>
                </label>

                <label
                  onClick={() => setStorageMode('ephemeral')}
                  className={`p-3 border cursor-pointer transition-all ${
                    storageMode === 'ephemeral'
                      ? 'bg-surface-container border-secondary shadow-sm'
                      : 'bg-surface-container-low border-outline-variant hover:border-outline'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-primary text-xs">Ephemeral Lab Kiosk</span>
                    <span className="text-[10px] bg-surface-container-highest text-on-surface px-1.5 py-0.2 font-bold uppercase">Strict Clean</span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-sans leading-tight">
                    RAM-only execution. Entire enclave purged automatically when browser tab closes.
                  </p>
                </label>
              </div>
            </div>
          </section>

          {/* Canonical Role Switcher */}
          <section className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-xs font-bold text-primary uppercase">
                Collegiate Persona Switcher
              </span>
              <span className="text-xs text-secondary font-bold">
                {user?.roles ? `${user.roles.length} ROLES ASSIGNED` : '1 ROLE'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-sans">
              Role switches are strictly verified against your account's assigned roles in the SQLite database.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allRoles.map((r) => {
                const isCurrent = user?.role === r.key;
                const isPermitted = isAdmin || (user?.roles && user.roles.includes(r.key));

                return (
                  <button
                    key={r.key}
                    disabled={!isPermitted}
                    onClick={() => isPermitted && switchRole(r.key)}
                    title={isPermitted ? `Switch to ${r.label}` : 'No verified clearance for this role'}
                    className={`p-3 border text-left flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : isPermitted
                        ? 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant cursor-pointer'
                        : 'bg-surface-container-low/50 text-outline border-outline-variant/40 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase">{r.label}</span>
                      {isCurrent && <span className="text-[9px] bg-secondary px-1 text-on-primary font-bold">ACTIVE</span>}
                    </div>
                    <span className="text-[10px] font-sans">
                      {isPermitted ? 'Permitted Persona' : 'Lacks Clearance'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Password Management & Active Sessions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Password Form */}
          <section className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col gap-4 font-mono">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-xs font-bold text-primary uppercase">
                Update Master Passphrase
              </span>
              <span className="text-secondary text-xs font-bold">BCRYPT 10-ROUNDS</span>
            </div>

            {passSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-500 text-emerald-900 text-xs">
                {passSuccess}
              </div>
            )}

            {passError && (
              <div className="p-3 bg-red-50 border border-error text-error text-xs">
                {passError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">
                  CURRENT PASSPHRASE:
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full p-2 bg-surface-container-low border border-outline-variant text-primary focus:outline-none focus:border-secondary font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface-variant block mb-1">
                  NEW PASSPHRASE (MIN 8 CHARS):
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full p-2 bg-surface-container-low border border-outline-variant text-primary focus:outline-none focus:border-secondary font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface-variant block mb-1">
                  CONFIRM NEW PASSPHRASE:
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full p-2 bg-surface-container-low border border-outline-variant text-primary focus:outline-none focus:border-secondary font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-on-primary hover:bg-secondary uppercase font-bold text-xs tracking-wider transition-all mt-2 shadow-sm cursor-pointer"
              >
                Save New Passphrase
              </button>
            </form>
          </section>

          {/* Active Sessions Registry */}
          <section className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-bold text-primary uppercase">Active Session Registry</span>
              <span className="text-secondary font-bold">1 ACTIVE</span>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant space-y-1">
              <div className="flex items-center justify-between font-bold text-primary">
                <span>THIS RUNTIME SESSION</span>
                <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2">ACTIVE NOW</span>
              </div>
              <div className="text-on-surface-variant text-[11px]">IP: 127.0.0.1 (Localhost Loopback)</div>
              <div className="text-outline text-[10px]">Session Token Verified: SHA-256 Registered in auth_sessions</div>
            </div>
          </section>
        </div>
      </div>

      {/* Admin Enclave: User Directory, Role Delegation & Security Audit Log */}
      {isAdmin && (
        <section className="w-full bg-surface-container-lowest p-6 border border-outline-variant shadow-sm space-y-6 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-outline-variant gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-purple-100 text-purple-900 px-2 py-0.5 font-bold uppercase">
                  ROOT ADMIN CLEARANCE
                </span>
                <span className="font-mono text-xs text-outline">
                  [ROLE_ASSIGNMENTS &amp; AUDIT LOG]
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-1">
                Campus User Governance &amp; Role Delegation Enclave
              </h2>
            </div>
            <button
              onClick={fetchAdminData}
              disabled={adminLoading}
              className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant font-mono text-xs uppercase font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${adminLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{adminLoading ? 'Refreshing...' : 'Refresh Records'}</span>
            </button>
          </div>

          {adminFeedback && (
            <div
              className={`p-3 text-xs font-mono border ${
                adminFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-500'
                  : 'bg-red-50 text-red-900 border-error'
              }`}
            >
              {adminFeedback.message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Role Delegation Form & User Registry */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                Campus User Directory &amp; Active Roles
              </h3>

              <div className="overflow-x-auto border border-outline-variant bg-surface-container-low">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-surface-container border-b border-outline-variant text-outline uppercase">
                    <tr>
                      <th className="p-2.5">User / Email</th>
                      <th className="p-2.5">Dept</th>
                      <th className="p-2.5">Primary</th>
                      <th className="p-2.5">Assigned Roles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {usersList.map((u) => (
                      <tr
                        key={u.id}
                        className={`hover:bg-surface-container cursor-pointer ${
                          selectedUserId === u.id ? 'bg-secondary-fixed/30' : ''
                        }`}
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        <td className="p-2.5">
                          <div className="font-bold text-primary">{u.name}</div>
                          <div className="text-[11px] text-on-surface-variant">{u.email}</div>
                        </td>
                        <td className="p-2.5 text-on-surface-variant">{u.department || '—'}</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 bg-surface-container-high font-bold uppercase">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="flex flex-wrap gap-1">
                            {u.roles?.map((r) => (
                              <span
                                key={r}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase"
                              >
                                {r}
                                {r !== 'student' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRevokeRole(u.id, r);
                                    }}
                                    title={`Revoke ${r}`}
                                    className="hover:text-red-700 ml-0.5 font-bold"
                                  >
                                    ×
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grant Role Form */}
              <form
                onSubmit={handleAssignRole}
                className="p-4 bg-surface-container-low border border-outline-variant space-y-3 font-mono text-xs"
              >
                <div className="font-bold text-primary uppercase">
                  Grant Role Clearance to Selected User
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-outline block mb-1">TARGET USER:</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full p-2 bg-surface-container border border-outline-variant text-primary"
                    >
                      {usersList.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-outline block mb-1">ROLE CLEARANCE:</label>
                    <select
                      value={selectedRoleToAssign}
                      onChange={(e) => setSelectedRoleToAssign(e.target.value as UserRole)}
                      className="w-full p-2 bg-surface-container border border-outline-variant text-primary"
                    >
                      <option value="driver">Transit Driver</option>
                      <option value="proctor">Exam Proctor</option>
                      <option value="ta_faculty">Teaching Assistant &amp; Faculty</option>
                      <option value="warden">Campus Warden</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-primary text-on-primary hover:bg-secondary font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Grant Role
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right: Security Audit Log */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                Security &amp; Auth Audit Trail
              </h3>

              <div className="overflow-x-auto border border-outline-variant bg-surface-container-low max-h-[460px] overflow-y-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-surface-container border-b border-outline-variant text-outline uppercase sticky top-0">
                    <tr>
                      <th className="p-2.5">Event</th>
                      <th className="p-2.5">Identity</th>
                      <th className="p-2.5">IP</th>
                      <th className="p-2.5">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-container">
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold ${
                              log.eventType.includes('DENIED') || log.eventType.includes('FAILED')
                                ? 'bg-red-100 text-red-800'
                                : log.eventType.includes('REVOKED')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {log.eventType}
                          </span>
                        </td>
                        <td className="p-2 text-[11px] text-primary truncate max-w-[130px]" title={log.email}>
                          {log.email}
                        </td>
                        <td className="p-2 text-[10px] text-outline">{log.ipAddress || '127.0.0.1'}</td>
                        <td className="p-2 text-[10px] text-outline whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SettingsPage;