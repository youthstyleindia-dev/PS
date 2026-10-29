import { describe, it, expect } from 'vitest';
import { PrivacyWellbeingOracle } from '../fixtures/algorithms/privacy_oracle';

describe('Algorithmic Unit Tests — Privacy, Laplace DP & Wellbeing Analytics (Module D)', () => {
  describe('Local-First URL & Hostname Sanitization', () => {
    it('strips query parameters, search tokens, and credentials completely', () => {
      const sanitized = PrivacyWellbeingOracle.sanitizeUrlToHostname(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&auth_token=super_secret_session_token_123'
      );
      expect(sanitized).toBe('youtube.com');
      expect(sanitized).not.toContain('auth_token');
      expect(sanitized).not.toContain('watch');
    });

    it('strips path segments, fragments, and www subdomains', () => {
      const sanitized = PrivacyWellbeingOracle.sanitizeUrlToHostname(
        'https://www.github.com/torvalds/linux/pull/1234#issuecomment-987'
      );
      expect(sanitized).toBe('github.com');
    });

    it('handles URLs without protocol scheme correctly', () => {
      const sanitized = PrivacyWellbeingOracle.sanitizeUrlToHostname('arxiv.org/abs/2301.00001?download=true');
      expect(sanitized).toBe('arxiv.org');
    });

    it('returns empty string on empty or non-string input without throwing', () => {
      expect(PrivacyWellbeingOracle.sanitizeUrlToHostname('')).toBe('');
      expect(PrivacyWellbeingOracle.sanitizeUrlToHostname(null as any)).toBe('');
    });
  });

  describe('Laplace Differential Privacy Noise Mechanism', () => {
    it('evaluates Laplace inverse transform symmetry around zero', () => {
      const scale = 10.0;
      // For uniform random u in (-0.5, 0.5): u = 0.25 and u = -0.25
      const positiveNoise = PrivacyWellbeingOracle.generateLaplaceNoise(scale, 0.25);
      const negativeNoise = PrivacyWellbeingOracle.generateLaplaceNoise(scale, -0.25);

      expect(positiveNoise).toBeGreaterThan(0);
      expect(negativeNoise).toBeLessThan(0);
      expect(Math.abs(positiveNoise + negativeNoise)).toBeLessThan(1e-6);
    });

    it('exhibits empirical mean approximately zero across repeated Laplace noise draws', () => {
      const scale = 5.0;
      const iterations = 1000;
      let sum = 0;
      for (let i = 0; i < iterations; i++) {
        sum += PrivacyWellbeingOracle.generateLaplaceNoise(scale);
      }
      const empiricalMean = sum / iterations;
      // Expect mean within reasonable sampling error bounds
      expect(Math.abs(empiricalMean)).toBeLessThan(1.5);
    });
  });

  describe('Cohort k-Anonymity Guardrails', () => {
    it('suppresses reporting when cohort size is below threshold k = 5', () => {
      const smallCohort = [120, 150, 180]; // n = 3 < 5
      const result = PrivacyWellbeingOracle.computeCohortAggregate('Computer Science', smallCohort, 5, 0.8);

      expect(result.isSuppressed).toBe(true);
      expect(result.suppressionReason).toContain('INSUFFICIENT_COHORT_SIZE');
      expect(result.dpMeanFocusMins).toBeUndefined();
    });

    it('computes differential privacy aggregate when cohort size satisfies k >= 5', () => {
      const validCohort = [120, 180, 240, 210, 190, 300]; // n = 6 >= 5
      const result = PrivacyWellbeingOracle.computeCohortAggregate('Computer Science', validCohort, 5, 0.8);

      expect(result.isSuppressed).toBe(false);
      expect(result.dpMeanFocusMins).toBeDefined();
      expect(result.dpMeanFocusMins).toBeGreaterThanOrEqual(0);
      expect(result.epsilon).toBe(0.8);
    });
  });

  describe('Focus Analytics & Deep Work Index (DWI) Formulation', () => {
    it('awards high Deep Work Index for dedicated productive sessions with low context switching', () => {
      const events = [
        { domain: 'github.com', category: 'PRODUCTIVE' as const, durationSeconds: 1800 },
        { domain: 'stackoverflow.com', category: 'PRODUCTIVE' as const, durationSeconds: 1800 },
      ];
      const stats = PrivacyWellbeingOracle.computeSessionAnalytics(3600, 0, events);

      expect(stats.contextSwitchCount).toBe(0);
      expect(stats.contextSwitchRatePerHour).toBe(0);
      expect(stats.deepWorkIndex).toBeGreaterThanOrEqual(80);
    });

    it('penalizes Deep Work Index when frequent context switching and distraction occur', () => {
      // 10 alternating switches in 1 hour
      const events: Array<{ domain: string; category: 'PRODUCTIVE' | 'DISTRACTING' | 'NEUTRAL'; durationSeconds: number }> = [];
      for (let i = 0; i < 10; i++) {
        events.push({ domain: 'github.com', category: 'PRODUCTIVE', durationSeconds: 180 });
        events.push({ domain: 'youtube.com', category: 'DISTRACTING', durationSeconds: 180 });
      }

      const stats = PrivacyWellbeingOracle.computeSessionAnalytics(3600, 0, events);
      expect(stats.contextSwitchCount).toBeGreaterThanOrEqual(10);
      expect(stats.contextSwitchRatePerHour).toBeGreaterThanOrEqual(10);
      expect(stats.deepWorkIndex).toBeLessThan(50);
    });
  });
});
