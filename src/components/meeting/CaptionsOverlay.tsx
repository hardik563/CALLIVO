import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';

interface CaptionsOverlayProps {
  isEnabled: boolean;
  meetingId: string;
}

interface CaptionEntry {
  socketId: string;
  speakerName: string;
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export const CaptionsOverlay: React.FC<CaptionsOverlayProps> = ({
  isEnabled,
  meetingId,
}) => {
  const { user } = useAuthStore();
  const [activeCaptions, setActiveCaptions] = useState<{ [key: string]: CaptionEntry }>({});
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const socket = getSocket();

  // Handle incoming captions from socket
  useEffect(() => {
    const handleCaptionBroadcast = (payload: {
      socketId: string;
      speakerName: string;
      text: string;
      isFinal: boolean;
    }) => {
      if (!isEnabled) return;

      const key = payload.socketId;
      setActiveCaptions((prev) => ({
        ...prev,
        [key]: {
          socketId: payload.socketId,
          speakerName: payload.speakerName,
          text: payload.text,
          isFinal: payload.isFinal,
          timestamp: Date.now(),
        },
      }));

      // Clear caption bubble after 4 seconds of silence
      if (timeoutRef.current[key]) {
        clearTimeout(timeoutRef.current[key]);
      }
      timeoutRef.current[key] = setTimeout(() => {
        setActiveCaptions((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 4000);
    };

    socket.on('captions:broadcast', handleCaptionBroadcast);
    return () => {
      socket.off('captions:broadcast', handleCaptionBroadcast);
      Object.values(timeoutRef.current).forEach(clearTimeout);
    };
  }, [socket, isEnabled]);

  // Start local speech recognition if enabled
  useEffect(() => {
    if (!isEnabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
      setActiveCaptions({});
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API not available in this browser environment');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const text = (finalTranscript || interimTranscript).trim();
        if (text) {
          const speakerName = user?.name || sessionStorage.getItem('callivo_guest_name') || 'You';
          socket.emit('captions:transcript', {
            meetingId,
            text,
            isFinal: Boolean(finalTranscript),
            speakerName,
          });
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
      };

      recognition.onend = () => {
        // Auto-restart if still enabled
        if (isEnabled && recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // ignore
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Could not initialize SpeechRecognition:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [isEnabled, meetingId, socket, user]);

  const captionList = Object.values(activeCaptions);
  if (!isEnabled || captionList.length === 0) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-full px-4 pointer-events-none flex flex-col items-center gap-2">
      {captionList.map((entry) => (
        <div
          key={entry.socketId}
          className="px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-slate-700/70 shadow-2xl text-center animate-fade-in transition-all"
        >
          <span className="text-emerald-400 text-xs font-semibold mr-2">
            {entry.speakerName}:
          </span>
          <span className="text-white text-sm font-medium tracking-wide">
            {entry.text}
          </span>
        </div>
      ))}
    </div>
  );
};
