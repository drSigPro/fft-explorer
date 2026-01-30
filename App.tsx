
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Complex, FrequencyComponent, InputMode } from './types';
import { fft, getFrequencyComponents } from './services/fft';
import Visualizer3D from './components/Visualizer3D';
import SignalInput from './components/SignalInput';

const POINT_OPTIONS = [32, 64, 128];

const App: React.FC = () => {
  const [numPoints, setNumPoints] = useState(128);

  // Initialize signal with a default state immediately
  const [signal, setSignal] = useState<number[]>(() => {
    const initialSize = 128;
    return new Array(initialSize).fill(0).map((_, i) => {
      const x = i / initialSize;
      return Math.sin(2 * Math.PI * 3 * x) + 0.5 * Math.sin(2 * Math.PI * 10 * x);
    });
  });

  const [inputMode, setInputMode] = useState<InputMode>(InputMode.EQUATION);
  const [activeTab, setActiveTab] = useState<'3d' | 'steps'>('3d');

  // Resample signal when numPoints changes to maintain the wave shape
  useEffect(() => {
    setSignal(prev => {
      if (!prev || prev.length === 0) return new Array(numPoints).fill(0);
      if (prev.length === numPoints) return prev;

      const next = new Array(numPoints).fill(0);
      const prevLen = prev.length;
      for (let i = 0; i < numPoints; i++) {
        const samplePos = (i / (numPoints - 1)) * (prevLen - 1);
        const indexLow = Math.floor(samplePos);
        const indexHigh = Math.ceil(samplePos);
        const weight = samplePos - indexLow;

        const valLow = prev[indexLow] ?? 0;
        const valHigh = prev[indexHigh] ?? (prev[indexLow] ?? 0);

        next[i] = valLow * (1 - weight) + valHigh * weight;
      }
      return next;
    });
  }, [numPoints]);

  const fftResult = useMemo(() => {
    if (!signal || signal.length < 2) return [];
    try {
      return fft(signal);
    } catch (e) {
      console.error("FFT Error:", e);
      return [];
    }
  }, [signal]);

  const components = useMemo(() => {
    if (!fftResult || fftResult.length === 0) return [];
    return getFrequencyComponents(fftResult, signal.length);
  }, [fftResult, signal.length]);

  const updateSignal = useCallback((newSignal: number[] | ((prev: number[]) => number[])) => {
    setSignal(newSignal);
  }, []);

  console.log('Spectrum Components:', components.length, components);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">FFT <span className="text-blue-500">Explorer</span></h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Frequency Discovery Tool</p>
          </div>
        </div>

        <nav className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
          <button
            onClick={() => setActiveTab('3d')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === '3d' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            3D EXPLORER
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'steps' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            THE PROCESS
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-full md:w-80 lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto shrink-0 scrollbar-hide">
          <div className="p-6 space-y-8">
            <section>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Sample Resolution</h2>
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-medium">Resolution Points</span>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{numPoints}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {POINT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setNumPoints(opt)}
                      className={`py-2 text-[10px] font-black rounded-lg transition-all border ${numPoints === opt ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Input Waveform</h2>
              <SignalInput
                signal={signal}
                numPoints={numPoints}
                onSignalUpdate={updateSignal}
                currentMode={inputMode}
                onModeChange={setInputMode}
              />
            </section>

            <section>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Spectrum Magnitude</h2>
              <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800">

                {components.length === 0 ? (
                  <div className="h-32 w-full flex items-center justify-center text-slate-500 text-xs italic">
                    No signal data
                  </div>
                ) : (
                  <div className="h-32 w-full flex items-end space-x-0.5 border-b border-slate-800 pb-1 overflow-x-auto custom-scrollbar">
                    {components.map((c, i) => (
                      <div
                        key={i}
                        style={{ height: `${Math.max(2, Math.min(c.amplitude * 100, 100))}%` }}
                        className="flex-1 min-w-[3px] bg-gradient-to-t from-blue-600 via-blue-400 to-cyan-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity group relative shrink-0"
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-[9px] font-bold px-2 py-1 rounded-md hidden group-hover:block whitespace-nowrap z-50 border border-slate-700 shadow-xl pointer-events-none">
                          {c.frequency}Hz: {c.amplitude.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                  <span>DC</span>
                  <span>Nyquist ({(signal.length / 2).toFixed(0)}Hz)</span>
                </div>
              </div>
            </section>
          </div>
        </aside>

        {/* Viewport Area */}
        <section className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
          {activeTab === '3d' ? (
            <Visualizer3D signal={signal} components={components} />
          ) : (
            <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar bg-slate-950">
              <div className="max-w-3xl mx-auto space-y-16 py-12">
                <header className="text-center space-y-2">
                  <h2 className="text-4xl font-black text-white tracking-tight">Understanding the Math</h2>
                  <p className="text-slate-500 font-medium">The journey from Time to Frequency</p>
                </header>

                <div className="grid gap-8">
                  {[
                    { step: 1, title: "Correlation", color: "blue", desc: "The algorithm compares your signal to pure sine waves. A high 'match' score means that frequency exists in your sound." },
                    { step: 2, title: "Binning", color: "cyan", desc: "Results are placed into 'bins' ordered by frequency. In 3D, these bins are arranged along the Depth (Z) axis." },
                    { step: 3, title: "Magnitude", color: "emerald", desc: "We calculate the absolute power of each bin. This tells us the volume of each harmonic component." }
                  ].map((s) => (
                    <div key={s.step} className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 flex items-start space-x-8 transition-transform hover:scale-[1.01]">
                      <div className={`w-14 h-14 rounded-2xl bg-${s.color}-600/10 text-${s.color}-500 flex items-center justify-center text-3xl font-black shrink-0 border border-${s.color}-500/20`}>{s.step}</div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">{s.title}</h3>
                        <p className="text-slate-400 leading-relaxed text-sm font-medium">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
