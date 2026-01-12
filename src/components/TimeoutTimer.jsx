import { Play, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

const TimeoutTimer = ({ team, onClose }) => {
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

    const isHome = team === 'home';
    const teamName = isHome ? 'KARASUNO' : 'NEKOMA';
    const borderColor = isHome ? 'border-orange-500' : 'border-red-500';
    const textColor = isHome ? 'text-orange-500' : 'text-red-500';
    const bgGradient = isHome ? 'from-orange-500/10' : 'from-red-500/10';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
            <div className={`bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border-2 ${borderColor} overflow-hidden flex flex-col relative`}>

                {/* Header */}
                <div className={`p-4 bg-gradient-to-b ${bgGradient} to-transparent text-center border-b border-white/10`}>
                    <div className={`text-xs font-black uppercase tracking-[0.2em] ${textColor} mb-1`}>
                        Timeout Requested By
                    </div>
                    <h2 className="text-white text-2xl font-black italic tracking-tighter uppercase">
                        {teamName}
                    </h2>
                </div>

                {/* Timer Body */}
                <div className="p-8 flex flex-col items-center justify-center">
                    <div className="relative">
                        {/* Ping Animation Effect */}
                        <div className={`absolute inset-0 rounded-full ${isHome ? 'bg-orange-500' : 'bg-red-500'} blur-xl opacity-20 animate-pulse`}></div>

                        <div className="relative flex items-center justify-center gap-3 text-white text-6xl font-mono font-black tracking-widest tabular-nums">
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