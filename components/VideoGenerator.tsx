import React, { useState } from 'react';
import { Video, Loader2, PlayCircle, AlertTriangle } from 'lucide-react';
import Button from './Button';
import { generateEducationalVideo } from '../services/geminiService';

interface VideoGeneratorProps {
  contextText: string;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ contextText }) => {
  const [topic, setTopic] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic) return;
    setError(null);
    setIsGenerating(true);
    setStatusMsg('Checking Permissions...');

    try {
      // 1. Check/Request API Key
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            // @ts-ignore
            const success = await window.aistudio.openSelectKey();
        }
      }

      setStatusMsg('Dreaming up visuals...');
      
      // Pass both prompt and context for better results
      const uri = await generateEducationalVideo(topic + ". Context for video generation: " + contextText.slice(0, 300));
      
      setStatusMsg('Rendering animation...');
      // Fetch with key appended
      const response = await fetch(`${uri}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      
      setVideoUrl(localUrl);
      setStatusMsg('');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate video.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-4">
      
      {!videoUrl ? (
        <div className="flex flex-col gap-3">
          <input 
            type="text" 
            placeholder="e.g. 'Pythagoras Theorem in real life'" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={!topic || isGenerating}
            isLoading={isGenerating}
            className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isGenerating ? statusMsg || 'Generating...' : 'Create Animation'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
           <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg relative group border border-gray-800">
             <video src={videoUrl} controls className="w-full h-full" autoPlay loop muted />
           </div>
           <Button onClick={() => setVideoUrl(null)} variant="secondary" className="w-full text-xs">
             Create Another Video
           </Button>
        </div>
      )}

      {error && (
        <div className="mt-3 text-red-600 text-xs flex items-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
           <AlertTriangle className="w-4 h-4 mr-2" />
           {error}
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-3 italic">
        * Generates a 3D animated explanation using Veo. Processing takes ~60s.
      </p>
    </div>
  );
};

export default VideoGenerator;