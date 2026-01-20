import {
    Activity, AlertCircle, ArrowRight, ArrowUpCircle, Ban, CheckCircle,
    Crosshair, Disc, FastForward, Feather, Hand, RotateCcw, Shield,
    Trophy, XCircle, Zap
} from 'lucide-react';

export default function ControlPanel({ state, actions }) {
    const { matchPhase, rallyData, selectedPlayer } = state;
    const p = selectedPlayer;

    // --- SHARED COMPONENTS ---

    /**
     * ScoutBtn: Soft UI with large typography for quick scanning
     */
    const ScoutBtn = ({ label, sub, icon: Icon, color = 'slate', onClick, disabled, className = "" }) => {
        // Soft, tinted backgrounds for less visual noise
        const styles = {
            green: "bg-emerald-50  text-emerald-800  border-emerald-200  hover:bg-emerald-100  hover:border-emerald-300",
            red: "bg-rose-50     text-rose-800     border-rose-200     hover:bg-rose-100     hover:border-rose-300",
            blue: "bg-blue-50     text-blue-800     border-blue-200     hover:bg-blue-100     hover:border-blue-300",
            orange: "bg-amber-50    text-amber-800    border-amber-200    hover:bg-amber-100    hover:border-amber-300",
            purple: "bg-violet-50   text-violet-800   border-violet-200   hover:bg-violet-100   hover:border-violet-300",
            slate: "bg-slate-100   text-slate-700    border-slate-200    hover:bg-slate-200    hover:border-slate-300",
            white: "bg-white       text-slate-600    border-slate-200    hover:bg-slate-50     hover:border-slate-300",
        };

        const activeStyle = styles[color] || styles.white;

        return (
            <button
                onClick={!disabled ? onClick : undefined}
                disabled={disabled}
                className={`
                    group relative flex flex-col items-center justify-center 
                    w-full h-full rounded-lg border-b-4 transition-all duration-75 ease-out
                    active:border-b-0 active:translate-y-1 active:shadow-inner
                    ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}
                    ${activeStyle}
                    ${className}
                `}
            >
                <div className="flex flex-col items-center leading-tight">
                    {/* Responsive Icon Size */}
                    {Icon && <Icon className="mb-1 opacity-60 group-hover:opacity-100 w-5 h-5 md:w-6 md:h-6" />}

                    {/* Large, Clear Text */}
                    <span className="text-sm md:text-base font-black uppercase tracking-tight">
                        {label}
                    </span>

                    {/* Contextual Subtitle */}
                    {sub && (
                        <span className="text-[10px] md:text-xs font-semibold opacity-50 mt-0.5">
                            {sub}
                        </span>
                    )}
                </div>
            </button>
        );
    };

    /**
     * HintHeader: "Hint Style"
     * Stacked layout: Label on top (tiny), Value below (large).
     * Ensures context is visible on all screen sizes (PC & Tablet).
     */
    const HintHeader = ({ label, value, highlightValue = false }) => (
        <div className="flex items-center justify-between px-1 pb-1 mb-1 border-b border-slate-100 min-h-[38px]">
            {/* Left: Undo Button (Fixed Width) */}
            <div className="w-[70px] flex justify-start">
                <button
                    onClick={actions.undo}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-md text-[10px] md:text-xs font-bold transition-all active:scale-95"
                >
                    <RotateCcw size={12} /> UNDO
                </button>
            </div>

            {/* Center: Stacked Hint Label & Dynamic Value */}
            <div className="flex-1 flex flex-col items-center justify-center leading-none overflow-hidden">
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    {label}
                </span>
                <span className={`text-sm md:text-lg font-black uppercase tracking-wide truncate max-w-full ${highlightValue ? 'text-indigo-600' : 'text-slate-800'}`}>
                    {value}
                </span>
            </div>

            {/* Right: Spacer to keep center alignment perfect */}
            <div className="w-[70px]"></div>
        </div>
    );

    // --- CONTENT RENDERER ---

    const Content = () => {
        // 1. SERVE
        if (matchPhase === 'SERVE' && p) {
            const step = !rallyData.serveType ? 1 : 2;
            return (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <HintHeader label="Service" value={p.name} highlightValue />
                    {step === 1 ? (
                        <div className="grid grid-cols-3 gap-2 flex-1">
                            <ScoutBtn label="Float" color="white" icon={Disc} onClick={() => actions.setServeType('FLOAT')} />
                            <ScoutBtn label="Topspin" color="white" icon={Zap} onClick={() => actions.setServeType('TOPSPIN')} />
                            <ScoutBtn label="Jump" color="white" icon={ArrowUpCircle} onClick={() => actions.setServeType('JUMP')} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 flex-1">
                            <ScoutBtn label="Ace" sub="Point" color="green" icon={Trophy} onClick={() => actions.setServeResult('ACE')} />
                            <ScoutBtn label="In Play" sub="Rally" color="blue" icon={ArrowRight} onClick={() => actions.setServeResult('IN_PLAY')} />
                            <ScoutBtn label="Error" sub="Fault" color="red" icon={XCircle} onClick={() => actions.setServeResult('ERROR')} />
                        </div>
                    )}
                </div>
            );
        }

        // 2. LANDING ZONES
        if (matchPhase === 'SERVE_LANDING' || matchPhase === 'LANDING') {
            return (
                <div className="flex flex-col h-full animate-in fade-in duration-200">
                    <HintHeader label="Location" value="Select Landing Zone" />
                    <div className="flex-1 flex flex-col items-center justify-center bg-emerald-50/50 rounded-lg border-2 border-dashed border-emerald-300/30 text-emerald-600/80 p-1">
                        <div className="animate-pulse flex flex-col items-center">
                            <Crosshair className="w-6 h-6 md:w-8 md:h-8 mb-1" />
                            <span className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-center">Tap Court Grid</span>
                        </div>
                    </div>
                </div>
            );
        }

        // 3. RECEPTION
        if (matchPhase === 'RECEPTION') {
            if (!p) return (
                <div className="flex flex-col h-full animate-in fade-in duration-200">
                    <HintHeader label="Reception" value="Select Receiver" />
                    <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-300 text-slate-400">
                        <span className="font-bold flex items-center gap-2 text-sm md:text-base"><Shield className="w-5 h-5" /> Tap Player on Court</span>
                    </div>
                </div>
            );
            return (
                <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-200">
                    <HintHeader label="Reception" value={p.name} highlightValue />
                    <div className="grid grid-cols-4 gap-2 flex-1">
                        <ScoutBtn label="Err" sub="0" color="red" icon={XCircle} onClick={() => actions.setReception(0, p)} />
                        <ScoutBtn label="1" sub="Poor" color="orange" icon={AlertCircle} onClick={() => actions.setReception(1, p)} />
                        <ScoutBtn label="2" sub="Good" color="blue" icon={Shield} onClick={() => actions.setReception(2, p)} />
                        <ScoutBtn label="3" sub="Perf" color="green" icon={CheckCircle} onClick={() => actions.setReception(3, p)} />
                    </div>
                </div>
            );
        }

        // 4. SET
        if (matchPhase === 'SET') {
            if (!p) return (
                <div className="flex flex-col h-full animate-in fade-in duration-200">
                    <HintHeader label="Set" value="Select Setter" />
                    <div className="flex-1 flex flex-row gap-2">
                        <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-300 text-slate-400">
                            <span className="font-bold flex items-center gap-2 text-sm md:text-base"><Hand className="w-5 h-5" /> Tap Setter</span>
                        </div>
                        <div className="w-1/3">
                            <ScoutBtn
                                label="No Set"
                                sub="Atk on 2"
                                color="orange"
                                icon={FastForward}
                                onClick={actions.skipSet}
                            />
                        </div>
                    </div>
                </div>
            );
            return (
                <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-200">
                    <HintHeader label="Set Call" value={p.name} highlightValue />
                    <div className="grid grid-cols-4 gap-2 flex-1">
                        {['High', 'Quick', 'Pipe', 'Dump'].map(t => (
                            <ScoutBtn key={t} label={t} color="white" onClick={() => actions.setSetType(t)} />
                        ))}
                    </div>
                </div>
            );
        }

        // 5. ATTACK
        if (matchPhase === 'ATTACK') {
            if (!p) return (
                <div className="flex flex-col h-full animate-in fade-in duration-200">
                    <HintHeader label="Attack" value="Select Attacker" />
                    <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-300 text-slate-400">
                        <span className="font-bold flex items-center gap-2 text-sm md:text-base"><Activity className="w-5 h-5" /> Tap Attacker</span>
                    </div>
                </div>
            );
            return (
                <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-200">
                    <HintHeader label="Attack" value={p.name} highlightValue />
                    <div className="grid grid-cols-3 gap-2 flex-1">
                        <ScoutBtn label="Spike" sub="Hard" color="slate" icon={Zap} onClick={() => actions.setAttackType('Spike')} />
                        <ScoutBtn label="Tip" sub="Soft" color="white" icon={Feather} onClick={() => actions.setAttackType('Tip')} />
                        <ScoutBtn label="Back Row" sub="Pipe/Bic" color="white" icon={ArrowUpCircle} onClick={() => actions.setAttackType('BackRow')} />
                    </div>
                </div>
            );
        }

        // 6. DIG / DECISION
        if (matchPhase === 'DIG_DECISION') {
            return (
                <div className="flex flex-col h-full animate-in fade-in duration-200">
                    <HintHeader label="Result" value={p ? p.name : "Rally Outcome"} highlightValue />
                    <div className="grid grid-cols-4 gap-2 flex-1">
                        <ScoutBtn label="Kill" sub="Point" color="green" icon={Trophy} onClick={() => actions.setAttackResult('KILL')} />
                        <ScoutBtn label="Dig" sub="Cont." color="blue" icon={Shield} onClick={() => actions.setAttackResult('DIG')} />
                        <ScoutBtn label="Block" sub="Deflect" color="purple" icon={Ban} onClick={() => actions.blockDetected()} />
                        <ScoutBtn label="Error" sub="Out/Net" color="red" icon={XCircle} onClick={() => actions.setAttackResult('ERROR')} />
                    </div>
                </div>
            );
        }

        // 7. BLOCK RESULT
        if (matchPhase === 'BLOCK_RESULT') {
            return (
                <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
                    <HintHeader label="Defense" value="Block Outcome" />
                    <div className="grid grid-cols-4 gap-2 flex-1">
                        <ScoutBtn label="Shut" sub="Point" color="purple" icon={Ban} onClick={() => actions.blockOutcome('SHUTDOWN')} />
                        <ScoutBtn label="Soft" sub="Play On" color="blue" icon={Activity} onClick={() => actions.blockOutcome('SOFT_BLOCK')} />
                        <ScoutBtn label="Cover" sub="Rebound" color="orange" icon={RotateCcw} onClick={() => actions.blockOutcome('REBOUND')} />
                        <ScoutBtn label="Tool" sub="Out" color="green" icon={Trophy} onClick={() => actions.blockOutcome('TOUCH_OUT')} />
                    </div>
                </div>
            );
        }

        // 8. BLOCKER SELECTION
        if (matchPhase === 'SELECT_BLOCKERS') {
            return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <HintHeader label="Stats" value="Assign Blockers" />
                    <div className="flex flex-col flex-1 gap-2">
                        <div className="flex-1 bg-violet-50/50 rounded-lg border-2 border-violet-100 flex items-center justify-center p-2">
                            <span className="text-lg md:text-xl font-black text-violet-800 text-center uppercase tracking-tight">
                                {rallyData.blockers.length > 0 ? rallyData.blockers.map(b => b.name).join(' + ') : 'Select Players...'}
                            </span>
                        </div>
                        <div className="h-10 md:h-12">
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
                    <HintHeader label="Defense" value="Select Cover" />
                    <div className="flex-1 flex items-center justify-center bg-orange-50/50 rounded-lg border-2 border-dashed border-orange-200 text-orange-500 animate-pulse">
                        <span className="font-bold flex items-center gap-2 text-sm md:text-base"><Shield className="w-5 h-5" /> Tap Player</span>
                    </div>
                </div>
            );
        }

        // 10. SUBS & SWAPS
        if (matchPhase === 'SUBSTITUTION' || matchPhase === 'LIBERO_SWAP') {
            return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <HintHeader label="Action" value={matchPhase.replace('_', ' ')} />
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-slate-50/50 rounded-lg border border-slate-200 p-2">
                        <div className="text-center w-full max-w-sm">
                            <div className={`p-2 rounded border text-xs md:text-sm font-bold transition-all mb-2 ${!selectedPlayer ? 'bg-white border-blue-500 text-blue-600 shadow-md scale-105' : 'bg-slate-100 text-slate-400 border-transparent'}`}>
                                1. Select Bench/Libero
                            </div>
                            <div className="h-4 w-0.5 bg-slate-300 mx-auto mb-2"></div>
                            <div className={`p-2 rounded border text-xs md:text-sm font-bold transition-all ${selectedPlayer ? 'bg-white border-blue-500 text-blue-600 shadow-md scale-105' : 'bg-slate-100 text-slate-400 border-transparent'}`}>
                                2. Select Court Player
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return <div className="flex items-center justify-center h-full text-slate-300 font-bold tracking-widest text-sm uppercase">Waiting...</div>;
    };

    return (
        // Optimized Height: h-32 (mobile) to h-40 (tablet/desktop)
        <div className="h-32 md:h-40 w-full bg-white/95 backdrop-blur-xl border-t border-slate-200 p-1 md:p-2 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] flex-shrink-0">
            <div className="h-full w-full max-w-6xl mx-auto">
                <Content />
            </div>
        </div>
    );
}