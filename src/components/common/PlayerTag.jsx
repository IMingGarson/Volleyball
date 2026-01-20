import { Shield } from 'lucide-react';

export const PlayerTag = ({ player, isSelected, theme, isLibero, isBlocker }) => {
    // Safety check
    if (!theme) return null;

    // --- State Logic ---
    const isActive = isSelected;
    const isSpecialState = isActive || isBlocker;

    // --- Dynamic Styles ---

    // 1. Base Container
    // Fixed layout: Always flex-row (horizontal).
    // Consistent padding: px-2 py-1 (tight box).
    // Overflow hidden: Ensures nothing ever spills out.
    const baseClasses = `
        group relative w-full
        flex items-center justify-between
        px-2 py-1.5
        rounded-md
        border-l-[4px]
        shadow-sm hover:shadow transition-all duration-75 ease-out
        cursor-pointer select-none
        active:scale-[0.98]
        overflow-hidden
        bg-white
    `;

    // 2. State-Specific Colors
    let stateClasses = "";
    let inlineStyles = {};

    if (isBlocker) {
        stateClasses = "bg-purple-600 border-purple-800 text-white z-30 ring-1 ring-purple-300";
    } else if (isActive) {
        stateClasses = "text-white z-20 ring-1 ring-slate-300 shadow-md";
        inlineStyles = {
            backgroundColor: theme.hex,
            borderColor: theme.hex
        };
    } else {
        stateClasses = "hover:bg-slate-50 text-slate-700";
        if (isLibero) stateClasses += " bg-slate-50/80"; // Subtle tint for libero
        inlineStyles = {
            borderLeftColor: theme.hex
        };
    }

    return (
        <div className={`${baseClasses} ${stateClasses}`} style={inlineStyles}>

            {/* LEFT: Number & Icon */}
            {/* Flex container that won't shrink */}
            <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
                {isLibero && (
                    <Shield
                        className={`w-3 h-3 ${isSpecialState ? "text-white/90" : "text-slate-400"}`}
                    />
                )}

                {/* Responsive Number: 
                    Tablet: text-lg (18px)
                    Desktop: text-2xl (24px)
                */}
                <span className="text-lg xl:text-2xl font-black italic tracking-tighter leading-none">
                    {player.number}
                </span>
            </div>

            {/* RIGHT: Position & Name */}
            {/* min-w-0 is CRITICAL here. It allows the truncate to work inside a flex item. */}
            <div className={`flex flex-col items-end justify-center min-w-0 flex-1 pl-1 leading-none ${isSpecialState ? 'opacity-100' : 'opacity-90'}`}>

                {/* Position: Tiny label, hidden on very tight screens if needed, mostly visible */}
                <span className={`text-[8px] xl:text-[9px] font-black uppercase tracking-wider mb-0.5 ${isSpecialState ? 'text-white/80' : 'text-slate-400'}`}>
                    {player.pos}
                </span>

                {/* Name: 
                    Tablet: text-[10px] (Tiny but readable)
                    Desktop: text-sm (Standard)
                    Truncate: Cuts off "... " if name is too long for the box
                */}
                <span className={`w-full text-right truncate text-[10px] xl:text-sm font-bold uppercase ${isSpecialState ? 'text-white' : 'text-slate-800'}`}>
                    {player.name}
                </span>
            </div>
        </div>
    );
};