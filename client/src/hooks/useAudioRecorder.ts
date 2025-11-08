import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface AudioRecorderState {
  recording: boolean;
  audioUrl: string | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

const pickMimeType = () => {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
  const prefer = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
  return prefer.find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

export function useAudioRecorder(): AudioRecorderState {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeType = useMemo(() => pickMimeType(), []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!audioUrl) return undefined;
    return () => {
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone recording is not supported in this browser.');
      return;
    }
    if (!mimeType) {
      setError('No supported audio mime type detected for MediaRecorder.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || chunks[0]?.type || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setError(null);
      setRecording(true);
    } catch (err) {
      setError((err as Error).message || 'Unable to access microphone.');
    }
  }, [audioUrl, mimeType]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  return { recording, audioUrl, error, startRecording, stopRecording };
}
