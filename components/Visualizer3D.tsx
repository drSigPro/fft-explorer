
import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FrequencyComponent } from '../types';

interface Visualizer3DProps {
  signal: number[];
  components: FrequencyComponent[];
}

const Grid = () => (
  <group>
    <gridHelper args={[20, 20, 0x334155, 0x1e293b]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} />
    <axesHelper args={[5]} />
  </group>
);

const SafeLine = ({ points, color, lineWidth = 2, opacity = 1 }: { points: THREE.Vector3[], color: string, lineWidth?: number, opacity?: number }) => {
  const validPoints = useMemo(() => {
    return points.filter(p => isFinite(p.x) && isFinite(p.y) && isFinite(p.z));
  }, [points]);

  if (validPoints.length < 2) return null;

  return (
    <Line
      points={validPoints}
      color={color}
      lineWidth={lineWidth}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
};

const Label = ({ position, text, color, bold = false }: { position: [number, number, number], text: string, color: string, bold?: boolean }) => (
  <Html position={position} center distanceFactor={15}>
    <div style={{ 
        color, 
        fontSize: bold ? '12px' : '10px', 
        whiteSpace: 'nowrap', 
        fontWeight: bold ? '900' : 'bold', 
        pointerEvents: 'none', 
        background: 'rgba(2, 6, 23, 0.9)', 
        padding: '2px 8px', 
        borderRadius: '4px',
        border: `1px solid ${color}${bold ? '88' : '44'}`,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: bold ? 10 : 1
    }}>
      {text}
    </div>
  </Html>
);

const SceneContent = ({ signal, components }: Visualizer3DProps) => {
  const timeScale = 10;
  const ampScale = 4;
  const maxZ = 12;

  const n = signal.length || 1;
  const nyquist = n > 1 ? n / 2 : 1;

  const mainSignalPoints = useMemo(() => {
    if (n < 2) return [];
    return signal.map((y, i) => {
        const x = (i / (n - 1) - 0.5) * timeScale;
        const val = (y || 0) * ampScale;
        return new THREE.Vector3(x, val, 0);
    });
  }, [signal, n, timeScale, ampScale]);

  const componentLines = useMemo(() => {
    if (!components || components.length === 0 || n < 2) return [];

    const significant = [...components]
      .sort((a, b) => b.amplitude - a.amplitude)
      .filter(c => c.amplitude > 0.005)
      .slice(0, 15) // Show slightly more components for a richer view
      .sort((a, b) => a.frequency - b.frequency);

    return significant.map((c) => {
      const freqRatio = Math.min(c.frequency / nyquist, 1);
      const zPos = freqRatio * maxZ;
      
      const points = c.signal.map((y, i) => {
        const x = (i / (n - 1) - 0.5) * timeScale;
        const val = (y || 0) * ampScale;
        return new THREE.Vector3(x, val, zPos);
      });

      return { 
        points, 
        color: `hsl(${(c.frequency * 137.5) % 360}, 85%, 65%)`, 
        label: `${c.frequency}Hz`, 
        z: zPos, 
        amp: c.amplitude 
      };
    });
  }, [components, n, nyquist, timeScale, ampScale, maxZ]);

  return (
    <>
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={2.5} />
      <pointLight position={[-10, 5, 5]} intensity={1.5} color="#3b82f6" />
      
      {/* Time Domain - Base Signal */}
      <SafeLine points={mainSignalPoints} color="#3b82f6" lineWidth={5} />
      <Label position={[-timeScale/2 - 1.5, 0, 0]} text="INPUT SIGNAL" color="#3b82f6" bold />

      {/* Magnitude Wall Background (X-Z plane at top of time domain) */}
      <mesh position={[timeScale/2 + 0.01, 2, maxZ/2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[maxZ + 2, 6]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.4} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Frequency Components */}
      {componentLines.map((line, i) => (
        <group key={`${line.label}-${i}`}>
          {/* Subtle Sine Wave Projection */}
          <SafeLine points={line.points} color={line.color} lineWidth={1.2} opacity={0.4} />
          
          {/* BOLD MAGNITUDE BAR - The spectral component */}
          {/* Main vertical stalk with glow-like thickness */}
          <SafeLine 
            points={[
              new THREE.Vector3(timeScale/2, 0, line.z),
              new THREE.Vector3(timeScale/2, line.amp * ampScale, line.z)
            ]}
            color={line.color}
            lineWidth={8} // Much bolder
          />
          {/* Inner core line for sharp highlight */}
          <SafeLine 
            points={[
              new THREE.Vector3(timeScale/2, 0, line.z),
              new THREE.Vector3(timeScale/2, line.amp * ampScale, line.z)
            ]}
            color="#ffffff"
            lineWidth={2}
            opacity={0.8}
          />
          
          {/* Frequency Labels */}
          <Label position={[timeScale/2 + 1.2, line.amp * ampScale + 0.3, line.z]} text={line.label} color={line.color} bold />

          {/* Depth Guide Line (Connecting 0 to Wall) */}
          <SafeLine 
            points={[
              new THREE.Vector3(-timeScale/2, 0, line.z),
              new THREE.Vector3(timeScale/2, 0, line.z)
            ]}
            color={line.color}
            lineWidth={0.5}
            opacity={0.15}
          />
        </group>
      ))}

      {/* Axis Information */}
      <Label position={[0, -1.5, 0]} text="TIME DOMAIN" color="#64748b" bold />
      
      <group position={[timeScale/2 + 4, 2.5, maxZ / 2]}>
         <Label position={[0,0,0]} text="MAGNITUDE SPECTRUM (FREQUENCY DOMAIN)" color="#f43f5e" bold />
      </group>

      {/* Frequency Scale Markers */}
      {[0, 0.25, 0.5, 0.75, 1.0].map((perc) => (
        <group key={perc} position={[timeScale/2 + 0.5, -0.4, perc * maxZ]}>
            <SafeLine points={[new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0.3, 0, 0)]} color="#ef4444" lineWidth={2} />
            <Label position={[1, 0, 0]} text={`${Math.round(perc * nyquist)}Hz`} color="#94a3b8" />
        </group>
      ))}

      <Grid />
      <OrbitControls makeDefault minDistance={5} maxDistance={40} target={[0, 1, maxZ/3]} />
    </>
  );
};

const Visualizer3D: React.FC<Visualizer3DProps> = ({ signal, components }) => {
  return (
    <div className="w-full h-full min-h-[400px] relative cursor-move bg-slate-950 flex flex-col">
      <div className="flex-1 relative">
        <Canvas shadows camera={{ position: [16, 12, 16], fov: 40 }} gl={{ antialias: true }}>
          <SceneContent signal={signal} components={components} />
        </Canvas>
      </div>
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 text-[10px] text-slate-300 shadow-2xl">
          <p className="font-bold text-blue-400 mb-3 uppercase tracking-wider text-xs border-b border-slate-800 pb-2">3D DFT EXPLORER</p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"></span>
              <span className="font-bold">Original Signal (Z = 0)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                  <span className="w-4 h-1 rounded-full bg-red-500"></span>
                  <span className="font-bold text-red-400">Magnitude Spectrum (Wall)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-0.5 rounded-full bg-emerald-400 opacity-40"></span>
                  <span className="text-slate-400 italic">Harmonic Projections</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur p-2 px-3 rounded-lg border border-slate-700/30 text-[10px] text-slate-500 font-bold flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          ROTATE TO ALIGN WITH FRONT OR SIDE VIEWS
        </div>
      </div>
    </div>
  );
};

export default Visualizer3D;
