import React, { useState, useRef, useEffect, useCallback } from 'react';

// =============================================================================
// NATIVE ANNOTATION EDITOR - Zero Dependencies
// =============================================================================
// Replaces Konva-based editor with native Canvas API
// Simpler, lighter, multi-tenant ready
// =============================================================================

type Tool = 'freehand' | 'arrow' | 'rectangle' | 'circle' | 'text';

interface Point { x: number; y: number; }

interface BaseShape {
    id: string;
    type: Tool;
    color: string;
}

interface FreehandShape extends BaseShape {
    type: 'freehand';
    points: Point[];
}

interface ArrowShape extends BaseShape {
    type: 'arrow';
    start: Point;
    end: Point;
}

interface RectShape extends BaseShape {
    type: 'rectangle';
    start: Point;
    end: Point;
}

interface CircleShape extends BaseShape {
    type: 'circle';
    center: Point;
    radius: number;
}

interface TextShape extends BaseShape {
    type: 'text';
    position: Point;
    text: string;
}

type Shape = FreehandShape | ArrowShape | RectShape | CircleShape | TextShape;

interface NativeAnnotationEditorProps {
    file: File;
    onClose: () => void;
    onSend: (file: File, caption: string) => void;
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#FFFFFF'];
const LINE_WIDTH = 4;
const FONT_SIZE = 24;

const NativeAnnotationEditor: React.FC<NativeAnnotationEditorProps> = ({ file, onClose, onSend }) => {
    // State
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [tool, setTool] = useState<Tool>('freehand');
    const [color, setColor] = useState(COLORS[0]);
    const [caption, setCaption] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
    const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load image from file
    useEffect(() => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            setBackgroundImage(img);
            URL.revokeObjectURL(url);
        };
        
        img.onerror = () => {
            console.error('Failed to load image');
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
        
        return () => URL.revokeObjectURL(url);
    }, [file]);

    // Calculate canvas size and image fit
    useEffect(() => {
        if (!containerRef.current || !backgroundImage) return;

        const updateSize = () => {
            const container = containerRef.current;
            if (!container) return;

            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // Calculate scale to fit image in container (contain mode)
            const scaleX = containerWidth / backgroundImage.naturalWidth;
            const scaleY = containerHeight / backgroundImage.naturalHeight;
            const fitScale = Math.min(scaleX, scaleY, 1); // Don't upscale
            
            const displayWidth = backgroundImage.naturalWidth * fitScale;
            const displayHeight = backgroundImage.naturalHeight * fitScale;
            
            // Center the image
            const offsetX = (containerWidth - displayWidth) / 2;
            const offsetY = (containerHeight - displayHeight) / 2;

            setCanvasSize({ width: containerWidth, height: containerHeight });
            setImageDisplaySize({ width: displayWidth, height: displayHeight });
            setImageOffset({ x: offsetX, y: offsetY });
            setScale(fitScale);
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [backgroundImage]);

    // Render canvas
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !backgroundImage) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background (dark)
        ctx.fillStyle = '#101010';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image centered
        ctx.drawImage(
            backgroundImage,
            imageOffset.x,
            imageOffset.y,
            imageDisplaySize.width,
            imageDisplaySize.height
        );

        // Draw all shapes
        const allShapes = currentShape ? [...shapes, currentShape] : shapes;
        allShapes.forEach(shape => drawShape(ctx, shape));
    }, [backgroundImage, shapes, currentShape, imageOffset, imageDisplaySize]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // Draw a single shape
    const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = shape.color;
        ctx.lineWidth = LINE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (shape.type) {
            case 'freehand': {
                const s = shape as FreehandShape;
                if (s.points.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(s.points[0].x, s.points[0].y);
                for (let i = 1; i < s.points.length; i++) {
                    ctx.lineTo(s.points[i].x, s.points[i].y);
                }
                ctx.stroke();
                break;
            }
            case 'arrow': {
                const s = shape as ArrowShape;
                drawArrow(ctx, s.start, s.end, shape.color);
                break;
            }
            case 'rectangle': {
                const s = shape as RectShape;
                const x = Math.min(s.start.x, s.end.x);
                const y = Math.min(s.start.y, s.end.y);
                const w = Math.abs(s.end.x - s.start.x);
                const h = Math.abs(s.end.y - s.start.y);
                ctx.strokeRect(x, y, w, h);
                break;
            }
            case 'circle': {
                const s = shape as CircleShape;
                ctx.beginPath();
                ctx.arc(s.center.x, s.center.y, s.radius, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            }
            case 'text': {
                const s = shape as TextShape;
                ctx.font = `bold ${FONT_SIZE}px Arial`;
                ctx.fillText(s.text, s.position.x, s.position.y);
                break;
            }
        }
    };

    // Draw arrow with head
    const drawArrow = (ctx: CanvasRenderingContext2D, start: Point, end: Point, color: string) => {
        const headLength = 15;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = LINE_WIDTH;

        // Line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    };

    // Get canvas coordinates from event
    const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX: number, clientY: number;
        if ('touches' in e) {
            clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
            clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    // Mouse/Touch handlers
    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const point = getCanvasPoint(e);

        if (tool === 'text') {
            const text = prompt('Texte à ajouter:');
            if (text && text.trim()) {
                const newShape: TextShape = {
                    id: Date.now().toString(),
                    type: 'text',
                    color,
                    position: point,
                    text: text.trim()
                };
                setShapes(prev => [...prev, newShape]);
            }
            return;
        }

        setIsDrawing(true);

        const id = Date.now().toString();
        let newShape: Shape;

        switch (tool) {
            case 'freehand':
                newShape = { id, type: 'freehand', color, points: [point] };
                break;
            case 'arrow':
                newShape = { id, type: 'arrow', color, start: point, end: point };
                break;
            case 'rectangle':
                newShape = { id, type: 'rectangle', color, start: point, end: point };
                break;
            case 'circle':
                newShape = { id, type: 'circle', color, center: point, radius: 0 };
                break;
            default:
                return;
        }

        setCurrentShape(newShape);
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !currentShape) return;
        e.preventDefault();

        const point = getCanvasPoint(e);

        setCurrentShape(prev => {
            if (!prev) return null;

            switch (prev.type) {
                case 'freehand':
                    return { ...prev, points: [...(prev as FreehandShape).points, point] };
                case 'arrow':
                    return { ...prev, end: point };
                case 'rectangle':
                    return { ...prev, end: point };
                case 'circle': {
                    const p = prev as CircleShape;
                    const dx = point.x - p.center.x;
                    const dy = point.y - p.center.y;
                    return { ...prev, radius: Math.sqrt(dx * dx + dy * dy) };
                }
                default:
                    return prev;
            }
        });
    };

    const handlePointerUp = () => {
        if (currentShape) {
            // Only add shape if it has substance
            let shouldAdd = true;
            if (currentShape.type === 'freehand') {
                shouldAdd = (currentShape as FreehandShape).points.length > 2;
            } else if (currentShape.type === 'circle') {
                shouldAdd = (currentShape as CircleShape).radius > 5;
            } else if (currentShape.type === 'rectangle' || currentShape.type === 'arrow') {
                const s = currentShape as RectShape | ArrowShape;
                const dist = Math.sqrt(
                    Math.pow(s.end.x - s.start.x, 2) + Math.pow(s.end.y - s.start.y, 2)
                );
                shouldAdd = dist > 5;
            }

            if (shouldAdd) {
                setShapes(prev => [...prev, currentShape]);
            }
        }
        setIsDrawing(false);
        setCurrentShape(null);
    };

    // Undo last shape
    const handleUndo = () => {
        setShapes(prev => prev.slice(0, -1));
    };

    // Clear all
    const handleClear = () => {
        if (shapes.length === 0) return;
        if (confirm('Effacer toutes les annotations?')) {
            setShapes([]);
        }
    };

    // Export and send
    const handleExport = () => {
        if (!canvasRef.current || !backgroundImage) return;

        // Create export canvas at original image resolution
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = backgroundImage.naturalWidth;
        exportCanvas.height = backgroundImage.naturalHeight;
        const exportCtx = exportCanvas.getContext('2d');
        if (!exportCtx) return;

        // Draw original image
        exportCtx.drawImage(backgroundImage, 0, 0);

        // Calculate scale factor from display to original
        const exportScale = backgroundImage.naturalWidth / imageDisplaySize.width;

        // Draw shapes scaled to original resolution
        shapes.forEach(shape => {
            const scaledShape = scaleShapeForExport(shape, exportScale);
            drawShape(exportCtx, scaledShape);
        });

        // Convert to blob and send
        exportCanvas.toBlob(
            (blob) => {
                if (blob) {
                    const exportedFile = new File([blob], 'annotated_image.jpg', { type: 'image/jpeg' });
                    onSend(exportedFile, caption);
                }
            },
            'image/jpeg',
            0.85
        );
    };

    // Scale shape coordinates for export
    const scaleShapeForExport = (shape: Shape, scaleFactor: number): Shape => {
        const scalePoint = (p: Point): Point => ({
            x: (p.x - imageOffset.x) * scaleFactor,
            y: (p.y - imageOffset.y) * scaleFactor
        });

        switch (shape.type) {
            case 'freehand':
                return {
                    ...shape,
                    points: (shape as FreehandShape).points.map(scalePoint)
                } as FreehandShape;
            case 'arrow':
            case 'rectangle':
                return {
                    ...shape,
                    start: scalePoint((shape as ArrowShape).start),
                    end: scalePoint((shape as ArrowShape).end)
                } as ArrowShape | RectShape;
            case 'circle': {
                const c = shape as CircleShape;
                return {
                    ...shape,
                    center: scalePoint(c.center),
                    radius: c.radius * scaleFactor
                } as CircleShape;
            }
            case 'text': {
                const t = shape as TextShape;
                return {
                    ...shape,
                    position: scalePoint(t.position)
                } as TextShape;
            }
            default:
                return shape;
        }
    };

    // Close with confirmation
    const handleClose = () => {
        if (shapes.length > 0) {
            if (confirm('Quitter sans envoyer?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {/* Header */}
            <div className="bg-black/80 backdrop-blur-md border-b border-white/10 p-3 flex items-center justify-between flex-shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleClose} 
                        className="text-white hover:text-red-400 px-3 py-2 bg-white/10 rounded-xl font-bold text-sm"
                    >
                        <i className="fas fa-times mr-2"></i>Fermer
                    </button>
                    <span className="text-white/50 text-xs hidden sm:block">Éditeur d'annotations</span>
                </div>
                <button 
                    onClick={handleExport} 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl shadow-lg text-sm"
                >
                    ENVOYER <i className="fas fa-paper-plane ml-2"></i>
                </button>
            </div>

            {/* Canvas */}
            <div 
                ref={containerRef} 
                className="flex-1 overflow-hidden touch-none select-none"
                style={{ backgroundColor: '#101010' }}
            >
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                    className="cursor-crosshair"
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Caption Input */}
            <div className="bg-black/90 border-t border-white/10 p-2 px-4 z-20">
                <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ajouter une légende..."
                    className="w-full bg-white/10 text-white placeholder-gray-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
            </div>

            {/* Toolbar */}
            <div className="bg-black/90 border-t border-white/10 p-2 flex justify-center items-center gap-2 z-20 overflow-x-auto">
                <ToolButton icon="pencil-alt" active={tool === 'freehand'} onClick={() => setTool('freehand')} title="Crayon" />
                <ToolButton icon="long-arrow-alt-right" active={tool === 'arrow'} onClick={() => setTool('arrow')} title="Flèche" />
                <ToolButton icon="square" active={tool === 'rectangle'} onClick={() => setTool('rectangle')} title="Rectangle" far />
                <ToolButton icon="circle" active={tool === 'circle'} onClick={() => setTool('circle')} title="Cercle" far />
                <ToolButton icon="font" active={tool === 'text'} onClick={() => setTool('text')} title="Texte" />
                
                <div className="w-px h-8 bg-white/20 mx-2" />
                
                <button 
                    onClick={handleUndo} 
                    disabled={shapes.length === 0}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Annuler"
                >
                    <i className="fas fa-undo"></i>
                </button>
                <button 
                    onClick={handleClear}
                    disabled={shapes.length === 0}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Tout effacer"
                >
                    <i className="fas fa-trash-alt"></i>
                </button>
            </div>

            {/* Colors */}
            <div className="bg-black/80 border-t border-white/5 p-3 flex justify-center items-center gap-3 z-20 safe-area-bottom">
                {COLORS.map(c => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-9 h-9 rounded-full border-4 transition-transform ${
                            color === c 
                                ? 'border-white scale-110 shadow-xl' 
                                : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
            </div>
        </div>
    );
};

// Tool button component
const ToolButton = ({ 
    icon, 
    active, 
    onClick, 
    title, 
    far = false 
}: { 
    icon: string; 
    active: boolean; 
    onClick: () => void; 
    title: string;
    far?: boolean;
}) => (
    <button
        onClick={onClick}
        className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${
            active 
                ? 'bg-white text-black scale-105 shadow-lg' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
        }`}
        title={title}
    >
        <i className={`${far ? 'far' : 'fas'} fa-${icon}`}></i>
    </button>
);

export default NativeAnnotationEditor;
