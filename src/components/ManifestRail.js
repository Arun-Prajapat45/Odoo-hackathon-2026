import React from 'react';

export default function ManifestRail({ source, destination, status, progress = 50 }) {
  // status can be: DRAFT, DISPATCHED, COMPLETED, CANCELLED
  const cleanStatus = status?.toUpperCase() || 'DRAFT';
  
  let lineClass = 'draft';
  let nodeProgress = 0;
  
  if (cleanStatus === 'DISPATCHED') {
    lineClass = 'dispatched';
    nodeProgress = progress;
  } else if (cleanStatus === 'COMPLETED') {
    lineClass = 'completed';
    nodeProgress = 100;
  } else if (cleanStatus === 'CANCELLED') {
    lineClass = 'cancelled';
    nodeProgress = 50;
  }

  return (
    <div className="manifest-rail">
      <span className="manifest-rail-label">{source || 'DEPOT'}</span>
      <div className="manifest-rail-line-container">
        <div className="manifest-rail-track" />
        <div 
          className={`manifest-rail-progress-line ${lineClass}`} 
          style={{ width: `${nodeProgress}%` }}
        />
        {cleanStatus !== 'CANCELLED' && (
          <div 
            className={`manifest-rail-node ${lineClass}`}
            style={{ left: `${nodeProgress}%` }}
          />
        )}
      </div>
      <span className="manifest-rail-label">{destination || 'DEPOT'}</span>
    </div>
  );
}
