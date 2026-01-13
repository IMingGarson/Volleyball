import {
    CheckCircle, Flag,
    Footprints,
    Gavel,
    Hand,
    Hash,
    RefreshCcw,
    Signal,
    Timer,
    Users,
    UserX,
    X
} from 'lucide-react';
import { useReducer } from 'react';
import { FAULTS, initialRefereeState, REF_ACTIONS, refereeReducer } from '../../reducers/fivbRefereeReducer';

const RefereeControls = ({ onPointAwarded, onClose }) => {
    const [state, dispatch] = useReducer(refereeReducer, initialRefereeState);

    const getIcon = (iconName, size = 24) => {
        const icons = { CheckCircle, Flag, Hand, Users, Hash, UserX, RefreshCcw, Timer, Footprints, Signal, X };
        const Icon = icons[iconName] || Gavel;
        return <Icon size={size} />;
    };

    const handleFault = (faultCode, faultingTeam) => {
        dispatch({ type: REF_ACTIONS.MAKE_CALL, payload: { faultCode, faultingTeam } });
    };

    const confirmCall = () => {
        onPointAwarded(state.finalDecision.winner, state.finalDecision.reason);
        onClose();
    };

    const isConfirming = state.status === 'CONFIRMATION';
    const winner = state.finalDecision?.winner;
    const winnerName = winner === 'home' ? 'KARASUNO' : (winner === 'away' ? 'NEKOMA' : 'NO ONE');

    const headerColor = winner === 'home' ? 'bg-orange-600' : (winner === 'away' ? 'bg-red-600' : 'bg-slate-600');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700 h-[85vh]">

                {/* HUD */}
                <div className={`shrink-0 p-5 flex justify-between items-center transition-all duration-300 border-b-4 ${isConfirming ? headerColor : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center gap-4">
                        <div className="bg-black/30 p-3 rounded-xl text-white shadow-inner"><Gavel size={32} /></div>
                        <div>
                            <h2 className="text-white font-black text-3xl uppercase tracking-tighter leading-none drop-shadow-md">
                                {isConfirming ? (winner ? `POINT ${winnerName}` : 'REPLAY POINT') : 'REFEREE CALL'}
                            </h2>
                            <div className="text-white/90 font-bold text-xs uppercase tracking-widest mt-1">
                                {isConfirming ? `${state.currentCall.fault.name} • ${state.currentCall.faultingTeam}` : 'SELECT INFRACTION'}
                            </div>
                        </div>
                    </div>

                    {isConfirming ? (
                        <div className="flex gap-3">
                            <button onClick={() => dispatch({ type: REF_ACTIONS.CANCEL })} className="px-6 py-3 bg-black/20 hover:bg-black/40 text-white font-bold rounded-lg uppercase text-sm border border-white/10 transition-colors">Cancel</button>
                            <button onClick={confirmCall} className="px-8 py-3 bg-white text-slate-900 font-black rounded-lg uppercase text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                <CheckCircle size={24} className="text-green-600" /> CONFIRM
                            </button>
                        </div>
                    ) : (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><X size={32} /></button>
                    )}
                </div>

                {/* FAULT GRID */}
                <div className="flex-1 overflow-hidden flex relative bg-slate-50">

                    {/* KARASUNO (A) */}
                    <div className="flex-1 flex flex-col border-r border-slate-300">
                        <div className="bg-orange-100 p-3 text-center border-b border-orange-200 shadow-sm z-10">
                            <span className="text-orange-800 font-black text-sm uppercase tracking-widest">KARASUNO FAULT</span>
                        </div>
                        <div className="flex-1 overflow-hidden py-8 px-6 grid grid-cols-2 gap-4 content-center">
                            {Object.values(FAULTS).filter(f => f.code !== 'REPLAY').map(f => (
                                <button key={f.code} onClick={() => handleFault(f.code, 'A')} className="bg-white border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 text-slate-600 hover:text-orange-700 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm h-full max-h-32 group">
                                    <div className="text-slate-400 group-hover:text-orange-600 transition-colors transform group-hover:scale-110 duration-200">{getIcon(f.icon, 32)}</div>
                                    <span className="font-black text-xs uppercase text-center leading-tight">{f.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* NEKOMA (B) */}
                    <div className="flex-1 flex flex-col border-l border-slate-300">
                        <div className="bg-red-100 p-3 text-center border-b border-red-200 shadow-sm z-10">
                            <span className="text-red-800 font-black text-sm uppercase tracking-widest">NEKOMA FAULT</span>
                        </div>
                        <div className="flex-1 overflow-hidden py-8 px-6 grid grid-cols-2 gap-4 content-center">
                            {Object.values(FAULTS).filter(f => f.code !== 'REPLAY').map(f => (
                                <button key={f.code} onClick={() => handleFault(f.code, 'B')} className="bg-white border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm h-full max-h-32 group">
                                    <div className="text-slate-400 group-hover:text-red-600 transition-colors transform group-hover:scale-110 duration-200">{getIcon(f.icon, 32)}</div>
                                    <span className="font-black text-xs uppercase text-center leading-tight">{f.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* REPLAY FOOTER */}
                <div className="bg-slate-900 p-5 border-t border-slate-800 flex justify-center">
                    <button
                        onClick={() => handleFault('REPLAY', 'NO ONE')}
                        className="w-full max-w-sm py-4 rounded-xl border-2 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all font-black tracking-widest flex items-center justify-center gap-3 uppercase text-sm group"
                    >
                        <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                        Replay This Point
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RefereeControls;