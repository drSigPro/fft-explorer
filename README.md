# FFT Explorer: 3D Fourier Transform Visualizer

**FFT Explorer** is an interactive, educational tool designed to visualize the Fast Fourier Transform (FFT) in a 3D space. It helps students, educators, and curious minds understand how time-domain signals are decomposed into frequency components.

## 🚀 Features

*   **3D Visualization**: Explore signals in a 3D environment where:
    *   **X-axis**: Time
    *   **Y-axis**: Amplitude
    *   **Z-axis**: Frequency bins
*   **Interactive Signal Input**:
    *   **Draw Mode**: Sketch any waveform directly onto the canvas.
    *   **Equation Mode**: Define signals using JavaScript math expressions (e.g., `Math.sin(2 * Math.PI * x) + Math.random()`).
    *   **Numbers Mode**: Input raw comma-separated values to visualize specific datasets.
*   **Dynamic Resolution**: Adjust sampling resolution from 32 up to 512 points to see how sampling affects the frequency spectrum.
*   **Educational "The Process" Tab**: A guided breakdown of the FFT algorithm steps:
    1.  **Correlation**: Matching the signal with pure sine waves.
    2.  **Binning**: Sorting results into frequency bins.
    3.  **Magnitude**: Calculating the power of each component.
*   **Real-time Feedback**: Instant updates to the 3D visualizer and spectrum analysis as you modify the input signal.

## 🛠️ Technology Stack

*   **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **3D Graphics**: [Three.js](https://threejs.org/), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Drei](https://github.com/pmndrs/drei)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 💻 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (Latest LTS recommended)

### Installation

1.  Clone the repository (if applicable) or download the source.
2.  Install dependencies:

    ```bash
    npm install
    ```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to the URL provided (usually `http://localhost:5173`).

### Building for Production

To create a production-ready build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## 🎮 Usage Guide

1.  **Select an Input Mode** (Sidebar):
    *   Use **Draw** to experiment with freehand waves.
    *   Use **Equation** to see precise mathematical waveforms (try combining multiple sine waves!).
2.  **Adjust Resolution**: Change the "Resolution Points" to see how the smoothness of the wave and the number of frequency bins change.
3.  **Explore 3D**:
    *   **Rotate**: Left-click and drag.
    *   **Zoom**: Scroll wheel.
    *   **Pan**: Right-click and drag.
4.  **View Spectrum**: Check the "Spectrum Magnitude" chart in the sidebar for a 2D view of the frequency peaks.
