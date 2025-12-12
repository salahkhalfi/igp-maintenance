import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Circle, Arrow, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

// --- TYPES ---
export type Tool = 'select' | 'freehand' | 'arrow' | 'rectangle' | 'circle' | 'text';

interface AnnotationEditorProps {
    file: File;
    onClose: () => void;
    onSend: (file: File, caption: string) => void;
}

interface BaseShape {
    id: string;
    type: Tool;
    color: string;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    x?: number;
    y?: number;
}

interface FreehandShape extends BaseShape {
    type: 'freehand';
    points: number[];
}

interface RectShape extends BaseShape {
    type: 'rectangle';
    width: number;
    height: number;
}

interface CircleShape extends BaseShape {
    type: 'circle';
    radiusX: number;
    radiusY: number;
}

interface ArrowShape extends BaseShape {
    type: 'arrow';
    points: number[];
}

interface TextShape extends BaseShape {
    type: 'text';
    text: string;
    fontSize: number;
}

type ShapeObj = FreehandShape | RectShape | CircleShape | ArrowShape | TextShape;

// --- COMPONENT ---
const AnnotationEditor: React.FC<AnnotationEditorProps> = ({ file, onClose, onSend }) => {
    // Canvas State
    const [imageUrl, setImageUrl] = useState<string>('');
    const [imageObj] = useImage(imageUrl);
    
    useEffect(() => {
        // Create URL only once when file changes
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        return () => URL.revokeObjectURL(url); // Cleanup
    }, [file]);

    const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [shapes, setShapes] = useState<ShapeObj[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    
    // Tools State
    const [tool, setTool] = useState<Tool>('select');
    const [color, setColor] = useState('#EF4444'); // Default Red
    const isDrawing = useRef(false);
    
    // Refs
    const stageRef = useRef<Konva.Stage>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- RESIZE LOGIC ---
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setStageSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Init
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- TRANSFORMER LOGIC ---
    useEffect(() => {
        if (selectedId && transformerRef.current && stageRef.current) {
            const node = stageRef.current.findOne('#' + selectedId);
            if (node) {
                transformerRef.current.nodes([node]);
                transformerRef.current.getLayer()?.batchDraw();
            }
        } else {
            transformerRef.current?.nodes([]);
        }
    }, [selectedId, shapes]);

    // --- IMAGE RATIO LOGIC ---
    const [imageProps, setImageProps] = useState({ x: 0, y: 0, width: 0, height: 0, scale: 1 });

    useEffect(() => {
        if (imageObj && stageSize.width > 0 && stageSize.height > 0) {
            const scaleX = stageSize.width / imageObj.naturalWidth;
            const scaleY = stageSize.height / imageObj.naturalHeight;
            const scale = Math.min(scaleX, scaleY); // Contain
            
            const width = imageObj.naturalWidth * scale;
            const height = imageObj.naturalHeight * scale;
            const x = (stageSize.width - width) / 2;
            const y = (stageSize.height - height) / 2;

            setImageProps({ x, y, width, height, scale });
        }
    }, [imageObj, stageSize]);

    // --- DRAWING HANDLERS ---
    const getRelativePointerPos = (e: Konva.KonvaEventObject<any>) => {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return null;
        // Convert screen coords to "image relative" coords ?
        // Actually, simplest is to draw on stage coords and just keep them layered on top.
        // But for export, we might want to crop to image area.
        return pos;
    };

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (tool === 'select') {
            if (e.target === e.target.getStage() || e.target.attrs.id === 'bg-image') {
                setSelectedId(null);
            }
            return;
        }

        isDrawing.current = true;
        const pos = e.target.getStage()?.getRelativePointerPosition();
        if (!pos) return;

        const id = Date.now().toString();
        // ... (rest is fine)

        if (tool === 'freehand') {
            const newShape: FreehandShape = {
                id, type: 'freehand', color, points: [pos.x, pos.y],
            };
            setShapes([...shapes, newShape]);
        } else if (tool === 'rectangle') {
            const newShape: RectShape = {
                id, type: 'rectangle', color, x: pos.x, y: pos.y, width: 0, height: 0
            };
            setShapes([...shapes, newShape]);
        } else if (tool === 'circle') {
            const newShape: CircleShape = {
                id, type: 'circle', color, x: pos.x, y: pos.y, radiusX: 0, radiusY: 0
            };
            setShapes([...shapes, newShape]);
        } else if (tool === 'arrow') {
            const newShape: ArrowShape = {
                id, type: 'arrow', color, points: [pos.x, pos.y, pos.x, pos.y]
            };
            setShapes([...shapes, newShape]);
        } else if (tool === 'text') {
            const text = prompt("Texte :");
            if (text) {
                const newShape: TextShape = {
                    id, type: 'text', color, x: pos.x, y: pos.y, text, fontSize: 30
                };
                setShapes([...shapes, newShape]);
                setTool('select'); // Switch back to select after text
                setSelectedId(id);
            }
            isDrawing.current = false;
        }
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (!isDrawing.current || tool === 'select' || tool === 'text') return;

        const stage = e.target.getStage();
        const pos = stage?.getRelativePointerPosition();
        if (!pos) return;

        const lastShape = shapes[shapes.length - 1];
        if (!lastShape) return;

        if (tool === 'freehand') {
            const s = lastShape as FreehandShape;
            s.points = s.points.concat([pos.x, pos.y]);
            setShapes(shapes.slice(0, -1).concat(s));
        } else if (tool === 'rectangle') {
            const s = lastShape as RectShape;
            s.width = pos.x - (s.x || 0);
            s.height = pos.y - (s.y || 0);
            setShapes(shapes.slice(0, -1).concat(s));
        } else if (tool === 'circle') {
            const s = lastShape as CircleShape;
            const dx = pos.x - (s.x || 0);
            const dy = pos.y - (s.y || 0);
            s.radiusX = Math.abs(dx);
            s.radiusY = Math.abs(dy);
            setShapes(shapes.slice(0, -1).concat(s));
        } else if (tool === 'arrow') {
            const s = lastShape as ArrowShape;
            s.points = [s.points[0], s.points[1], pos.x, pos.y];
            setShapes(shapes.slice(0, -1).concat(s));
        }
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
        if (tool !== 'select' && tool !== 'text') {
            // Auto-switch to select if desired, or stay in tool. 
            // Current app stays in tool. Let's stay in tool.
            
            // If we just created a shape, select it? 
            // Maybe confusing if we want to draw multiple lines. 
            // Let's NOT auto-select for drawing tools.
        }
    };

    // --- ACTIONS ---
    const handleUndo = () => setShapes(shapes.slice(0, -1));

    const handleColorChange = (newColor: string) => {
        setColor(newColor);
        if (selectedId) {
            setShapes(shapes.map(s => s.id === selectedId ? { ...s, color: newColor } : s));
        }
    };
    
    const handleClear = () => {
        if (selectedId) {
            setShapes(shapes.filter(s => s.id !== selectedId));
            setSelectedId(null);
        } else {
            if (confirm("Tout effacer ?")) setShapes([]);
        }
    };

    const [caption, setCaption] = useState('');

    const handleExport = async () => {
        if (!stageRef.current) return;
        
        // Deselect before export
        setSelectedId(null);
        
        // Wait for render cycle
        setTimeout(() => {
            if (!stageRef.current) return;
            
            // CROP to image area and scale to native resolution
            const crop = {
                x: imageProps.x,
                y: imageProps.y,
                width: imageProps.width,
                height: imageProps.height
            };
            
            // Scale factor to restore native resolution
            // If image is displayed at 500px but native is 2000px, scale is 4
            const pixelRatio = imageObj ? (imageObj.naturalWidth / imageProps.width) : 1;

            const dataURL = stageRef.current.toDataURL({
                x: crop.x,
                y: crop.y,
                width: crop.width,
                height: crop.height,
                pixelRatio: pixelRatio, 
                mimeType: 'image/jpeg',
                quality: 0.85
            });

            // Convert to File
            fetch(dataURL)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "annotated_image.jpg", { type: "image/jpeg" });
                    onSend(file, caption);
                });
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
             {/* Header */}
             <div className="bg-black/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between flex-shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-white hover:text-red-400 px-3 py-2 bg-white/10 rounded-xl font-bold">
                        <i className="fas fa-times text-lg mr-2"></i>Fermer
                    </button>
                    <h3 className="text-white font-bold hidden lg:block">Éditeur (Beta Konva)</h3>
                </div>
                <button onClick={handleExport} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg">
                    ENVOYER <i className="fas fa-paper-plane ml-2"></i>
                </button>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 bg-[#101010] overflow-hidden flex items-center justify-center relative touch-none" ref={containerRef}>
                <Stage
                    width={stageSize.width}
                    height={stageSize.height}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchEnd={handleMouseUp}
                    ref={stageRef}
                >
                    <Layer>
                        {/* Background Image - fitted to stage */}
                        {imageObj && (
                            <KonvaImage
                                id="bg-image"
                                image={imageObj}
                                width={imageProps.width}
                                height={imageProps.height}
                                x={imageProps.x}
                                y={imageProps.y}
                                listening={false} // Don't steal clicks for drawing
                            />
                        )}
                        
                        {/* Shapes */}
                        {shapes.map((s, i) => {
                            const commonProps = {
                                key: s.id,
                                id: s.id,
                                stroke: s.color,
                                strokeWidth: 5,
                                draggable: tool === 'select',
                                onClick: () => tool === 'select' && setSelectedId(s.id),
                                onTap: () => tool === 'select' && setSelectedId(s.id),
                                onDragStart: () => setSelectedId(s.id),
                                onTransformEnd: (e: any) => {
                                    // Update shape state with new transform
                                    const node = e.target;
                                    // We need to update state to match node
                                    // Complex for array update, but needed for proper persistence
                                },
                            };

                            if (s.type === 'freehand') {
                                return <Line {...commonProps} points={(s as FreehandShape).points} tension={0.5} lineCap="round" lineJoin="round" />;
                            }
                            if (s.type === 'rectangle') {
                                return <Rect {...commonProps} x={s.x} y={s.y} width={(s as RectShape).width} height={(s as RectShape).height} />;
                            }
                            if (s.type === 'circle') {
                                return <Circle {...commonProps} x={s.x} y={s.y} radius={(s as CircleShape).radiusX} scaleX={1} scaleY={(s as CircleShape).radiusY / (s as CircleShape).radiusX} />;
                            }
                            if (s.type === 'arrow') {
                                return <Arrow {...commonProps} points={(s as ArrowShape).points} pointerLength={20} pointerWidth={20} />;
                            }
                            if (s.type === 'text') {
                                return <Text {...commonProps} x={s.x} y={s.y} text={(s as TextShape).text} fontSize={(s as TextShape).fontSize} fill={s.color} strokeWidth={0} />;
                            }
                            return null;
                        })}

                        {/* Transformer (Selection Box) */}
                        <Transformer
                            ref={transformerRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                // Limit resize if needed
                                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                                return newBox;
                            }}
                            rotateEnabled={true}
                            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                        />
                    </Layer>
                </Stage>
            </div>

            {/* Caption Input */}
            <div className="bg-black/90 backdrop-blur-md border-t border-white/10 p-2 z-20 w-full px-4">
                <input 
                    type="text" 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ajouter une légende... (ex: Joint fissuré)"
                    className="w-full bg-white/10 text-white placeholder-gray-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            {/* Toolbar */}
            <div className="bg-black/90 backdrop-blur-md border-t border-white/10 p-2 flex justify-start md:justify-center items-center gap-2 overflow-x-auto z-20 w-full no-scrollbar px-4">
                 <ToolBtn icon="hand-paper" active={tool === 'select'} onClick={() => setTool('select')} />
                 <div className="w-px h-8 bg-white/10 mx-1" />
                 <ToolBtn icon="pencil-alt" active={tool === 'freehand'} onClick={() => setTool('freehand')} />
                 <ToolBtn icon="long-arrow-alt-right" active={tool === 'arrow'} onClick={() => setTool('arrow')} />
                 <ToolBtn icon="square" active={tool === 'rectangle'} isFar onClick={() => setTool('rectangle')} />
                 <ToolBtn icon="circle" active={tool === 'circle'} isFar onClick={() => setTool('circle')} />
                 <ToolBtn icon="font" active={tool === 'text'} onClick={() => setTool('text')} />
            </div>

            {/* Colors */}
             <div className="bg-black/80 backdrop-blur-md border-t border-white/5 p-4 flex justify-start md:justify-center items-center gap-3 md:gap-4 flex-shrink-0 z-20 overflow-x-auto safe-area-bottom w-full px-4 no-scrollbar">
                {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#FFFFFF'].map(c => (
                    <button key={c} onClick={() => handleColorChange(c)} className={`w-10 h-10 rounded-full border-4 transition-transform flex-shrink-0 ${color === c ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60'}`} style={{ backgroundColor: c }} />
                ))}
                <div className="w-px h-10 bg-white/20 mx-2 flex-shrink-0" />
                <button onClick={handleUndo} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"><i className="fas fa-undo"></i></button>
                <button onClick={handleClear} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/20"><i className={`fas ${selectedId ? 'fa-eraser' : 'fa-trash-alt'}`}></i></button>
            </div>
        </div>
    );
};

const ToolBtn = ({ icon, active, onClick, isFar }: any) => (
    <button onClick={onClick} className={`p-3 rounded-xl transition-all flex-shrink-0 ${active ? 'bg-white text-black scale-105 shadow-lg' : 'bg-white/10 text-gray-400'}`}>
        <i className={`${isFar ? 'far' : 'fas'} fa-${icon} text-xl`}></i>
    </button>
);

export default AnnotationEditor;
