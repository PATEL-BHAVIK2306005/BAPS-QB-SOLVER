import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, FileText, Timer, Eye, Upload, Clock, Map, History, Settings, Trash2, Moon, Sun, PenTool, GraduationCap, ChevronRight, Cpu } from 'lucide-react';
import UploadArea from './components/UploadArea';
import Button from './components/Button';
import AnswerViewer from './components/AnswerViewer';
import { generateAnswersFromPdf } from './services/geminiService';
import { ProcessState, AnswerData, HistoryItem, AppSettings } from './types';

// Sanskrit Quotes Collection
const SANSKRIT_QUOTES = [
  { text: "Vidya Vinayen Shobhate", meaning: "Knowledge is adorned by humility." },
  { text: "Acharah Prathamo Dharmah", meaning: "Good conduct is the first duty." },
  { text: "Satyameva Jayate", meaning: "Truth alone triumphs." },
  { text: "Udyamena hi sidhyanti karyani na manorathaih", meaning: "Success is achieved by hard work, not just by wishing." },
  { text: "Atmanishtha", meaning: "Firm faith in the soul/self." }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'view' | 'history' | 'settings'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [processState, setProcessState] = useState<ProcessState>({ status: 'idle' });
  const [answerData, setAnswerData] = useState<AnswerData | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>({
    depth: 'detailed',
    language: 'english',
    focus: 'concept'
  });
  
  // New States
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load History and Theme
  useEffect(() => {
    const savedHistory = localStorage.getItem('study_guider_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    
    // Check saved theme
    const savedTheme = localStorage.getItem('study_guider_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark');
    }

    // Quote Rotation
    const quoteInterval = setInterval(() => {
        setQuoteIndex(prev => (prev + 1) % SANSKRIT_QUOTES.length);
    }, 8000);

    return () => clearInterval(quoteInterval);
  }, []);

  // Save History
  const addToHistory = (fileName: string, data: AnswerData) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      fileName,
      date: new Date().toLocaleDateString(),
      data
    };
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem('study_guider_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('study_guider_history');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('study_guider_theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('study_guider_theme', 'light');
    }
  };

  // Calculate estimated time when file changes
  useEffect(() => {
    if (file) {
      // Base time 15s + 10s per MB, capped at 90s
      const fileSizeMB = file.size / (1024 * 1024);
      const estimate = Math.min(Math.floor(15 + (fileSizeMB * 10)), 120);
      setEstimatedTime(estimate);
    }
  }, [file]);

  // Timer effect for processing state
  useEffect(() => {
    let interval: any;
    if (processState.status === 'processing') {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [processState.status]);

  const handleGenerate = async () => {
    if (!file) return;

    setElapsedTime(0);
    setProcessState({ status: 'processing', message: 'Analyzing document...' });
    setAnswerData(null);

    try {
      const result = await generateAnswersFromPdf(file, customPrompt, appSettings);
      setAnswerData(result);
      addToHistory(file.name, result);
      setProcessState({ status: 'success' });
      setActiveTab('view'); // Auto-switch to view tab on success
    } catch (error: any) {
      setProcessState({ 
        status: 'error', 
        message: error.message || "An unexpected error occurred while processing the PDF." 
      });
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setAnswerData(item.data);
    setProcessState({ status: 'success' });
    setActiveTab('view');
  };

  const reset = () => {
    setFile(null);
    setCustomPrompt('');
    setAnswerData(null);
    setProcessState({ status: 'idle' });
    setActiveTab('upload');
    setElapsedTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 font-sans flex flex-col relative z-10 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-black/90 backdrop-blur-md border-b border-brand-200 dark:border-brand-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('upload')}>
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-2.5 rounded-xl shadow-lg transform group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
                Study<span className="text-brand-600 dark:text-brand-500">Guider</span>
                </span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mt-1">
                BAPS Student Culture
                </span>
            </div>
          </div>
          {/* Removed Model Name from Header, moved to settings */}
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 rounded-2xl bg-white/90 dark:bg-black/70 backdrop-blur-md p-1.5 mb-8 max-w-3xl mx-auto shadow-xl border border-white/50 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 rounded-xl py-3 text-sm font-bold leading-5 transition-all duration-200
              ${activeTab === 'upload' 
                ? 'bg-brand-600 text-white shadow-md transform scale-[1.02]' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-gray-800 hover:text-brand-600'
              }`}
          >
            <div className="flex items-center justify-center">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </div>
          </button>
          <button
            onClick={() => {
              if (processState.status === 'success') setActiveTab('view');
            }}
            disabled={processState.status !== 'success'}
            className={`flex-1 rounded-xl py-3 text-sm font-bold leading-5 transition-all duration-200
              ${activeTab === 'view' 
                ? 'bg-brand-600 text-white shadow-md transform scale-[1.02]' 
                : processState.status === 'success' 
                  ? 'text-gray-600 dark:text-gray-300 hover:text-brand-600 hover:bg-brand-50' 
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
          >
            <div className="flex items-center justify-center">
              <Map className="w-4 h-4 mr-2" />
              Roadmap
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 rounded-xl py-3 text-sm font-bold leading-5 transition-all duration-200
              ${activeTab === 'history' 
                ? 'bg-brand-600 text-white shadow-md transform scale-[1.02]' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-gray-800 hover:text-brand-600'
              }`}
          >
            <div className="flex items-center justify-center">
              <History className="w-4 h-4 mr-2" />
              History
            </div>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 rounded-xl py-3 text-sm font-bold leading-5 transition-all duration-200
              ${activeTab === 'settings' 
                ? 'bg-brand-600 text-white shadow-md transform scale-[1.02]' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-gray-800 hover:text-brand-600'
              }`}
          >
            <div className="flex items-center justify-center">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'upload' && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-3xl shadow-2xl border-t-4 border-brand-500 p-8 md:p-12 relative overflow-hidden">
                {/* Decorative BG element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-100 dark:bg-brand-900 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
                
                <div className="text-center mb-10 relative z-10">
                  <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">Upload Question Bank</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Transform your materials into a holistic <span className="text-brand-600 dark:text-brand-400 font-bold">Study Roadmap</span>.
                  </p>
                </div>

                <UploadArea 
                  onFileSelect={setFile} 
                  selectedFile={file} 
                  onClearFile={reset}
                  disabled={processState.status === 'processing'}
                />

                <div className="w-full max-w-2xl mx-auto mt-8">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 flex items-center">
                       <PenTool className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400" />
                        Guide Instructions <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(Optional)</span>
                    </label>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="e.g. Focus on detailed math solutions, Explain history events like a story, or Prepare for a 10th-grade final exam..."
                        className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:ring-0 outline-none transition-all resize-none h-24 text-sm shadow-inner"
                        disabled={processState.status === 'processing'}
                    />
                </div>

                <div className="mt-10 flex flex-col items-center">
                  <Button
                    onClick={handleGenerate}
                    disabled={!file || processState.status === 'processing'}
                    isLoading={processState.status === 'processing'}
                    className="w-full sm:w-auto min-w-[300px] text-lg py-4 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 shadow-xl shadow-brand-200 dark:shadow-none transition-transform hover:-translate-y-1"
                  >
                    {processState.status === 'processing' ? 'Consulting AI Mentor...' : 'Generate Study Roadmap'}
                  </Button>

                  {file && processState.status === 'idle' && (
                    <div className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center bg-brand-50 dark:bg-gray-800 px-4 py-2 rounded-full border border-brand-100 dark:border-gray-700">
                      <Clock className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400" />
                      Estimated time: ~{estimatedTime} seconds
                    </div>
                  )}

                  {processState.status === 'processing' && (
                    <div className="mt-8 flex flex-col items-center space-y-4 w-full max-w-sm">
                      <div className="flex items-center justify-between w-full text-sm font-bold text-gray-700 dark:text-gray-300">
                         <span className="flex items-center"><Timer className="w-4 h-4 mr-1 text-brand-600 dark:text-brand-400"/> {formatTime(elapsedTime)}</span>
                         <span className="text-gray-500">Target: {formatTime(estimatedTime)}</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                        <div 
                            className="bg-gradient-to-r from-brand-400 to-brand-600 h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min((elapsedTime / estimatedTime) * 100, 98)}%` }}
                        ></div>
                      </div>

                      <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 px-4 py-3 rounded-lg text-sm font-medium animate-pulse text-center shadow-sm w-full">
                         Processing your request...
                         <br/><span className="text-xs opacity-75">Structuring knowledge for optimal learning.</span>
                      </div>
                    </div>
                  )}

                  {processState.status === 'error' && (
                    <div className="mt-6 text-center p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 w-full shadow-sm">
                      <p className="font-bold text-lg mb-1">Generation Failed</p>
                      <p className="text-sm">{processState.message}</p>
                      <button onClick={() => setProcessState({status: 'idle'})} className="mt-3 text-sm font-bold underline hover:text-red-900 dark:hover:text-red-200">Try Again</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'view' && answerData && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex justify-end mb-4">
                 <button 
                   onClick={reset}
                   className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-brand-600 flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 shadow-sm border border-transparent hover:border-brand-200 transition-all"
                 >
                   <FileText className="w-4 h-4" />
                   <span>Process New File</span>
                 </button>
               </div>
               <AnswerViewer data={answerData} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your History</h2>
                  {history.length > 0 && (
                    <button onClick={clearHistory} className="text-sm text-red-500 hover:text-red-700 flex items-center font-semibold">
                      <Trash2 className="w-4 h-4 mr-1" /> Clear All
                    </button>
                  )}
                </div>
                
                {history.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No study guides generated yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {history.map((item) => (
                      <div key={item.id} className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-lg transition-all duration-300">
                        <div className="mb-3 sm:mb-0">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">{item.fileName}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{item.date} • {item.data.modelUsed}</p>
                        </div>
                        <Button onClick={() => loadFromHistory(item)} variant="secondary" className="dark:bg-gray-700 dark:text-white dark:border-gray-600 w-full sm:w-auto">
                          View Guide
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl p-8">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h2>
                 
                 {/* Dark Mode Toggle */}
                 <div className="flex items-center justify-between py-6 border-b border-gray-200 dark:border-gray-700">
                   <div className="flex items-center">
                     <div className={`p-3 rounded-xl mr-5 ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-orange-100 text-orange-600'}`}>
                        {isDarkMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                     </div>
                     <div>
                       <h3 className="font-bold text-lg text-gray-900 dark:text-white">Appearance</h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Toggle between Light and Dark mode</p>
                     </div>
                   </div>
                   <button 
                     onClick={toggleTheme}
                     className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${isDarkMode ? 'bg-brand-600' : 'bg-gray-300'}`}
                   >
                     <span
                       className={`${isDarkMode ? 'translate-x-7' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm`}
                     />
                   </button>
                 </div>

                 {/* Settings Option 1: Explanation Depth */}
                 <div className="py-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Explanation Depth</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setAppSettings(prev => ({...prev, depth: 'concise'}))}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${appSettings.depth === 'concise' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}
                        >
                            Concise
                        </button>
                        <button 
                             onClick={() => setAppSettings(prev => ({...prev, depth: 'detailed'}))}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${appSettings.depth === 'detailed' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}
                        >
                            Detailed (Recommended)
                        </button>
                    </div>
                 </div>

                 {/* Settings Option 2: Language Style */}
                 <div className="py-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Language Style</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setAppSettings(prev => ({...prev, language: 'english'}))}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${appSettings.language === 'english' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}
                        >
                            English Only
                        </button>
                        <button 
                            onClick={() => setAppSettings(prev => ({...prev, language: 'hinglish'}))}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${appSettings.language === 'hinglish' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}
                        >
                            Hinglish Context
                        </button>
                    </div>
                 </div>

                 {/* Settings Option 3: Learning Focus */}
                 <div className="py-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Learning Focus</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setAppSettings(prev => ({...prev, focus: 'concept'}))}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${appSettings.focus === 'concept' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}
                        >
                            Concept Mastery
                        </button>
                        <button 
                            onClick={() => setAppSettings(prev => ({...prev, focus: 'exam'}))}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${appSettings.focus === 'exam' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}
                        >
                            Exam Preparation
                        </button>
                    </div>
                 </div>

                 {/* Model Info */}
                 <div className="py-6 flex items-center justify-between text-sm">
                     <span className="text-gray-500 dark:text-gray-400">AI Model Version</span>
                     <span className="flex items-center font-bold text-gray-900 dark:text-white">
                         <Cpu className="w-4 h-4 mr-2 text-brand-600" />
                         Gemini 3 Pro Preview
                     </span>
                 </div>

                 <div className="mt-12 text-center">
                   <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2">BAPS Student Culture</p>
                   <p className="text-xs text-gray-400">
                     Study Guider v2.1 • Knowledge • Integrity • Service
                   </p>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer Branding with Rotating Quotes */}
      <footer className="py-6 text-center text-white text-xs font-medium bg-black/60 backdrop-blur-md mt-auto shadow-inner">
        <p className="opacity-90 transition-opacity duration-1000">
            "{SANSKRIT_QUOTES[quoteIndex].text}" — {SANSKRIT_QUOTES[quoteIndex].meaning}
        </p>
      </footer>
    </div>
  );
};

export default App;