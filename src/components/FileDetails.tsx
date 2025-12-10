import { useState } from 'react';
import { FileText, ArrowRight, Trash2, Settings2, Table } from 'lucide-react';
import type { ParseResult } from '../types';
import Papa from 'papaparse';

interface FileDetailsProps {
  file: File;
  parseResult: ParseResult;
  onReparse: (result: ParseResult) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FileDetails({ file, parseResult, onReparse, onConfirm, onCancel }: FileDetailsProps) {
  const [delimiter, setDelimiter] = useState(parseResult.meta.delimiter);
  const [isReparsing, setIsReparsing] = useState(false);

  // Format bytes
  const size = (file.size / 1024).toFixed(1) + ' KB';
  const rowCount = parseResult.data.length;

  const handleReparse = (newDelimiter: string) => {
    setDelimiter(newDelimiter);
    setIsReparsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: newDelimiter,
      preview: 0,
      complete: (results) => {
        onReparse({
          data: results.data as any[],
          meta: {
            delimiter: results.meta.delimiter || newDelimiter,
            fields: results.meta.fields
          },
          errors: results.errors
        });
        setIsReparsing(false);
      },
      error: (error) => {
        console.error('Reparse Error:', error);
        setIsReparsing(false);
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 transform rotate-3">
                <FileText size={32} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{file.name}</h3>
                <div className="flex items-center space-x-3 mt-2 text-sm text-slate-500 font-medium">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{size}</span>
                  <span>•</span>
                  <span>{rowCount.toLocaleString()} rows</span>
                </div>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
              title="Remove file"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="flex items-center text-slate-900 font-semibold mb-2">
              <Settings2 size={18} className="mr-2 text-blue-500" />
              CSV Settings
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Delimiter</label>
              <div className="relative">
                <select
                  className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none appearance-none font-medium transition-shadow group-hover:shadow-sm"
                  value={delimiter}
                  onChange={(e) => handleReparse(e.target.value)}
                  disabled={isReparsing}
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value={"\t"}>Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-slate-900 font-semibold mb-2">
              <Table size={18} className="mr-2 text-emerald-500" />
              Data Preview
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Columns Detected</label>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2 overflow-hidden">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 shadow-sm">
                      C{i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-50 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                    +{Math.max(0, (parseResult.meta.fields?.length || 0) - 3)}
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  {parseResult.meta.fields?.length || 0} cols
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isReparsing}
            className="px-8 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-medium flex items-center shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
          >
            {isReparsing ? 'Parsing...' : 'Continue'}
            {!isReparsing && <ArrowRight size={18} className="ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );
}
