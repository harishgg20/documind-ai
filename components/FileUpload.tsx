import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle, Image as ImageIcon, Cloud, Video } from 'lucide-react';

interface FileUploadProps {
  onFileProcess: (file: File) => Promise<void>;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcess, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndProcess(file);
    }
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    if (e.target.files && e.target.files[0]) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const validateAndProcess = async (file: File) => {
    // Validate type
    const validTypes = [
      'application/pdf', 
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid PDF, Image, or Video (MP4, WEBM, MOV).");
      return;
    }

    // Limit to 50MB for video (browser base64 limit is high but parsing is slow)
    // kept 20MB in prompt text but code allows check
    if (file.size > 50 * 1024 * 1024) {
        setError("File size exceeds 50MB limit.");
        return;
    }
    await onFileProcess(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-[24px] transition-all duration-200 ${
          dragActive 
            ? "border-google-blue bg-[#c2e7ff]/30" 
            : "border-[#c4c7c5] bg-[#f8f9fa] hover:border-[#1f1f1f] hover:bg-[#f0f4f9]"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 mb-4 text-google-blue animate-spin" />
              <p className="mb-2 text-base text-[#1f1f1f] font-medium">Processing...</p>
              <p className="text-sm text-[#444746]">Analyzing content</p>
            </>
          ) : (
            <>
              <div className="mb-4 flex gap-2">
                 <Cloud className="w-16 h-16 text-[#444746] opacity-50" />
              </div>
              <p className="mb-2 text-lg text-[#1f1f1f] font-normal">
                Drag & drop files here
              </p>
              <p className="mb-6 text-sm text-[#444746]">
                 or
              </p>
              <label htmlFor="dropzone-file" className="cursor-pointer">
                  <span className="px-6 py-2.5 rounded-full border border-[#747775] text-google-blue text-sm font-medium hover:bg-[#f0f4f9] transition-colors">
                      Browse computer
                  </span>
              </label>
              
              <div className="flex gap-4 text-xs text-[#444746] mt-8">
                 <span className="flex items-center gap-1"><FileText className="w-3 h-3"/> PDF</span>
                 <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Images</span>
                 <span className="flex items-center gap-1"><Video className="w-3 h-3"/> Video</span>
              </div>
              <div className="text-[10px] text-[#444746] mt-2 opacity-70">
                 Max 50MB
              </div>
            </>
          )}
        </div>
        <input 
          id="dropzone-file" 
          type="file" 
          className="absolute w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
          onChange={handleChange}
          accept=".pdf,image/*,video/*"
          disabled={isProcessing}
        />
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-[#b3261e] text-sm rounded-xl flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;