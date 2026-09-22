'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Barcode, Check } from 'lucide-react';

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function CameraScannerModal({ onScan, onClose }: Props) {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          setCameraActive(true);
        }
      })
      .catch((err) => {
        console.warn('Camera access error:', err);
        setCameraError('Camera access not granted or not available on this device. You can type or paste barcode below.');
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScan(manualCode.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white  border border-slate-200  rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200  flex items-center justify-between bg-slate-50 ">
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 ">
              Camera Barcode Scanner
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 "
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Camera Viewport */}
          <div className="relative w-full h-48 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-sky-500/50">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            {/* Red aiming line animation */}
            <div className="absolute inset-x-4 top-1/2 h-0.5 bg-rose-500 shadow-lg shadow-rose-500/50 animate-pulse pointer-events-none" />
            
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 p-4 flex flex-col items-center justify-center text-center">
                <Barcode className="w-10 h-10 text-slate-500 mb-2 stroke-1" />
                <p className="text-xs text-slate-300">{cameraError}</p>
              </div>
            )}
          </div>

          {/* Quick Manual / Test Barcode Input */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 ">
              Enter Barcode manually or paste:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                autoFocus
                placeholder="e.g. 9310047201389"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50  text-slate-900  focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Scan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
