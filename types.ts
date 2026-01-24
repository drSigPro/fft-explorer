
export interface Complex {
  re: number;
  im: number;
}

export interface SignalPoint {
  time: number;
  value: number;
}

export interface FrequencyComponent {
  frequency: number;
  amplitude: number;
  phase: number;
  signal: number[]; // Time-domain representation of this single component
}

export enum InputMode {
  DRAW = 'DRAW',
  EQUATION = 'EQUATION',
  NUMBERS = 'NUMBERS',
}

export interface AppState {
  signal: number[];
  numPoints: number;
  fftData: Complex[];
  components: FrequencyComponent[];
  inputMode: InputMode;
}
