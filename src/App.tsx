import { useState } from 'react';
import { UploadStep } from './components/UploadStep';
import { FileDetails } from './components/FileDetails';
import { MappingStep } from './components/MappingStep';
import { ReviewStep } from './components/ReviewStep';
import type { ParseResult, MappingConfig } from './types';

type Step = 'upload' | 'details' | 'mapping' | 'review';

function App() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mappingConfig, setMappingConfig] = useState<MappingConfig | null>(null);

  const handleDataLoaded = (result: ParseResult, uploadedFile: File) => {
    setParseResult(result);
    setFile(uploadedFile);
    setStep('details');
  };

  const handleConfirmFile = () => {
    setStep('mapping');
  };

  const handleMappingComplete = (config: MappingConfig) => {
    setMappingConfig(config);
    setStep('review');
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setParseResult(null);
    setMappingConfig(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden text-slate-900 font-sans selection:bg-blue-100">
      {/* Animated Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
              Y
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              CSV to YNAB
            </h1>
          </div>

          {/* Progress Steps */}
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <StepIndicator current={step} step="upload" label="Upload" />
            <StepDivider />
            <StepIndicator current={step} step="mapping" label="Map Columns" />
            <StepDivider />
            <StepIndicator current={step} step="review" label="Review & Export" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 relative z-10 flex flex-col min-h-[calc(100vh-4rem)]">
        <div className="flex-grow">
          {step === 'upload' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Convert Bank CSVs to YNAB</h2>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                  Securely convert your bank statements to YNAB-ready CSVs entirely in your browser.
                  Your data never leaves your device.
                </p>
              </div>
              <UploadStep onDataLoaded={handleDataLoaded} />
            </div>
          )}

          {step === 'details' && file && parseResult && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <FileDetails
                file={file}
                parseResult={parseResult}
                onReparse={setParseResult}
                onConfirm={handleConfirmFile}
                onCancel={handleReset}
              />
            </div>
          )}

          {step === 'mapping' && parseResult && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <MappingStep
                headers={parseResult.meta.fields || []}
                sampleRows={parseResult.data.slice(0, 20)}
                initialConfig={mappingConfig}
                onBack={() => setStep('details')}
                onNext={handleMappingComplete}
              />
            </div>
          )}

          {step === 'review' && parseResult && mappingConfig && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <ReviewStep
                data={parseResult.data}
                initialConfig={mappingConfig}
                onBack={() => setStep('mapping')}
                onReset={handleReset}
              />
            </div>
          )}
        </div>

        <footer className="mt-12 pb-6 text-center text-sm text-slate-500">
          <div className="mb-2">
            © 2025 csv2ynab · Made with ❤️ in Helsinki by{' '}
            <a
              href="https://jfcorsini.com"
              target="_blank"
              rel="noopener"
              className="underline hover:text-slate-800 transition-colors"
            >
              @jfcorsini
            </a>
          </div>
          <div className="text-slate-400 font-medium text-xs">
            Your data never leaves your browser. Not affiliated with YNAB.
          </div>
        </footer>
      </main>
    </div>
  );
}

function StepIndicator({ current, step, label }: { current: Step, step: string, label: string }) {
  const steps = ['upload', 'mapping', 'review'];
  const currentIndex = steps.indexOf(current);
  const stepIndex = steps.indexOf(step);

  const isActive = (currentIndex === stepIndex) && step !== 'review';
  const isCompleted = (currentIndex > stepIndex) || (currentIndex === stepIndex && step === 'review');

  return (
    <div className={`flex items-center space-x-2 ${isActive ? 'text-blue-600 font-medium' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs border
        ${isActive ? 'border-blue-600 bg-blue-50' : isCompleted ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'}
      `}>
        {isCompleted ? '✓' : stepIndex + 1}
      </div>
      <span>{label}</span>
    </div>
  );
}

function StepDivider() {
  return <div className="w-8 h-px bg-slate-200" />;
}

export default App;
