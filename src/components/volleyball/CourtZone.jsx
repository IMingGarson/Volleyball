import { PlayerTag } from '../common/PlayerTag';

export const CourtZone = ({ player, zoneNumber, theme, isSelected, onClick, isLibero, highlight, disabled, locked, isBlocker }) => {

    // Interaction Styles
    let containerClass = "cursor-pointer bg-slate-50/40 hover:bg-slate-100/60"; // Default interactive
    if (disabled) containerClass = "opacity-40 cursor-not-allowed bg-slate-100"; // Disabled state
    else if (locked) containerClass = "cursor-default"; // Locked (e.g., during opponent serve)

    // Highlight Styles (e.g., for Libero Swap targets)
    const highlightClass = highlight
        ? "bg-emerald-50/80 ring-2 ring-inset ring-emerald-400 opacity-100"
        : "";

    // Blocker Highlight
    const blockerClass = isBlocker
        ? "bg-violet-50/80 ring-2 ring-inset ring-violet-400 opacity-100"
        : "";

    return (
        <div
            onClick={() => !disabled && !locked && onClick && onClick(player)}
            className={`
                relative w-full h-full 
                border border-slate-200/60 
                flex items-center justify-center 
                transition-all duration-200 
                ${containerClass} ${highlightClass} ${blockerClass}
            `}
        >
            {/* Watermark Zone Number */}
            <span className="absolute top-0.5 left-2 text-lg md:text-xl font-black text-gray-400/40 select-none z-0 pointer-events-none">
                {zoneNumber}
            </span>

            {/* Player Tag Container */}
            {/* [FIX] Uses w-full with max-width to ensure it fits tablets without overflowing */}
            <div className="relative z-10 w-full px-1 md:px-2 max-w-[240px]">
                {player ? (
                    <PlayerTag
                        player={player}
                        isSelected={isSelected}
                        theme={theme}
                        isLibero={isLibero}
                        isBlocker={isBlocker}
                    />
                ) : (
                    // Empty Slot Placeholder
                    <div className="h-8 w-full"></div>
                )}
            </div>
        </div>
    );
};