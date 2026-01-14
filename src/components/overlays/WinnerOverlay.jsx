import { Download, Trophy } from 'lucide-react';
import { useMatchStore } from '../../store/matchStore';
import { THEME_MAP } from '../../utils/constants';

export default function WinnerOverlay({ winner, score, onSave, isMatchPoint }) {
    const { setupData, setNumber } = useMatchStore();

    // Resolve Winner Data
    const teamData = setupData[winner];
    const themeName = teamData?.theme || (winner === 'home' ? 'orange' : 'red');
    const theme = THEME_MAP[themeName] || THEME_MAP.orange;

    // Resolve Loser Score for Display
    const loser = winner === 'home' ? 'away' : 'home';
    const winnerScore = score[winner];
    const loserScore = score[loser];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 animate-in fade-in duration-300">
            <div className="w-full max-w-lg p-1 relative">
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center text-center">
                    {/* Header */}
                    <div
                        className="w-full py-6 flex flex-col items-center justify-center text-white"
                        style={{ backgroundColor: theme.hex }}
                    >
                        <Trophy size={64} className="mb-2 drop-shadow-md animate-bounce" />
                        <h2 className="text-sm font-bold uppercase tracking-[0.3em] opacity-90">
                            {isMatchPoint ? 'MATCH WINNER' : `SET ${setNumber} WINNER`}
                        </h2>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter drop-shadow-lg mt-1">
                            {teamData.name}
                        </h1>
                    </div>

                    {/* Score Display */}
                    <div className="py-10 w-full flex items-center justify-center gap-8 bg-slate-50">
                        <div className="flex flex-col">
                            <span className="text-6xl font-black text-slate-800">{winnerScore}</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">WINNER</span>
                        </div>
                        <div className="h-12 w-1 bg-slate-200 rotate-12"></div>
                        <div className="flex flex-col">
                            <span className="text-6xl font-black text-slate-300">{loserScore}</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">LOSER</span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="w-full p-6 border-t border-slate-100 bg-white">
                        <button
                            onClick={onSave}
                            className={`w-full py-4 rounded-xl text-white font-black uppercase tracking-widest text-lg shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95 hover:brightness-110`}
                            style={{ backgroundColor: theme.hex }}
                        >
                            <Download size={24} />
                            {isMatchPoint ? "Save Match & Finish" : "Save Set & Next"}
                        </button>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                            Data will be saved to Local Storage
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}