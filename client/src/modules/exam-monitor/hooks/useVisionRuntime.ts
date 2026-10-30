import { useState, useRef, useEffect, useCallback } from 'react';
import { getVisionTasks, VisionTasksHolder } from '../vision/createVisionTasks';
import { HeadPoseEstimator } from '../vision/headPoseEstimator';
import { RoiGeometryEngine } from '../vision/roiGeometry';
import { ObservationRuleEngine } from '../vision/observationRules';
import { ObservationEmitter } from '../vision/observationEmitter';
import { HeadOrientationAngles, PersonDetectionBox, VisionDiagnostics, ModelRuntimeState } from '../types/vision';
import { ExamObservationInput, NormalizedRoi } from '../types/observations';

export function useVisionRuntime(
  sessionId: string,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  isCameraActive: boolean
) {
  const [runtimeState, setRuntimeState] = useState<ModelRuntimeState>('uninitialized');
  const [diagnostics, setDiagnostics] = useState<VisionDiagnostics>({
    fps: 0,
    inferenceLatencyMs: 0,
    droppedFrames: 0,
    lastProcessedTimestamp: 0,
    faceTaskStatus: 'unavailable',
    personTaskStatus: 'unavailable'
  });

  const [currentPose, setCurrentPose] = useState<HeadOrientationAngles>({
    yawDegrees: 0,
    pitchDegrees: 0,
    rollDegrees: 0,
    quality: 'NO_FACE'
  });

  const [personCount, setPersonCount] = useState<number>(0);
  const [inRestrictedRegion, setInRestrictedRegion] = useState<boolean>(false);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  // Core engines
  const visionHolderRef = useRef<VisionTasksHolder | null>(null);
  const poseEstimatorRef = useRef<HeadPoseEstimator>(new HeadPoseEstimator());
  const ruleEngineRef = useRef<ObservationRuleEngine>(new ObservationRuleEngine(sessionId));
  const emitterRef = useRef<ObservationEmitter>(new ObservationEmitter(sessionId));

  const animFrameIdRef = useRef<number | null>(null);
  const isProcessingFrameRef = useRef<boolean>(false);
  const lastInferenceTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsCalcTimeRef = useRef<number>(Date.now());
  const droppedFramesRef = useRef<number>(0);

  const restrictedRoiRef = useRef<NormalizedRoi>(RoiGeometryEngine.DEFAULT_RESTRICTED_ROI);

  // Initialize MediaPipe Vision Tasks
  useEffect(() => {
    let isCancelled = false;
    setRuntimeState('loading');

    getVisionTasks()
      .then(holder => {
        if (isCancelled) return;
        visionHolderRef.current = holder;

        const hasFace = !!holder.faceLandmarker;
        const hasObj = !!holder.objectDetector;

        if (hasFace && hasObj) {
          setRuntimeState('ready');
        } else if (hasFace || hasObj) {
          setRuntimeState('partially_ready');
        } else {
          setRuntimeState('error');
        }

        setDiagnostics(prev => ({
          ...prev,
          faceTaskStatus: hasFace ? 'ready' : 'unavailable',
          personTaskStatus: hasObj ? 'ready' : 'unavailable'
        }));
      })
      .catch(() => {
        if (!isCancelled) {
          setRuntimeState('error');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Update session ID in engines
  useEffect(() => {
    ruleEngineRef.current.setSessionId(sessionId);
    emitterRef.current.setSessionId(sessionId);
  }, [sessionId]);

  // Calibration action
  const calibrateNeutral = useCallback(() => {
    if (currentPose.quality === 'GOOD') {
      poseEstimatorRef.current.setBaseline(
        currentPose.yawDegrees,
        currentPose.pitchDegrees,
        currentPose.rollDegrees
      );
      setIsCalibrated(true);
      return true;
    }
    return false;
  }, [currentPose]);

  // Main Inference & Canvas Visualization Loop
  useEffect(() => {
    if (!isCameraActive || (runtimeState !== 'ready' && runtimeState !== 'partially_ready')) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState < 2) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const now = performance.now();
      // Target FPS: ~6 - 8 FPS (run inference every 130ms)
      const targetIntervalMs = 130;

      if (isProcessingFrameRef.current) {
        droppedFramesRef.current++;
        animFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (now - lastInferenceTimeRef.current < targetIntervalMs) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      lastInferenceTimeRef.current = now;
      isProcessingFrameRef.current = true;

      const holder = visionHolderRef.current;
      const wallClockNow = Date.now();

      try {
        let poseResult: HeadOrientationAngles = {
          yawDegrees: 0,
          pitchDegrees: 0,
          rollDegrees: 0,
          quality: 'NO_FACE'
        };

        const personDetections: PersonDetectionBox[] = [];

        // 1. Run Face Landmarker Inference
        if (holder?.faceLandmarker) {
          try {
            const faceResult = holder.faceLandmarker.detectForVideo(video, wallClockNow);
            if (faceResult && faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
              const matrix = faceResult.facialTransformationMatrixes?.[0]?.data || null;
              const landmarks = faceResult.faceLandmarks[0] || null;
              poseResult = poseEstimatorRef.current.estimatePose(matrix, landmarks);
            }
          } catch (e) {
            // Inference error on frame
          }
        }

        // 2. Run Object Detector Inference (filtered to 'person')
        if (holder?.objectDetector) {
          try {
            const objResult = holder.objectDetector.detectForVideo(video, wallClockNow);
            if (objResult && objResult.detections) {
              for (const det of objResult.detections) {
                const cat = det.categories?.[0];
                if (cat && cat.categoryName?.toLowerCase() === 'person' && det.boundingBox) {
                  const bb = det.boundingBox;
                  const vWidth = video.videoWidth || 640;
                  const vHeight = video.videoHeight || 480;

                  personDetections.push({
                    category: 'person',
                    score: cat.score || 0.7,
                    box: {
                      originX: bb.originX / vWidth,
                      originY: bb.originY / vHeight,
                      width: bb.width / vWidth,
                      height: bb.height / vHeight
                    }
                  });
                }
              }
            }
          } catch (e) {
            // Detection error on frame
          }
        }

        // 3. Evaluate Observation Rules
        const headObs = ruleEngineRef.current.evaluateHeadOrientation(
          poseResult,
          wallClockNow,
          'LIVE_MODEL_INFERENCE'
        );
        if (headObs) {
          emitterRef.current.emit(headObs);
        }

        const roi = restrictedRoiRef.current;
        const objObs = ruleEngineRef.current.evaluateObjectDetections(
          personDetections,
          roi,
          wallClockNow,
          'LIVE_MODEL_INFERENCE'
        );
        if (objObs) {
          emitterRef.current.emit(objObs);
        }

        // 4. Update UI State & Overlay Canvas
        setCurrentPose(poseResult);
        setPersonCount(personDetections.length);

        const incursionCheck = RoiGeometryEngine.evaluateAll(personDetections, roi);
        const hasActiveIncursion = incursionCheck.incursions.length > 0;
        setInRestrictedRegion(hasActiveIncursion);

        // Render Canvas Visualizer
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw Restricted Region ROI Box
          const rx = roi.x * canvas.width;
          const ry = roi.y * canvas.height;
          const rw = roi.width * canvas.width;
          const rh = roi.height * canvas.height;

          ctx.strokeStyle = hasActiveIncursion ? '#ba1a1a' : '#003fe1';
          ctx.lineWidth = hasActiveIncursion ? 3 : 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(rx, ry, rw, rh);
          ctx.setLineDash([]);

          ctx.fillStyle = hasActiveIncursion ? 'rgba(186, 26, 26, 0.25)' : 'rgba(0, 63, 225, 0.08)';
          ctx.fillRect(rx, ry, rw, rh);

          ctx.fillStyle = hasActiveIncursion ? '#ba1a1a' : '#003fe1';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(
            hasActiveIncursion ? '! RESTRICTED ZONE INCURSION' : 'RESTRICTED REGION',
            rx + 8,
            ry + 18
          );

          // Draw Bounding Boxes for Detected Persons
          for (const p of personDetections) {
            const px = p.box.originX * canvas.width;
            const py = p.box.originY * canvas.height;
            const pw = p.box.width * canvas.width;
            const ph = p.box.height * canvas.height;

            ctx.strokeStyle = '#39F59A';
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, pw, ph);

            // Person Tag Badge
            ctx.fillStyle = 'rgba(8, 13, 20, 0.85)';
            ctx.fillRect(px, py - 18, 90, 18);
            ctx.fillStyle = '#39F59A';
            ctx.font = '10px monospace';
            ctx.fillText(`person ${Math.round(p.score * 100)}%`, px + 4, py - 5);
          }
        }

        // Measure FPS and Latency
        const inferenceLatency = Math.round(performance.now() - now);
        frameCountRef.current++;

        if (wallClockNow - lastFpsCalcTimeRef.current >= 1000) {
          const fps = frameCountRef.current;
          frameCountRef.current = 0;
          lastFpsCalcTimeRef.current = wallClockNow;

          setDiagnostics(prev => ({
            ...prev,
            fps,
            inferenceLatencyMs: inferenceLatency,
            droppedFrames: droppedFramesRef.current,
            lastProcessedTimestamp: wallClockNow
          }));
        }
      } finally {
        isProcessingFrameRef.current = false;
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isCameraActive, runtimeState]);

  // Method to subscribe to emitted events
  const onObservation = useCallback((cb: (obs: ExamObservationInput) => void) => {
    return emitterRef.current.subscribe(cb);
  }, []);

  // Method for manual sample demo injection
  const emitSampleEvent = useCallback((eventType: string) => {
    const sampleInput: ExamObservationInput = {
      eventId: `sample_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      sessionId,
      eventType,
      source: 'SAMPLE_DEMO',
      occurredAt: new Date().toISOString(),
      modelKey: 'face_landmarker',
      modelVersion: '1.0.0',
      modelScore: 0.88,
      ruleKey: 'sample_demonstration_rule',
      ruleVersion: '1.0.0',
      signalMetadata: {
        note: 'Controlled sample demonstration event injected for evaluator walkthrough.',
        is_sample: true
      }
    };
    return emitterRef.current.emit(sampleInput);
  }, [sessionId]);

  return {
    runtimeState,
    diagnostics,
    currentPose,
    personCount,
    inRestrictedRegion,
    isCalibrated,
    calibrateNeutral,
    onObservation,
    emitSampleEvent
  };
}
