// src/components/common/PlayerTag.jsx
export const PlayerTag = ({ player, isSelected, teamColor, isLibero, isBlocker }) => {
    const baseClass = "relative z-20 w-full py-1 px-2 md:px-3 rounded-lg shadow-sm flex items-center justify-between transition-all duration-200 cursor-pointer select-none border-l-[6px]";
    let bgClass = "bg-white";
    let textClass = "text-slate-700";
    let borderClass = teamColor === 'orange' ? "border-[#ff7b00]" : "border-[#d9202a]";
    let hoverClass = teamColor === 'orange' ? "hover:bg-orange-50" : "hover:bg-red-50";
    let extraClass = "group-hover:scale-[1.02] shadow-sm";

    if (isLibero && !isSelected) {
        textClass = teamColor === 'orange' ? "text-[#c75c14]" : "text-[#9e212d]";
        borderClass = teamColor === 'orange' ? "border-[#ff7b00] ring-2 ring-inset ring-orange-200" : "border-[#d9202a] ring-2 ring-inset ring-red-200";
    }

    if (isSelected) {
        if (teamColor === 'orange') {
            bgClass = "bg-[#ff7b00] shadow-orange-200";
            textClass = "text-white";
            borderClass = "border-[#1f222b]";
        } else {
            bgClass = "bg-[#d9202a] shadow-red-200";
            textClass = "text-white";
            borderClass = "border-[#2c2429]";
        }
        extraClass = "scale-105 ring-2 ring-offset-2 ring-black/20 z-30 shadow-xl";
    }

    if (isBlocker) {
        bgClass = "bg-purple-600 text-white";
        borderClass = "border-purple-900";
        extraClass = "ring-4 ring-purple-300 z-40 scale-105 shadow-xl";
    }

    return (
        <div className={`${baseClass} ${bgClass} ${borderClass} ${hoverClass} ${extraClass}`}>
            <span className={`text-xl xl:text-3xl font-black italic tracking-tighter leading-none`}>{player.number}</span>
            <div className={`flex flex-col items-end leading-tight min-w-0 ${textClass} ${isSelected || isBlocker ? 'opacity-100' : 'opacity-90'}`}>
                <span className="text-[9px] xl:text-xs font-black uppercase tracking-wider opacity-100">{player.pos}</span>
                <span className="text-[10px] xl:text-sm font-black uppercase truncate w-full text-right">{player.name}</span>
            </div>
        </div>
    );
};