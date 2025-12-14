import React, { useState } from 'react';
import { getRetentionInfo } from '../utils';

const ImageViewer = ({ src, createdAt, onClose, onDelete, onDownload, onAnnotate, canDelete }: { src: string, createdAt?: string, onClose: () => void, onDelete?: () => void, onDownload: () => void, onAnnotate: () => void, canDelete?: boolean }) => {
    const retention = createdAt ? getRetentionInfo(createdAt) : null;
    
    // État pour le Zoom et Pan
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        // Zoom avec la molette
        e.stopPropagation();
        const delta = e.deltaY * -0.005;
        const newScale = Math.min(Math.max(1, scale + delta), 5); // Max zoom 5x
        setScale(newScale);
        if (newScale === 1) setPosition({ x: 0, y: 0 });
    };

    const toggleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (scale > 1) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        } else {
            setScale(2.5); // Zoom rapide
        }
    };

    // Gestion du déplacement (Pan) - Souris
    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            // Pas de preventDefault ici pour laisser passer le double-clic
            e.stopPropagation();
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            e.preventDefault();
            e.stopPropagation();
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Gestion du déplacement (Pan) - Touch (Mobile)
    const handleTouchStart = (e: React.TouchEvent) => {
        if (scale > 1 && e.touches.length === 1) {
            e.stopPropagation();
            setIsDragging(true);
            setStartPos({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && scale > 1 && e.touches.length === 1) {
            e.stopPropagation();
            setPosition({
                x: e.touches[0].clientX - startPos.x,
                y: e.touches[0].clientY - startPos.y
            });
        }
    };

    const handleTouchEnd = () => setIsDragging(false);

    return (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col animate-fade-in select-none overflow-hidden" 
            onClick={onClose}
            onWheel={handleWheel}
        >
            <div className="absolute top-6 right-6 flex gap-3 z-50">
                <button 
                    onClick={(e) => { e.stopPropagation(); onAnnotate(); }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-white text-emerald-400 flex items-center justify-center transition-all border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] group"
                    title="Annoter cette image"
                >
                    <i className="fas fa-pen text-lg group-hover:scale-110 transition-transform"></i>
                </button>

                <button 
                    onClick={(e) => { e.stopPropagation(); onDownload(); }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-white text-emerald-400 flex items-center justify-center transition-all border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] group"
                    title="Télécharger l'image"
                >
                    <i className="fas fa-download text-lg group-hover:scale-110 transition-transform"></i>
                </button>

                {canDelete && onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] group"
                        title="Supprimer cette image"
                    >
                        <i className="fas fa-trash-alt text-lg group-hover:scale-110 transition-transform"></i>
                    </button>
                )}
                
                <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10 ml-2">
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>

            <div 
                className="flex-1 flex items-center justify-center relative w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img 
                    src={src} 
                    alt="Full view" 
                    className={`max-h-full max-w-full object-contain transition-transform duration-100 ease-out ${scale === 1 ? 'cursor-zoom-in' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
                    style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}
                    onClick={(e) => e.stopPropagation()} 
                    onDoubleClick={toggleZoom}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onDragStart={(e) => e.preventDefault()} // Empêche le drag natif
                />
                
                {/* Information de rétention - Masquée si zoomé pour pas gêner */}
                {retention && scale === 1 && (
                    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full border flex items-center gap-2 pointer-events-none backdrop-blur-md shadow-lg ${retention.bg} ${retention.border}`}>
                        <i className={`fas ${retention.icon} ${retention.color} text-xs`}></i>
                        <span className={`${retention.color} text-[10px] font-bold uppercase tracking-widest`}>{retention.text}</span>
                    </div>
                )}

                {/* Indication visuelle de zoom */}
                {scale === 1 && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/30 text-[9px] uppercase font-bold tracking-widest pointer-events-none animate-pulse">
                        Double-clic pour zoomer
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageViewer;
