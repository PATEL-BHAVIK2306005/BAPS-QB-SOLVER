import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, AlertCircle, X } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  disabled?: boolean;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect, selectedFile, onClearFile, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError("Only PDF files are allowed.");
      return;
    }
    // Limit to 20MB approx
    if (file.size > 20 * 1024 * 1024) {
      setError("File size exceeds the 20MB limit.");
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!selectedFile && !disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : 'cursor-pointer'}
          ${isDragging ? 'border-brand-500 bg-brand-50 scale-[1.02]' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'}
          ${selectedFile ? 'bg-white border-solid border-brand-200' : ''}
        `}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleInputChange}
          accept="application/pdf"
          className="hidden"
          disabled={disabled || !!selectedFile}
        />

        {selectedFile ? (
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-brand-100 rounded-lg text-brand-600">
                <FileText className="w-8 h-8" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFile();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500 mt-1">
                PDF Question Bank (Max 20MB)
              </p>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 flex items-center p-4 text-red-800 bg-red-50 rounded-lg">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};

export default UploadArea;