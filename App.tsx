import React, { useState, useRef, useEffect } from 'react';
import { SectionBox } from './components/SectionBox';
import { generateLetter, initializeChat, sendMessageToChat } from './services/geminiService';
import { ChatMessage, GeneratedContent, GenerationStatus } from './types';
import { ArrowPathIcon, PaperAirplaneIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  // Input State
  const [professorInfo, setProfessorInfo] = useState('');
  const [studentMaterial, setStudentMaterial] = useState('');

  // Output State
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  
  // Refs for auto-scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleGenerate = async () => {
    if (!professorInfo.trim() || !studentMaterial.trim()) {
      alert("Please enter both professor information and student material.");
      return;
    }

    setStatus(GenerationStatus.LOADING);
    try {
      const result = await generateLetter({ professorInfo, studentMaterial });
      setGeneratedContent(result);
      
      // Initialize chat with the new context
      initializeChat(result.englishLetter);
      setChatHistory([{ role: 'model', text: 'I have generated the letter based on your inputs. How can I help you refine it?' }]);
      
      setStatus(GenerationStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !generatedContent) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
      const response = await sendMessageToChat(userMsg);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
      
      // Heuristic: If response looks like a full letter (contains "To Whom It May Concern"), update the preview
      if (response.includes("To Whom It May Concern")) {
          setGeneratedContent(prev => prev ? { ...prev, englishLetter: response } : null);
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error processing your request." }]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <span className="text-2xl">🎓</span> RecLetter Pro AI
        </h1>
        <p className="text-xs text-gray-500 mt-1">Professional Academic Recommendation Generator</p>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-4 h-full">
          
          {/* Column 1: Input (Box 1) - Spans 3 cols */}
          <div className="md:col-span-1 lg:col-span-3 h-full flex flex-col gap-4">
            <SectionBox 
              title="Material Input" 
              number={1} 
              className="h-full"
              actionButton={
                <button 
                  onClick={handleGenerate}
                  disabled={status === GenerationStatus.LOADING}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-white transition-colors
                    ${status === GenerationStatus.LOADING ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700'}
                  `}
                >
                  {status === GenerationStatus.LOADING ? (
                    <>
                      <ArrowPathIcon className="w-3 h-3 animate-spin" /> Generating...
                    </>
                  ) : (
                    'Generate Draft'
                  )}
                </button>
              }
            >
              <div className="flex flex-col gap-4 h-full">
                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1">Professor Info (Name, Title, Dept)</label>
                  <textarea
                    className="w-full flex-1 p-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none resize-none bg-gray-50"
                    placeholder="e.g., Dr. Zhang, Professor of Computer Science, Tsinghua University..."
                    value={professorInfo}
                    onChange={(e) => setProfessorInfo(e.target.value)}
                  />
                </div>
                <div className="flex-[2] flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1">Recommendation Material (Chinese)</label>
                  <textarea
                    className="w-full flex-1 p-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none resize-none bg-gray-50"
                    placeholder="Paste student projects, challenges encountered, solutions found, and qualities demonstrated here..."
                    value={studentMaterial}
                    onChange={(e) => setStudentMaterial(e.target.value)}
                  />
                </div>
              </div>
            </SectionBox>
          </div>

          {/* Column 2: Outputs (Box 2, 3, 4) - Spans 6 cols */}
          <div className="md:col-span-1 lg:col-span-5 h-full flex flex-col gap-4 overflow-hidden">
            
            {/* Box 3: English Draft (Main Focus) */}
            <div className="flex-[3] min-h-0">
               <SectionBox 
                title="English Draft (~350 Words)" 
                number={3} 
                className="h-full border-primary border-2"
                actionButton={
                  <button 
                    onClick={() => generatedContent && copyToClipboard(generatedContent.englishLetter)}
                    className="text-gray-400 hover:text-primary transition-colors"
                    title="Copy to Clipboard"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  </button>
                }
              >
                 <textarea
                    className="w-full h-full p-4 text-sm font-serif leading-relaxed text-gray-800 border-none resize-none focus:outline-none bg-white"
                    readOnly
                    value={generatedContent?.englishLetter || "The generated English letter will appear here..."}
                  />
              </SectionBox>
            </div>

            {/* Box 2: Chinese Logic Logic */}
            <div className="flex-1 min-h-0">
               <SectionBox title="Chinese Logic Draft" number={2} className="h-full">
                 <div className="text-sm text-gray-600 whitespace-pre-wrap h-full overflow-y-auto">
                   {generatedContent?.chineseLogicDraft || "Waiting for input..."}
                 </div>
              </SectionBox>
            </div>

            {/* Box 4: Grammar Check */}
            <div className="flex-1 min-h-0">
               <SectionBox title="Grammar & Logic Check" number={4} className="h-full">
                 <div className="text-sm text-amber-800 bg-amber-50 p-2 rounded h-full overflow-y-auto border border-amber-100">
                   {generatedContent?.grammarAnalysis || "No analysis yet."}
                 </div>
              </SectionBox>
            </div>
          </div>

          {/* Column 3: Interaction (Box 5) - Spans 3 cols */}
          <div className="md:col-span-1 lg:col-span-4 h-full">
            <SectionBox title="Interactive Refinement" number={5} className="h-full">
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-10">
                      Once the letter is generated, you can ask for changes here.
                    </div>
                  )}
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-white rounded-br-none' 
                          : 'bg-gray-200 text-gray-800 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="mt-auto relative">
                  <input
                    type="text"
                    disabled={!generatedContent}
                    className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-gray-100"
                    placeholder={generatedContent ? "Ask to rewrite a section..." : "Generate letter first..."}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim() || !generatedContent}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </SectionBox>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;