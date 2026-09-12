import { useState, useEffect, useRef } from 'react';

export function useAudioMeter(stream: MediaStream | null, isMuted: boolean = false) {
  const [volume, setVolume] = useState<number>(0);
  const [frequencies, setFrequencies] = useState<number[]>([10, 20, 30, 45, 60, 35, 15]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || isMuted) {
      setVolume(0);
      setIsSpeaking(false);
      setFrequencies([5, 5, 5, 5, 5, 5, 5]);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      // Simulate gentle conversational audio level for realistic UI demonstration
      const interval = setInterval(() => {
        if (!isMuted) {
          const simVol = Math.floor(20 + Math.random() * 50);
          setVolume(simVol);
          setIsSpeaking(simVol > 35);
          setFrequencies([
            Math.floor(10 + Math.random() * 40),
            Math.floor(25 + Math.random() * 55),
            Math.floor(40 + Math.random() * 50),
            Math.floor(55 + Math.random() * 45),
            Math.floor(35 + Math.random() * 50),
            Math.floor(20 + Math.random() * 40),
            Math.floor(10 + Math.random() * 30),
          ]);
        }
      }, 120);

      return () => clearInterval(interval);
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        const bars: number[] = [];
        const step = Math.max(1, Math.floor(bufferLength / 7));

        for (let i = 0; i < 7; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.min(100, Math.round((val / 255) * 100)));
          sum += val;
        }

        const average = sum / bufferLength;
        const normalizedVolume = Math.min(100, Math.round((average / 128) * 100));

        setVolume(normalizedVolume);
        setFrequencies(bars);
        setIsSpeaking(normalizedVolume > 12);

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        try {
          audioContext.close();
        } catch (e) {
          // ignore
        }
      };
    } catch (err) {
      console.warn('Web Audio API analyser not supported or blocked:', err);
    }
  }, [stream, isMuted]);

  return { volume, frequencies, isSpeaking };
}
