import {
    Activity, AlertCircle, ArrowRight, ArrowUpCircle, Ban, CheckCircle, Clock, Crosshair, Disc,
    Feather, FileText, Hand,
    MonitorPlay,
    PauseCircle,
    RefreshCw,
    RotateCcw, ScrollText, Shield, Target, Trophy, User,
    Users,
    X, XCircle, Zap
} from 'lucide-react';
import { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';

// Ensure these files are in the same folder or update paths accordingly
import ChallengeControl from '../components/ChallengeControl';
import RefereeControls from '../components/RefereeControls';
import TimeoutTimer from '../components/TimeoutTimer';

// --- SUB-COMPONENTS ---

const PlayerTag = ({ player, isSelected, teamColor, isLibero, isBlocker }) => {
    const baseClass = "relative z-20 w-full py-1 px-2 md:px-3 rounded-lg shadow-sm flex items-center justify-between transition-all duration-200 cursor-pointer select-none border-l-[6px]";
    let bgClass = "bg-white";
    let textClass = "text-slate-700";
    let borderClass = teamColor === 'orange' ? "border-[#ff7b00]" : "border-[#d9202a]";
    let hoverClass = teamColor === 'orange' ? "hover:bg-orange-50" : "hover:bg-red-50";
    let extraClass = "group-hover:scale-[1.02] shadow-sm";

    if (isLibero && !isSelected) {
        textClass = teamColor === 'orange' ? "text-[#c75c14]" : "text-[#9e212d]";
        borderClass = teamColor === 'orange' ? "border-[#ff7b00] ring-2 ring-inset ring-orange-200" : "border-[#d9202a] ring-2 ring-inset ring-red-200";
    }

    if (isSelected) {
        if (teamColor === 'orange') {
            bgClass = "bg-[#ff7b00] shadow-orange-200";
            textClass = "text-white";
            borderClass = "border-[#1f222b]";
        } else {
            bgClass = "bg-[#d9202a] shadow-red-200";
            textClass = "text-white";
            borderClass = "border-[#2c2429]";
        }
        extraClass = "scale-105 ring-2 ring-offset-2 ring-black/20 z-30 shadow-xl";
    }

    if (isBlocker) {
        bgClass = "bg-purple-600 text-white";
        borderClass = "border-purple-900";
        extraClass = "ring-4 ring-purple-300 z-40 scale-105 shadow-xl";
    }

    return (
        <div className={`${baseClass} ${bgClass} ${borderClass} ${hoverClass} ${extraClass}`}>
            <span className={`text-xl xl:text-3xl font-black italic tracking-tighter leading-none`}>{player.number}</span>
            <div className={`flex flex-col items-end leading-tight min-w-0 ${textClass} ${isSelected || isBlocker ? 'opacity-100' : 'opacity-90'}`}>
                <span className="text-[9px] xl:text-xs font-black uppercase tracking-wider opacity-100">{player.pos}</span>
                <span className="text-[10px] xl:text-sm font-black uppercase truncate w-full text-right">{player.name}</span>
            </div>
        </div>
    );
};

const PrettyButton = ({ onClick, title, subtitle, icon: Icon, colorClass }) => (
    <button onClick={onClick} className={`relative h-full w-full rounded-xl border flex flex-col items-center justify-center transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md ${colorClass}`}>
        {Icon && <Icon size={24} className="mb-1 opacity-90" />}
        <span className="text-sm md:text-base font-black uppercase leading-none text-center">{title}</span>
        {subtitle && <span className="text-[10px] md:text-xs font-bold opacity-70 uppercase mt-0.5 hidden xl:block">{subtitle}</span>}
    </button>
)

const ActionBtn = ({ onClick, children, variant = 'neutral', className = '' }) => {
    const base = "h-full rounded-lg font-black text-xs uppercase tracking-wider flex items-center justify-center transition-all active:scale-95 shadow-md hover:shadow-lg border-b-4 active:border-b-0 active:translate-y-1";
    const variants = {
        success: "bg-green-500 border-green-700 text-white hover:bg-green-400",
        danger: "bg-red-500 border-red-700 text-white hover:bg-red-400",
        primary: "bg-blue-600 border-blue-800 text-white hover:bg-blue-500",
        neutral: "bg-slate-100 border-slate-300 text-slate-700 hover:bg-white hover:text-black",
        dark: "bg-slate-800 border-black text-white hover:bg-slate-700"
    };
    return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</button>
}

const CourtZone = ({ player, zoneNumber, isSelected, onClick, teamColor, isLibero, highlight, disabled, locked, isBlocker }) => {
    let containerClass = "cursor-pointer bg-slate-50/50 hover:bg-slate-100/80";
    if (disabled) containerClass = "opacity-30 cursor-not-allowed bg-slate-200";
    else if (locked) containerClass = "cursor-default bg-slate-50/50";

    return (
        <div onClick={() => !disabled && !locked && onClick(player)} className={`w-full h-full border border-slate-200 flex flex-col items-center justify-center py-1 transition-colors gap-1 group relative ${containerClass} ${highlight ? 'bg-green-50 ring-4 ring-inset ring-green-400/50 opacity-100' : ''} ${isBlocker ? 'bg-purple-50 ring-4 ring-inset ring-purple-400/50 opacity-100' : ''}`}>
            <span className="absolute top-1 left-2 text-4xl md:text-6xl font-black text-slate-300 select-none z-0">{zoneNumber}</span>
            {highlight && <div className="absolute top-1 right-1 text-[9px] font-bold text-green-700 bg-green-200 px-1 rounded z-30 animate-pulse">SWAP</div>}
            <div className="flex-grow flex items-center justify-center z-10 w-36 md:w-40 lg:w-44">
                {player && <PlayerTag player={player} isSelected={isSelected} teamColor={teamColor} isLibero={isLibero} isBlocker={isBlocker} />}
            </div>
        </div>
    );
};

const BenchCard = ({ player, teamColor, onClick, isSelected }) => (
    <div onClick={() => onClick(player)} className="w-full cursor-pointer hover:scale-[1.02] transition-transform">
        <PlayerTag player={player} isSelected={isSelected} teamColor={teamColor} isLibero={false} />
    </div>
);

const ChallengeButton = ({ onClick, used, limit }) => (
    <button onClick={onClick} disabled={used >= limit} className="w-full group bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-3 rounded-lg shadow-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 overflow-hidden relative">
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <MonitorPlay size={18} className="relative z-10" />
        <span className="relative z-10 uppercase tracking-widest text-xs">Challenge <span className="opacity-70 ml-1">({used}/{limit})</span></span>
    </button>
);

const TimeoutButton = ({ onClick, used, limit, disabled }) => (
    <button onClick={onClick} disabled={used >= limit || disabled} className="w-full group bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-3 rounded-lg shadow-lg border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 overflow-hidden relative">
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <PauseCircle size={18} className="relative z-10" />
        <span className="relative z-10 uppercase tracking-widest text-xs">Timeout <span className="opacity-70 ml-1">({used}/{limit})</span></span>
    </button>
);

// --- LOGIC HELPERS ---

const createSnapshot = (state) => ({
    score: { ...state.score },
    servingTeam: state.servingTeam,
    matchPhase: state.matchPhase,
    rotations: { home: [...state.rotations.home], away: [...state.rotations.away] },
    liberoOriginals: { home: { ...state.liberoOriginals.home }, away: { ...state.liberoOriginals.away } }
});

// 
const processRotation = (teamRotation, teamOriginals) => {
    let newRotation = [...teamRotation];
    let newOriginals = { ...teamOriginals };
    let autoSwapLog = null;

    // 1. ROTATE
    // Array Order: [P1, P6, P5, P4, P3, P2] -> [P2, P1, P6, P5, P4, P3]
    const mover = newRotation.pop();
    newRotation.unshift(mover);

    // 2. CHECK FRONT-LEFT (Position 4, Index 3) for Libero
    // Liberos are NOT allowed in front row (Indices 3, 4, 5 correspond to Zones 4, 3, 2)
    const playerAtPos4 = newRotation[3];

    if (playerAtPos4 && playerAtPos4.isLibero) {
        const originalPlayer = newOriginals[playerAtPos4.id];

        if (originalPlayer) {
            newRotation[3] = originalPlayer;
            delete newOriginals[playerAtPos4.id];
            autoSwapLog = {
                type: 'correction',
                text: `LIBERO ROTATION: ${playerAtPos4.name} (L) auto-swapped for ${originalPlayer.name}`
            };
        } else {
            autoSwapLog = { type: 'danger', text: `LIBERO ROTATION ERROR: Original player not found for ${playerAtPos4.name}` };
        }
    }

    return { newRotation, newOriginals, autoSwapLog };
};

// --- INITIAL STATE FACTORY ---
const createInitialState = (rosters, savedState) => {
    if (savedState) {
        return {
            ...savedState,
            // Backwards compatibility for older saves
            liberoLists: savedState.liberoLists || {
                home: rosters.home.liberos || [],
                away: rosters.away.liberos || []
            },
            liberoOriginals: savedState.liberoOriginals || { home: {}, away: {} }
        };
    }

    return {
        score: { home: 0, away: 0 },
        matchPhase: 'PRE_SERVE',
        actionTeam: null,
        servingTeam: 'home',
        lastServer: 'home',
        possession: 'home',
        challengesUsed: { home: 0, away: 0 },
        timeoutsUsed: { home: 0, away: 0 },
        previousState: null,
        rotations: { home: [...rosters.home.court], away: [...rosters.away.court] },
        liberoOriginals: { home: {}, away: {} },
        liberoLists: { home: [...rosters.home.liberos], away: [...rosters.away.liberos] },
        subsUsed: { home: 0, away: 0 },
        benches: { home: [...rosters.home.bench], away: [...rosters.away.bench] },
        logs: [{ id: Date.now(), time: new Date().toLocaleTimeString(), text: "Match Started", type: 'info' }],
        selectedPlayer: null,
        rallyData: { serveType: null, serveResult: null, blockers: [], setter: null, attacker: null, receiver: null, target: null }
    };
};

// --- GAME REDUCER ---

const gameReducer = (state, action) => {
    const getTime = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
    const addLog = (text, type = 'info') => [{ id: Date.now(), time: getTime(), text, type }, ...state.logs];
    const fmt = (p) => p ? `#${p.number} ${p.name}` : 'Unknown';

    switch (action.type) {

        case 'REQUEST_TIMEOUT': {
            const team = action.payload;
            const teamCode = team === 'home' ? 'HOME' : 'AWAY';
            if (state.timeoutsUsed[team] >= 2) return state;
            if (!['PRE_SERVE', 'SERVE'].includes(state.matchPhase)) return state;

            const newTimeouts = { ...state.timeoutsUsed };
            newTimeouts[team] += 1;
            return { ...state, timeoutsUsed: newTimeouts, logs: addLog(`TIMEOUT CALLED by ${teamCode} (${newTimeouts[team]}/2)`, 'highlight') };
        }

        case 'REFEREE_DECISION': {
            const { winner, reason } = action.payload;
            const teamCode = winner === 'home' ? 'HOME' : 'AWAY';
            const snapshot = createSnapshot(state);

            const shouldRotate = winner !== state.servingTeam;
            const { newRotation, newOriginals, autoSwapLog } = shouldRotate
                ? processRotation(state.rotations[winner], state.liberoOriginals[winner])
                : { newRotation: state.rotations[winner], newOriginals: state.liberoOriginals[winner] };

            let l = addLog(`REFEREE: ${reason} -> POINT ${teamCode}`, 'highlight');
            if (autoSwapLog) l = [{ id: Date.now() + 1, time: getTime(), text: autoSwapLog.text, type: autoSwapLog.type }, ...l];

            return {
                ...state, previousState: snapshot, score: { ...state.score, [winner]: state.score[winner] + 1 }, servingTeam: winner,
                rotations: { ...state.rotations, [winner]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [winner]: newOriginals },
                matchPhase: 'PRE_SERVE', logs: l, selectedPlayer: null, rallyData: { serveType: null, serveResult: null, blockers: [], setter: null, attacker: null, receiver: null, target: null }
            };
        }

        case 'CHALLENGE_RESULT': {
            const { team, success } = action.payload;
            const challenger = team;
            if (!success) {
                const newChallenges = { ...state.challengesUsed };
                newChallenges[challenger] += 1;
                return { ...state, challengesUsed: newChallenges, logs: addLog(`CHALLENGE FAILED`, 'danger') };
            }
            if (!state.previousState) return state;

            return { ...state.previousState, logs: addLog(`CHALLENGE SUCCESS: Score Corrected`, 'success') };
        }

        case 'REQUEST_SUB': return { ...state, matchPhase: 'SUBSTITUTION', actionTeam: action.payload, selectedPlayer: null };
        case 'REQUEST_LIBERO_SWAP': return { ...state, matchPhase: 'LIBERO_SWAP', actionTeam: action.payload, selectedPlayer: null };

        case 'EXECUTE_SUB': {
            const { benchPlayer, courtPlayer } = action.payload; const subTeam = state.actionTeam;
            const newBench = state.benches[subTeam].filter(p => p.id !== benchPlayer.id); newBench.push(courtPlayer);
            const newRot = state.rotations[subTeam].map(p => p.id === courtPlayer.id ? benchPlayer : p);
            return { ...state, rotations: { ...state.rotations, [subTeam]: newRot }, benches: { ...state.benches, [subTeam]: newBench }, subsUsed: { ...state.subsUsed, [subTeam]: state.subsUsed[subTeam] + 1 }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`SUBSTITUTION: ${fmt(benchPlayer)} IN, ${fmt(courtPlayer)} OUT`, 'info') };
        }

        case 'EXECUTE_LIBERO_SWAP': {
            const { libero, courtPlayer, zoneIndex, team: lTeam } = action.payload;
            const newLRotation = [...state.rotations[lTeam]];
            const newLOriginals = { ...state.liberoOriginals[lTeam] };

            if (libero.isLibero) {
                // SWAP IN
                newLRotation[zoneIndex] = libero;
                newLOriginals[libero.id] = courtPlayer;
            } else {
                // SWAP OUT
                newLRotation[zoneIndex] = libero;
                delete newLOriginals[courtPlayer.id];
            }

            return {
                ...state, rotations: { ...state.rotations, [lTeam]: newLRotation },
                liberoOriginals: { ...state.liberoOriginals, [lTeam]: newLOriginals },
                matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null,
                logs: addLog(`LIBERO SWAP: ${fmt(libero)} <-> ${fmt(courtPlayer)}`, 'info')
            };
        }

        case 'SELECT_PLAYER': {
            const p = action.payload;
            if (!p) return state;

            // TEAM DETECTION (Safe Chaining)
            const isHome = state.rotations.home.some(x => x?.id === p.id)
                || state.benches.home.some(x => x.id === p.id)
                || state.liberoLists?.home?.some(x => x.id === p.id);
            const pTeam = isHome ? 'home' : 'away';

            // --- SUB / SWAP LOGIC ---
            if (state.matchPhase === 'SUBSTITUTION' || state.matchPhase === 'LIBERO_SWAP') {
                if (pTeam !== state.actionTeam) return state;

                // 1. First Click (Incoming Player)
                if (!state.selectedPlayer) {
                    if (state.matchPhase === 'SUBSTITUTION' && !state.benches[pTeam].find(b => b.id === p.id)) return state;
                    return { ...state, selectedPlayer: p };
                }
                // 2. Second Click (Outgoing Player)
                else {
                    const p1 = state.selectedPlayer;
                    const p2 = p;

                    if (state.matchPhase === 'SUBSTITUTION') {
                        return gameReducer(state, { type: 'EXECUTE_SUB', payload: { benchPlayer: p1, courtPlayer: p2 } });
                    }
                    if (state.matchPhase === 'LIBERO_SWAP') {
                        // Swap IN: p1 is Libero, p2 is Court Player
                        if (p1.isLibero && !p2.isLibero) {
                            const idx = state.rotations[pTeam].findIndex(r => r && r.id === p2.id);

                            // VALIDATION: INDICES 0 (Pos 1), 1 (Pos 6), 2 (Pos 5) ARE BACK ROW
                            if (idx > 2) {
                                alert("Invalid Zone! Libero can only enter Back Row (Zones 1, 6, 5).");
                                return { ...state, selectedPlayer: null };
                            }

                            return gameReducer(state, { type: 'EXECUTE_LIBERO_SWAP', payload: { libero: p1, courtPlayer: p2, zoneIndex: idx, team: pTeam } });
                        }
                    }
                }
            }

            // ... (Standard logic)
            const pTeamStandard = (state.rotations.home.find(x => x?.id === p.id)) ? 'home' : 'away';
            if (state.matchPhase === 'SELECT_BLOCKERS') { const defTeam = state.possession === 'home' ? 'away' : 'home'; if (pTeamStandard !== defTeam) return state; return gameReducer(state, { type: 'TOGGLE_BLOCKER', payload: p }); }
            if (state.matchPhase === 'COVER') { if (pTeamStandard !== state.possession) return state; return gameReducer(state, { type: 'EXECUTE_COVER', payload: { ...p } }); }
            let newData = { ...state.rallyData };
            if (state.matchPhase === 'RECEPTION') newData.receiver = p;
            return { ...state, selectedPlayer: p, rallyData: newData };
        }

        case 'CANCEL_SELECTION':
        case 'CANCEL_ACTION': return { ...state, selectedPlayer: null, matchPhase: state.matchPhase === 'DIG_DECISION' ? 'LANDING' : (state.matchPhase === 'SUBSTITUTION' || state.matchPhase === 'LIBERO_SWAP' ? 'PRE_SERVE' : state.matchPhase), actionTeam: null, rallyData: { ...state.rallyData, serveType: null, serveResult: null, blockers: [] } };

        case 'UNDO_STEP': {
            const current = state.matchPhase;
            if (current === 'SERVE') { if (state.rallyData.serveType) return { ...state, rallyData: { ...state.rallyData, serveType: null } }; return state; }
            if (current === 'SERVE_LANDING') return { ...state, matchPhase: 'SERVE', possession: state.servingTeam, rallyData: { ...state.rallyData, serveResult: null }, selectedPlayer: state.rotations[state.servingTeam][0] };
            if (current === 'RECEPTION') return { ...state, matchPhase: 'SERVE_LANDING', possession: state.servingTeam, selectedPlayer: null };
            if (current === 'SET') return { ...state, matchPhase: 'RECEPTION', selectedPlayer: state.rallyData.receiver };
            if (current === 'ATTACK') return { ...state, matchPhase: 'SET', selectedPlayer: state.rallyData.setter };
            if (current === 'LANDING') { if (state.rallyData.attackType === 'Dump') return { ...state, matchPhase: 'SET', selectedPlayer: state.rallyData.setter, rallyData: { ...state.rallyData, attackType: null } }; return { ...state, matchPhase: 'ATTACK', selectedPlayer: state.rallyData.attacker }; }
            if (current === 'DIG_DECISION') return { ...state, matchPhase: 'LANDING', selectedPlayer: null };
            if (current === 'BLOCK_RESULT') return { ...state, matchPhase: 'DIG_DECISION', selectedPlayer: state.rallyData.target };
            if (current === 'SELECT_BLOCKERS') return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null, rallyData: { ...state.rallyData, blockers: [] } };
            if (current === 'COVER') return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
            return state;
        }
        case 'INIT_SERVE':
            if (state.matchPhase !== 'PRE_SERVE') return state;

            // CHECK LIBERO SERVE RULE
            const currentServer = state.rotations[state.servingTeam][0];
            if (currentServer && currentServer.isLibero) {
                alert("WARNING: Libero in Service Position (Zone 1). They must rotate out or swap before serving.");
            }

            return { ...state, matchPhase: 'SERVE', lastServer: state.servingTeam, selectedPlayer: currentServer, possession: state.servingTeam, rallyData: { serveType: null, serveResult: null, blockers: [], setter: null, attacker: null, receiver: null, target: null } };

        case 'SET_SERVE_TYPE': return { ...state, rallyData: { ...state.rallyData, serveType: action.payload } };
        case 'SET_SERVE_RESULT': {
            const result = action.payload; const opp = state.servingTeam === 'home' ? 'away' : 'home';
            if (result === 'ERROR') { const snapshot = createSnapshot(state); const { newRotation, newOriginals } = processRotation(state.rotations[opp], state.liberoOriginals[opp]); return { ...state, previousState: snapshot, score: { ...state.score, [opp]: state.score[opp] + 1 }, servingTeam: opp, rotations: { ...state.rotations, [opp]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [opp]: newOriginals }, matchPhase: 'PRE_SERVE', selectedPlayer: null, logs: addLog(`SERVE ERROR -> POINT`, 'danger') }; }
            return { ...state, rallyData: { ...state.rallyData, serveResult: result }, matchPhase: 'SERVE_LANDING', selectedPlayer: null, logs: addLog(`Serve -> ${result}`, 'info') };
        }
        case 'SELECT_LANDING_ZONE': { const { zoneIndex, opponentTeam } = action.payload; const zoneToIdxMap = { 1: 0, 6: 1, 5: 2, 4: 3, 3: 4, 2: 5 }; const rec = state.rotations[opponentTeam][zoneToIdxMap[zoneIndex]]; if (state.matchPhase === 'SERVE_LANDING') { if (state.rallyData.serveResult === 'ACE') { const snapshot = createSnapshot(state); return { ...state, previousState: snapshot, score: { ...state.score, [state.servingTeam]: state.score[state.servingTeam] + 1 }, matchPhase: 'PRE_SERVE', logs: addLog(`ACE!`, 'success') }; } return { ...state, matchPhase: 'RECEPTION', possession: opponentTeam, selectedPlayer: rec, rallyData: { ...state.rallyData, receiver: rec } }; } return { ...state, selectedPlayer: rec, matchPhase: 'DIG_DECISION', rallyData: { ...state.rallyData, target: rec } }; }
        case 'RECEPTION_GRADE': { if (action.payload.quality === 0) { const snapshot = createSnapshot(state); return { ...state, previousState: snapshot, score: { ...state.score, [state.servingTeam]: state.score[state.servingTeam] + 1 }, matchPhase: 'PRE_SERVE', logs: addLog(`RECEPTION ERROR`, 'success') }; } return { ...state, matchPhase: 'SET', selectedPlayer: null, logs: addLog(`Pass: ${action.payload.quality}`, 'info') }; }
        case 'EXECUTE_SET': if (action.payload.type === 'Dump') return { ...state, matchPhase: 'LANDING', selectedPlayer: null, rallyData: { ...state.rallyData, setter: state.selectedPlayer, attacker: state.selectedPlayer, attackType: 'Dump' }, logs: addLog(`DUMP`, 'info') }; return { ...state, matchPhase: 'ATTACK', selectedPlayer: null, rallyData: { ...state.rallyData, setter: state.selectedPlayer }, logs: addLog(`SET`, 'info') };
        case 'EXECUTE_ATTACK': return { ...state, rallyData: { ...state.rallyData, attacker: state.selectedPlayer, attackType: action.payload.type }, matchPhase: 'LANDING', selectedPlayer: null, logs: addLog(`ATTACK`, 'info') };
        case 'BLOCK_DETECTED': return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
        case 'BLOCK_OUTCOME': { const attTeam = state.possession; const defTeam = attTeam === 'home' ? 'away' : 'home'; if (action.payload === 'TOUCH_OUT') { const snapshot = createSnapshot(state); const { newRotation, newOriginals } = (attTeam !== state.servingTeam) ? processRotation(state.rotations[attTeam], state.liberoOriginals[attTeam]) : { newRotation: state.rotations[attTeam], newOriginals: state.liberoOriginals[attTeam] }; return { ...state, previousState: snapshot, score: { ...state.score, [attTeam]: state.score[attTeam] + 1 }, servingTeam: attTeam, rotations: { ...state.rotations, [attTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [attTeam]: newOriginals }, matchPhase: 'PRE_SERVE', logs: addLog(`BLOCK TOUCH OUT`, 'success') }; } if (action.payload === 'SHUTDOWN') { const snapshot = createSnapshot(state); const { newRotation, newOriginals } = (defTeam !== state.servingTeam) ? processRotation(state.rotations[defTeam], state.liberoOriginals[defTeam]) : { newRotation: state.rotations[defTeam], newOriginals: state.liberoOriginals[defTeam] }; return { ...state, previousState: snapshot, score: { ...state.score, [defTeam]: state.score[defTeam] + 1 }, servingTeam: defTeam, rotations: { ...state.rotations, [defTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [defTeam]: newOriginals }, matchPhase: 'PRE_SERVE', logs: addLog(`SHUTDOWN`, 'highlight') }; } if (action.payload === 'REBOUND') return { ...state, matchPhase: 'COVER', possession: attTeam, logs: addLog(`REBOUND`, 'info'), selectedPlayer: null }; return { ...state, matchPhase: 'RECEPTION', possession: defTeam, logs: addLog(`SOFT BLOCK`, 'info'), selectedPlayer: null }; }
        case 'EXECUTE_COVER': return { ...state, matchPhase: 'SET', selectedPlayer: null, logs: addLog(`COVER`, 'info') };
        case 'TOGGLE_BLOCKER': { const p = action.payload; const currentBlockers = state.rallyData.blockers; const exists = currentBlockers.find(b => b.id === p.id); const newBlockers = exists ? currentBlockers.filter(b => b.id !== p.id) : [...currentBlockers, p]; return { ...state, rallyData: { ...state.rallyData, blockers: newBlockers } }; }
        case 'CONFIRM_BLOCK': return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
        case 'ATTACK_RESULT': { const { result } = action.payload; const attTeam = state.possession; const defTeam = attTeam === 'home' ? 'away' : 'home'; if (result === 'KILL') { const snapshot = createSnapshot(state); const { newRotation, newOriginals } = (attTeam !== state.servingTeam) ? processRotation(state.rotations[attTeam], state.liberoOriginals[attTeam]) : { newRotation: state.rotations[attTeam], newOriginals: state.liberoOriginals[attTeam] }; return { ...state, previousState: snapshot, score: { ...state.score, [attTeam]: state.score[attTeam] + 1 }, servingTeam: attTeam, rotations: { ...state.rotations, [attTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [attTeam]: newOriginals }, matchPhase: 'PRE_SERVE', logs: addLog(`KILL -> POINT`, 'success') }; } if (result === 'ERROR') { const snapshot = createSnapshot(state); const { newRotation, newOriginals } = (defTeam !== state.servingTeam) ? processRotation(state.rotations[defTeam], state.liberoOriginals[defTeam]) : { newRotation: state.rotations[defTeam], newOriginals: state.liberoOriginals[defTeam] }; return { ...state, previousState: snapshot, score: { ...state.score, [defTeam]: state.score[defTeam] + 1 }, servingTeam: defTeam, rotations: { ...state.rotations, [defTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [defTeam]: newOriginals }, matchPhase: 'PRE_SERVE', logs: addLog(`ATTACK ERROR`, 'danger') }; } if (result === 'DIG') return { ...state, matchPhase: 'SET', possession: defTeam, logs: addLog(`DIG`, 'info'), selectedPlayer: null }; return state; }
        default: return state;
    }
};

export default function VolleyballTracker() {
    const navigate = useNavigate();
    const { setupData, setNumber, liveGameBackup, saveLiveState, completeSet } = useMatchStore();
    const [state, dispatch] = useReducer(gameReducer, null, () => createInitialState(setupData, liveGameBackup));

    const [showReferee, setShowReferee] = useState(false);
    const [showChallenge, setShowChallenge] = useState(null);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [activeTimeoutTeam, setActiveTimeoutTeam] = useState(null);

    useEffect(() => { saveLiveState(state); }, [state, saveLiveState]);

    useEffect(() => {
        const { home, away } = state.score;
        const targetScore = setNumber === 5 ? 15 : 25;
        if ((home >= targetScore || away >= targetScore) && Math.abs(home - away) >= 2) {
            const timer = setTimeout(() => {
                const winner = home > away ? 'home' : 'away';
                if (window.confirm(`Set Finished! Winner: ${winner === 'home' ? setupData.home.name : setupData.away.name}\nStart Next Set?`)) {
                    completeSet(winner);
                    navigate('/setup');
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [state.score, setNumber, state.logs, setupData, completeSet, navigate]);

    useEffect(() => {
        if (state.matchPhase === 'PRE_SERVE') {
            const t = setTimeout(() => dispatch({ type: 'INIT_SERVE' }), 200);
            return () => clearTimeout(t);
        }
    }, [state.matchPhase]);

    const handleRefereeDecision = (winnerCode, reason) => {
        const winner = winnerCode === 'A' ? 'home' : 'away';
        dispatch({ type: 'REFEREE_DECISION', payload: { winner, reason } });
    };

    const handleChallengeResult = (result) => {
        dispatch({ type: 'CHALLENGE_RESULT', payload: { team: showChallenge, ...result } });
        setShowChallenge(null);
    };

    const handlePlayerClick = (p) => dispatch({ type: 'SELECT_PLAYER', payload: p });

    const handleZoneClick = (zone, side) => {
        const oppTeam = state.possession === 'home' ? 'away' : 'home';
        if (side !== (oppTeam === 'home' ? 'left' : 'right')) return;
        dispatch({ type: 'SELECT_LANDING_ZONE', payload: { zoneIndex: zone, opponentTeam: oppTeam } });
    };

    const renderCourtHalf = (side, rotation) => {
        const isLeft = side === 'left';
        const teamName = isLeft ? 'home' : 'away';
        const teamColor = isLeft ? 'orange' : 'red';
        let isClickable = false; let highlight = false; let isLocked = false;

        if (state.matchPhase === 'SERVE') isLocked = true;
        else if (['RECEPTION', 'SET', 'ATTACK', 'COVER'].includes(state.matchPhase)) { if (state.possession === teamName) isClickable = true; }
        else if ((state.matchPhase === 'LANDING' || state.matchPhase === 'SERVE_LANDING' || state.matchPhase === 'DIG_DECISION') && state.possession !== teamName) { isClickable = true; highlight = true; }

        else if (state.matchPhase === 'LIBERO_SWAP' && state.actionTeam === teamName && state.selectedPlayer) {
            // Logic handled in loop below
        }
        else if (state.matchPhase === 'SUBSTITUTION' && state.actionTeam === teamName && state.selectedPlayer) isClickable = true;
        else if (state.matchPhase === 'SELECT_BLOCKERS') { const defTeam = state.possession === 'home' ? 'away' : 'home'; if (teamName === defTeam) isClickable = true; }

        const getP = (z) => rotation[{ 1: 0, 6: 1, 5: 2, 4: 3, 3: 4, 2: 5 }[z]];
        const CardRow = ({ zones }) => (
            <div className="flex flex-col h-full gap-0.5">
                {zones.map(z => {
                    const p = getP(z);
                    let zoneDisabled = !isClickable && !highlight && state.selectedPlayer?.id !== p?.id;

                    // --- PRECISE LIBERO ZONING (1, 5, 6 ALLOWED) ---
                    if (state.matchPhase === 'LIBERO_SWAP' && state.actionTeam === teamName && state.selectedPlayer) {
                        const allowedZones = [1, 5, 6];
                        if (allowedZones.includes(z)) {
                            zoneDisabled = false;
                            if (!zoneDisabled) highlight = true;
                        } else {
                            zoneDisabled = true;
                        }
                    }

                    if (state.matchPhase === 'SELECT_BLOCKERS') { const defTeam = state.possession === 'home' ? 'away' : 'home'; if (teamName === defTeam) zoneDisabled = false; }
                    if (state.matchPhase === 'COVER') { if (state.possession === teamName) zoneDisabled = false; else zoneDisabled = true; }
                    if (isLocked) zoneDisabled = false;

                    const isBlocker = p ? state.rallyData.blockers.some(b => b.id === p.id) : false;
                    return (<div key={z} className="flex-1"><CourtZone player={p} zoneNumber={z} teamColor={teamColor} isSelected={state.selectedPlayer?.id === p?.id} onClick={(state.matchPhase === 'LANDING' || state.matchPhase === 'SERVE_LANDING' || state.matchPhase === 'DIG_DECISION') ? () => handleZoneClick(z, side) : handlePlayerClick} isLibero={p?.isLibero} isBlocker={isBlocker} highlight={highlight} disabled={zoneDisabled && !isLocked} locked={isLocked} /></div>)
                })}
            </div>
        );
        return isLeft ? (<div className="flex w-full h-full"><div className="flex-[2] h-full"><CardRow zones={[5, 6, 1]} /></div><div className="w-1 bg-[#1f222b]/10 h-full relative z-10"></div><div className="flex-1 pl-4 h-full"><CardRow zones={[4, 3, 2]} /></div></div>) : (<div className="flex w-full h-full"><div className="flex-1 pr-4 h-full"><CardRow zones={[2, 3, 4]} /></div><div className="w-1 bg-[#2c2429]/10 h-full relative z-10"></div><div className="flex-[2] h-full"><CardRow zones={[1, 6, 5]} /></div></div>);
    };

    const renderControls = () => {
        const p = state.selectedPlayer;
        const UndoBtn = () => (<button onClick={() => dispatch({ type: 'UNDO_STEP' })} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all active:scale-95 shadow-md"><RotateCcw size={12} /><span className="text-[10px] md:text-xs font-bold">UNDO</span></button>);
        const ControlHeader = ({ title, rightContent }) => (<div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2 shrink-0 min-h-[32px]"><div className="flex-shrink-0 w-24 flex justify-start"><UndoBtn /></div><div className="flex-1 flex justify-center text-center">{title}</div><div className="flex-shrink-0 w-24 flex justify-end">{rightContent}</div></div>);

        if (state.matchPhase === 'SERVE' && p) {
            const step = !state.rallyData.serveType ? 1 : 2;
            return (
                <div className="flex flex-col w-full h-full">
                    <ControlHeader title={<span className="font-bold text-slate-700 flex items-center gap-2 text-base md:text-lg"><Zap size={20} className="text-yellow-500" /> {p.name} SERVE</span>} rightContent={<div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full"><span className={step === 1 ? "text-slate-800" : ""}>TYPE</span><ArrowRight size={8} /><span className={step === 2 ? "text-slate-800" : ""}>RES</span></div>} />
                    <div className="flex-1 relative">
                        {step === 1 ? (
                            <div className="grid grid-cols-3 gap-3 h-full pb-1">{['FLOAT', 'TOPSPIN', 'JUMP'].map(t => <PrettyButton key={t} title={t} icon={Disc} colorClass="bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-900" onClick={() => dispatch({ type: 'SET_SERVE_TYPE', payload: t })} />)}</div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 h-full pb-1">
                                <PrettyButton title="ACE" subtitle="Direct Point" icon={Trophy} colorClass="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" onClick={() => dispatch({ type: 'SET_SERVE_RESULT', payload: 'ACE' })} />
                                <PrettyButton title="IN PLAY" subtitle="Start Rally" icon={ArrowRight} colorClass="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => dispatch({ type: 'SET_SERVE_RESULT', payload: 'IN_PLAY' })} />
                                <PrettyButton title="FAULT" subtitle="Net / Out" icon={XCircle} colorClass="bg-red-50 border-red-200 text-red-700 hover:bg-red-100" onClick={() => dispatch({ type: 'SET_SERVE_RESULT', payload: 'ERROR' })} />
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        if (state.matchPhase === 'SERVE_LANDING') return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-black uppercase text-slate-700 text-base md:text-lg">SELECT LANDING ZONE</span>} /><div className="flex-1 flex flex-col items-center justify-center text-blue-600 animate-pulse bg-blue-50/50 rounded-lg border-2 border-dashed border-blue-200"><Crosshair size={40} className="mb-2" /><span className="text-xs font-bold text-slate-400">Where did the ball drop?</span></div></div>);
        if (state.matchPhase === 'RECEPTION') {
            if (!p) return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-400 text-base md:text-lg">SELECT RECEIVER</span>} /><div className="flex-1 flex items-center justify-center animate-pulse text-blue-600 font-black text-xl gap-2"><Shield size={32} /> TAP PLAYER</div></div>);
            return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-700 text-base md:text-lg flex items-center gap-2"><Shield size={20} /> PASS QUALITY: {p.name}</span>} /><div className="grid grid-cols-4 gap-2 h-full pb-1 flex-1"><PrettyButton title="ERROR" subtitle="Ace" icon={XCircle} colorClass="bg-red-50 border-red-200 text-red-700" onClick={() => dispatch({ type: 'RECEPTION_GRADE', payload: { quality: 0, player: p } })} /><PrettyButton title="POOR" subtitle="1" icon={AlertCircle} colorClass="bg-orange-50 border-orange-200 text-orange-700" onClick={() => dispatch({ type: 'RECEPTION_GRADE', payload: { quality: 1, player: p } })} /><PrettyButton title="GOOD" subtitle="2" icon={Shield} colorClass="bg-blue-50 border-blue-200 text-blue-700" onClick={() => dispatch({ type: 'RECEPTION_GRADE', payload: { quality: 2, player: p } })} /><PrettyButton title="PERFECT" subtitle="3" icon={CheckCircle} colorClass="bg-green-50 border-green-200 text-green-700" onClick={() => dispatch({ type: 'RECEPTION_GRADE', payload: { quality: 3, player: p } })} /></div></div>);
        }
        if (state.matchPhase === 'SET') {
            if (!p) return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-400 text-base md:text-lg">SELECT SETTER</span>} /><div className="flex-1 flex items-center justify-center animate-pulse text-slate-500 font-bold text-xl gap-2"><Hand size={32} /> TAP PLAYER</div></div>);
            return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-700 text-base md:text-lg flex items-center gap-2"><Hand size={20} /> CALL: {p.name}</span>} /><div className="grid grid-cols-4 gap-2 h-full pb-1 flex-1">{['High', 'Quick', 'Pipe', 'Dump'].map(t => (<PrettyButton key={t} title={t} colorClass="bg-white border-slate-200 text-slate-700 hover:border-slate-400" onClick={() => dispatch({ type: 'EXECUTE_SET', payload: { type: t } })} />))}</div></div>);
        }
        if (state.matchPhase === 'ATTACK') {
            if (!p) return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-400 text-base md:text-lg">SELECT ATTACKER</span>} /><div className="flex-1 flex items-center justify-center animate-pulse text-red-600 font-black text-xl gap-2"><Activity size={32} /> TAP PLAYER</div></div>);
            return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-700 text-base md:text-lg flex items-center gap-2"><Activity size={20} /> ATTACK: {p.name}</span>} /><div className="grid grid-cols-3 gap-2 h-full pb-1 flex-1"><PrettyButton title="SPIKE" subtitle="Hard Hit" icon={Zap} colorClass="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" onClick={() => dispatch({ type: 'EXECUTE_ATTACK', payload: { type: 'Spike' } })} /><PrettyButton title="TIP" subtitle="Soft Touch" icon={Feather} colorClass="bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100" onClick={() => dispatch({ type: 'EXECUTE_ATTACK', payload: { type: 'Tip' } })} /><PrettyButton title="BACK ROW" subtitle="Pipe/Bic" icon={ArrowUpCircle} colorClass="bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100" onClick={() => dispatch({ type: 'EXECUTE_ATTACK', payload: { type: 'BackRow' } })} /></div></div>);
        }
        if (state.matchPhase === 'LANDING') return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-black uppercase text-slate-700 text-base md:text-lg">SELECT LANDING ZONE</span>} /><div className="flex-1 flex flex-col items-center justify-center text-green-600 animate-pulse"><Target size={40} className="mb-1" /></div></div>);
        if (state.matchPhase === 'DIG_DECISION') { const isP = !!p; return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-slate-700 text-base md:text-lg">TARGET: {isP ? p.name : 'Unknown'} (Zone Hit)</span>} rightContent={<button onClick={() => dispatch({ type: 'CANCEL_SELECTION' })} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline">CHANGE ZONE</button>} /><div className="grid grid-cols-4 gap-2 h-full pb-1 flex-1"><PrettyButton title="KILL" subtitle="Point" icon={Trophy} colorClass="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" onClick={() => dispatch({ type: 'ATTACK_RESULT', payload: { result: 'KILL' } })} /><PrettyButton title="BLOCKED" subtitle="Deflect" icon={Ban} colorClass="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" onClick={() => dispatch({ type: 'BLOCK_DETECTED' })} /><PrettyButton title="DIG" subtitle="Continue" icon={Shield} colorClass="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => dispatch({ type: 'ATTACK_RESULT', payload: { result: 'DIG' } })} /><PrettyButton title="OUT/NET" subtitle="Error" icon={XCircle} colorClass="bg-red-50 border-red-200 text-red-700 hover:bg-red-100" onClick={() => dispatch({ type: 'ATTACK_RESULT', payload: { result: 'ERROR' } })} /></div></div>); }
        if (state.matchPhase === 'BLOCK_RESULT') return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-purple-700 text-base md:text-lg">BLOCK DETECTED</span>} /><div className="grid grid-cols-4 gap-2 h-full pb-1 flex-1"><PrettyButton title="TOUCH OUT" subtitle="Attacker Point" icon={Trophy} colorClass="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" onClick={() => dispatch({ type: 'BLOCK_OUTCOME', payload: 'TOUCH_OUT' })} /><PrettyButton title="SHUTDOWN" subtitle="Defender Point" icon={Ban} colorClass="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" onClick={() => dispatch({ type: 'BLOCK_OUTCOME', payload: 'SHUTDOWN' })} /><PrettyButton title="SOFT BLOCK" subtitle="Touch/Play On" icon={Activity} colorClass="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => dispatch({ type: 'BLOCK_OUTCOME', payload: 'SOFT_BLOCK' })} /><PrettyButton title="REBOUND" subtitle="Cover (Atk Team)" icon={RotateCcw} colorClass="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => dispatch({ type: 'BLOCK_OUTCOME', payload: 'REBOUND' })} /></div></div>)
        if (state.matchPhase === 'SELECT_BLOCKERS') return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-purple-700 text-base md:text-lg">SELECT BLOCKERS</span>} rightContent={<span className="text-[9px] text-slate-400 font-bold leading-tight text-right">TAP<br />PLAYERS</span>} /><div className="flex gap-2 h-full pb-1 flex-1"><div className="flex-1 bg-purple-50 border-2 border-purple-100 rounded-lg flex items-center justify-center p-2 text-purple-900 text-sm font-bold text-center">{state.rallyData.blockers.length > 0 ? state.rallyData.blockers.map(b => b.name).join(', ') : 'Select Players...'}</div><button onClick={() => dispatch({ type: 'CONFIRM_BLOCK' })} disabled={state.rallyData.blockers.length === 0} className="w-1/3 bg-purple-600 text-white font-black rounded-lg disabled:opacity-50 hover:bg-purple-700 shadow-md">CONFIRM</button></div></div>)
        if (state.matchPhase === 'COVER') return (<div className="flex flex-col w-full h-full"><ControlHeader title={<span className="font-bold text-orange-600 text-base md:text-lg">SELECT COVER</span>} /><div className="flex-1 flex items-center justify-center animate-pulse text-orange-500 font-black text-xl gap-2"><Shield size={32} /> TAP PLAYER</div></div>)

        if (state.matchPhase === 'SUBSTITUTION' || state.matchPhase === 'LIBERO_SWAP') return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-4 relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl m-2">
                <div className="absolute top-2 left-2"><UndoBtn /></div>
                <div className="text-center mt-4">
                    <span className="font-black text-slate-700 uppercase tracking-widest text-xl">{state.matchPhase.replace('_', ' ')}</span>
                    <p className="text-xs font-bold text-slate-400 mt-1">Select Players to Swap</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white shadow-sm border px-4 py-2 rounded-full">
                    <span className={state.selectedPlayer ? "text-green-600" : "animate-pulse"}>1. Select Bench/Libero</span>
                    <ArrowRight size={14} />
                    <span>2. Select Back Row Player</span>
                </div>
                <div className="mt-2">
                    <ActionBtn onClick={() => dispatch({ type: 'CANCEL_ACTION' })} variant="neutral" className="px-8 py-2">CANCEL ACTION</ActionBtn>
                </div>
            </div>
        )

        return <div className="text-slate-400 h-full flex items-center justify-center text-sm">Loading...</div>;
    };

    const LiberoSection = ({ team, liberos, teamColor, rotation }) => (
        <div className="flex flex-col items-center w-full px-2 gap-2 mt-2">
            <span className="text-xs font-black tracking-widest bg-slate-100 w-full text-center py-1 rounded text-slate-400 uppercase">LIBEROS</span>
            <div className="flex gap-2 w-full">
                <button onClick={() => dispatch({ type: 'REQUEST_LIBERO_SWAP', payload: team })} className={`flex-1 border-2 font-black text-[10px] py-1.5 rounded hover:bg-slate-50 transition-colors ${teamColor === 'orange' ? 'border-orange-100 text-[#ff7b00]' : 'border-red-100 text-[#d9202a]'}`}>
                    <RefreshCw size={14} className="mx-auto mb-0.5" /> SWAP
                </button>
            </div>
            <div className="flex flex-col gap-1 w-full">
                {liberos.map(lib => {
                    // Check if libero is on court by checking rotations
                    const isOnCourt = rotation.find(r => r && r.id === lib.id);
                    return isOnCourt
                        ? (<div key={lib.id} className="w-full h-12 border-2 border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-[9px] text-slate-400 font-bold tracking-widest select-none">ON COURT</div>)
                        : (<div key={lib.id} className="w-full" onClick={() => handlePlayerClick(lib)}><PlayerTag player={lib} isLibero={true} teamColor={teamColor} isSelected={state.selectedPlayer?.id === lib.id} /></div>)
                })}
            </div>
        </div>
    );

    return (
        <div className="w-full h-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-slate-800">
            {/* POPUPS */}
            {showReferee && (<div className="fixed inset-0 z-[100] flex items-center justify-center"><RefereeControls onPointAwarded={handleRefereeDecision} onClose={() => setShowReferee(false)} /></div>)}
            {showChallenge && (<ChallengeControl team={showChallenge} onResolve={handleChallengeResult} onClose={() => setShowChallenge(null)} />)}
            {activeTimeoutTeam && (<TimeoutTimer team={activeTimeoutTeam} onClose={() => setActiveTimeoutTeam(null)} />)}

            <header className="bg-slate-900 text-white shadow-lg shrink-0 z-40 h-16 flex relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-[#ff7b00] skew-x-12 origin-bottom -translate-x-10 z-0 border-r-4 border-black"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[#d9202a] skew-x-12 origin-top translate-x-10 z-0"></div>
                <div className="w-32 xl:w-64 flex-shrink-0 flex items-center gap-4 pl-4 z-10"><div className="bg-black w-12 h-9 xl:w-16 xl:h-10 flex items-center justify-center rounded text-2xl xl:text-3xl text-[#ff7b00] font-bold font-mono border-2 border-white">{state.score.home}</div></div>
                <div className="flex-1 flex justify-center items-center z-10"><div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded"><span className="text-green-400 text-xs xl:text-sm font-bold uppercase tracking-wide">{state.matchPhase}</span></div></div>
                <div className="w-32 xl:w-64 flex-shrink-0 flex items-center justify-end gap-4 pr-4 z-10"><div className="bg-black w-12 h-9 xl:w-16 xl:h-10 flex items-center justify-center rounded text-2xl xl:text-3xl text-[#d9202a] font-bold font-mono border-2 border-white">{state.score.away}</div></div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">

                {/* HOME SIDEBAR (Dynamic Data) */}
                <div className="hidden md:flex flex-col w-32 xl:w-64 bg-white border-r border-slate-300 py-2 gap-2 z-20 shadow-xl flex-shrink-0">
                    <LiberoSection team="home" teamColor="orange" liberos={setupData.home.liberos} rotation={state.rotations.home} />
                    <div className="w-full border-t border-slate-100 my-1"></div>
                    <div className="px-2">
                        <button onClick={() => dispatch({ type: 'REQUEST_SUB', payload: 'home' })} disabled={['RALLY', 'ATTACK', 'SET', 'RECEPTION'].includes(state.matchPhase)} className="w-full bg-orange-50 border-2 border-orange-100 text-[#c75c14] font-black text-[10px] xl:text-xs py-2 rounded hover:bg-orange-100 disabled:opacity-50 flex items-center justify-center gap-2">
                            <Users size={14} /> SUB REQUEST ({state.subsUsed.home}/6)
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col w-full px-2 overflow-y-auto gap-2">
                        <span className="text-xs font-black tracking-widest bg-slate-100 w-full text-center py-1 rounded text-slate-400 uppercase mt-2">BENCH</span>
                        {state.benches.home.map(p => <BenchCard key={p.id} player={p} teamColor="orange" onClick={handlePlayerClick} isSelected={state.selectedPlayer?.id === p.id} />)}
                    </div>
                    <div className="px-2 pb-2 mt-auto flex flex-col gap-2">
                        <div className="flex gap-2">
                            <TimeoutButton
                                onClick={() => {
                                    if (['PRE_SERVE', 'SERVE'].includes(state.matchPhase)) {
                                        dispatch({ type: 'REQUEST_TIMEOUT', payload: 'home' });
                                        setActiveTimeoutTeam('home');
                                    }
                                }}
                                used={state.timeoutsUsed.home}
                                limit={2}
                                disabled={!['PRE_SERVE', 'SERVE'].includes(state.matchPhase)}
                            />
                        </div>
                        <ChallengeButton onClick={() => setShowChallenge('home')} used={state.challengesUsed.home} limit={2} />
                    </div>
                </div>

                {/* COURT AREA */}
                <div className="flex-1 flex flex-col bg-slate-200 relative min-w-0 transition-all">
                    <div className="flex-1 p-2 bg-slate-300 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full p-4 xl:p-16 bg-blue-50 flex items-center justify-center relative overflow-hidden shadow-inner">
                            <div className="w-full max-w-[95%] aspect-[2/1] bg-white border-4 border-white shadow-2xl relative flex">
                                <div className="flex-1 relative border-r-2 border-slate-300">{renderCourtHalf('left', state.rotations.home)}</div>
                                <div className="w-2 h-full bg-slate-800 relative z-30 flex items-center justify-center">
                                    <div className="h-full w-full bg-slate-800"></div>
                                    <button onClick={() => setShowReferee(true)} className="absolute -top-24 flex flex-col items-center z-50 hover:scale-110 transition-transform cursor-pointer group"><span className="text-[10px] font-black text-slate-800 mt-1 bg-white/80 px-2 py-0.5 rounded shadow-sm border border-slate-200 uppercase tracking-wider text-center whitespace-nowrap group-hover:bg-yellow-100">R2 Assist</span><div className="bg-white rounded-full p-1.5 border-2 border-slate-800 shadow-md group-hover:border-yellow-500"><User size={22} className="text-slate-800" /></div></button>
                                    <div className="absolute bg-white border-2 border-slate-900 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg tracking-widest z-40">NET</div>
                                    <button onClick={() => setShowReferee(true)} className="absolute -bottom-24 flex flex-col items-center z-50 hover:scale-110 transition-transform cursor-pointer group"><div className="relative"><div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border-2 border-slate-600 shadow-xl relative z-10 group-hover:border-yellow-400"><User size={24} className="text-white" /></div><div className="absolute -bottom-2 -left-1 w-1.5 h-4 bg-slate-700 skew-x-12"></div><div className="absolute -bottom-2 -right-1 w-1.5 h-4 bg-slate-700 -skew-x-12"></div></div><span className="text-[10px] font-black text-white mt-1.5 bg-slate-800 px-2 py-0.5 rounded shadow-md border border-slate-600 uppercase tracking-wider text-center whitespace-nowrap group-hover:text-yellow-300">R1 CALL</span></button>
                                </div>
                                <div className="flex-1 relative border-l-2 border-slate-300">{renderCourtHalf('right', state.rotations.away)}</div>
                            </div>
                        </div>
                    </div>
                    {/* BOTTOM ACTION BAR */}
                    <div className="h-32 md:h-40 bg-white border-t border-slate-200 p-2 z-40 shadow-[0_-5px_30px_rgba(0,0,0,0.1)] flex-shrink-0"><div className="h-full max-w-7xl mx-auto flex items-center justify-center">{renderControls()}</div></div>
                </div>

                {/* AWAY SIDEBAR (Dynamic Data) */}
                <div className="hidden md:flex flex-col w-32 xl:w-64 bg-white border-l border-slate-300 py-2 gap-2 z-20 shadow-xl flex-shrink-0">
                    <LiberoSection team="away" teamColor="red" liberos={setupData.away.liberos} rotation={state.rotations.away} />
                    <div className="w-full border-t border-slate-100 my-1"></div>
                    <div className="px-2">
                        <button onClick={() => dispatch({ type: 'REQUEST_SUB', payload: 'away' })} disabled={['RALLY', 'ATTACK', 'SET', 'RECEPTION'].includes(state.matchPhase)} className="w-full bg-red-50 border-2 border-red-100 text-[#9e212d] font-black text-[10px] xl:text-xs py-2 rounded hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2">
                            <Users size={14} /> SUB REQUEST ({state.subsUsed.away}/6)
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col w-full px-2 overflow-y-auto gap-2">
                        <span className="text-base md:text-lg font-black tracking-widest bg-slate-100 w-full text-center py-1.5 rounded text-slate-500 uppercase mt-2">BENCH</span>
                        {state.benches.away.map(p => <BenchCard key={p.id} player={p} teamColor="red" onClick={handlePlayerClick} isSelected={state.selectedPlayer?.id === p.id} />)}
                    </div>
                    <div className="px-2 pb-2 mt-auto flex flex-col gap-2">
                        <div className="flex gap-2">
                            <TimeoutButton
                                onClick={() => {
                                    if (['PRE_SERVE', 'SERVE'].includes(state.matchPhase)) {
                                        dispatch({ type: 'REQUEST_TIMEOUT', payload: 'away' });
                                        setActiveTimeoutTeam('away');
                                    }
                                }}
                                used={state.timeoutsUsed.away}
                                limit={2}
                                disabled={!['PRE_SERVE', 'SERVE'].includes(state.matchPhase)}
                            />
                        </div>
                        <ChallengeButton onClick={() => setShowChallenge('away')} used={state.challengesUsed.away} limit={2} />
                    </div>
                </div>

                {/* LOGS */}
                <div className={`bg-white/95 backdrop-blur-md border-l border-slate-200 flex flex-col z-50 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isLogOpen ? 'w-80' : 'w-0'}`}><div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-sm tracking-widest flex justify-between items-center whitespace-nowrap uppercase">MATCH LOG <button onClick={() => setIsLogOpen(false)} className="hover:bg-slate-200 p-1.5 rounded-full text-slate-400"><X size={16} /></button></div><div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50 min-w-[20rem]">{state.logs.map(log => (<div key={log.id} className={`text-xs p-3 rounded-lg border shadow-sm ${log.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : log.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-800' : log.type === 'highlight' ? 'bg-purple-50 border-purple-100 text-purple-800' : log.type === 'correction' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-white border-slate-200 text-slate-600'} flex flex-col gap-1.5 transition-all hover:shadow-md`}><div className="flex justify-between items-center opacity-60 text-[10px] font-bold uppercase tracking-wide"><span className="flex items-center gap-1"><Clock size={10} /> {log.time.split(' ')[0]}</span>{log.type === 'highlight' && <span className="bg-yellow-400 text-yellow-900 px-1.5 rounded-sm">SCORE</span>}</div><div className="flex gap-2.5 items-start"><div className="mt-0.5 opacity-80"><FileText size={16} /></div><span className="font-bold leading-relaxed">{log.text}</span></div></div>))}</div></div>
                <button onClick={() => setIsLogOpen(!isLogOpen)} className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 hover:scale-110 transition-all active:scale-95 border-4 border-white">{isLogOpen ? <X size={24} /> : <ScrollText size={24} />}</button>
            </div>
        </div>
    );
}