import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import jsPDF from 'jspdf';
import { Download, CheckCircle2, Bot, FileType, Headphones, Video as VideoIcon, Loader2 } from 'lucide-react';
import Button from './Button';
import AudioPlayer from './AudioPlayer';
import VideoGenerator from './VideoGenerator';
import { AnswerData } from '../types';

interface AnswerViewerProps {
  data: AnswerData;
}

const AnswerViewer: React.FC<AnswerViewerProps> = ({ data }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    setIsPdfGenerating(true);

    try {
        // Standard A4 point size
        const A4_WIDTH = 595.28;

        const doc = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4',
        });

        const pdfContent = contentRef.current;
        
        // Create a temporary container specifically sized for A4 print
        const tempContainer = document.createElement('div');
        const margin = 40;
        
        // Critical: Set styles to ensure html2canvas captures it correctly
        tempContainer.style.width = `${A4_WIDTH}px`; 
        tempContainer.style.padding = `${margin}px`;
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.border = '4px double #ea580c'; // Saffron double border
        tempContainer.style.fontFamily = 'Times New Roman, serif';
        tempContainer.style.fontSize = '12px';
        tempContainer.style.color = '#000000';
        
        // Position off-screen but visible to the renderer
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-10000px'; 
        tempContainer.style.top = '0px';
        tempContainer.style.zIndex = '-1000';

        // Formal Header for PDF
        const headerDiv = document.createElement('div');
        headerDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">
            <h1 style="color: #ea580c; font-size: 26px; font-weight: bold; margin: 0; text-transform: uppercase;">Study Roadmap</h1>
            <p style="font-size: 10px; color: #555; margin-top: 8px; font-style: italic;">"Na Chorharyam Na Cha Rajharyam" - Knowledge cannot be stolen.</p>
        </div>
        `;
        tempContainer.appendChild(headerDiv);

        const clone = pdfContent.cloneNode(true) as HTMLElement;
        clone.style.width = '100%';
        clone.style.color = '#000000'; 
        
        // Force styling on cloned elements for consistency in PDF
        const allElements = clone.querySelectorAll('*');
        allElements.forEach(el => {
            if (el instanceof HTMLElement) {
                el.style.color = '#000000'; // Force black text
                
                if (el.tagName === 'TABLE') {
                    el.style.width = '100%';
                    el.style.borderCollapse = 'collapse';
                    el.style.border = '1px solid #333';
                    el.style.marginBottom = '15px';
                    el.style.fontSize = '10px';
                }
                if (el.tagName === 'TH') {
                    el.style.backgroundColor = '#fff7ed'; // Light saffron
                    el.style.border = '1px solid #333';
                    el.style.padding = '6px';
                    el.style.fontWeight = 'bold';
                    el.style.color = '#9a3412'; // Dark saffron text
                }
                if (el.tagName === 'TD') {
                    el.style.border = '1px solid #333';
                    el.style.padding = '6px';
                }
                if (el.classList.contains('katex')) {
                    el.style.fontSize = '1.1em';
                }
            }
        });

        tempContainer.appendChild(clone);
        document.body.appendChild(tempContainer);

        // Wait a tick for DOM to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        await doc.html(tempContainer, {
            callback: function (pdf) {
                pdf.save('BAPS_Study_Roadmap.pdf');
                document.body.removeChild(tempContainer);
                setIsPdfGenerating(false);
            },
            x: 0,
            y: 0,
            html2canvas: {
                scale: 1, 
                useCORS: true,
                logging: false,
                windowWidth: A4_WIDTH
            },
            width: A4_WIDTH,
            windowWidth: A4_WIDTH
        });
    } catch (e) {
        console.error("PDF Generation failed", e);
        setIsPdfGenerating(false);
        alert("Could not generate PDF. Please try again.");
    }
  };

  const handleDownloadDocx = () => {
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          body { font-family: "Times New Roman", serif; font-size: 12pt; color: #000000; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 1em; border: 1px solid #000; }
          th { background-color: #ffedd5; border: 1px solid #000; padding: 5px; font-weight: bold; }
          td { border: 1px solid #000; padding: 5px; }
          h1, h2, h3 { color: #ea580c; border-bottom: 1px solid #ea580c; margin-top: 1em; }
        </style>
      </head><body>`;
    
    const content = contentRef.current?.innerHTML || "";
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'Study_Guide_Roadmap.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 bg-white/95 dark:bg-gray-900/90 p-5 rounded-2xl shadow-lg border border-brand-100 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <CheckCircle2 className="w-7 h-7 text-green-500 mr-3" />
            Study Material Ready
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
             <Bot className="w-4 h-4 mr-1" />
             AI Mentor
          </p>
        </div>
        <div className="flex gap-3">
            <Button 
                onClick={handleDownloadDocx} 
                variant="secondary"
                icon={<FileType className="w-4 h-4" />}
                className="hover:bg-brand-50 border-brand-200 text-brand-700 font-semibold"
            >
              Export DOCX
            </Button>
            <Button 
                onClick={handleDownloadPdf} 
                variant="primary"
                disabled={isPdfGenerating}
                icon={!isPdfGenerating ? <Download className="w-4 h-4" /> : undefined}
                className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all bg-brand-600 hover:bg-brand-700 text-white font-bold px-6"
            >
              {isPdfGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
              ) : (
                  "Export PDF"
              )}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Viewer (Paper) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-brand-100 overflow-hidden relative">
            <div className="bg-brand-50 border-b border-brand-200 px-6 py-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-800 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-brand-600"></div> A4 Preview
                </span>
            </div>
            
            {/* The content to be printed */}
            <div 
              ref={contentRef} 
              className="p-10 md:p-12 overflow-x-auto bg-white text-black leading-relaxed"
              style={{ minHeight: '800px', fontFamily: '"Inter", sans-serif' }}
            >
              <div className="prose prose-lg max-w-none text-black prose-headings:text-brand-700 prose-headings:font-bold prose-p:text-black prose-strong:text-black prose-li:text-black prose-a:text-brand-600">
                 <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                 >
                    {data.text}
                 </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Accessibility & Multimedia Tools */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Audio Guide Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-brand-500">
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-brand-100 dark:bg-brand-900 rounded-lg text-brand-600 dark:text-brand-400 mr-3">
                        <Headphones className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Audio Guide</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Accessible Text-to-Speech</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Listen to the study guide. Optimized for accessibility and on-the-go learning.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg flex justify-center">
                    <AudioPlayer text={data.text} />
                </div>
            </div>

            {/* Video Generator Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-400 mr-3">
                        <VideoIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Video Explainer</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Visual Concept Learning</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Generate a 3D animated video for any complex topic in the guide.
                </p>
                <VideoGenerator contextText={data.text} />
            </div>

            {/* Quote Card */}
            <div className="bg-brand-50 dark:bg-gray-800 rounded-xl p-6 text-center border border-brand-100 dark:border-gray-700">
                <p className="italic text-brand-800 dark:text-brand-300 font-serif text-lg">
                    "Na Chorharyam Na Cha Rajharyam Na Bhratrubhajyam Na Cha Bharakari."
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    (Knowledge cannot be stolen by thieves, nor seized by kings, nor divided among brothers, nor is it heavy to carry.)
                </p>
                <div className="w-10 h-0.5 bg-brand-300 mx-auto my-3"></div>
                <p className="text-xs uppercase tracking-widest font-bold text-brand-600 dark:text-brand-400">
                    Vidya • Seva • Sanskar
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AnswerViewer;