import { useState, useMemo } from 'react';
import { ArrowRight, ArrowLeft, Settings, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import type { MappingConfig, CsvRow } from '../types';
import { DATE_FORMATS } from '../utils/date';

interface MappingStepProps {
  headers: string[];
  sampleRows: CsvRow[];
  initialConfig?: MappingConfig | null;
  onBack: () => void;
  onNext: (config: MappingConfig) => void;
}

function detectDecimalSeparator(rows: CsvRow[], amountColumn: string): '.' | ',' {
  if (!amountColumn) return '.';

  let commaDecimalMatches = 0;
  let dotDecimalMatches = 0;

  for (const row of rows) {
    const val = row[amountColumn];
    if (!val) continue;
    if (/^-?[\d\s.]*,\d{1,2}$/.test(val)) commaDecimalMatches++;
    if (/^-?[\d\s,]*\.\d{1,2}$/.test(val)) dotDecimalMatches++;
  }

  if (commaDecimalMatches > dotDecimalMatches) return ',';
  if (dotDecimalMatches > commaDecimalMatches) return '.';

  let hasComma = false;
  let hasDot = false;
  for (const row of rows) {
    const val = row[amountColumn];
    if (!val) continue;
    if (val.includes(',')) hasComma = true;
    if (val.includes('.')) hasDot = true;
  }

  if (hasComma && !hasDot) return ',';

  return '.';
}

export function MappingStep({ headers, sampleRows, initialConfig, onBack, onNext }: MappingStepProps) {
  const [config, setConfig] = useState<MappingConfig>(() => {
    if (initialConfig) return initialConfig;

    const amountCol = headers.find(h => /amount|value|sum/i.test(h)) || '';
    const decimalSep = detectDecimalSeparator(sampleRows, amountCol);

    return {
      dateColumn: headers.find(h => /date|time/i.test(h)) || '',
      payeeColumn: headers.find(h => /payee|description|merchant|name/i.test(h)) || '',
      memoColumn: headers.find(h => /memo|reference|note/i.test(h)) || '',
      amountMode: 'single',
      amountColumn: amountCol,
      outflowColumn: '',
      inflowColumn: '',
      dateFormat: 'auto',
      decimalSeparator: decimalSep,
      isNegativeOutflow: true,
      skipEmptyAmount: true,
      trimWhitespace: true
    };
  });

  const detectedSeparator = useMemo(() => {
    const amountCol = config.amountMode === 'single' ? config.amountColumn : (config.outflowColumn || config.inflowColumn);
    return detectDecimalSeparator(sampleRows, amountCol || '');
  }, [sampleRows, config.amountMode, config.amountColumn, config.outflowColumn, config.inflowColumn]);

  const handleChange = (key: keyof MappingConfig, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      if (key === 'amountColumn' && value && !initialConfig) {
        const detected = detectDecimalSeparator(sampleRows, value as string);
        if (detected !== prev.decimalSeparator) {
          newConfig.decimalSeparator = detected;
        }
      }
      return newConfig;
    });
  };

  const isValid = () => {
    if (!config.dateColumn) return false;
    if (config.amountMode === 'single' && !config.amountColumn) return false;
    if (config.amountMode === 'separate' && (!config.outflowColumn && !config.inflowColumn)) return false;
    return true;
  };

  const previewRow = sampleRows[0] || {};

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-slide-up">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20 overflow-hidden">

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Map Columns</h2>
            <p className="text-sm text-slate-500 mt-1">Match your bank's columns to YNAB fields</p>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-100">
            <Settings size={16} />
            <span>Configuration</span>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Core Fields */}
          <div className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Calendar size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Core Fields</h3>
            </div>

            <div className="space-y-6 pl-4 border-l-2 border-indigo-50">
              {/* Date */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Date Column <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    value={config.dateColumn}
                    onChange={(e) => handleChange('dateColumn', e.target.value)}
                  >
                    <option value="">Select a column...</option>
                    {headers.map(h => <option key={h} value={h}>{h} (Ex: {previewRow[h]})</option>)}
                  </select>
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Date Format</label>
                  <select
                    className="w-full bg-white border border-indigo-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                    value={config.dateFormat}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                  >
                    {DATE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Payee */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Payee Column</label>
                <select
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  value={config.payeeColumn}
                  onChange={(e) => handleChange('payeeColumn', e.target.value)}
                >
                  <option value="">(Optional) Select a column...</option>
                  {headers.map(h => <option key={h} value={h}>{h} (Ex: {previewRow[h]})</option>)}
                </select>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Memo Column</label>
                <select
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  value={config.memoColumn}
                  onChange={(e) => handleChange('memoColumn', e.target.value)}
                >
                  <option value="">(Optional) Select a column...</option>
                  {headers.map(h => <option key={h} value={h}>{h} (Ex: {previewRow[h]})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Amount & Options */}
          <div className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <DollarSign size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Amount & Parsing</h3>
            </div>

            <div className="space-y-6 pl-4 border-l-2 border-emerald-50">
              {/* Amount Mode */}
              <div className="bg-slate-100 p-1.5 rounded-xl flex shadow-inner">
                <button
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${config.amountMode === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => handleChange('amountMode', 'single')}
                >
                  Single Column
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${config.amountMode === 'separate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => handleChange('amountMode', 'separate')}
                >
                  Inflow / Outflow
                </button>
              </div>

              {config.amountMode === 'single' ? (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Amount Column <span className="text-red-500">*</span></label>
                    <select
                      className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                      value={config.amountColumn}
                      onChange={(e) => handleChange('amountColumn', e.target.value)}
                    >
                      <option value="">Select a column...</option>
                      {headers.map(h => <option key={h} value={h}>{h} (Ex: {previewRow[h]})</option>)}
                    </select>
                  </div>

                  <label className="flex items-center p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 cursor-pointer hover:bg-emerald-50 transition-colors group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={config.isNegativeOutflow}
                        onChange={(e) => handleChange('isNegativeOutflow', e.target.checked)}
                      />
                      <div className="w-5 h-5 border-2 border-emerald-300 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all"></div>
                      <CheckCircle2 size={14} className="absolute top-0.5 left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-emerald-900 group-hover:text-emerald-950">
                      Negative values are <strong>Outflows</strong>
                    </span>
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Outflow Column</label>
                    <select
                      className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                      value={config.outflowColumn}
                      onChange={(e) => handleChange('outflowColumn', e.target.value)}
                    >
                      <option value="">Select...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Inflow Column</label>
                    <select
                      className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                      value={config.inflowColumn}
                      onChange={(e) => handleChange('inflowColumn', e.target.value)}
                    >
                      <option value="">Select...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Decimal Separator */}
              {((config.amountMode === 'single' && config.amountColumn) ||
                (config.amountMode === 'separate' && (config.outflowColumn || config.inflowColumn))) && (
                  <div className="pt-6 mt-6 border-t border-slate-100 animate-slide-up">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Decimal Separator</label>
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="radio"
                              name="decimalSep"
                              value="."
                              checked={config.decimalSeparator === '.'}
                              onChange={() => handleChange('decimalSeparator', '.')}
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all"></div>
                            <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                          </div>
                          <span className="ml-2 text-sm font-medium text-slate-700 group-hover:text-slate-900">Dot (1.00)</span>
                        </label>

                        <label className="flex items-center cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="radio"
                              name="decimalSep"
                              value=","
                              checked={config.decimalSeparator === ','}
                              onChange={() => handleChange('decimalSeparator', ',')}
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all"></div>
                            <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                          </div>
                          <span className="ml-2 text-sm font-medium text-slate-700 group-hover:text-slate-900">Comma (1,00)</span>
                        </label>
                      </div>

                      <div className="mt-3 flex items-start space-x-2 text-xs text-slate-500">
                        <div className="mt-0.5">
                          {config.decimalSeparator === detectedSeparator ? (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[8px] font-bold text-amber-700">!</div>
                          )}
                        </div>
                        <p>
                          {config.decimalSeparator === detectedSeparator
                            ? <span>We detected <strong>{detectedSeparator === '.' ? 'Dot' : 'Comma'}</strong> based on your data.</span>
                            : <span>You selected <strong>{config.decimalSeparator === '.' ? 'Dot' : 'Comma'}</strong> (Detected: {detectedSeparator === '.' ? 'Dot' : 'Comma'}).</span>
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-6xl flex justify-between px-4">
          <button
            onClick={onBack}
            className="px-6 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-medium transition-all duration-200 flex items-center"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          <button
            onClick={() => onNext(config)}
            disabled={!isValid()}
            className={`
              px-8 py-3 rounded-xl font-bold flex items-center shadow-lg transform transition-all duration-200
              ${isValid()
                ? 'bg-slate-900 hover:bg-black text-white hover:-translate-y-1 shadow-slate-300'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}
            `}
          >
            Review & Convert
            <ArrowRight size={20} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
