import {
    CheckCircle, Flag,
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
import { useReducer, useState } from 'react';
import { FAULTS, initialRefereeState, REF_ACTIONS, refereeReducer } from '../../reducers/fivbRefereeReducer';
import { useMatchStore } from '../../store/matchStore';
import { THEME_MAP } from '../../utils/constants';

const RefereeControls = ({ onPointAwarded, onClose }) => {
    const { setupData } = useMatchStore();
    const [state, dispatch] = useReducer(refereeReducer, initialRefereeState);

    const [hoveredId, setHoveredId] = useState(null);

    // --- Dynamic Data ---
    const getTeamConfig = (side) => {
        const key = side === 'home' ? 'home' : 'away';
        return {
            name: setupData[key].name || (side === 'home' ? 'Home' : 'Away'),
            theme: THEME_MAP[setupData[key].theme] || THEME_MAP.orange
        };
    };

    const home = getTeamConfig('home');
    const away = getTeamConfig('away');

    const getIcon = (iconName, size = 24) => {
        const icons = { CheckCircle, Flag, Hand, Users, Hash, UserX, RefreshCcw, Timer, Footprints: CheckCircle, Signal, X };
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
    const winnerKey = state.finalDecision?.winner;

    // --- Header Styling Logic ---
    let headerBg = '#ffffff';
    let headerText = '#1e293b';

    if (isConfirming) {
        if (winnerKey === 'home') { headerBg = home.theme.hex; headerText = '#ffffff'; }
        else if (winnerKey === 'away') { headerBg = away.theme.hex; headerText = '#ffffff'; }
        else if (winnerKey === 'NO ONE') { headerBg = '#334155'; headerText = '#ffffff'; }
    }

    // --- Confirm Button Color ---
    const getConfirmButtonColor = () => {
        return '#16a34a'; // Clean Green
    };

    // Helper to check if a specific button is the one currently selected
    const isSelected = (code, team) => {
        return isConfirming &&
            state.currentCall?.fault?.code === code &&
            state.currentCall?.faultingTeam === team;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] relative">

                {/* --- HEADER --- */}
                <div
                    className="shrink-0 p-6 flex justify-between items-center transition-all duration-300 border-b border-slate-100 shadow-md relative z-20"
                    style={{ backgroundColor: headerBg, color: headerText }}
                >
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-2xl shadow-sm bg-slate-100 text-slate-500">
                            <Gavel size={40} strokeWidth={1.5} />
                        </div>
                        <div>
                            {isConfirming ? (
                                <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <h2 className="text-4xl font-black uppercase tracking-tight leading-none drop-shadow-md">
                                        {state.currentCall?.fault?.name}
                                    </h2>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-4xl font-black uppercase tracking-tight text-slate-800">
                                        Referee Call Panel
                                    </h2>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                                        Select Calls
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => { onClose(); dispatch({ type: REF_ACTIONS.CANCEL }) }}
                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={32} />
                    </button>
                </div>

                {/* --- FAULT GRID --- */}
                <div className="flex-1 overflow-hidden flex relative bg-slate-50/50">

                    {/* LEFT COLUMN (home) */}
                    <div className="flex-1 flex flex-col border-r border-slate-200">
                        <div className="p-4 text-center border-b border-slate-100 bg-white sticky top-0 z-10">
                            <span
                                className="font-black text-sm uppercase tracking-widest flex justify-center items-center gap-2"
                                style={{ color: home.theme.hex }}
                            >
                                <Flag size={16} /> {home.name} Fault
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-2 gap-3 content-start">
                            {Object.values(FAULTS).filter(f => f.code !== 'REPLAY').map(f => {
                                const id = `A_${f.code}`;
                                const selected = isSelected(f.code, 'A');
                                const isHovered = hoveredId === id;

                                return (
                                    <button
                                        key={f.code}
                                        onClick={() => handleFault(f.code, 'A')}
                                        onMouseEnter={() => setHoveredId(id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        className={`
                                            rounded-xl p-4 flex flex-col items-center justify-center gap-2 
                                            transition-all active:scale-95 shadow-sm border border-slate-200
                                            group min-h-[110px] relative overflow-hidden
                                        `}
                                        style={{
                                            // 1. Background
                                            backgroundColor: selected ? home.theme.hex : 'white',

                                            // 2. Text Color
                                            color: selected ? 'white' : undefined,

                                            // 3. Left Indicator (Use Box Shadow to prevent border conflicts)
                                            // If selected, no inner shadow needed (bg fills it). 
                                            // If not selected, show the colored strip.
                                            boxShadow: selected
                                                ? 'none'
                                                : (isHovered
                                                    ? `inset 8px 0 0 0 ${home.theme.hex}, 0 10px 15px -3px rgba(0, 0, 0, 0.1)`
                                                    : `inset 6px 0 0 0 ${home.theme.hex}, 0 1px 2px 0 rgba(0, 0, 0, 0.05)`),

                                            transform: (isHovered || selected) ? 'translateY(-2px)' : 'none',
                                        }}
                                    >
                                        <div style={{ color: selected ? 'white' : (isHovered ? home.theme.hex : '#94a3b8'), transition: 'color 0.2s' }}>
                                            {getIcon(f.icon, 32)}
                                        </div>
                                        <span className={`font-bold text-xs uppercase text-center leading-tight ${selected ? 'text-white' : 'text-slate-600'}`}>
                                            {f.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT COLUMN (away) */}
                    <div className="flex-1 flex flex-col bg-slate-50/30">
                        <div className="p-4 text-center border-b border-slate-100 bg-white sticky top-0 z-10">
                            <span
                                className="font-black text-sm uppercase tracking-widest flex justify-center items-center gap-2"
                                style={{ color: away.theme.hex }}
                            >
                                <Flag size={16} /> {away.name} Fault
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-2 gap-3 content-start">
                            {Object.values(FAULTS).filter(f => f.code !== 'REPLAY').map(f => {
                                const id = `B_${f.code}`;
                                const selected = isSelected(f.code, 'B');
                                const isHovered = hoveredId === id;

                                return (
                                    <button
                                        key={f.code}
                                        onClick={() => handleFault(f.code, 'B')}
                                        onMouseEnter={() => setHoveredId(id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        className={`
                                            rounded-xl p-4 flex flex-col items-center justify-center gap-2 
                                            transition-all active:scale-95 shadow-sm border border-slate-200
                                            group min-h-[110px] relative overflow-hidden
                                        `}
                                        style={{
                                            backgroundColor: selected ? away.theme.hex : 'white',
                                            color: selected ? 'white' : undefined,

                                            // Box Shadow Logic for Left Strip
                                            boxShadow: selected
                                                ? 'none'
                                                : (isHovered
                                                    ? `inset 8px 0 0 0 ${away.theme.hex}, 0 10px 15px -3px rgba(0, 0, 0, 0.1)`
                                                    : `inset 6px 0 0 0 ${away.theme.hex}, 0 1px 2px 0 rgba(0, 0, 0, 0.05)`),

                                            transform: (isHovered || selected) ? 'translateY(-2px)' : 'none',
                                        }}
                                    >
                                        <div style={{ color: selected ? 'white' : (isHovered ? away.theme.hex : '#94a3b8'), transition: 'color 0.2s' }}>
                                            {getIcon(f.icon, 32)}
                                        </div>
                                        <span className={`font-bold text-xs uppercase text-center leading-tight ${selected ? 'text-white' : 'text-slate-600'}`}>
                                            {f.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* --- FOOTER (DYNAMIC ACTIONS) --- */}
                <div className="bg-white p-6 border-t border-slate-100 flex justify-center z-20 transition-all duration-300">
                    <div className="w-md max-w-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2 fade-in">
                        <button
                            onClick={!isConfirming ? undefined : confirmCall}
                            disabled={!isConfirming}
                            className="flex-[2] py-4 rounded-xl text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all font-black uppercase text-lg flex items-center justify-center gap-3"
                            style={{ backgroundColor: getConfirmButtonColor() }}
                        >
                            <CheckCircle size={24} /> Confirm Call
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefereeControls;