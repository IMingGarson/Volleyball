import { ArrowLeftRight, ArrowRight, GripHorizontal, Loader2, RefreshCw, Shield, Trash2, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';

// --- THEME ENGINE ---
const THEME_MAP = {
    orange: {
        name: 'Karasuno',
        tint: 'text-[#ff7b00]', border: 'border-[#ff7b00]', bgTint: 'bg-[#ff7b00]',
        softBg: 'bg-orange-50', ring: 'ring-[#ff7b00]/50', gradient: 'from-[#ff7b00] to-[#c75c14]',
        courtLines: 'border-orange-200',
        refColor: 'bg-orange-800'
    },
    red: {
        name: 'Nekoma',
        tint: 'text-[#d9202a]', border: 'border-[#d9202a]', bgTint: 'bg-[#d9202a]',
        softBg: 'bg-red-50', ring: 'ring-[#d9202a]/50', gradient: 'from-[#d9202a] to-[#9e212d]',
        courtLines: 'border-red-200',
        refColor: 'bg-red-800'
    }
};

// --- COMPONENT: PLAYER CARD ---
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

// --- COMPONENT: COURT BOX ---
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
        ) : (
            null
        )}
    </div>
);

// --- COMPONENT: HEAD REF ---
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

export default function SetupPage() {
    const navigate = useNavigate();
    const { setupData, updateTeamSetup, setNumber, startSet, fetchRosters, isLoading, resetMatch } = useMatchStore();
    const [activeTab, setActiveTab] = useState('home');

    // 'left' means Home Team starts on the Left of the Ref. 'right' means they start on the Right.
    const [homeSide, setHomeSide] = useState('left');

    useEffect(() => {
        if (setupData.home.bench.length === 0 && setupData.home.court.every(p => p === null)) fetchRosters();
    }, []);

    const activeTeam = setupData[activeTab];
    const assignedLibero = activeTeam.liberoAssignment || { index: null, player: null };
    const registeredLibero = activeTeam.registeredLibero || null;
    const theme = (activeTeam.theme && THEME_MAP[activeTeam.theme]) ? THEME_MAP[activeTeam.theme] : (activeTab === 'home' ? THEME_MAP.orange : THEME_MAP.red);

    // --- LOGIC: CALCULATE MIRROR STATE ---
    // If Home starts Left: Home Tab = Standard(False), Away Tab = Mirrored(True)
    // If Home starts Right: Home Tab = Mirrored(True), Away Tab = Standard(False)
    const isMirrored = (activeTab === 'away') !== (homeSide === 'right');

    // --- DRAG LOGIC ---
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

        // --- LIBERO ONTO COURT ---
        if (draggedPlayer.isLibero) {
            // Can only replace back row (Indices 0, 1, 2)
            const isBackRow = [0, 1, 2].includes(targetIndex);
            const targetPlayer = newCourt[targetIndex];

            if (!isBackRow) return alert("Liberos can only play in Back Row (Zones 1, 6, 5).");
            if (!targetPlayer) return alert("Place a starting player here first.");

            // Cleanup Source
            newBench = newBench.filter(p => p.id !== draggedPlayer.id);
            if (newRegisteredLibero && newRegisteredLibero.id === draggedPlayer.id) newRegisteredLibero = null;
            if (newLiberoAssignment.player && newLiberoAssignment.player.id === draggedPlayer.id) { }
            else if (newLiberoAssignment.player) newBench.push(newLiberoAssignment.player);

            newLiberoAssignment = { index: targetIndex, player: draggedPlayer };
            updateTeamSetup(activeTab, { bench: newBench, liberoAssignment: newLiberoAssignment, registeredLibero: newRegisteredLibero });
            return;
        }

        // --- STANDARD PLAYER ---
        const playerAtTarget = newCourt[targetIndex];

        if (sourceIndex === null) {
            newBench = newBench.filter(p => p.id !== draggedPlayer.id);
            if (playerAtTarget) newBench.push(playerAtTarget);
            newCourt[targetIndex] = draggedPlayer;
        } else if (sourceIndex === 'LIBERO_SLOT') {
            // Prevent accidental drag from libero slot if logic allows non-libero there
        } else {
            newCourt[sourceIndex] = null;
            if (newLiberoAssignment.index === sourceIndex) newLiberoAssignment = { index: null, player: null };
            if (playerAtTarget) newCourt[sourceIndex] = playerAtTarget;
            newCourt[targetIndex] = draggedPlayer;
        }
        updateTeamSetup(activeTab, { bench: newBench, court: newCourt, liberoAssignment: newLiberoAssignment });
    };

    const handleRegisterLibero = (e) => {
        e.preventDefault();
        const { player, sourceIndex } = JSON.parse(e.dataTransfer.getData('dragPayload'));
        if (!player.isLibero) return alert("Only Liberos allowed here.");

        let newBench = [...activeTeam.bench];
        let newLiberoAssignment = { ...assignedLibero };

        if (sourceIndex === null) newBench = newBench.filter(p => p.id !== player.id);
        if (sourceIndex === 'LIBERO_ATTACHED') newLiberoAssignment = { index: null, player: null };

        if (registeredLibero) newBench.push(registeredLibero);

        updateTeamSetup(activeTab, { bench: newBench, registeredLibero: player, liberoAssignment: newLiberoAssignment });
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

    const handleRemoveRegisteredLibero = () => {
        if (!registeredLibero) return;
        const newBench = [...activeTeam.bench, registeredLibero];
        updateTeamSetup(activeTab, { bench: newBench, registeredLibero: null });
    }

    const validateAndStart = () => {
        const hC = setupData.home.court.filter(Boolean).length;
        const aC = setupData.away.court.filter(Boolean).length;
        if (hC !== 6 || aC !== 6) return alert(`Both teams must have 6 starting players!\nHome: ${hC}/6\nAway: ${aC}/6`);
        startSet();
        navigate('/track');
    };

    const handleHardReset = () => { if (window.confirm("Reset match data?")) { resetMatch(); window.location.reload(); } }

    // --- MAPPING INDICES TO VISUAL GRID (FIXED) ---
    // The visual grid should ALWAYS render Left-to-Right as:
    // Front: Zone 4 (Left) -> Zone 3 (Center) -> Zone 2 (Right)
    // Back:  Zone 5 (Left) -> Zone 6 (Center) -> Zone 1 (Right)
    // We do NOT swap these based on 'isMirrored'.

    const frontRowIndices = [3, 4, 5]; // Indices: 3=Zone4, 4=Zone3, 5=Zone2
    const backRowIndices = [2, 1, 0];  // Indices: 2=Zone5, 1=Zone6, 0=Zone1

    const positionLabels = { 3: '4', 4: '3', 5: '2', 2: '5', 1: '6', 0: '1' };

    return (
        <div className="min-h-screen bg-[#F5F5F7] font-sans text-gray-900 flex flex-col">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${theme.gradient} text-white shadow-sm`}><Users size={20} /></div>
                    <div><h1 className="text-lg font-bold text-gray-900 leading-tight">Set {setNumber} Setup</h1><span className="text-xs font-medium text-gray-500">Configure Lineups</span></div>
                </div>
                <div className="flex gap-3 items-center">
                    {isLoading && <Loader2 size={18} className="text-gray-400 animate-spin" />}
                    <button onClick={handleHardReset} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><RefreshCw size={18} /></button>
                    <button onClick={validateAndStart} className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2 transition-all active:scale-95">Start Match <ArrowRight size={16} /></button>
                </div>
            </header>

            {/* TEAM TABS + SIDE SWAP */}
            <div className="flex justify-center items-center pt-8 pb-4 gap-4">
                <div className="bg-gray-200/50 p-1 rounded-full flex relative">
                    {['home', 'away'].map(side => {
                        const isActive = activeTab === side;
                        return (
                            <button key={side} onClick={() => setActiveTab(side)} className={`relative px-8 py-2 rounded-full text-sm font-bold transition-all duration-200 z-10 ${isActive ? 'text-gray-900 shadow-sm bg-white' : 'text-gray-500 hover:text-gray-700'}`}>{setupData[side].name}</button>
                        );
                    })}
                </div>

                {/* SIDE SWAP BUTTON */}
                <button
                    onClick={() => setHomeSide(prev => prev === 'left' ? 'right' : 'left')}
                    className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-indigo-600 border border-gray-200 transition-colors"
                    title="Swap Court Sides (Moves Ref)"
                >
                    <ArrowLeftRight size={20} />
                </button>
            </div>

            <div className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                {/* LEFT: ROSTER */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-[800px]">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <h3 className="text-xl font-bold text-gray-900">Roster</h3>
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{activeTeam.bench.length} Avail</span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {activeTeam.bench.map(p => <PlayerCard key={p.id} player={p} onDragStart={handleDragStart} theme={theme} />)}
                        {activeTeam.liberos.map(p => <PlayerCard key={p.id} player={p} onDragStart={handleDragStart} theme={theme} />)}
                    </div>
                </div>

                {/* RIGHT: COURT */}
                <div className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-[800px] relative">

                    {/* COURT CONTAINER */}
                    {/* Keeps Ref movement logic (flex-row vs flex-row-reverse) */}
                    <div className={`flex-1 flex gap-4 ${isMirrored ? 'flex-row-reverse' : 'flex-row'}`}>

                        {/* 1. HEAD REF COLUMN */}
                        <HeadRef theme={theme} />

                        {/* 2. COURT GRID COLUMN */}
                        <div className={`flex-1 relative rounded-lg border-4 ${theme.courtLines} bg-gray-50/30 p-2 flex flex-col`}>

                            {/* FRONT ROW (33%) */}
                            {/* Always Zones 4-3-2 */}
                            <div className="grid grid-cols-3 gap-4 h-[33%] mb-4 border-b-4 border-dashed border-red-200/50 relative">
                                {frontRowIndices.map(idx => (
                                    <CourtBox
                                        key={idx} index={idx} positionLabel={positionLabels[idx]}
                                        player={activeTeam.court[idx]}
                                        libero={null}
                                        onDrop={(e) => handleDropCourt(e, idx)}
                                        onDragStart={handleDragStart}
                                        onDragOver={e => e.preventDefault()}
                                        onRemove={() => handleRemoveFromCourt(idx)}
                                        onRemoveLibero={() => { }}
                                        theme={theme}
                                    />
                                ))}
                            </div>

                            {/* BACK ROW (66%) */}
                            {/* Always Zones 5-6-1 */}
                            <div className="grid grid-cols-3 gap-4 h-[66%] relative">
                                {backRowIndices.map(idx => {
                                    const isLiberoHere = assignedLibero.index === idx;
                                    return (
                                        <div key={idx} className="relative w-full h-full">
                                            <CourtBox
                                                index={idx} positionLabel={positionLabels[idx]}
                                                player={activeTeam.court[idx]}
                                                libero={isLiberoHere ? assignedLibero.player : null}
                                                onDrop={(e) => handleDropCourt(e, idx)}
                                                onDragStart={handleDragStart}
                                                onDragOver={e => e.preventDefault()}
                                                onRemove={() => handleRemoveFromCourt(idx)}
                                                onRemoveLibero={handleRemoveLibero}
                                                theme={theme}
                                            />
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