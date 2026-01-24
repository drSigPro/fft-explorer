
import { Complex, FrequencyComponent } from '../types';

/**
 * Standard O(N^2) Discrete Fourier Transform.
 * Used as fallback for non-power-of-2 lengths.
 */
function dft(input: number[]): Complex[] {
  const n = input.length;
  const output: Complex[] = [];
  for (let k = 0; k < n; k++) {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      re += input[t] * Math.cos(angle);
      im -= input[t] * Math.sin(angle);
    }
    output.push({ re, im });
  }
  return output;
}

/**
 * Standard Radix-2 FFT implementation.
 * Falls back to DFT if input length is not a power of 2.
 */
export function fft(input: number[]): Complex[] {
  const n = input.length;
  if (n <= 1) {
    return [{ re: input[0] || 0, im: 0 }];
  }

  // Fallback to DFT if not power of 2
  if ((n & (n - 1)) !== 0) {
    return dft(input);
  }

  const evenInput: number[] = [];
  const oddInput: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) evenInput.push(input[i]);
    else oddInput.push(input[i]);
  }

  const even = fft(evenInput);
  const odd = fft(oddInput);

  const results: Complex[] = new Array(n);
  for (let k = 0; k < n / 2; k++) {
    const angle = (-2 * Math.PI * k) / n;
    const w: Complex = {
      re: Math.cos(angle),
      im: Math.sin(angle),
    };

    // Safely access recursive results
    const oddK = odd[k] || { re: 0, im: 0 };
    const evenK = even[k] || { re: 0, im: 0 };

    // oddK * w
    const oddW: Complex = {
      re: oddK.re * w.re - oddK.im * w.im,
      im: oddK.re * w.im + oddK.im * w.re,
    };

    results[k] = {
      re: evenK.re + oddW.re,
      im: evenK.im + oddW.im,
    };
    results[k + n / 2] = {
      re: evenK.re - oddW.re,
      im: evenK.im - oddW.im,
    };
  }

  return results;
}

export function getFrequencyComponents(fftData: Complex[], n: number): FrequencyComponent[] {
  if (!fftData || fftData.length === 0) return [];
  
  const components: FrequencyComponent[] = [];
  const actualLen = fftData.length;
  // Use the smaller of the two to avoid out-of-bounds
  const half = Math.floor(actualLen / 2);
  
  // Only use first half (Nyquist)
  for (let k = 1; k < half; k++) {
    const bin = fftData[k];
    if (!bin) continue;

    const re = bin.re;
    const im = bin.im;
    const amplitude = (Math.sqrt(re * re + im * im) * 2) / actualLen;
    const phase = Math.atan2(im, re);
    
    // Generate the time-domain sine wave for this component
    const signal = new Array(actualLen).fill(0).map((_, i) => {
      return amplitude * Math.cos((2 * Math.PI * k * i) / actualLen + phase);
    });

    components.push({
      frequency: k,
      amplitude,
      phase,
      signal
    });
  }
  return components;
}
