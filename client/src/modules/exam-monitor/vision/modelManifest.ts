export interface ModelArtifactInfo {
  key: 'face_landmarker' | 'person_detector';
  name: string;
  version: string;
  filename: string;
  localPath: string;
  sha256: string;
  sourceUrl: string;
  license: string;
  modelCard: string;
}

export const VISION_MODEL_MANIFEST: Record<'face_landmarker' | 'person_detector', ModelArtifactInfo> = {
  face_landmarker: {
    key: 'face_landmarker',
    name: 'MediaPipe Face Landmarker (Float16)',
    version: '1.0.0',
    filename: 'face_landmarker.task',
    localPath: '/models/face_landmarker.task',
    sha256: '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',
    sourceUrl: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
    license: 'Apache-2.0',
    modelCard: 'https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker'
  },
  person_detector: {
    key: 'person_detector',
    name: 'MediaPipe EfficientDet-Lite0 Object Detector (Float16)',
    version: '1.0.0',
    filename: 'efficientdet_lite0.tflite',
    localPath: '/models/efficientdet_lite0.tflite',
    sha256: '4b59100025bea1235a84c1038879a6cccc9f6c49f5e41144e91e74d99e780993',
    sourceUrl: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite',
    license: 'Apache-2.0',
    modelCard: 'https://developers.google.com/edge/mediapipe/solutions/vision/object_detector'
  }
};

export const LOCAL_WASM_PATH = '/wasm';
