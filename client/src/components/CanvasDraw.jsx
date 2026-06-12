// client/src/components/CanvasDraw.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Edit2, Eraser, Circle } from 'lucide-react';

export default function CanvasDraw({ isActive, onDrawingStateChange }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ef4444'); // Default red
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const colors = [
    { value: '#ef4444', name: 'Red' },
    { value: '#3b82f6', name: 'Blue' },
    { value: '#10b981', name: 'Green' },
    { value: '#eab308', name: 'Yellow' }
  ];

  // Set up the canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI screens
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    // Redraw context settings if they change
    updateContextSettings();

    // Resize listener
    const handleResize = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);

      const newRect = canvas.getBoundingClientRect();
      canvas.width = newRect.width * 2;
      canvas.height = newRect.height * 2;
      canvas.style.width = `${newRect.width}px`;
      canvas.style.height = `${newRect.height}px`;

      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, newRect.width, newRect.height);
      updateContextSettings();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync brush properties with canvas context
  useEffect(() => {
    updateContextSettings();
  }, [color, brushSize, isEraser]);

  const updateContextSettings = () => {
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = isEraser ? '#000000' : color;
    contextRef.current.lineWidth = brushSize;
    // If eraser, we can also use destination-out composition to make it truly transparent
    contextRef.current.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Support mouse and touch events
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e) => {
    if (!isActive) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    if (onDrawingStateChange) onDrawingStateChange(true);
  };

  const draw = (e) => {
    if (!isDrawing || !isActive) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    setIsDrawing(false);
    if (onDrawingStateChange) onDrawingStateChange(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="slide-canvas-draw"
        style={{
          pointerEvents: isActive ? 'auto' : 'none',
          cursor: isActive ? (isEraser ? 'cell' : 'crosshair') : 'default'
        }}
      />

      {isActive && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.85)',
            border: '1px solid #333',
            borderRadius: '16px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 100,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}
        >
          {/* Colors */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setColor(c.value);
                  setIsEraser(false);
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: c.value,
                  border: color === c.value && !isEraser ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                  transition: 'transform 0.15s ease',
                  transform: color === c.value && !isEraser ? 'scale(1.2)' : 'scale(1)'
                }}
                title={c.name}
              />
            ))}
          </div>

          <div style={{ width: '1px', height: '24px', background: '#333' }} />

          {/* Toggle Eraser */}
          <button
            onClick={() => setIsEraser(!isEraser)}
            style={{
              color: isEraser ? '#10b981' : '#fff',
              background: isEraser ? 'rgba(16, 185, 129, 0.15)' : 'none',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Eraser"
          >
            <Eraser size={18} />
          </button>

          {/* Clear Button */}
          <button
            onClick={clearCanvas}
            style={{
              color: '#ef4444',
              background: 'none',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Clear All Drawings"
          >
            <Trash2 size={18} />
          </button>

          <div style={{ width: '1px', height: '24px', background: '#333' }} />

          {/* Brush Sizes */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[2, 4, 8].map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                style={{
                  color: brushSize === size ? '#10b981' : '#888',
                  background: 'none',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Circle size={size * 1.5 + 4} fill={brushSize === size ? '#10b981' : 'none'} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
