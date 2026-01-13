import { MonitorPlay, PauseCircle } from 'lucide-react';
import { PlayerTag } from './PlayerTag'; // Make sure this path is correct relative to this file

// --- Generic Buttons ---

export const PrettyButton = ({ onClick, title, subtitle, icon: Icon, colorClass }) => (
    <button onClick={onClick} className={`relative h-full w-full rounded-xl border flex flex-col items-center justify-center transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md ${colorClass}`}>
        {Icon && <Icon size={24} className="mb-1 opacity-90" />}
        <span className="text-sm md:text-base font-black uppercase leading-none text-center">{title}</span>
        {subtitle && <span className="text-[10px] md:text-xs font-bold opacity-70 uppercase mt-0.5 hidden xl:block">{subtitle}</span>}
    </button>
);

export const ActionBtn = ({ onClick, children, variant = 'neutral', className = '' }) => {
    const base = "h-full rounded-lg font-black text-xs uppercase tracking-wider flex items-center justify-center transition-all active:scale-95 shadow-md hover:shadow-lg border-b-4 active:border-b-0 active:translate-y-1";
    const variants = {
        success: "bg-green-500 border-green-700 text-white hover:bg-green-400",
        danger: "bg-red-500 border-red-700 text-white hover:bg-red-400",
        primary: "bg-blue-600 border-blue-800 text-white hover:bg-blue-500",
        neutral: "bg-slate-100 border-slate-300 text-slate-700 hover:bg-white hover:text-black",
        dark: "bg-slate-800 border-black text-white hover:bg-slate-700"
    };
    return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};

// --- Domain Specific Buttons ---

export const BenchCard = ({ player, teamColor, onClick, isSelected }) => (
    <div onClick={() => onClick(player)} className="w-full cursor-pointer hover:scale-[1.02] transition-transform">
        <PlayerTag player={player} isSelected={isSelected} teamColor={teamColor} isLibero={false} />
    </div>
);

export const ChallengeButton = ({ onClick, used, limit }) => (
    <button onClick={onClick} disabled={used >= limit} className="w-full group bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-3 rounded-lg shadow-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 overflow-hidden relative">
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <MonitorPlay size={18} className="relative z-10" />
        <span className="relative z-10 uppercase tracking-widest text-xs">Challenge <span className="opacity-70 ml-1">({used}/{limit})</span></span>
    </button>
);

export const TimeoutButton = ({ onClick, used, limit, disabled }) => (
    <button onClick={onClick} disabled={used >= limit || disabled} className="w-full group bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-3 rounded-lg shadow-lg border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 overflow-hidden relative">
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <PauseCircle size={18} className="relative z-10" />
        <span className="relative z-10 uppercase tracking-widest text-xs">Timeout <span className="opacity-70 ml-1">({used}/{limit})</span></span>
    </button>
);