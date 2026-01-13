// src/components/volleyball/ControlPanel.jsx
import { Activity, AlertCircle, ArrowRight, ArrowUpCircle, Ban, CheckCircle, Crosshair, Disc, Feather, Hand, RotateCcw, Shield, Target, Trophy, XCircle, Zap } from 'lucide-react';
import { ActionBtn, PrettyButton } from '../common/ActionButtons';

export default function ControlPanel({ state, actions }) {
    const { matchPhase, rallyData, selectedPlayer } = state;
    const p = selectedPlayer;

    const UndoBtn = () => (<button onClick={actions.undo} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all active:scale-95 shadow-md"><RotateCcw size={12} /><span className="text-[10px] md:text-xs font-bold">UNDO</span></button>);
    const ControlHeader = ({ title, rightContent }) => (<div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2 shrink-0 min-h-[32px]"><div className="flex-shrink-0 w-24 flex justify-start"><UndoBtn /></div><div className="flex-1 flex justify-center text-center">{title}</div><div className="flex-shrink-0 w-24 flex justify-end">{rightContent}</div></div>);

    const containerClass = "h-32 md:h-40 bg-white border-t border-slate-200 p-2 z-40 shadow-[0_-5px_30px_rgba(0,0,0,0.1)] flex-shrink-0";
    const innerClass = "h-full max-w-7xl mx-auto flex items-center justify-center";

    const Content = () => {
        if (matchPhase === 'SERVE' && p) {
            const step = !rallyData.serveType ? 1 : 2;
            return (
                <div className="flex flex-col w-full h-full">
                    <ControlHeader title={<span className="font-bold text-slate-700 flex items-center gap-2 text-base md:text-lg"><Zap size={20} className="text-yellow-500" /> {p.name} SERVE</span>} rightContent={<div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full"><span className={step === 1 ? "text-slate-800" : ""}>TYPE</span><ArrowRight size={8} /><span className={step === 2 ? "text-slate-800" : ""}>RES</span></div>} />
                    <div className="flex-1 relative">
                        {step === 1 ? (
                            <div className="grid grid-cols-3 gap-3 h-full pb-1">{['FLOAT', 'TOPSPIN', 'JUMP'].map(t => <PrettyButton key={t} title={t} icon={Disc} colorClass="bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-900" onClick={() => actions.setServeType(t)} />)}</div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 h-full pb-1">
                                <PrettyButton title="ACE" subtitle="Direct Point" icon={Trophy} colorClass="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" onClick={() => actions.setServeResult('ACE')} />
                                <PrettyButton title="IN PLAY" subtitle="Start Rally" icon={ArrowRight} colorClass="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => actions.setServeResult('IN_PLAY')} />
                                <PrettyButton title="FAULT" subtitle="Net / Out" icon={XCircle} colorClass="bg-red-50 border-red-200 text-red-700 hover:bg-red-100" onClick={() => actions.setServeResult('ERROR')} />
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        if (matchPhase === 'SERVE_LANDING') return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-black uppercase text-slate-700 text-base md:text-lg">SELECT LANDING ZONE</span>} /><div className="flex-1 flex flex-col items-center justify-center text-blue-600 animate-pulse bg-blue-50/50 rounded-lg border-2 border-dashed border-blue-200"><Crosshair size={40} className="mb-2" /><span className="text-xs font-bold text-slate-400">Where did the ball drop?</span></div></div>);
        if (matchPhase === 'RECEPTION') {
            if (!p) return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-400 text-base md:text-lg">SELECT RECEIVER</span>} /><div className="flex-1 flex items-center justify-center animate-pulse text-blue-600 font-black text-xl gap-2"><Shield size={32} /> TAP PLAYER</div></div>);
            return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-700 text-base md:text-lg flex items-center gap-2"><Shield size={20} /> PASS QUALITY: {p.name}</span>} /><div className="grid grid-cols-4 gap-2 h-full pb-1 flex-1"><PrettyButton title="ERROR" subtitle="Ace" icon={XCircle} colorClass="bg-red-50 border-red-200 text-red-700" onClick={() => actions.setReception(0, p)} /><PrettyButton title="POOR" subtitle="1" icon={AlertCircle} colorClass="bg-orange-50 border-orange-200 text-orange-700" onClick={() => actions.setReception(1, p)} /><PrettyButton title="GOOD" subtitle="2" icon={Shield} colorClass="bg-blue-50 border-blue-200 text-blue-700" onClick={() => actions.setReception(2, p)} /><PrettyButton title="PERFECT" subtitle="3" icon={CheckCircle} colorClass="bg-green-50 border-green-200 text-green-700" onClick={() => actions.setReception(3, p)} /></div></div>);
        }
        if (matchPhase === 'SET') {
            if (!p) return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-400 text-base md:text-lg">SELECT SETTER</span>} /><div className="flex-1 flex items-center justify-center animate-pulse text-slate-500 font-bold text-xl gap-2"><Hand size={32} /> TAP PLAYER</div></div>);
            return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-700 text-base md:text-lg flex items-center gap-2"><Hand size={20} /> CALL: {p.name}</span>} /><div className="grid grid-cols-4 gap-2 h-full pb-1 flex-1">{['High', 'Quick', 'Pipe', 'Dump'].map(t => (<PrettyButton key={t} title={t} colorClass="bg-white border-slate-200 text-slate-700 hover:border-slate-400" onClick={() => actions.setSetType(t)} />))}</div></div>);
        }
        if (matchPhase === 'ATTACK') {
            if (!p) return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-400 text-base md:text-lg">SELECT ATTACKER</span>} /><div className="flex-1 flex items-center justify-center animate-pulse text-red-600 font-black text-xl gap-2"><Activity size={32} /> TAP PLAYER</div></div>);
            return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-700 text-base md:text-lg flex items-center gap-2"><Activity size={20} /> ATTACK: {p.name}</span>} /><div className="grid grid-cols-3 gap-2 h-full pb-1 flex-1"><PrettyButton title="SPIKE" subtitle="Hard Hit" icon={Zap} colorClass="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" onClick={() => actions.setAttackType('Spike')} /><PrettyButton title="TIP" subtitle="Soft Touch" icon={Feather} colorClass="bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100" onClick={() => actions.setAttackType('Tip')} /><PrettyButton title="BACK ROW" subtitle="Pipe/Bic" icon={ArrowUpCircle} colorClass="bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100" onClick={() => actions.setAttackType('BackRow')} /></div></div>);
        }
        if (matchPhase === 'LANDING') return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-black uppercase text-slate-700 text-base md:text-lg">SELECT LANDING ZONE</span>} /><div className="flex-1 flex flex-col items-center justify-center text-green-600 animate-pulse"><Target size={40} className="mb-1" /></div></div>);
        if (matchPhase === 'DIG_DECISION') { const isP = !!p; return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-700 text-base md:text-lg">TARGET: {isP ? p.name : 'Unknown'} (Zone Hit)</span>} rightContent={<button onClick={actions.cancel} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline">CHANGE ZONE</button>} /><div className="grid grid-cols-4 gap-2 h-full pb-1 flex-1"><PrettyButton title="KILL" subtitle="Point" icon={Trophy} colorClass="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" onClick={() => actions.setAttackResult('KILL')} /><PrettyButton title="BLOCKED" subtitle="Deflect" icon={Ban} colorClass="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" onClick={() => actions.blockDetected()} /><PrettyButton title="DIG" subtitle="Continue" icon={Shield} colorClass="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => actions.setAttackResult('DIG')} /><PrettyButton title="OUT/NET" subtitle="Error" icon={XCircle} colorClass="bg-red-50 border-red-200 text-red-700 hover:bg-red-100" onClick={() => actions.setAttackResult('ERROR')} /></div></div>); }
        if (matchPhase === 'BLOCK_RESULT') return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-purple-700 text-base md:text-lg">BLOCK DETECTED</span>} /><div className="grid grid-cols-4 gap-2 h-full pb-1 flex-1"><PrettyButton title="TOUCH OUT" subtitle="Attacker Point" icon={Trophy} colorClass="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" onClick={() => actions.blockOutcome('TOUCH_OUT')} /><PrettyButton title="SHUTDOWN" subtitle="Defender Point" icon={Ban} colorClass="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" onClick={() => actions.blockOutcome('SHUTDOWN')} /><PrettyButton title="SOFT BLOCK" subtitle="Touch/Play On" icon={Activity} colorClass="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => actions.blockOutcome('SOFT_BLOCK')} /><PrettyButton title="REBOUND" subtitle="Cover (Atk Team)" icon={RotateCcw} colorClass="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => actions.blockOutcome('REBOUND')} /></div></div>)
        if (matchPhase === 'SELECT_BLOCKERS') return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-purple-700 text-base md:text-lg">SELECT BLOCKERS</span>} rightContent={<span className="text-[9px] text-slate-400 font-bold leading-tight text-right">TAP<br />PLAYERS</span>} /><div className="flex gap-2 h-full pb-1 flex-1"><div className="flex-1 bg-purple-50 border-2 border-purple-100 rounded-lg flex items-center justify-center p-2 text-purple-900 text-sm font-bold text-center">{rallyData.blockers.length > 0 ? rallyData.blockers.map(b => b.name).join(', ') : 'Select Players...'}</div><button onClick={actions.confirmBlock} disabled={rallyData.blockers.length === 0} className="w-1/3 bg-purple-600 text-white font-black rounded-lg disabled:opacity-50 hover:bg-purple-700 shadow-md">CONFIRM</button></div></div>)
        if (matchPhase === 'COVER') return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-orange-600 text-base md:text-lg">SELECT COVER</span>} /><div className="flex-1 flex items-center justify-center animate-pulse text-orange-500 font-black text-xl gap-2"><Shield size={32} /> TAP PLAYER</div></div>)

        if (matchPhase === 'SUBSTITUTION' || matchPhase === 'LIBERO_SWAP') return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-4 relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl m-2">
                <div className="absolute top-2 left-2"><UndoBtn /></div>
                <div className="text-center mt-4">
                    <span className="font-black text-slate-700 uppercase tracking-widest text-xl">{matchPhase.replace('_', ' ')}</span>
                    <p className="text-xs font-bold text-slate-400 mt-1">Select Players to Swap</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white shadow-sm border px-4 py-2 rounded-full">
                    <span className={selectedPlayer ? "text-green-600" : "animate-pulse"}>1. Select Bench/Libero</span>
                    <ArrowRight size={14} />
                    <span>2. Select Back Row Player</span>
                </div>
                <div className="mt-2">
                    <ActionBtn onClick={actions.cancel} variant="neutral" className="px-8 py-2">CANCEL ACTION</ActionBtn>
                </div>
            </div>
        )

        return <div className="text-slate-400 h-full flex items-center justify-center text-sm">Loading...</div>;
    };

    return <div className={containerClass}><div className={innerClass}><Content /></div></div>;
}