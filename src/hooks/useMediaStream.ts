import { useState, useEffect, useRef, useCallback } from 'react';

export type MediaErrorType = 'permission-denied' | 'not-found' | 'in-use' | 'unsupported' | null;

interface UseMediaStreamOptions {
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  facingMode?: 'user' | 'environment';
}

export function useMediaStream({
  videoEnabled = true,
  audioEnabled = true,
}: UseMediaStreamOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<MediaErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Fallback synthetic stream generator when hardware is blocked or absent
  const createFallbackStream = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      let angle = 0;
      const interval = setInterval(() => {
        angle += 0.05;
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 640, 360);
        grad.addColorStop(0, '#111522');
        grad.addColorStop(1, '#1e2638');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 360);

        // Animated subtle waves
        ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.beginPath();
        for (let x = 0; x < 640; x += 10) {
          const y = 180 + Math.sin(x * 0.01 + angle) * 35;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(640, 360);
        ctx.lineTo(0, 360);
        ctx.fill();

        // CALLIVO Simulation label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '600 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CALLIVO HD Camera Simulator', 320, 160);
        ctx.font = '400 12px Inter, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.fillText('Live WebRTC Virtual Feed', 320, 190);
      }, 50);

      // Create video track from canvas
      const canvasStream = canvas.captureStream(30);
      const videoTrack = canvasStream.getVideoTracks()[0];

      // Audio track fallback with silent/synthetic audio oscillator
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const dest = audioCtx.createMediaStreamDestination();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.001; // nearly inaudible
      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      const combinedStream = new MediaStream([videoTrack, dest.stream.getAudioTracks()[0]]);

      videoTrack.onended = () => {
        clearInterval(interval);
        try {
          osc.stop();
          audioCtx.close();
        } catch (e) {
          // ignore
        }
      };

      return combinedStream;
    } catch (e) {
      console.error('Failed to create fallback stream', e);
      return null;
    }
  }, []);

  const startStream = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorMessage(null);

    // Clean up any existing active stream
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('unsupported');
      setErrorMessage('Camera and microphone are not supported in this browser.');
      const fallback = createFallbackStream();
      if (fallback) {
        setIsUsingFallback(true);
        activeStreamRef.current = fallback;
        setStream(fallback);
      }
      setIsLoading(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: audioEnabled,
      });

      activeStreamRef.current = mediaStream;
      setStream(mediaStream);
      setIsUsingFallback(false);
      setIsLoading(false);
    } catch (err: unknown) {
      const error = err as Error;
      console.warn('getUserMedia encountered error:', error.name, error.message);

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError('permission-denied');
        setErrorMessage('Camera or microphone permission was denied. Please allow device access in browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setError('not-found');
        setErrorMessage('No camera or microphone hardware found.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setError('in-use');
        setErrorMessage('Camera or microphone is already in use by another application.');
      } else {
        setError('unsupported');
        setErrorMessage(error.message || 'Unable to access media devices.');
      }

      // Automatically initialize the fallback simulator stream so user experience is not broken
      const fallback = createFallbackStream();
      if (fallback) {
        setIsUsingFallback(true);
        activeStreamRef.current = fallback;
        setStream(fallback);
      }
      setIsLoading(false);
    }
  }, [videoEnabled, audioEnabled, createFallbackStream]);

  // Toggle video track
  const setVideoEnabled = useCallback((enabled: boolean) => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }, []);

  // Toggle audio track
  const setAudioEnabled = useCallback((enabled: boolean) => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }, []);

  useEffect(() => {
    startStream();
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startStream]);

  return {
    stream,
    error,
    errorMessage,
    isLoading,
    isUsingFallback,
    restartStream: startStream,
    setVideoEnabled,
    setAudioEnabled,
  };
}
