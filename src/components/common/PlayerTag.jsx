import { Shield } from 'lucide-react';

export const PlayerTag = ({ player, isSelected, theme, isLibero, isBlocker }) => {
    // [FIX] Safety Check: If theme hasn't loaded or wasn't passed, render nothing.
    // This allows the app to load without crashing, and it will automatically
    // re-render once the parent passes the correct theme.
    if (!theme) return null;

    // 1. Base Container Styles
    const baseClass = "relative z-20 w-full py-1 px-2 md:px-3 rounded-lg shadow-sm flex items-center justify-between transition-all duration-200 cursor-pointer select-none border-l-[6px]";

    // 2. Default State (Inactive)
    let containerStyle = `bg-white ${theme.border} hover:bg-slate-50 group-hover:scale-[1.02] shadow-sm`;
    let textStyle = "text-slate-700";
    let inlineStyle = {};

    // 3. Libero State (Inactive)
    if (isLibero && !isSelected) {
        containerStyle = `bg-white ${theme.border} ${theme.tint} ring-2 ring-inset ring-slate-100`;
    }

    // 4. Selected State (Active)
    if (isSelected) {
        containerStyle = `text-white border-slate-900 scale-105 ring-2 ring-offset-1 ring-black/20 z-30 shadow-xl`;
        inlineStyle = { backgroundColor: theme.hex };
    }

    // 5. Blocker State
    if (isBlocker) {
        containerStyle = "bg-purple-600 text-white border-purple-900 ring-4 ring-purple-300 z-40 scale-105 shadow-xl";
        inlineStyle = {};
    }

    return (
        <div className={`${baseClass} ${containerStyle}`} style={inlineStyle}>
            <div className="flex items-center gap-1">
                {isLibero && <Shield size={12} className={isSelected || isBlocker ? "text-white/80" : theme.tint} />}
                <span className="text-xl xl:text-3xl font-black italic tracking-tighter leading-none">{player.number}</span>
            </div>
            <div className={`flex flex-col items-end leading-tight min-w-0 ${textStyle} ${isSelected || isBlocker ? 'opacity-100' : 'opacity-90'}`}>
                <span className={`text-[9px] xl:text-xs font-black uppercase tracking-wider ${isSelected || isBlocker ? 'text-white/80' : 'text-slate-400'}`}>{player.pos}</span>
                <span className={`text-[10px] xl:text-sm font-black uppercase truncate w-full text-right ${isSelected || isBlocker ? 'text-white' : 'text-slate-800'}`}>{player.name}</span>
            </div>
        </div>
    );
};