import { useState, useRef, useEffect, useCallback } from 'react';

export interface CameraState {
  isActive: boolean;
  isPermissionDenied: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  stream: MediaStream | null;
}

export function useExamCamera() {
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    isPermissionDenied: false,
    isLoading: false,
    errorMessage: null,
    stream: null
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState({
      isActive: false,
      isPermissionDenied: false,
      isLoading: false,
      errorMessage: null,
      stream: null
    });
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState(prev => ({
        ...prev,
        isLoading: false,
        errorMessage: 'MediaDevices API is unsupported in this browser environment.'
      }));
      return false;
    }

    setCameraState(prev => ({ ...prev, isLoading: true, errorMessage: null }));

    try {
      // STRICT ETHICS: Request VIDEO ONLY. Microphone/audio is NEVER requested.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 20 },
          facingMode: 'user'
        },
        audio: false // Explicitly false
      });

      streamRef.current = stream;

      // Handle track ended (e.g. user revoked permission in OS or device unplugged)
      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          stopCamera();
        };
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraState({
        isActive: true,
        isPermissionDenied: false,
        isLoading: false,
        errorMessage: null,
        stream
      });
      return true;
    } catch (err: any) {
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isDenied
        ? 'Camera permission was denied. Please grant camera access in browser settings to enable vision-assisted observation.'
        : `Unable to access camera: ${err.message || 'Unknown device error'}`;

      setCameraState({
        isActive: false,
        isPermissionDenied: isDenied,
        isLoading: false,
        errorMessage: msg,
        stream: null
      });
      return false;
    }
  }, [stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    cameraState,
    startCamera,
    stopCamera
  };
}
