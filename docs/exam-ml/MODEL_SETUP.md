# UniVerse Module E: Model Setup & Deployment Guide

This guide details the procurement, verification, local hosting, and runtime configuration of the machine learning vision models utilized by UniVerse.

---

## 1. Model Artifact Specifications & Checksums

UniVerse hosts all model bundles and WebAssembly runtimes locally within the frontend static assets directory (`client/public/`) to achieve complete single-binary portability with zero external CDN dependencies at runtime.

| Parameter | Model 1: Face Landmarker | Model 2: Person Object Detector |
| :--- | :--- | :--- |
| **Model Task** | 3D Face Landmarking & Pose Transformation | Object Detection (Person Class Filtering) |
| **Architecture** | MediaPipe FaceMesh Float16 Pipeline | EfficientDet-Lite0 Float16 (320 × 320 input) |
| **Filename** | `face_landmarker.task` | `efficientdet_lite0.tflite` |
| **Local Path** | `client/public/models/face_landmarker.task` | `client/public/models/efficientdet_lite0.tflite` |
| **File Size** | 3,747,381 bytes (3.6 MB) | 7,184,818 bytes (6.9 MB) |
| **SHA-256 Checksum** | `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff` | `4b59100025bea1235a84c1038879a6cccc9f6c49f5e41144e91e74d99e780993` |
| **Upstream URL** | [Google Storage Face Landmarker](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task) | [Google Storage EfficientDet-Lite0](https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite) |
| **License** | Apache 2.0 | Apache 2.0 |

---

## 2. WebAssembly (WASM) Local Hosting

MediaPipe Tasks Vision requires binary WASM filesets to execute tensor operations in the browser. These are hosted locally in `client/public/wasm/`:
- `vision_wasm_internal.js` (326 KB)
- `vision_wasm_internal.wasm` (14 MB)
- `vision_wasm_module_internal.js` (326 KB)
- `vision_wasm_module_internal.wasm` (14 MB)
- `vision_wasm_nosimd_internal.js` (326 KB)
- `vision_wasm_nosimd_internal.wasm` (12 MB)

Fileset initialization in code:
```ts
const visionWasm = await FilesetResolver.forVisionTasks('/wasm');
```

---

## 3. Automated Verification & Checksum Commands

To verify that model artifacts are present and uncorrupted, run:

```bash
# Verify model sizes and SHA-256 hashes
shasum -a 256 client/public/models/*
```

Expected output:
```text
4b59100025bea1235a84c1038879a6cccc9f6c49f5e41144e91e74d99e780993  client/public/models/efficientdet_lite0.tflite
64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff  client/public/models/face_landmarker.task
```

---

## 4. Hardware & Browser Compatibility

- **Supported Browsers:** Chrome/Chromium 95+, Edge 95+, Firefox 90+, Safari 15.4+.
- **Origin Requirements:** Camera access requires a Secure Origin (`https://` or `http://localhost`).
- **GPU Acceleration:** Models automatically initialize with the WebGL/WebGPU delegate (`delegate: 'GPU'`). If hardware acceleration is unavailable, the loader automatically degrades to the CPU SIMD delegate (`delegate: 'CPU'`).
