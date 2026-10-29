export interface ServerPowerProfile {
  pIdle: number;
  pMax: number;
  gamma: number;
}

export const CPU_PROFILE: ServerPowerProfile = {
  pIdle: 95.0,
  pMax: 340.0,
  gamma: 1.25,
};

export const GPU_PROFILE: ServerPowerProfile = {
  pIdle: 145.0,
  pMax: 680.0,
  gamma: 1.35,
};

export interface WorkloadTelemetryInput {
  serviceId: string;
  rps: number;
  cpuPct: number; // 0 - 100
  gpuPct?: number; // 0 - 100
  memoryMb: number;
  totalMemoryMb?: number;
  replicas: number;
  hourOfDay?: number; // 0 - 23
  pue?: number;
}

export interface TelemetryCalculationResult {
  serverPowerWatts: number;
  facilityPowerWatts: number;
  energyKwhPerHour: number;
  gridCarbonIntensityGPerKwh: number;
  carbonGramsPerHour: number;
  provenance: 'ESTIMATED_METRIC';
}

export interface ScenarioComparisonResult {
  baselineKwh: number;
  optimizedKwh: number;
  kwhSaved: number;
  pctEnergySaved: number;
  baselineCarbonGrams: number;
  optimizedCarbonGrams: number;
  carbonAvoidedGrams: number;
  costSavedInr: number;
}

export class EnergyCarbonOracle {
  public static getGridCarbonIntensity(hour = 12): number {
    // Diurnal grid intensity profile
    // 10:00 - 15:00: Solar peak (190 g/kWh)
    if (hour >= 10 && hour <= 15) return 190.0;
    // 18:00 - 22:00: Peaker thermal peak (680 g/kWh)
    if (hour >= 18 && hour <= 22) return 680.0;
    // 23:00 - 07:00: Night base (410 g/kWh)
    if (hour >= 23 || hour <= 7) return 410.0;
    // Shoulder / standard daytime: 475 g/kWh
    return 475.0;
  }

  public static calculateServerPower(
    cpuPct: number,
    gpuPct = 0,
    memoryMb = 4096,
    totalMemoryMb = 32768,
    isGpuNode = false
  ): number {
    const profile = isGpuNode ? GPU_PROFILE : CPU_PROFILE;
    const cpuNorm = Math.min(1.0, Math.max(0.0, cpuPct / 100));
    const gpuNorm = Math.min(1.0, Math.max(0.0, gpuPct / 100));
    const memNorm = Math.min(1.0, Math.max(0.0, memoryMb / totalMemoryMb));

    const compositeU = isGpuNode
      ? 0.35 * cpuNorm + 0.55 * gpuNorm + 0.1 * memNorm
      : 0.85 * cpuNorm + 0.15 * memNorm;

    const dynamicPower = (profile.pMax - profile.pIdle) * Math.pow(compositeU, profile.gamma);
    return Math.round((profile.pIdle + dynamicPower) * 10) / 10;
  }

  public static computeTelemetry(input: WorkloadTelemetryInput): TelemetryCalculationResult {
    const isGpuNode = input.serviceId.includes('ai') || input.serviceId.includes('gpu');
    const perServerWatts = this.calculateServerPower(
      input.cpuPct,
      input.gpuPct ?? 0,
      input.memoryMb,
      input.totalMemoryMb ?? 32768,
      isGpuNode
    );

    const totalServerWatts = perServerWatts * Math.max(1, input.replicas);
    const pue = input.pue ?? 1.35;
    const facilityWatts = Math.round(totalServerWatts * pue * 10) / 10;
    const energyKwh = Math.round((facilityWatts / 1000) * 1000) / 1000;

    const hour = input.hourOfDay ?? 12;
    const gridCI = this.getGridCarbonIntensity(hour);
    const carbonGrams = Math.round(energyKwh * gridCI * 10) / 10;

    return {
      serverPowerWatts: totalServerWatts,
      facilityPowerWatts: facilityWatts,
      energyKwhPerHour: energyKwh,
      gridCarbonIntensityGPerKwh: gridCI,
      carbonGramsPerHour: carbonGrams,
      provenance: 'ESTIMATED_METRIC',
    };
  }

  public static compareScenarios(
    baselineInput: WorkloadTelemetryInput,
    optimizedInput: WorkloadTelemetryInput,
    durationHours = 24
  ): ScenarioComparisonResult {
    // Baseline legacy facility: PUE = 1.75
    const base = this.computeTelemetry({ ...baselineInput, pue: 1.75 });
    // Eco-optimized facility: PUE = 1.20
    const opt = this.computeTelemetry({ ...optimizedInput, pue: 1.20 });

    const baselineKwh = base.energyKwhPerHour * durationHours;
    const optimizedKwh = opt.energyKwhPerHour * durationHours;
    const kwhSaved = Math.max(0, baselineKwh - optimizedKwh);
    const roundedKwhSaved = Math.round(kwhSaved * 100) / 100;
    const pctSaved = baselineKwh > 0 ? Math.round((roundedKwhSaved / baselineKwh) * 1000) / 10 : 0;

    const baseCarbon = base.carbonGramsPerHour * durationHours;
    const optCarbon = opt.carbonGramsPerHour * durationHours;
    const carbonAvoided = Math.max(0, baseCarbon - optCarbon);

    // Electricity tariff: ₹9.50 / kWh
    const costSaved = Math.round(roundedKwhSaved * 9.5 * 100) / 100;

    return {
      baselineKwh: Math.round(baselineKwh * 100) / 100,
      optimizedKwh: Math.round(optimizedKwh * 100) / 100,
      kwhSaved: roundedKwhSaved,
      pctEnergySaved: pctSaved,
      baselineCarbonGrams: Math.round(baseCarbon * 10) / 10,
      optimizedCarbonGrams: Math.round(optCarbon * 10) / 10,
      carbonAvoidedGrams: Math.round(carbonAvoided * 10) / 10,
      costSavedInr: costSaved,
    };
  }
}
