import { ExamObservationInput } from '../types/observations';

type ObservationCallback = (observation: ExamObservationInput) => void;

/**
 * Manages observation transmission to the backend API.
 * Enforces zero raw image/video transmission and manages bounded offline retry queue.
 */
export class ObservationEmitter {
  private sessionId: string;
  private listeners: Set<ObservationCallback> = new Set();
  private pendingQueue: ExamObservationInput[] = [];
  private isFlushing = false;
  private maxQueueSize = 20;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
  }

  public subscribe(cb: ObservationCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /**
   * Emit an observation event. Broadcasts to local UI subscribers and persists metadata to backend.
   */
  public async emit(observation: ExamObservationInput): Promise<boolean> {
    // 1. Strict Privacy Invariant: verify no raw video/image payload is present
    const payloadStr = JSON.stringify(observation);
    if (
      payloadStr.includes('base64') ||
      payloadStr.includes('data:image') ||
      payloadStr.includes('frameSnapshot') ||
      payloadStr.includes('canvasBlob')
    ) {
      console.error('[ObservationEmitter] PRIVACY VIOLATION PREVENTED: Payload contained binary image data.');
      return false;
    }

    // 2. Broadcast immediately to local UI listeners
    for (const cb of this.listeners) {
      try {
        cb(observation);
      } catch (err) {
        console.error('[ObservationEmitter] Listener error:', err);
      }
    }

    // 3. Queue and flush to backend
    if (this.pendingQueue.length >= this.maxQueueSize) {
      this.pendingQueue.shift(); // Drop oldest to prevent unbounded growth
    }
    this.pendingQueue.push(observation);
    return this.flushQueue();
  }

  public async flushQueue(): Promise<boolean> {
    if (this.isFlushing || this.pendingQueue.length === 0) return true;
    this.isFlushing = true;

    try {
      while (this.pendingQueue.length > 0) {
        const item = this.pendingQueue[0];
        const res = await fetch(`/api/exam-sessions/${this.sessionId}/observations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('universe_token')
              ? { Authorization: `Bearer ${localStorage.getItem('universe_token')}` }
              : {})
          },
          body: JSON.stringify(item)
        });

        if (res.ok || res.status === 409) {
          // Successfully stored or already exists (idempotent)
          this.pendingQueue.shift();
        } else if (res.status === 401 || res.status === 403 || res.status === 400) {
          // Client/Auth error: drop invalid event to prevent infinite loop
          this.pendingQueue.shift();
        } else {
          // Network or server error: stop flushing, leave in queue for next retry
          break;
        }
      }
      return true;
    } catch (err) {
      console.warn('[ObservationEmitter] Network error persisting observation metadata, queued for retry:', err);
      return false;
    } finally {
      this.isFlushing = false;
    }
  }

  public getPendingQueueLength(): number {
    return this.pendingQueue.length;
  }
}
