
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InputMode } from '../types';

interface SignalInputProps {
  signal: number[];
  numPoints: number;
  onSignalUpdate: (signal: number[] | ((prev: number[]) => number[])) => void;
  currentMode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

const SignalInput: React.FC<SignalInputProps> = ({ signal, numPoints, onSignalUpdate, currentMode, onModeChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [equation, setEquation] = useState('Math.sin(2 * Math.PI * 3 * x) + 0.5 * Math.sin(2 * Math.PI * 10 * x)');
  const [rawNumbers, setRawNumbers] = useState('');

  // Draw the signal waveform on the canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Draw baseline
    ctx.beginPath();
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([5, 5]);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw signal
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    for (let i = 0; i < signal.length; i++) {
      const x = (i / (signal.length - 1)) * width;
      // Map signal -1..1 to height..0
      const y = ((-signal[i] + 1) / 2) * height;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [signal]);

  useEffect(() => {
    if (currentMode === InputMode.DRAW) {
      drawWaveform();
    }
  }, [signal, currentMode, drawWaveform]);

  // Handle user drawing input
  const updateSignalAtPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const xRatio = (clientX - rect.left) / rect.width;
    const yRatio = (clientY - rect.top) / rect.height;

    const index = Math.floor(Math.min(Math.max(xRatio * numPoints, 0), numPoints - 1));
    const val = (0.5 - yRatio) * 2; // Map 0..1 to 1..-1 then scale

    onSignalUpdate((prev) => {
      const next = [...prev];
      // Simple debounce/smooth: apply to a small neighborhood for "brush" effect
      const brushSize = 2;
      for (let i = -brushSize; i <= brushSize; i++) {
        const targetIdx = index + i;
        if (targetIdx >= 0 && targetIdx < numPoints) {
          next[targetIdx] = val;
        }
      }
      return next;
    });
  }, [numPoints, onSignalUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    updateSignalAtPoint(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing) {
      updateSignalAtPoint(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDrawing) {
      updateSignalAtPoint(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseUp = () => setIsDrawing(false);

  const applyNumbers = useCallback(() => {
    const nums = rawNumbers.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (nums.length === 0) return;
    const final = new Array(numPoints).fill(0).map((_, i) => {
      const idx = Math.floor((i / numPoints) * nums.length);
      return nums[idx] || 0;
    });
    onSignalUpdate(final);
  }, [rawNumbers, numPoints, onSignalUpdate]);

  const applyEquation = useCallback(() => {
    try {
      const newSignal = new Array(numPoints).fill(0).map((_, i) => {
        const x = i / numPoints;
        const fn = new Function('x', `return ${equation}`);
        const val = fn(x);
        return isNaN(val) ? 0 : val;
      });
      onSignalUpdate(newSignal);
    } catch (e) {
      // alert('Invalid equation format. Use "x" as the variable (0 to 1).'); 
      // Silently fail or log during auto-update to avoid annoying popups
      console.warn("Equation error:", e);
    }
  }, [equation, numPoints, onSignalUpdate]);

  // Re-calculate signal when resolution changes (if in Equation or Numbers mode)
  useEffect(() => {
    if (currentMode === InputMode.EQUATION) {
      applyEquation();
    } else if (currentMode === InputMode.NUMBERS) {
      applyNumbers();
    }
    // For DRAW mode, we rely on the parent App.tsx resampling logic
  }, [numPoints, currentMode, applyEquation, applyNumbers]);

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-xl">
      <div className="flex space-x-2 mb-4 bg-slate-900 p-1 rounded-lg">
        {[InputMode.DRAW, InputMode.EQUATION, InputMode.NUMBERS].map(mode => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${currentMode === mode
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
          >
            {mode.charAt(0) + mode.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="min-h-[200px]">
        {currentMode === InputMode.DRAW && (
          <div className="space-y-2">
            <div className="flex justify-between items-end mb-1">
              <p className="text-xs text-slate-400 italic">Drag to draw waveform</p>
              <button
                onClick={() => onSignalUpdate(new Array(numPoints).fill(0))}
                className="text-[10px] text-slate-500 hover:text-slate-300 uppercase font-bold"
              >
                Clear
              </button>
            </div>
            <div className="relative bg-slate-900 border border-slate-700 rounded-lg overflow-hidden h-40">
              <canvas
                ref={canvasRef}
                width={400}
                height={160}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={() => setIsDrawing(true)}
                onTouchEnd={handleMouseUp}
                onTouchMove={handleTouchMove}
                className="w-full h-full cursor-crosshair"
              />
            </div>
          </div>
        )}

        {currentMode === InputMode.EQUATION && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Formula (JavaScript)</label>
              <textarea
                value={equation}
                onChange={(e) => setEquation(e.target.value)}
                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-sm text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Math.sin(2 * Math.PI * x)..."
              />
            </div>
            <button
              onClick={applyEquation}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors shadow-lg"
            >
              Generate Signal
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setEquation('Math.sin(2 * Math.PI * 5 * x)')} className="text-[10px] bg-slate-700 hover:bg-slate-600 p-1 rounded">5Hz Sine</button>
              <button onClick={() => setEquation('Math.sin(2 * Math.PI * x) + Math.sin(2 * Math.PI * 10 * x) * 0.3')} className="text-[10px] bg-slate-700 hover:bg-slate-600 p-1 rounded">Sum of Sines</button>
              <button onClick={() => setEquation('x < 0.5 ? 1 : -1')} className="text-[10px] bg-slate-700 hover:bg-slate-600 p-1 rounded">Square Wave</button>
              <button onClick={() => setEquation('Math.random() - 0.5')} className="text-[10px] bg-slate-700 hover:bg-slate-600 p-1 rounded">White Noise</button>
            </div>
          </div>
        )}

        {currentMode === InputMode.NUMBERS && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Points</label>
              <textarea
                value={rawNumbers}
                onChange={(e) => setRawNumbers(e.target.value)}
                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-sm text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.1, 0.5, -0.3, 0.8..."
              />
            </div>
            <button
              onClick={applyNumbers}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold transition-colors shadow-lg"
            >
              Load Values
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalInput;
