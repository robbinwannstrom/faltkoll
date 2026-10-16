import React, { useState, useRef, useEffect } from 'react';
import { MomentDefinition, MomentRecord } from '../types';
import {
  X,
  PenTool,
  Check,
  RotateCcw,
  Eraser,
  Calendar,
  User,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface MomentSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  moment: MomentDefinition | null;
  record?: MomentRecord;
  defaultSignerName?: string;
  onSaveSignature: (
    momentId: string,
    signerName: string,
    signatureImage: string
  ) => void;
  onClearApproval?: (momentId: string) => void;
}

export const MomentSignatureModal: React.FC<MomentSignatureModalProps> = ({
  isOpen,
  onClose,
  moment,
  record,
  defaultSignerName = '',
  onSaveSignature,
  onClearApproval,
}) => {
  const [signerName, setSignerName] = useState(defaultSignerName || 'Kontrollant');
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Initialize or reset when moment changes
  useEffect(() => {
    if (isOpen && moment) {
      setSignerName(record?.signature?.split('[')[0]?.trim() || defaultSignerName || 'Kontrollant');
      setHasDrawn(false);

      // Pre-load existing signature if canvas exists
      const timer = setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // If existing signatureImage, draw it as backdrop
        if (record?.signatureImage) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasDrawn(true);
          };
          img.src = record.signatureImage;
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isOpen, moment, record, defaultSignerName]);

  if (!isOpen || !moment) return null;

  // Drawing helpers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#f97316'; // Orange construction pen color
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const signatureImage = canvas && hasDrawn ? canvas.toDataURL('image/png') : (record?.signatureImage || '');
    const cleanName = signerName.trim() || 'Kontrollant';
    onSaveSignature(moment.id, cleanName, signatureImage);
    onClose();
  };

  const isApproved = record?.status === 'GREEN';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] border border-[#2c2c2c] rounded-2xl max-w-lg w-full flex flex-col shadow-2xl text-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#242424] bg-[#181818] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <PenTool className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                Signera & Godkänn moment {moment.id}
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px] sm:max-w-xs">
                {moment.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#222] hover:bg-[#2c2c2c] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 flex-1">
          {/* Namn på kontrollant */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-400" />
              <span>Namn på den som godkänner & signerar:</span>
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="T.ex. Erik Johansson eller Johan E"
              className="w-full min-h-[42px] px-3.5 bg-[#1a1a1a] border border-[#333] focus:border-orange-500 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
            />
          </div>

          {/* Rityta för namnteckning med fingret */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-orange-400" />
                <span>Skriv din namnteckning med fingret:</span>
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Eraser className="w-3 h-3" />
                <span>Rensa rutan</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-[#383838] focus-within:border-orange-500 rounded-xl bg-[#0d0d0d] relative overflow-hidden">
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                className="w-full h-[150px] sm:h-[160px] touch-none cursor-crosshair block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && !record?.signatureImage && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-600 font-mono text-xs select-none">
                  ✍️ Dra med fingret här för att signera
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              Namnteckningen sparas med tidsstämpel och skrivs ut i den juridiska rapporten.
            </p>
          </div>

          {/* Om momentet redan är godkänt: Info om nuvarande status */}
          {isApproved && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-emerald-300 block truncate">
                    Momentet är för närvarande godkänt
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {record.completedAt || 'Tidigare registrerat'}
                  </span>
                </div>
              </div>
              {onClearApproval && (
                <button
                  type="button"
                  onClick={() => {
                    onClearApproval(moment.id);
                    onClose();
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline font-bold shrink-0 cursor-pointer"
                >
                  Ångra godkännande
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#222] bg-[#161616] flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Avbryt
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="min-h-[44px] px-6 rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 transition-all flex-1 sm:flex-initial"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Spara & Godkänn moment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
