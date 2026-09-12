import { getSocket } from './socket';
import { API_BASE_URL } from './api';

export interface RecorderOptions {
  meetingId: string;
  meetingTitle?: string;
  stream: MediaStream;
  onRecordingStart?: () => void;
  onRecordingStop?: (blob: Blob, durationFormatted: string) => void;
  onError?: (err: any) => void;
}

export class InMeetingRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private stream: MediaStream | null = null;
  private meetingId: string = '';
  private meetingTitle: string = '';
  public isRecording: boolean = false;

  public async start(options: RecorderOptions) {
    if (this.isRecording) return;

    this.stream = options.stream;
    this.meetingId = options.meetingId;
    this.meetingTitle = options.meetingTitle || 'CALLIVO Meeting Session';
    this.recordedChunks = [];

    // Choose supported MIME type
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    let selectedMimeType = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        break;
      }
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType || undefined,
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const durationSec = Math.round((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        const durationFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        const blob = new Blob(this.recordedChunks, {
          type: selectedMimeType || 'video/webm',
        });

        options.onRecordingStop?.(blob, durationFormatted);

        // Upload to server in background
        await this.uploadRecording(blob, durationFormatted);
      };

      this.mediaRecorder.start(1000); // chunk every 1 second
      this.startTime = Date.now();
      this.isRecording = true;

      // Broadcast to room
      getSocket().emit('recording:status', {
        meetingId: this.meetingId,
        isRecording: true,
        startedAt: new Date().toISOString(),
      });

      options.onRecordingStart?.();
    } catch (err: any) {
      console.error('Failed to start MediaRecorder:', err);
      options.onError?.(err);
    }
  }

  public stop() {
    if (!this.isRecording || !this.mediaRecorder) return;

    this.mediaRecorder.stop();
    this.isRecording = false;

    getSocket().emit('recording:status', {
      meetingId: this.meetingId,
      isRecording: false,
    });
  }

  /**
   * Save recorded video file directly to user's local disk
   */
  public downloadLocally(blob: Blob, filename?: string) {
    const defaultName = `CALLIVO_Meeting_${this.meetingId}_${new Date().toISOString().slice(0, 10)}.webm`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename || defaultName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 2000);
  }

  /**
   * Upload video blob to backend /api/recordings/upload
   */
  private async uploadRecording(blob: Blob, durationFormatted: string) {
    try {
      // Convert Blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        await fetch(`${API_BASE_URL}/api/recordings/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            meetingId: this.meetingId,
            meetingTitle: this.meetingTitle,
            duration: durationFormatted,
            videoBase64: base64Data,
            mimeType: blob.type,
          }),
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('Failed to upload recording to server:', err);
    }
  }
}

export const inMeetingRecorder = new InMeetingRecorder();
