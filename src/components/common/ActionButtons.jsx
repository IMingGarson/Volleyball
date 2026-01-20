import { MonitorPlay, PauseCircle } from 'lucide-react';
import { PlayerTag } from './PlayerTag';

// --- Generic Buttons ---

export const PrettyButton = ({ onClick, title, subtitle, icon: Icon, colorClass }) => (
    <button
        onClick={onClick}
        className={`
            relative h-full w-full rounded-lg border-b-4 flex flex-col items-center justify-center 
            transition-all duration-75 active:border-b-0 active:translate-y-1 active:scale-[0.98]
            ${colorClass}
        `}
    >
        {Icon && <Icon className="mb-0.5 opacity-80 w-5 h-5 md:w-6 md:h-6" />}
        <span className="text-xs md:text-sm xl:text-base font-black uppercase leading-none text-center tracking-tight">
            {title}
        </span>
        {subtitle && (
            <span className="text-[9px] md:text-[10px] font-bold opacity-60 uppercase mt-0.5">
                {subtitle}
            </span>
        )}
    </button>
);

export const ActionBtn = ({ onClick, children, variant = 'neutral', className = '' }) => {
    const base = "h-full rounded-lg font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center justify-center transition-all active:scale-95 border-b-4 active:border-b-0 active:translate-y-1";

    const variants = {
        success: "bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-400",
        danger: "bg-rose-500 border-rose-700 text-white hover:bg-rose-400",
        primary: "bg-blue-600 border-blue-800 text-white hover:bg-blue-500",
        neutral: "bg-slate-100 border-slate-300 text-slate-600 hover:bg-white hover:text-slate-800",
        dark: "bg-slate-800 border-black text-white hover:bg-slate-700"
    };

    return (
        <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

// --- Domain Specific Buttons ---

export const BenchCard = ({ player, theme, onClick, isSelected }) => (
    <div onClick={() => onClick(player)} className="w-full">
        <PlayerTag
            player={player}
            isSelected={isSelected}
            theme={theme}
            isLibero={false}
        />
    </div>
);

/**
 * ChallengeButton
 * Updated Layout: Single Row
 * [Icon + Text] ---------- [Counter Badge]
 */
export const ChallengeButton = ({ onClick, used, limit, theme }) => {
    const isDisabled = used >= limit;
    const hex = theme?.hex || '#4f46e5';

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`
                w-full group relative overflow-hidden
                py-2 px-2 md:px-3 rounded-lg border-b-4 transition-all duration-100
                flex items-center justify-between
                text-white font-black uppercase tracking-widest
                active:border-b-0 active:translate-y-1 active:scale-[0.98]
                ${isDisabled ? 'bg-slate-300 border-slate-400 cursor-not-allowed text-slate-100' : 'hover:brightness-110'}
            `}
            style={!isDisabled ? { backgroundColor: hex, borderColor: 'rgba(0,0,0,0.2)' } : {}}
        >
            {/* Left: Icon & Label */}
            <div className="flex items-center gap-1.5 md:gap-2">
                <MonitorPlay className="opacity-90 group-hover:scale-110 transition-transform w-3 h-3 md:w-4 md:h-4 xl:w-5 xl:h-5" />
                <span className="text-[9px] md:text-[10px] xl:text-xs leading-none mt-0.5">
                    CHALLENGE
                </span>
            </div>

            {/* Right: Counter Badge */}
            <div className="bg-black/20 rounded px-1.5 py-0.5 flex items-center justify-center">
                <span className="text-[9px] md:text-[10px] font-bold leading-none text-white/90">
                    {used}/{limit}
                </span>
            </div>
        </button>
    );
};

/**
 * TimeoutButton
 * Updated Layout: Single Row
 * [Icon + Text] ---------- [Counter Badge]
 */
export const TimeoutButton = ({ onClick, used, limit, disabled, theme }) => {
    const isDisabled = used >= limit || disabled;
    const hex = theme?.hex || '#f59e0b';

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`
                w-full group relative overflow-hidden
                py-2 px-2 md:px-3 rounded-lg border-b-4 transition-all duration-100
                flex items-center justify-between
                text-white font-black uppercase tracking-widest
                active:border-b-0 active:translate-y-1 active:scale-[0.98]
                ${isDisabled ? 'bg-slate-300 border-slate-400 cursor-not-allowed text-slate-100' : 'hover:brightness-110'}
            `}
            style={!isDisabled ? { backgroundColor: hex, borderColor: 'rgba(0,0,0,0.2)' } : {}}
        >
            {/* Left: Icon & Label */}
            <div className="flex items-center gap-1.5 md:gap-2">
                <PauseCircle className="opacity-90 group-hover:scale-110 transition-transform w-3 h-3 md:w-4 md:h-4 xl:w-5 xl:h-5" />
                <span className="text-[9px] md:text-[10px] xl:text-xs leading-none mt-0.5">
                    TIMEOUT
                </span>
            </div>

            {/* Right: Counter Badge */}
            <div className="bg-black/20 rounded px-1.5 py-0.5 flex items-center justify-center">
                <span className="text-[9px] md:text-[10px] font-bold leading-none text-white/90">
                    {used}/{limit}
                </span>
            </div>
        </button>
    );
};