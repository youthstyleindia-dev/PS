export interface DomainClassification {
  domain: string;
  category: 'PRODUCTIVE' | 'DISTRACTING' | 'NEUTRAL';
}

export interface FocusSessionStats {
  totalSeconds: number;
  activeSeconds: number;
  pausedSeconds: number;
  productiveSeconds: number;
  distractingSeconds: number;
  neutralSeconds: number;
  contextSwitchCount: number;
  contextSwitchRatePerHour: number;
  deepWorkIndex: number;
}

export interface CohortAggregateResult {
  department: string;
  cohortSize: number;
  isSuppressed: boolean;
  suppressionReason?: string;
  rawMeanFocusMins?: number;
  dpMeanFocusMins?: number;
  epsilon?: number;
  noiseAdded?: number;
}

export class PrivacyWellbeingOracle {
  public static sanitizeUrlToHostname(rawUrl: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    try {
      let urlToParse = rawUrl.trim();
      if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
        urlToParse = 'https://' + urlToParse;
      }
      const parsed = new URL(urlToParse);
      let hostname = parsed.hostname.toLowerCase();
      // Strip common www prefix
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      // Remove any trailing port if attached incorrectly
      return hostname.split(':')[0];
    } catch {
      // Fallback regex if URL parsing fails
      const cleaned = rawUrl.split('?')[0].split('#')[0].replace(/^https?:\/\//i, '').split('/')[0];
      return cleaned.toLowerCase().replace(/^www\./i, '').split(':')[0].trim();
    }
  }

  public static generateLaplaceNoise(scale: number, uniformRandom?: number): number {
    if (scale <= 0) return 0;
    // Uniform random in (-0.5, 0.5)
    const u = uniformRandom !== undefined ? uniformRandom : Math.random() - 0.5;
    // Laplace inverse CDF: -b * sgn(u) * ln(1 - 2|u|)
    const sgn = u < 0 ? -1 : 1;
    const noise = -scale * sgn * Math.log(1 - 2 * Math.abs(u));
    return noise;
  }

  public static computeCohortAggregate(
    department: string,
    individualFocusMinutes: number[],
    minCohort = 5,
    epsilon = 0.8,
    maxFocusCap = 480
  ): CohortAggregateResult {
    const cohortSize = individualFocusMinutes.length;

    // k-Anonymity suppression guardrail
    if (cohortSize < minCohort) {
      return {
        department,
        cohortSize,
        isSuppressed: true,
        suppressionReason: `INSUFFICIENT_COHORT_SIZE: n=${cohortSize} is below k-anonymity threshold k=${minCohort}`,
      };
    }

    // Clamp individual values to [0, maxFocusCap]
    const clamped = individualFocusMinutes.map((m) => Math.min(maxFocusCap, Math.max(0, m)));
    const rawSum = clamped.reduce((a, b) => a + b, 0);
    const rawMean = rawSum / cohortSize;

    // Sensitivity Delta f = (T_max - T_min) / cohortSize
    const sensitivity = maxFocusCap / cohortSize;
    const scale = sensitivity / epsilon;
    const noise = this.generateLaplaceNoise(scale);
    const dpMean = Math.round((rawMean + noise) * 10) / 10;

    return {
      department,
      cohortSize,
      isSuppressed: false,
      rawMeanFocusMins: Math.round(rawMean * 10) / 10,
      dpMeanFocusMins: Math.max(0, dpMean),
      epsilon,
      noiseAdded: Math.round(noise * 10) / 10,
    };
  }

  public static computeSessionAnalytics(
    totalDurationSeconds: number,
    pausedSeconds: number,
    domainEvents: Array<{ domain: string; category: 'PRODUCTIVE' | 'DISTRACTING' | 'NEUTRAL'; durationSeconds: number }>
  ): FocusSessionStats {
    const activeSeconds = Math.max(0, totalDurationSeconds - pausedSeconds);

    let productiveSec = 0;
    let distractingSec = 0;
    let neutralSec = 0;
    let switchCount = 0;
    let lastCategory: string | null = null;

    for (const ev of domainEvents) {
      if (ev.category === 'PRODUCTIVE') productiveSec += ev.durationSeconds;
      else if (ev.category === 'DISTRACTING') distractingSec += ev.durationSeconds;
      else neutralSec += ev.durationSeconds;

      if (lastCategory && lastCategory !== ev.category) {
        if (
          (lastCategory === 'PRODUCTIVE' && ev.category === 'DISTRACTING') ||
          (lastCategory === 'DISTRACTING' && ev.category === 'PRODUCTIVE')
        ) {
          switchCount++;
        }
      }
      lastCategory = ev.category;
    }

    const activeHours = activeSeconds > 0 ? activeSeconds / 3600 : 0.01;
    const csr = Math.round((switchCount / activeHours) * 10) / 10;

    // Active Focus Ratio (AFR)
    const afr = activeSeconds > 0 ? productiveSec / activeSeconds : 1.0;
    const distractionRatio = totalDurationSeconds > 0 ? distractingSec / totalDurationSeconds : 0;
    const switchPenalty = Math.max(0, 1 - csr / 12.0);

    // DWI Formula: clamp(0, 100, 100 * (0.5 * AFR + 0.3 * switchPenalty - 0.2 * distractionRatio))
    const rawDWI = 100 * (0.5 * afr + 0.3 * switchPenalty - 0.2 * distractionRatio);
    const dwi = Math.round(Math.min(100, Math.max(0, rawDWI)));

    return {
      totalSeconds: totalDurationSeconds,
      activeSeconds,
      pausedSeconds,
      productiveSeconds: productiveSec,
      distractingSeconds: distractingSec,
      neutralSeconds: neutralSec,
      contextSwitchCount: switchCount,
      contextSwitchRatePerHour: csr,
      deepWorkIndex: dwi,
    };
  }
}
