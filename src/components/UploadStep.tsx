import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import type { ParseResult } from '../types';
import { parseCsvFile } from '../utils/csv';

interface UploadStepProps {
  onDataLoaded: (data: ParseResult, file: File) => void;
}

export function UploadStep({ onDataLoaded }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }
    setError(null);
    setIsParsing(true);

    // Small artificial delay to show loading state for better UX
    setTimeout(() => {
      parseCsvFile(file, (result) => {
        setIsParsing(false);
        if (result.data.length === 0) {
          setError('The CSV file appears to be empty.');
          return;
        }
        onDataLoaded(result, file);
      });
    }, 600);
  }, [onDataLoaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div
        className={`
          relative group cursor-pointer
          rounded-2xl border-2 border-dashed transition-all duration-300 ease-out
          ${isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-xl shadow-blue-100'
            : 'border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-100'}
          ${error ? 'border-red-300 bg-red-50/30' : ''}
        `}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className={`
            mb-6 p-5 rounded-full transition-all duration-300
            ${isDragging ? 'bg-blue-100 text-blue-600 scale-110' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:scale-110'}
          `}>
            {isParsing ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-current"></div>
            ) : (
              <Upload size={40} strokeWidth={1.5} />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              {isDragging ? 'Drop it like it\'s hot' : 'Upload Bank CSV'}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
              Drag and drop your file here, or click to browse.
              <br />
              <span className="text-xs text-slate-400 mt-2 block">Supports comma, semicolon, and tab delimiters</span>
            </p>
          </div>

          <input
            type="file"
            id="file-input"
            className="hidden"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute -top-1/2 -right-1/2 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl"></div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center shadow-sm animate-fade-in">
          <div className="bg-red-100 p-2 rounded-full mr-3">
            <X size={16} />
          </div>
          {error}
        </div>
      )}
    </div>
  );
}
