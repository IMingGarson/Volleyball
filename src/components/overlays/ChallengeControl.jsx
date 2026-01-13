import { ArrowLeftRight, CheckCircle, MonitorPlay, X } from 'lucide-react';
import { useState } from 'react';
import { CHALLENGE_CATEGORIES } from '../../reducers/fivbRefereeReducer';
import { useMatchStore } from '../../store/matchStore';
import { THEME_MAP } from '../../utils/constants';

const ChallengeControl = ({ team, onClose, onResolve }) => {
    const { setupData } = useMatchStore();
    const [selectedCategory, setSelectedCategory] = useState(null);

    // 1. Resolve Team Name and Theme
    const teamData = setupData[team]; // 'home' or 'away'
    const teamName = teamData?.name || (team === 'home' ? 'HOME' : 'AWAY');

    // 2. Resolve Theme Colors
    // If teamData.theme exists, look it up in map. Otherwise fallback to orange(home)/red(away)
    const themeKey = teamData?.theme || (team === 'home' ? 'orange' : 'red');
    const theme = THEME_MAP[themeKey] || THEME_MAP.orange;

    const handleResolve = (success) => {
        if (!selectedCategory) return;
        onResolve({ success, category: selectedCategory.label });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700">

                {/* Header with Dynamic Colors */}
                <div
                    className="p-5 text-white flex items-center gap-4 shadow-lg transition-colors duration-300"
                    style={{ backgroundColor: theme.hex }}
                >
                    <div className="bg-white/20 p-2 rounded-lg"><MonitorPlay size={32} /></div>
                    <div>
                        <h2 className="font-black text-2xl uppercase tracking-tighter leading-none">{teamName} CHALLENGE</h2>
                        <div className="text-white/80 font-bold text-xs uppercase tracking-widest mt-1">Video Verification</div>
                    </div>
                    <button onClick={onClose} className="ml-auto p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="p-6 bg-slate-800">

                    {/* Step 1: Category Selection */}
                    {!selectedCategory ? (
                        <div className="space-y-3">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Select Challenge Item</p>
                            {CHALLENGE_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat)}
                                    className="w-full text-left p-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold uppercase text-sm transition-all border border-slate-600 hover:border-white/50 flex justify-between items-center group"
                                >
                                    {cat.label}
                                    <ArrowLeftRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                                </button>
                            ))}
                        </div>
                    ) : (

                        /* Step 2: Resolution */
                        <div className="animate-in slide-in-from-right-8 duration-200">
                            <button onClick={() => setSelectedCategory(null)} className="text-slate-400 text-xs font-bold uppercase hover:text-white mb-4 flex items-center gap-1 transition-colors">
                                &larr; Back to Categories
                            </button>

                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-600 mb-6 text-center shadow-inner">
                                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Reviewing</div>
                                <div className="text-white text-xl font-black uppercase mt-1 tracking-tight">{selectedCategory.label}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleResolve(true)}
                                    className="py-6 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black uppercase flex flex-col items-center gap-2 shadow-lg transition-transform active:scale-95"
                                >
                                    <CheckCircle size={32} />
                                    <span>Successful</span>
                                    <span className="text-[9px] opacity-70 font-normal">Score Flip</span>
                                </button>

                                <button
                                    onClick={() => handleResolve(false)}
                                    className="py-6 bg-red-500 hover:bg-red-400 text-white rounded-xl font-black uppercase flex flex-col items-center gap-2 shadow-lg transition-transform active:scale-95"
                                >
                                    <X size={32} />
                                    <span>Failed</span>
                                    <span className="text-[9px] opacity-70 font-normal">Call Stands</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChallengeControl;