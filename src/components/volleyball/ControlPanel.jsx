import {
    Activity, AlertCircle, ArrowDown, ArrowRight, ArrowUp, ArrowUpCircle, Ban, CheckCircle,
    Crosshair, Disc, FastForward, Hand, RotateCcw, Shield,
    Trophy, XCircle, Zap
} from 'lucide-react';

export default function ControlPanel({ state, actions }) {
    const { matchPhase, rallyData, selectedPlayer } = state;
    const p = selectedPlayer;

    const ScoutBtn = ({ label, icon: Icon, color = 'slate', onClick, disabled, className = "", iconClassName = "" }) => {
        const styles = {
            green: "bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200",
            red: "bg-red-100/80     text-red-800     hover:bg-red-200",
            blue: "bg-blue-100/80    text-blue-800    hover:bg-blue-200",
            orange: "bg-orange-100/80  text-orange-800  hover:bg-orange-200",
            purple: "bg-purple-100/80  text-purple-800  hover:bg-purple-200",
            slate: "bg-slate-100/80   text-slate-800   hover:bg-slate-200",
            white: "bg-white          text-slate-800   hover:bg-slate-50 border border-slate-200/60 shadow-sm",
        };

        const activeStyle = styles[color] || styles.white;

        return (
            <button
                onClick={!disabled ? onClick : undefined}
                disabled={disabled}
                className={`
                    group relative flex flex-col items-center justify-center 
                    w-full h-full rounded-xl transition-all duration-200 scale-100
                    active:scale-[0.96] p-1.5 md:p-2
                    ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}
                    ${activeStyle}
                    ${className}
                `}
            >
                <div className="flex flex-col items-center gap-0.5 md:gap-1 leading-none w-full">
                    {Icon && (
                        <Icon
                            className={`w-4 h-4 md:w-5 md:h-5 opacity-80 group-hover:opacity-100 transition-opacity ${iconClassName}`}
                            strokeWidth={2.5}
                        />
                    )}
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-center leading-none">
                        {label}
                    </span>
                </div>
            </button>
        );
    };

    const HintHeader = ({ label, value, highlightValue = false }) => (
        <div className="flex items-center justify-between w-full mb-1.5 min-h-[32px] px-1 flex-shrink-0">
            <div className="w-[70px]">
                <button
                    onClick={actions.undo}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm w-full"
                >
                    <RotateCcw size={12} strokeWidth={2.5} /> <span>Undo</span>
                </button>
            </div>
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-0 md:gap-2 leading-tight overflow-hidden">
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {label}
                </span>
                <span className={`text-base md:text-lg font-bold uppercase tracking-tight truncate ${highlightValue ? 'text-blue-600' : 'text-slate-900'}`}>
                    {value}
                </span>
            </div>
            <div className="w-[70px]"></div>
        </div>
    );

    // --- CONTENT RENDERER ---

    const Content = () => {
        // 1. SERVE
        if (matchPhase === 'SERVE' && p) {
            const step = !rallyData.serveType ? 1 : 2;
            return (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <HintHeader label="SERVICE" value={p.name} highlightValue />
                    {step === 1 ? (
                        <div className="grid grid-cols-3 gap-2 md:gap-3 flex-1 min-h-0 pb-2">
                            <ScoutBtn label="Float" color="white" icon={Disc} onClick={() => actions.setServeType('FLOAT')} />
                            <ScoutBtn label="Topspin" color="white" icon={Zap} onClick={() => actions.setServeType('TOPSPIN')} />
                            <ScoutBtn label="Jump" color="white" icon={ArrowUpCircle} onClick={() => actions.setServeType('JUMP')} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 md:gap-3 flex-1 min-h-0 pb-2">
                            <ScoutBtn label="Ace" color="green" icon={Trophy} onClick={() => actions.setServeResult('ACE')} />
                            <ScoutBtn label="In Play" color="blue" icon={ArrowRight} onClick={() => actions.setServeResult('IN_PLAY')} />
                            <ScoutBtn label="Error" color="red" icon={XCircle} onClick={() => actions.setServeResult('ERROR')} />
                        </div>
                    )}
                </div>
            );
        }

        // 2. LANDING ZONES
        if (matchPhase === 'SERVE_LANDING' || matchPhase === 'LANDING') {
            return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <HintHeader label="LOCATION" value="Select Zone" />
                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-emerald-50/50 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-700 p-2 mx-1 mb-2">
                        <div className="animate-pulse flex flex-row items-center gap-2">
                            <Crosshair className="w-5 h-5" />
                            <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-center">Tap Court Grid</span>
                        </div>
                    </div>
                </div>
            );
        }

        // 3. RECEPTION
        if (matchPhase === 'RECEPTION') {
            if (!p) return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <HintHeader label="RECEPTION" value="Select Player" />
                    <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 mx-1 mb-2">
                        <span className="font-bold flex items-center gap-2 text-xs md:text-sm"><Shield className="w-5 h-5" /> Tap Player</span>
                    </div>
                </div>
            );
            return (
                <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300">
                    <HintHeader label="RECEPTION" value={p.name} highlightValue />
                    <div className="grid grid-cols-4 gap-2 md:gap-3 flex-1 min-h-0 pb-2">
                        <ScoutBtn label="Error" color="red" icon={XCircle} onClick={() => actions.setReception(0, p)} />
                        <ScoutBtn label="Poor" color="orange" icon={AlertCircle} onClick={() => actions.setReception(1, p)} />
                        <ScoutBtn label="Good" color="blue" icon={Shield} onClick={() => actions.setReception(2, p)} />
                        <ScoutBtn label="Perfect" color="green" icon={CheckCircle} onClick={() => actions.setReception(3, p)} />
                    </div>
                </div>
            );
        }

        // 4. SET
        if (matchPhase === 'SET') {
            if (!p) return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <HintHeader label="SET" value="Select Setter" />
                    <div className="flex-1 min-h-0 flex flex-row gap-2 h-full mb-2">
                        <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                            <span className="font-bold flex items-center gap-2 text-xs md:text-sm"><Hand className="w-5 h-5" /> Tap Setter</span>
                        </div>
                        <div className="w-1/3 h-full">
                            <ScoutBtn
                                label="No Set"
                                color="orange"
                                icon={FastForward}
                                onClick={actions.skipSet}
                            />
                        </div>
                    </div>
                </div>
            );
            return (
                <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300">
                    <HintHeader label="SET CALL" value={p.name} highlightValue />
                    <div className="grid grid-cols-4 gap-2 md:gap-3 flex-1 min-h-0 pb-2">
                        <ScoutBtn label="High" icon={ArrowUp} color="white" onClick={() => actions.setSetType('High')} />
                        <ScoutBtn label="Quick" icon={Zap} color="white" onClick={() => actions.setSetType('Quick')} />
                        <ScoutBtn label="Pipe" icon={ArrowUpCircle} color="white" onClick={() => actions.setSetType('Pipe')} />
                        <ScoutBtn label="Dump" icon={ArrowDown} color="white" onClick={() => actions.setSetType('Dump')} />
                    </div>
                </div>
            );
        }

        // 5. ATTACK
        if (matchPhase === 'ATTACK') {
            if (!p) return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <HintHeader label="ATTACK" value="Select Player" />
                    <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 mx-1 mb-2">
                        <span className="font-bold flex items-center gap-2 text-xs md:text-sm"><Activity className="w-5 h-5" /> Tap Attacker</span>
                    </div>
                </div>
            );
            return (
                <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300">
                    <HintHeader label="ATTACK" value={p.name} highlightValue />
                    <div className="grid grid-cols-3 gap-2 md:gap-3 flex-1 min-h-0 pb-2">
                        <ScoutBtn label="Spike" color="slate" icon={Zap} onClick={() => actions.setAttackType('Spike')} />
                        <ScoutBtn label="Tip" color="white" icon={Hand} iconClassName="scale-x-[-1]" onClick={() => actions.setAttackType('Tip')} />
                        <ScoutBtn label="Back Row" color="white" icon={ArrowUpCircle} onClick={() => actions.setAttackType('BackRow')} />
                    </div>
                </div>
            );
        }

        // 6. DIG / DECISION
        if (matchPhase === 'DIG_DECISION') {
            return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <HintHeader label="RESULT" value={p ? p.name : "Rally Outcome"} highlightValue />
                    <div className="grid grid-cols-4 gap-2 md:gap-3 flex-1 min-h-0 pb-2">
                        <ScoutBtn label="Kill" color="green" icon={Trophy} onClick={() => actions.setAttackResult('KILL')} />
                        <ScoutBtn label="Dig" color="blue" icon={Shield} onClick={() => actions.setAttackResult('DIG')} />
                        <ScoutBtn label="Block" color="purple" icon={Ban} onClick={() => actions.blockDetected()} />
                        <ScoutBtn label="Error" color="red" icon={XCircle} onClick={() => actions.setAttackResult('ERROR')} />
                    </div>
                </div>
            );
        }

        // 7. BLOCK RESULT
        if (matchPhase === 'BLOCK_RESULT') {
            return (
                <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
                    <HintHeader label="BLOCK" value="Outcome" />
                    <div className="grid grid-cols-4 gap-2 md:gap-3 flex-1 min-h-0 pb-2">
                        <ScoutBtn label="Shut" color="purple" icon={Ban} onClick={() => actions.blockOutcome('SHUTDOWN')} />
                        <ScoutBtn label="Soft" color="blue" icon={Activity} onClick={() => actions.blockOutcome('SOFT_BLOCK')} />
                        <ScoutBtn label="Cover" color="orange" icon={RotateCcw} onClick={() => actions.blockOutcome('REBOUND')} />
                        <ScoutBtn label="Tool" color="green" icon={Trophy} onClick={() => actions.blockOutcome('TOUCH_OUT')} />
                    </div>
                </div>
            );
        }

        // 8. BLOCKER SELECTION
        if (matchPhase === 'SELECT_BLOCKERS') {
            return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <HintHeader label="DEFENSE" value="Assign Blockers" />
                    <div className="flex-1 flex flex-col min-h-0 gap-2 pb-2">
                        <div className="flex-1 bg-violet-50 rounded-xl border-2 border-violet-100 flex items-center justify-center p-2 mx-1">
                            <span className="text-sm md:text-lg font-bold text-violet-900 text-center uppercase tracking-tight">
                                {rallyData.blockers.length > 0 ? rallyData.blockers.map(b => b.name).join(' + ') : 'Select Players...'}
                            </span>
                        </div>
                        <div className="h-8 md:h-10 w-full px-1">
                            <ScoutBtn
                                label="Confirm Block"
                                color="purple"
                                disabled={rallyData.blockers.length === 0}
                                onClick={actions.confirmBlock}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // 9. COVER
        if (matchPhase === 'COVER') {
            return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <HintHeader label="COVER" value="Select Player" />
                    <div className="flex-1 min-h-0 flex items-center justify-center bg-orange-50 rounded-xl border-2 border-dashed border-orange-200 text-orange-600 animate-pulse mx-1 mb-2">
                        <span className="font-bold flex items-center gap-2 text-xs md:text-sm"><Shield className="w-5 h-5" /> Tap Player</span>
                    </div>
                </div>
            );
        }

        // 10. SUBS & SWAPS
        if (matchPhase === 'SUBSTITUTION' || matchPhase === 'LIBERO_SWAP') {
            return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <HintHeader label="ACTION" value={matchPhase.replace('_', ' ')} />
                    <div className="flex-1 min-h-0 flex flex-row items-center justify-center gap-3 bg-slate-50/50 rounded-xl border border-slate-200 p-2 mx-1 mb-2">
                        <div className={`flex-1 p-2 rounded-lg text-xs font-bold text-center transition-all ${!selectedPlayer ? 'bg-white text-blue-700 shadow-md ring-2 ring-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                            1. Bench/Libero
                        </div>
                        <ArrowRight size={20} className="text-slate-300" />
                        <div className={`flex-1 p-2 rounded-lg text-xs font-bold text-center transition-all ${selectedPlayer ? 'bg-white text-blue-700 shadow-md ring-2 ring-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                            2. Court Player
                        </div>
                    </div>
                </div>
            );
        }

        return <div className="flex items-center justify-center h-full text-slate-300 font-bold tracking-widest text-xs uppercase">Waiting...</div>;
    };

    return (
        <div className="h-28 md:h-32 w-full bg-white/95 backdrop-blur-2xl border-t border-slate-200/60 pt-2 px-2 md:pt-4 md:px-4 pb-2 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex-shrink-0">
            <div className="h-full w-full max-w-6xl mx-auto flex flex-col">
                <Content />
            </div>
        </div>
    );
}