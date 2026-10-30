import { ObservationRecord, ObservationReviewStatus } from '../types/observations';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('universe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCapabilities(): Promise<any> {
  const res = await fetch('/api/exam-monitor/capabilities');
  if (!res.ok) throw new Error('Failed to fetch vision monitor capabilities');
  return res.json();
}

export async function recordVisionConsent(
  sessionId: string,
  consentStatus: 'granted' | 'declined' | 'withdrawn'
): Promise<any> {
  const res = await fetch(`/api/exam-sessions/${sessionId}/vision-consent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ consentStatus, explanationVersion: 'v1.0', consentVersion: 'v1.0' })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to record vision consent');
  }
  return res.json();
}

export async function fetchSessionObservations(sessionId: string): Promise<ObservationRecord[]> {
  const res = await fetch(`/api/exam-sessions/${sessionId}/observations`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPendingReviews(): Promise<any[]> {
  const res = await fetch('/api/exams/pending-reviews', {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) return [];
  return res.json();
}

export async function submitReviewDecision(
  observationId: string,
  decision: ObservationReviewStatus,
  reviewNote: string
): Promise<any> {
  const res = await fetch(`/api/proctor/observations/${observationId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ decision, reviewNote })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit review decision');
  }
  return res.json();
}
