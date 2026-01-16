import { Play, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMatchStore } from '../../store/matchStore';
import { THEME_MAP } from '../../utils/constants';

const TimeoutTimer = ({ team, onClose }) => {
    const { setupData } = useMatchStore();
    const [timeLeft, setTimeLeft] = useState(30); // FIVB Standard: 30 Seconds

    useEffect(() => {
        if (timeLeft <= 0) {
            onClose();
            return;
        }
        const intervalId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, onClose]);

    // Format time as 00:30
    const formattedTime = `00:${timeLeft.toString().padStart(2, '0')}`;

    // 1. Resolve Data & Theme
    const teamData = setupData[team];
    const teamName = teamData?.name || (team === 'home' ? 'home' : 'away');
    const themeKey = teamData?.theme || (team === 'home' ? 'orange' : 'red');
    const theme = THEME_MAP[themeKey] || THEME_MAP.orange;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
            <div
                className="bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border-2 overflow-hidden flex flex-col relative transition-colors duration-300"
                style={{ borderColor: theme.hex }}
            >

                {/* Header with Dynamic Gradient */}
                <div
                    className="p-4 text-center border-b border-white/10"
                    style={{ background: `linear-gradient(to bottom, ${theme.hex}26, transparent)` }} // 26 = ~15% opacity hex
                >
                    <div
                        className="text-xs font-black uppercase tracking-[0.2em] mb-1"
                        style={{ color: theme.hex }}
                    >
                        Timeout Requested By
                    </div>
                    <h2 className="text-white text-2xl font-black italic tracking-tighter uppercase shadow-black drop-shadow-md">
                        {teamName}
                    </h2>
                </div>

                {/* Timer Body */}
                <div className="p-8 flex flex-col items-center justify-center">
                    <div className="relative">
                        {/* Dynamic Ping Animation Effect */}
                        <div
                            className="absolute inset-0 rounded-full blur-xl opacity-20 animate-pulse"
                            style={{ backgroundColor: theme.hex }}
                        ></div>

                        <div className="relative flex items-center justify-center gap-3 text-white text-6xl font-mono font-black tracking-widest tabular-nums drop-shadow-lg">
                            <Timer size={48} className="text-slate-500" />
                            {formattedTime}
                        </div>
                    </div>

                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4 animate-pulse">
                        Play Suspended
                    </p>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-800/50 border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white text-slate-900 font-black py-3 rounded-xl uppercase text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                    >
                        <Play size={18} fill="currentColor" /> Resume Match
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeoutTimer;