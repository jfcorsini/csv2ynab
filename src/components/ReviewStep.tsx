import { useMemo, useState } from 'react';
import { Download, RefreshCw, Filter, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CsvRow, MappingConfig } from '../types';
import { processAll, generateYnabCsv } from '../utils/csv';

interface ReviewStepProps {
  data: CsvRow[];
  initialConfig: MappingConfig;
  onBack: () => void;
  onReset: () => void;
}

export function ReviewStep({ data, initialConfig, onBack, onReset }: ReviewStepProps) {
  const [config, setConfig] = useState<MappingConfig>(initialConfig);

  const { rows, stats } = useMemo(() => {
    return processAll(data, config);
  }, [data, config]);

  const handleDownload = () => {
    const csvContent = generateYnabCsv(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ynab-import-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFilter = (key: keyof MappingConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-slide-up">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-glass flex flex-col justify-between group hover:border-blue-200 transition-colors">
          <div className="text-sm font-medium text-slate-500 mb-2">Total Rows</div>
          <div className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{stats.totalRows.toLocaleString()}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-glass flex flex-col justify-between group hover:border-emerald-200 transition-colors">
          <div className="text-sm font-medium text-slate-500 mb-2">Valid Transactions</div>
          <div className="text-3xl font-bold text-emerald-600">{stats.validRows.toLocaleString()}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-glass flex flex-col justify-between group hover:border-amber-200 transition-colors">
          <div className="text-sm font-medium text-slate-500 mb-2">Skipped Rows</div>
          <div className="text-3xl font-bold text-amber-600">{stats.skippedRows.toLocaleString()}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-glass flex flex-col justify-between group hover:border-indigo-200 transition-colors">
          <div className="text-sm font-medium text-slate-500 mb-2">Net Flow</div>
          <div className={`text-3xl font-bold ${stats.totalInflow - stats.totalOutflow >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            {(stats.totalInflow - stats.totalOutflow).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Preview Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 backdrop-blur flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-slate-900 flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                Preview
              </h3>
              <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                Showing {Math.min(50, rows.length)} of {rows.length}
              </span>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider bg-slate-50">Date</th>
                    <th className="px-6 py-4 font-semibold tracking-wider bg-slate-50">Payee</th>
                    <th className="px-6 py-4 font-semibold tracking-wider bg-slate-50">Memo</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right bg-slate-50">Outflow</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right bg-slate-50">Inflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-3 whitespace-nowrap text-slate-700 font-medium">{row.Date}</td>
                      <td className="px-6 py-3 max-w-[200px] truncate text-slate-700" title={row.Payee}>{row.Payee}</td>
                      <td className="px-6 py-3 max-w-[200px] truncate text-slate-500 group-hover:text-slate-700 transition-colors" title={row.Memo}>{row.Memo}</td>
                      <td className="px-6 py-3 text-right font-mono text-slate-700">{row.Outflow}</td>
                      <td className="px-6 py-3 text-right font-mono text-emerald-600 font-medium">{row.Inflow}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <AlertCircle size={48} className="mb-4 opacity-50" />
                          <p className="text-lg font-medium text-slate-600">No valid rows found</p>
                          <p className="text-sm mt-1">Please check your mapping settings.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Filters & Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center mb-6 text-slate-900 font-bold text-lg">
              <Filter size={20} className="mr-2 text-blue-600" />
              Refine Results
            </div>

            <div className="space-y-4">
              <label className="flex items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={config.skipEmptyAmount}
                    onChange={() => toggleFilter('skipEmptyAmount')}
                  />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                  <CheckCircle2 size={14} className="absolute top-0.5 left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-900">Skip empty amounts</span>
              </label>

              <label className="flex items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={config.trimWhitespace}
                    onChange={() => toggleFilter('trimWhitespace')}
                  />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                  <CheckCircle2 size={14} className="absolute top-0.5 left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-900">Trim whitespace</span>
              </label>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
            <h4 className="font-bold text-xl mb-2">Ready to Export?</h4>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Your file is processed and ready. Download the CSV and import it directly into YNAB.
            </p>
            <div className="text-center p-4 bg-white/10 rounded-xl border border-white/10">
              <p className="text-sm font-medium">
                Click the button below to download your file.
              </p>
            </div>
          </div>

        </div>
      </div>


      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-6xl flex justify-between px-4">
          <div className="flex space-x-4">
            <button
              onClick={onBack}
              className="px-6 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-medium transition-all duration-200 flex items-center"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
            <button
              onClick={onReset}
              className="px-6 py-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl font-medium transition-all duration-200 flex items-center"
            >
              <RefreshCw size={20} className="mr-2" />
              Start Over
            </button>
          </div>
          <button
            onClick={handleDownload}
            disabled={rows.length === 0}
            className="px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold flex items-center shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
          >
            <Download size={20} className="mr-2" />
            Download YNAB CSV
          </button>
        </div>
      </div>
    </div >
  );
}
