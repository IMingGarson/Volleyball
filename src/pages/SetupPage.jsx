import { ArrowLeftRight, ArrowRight, Check, GripHorizontal, Loader2, RefreshCw, Settings, Shield, Trash2, Trophy, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import { THEME_MAP } from '../utils/constants';

const PlayerCard = ({ player, onDragStart, theme }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, player, null)}
        className="group relative bg-white rounded-xl p-3 flex items-center justify-between shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-grab active:cursor-grabbing mb-2"
    >
        <div className="flex items-center gap-4">
            <div className="text-gray-300 group-hover:text-gray-400"><GripHorizontal size={20} /></div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-black ${theme.softBg} ${theme.tint}`}>{player.number}</div>
            <div className="flex flex-col">
                <span className="text-base font-black text-gray-800 tracking-tight uppercase">{player.name}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{player.pos}</span>
            </div>
        </div>
        {player.isLibero && <Shield size={20} className={`${theme.tint} opacity-80`} />}
    </div>
);

const CourtBox = ({ positionLabel, index, player, libero, onDrop, onDragStart, onDragOver, onRemove, onRemoveLibero, theme, className }) => (
    <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={`relative rounded-xl transition-all duration-300 flex flex-col items-center justify-center overflow-visible w-full h-full
      ${player
                ? `bg-white shadow-lg border-2 ${theme.border} z-10`
                : 'bg-gray-50/80 border-2 border-dashed border-gray-300 hover:bg-white hover:border-gray-400'
            } ${className}`}
    >
        {!player && <span className="absolute text-[5rem] xl:text-[6rem] font-black text-gray-800 select-none pointer-events-none opacity-40">{positionLabel}</span>}

        {player ? (
            <div className="w-full h-full flex flex-col relative overflow-hidden rounded-xl">
                <div
                    draggable
                    onDragStart={(e) => onDragStart(e, player, index)}
                    className={`flex-1 w-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing group relative ${libero ? 'bg-gray-50/50' : ''}`}
                >
                    <span className={`${libero ? 'text-4xl' : 'text-7xl'} font-black tracking-tighter leading-none ${theme.tint}`}>{player.number}</span>
                    <span className={`${libero ? 'text-xs' : 'text-lg'} font-black uppercase tracking-tight mt-1 text-gray-800 text-center leading-none max-w-full truncate`}>{player.name}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="absolute top-1 right-1 text-gray-300 hover:text-red-500 bg-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    >
                        <Trash2 size={libero ? 14 : 18} />
                    </button>
                </div>

                {libero && (
                    <div
                        draggable
                        onDragStart={(e) => onDragStart(e, libero, 'LIBERO_ATTACHED')}
                        className="h-[40%] w-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing group relative bg-white border-t border-gray-100"
                    >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] font-bold px-2 rounded-full uppercase tracking-widest z-20">Libero</div>
                        <span className="text-3xl font-black tracking-tighter leading-none text-gray-800">{libero.number}</span>
                        <span className="text-[10px] font-black uppercase tracking-tight text-gray-500">{libero.name}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemoveLibero(); }}
                            className="absolute bottom-1 right-1 text-gray-300 hover:text-red-500 bg-gray-50 rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>
        ) : null}
    </div>
);

const HeadRef = ({ theme }) => (
    <div className="flex flex-col items-center justify-start pt-8 w-16 flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${theme.refColor} z-20`}>
            <User size={20} className="text-white" />
        </div>
        <div className="h-32 w-1.5 bg-gray-300 -mt-1 rounded-full relative">
            <div className="absolute top-8 -left-2 w-5 h-0.5 bg-gray-300"></div>
            <div className="absolute top-16 -left-2 w-5 h-0.5 bg-gray-300"></div>
            <div className="absolute top-24 -left-2 w-5 h-0.5 bg-gray-300"></div>
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase mt-2 text-center leading-tight">Head<br />Ref<br />(R1)</span>
    </div>
);

// --- MAIN SETUP PAGE ---

export default function SetupPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        availableTeams,
        loadAvailableTeams,
        setupData,
        setMatchTeams,
        setMatchRules, // Import the action
        updateTeamSetup,
        setNumber,
        startSet,
        resetMatch,
        isLoading
    } = useMatchStore();

    const [step, setStep] = useState(location.state?.jumpToStep || 1);
    const [selectedHome, setSelectedHome] = useState(null);
    const [selectedAway, setSelectedAway] = useState(null);
    const [matchRules, setLocalMatchRules] = useState({
        bestOf: 3,
        setPoints: 25,
        tiebreakPoints: 15
    });

    useEffect(() => {
        loadAvailableTeams();
    }, []);

    const [activeTab, setActiveTab] = useState('home');
    const [homeSide, setHomeSide] = useState('left');

    const handleNextStep = () => {
        if (step === 1) {
            if (!selectedHome || !selectedAway) return alert("Please select both teams.");
            if (selectedHome.id === selectedAway.id) return alert("Home and Away teams must be different.");
            setStep(2);
        } else if (step === 2) {
            setMatchTeams(selectedHome, selectedAway);
            setMatchRules(matchRules); // Persist rules to store
            setStep(3);
        }
    };

    const handleHardReset = () => {
        if (window.confirm("Reset match data and go back to team selection?")) {
            resetMatch();
            setStep(1);
            setSelectedHome(null);
            setSelectedAway(null);
        }
    };

    const activeTeam = setupData[activeTab];
    const assignedLibero = activeTeam?.liberoAssignment || { index: null, player: null };
    const registeredLibero = activeTeam?.registeredLibero || null;
    const theme = (activeTeam?.theme && THEME_MAP[activeTeam.theme]) ? THEME_MAP[activeTeam.theme] : THEME_MAP.orange;
    const isMirrored = (activeTab === 'away') !== (homeSide === 'right');

    const handleDragStart = (e, player, sourceIndex) => {
        e.dataTransfer.setData('dragPayload', JSON.stringify({ player, sourceIndex }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDropCourt = (e, targetIndex) => {
        e.preventDefault();
        const payloadRaw = e.dataTransfer.getData('dragPayload');
        if (!payloadRaw) return;
        const { player: draggedPlayer, sourceIndex } = JSON.parse(payloadRaw);

        let newBench = [...activeTeam.bench];
        let newCourt = [...activeTeam.court];
        let newLiberoAssignment = { ...assignedLibero };
        let newRegisteredLibero = registeredLibero;

        if (draggedPlayer.isLibero) {
            const isBackRow = [0, 1, 2].includes(targetIndex);
            const targetPlayer = newCourt[targetIndex];
            if (!isBackRow) return alert("Liberos can only play in Back Row (Zones 1, 6, 5).");
            if (!targetPlayer) return alert("Place a starting player here first.");

            newBench = newBench.filter(p => p.id !== draggedPlayer.id);
            if (newRegisteredLibero && newRegisteredLibero.id === draggedPlayer.id) newRegisteredLibero = null;
            if (newLiberoAssignment.player) newBench.push(newLiberoAssignment.player);

            newLiberoAssignment = { index: targetIndex, player: draggedPlayer };
            updateTeamSetup(activeTab, { bench: newBench, liberoAssignment: newLiberoAssignment, registeredLibero: newRegisteredLibero });
            return;
        }

        const playerAtTarget = newCourt[targetIndex];
        if (sourceIndex === null) {
            newBench = newBench.filter(p => p.id !== draggedPlayer.id);
            if (playerAtTarget) newBench.push(playerAtTarget);
            newCourt[targetIndex] = draggedPlayer;
        } else {
            newCourt[sourceIndex] = null;
            if (newLiberoAssignment.index === sourceIndex) newLiberoAssignment = { index: null, player: null };
            if (playerAtTarget) newCourt[sourceIndex] = playerAtTarget;
            newCourt[targetIndex] = draggedPlayer;
        }
        updateTeamSetup(activeTab, { bench: newBench, court: newCourt, liberoAssignment: newLiberoAssignment });
    };

    const handleRemoveFromCourt = (index) => {
        const player = activeTeam.court[index];
        if (!player) return;
        let newLiberoAssignment = { ...assignedLibero };
        let newBench = [...activeTeam.bench, player];
        if (newLiberoAssignment.index === index && newLiberoAssignment.player) {
            newBench.push(newLiberoAssignment.player);
            newLiberoAssignment = { index: null, player: null };
        }
        const newCourt = [...activeTeam.court];
        newCourt[index] = null;
        updateTeamSetup(activeTab, { court: newCourt, bench: newBench, liberoAssignment: newLiberoAssignment });
    };

    const handleRemoveLibero = () => {
        if (!assignedLibero.player) return;
        const newBench = [...activeTeam.bench, assignedLibero.player];
        updateTeamSetup(activeTab, { bench: newBench, liberoAssignment: { index: null, player: null } });
    };

    const validateAndStart = () => {
        const hC = setupData.home.court.filter(Boolean).length;
        const aC = setupData.away.court.filter(Boolean).length;
        if (hC !== 6 || aC !== 6) return alert(`Both teams must have 6 starting players!\nHome: ${hC}/6\nAway: ${aC}/6`);
        startSet();
        navigate('/track');
    };

    const frontRowIndices = [3, 4, 5];
    const backRowIndices = [2, 1, 0];
    const positionLabels = { 3: '4', 4: '3', 5: '2', 2: '5', 1: '6', 0: '1' };

    if (step === 1) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                    <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter">Match Setup</h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-1">Step 1: Select Teams</p>
                        </div>
                        {isLoading && <Loader2 className="animate-spin text-blue-400" />}
                    </div>

                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-slate-100 p-2 rounded-lg"><Users size={24} className="text-slate-600" /></div>
                                <span className="font-black text-xl uppercase text-slate-800 tracking-wide">Home Team</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-2">
                                {availableTeams.map(team => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedHome(team)}
                                        disabled={selectedAway?.id === team.id}
                                        className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${selectedHome?.id === team.id ? `border-${THEME_MAP[team.theme].border.split('-')[1]} bg-${team.theme}-50 ring-2 ring-${team.theme}-200` : 'border-slate-100 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                                    >
                                        <span className={`font-black uppercase ${selectedHome?.id === team.id ? THEME_MAP[team.theme].tint : 'text-slate-600'}`}>{team.name}</span>
                                        {selectedHome?.id === team.id && <Check size={20} className={THEME_MAP[team.theme].tint} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-slate-100 p-2 rounded-lg"><Users size={24} className="text-slate-600" /></div>
                                <span className="font-black text-xl uppercase text-slate-800 tracking-wide">Away Team</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-2">
                                {availableTeams.map(team => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedAway(team)}
                                        disabled={selectedHome?.id === team.id}
                                        className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${selectedAway?.id === team.id ? `border-${THEME_MAP[team.theme].border.split('-')[1]} bg-${team.theme}-50 ring-2 ring-${team.theme}-200` : 'border-slate-100 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                                    >
                                        <span className={`font-black uppercase ${selectedAway?.id === team.id ? THEME_MAP[team.theme].tint : 'text-slate-600'}`}>{team.name}</span>
                                        {selectedAway?.id === team.id && <Check size={20} className={THEME_MAP[team.theme].tint} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-slate-100 flex justify-end">
                        <button onClick={handleNextStep} disabled={!selectedHome || !selectedAway} className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                            Next Step <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                    <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter">Match Rules</h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-1">Step 2: Configuration</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                        </div>
                    </div>

                    <div className="p-10 space-y-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Match Format</label>
                            <div className="grid grid-cols-2 gap-4">
                                {[3, 5].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setLocalMatchRules({ ...matchRules, bestOf: num })}
                                        className={`p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${matchRules.bestOf === num ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <Trophy size={32} className={matchRules.bestOf === num ? 'text-blue-500' : 'text-slate-300'} />
                                        <span className="font-black text-lg">BEST OF {num}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Points per Set</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={matchRules.setPoints}
                                        onChange={(e) => setLocalMatchRules({ ...matchRules, setPoints: parseInt(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-2xl text-center focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">PTS</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tiebreak Points</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={matchRules.tiebreakPoints}
                                        onChange={(e) => setLocalMatchRules({ ...matchRules, tiebreakPoints: parseInt(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-2xl text-center focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">PTS</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-slate-100 flex justify-between">
                        <button onClick={() => setStep(1)} className="text-slate-400 font-bold uppercase text-xs hover:text-slate-600 transition-colors">Back</button>
                        <button onClick={handleNextStep} className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 transition-all">
                            Confirm & Setup Lineup <Check size={20} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] font-sans text-gray-900 flex flex-col">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${theme.gradient} text-white shadow-sm`}><Users size={20} /></div>
                    <div><h1 className="text-lg font-bold text-gray-900 leading-tight">Set {setNumber} Lineup</h1><span className="text-xs font-medium text-gray-500">Configure Lineups</span></div>
                </div>
                <div className="flex gap-3 items-center">
                    <button onClick={() => { if (window.confirm('Re-select teams?')) { resetMatch(); setStep(1); } }} className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Change Teams"><Settings size={18} /></button>
                    <button onClick={handleHardReset} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><RefreshCw size={18} /></button>
                    <button onClick={validateAndStart} className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2 transition-all active:scale-95">Start Match <ArrowRight size={16} /></button>
                </div>
            </header>

            <div className="flex justify-center items-center pt-8 pb-4 gap-4">
                <div className="bg-gray-200/50 p-1 rounded-full flex relative">
                    {['home', 'away'].map(side => {
                        const isActive = activeTab === side;
                        return (
                            <button key={side} onClick={() => setActiveTab(side)} className={`relative px-8 py-2 rounded-full text-sm font-bold transition-all duration-200 z-10 ${isActive ? 'text-gray-900 shadow-sm bg-white' : 'text-gray-500 hover:text-gray-700'}`}>{setupData[side].name}</button>
                        );
                    })}
                </div>
                <button onClick={() => setHomeSide(prev => prev === 'left' ? 'right' : 'left')} className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-indigo-600 border border-gray-200 transition-colors" title="Swap Court Sides"><ArrowLeftRight size={20} /></button>
            </div>

            <div className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-[800px]">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <h3 className="text-xl font-bold text-gray-900">Roster</h3>
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{activeTeam?.bench.length || 0} Avail</span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {activeTeam?.bench.map(p => <PlayerCard key={p.id} player={p} onDragStart={handleDragStart} theme={theme} />)}
                        {activeTeam?.liberos.map(p => <PlayerCard key={p.id} player={p} onDragStart={handleDragStart} theme={theme} />)}
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-[800px] relative">
                    <div className={`flex-1 flex gap-4 ${isMirrored ? 'flex-row-reverse' : 'flex-row'}`}>
                        <HeadRef theme={theme} />
                        <div className={`flex-1 relative rounded-lg border-4 ${theme.courtLines} bg-gray-50/30 p-2 flex flex-col`}>
                            <div className="grid grid-cols-3 gap-4 h-[33%] mb-4 border-b-4 border-dashed border-red-200/50 relative">
                                {frontRowIndices.map(idx => (
                                    <CourtBox key={idx} index={idx} positionLabel={positionLabels[idx]} player={activeTeam?.court[idx]} libero={null} onDrop={(e) => handleDropCourt(e, idx)} onDragStart={handleDragStart} onDragOver={e => e.preventDefault()} onRemove={() => handleRemoveFromCourt(idx)} onRemoveLibero={() => { }} theme={theme} />
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-4 h-[66%] relative">
                                {backRowIndices.map(idx => {
                                    const isLiberoHere = assignedLibero.index === idx;
                                    return (
                                        <div key={idx} className="relative w-full h-full">
                                            <CourtBox index={idx} positionLabel={positionLabels[idx]} player={activeTeam?.court[idx]} libero={isLiberoHere ? assignedLibero.player : null} onDrop={(e) => handleDropCourt(e, idx)} onDragStart={handleDragStart} onDragOver={e => e.preventDefault()} onRemove={() => handleRemoveFromCourt(idx)} onRemoveLibero={handleRemoveLibero} theme={theme} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}