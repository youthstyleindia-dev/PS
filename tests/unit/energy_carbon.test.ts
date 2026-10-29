import { describe, it, expect } from 'vitest';
import { EnergyCarbonOracle, CPU_PROFILE, GPU_PROFILE } from '../fixtures/algorithms/energy_oracle';

describe('Algorithmic Unit Tests — Energy & Carbon Computation (Module C)', () => {
  describe('Non-Linear Dynamic Server Power Modeling', () => {
    it('returns baseline idle power when CPU utilization is zero', () => {
      const power = EnergyCarbonOracle.calculateServerPower(0, 0, 0, 32768, false);
      expect(power).toBe(CPU_PROFILE.pIdle); // 95 W
    });

    it('reaches maximum power capacity when CPU utilization is 100%', () => {
      const power = EnergyCarbonOracle.calculateServerPower(100, 0, 32768, 32768, false);
      expect(power).toBe(CPU_PROFILE.pMax); // 340 W
    });

    it('exhibits non-linear sub-linear/super-linear power curve governed by gamma factor', () => {
      // With gamma = 1.25, P(50%) is strictly less than linear midpoint (95 + 340) / 2 = 217.5 W
      const power50 = EnergyCarbonOracle.calculateServerPower(50, 0, 0, 32768, false);
      const linearMidpoint = (CPU_PROFILE.pIdle + CPU_PROFILE.pMax) / 2;
      expect(power50).toBeLessThan(linearMidpoint);
      expect(power50).toBeGreaterThan(CPU_PROFILE.pIdle);
    });

    it('evaluates GPU node power profile with higher idle and peak draw', () => {
      const gpuPowerIdle = EnergyCarbonOracle.calculateServerPower(0, 0, 0, 32768, true);
      const gpuPowerPeak = EnergyCarbonOracle.calculateServerPower(100, 100, 32768, 32768, true);

      expect(gpuPowerIdle).toBe(GPU_PROFILE.pIdle); // 145 W
      expect(gpuPowerPeak).toBe(GPU_PROFILE.pMax); // 680 W
      expect(gpuPowerPeak).toBeGreaterThan(CPU_PROFILE.pMax);
    });
  });

  describe('Diurnal Grid Carbon Intensity Curves', () => {
    it('accurately resolves clean solar dip during peak daytime solar window', () => {
      const solarIntensity = EnergyCarbonOracle.getGridCarbonIntensity(13); // 1:00 PM
      expect(solarIntensity).toBe(190.0); // g CO2e / kWh
    });

    it('accurately resolves high emissions factor during evening thermal peaker window', () => {
      const peakIntensity = EnergyCarbonOracle.getGridCarbonIntensity(20); // 8:00 PM
      expect(peakIntensity).toBe(680.0); // g CO2e / kWh
    });

    it('returns standard base night intensity for off-peak nocturnal hours', () => {
      const nightIntensity = EnergyCarbonOracle.getGridCarbonIntensity(3); // 3:00 AM
      expect(nightIntensity).toBe(410.0); // g CO2e / kWh
    });
  });

  describe('Facility Telemetry & Baseline vs Eco Scenario Comparison', () => {
    it('multiplies IT server power by facility PUE factor', () => {
      const baseResult = EnergyCarbonOracle.computeTelemetry({
        serviceId: 'srv-portal',
        rps: 100,
        cpuPct: 50,
        memoryMb: 8192,
        replicas: 2,
        pue: 1.75, // Legacy PUE
      });

      const optResult = EnergyCarbonOracle.computeTelemetry({
        serviceId: 'srv-portal',
        rps: 100,
        cpuPct: 50,
        memoryMb: 8192,
        replicas: 2,
        pue: 1.20, // Eco PUE
      });

      expect(baseResult.facilityPowerWatts).toBeGreaterThan(optResult.facilityPowerWatts);
      const ratio = baseResult.facilityPowerWatts / optResult.facilityPowerWatts;
      expect(Math.round(ratio * 100) / 100).toBe(Math.round((1.75 / 1.20) * 100) / 100);
    });

    it('computes positive energy, carbon, and financial savings in eco-optimized scenario', () => {
      const baseline = {
        serviceId: 'srv-portal',
        rps: 300,
        cpuPct: 80,
        memoryMb: 16384,
        replicas: 4,
        hourOfDay: 19, // Evening peak grid
      };

      const optimized = {
        serviceId: 'srv-portal',
        rps: 300,
        cpuPct: 45,
        memoryMb: 16384,
        replicas: 2, // Consolidated
        hourOfDay: 13, // Solar window
      };

      const comparison = EnergyCarbonOracle.compareScenarios(baseline, optimized, 24);

      expect(comparison.kwhSaved).toBeGreaterThan(0);
      expect(comparison.pctEnergySaved).toBeGreaterThanOrEqual(30.0);
      expect(comparison.carbonAvoidedGrams).toBeGreaterThan(0);
      expect(comparison.costSavedInr).toBeGreaterThan(0);
      expect(comparison.costSavedInr).toBe(Math.round(comparison.kwhSaved * 9.5 * 100) / 100);
    });
  });
});
