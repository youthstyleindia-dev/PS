import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { EnergyCarbonOracle } from '../algorithms/energy_oracle.js';
import { requireRole } from '../middleware/auth.middleware.js';

export const sustainabilityRouter = Router();

let ecoOptimizationEnabled = false;

// GET /api/sustainability/services
sustainabilityRouter.get('/services', (_req: Request, res: Response) => {
  const db = getDb();
  const services = db.prepare('SELECT * FROM service_workloads').all();
  res.json(services);
});

// POST /api/sustainability/workloads/:serviceId/scale
sustainabilityRouter.post('/workloads/:serviceId/scale', requireRole('admin'), (req: Request, res: Response) => {
  const { targetRps, currentReplicas } = req.body;
  const db = getDb();
  const svc = db.prepare('SELECT * FROM service_workloads WHERE id = ?').get(req.params.serviceId);
  if (!svc) return res.status(404).json({ error: 'Service not found' });

  db.prepare(`
    UPDATE service_workloads
    SET target_rps = COALESCE(?, target_rps),
        current_replicas = COALESCE(?, current_replicas)
    WHERE id = ?
  `).run(targetRps ?? null, currentReplicas ?? null, req.params.serviceId);

  res.json({ success: true, serviceId: req.params.serviceId, targetRps, currentReplicas });
});

// GET /api/sustainability/telemetry
sustainabilityRouter.get('/telemetry', (req: Request, res: Response) => {
  const db = getDb();
  const services = db.prepare('SELECT * FROM service_workloads').all() as any[];
  const hour = req.query.hour ? parseInt(req.query.hour as string, 10) : new Date().getHours();
  const pue = ecoOptimizationEnabled ? 1.20 : 1.75;

  const snapshots = services.map((svc) => {
    const cpuPct = Math.min(95, Math.round(20 + (svc.target_rps / 500) * 60));
    const calc = EnergyCarbonOracle.computeTelemetry({
      serviceId: svc.id,
      rps: svc.target_rps,
      cpuPct,
      gpuPct: 0,
      memoryMb: 4096,
      replicas: svc.current_replicas,
      hourOfDay: hour,
      pue,
    });

    return {
      serviceId: svc.id,
      serviceName: svc.service_name,
      targetRps: svc.target_rps,
      latencyP50Ms: Math.round(25 + (cpuPct / 100) * 80),
      latencyP95Ms: Math.round(45 + (cpuPct / 100) * 160),
      cpuPct,
      gpuPct: 0,
      replicas: svc.current_replicas,
      powerWatts: calc.facilityPowerWatts,
      energyKwhPerHour: calc.energyKwhPerHour,
      carbonGramsPerHour: calc.carbonGramsPerHour,
      gridCarbonIntensity: calc.gridCarbonIntensityGPerKwh,
      pue,
      provenance: 'ESTIMATED_METRIC',
    };
  });

  const totalPower = snapshots.reduce((a, b) => a + b.powerWatts, 0);
  const totalCarbon = snapshots.reduce((a, b) => a + b.carbonGramsPerHour, 0);

  res.json({
    snapshots,
    totalPowerWatts: totalPower,
    totalCarbonGramsPerHour: Math.round(totalCarbon * 10) / 10,
    ecoOptimizationActive: ecoOptimizationEnabled,
    pue,
    provenanceDisclosures: {
      power: 'ESTIMATED_METRIC: Non-linear server model P(U) with facility PUE',
      carbon: 'ESTIMATED_METRIC: Diurnal regional grid carbon intensity profile (CEA regional factor baseline)',
      workload: 'SIMULATED_EVENT: Multi-service traffic profile',
    },
  });
});

// GET /api/sustainability/scenarios
sustainabilityRouter.get('/scenarios', (_req: Request, res: Response) => {
  const comparison = EnergyCarbonOracle.compareScenarios(
    { serviceId: 'srv-academic', rps: 300, cpuPct: 75.0, memoryMb: 16384, replicas: 4, hourOfDay: 19 },
    { serviceId: 'srv-academic', rps: 300, cpuPct: 45.0, memoryMb: 16384, replicas: 2, hourOfDay: 13 },
    24
  );

  res.json({
    baselineScenario: {
      name: 'Legacy Baseline (Unoptimized)',
      pue: 1.75,
      dailyKwh: comparison.baselineKwh,
      dailyCarbonGrams: comparison.baselineCarbonGrams,
      replicas: 4,
      avgCpuPct: 75,
      description: 'Provisioned for peak traffic with high idle overhead and legacy cooling (PUE 1.75).'
    },
    optimizedScenario: {
      name: 'Eco-Optimized (Dynamic Autoscaling & Solar Align)',
      pue: 1.20,
      dailyKwh: comparison.optimizedKwh,
      dailyCarbonGrams: comparison.optimizedCarbonGrams,
      replicas: 2,
      avgCpuPct: 45,
      description: 'Dynamic resource right-sizing, batch deferral to solar peak hours, modern free-air cooling (PUE 1.20).'
    },
    gains: {
      dailyKwhSaved: comparison.kwhSaved,
      pctEnergySaved: comparison.pctEnergySaved,
      dailyCarbonAvoidedGrams: comparison.carbonAvoidedGrams,
      costSavedInr: comparison.costSavedInr,
    },
    modelAssumptions: {
      formulaEnergy: 'Energy (kWh) = Average Power (W) × Runtime (h) / 1000',
      formulaCarbon: 'Carbon (g CO2e) = Energy (kWh) × Grid Carbon Intensity (g/kWh)',
      regionalGridFactor: 'Diurnal variation: 580 g/kWh (solar peak noon) to 820 g/kWh (evening peak)',
      pueBaseline: 1.75,
      pueOptimized: 1.20,
      electricityTariff: '₹8.50 per kWh'
    }
  });
});

// POST /api/sustainability/toggle-optimization
sustainabilityRouter.post('/toggle-optimization', requireRole('admin'), (req: Request, res: Response) => {
  ecoOptimizationEnabled = req.body.enabled === true;
  res.json({ success: true, ecoOptimizationEnabled });
});
