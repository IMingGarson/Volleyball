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
import { FAULTS, initialRefereeState, REF_ACTIONS, refereeReducer } from '../reducers/fivbRefereeReducer';

const RefereeControls = ({ onPointAwarded, onClose, teamNames }) => {
    const [state, dispatch] = useReducer(refereeReducer, initialRefereeState);

    const getIcon = (iconName, size = 24) => {
        const icons = { CheckCircle, Flag, Hand, Users, Hash, UserX, RefreshCcw, Timer, Footprints, Signal };
        const Icon = icons[iconName] || Gavel;
        return <Icon size={size} />;
    };

    const handleFault = (faultCode, side) => {
        dispatch({
            type: REF_ACTIONS.MAKE_CALL,
            payload: {
                faultCode,
                faultingTeam: side,
                // Extract actual name from props, fallback to side
                teamName: teamNames ? teamNames[side] : (side === 'home' ? 'home' : 'away')
            }
        });
    };
    const confirmCall = () => {
        if (!state.finalDecision) return;

        // [UPDATED] Direct pass-through
        // Ensure your refereeReducer returns 'home' or 'away' in state.finalDecision.winner
        onPointAwarded(state.finalDecision.winner, state.finalDecision.reason);
        onClose();
    };

    // --- UI DERIVATION ---
    const isConfirming = state.status === 'CONFIRMATION';

    let winnerName = "";
    let headerColor = "bg-slate-800 border-slate-700";

    if (state.finalDecision) {
        const winnerSide = state.finalDecision.winner; // 'home' or 'away'
        // Safety check if teamNames exists
        winnerName = teamNames ? teamNames[winnerSide] : (winnerSide === 'home' ? 'home' : 'away');
        headerColor = winnerSide === 'home' ? 'bg-orange-600' : 'bg-red-600';
    }

    const getFaultingTeamLabel = () => {
        if (!state.currentCall) return "";
        const side = state.currentCall.faultingTeam; // 'home' or 'away'
        return teamNames ? teamNames[side] : (side === 'home' ? 'home' : 'away');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent p-4 animate-in fade-in duration-150">
            <div className="bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700 h-[80vh]">

                {/* HUD HEADER */}
                <div className={`shrink-0 p-5 flex justify-between items-center transition-all duration-300 border-b-4 ${isConfirming ? headerColor : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center gap-4">
                        <div className="bg-black/30 p-3 rounded-xl text-white shadow-inner"><Gavel size={32} /></div>
                        <div>
                            <h2 className="text-white font-black text-3xl uppercase tracking-tighter leading-none drop-shadow-md">
                                {isConfirming ? `POINT ${winnerName}` : 'REFEREE CALL'}
                            </h2>
                            <div className="text-white/90 font-bold text-xs uppercase tracking-widest mt-1">
                                {isConfirming
                                    ? `${state.currentCall.fault.name} • ${getFaultingTeamLabel()} FAULT`
                                    : 'SELECT INFRACTION'
                                }
                            </div>
                        </div>
                    </div>

                    {isConfirming ? (
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-6 py-3 bg-black/20 hover:bg-black/40 text-white font-bold rounded-lg uppercase text-sm border border-white/10 transition-colors">Cancel</button>
                            <button onClick={confirmCall} className="px-8 py-3 bg-white text-slate-900 font-black rounded-lg uppercase text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                <CheckCircle size={24} className="text-green-600" /> CONFIRM
                            </button>
                        </div>
                    ) : (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><X size={32} /></button>
                    )}
                </div>

                {/* FAULT SELECTION GRID */}
                <div className="flex-1 overflow-hidden flex relative">

                    {/* LEFT COLUMN: home TEAM */}
                    <div className="flex-1 bg-slate-100 flex flex-col border-r border-slate-300">
                        <div className="bg-orange-100 p-3 text-center border-b border-orange-200 shadow-sm z-10">
                            <span className="text-orange-800 font-black text-sm uppercase tracking-widest">
                                {teamNames ? teamNames.home : 'home'} FAULT
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start bg-slate-50">
                            {Object.values(FAULTS).map(f => (
                                <button
                                    key={f.code}
                                    onClick={() => handleFault(f.code, 'home')}
                                    className="bg-white border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 text-slate-600 hover:text-orange-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm h-28 group"
                                >
                                    <div className="text-slate-400 group-hover:text-orange-600 transition-colors">{getIcon(f.icon, 32)}</div>
                                    <span className="font-black text-sm uppercase text-center leading-tight">{f.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: away TEAM */}
                    <div className="flex-1 bg-slate-100 flex flex-col border-l border-slate-300">
                        <div className="bg-red-100 p-3 text-center border-b border-red-200 shadow-sm z-10">
                            <span className="text-red-800 font-black text-sm uppercase tracking-widest">
                                {teamNames ? teamNames.away : 'away'} FAULT
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start bg-slate-50">
                            {Object.values(FAULTS).map(f => (
                                <button
                                    key={f.code}
                                    onClick={() => handleFault(f.code, 'away')}
                                    className="bg-white border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm h-28 group"
                                >
                                    <div className="text-slate-400 group-hover:text-red-600 transition-colors">{getIcon(f.icon, 32)}</div>
                                    <span className="font-black text-sm uppercase text-center leading-tight">{f.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RefereeControls;