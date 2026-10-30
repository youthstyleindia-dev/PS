import { FilesetResolver, FaceLandmarker, ObjectDetector } from '@mediapipe/tasks-vision';
import { VISION_MODEL_MANIFEST, LOCAL_WASM_PATH } from './modelManifest';

export interface VisionTasksHolder {
  faceLandmarker: FaceLandmarker | null;
  objectDetector: ObjectDetector | null;
  wasmLoaded: boolean;
  errors: string[];
}

let visionTasksInstance: VisionTasksHolder | null = null;
let initPromise: Promise<VisionTasksHolder> | null = null;

/**
 * Initializes and caches singleton instances of MediaPipe FaceLandmarker and ObjectDetector.
 * Uses locally hosted WASM runtime and local model assets.
 */
export async function getVisionTasks(): Promise<VisionTasksHolder> {
  if (visionTasksInstance) {
    return visionTasksInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const holder: VisionTasksHolder = {
      faceLandmarker: null,
      objectDetector: null,
      wasmLoaded: false,
      errors: []
    };

    try {
      // 1. Resolve local WebAssembly fileset
      const visionWasm = await FilesetResolver.forVisionTasks(LOCAL_WASM_PATH);
      holder.wasmLoaded = true;

      // 2. Initialize FaceLandmarker
      try {
        holder.faceLandmarker = await FaceLandmarker.createFromOptions(visionWasm, {
          baseOptions: {
            modelAssetPath: VISION_MODEL_MANIFEST.face_landmarker.localPath,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 2,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFacialTransformationMatrixes: true,
          outputFaceBlendshapes: false
        });
      } catch (faceErr: any) {
        // Fallback to CPU delegate if WebGL/GPU delegate fails
        try {
          holder.faceLandmarker = await FaceLandmarker.createFromOptions(visionWasm, {
            baseOptions: {
              modelAssetPath: VISION_MODEL_MANIFEST.face_landmarker.localPath,
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numFaces: 2,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFacialTransformationMatrixes: true
          });
        } catch (cpuFaceErr: any) {
          holder.errors.push(`FaceLandmarker initialization failed: ${cpuFaceErr.message}`);
        }
      }

      // 3. Initialize ObjectDetector (filtered strictly to 'person' class)
      try {
        holder.objectDetector = await ObjectDetector.createFromOptions(visionWasm, {
          baseOptions: {
            modelAssetPath: VISION_MODEL_MANIFEST.person_detector.localPath,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          scoreThreshold: 0.35,
          categoryAllowlist: ['person']
        });
      } catch (objErr: any) {
        // Fallback to CPU delegate
        try {
          holder.objectDetector = await ObjectDetector.createFromOptions(visionWasm, {
            baseOptions: {
              modelAssetPath: VISION_MODEL_MANIFEST.person_detector.localPath,
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            scoreThreshold: 0.35,
            categoryAllowlist: ['person']
          });
        } catch (cpuObjErr: any) {
          holder.errors.push(`ObjectDetector initialization failed: ${cpuObjErr.message}`);
        }
      }
    } catch (wasmErr: any) {
      holder.errors.push(`MediaPipe WASM Fileset loading failed: ${wasmErr.message}`);
    }

    visionTasksInstance = holder;
    return holder;
  })();

  return initPromise;
}

/**
 * Cleanup and dispose of active vision models.
 */
export function disposeVisionTasks(): void {
  if (visionTasksInstance) {
    if (visionTasksInstance.faceLandmarker) {
      try {
        visionTasksInstance.faceLandmarker.close();
      } catch {}
    }
    if (visionTasksInstance.objectDetector) {
      try {
        visionTasksInstance.objectDetector.close();
      } catch {}
    }
    visionTasksInstance = null;
    initPromise = null;
  }
}
