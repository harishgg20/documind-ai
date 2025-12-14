import React, { useState, useEffect } from 'react';
import { X, Play, FileText, MessageSquare, Zap, Upload, Sparkles, Cloud, Video, BrainCircuit, Check } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppTourAnimation = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 3500); // 3.5 seconds per slide
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#1e1e1e] flex flex-col items-center justify-center overflow-hidden rounded-2xl select-none">
       {/* Background Glow */}
       <div className={`absolute w-[200%] h-[200%] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-red-500/10 animate-spin-slow transition-opacity duration-1000 ${step === 1 ? 'opacity-100' : 'opacity-30'}`} style={{ animationDuration: '10s' }}></div>

       {/* --- SCENE 1: UPLOAD --- */}
       <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 transform ${step === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="relative mb-8">
             {/* Cloud Icon */}
             <div className="w-32 h-32 rounded-full bg-[#2d2d2d] flex items-center justify-center shadow-2xl relative z-10 border border-white/5">
                <Cloud className="w-16 h-16 text-blue-400" />
             </div>
             {/* Floating Particles */}
             <div className="absolute top-0 right-0 p-2 bg-[#f0f4f9] rounded-lg shadow-lg animate-bounce" style={{ animationDelay: '0s' }}>
                <FileText className="w-6 h-6 text-red-500" />
             </div>
             <div className="absolute bottom-0 left-0 p-2 bg-[#f0f4f9] rounded-lg shadow-lg animate-bounce" style={{ animationDelay: '0.5s' }}>
                <Video className="w-6 h-6 text-purple-600" />
             </div>
          </div>
          <div className="text-center z-10">
             <h4 className="text-2xl font-medium text-white mb-2">Universal Upload</h4>
             <p className="text-gray-400 text-sm">Drag & drop PDFs, Images, or Videos up to 50MB</p>
          </div>
       </div>

       {/* --- SCENE 2: ANALYZE --- */}
       <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 transform ${step === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="relative mb-8">
             <div className="w-32 h-32 rounded-2xl bg-[#2d2d2d] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl">
                 <Video className="w-12 h-12 text-gray-500 opacity-50" />
                 
                 {/* Scanning Line */}
                 <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-blue-500/30 border-b border-blue-400 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
                 
                 {/* Gemini Sparkle Overlay */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse" />
                 </div>
             </div>
          </div>
          <div className="text-center z-10">
             <h4 className="text-2xl font-medium text-white mb-2">Powered by Gemini 2.5</h4>
             <p className="text-gray-400 text-sm">Advanced multimodal analysis of every frame & page</p>
          </div>
       </div>

       {/* --- SCENE 3: CHAT --- */}
       <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 transform ${step === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="w-full max-w-sm px-8 space-y-4 mb-6">
             {/* User Bubble */}
             <div className="flex justify-end animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="bg-[#2d2d2d] text-white px-4 py-3 rounded-2xl rounded-br-none text-sm shadow-lg max-w-[85%] border border-white/5">
                   Summarize the key events in this video.
                </div>
             </div>
             
             {/* AI Bubble */}
             <div className="flex justify-start animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
                <div className="flex gap-3 max-w-[90%]">
                   <div className="w-8 h-8 rounded-full bg-google-blue flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/50">
                      <Sparkles className="w-4 h-4 text-white" />
                   </div>
                   <div className="bg-gradient-to-br from-blue-900/40 to-[#2d2d2d] text-blue-100 px-4 py-3 rounded-2xl rounded-bl-none text-sm border border-blue-500/20 shadow-lg backdrop-blur-sm">
                      <p>I found 3 key events:</p>
                      <ul className="mt-2 space-y-1 opacity-90">
                         <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400"/> 0:15 Product Intro</li>
                         <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400"/> 1:30 Live Demo</li>
                         <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400"/> 2:45 Pricing Reveal</li>
                      </ul>
                   </div>
                </div>
             </div>
          </div>
          <div className="text-center z-10">
             <h4 className="text-2xl font-medium text-white mb-2">Interactive Chat</h4>
             <p className="text-gray-400 text-sm">Ask questions, get citations & timestamps</p>
          </div>
       </div>

       {/* Progress Indicators */}
       <div className="absolute bottom-6 flex gap-2 z-20">
          {[0, 1, 2].map((i) => (
             <button 
               key={i}
               onClick={() => setStep(i)}
               className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-blue-500' : 'w-2 bg-white/20 hover:bg-white/40'}`}
             />
          ))}
       </div>
    </div>
  );
};

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[#e1e3e1] max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#e1e3e1] flex items-center justify-between bg-white sticky top-0 z-10">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-google-blue rounded-xl text-white">
                 <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-normal text-[#1f1f1f]">How DocuMind Works</h2>
           </div>
           <button 
             onClick={onClose}
             className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full transition-colors"
           >
             <X className="w-6 h-6" />
           </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 space-y-10">
           
           {/* Animated Feature Tour Section */}
           <section className="space-y-4">
              <h3 className="text-lg font-medium text-[#1f1f1f] flex items-center gap-2">
                 <Play className="w-5 h-5 text-google-blue fill-current" />
                 Feature Tour
              </h3>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-[#e1e3e1]">
                 <AppTourAnimation />
              </div>
           </section>

           {/* Steps Section */}
           <section>
              <h3 className="text-lg font-medium text-[#1f1f1f] mb-6">Getting Started</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 
                 <div className="bg-[#f0f4f9] p-6 rounded-[24px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Upload className="w-24 h-24" />
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-google-blue font-bold text-lg mb-4 shadow-sm">1</div>
                    <h4 className="text-base font-medium text-[#1f1f1f] mb-2">Upload Content</h4>
                    <p className="text-sm text-[#444746] leading-relaxed">
                       Drag and drop your PDF documents, images, or <span className="font-medium text-google-blue">videos</span> into the upload zone. We support files up to 50MB.
                    </p>
                 </div>

                 <div className="bg-[#f0f4f9] p-6 rounded-[24px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Zap className="w-24 h-24" />
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold text-lg mb-4 shadow-sm">2</div>
                    <h4 className="text-base font-medium text-[#1f1f1f] mb-2">AI Processing</h4>
                    <p className="text-sm text-[#444746] leading-relaxed">
                       Gemini Pro analyzes your file instantly. For videos, it watches the content to understand visual context and events.
                    </p>
                 </div>

                 <div className="bg-[#f0f4f9] p-6 rounded-[24px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <MessageSquare className="w-24 h-24" />
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-google-green font-bold text-lg mb-4 shadow-sm">3</div>
                    <h4 className="text-base font-medium text-[#1f1f1f] mb-2">Ask Questions</h4>
                    <p className="text-sm text-[#444746] leading-relaxed">
                       Chat naturally with your content. Ask for summaries, specific details, or visual descriptions.
                    </p>
                 </div>

              </div>
           </section>

           {/* Features Grid */}
           <section className="bg-white">
              <h3 className="text-lg font-medium text-[#1f1f1f] mb-4">Key Capabilities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8f9fa] transition-colors">
                    <div className="p-2 bg-[#e8f0fe] rounded-lg text-google-blue">
                       <FileText className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="font-medium text-sm text-[#1f1f1f]">PDF Citations</div>
                       <div className="text-xs text-[#444746]">Get exact page numbers for every answer sourced from documents.</div>
                    </div>
                 </div>
                 
                 <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8f9fa] transition-colors">
                     <div className="p-2 bg-[#f3e8fd] rounded-lg text-purple-600">
                       <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="font-medium text-sm text-[#1f1f1f]">Video Understanding</div>
                       <div className="text-xs text-[#444746]">Gemini 1.5 Pro analyzes video frames to answer questions about events and visuals.</div>
                    </div>
                 </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8f9fa] transition-colors">
                     <div className="p-2 bg-[#fce8e6] rounded-lg text-google-red">
                       <Zap className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="font-medium text-sm text-[#1f1f1f]">Voice Interaction</div>
                       <div className="text-xs text-[#444746]">Speak to your documents and listen to the AI's response.</div>
                    </div>
                 </div>
              </div>
           </section>

        </div>

        <div className="p-6 border-t border-[#e1e3e1] bg-[#f8f9fa] flex justify-end">
           <button 
             onClick={onClose}
             className="px-8 py-3 bg-google-blue text-white font-medium rounded-full hover:bg-blue-700 hover:shadow-md transition-all text-sm"
           >
             Got it
           </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;