import { useEffect, useRef, useState } from 'react';

export default function PrecisionGridOverlay({ active, theme, xOffset, onPointSelect }) {
    const containerRef = useRef(null);
    const [hoverPoint, setHoverPoint] = useState(null);
    const [selectedPoint, setSelectedPoint] = useState(null);

    useEffect(() => {
        if (active) {
            setSelectedPoint(null);
            setHoverPoint(null);
        }
    }, [active]);

    if (!active) return null;

    const calculateData = (clientX, clientY, rect) => {
        const width = rect.width;
        const height = rect.height;

        // 1. Raw relative position
        const rawX = clientX - rect.left;
        const rawY = clientY - rect.top;

        // 2. Convert to Meters (0-9m scale)
        const xMeters = (rawX / width) * 9.0;
        const yMeters = ((height - rawY) / height) * 9.0; // Inverted Y

        // 3. Snap to 0.3m (30cm) Grid
        const SNAP = 0.3;
        const xSnappedMeters = Math.round(xMeters / SNAP) * SNAP;
        const ySnappedMeters = Math.round(yMeters / SNAP) * SNAP;

        // 4. Convert back to Pixels for UI
        const xPx = (xSnappedMeters / 9.0) * width;
        const yPx = height - ((ySnappedMeters / 9.0) * height);

        // 5. Global Coordinate (0-18m)
        const globalX = xOffset + xSnappedMeters;

        return {
            uiSnapped: { x: xPx, y: yPx },
            data: { x: globalX.toFixed(2), y: ySnappedMeters.toFixed(2) }
        };
    };

    const handleMouseMove = (e) => {
        if (!containerRef.current || selectedPoint) return;
        const rect = containerRef.current.getBoundingClientRect();
        setHoverPoint({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseLeave = () => {
        setHoverPoint(null);
    };

    const handleClick = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const result = calculateData(e.clientX, e.clientY, rect);

        setSelectedPoint(result.uiSnapped);
        setHoverPoint(null);

        // Short delay for visual confirmation
        setTimeout(() => {
            onPointSelect(result.data);
        }, 200);
    };

    return (
        <div
            ref={containerRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="absolute inset-0 z-50 cursor-none select-none"
            style={{ touchAction: 'none' }}
        >
            {/* Background Grid Guide */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(${theme.hex} 1px, transparent 1px), linear-gradient(90deg, ${theme.hex} 1px, transparent 1px)`,
                    backgroundSize: '11.11% 11.11%'
                }}
            />

            {/* Smooth Hover Cursor */}
            {hoverPoint && !selectedPoint && (
                <div
                    className="absolute pointer-events-none transition-transform duration-75 ease-out z-40"
                    style={{ left: hoverPoint.x, top: hoverPoint.y }}
                >
                    <div className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border border-slate-900/20 bg-white/10 backdrop-blur-[1px]" />
                    <div className="absolute w-4 h-0.5 bg-slate-900/50 -ml-2 -mt-[1px]" />
                    <div className="absolute w-0.5 h-4 bg-slate-900/50 -ml-[1px] -mt-2" />
                </div>
            )}

            {/* Selected Point Marker */}
            {selectedPoint && (
                <div
                    className="absolute z-50 pointer-events-none"
                    style={{ left: selectedPoint.x, top: selectedPoint.y }}
                >
                    <div
                        className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 animate-ping opacity-75"
                        style={{ borderColor: theme.hex }}
                    />
                    <div
                        className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full shadow-lg border-2 border-white scale-110 transition-transform"
                        style={{ backgroundColor: theme.hex }}
                    />
                    <div
                        className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 animate-in fade-in zoom-in duration-200"
                        style={{ borderColor: theme.hex }}
                    />
                </div>
            )}
        </div>
    );
}