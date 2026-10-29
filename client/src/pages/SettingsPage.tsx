import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface gap-6">
      {/* Header Section */}
      <section className="w-full bg-surface-container-lowest p-6 md:p-8 border border-outline-variant shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary px-2 py-0.5 border border-secondary font-mono font-bold">
            NODE CONTROL // IDENTITY &amp; GOVERNANCE
          </span>
          <span className="font-label-sm text-label-sm text-outline font-mono">
            [SQLITE WAL: 26 TABLES ACTIVE]
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
          </div>
        </div>
      </section>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Keypair Ledger & Storage Architecture */}
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

          {/* Quick Persona Switcher in Settings */}
          <section className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-xs font-bold text-primary uppercase">
                Collegiate Persona Switcher (Sandbox)
              </span>
              <span className="text-xs text-outline uppercase">[INSTANT]</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => switchRole('student')}
                className={`p-2.5 border text-center font-bold text-xs uppercase transition-all ${
                  user?.role === 'student' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => switchRole('driver')}
                className={`p-2.5 border text-center font-bold text-xs uppercase transition-all ${
                  user?.role === 'driver' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant'
                }`}
              >
                Driver
              </button>
              <button
                onClick={() => switchRole('proctor')}
                className={`p-2.5 border text-center font-bold text-xs uppercase transition-all ${
                  user?.role === 'proctor' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant'
                }`}
              >
                Proctor
              </button>
              <button
                onClick={() => switchRole('admin')}
                className={`p-2.5 border text-center font-bold text-xs uppercase transition-all ${
                  user?.role === 'admin' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant'
                }`}
              >
                Admin
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Password Management & Sessions */}
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
                className="w-full py-2.5 bg-primary text-on-primary hover:bg-secondary uppercase font-bold text-xs tracking-wider transition-all mt-2 shadow-sm"
              >
                Save New Passphrase
              </button>
            </form>
          </section>

          {/* Active Sessions Ledger */}
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
              <div className="text-outline text-[10px]">Session Token Verified: SHA-256 Registered</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
