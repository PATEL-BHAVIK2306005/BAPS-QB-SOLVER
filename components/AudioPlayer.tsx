import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Loader2, AlertCircle } from 'lucide-react';
import Button from './Button';
import { generateAudioGuide } from '../services/geminiService';

interface AudioPlayerProps {
  text: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Helper to decode base64
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleGenerateAndPlay = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (hasAudio && audioBufferRef.current) {
      playBuffer(audioBufferRef.current);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const base64Audio = await generateAudioGuide(text);
      const audioData = decodeBase64(base64Audio);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      
      // Decode raw PCM
      const dataInt16 = new Int16Array(audioData.buffer);
      const numChannels = 1;
      const sampleRate = 24000;
      const frameCount = dataInt16.length / numChannels;
      
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      audioBufferRef.current = buffer;
      setHasAudio(true);
      playBuffer(buffer);

    } catch (err: any) {
      setError(err.message || "Failed to generate audio.");
    } finally {
      setIsLoading(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    
    source.start(0);
    sourceRef.current = source;
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (sourceRef.current) sourceRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className="flex items-center space-x-2">
       {error && (
         <div className="text-red-500 text-xs flex items-center mr-2">
           <AlertCircle className="w-3 h-3 mr-1" />
           Failed
         </div>
       )}
       <Button 
         onClick={handleGenerateAndPlay}
         disabled={isLoading}
         variant="secondary"
         className="!py-1.5 !px-3 text-sm"
         icon={isLoading ? undefined : (isPlaying ? <Pause className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>)}
       >
         {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPlaying ? "Stop" : "Listen")}
       </Button>
    </div>
  );
};

export default AudioPlayer;