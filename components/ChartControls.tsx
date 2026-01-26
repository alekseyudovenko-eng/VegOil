import React from 'react';

// SVG Icons
const ZoomInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
  </svg>
);

const PanLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

const PanRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5" />
  </svg>
);


interface ChartControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onReset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canPanLeft: boolean;
  canPanRight: boolean;
}

const ControlButton: React.FC<{ onClick: () => void; disabled: boolean; 'aria-label': string; children: React.ReactNode }> = ({ onClick, disabled, 'aria-label': ariaLabel, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className="p-2 rounded-md bg-light-secondary text-gray-600 hover:bg-light-tertiary hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
  >
    {children}
  </button>
);

const ChartControls: React.FC<ChartControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onPanLeft,
  onPanRight,
  onReset,
  canZoomIn,
  canZoomOut,
  canPanLeft,
  canPanRight,
}) => {
  return (
    <div className="flex items-center gap-1 bg-light-secondary p-1 rounded-lg">
      <ControlButton onClick={onPanLeft} disabled={!canPanLeft} aria-label="Pan Left"><PanLeftIcon /></ControlButton>
      <ControlButton onClick={onPanRight} disabled={!canPanRight} aria-label="Pan Right"><PanRightIcon /></ControlButton>
      <div className="w-px h-6 bg-light-tertiary mx-1"></div>
      <ControlButton onClick={onZoomIn} disabled={!canZoomIn} aria-label="Zoom In"><ZoomInIcon /></ControlButton>
      <ControlButton onClick={onZoomOut} disabled={!canZoomOut} aria-label="Zoom Out"><ZoomOutIcon /></ControlButton>
      <div className="w-px h-6 bg-light-tertiary mx-1"></div>
      <ControlButton onClick={onReset} disabled={false} aria-label="Reset View"><ResetIcon /></ControlButton>
    </div>
  );
};

export default ChartControls;