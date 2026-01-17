import { processRotation } from '../utils/volleyballLogic';

// ==========================================
// 1. HELPERS & ANALYTICS
// ==========================================

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// [FIXED] Court Zone Logic (Returns 1-6)
const getZoneFromPoint = (point) => {
    if (!point) return null;
    if (typeof point === 'number' || (typeof point === 'string' && !isNaN(point))) {
        return parseInt(point);
    }

    if (point.x !== undefined && point.y !== undefined) {
        const x = parseFloat(point.x);
        const y = parseFloat(point.y);

        // Court Dimensions: 18m wide (0-18), 9m tall (0-9)
        const isLeftCourt = x <= 9; // Home

        // Distance from net (x=9)
        const distFromNet = isLeftCourt ? (9 - x) : (x - 9);

        // Front Row is within ~3.5m of net
        const isFrontRow = distFromNet <= 3.5;

        // Vertical Thirds (0-3, 3-6, 6-9)
        const isTopThird = y >= 6;
        const isBottomThird = y <= 3;

        if (isLeftCourt) {
            // Home (Left)
            if (isFrontRow) {
                if (isTopThird) return 4;
                if (isBottomThird) return 2;
                return 3;
            } else {
                if (isTopThird) return 5;
                if (isBottomThird) return 1;
                return 6;
            }
        } else {
            // Away (Right) - Mirrored
            if (isFrontRow) {
                if (isTopThird) return 2;
                if (isBottomThird) return 4;
                return 3;
            } else {
                if (isTopThird) return 1;
                if (isBottomThird) return 5;
                return 6;
            }
        }
    }
    return null;
};

// Uses getZoneFromPoint to avoid duplicate math
const getCoordinateDescription = (point) => {
    if (!point || !point.x || !point.y) return "";
    const zone = getZoneFromPoint(point);

    const x = parseFloat(point.x);
    const y = parseFloat(point.y);
    const isLeft = x <= 9;
    let localX = isLeft ? x : (x - 9);
    const distFromNet = isLeft ? (9 - localX) : localX;
    const distFromSideline = Math.min(y, 9 - y);

    let depthDesc = "";
    if (distFromNet < 0.8) depthDesc = "Tight";
    else if (distFromNet <= 3.2) depthDesc = "3m";
    else if (distFromNet <= 6.0) depthDesc = "Short";
    else if (distFromNet >= 7.5) depthDesc = "Deep";

    let angleDesc = "";
    if (distFromSideline < 1.0) angleDesc = "Line";
    else if (Math.abs(y - 3) < 0.8 || Math.abs(y - 6) < 0.8) angleDesc = "Seam";
    else if (distFromNet < 3.5 && distFromSideline < 2.5) angleDesc = "Sharp";
    else {
        if (zone === 6 || zone === 3) angleDesc = "Center";
        else angleDesc = "Cross";
    }

    if (angleDesc === "Sharp") return `Sharp Angle (Zone ${zone})`;
    if (depthDesc === "Tight") return `Tight Net (Zone ${zone})`;
    if (depthDesc === "3m") return angleDesc === "Line" ? `3m Line (Zone ${zone})` : `Inside 3m (Zone ${zone})`;

    const parts = [depthDesc, angleDesc].filter(Boolean);
    const text = parts.length > 0 ? parts.join(" ") : "Middle";
    return `${text} (Zone ${zone})`;
};

export const getPlayerStats = (history, playerId) => {
    let stats = {
        points: 0,
        serve: { total: 0, ace: 0, error: 0 },
        reception: { total: 0, perfect: 0, positive: 0, error: 0, byZone: {} },
        attack: { total: 0, kill: 0, error: 0, blocked: 0, byZone: {} },
        block: { points: 0, touch: 0, error: 0 },
        dig: { total: 0, success: 0, error: 0 },
        set: { total: 0, assist: 0 }, // [FIX] Added Set/Assist tracking

        receptionRate: "0",
        attackEff: "0.000"
    };

    // Initialize Zone Buckets
    [1, 2, 3, 4, 5, 6].forEach(z => {
        stats.reception.byZone[z] = { total: 0, success: 0 };
        stats.attack.byZone[z] = { total: 0, kill: 0, error: 0 };
    });

    if (!history || !Array.isArray(history)) return { stats };

    history.forEach(rally => {
        if (!rally.events) return;

        rally.events.forEach((event, index) => {
            const isPlayer = event.player && String(event.player.id) === String(playerId);

            if (isPlayer) {
                const zone = getZoneFromPoint(event.fromPoint || event.toPoint);

                switch (event.type) {
                    case 'SERVE':
                        stats.serve.total++;
                        if (event.result === 'ACE') { stats.serve.ace++; stats.points++; }
                        else if (event.result === 'ERROR') stats.serve.error++;
                        break;

                    case 'RECEPTION':
                        stats.reception.total++;
                        const g = Number(event.grade);
                        const isRecSuccess = g >= 2;

                        if (g === 3) stats.reception.perfect++;
                        else if (g === 2) stats.reception.positive++;
                        else if (g === 0) stats.reception.error++;

                        if (zone && stats.reception.byZone[zone]) {
                            stats.reception.byZone[zone].total++;
                            if (isRecSuccess) stats.reception.byZone[zone].success++;
                        }
                        break;

                    case 'ATTACK':
                        stats.attack.total++;
                        if (zone && stats.attack.byZone[zone]) {
                            stats.attack.byZone[zone].total++;
                        }

                        if (event.result === 'KILL') {
                            stats.attack.kill++; stats.points++;
                            if (zone && stats.attack.byZone[zone]) stats.attack.byZone[zone].kill++;
                        }
                        else if (event.result === 'ERROR') {
                            stats.attack.error++;
                            if (zone && stats.attack.byZone[zone]) stats.attack.byZone[zone].error++;
                        }
                        else if (event.result === 'BLOCKED') stats.attack.blocked++;
                        break;

                    case 'DIG':
                        stats.dig.total++;
                        if (event.result === 'ERROR' || Number(event.grade) === 0) stats.dig.error++;
                        else stats.dig.success++;
                        break;

                    case 'SET':
                        stats.set.total++;
                        // [FIX] Assist Logic: Check if NEXT event is a KILL by a teammate
                        const nextEvent = rally.events[index + 1];
                        if (nextEvent && nextEvent.type === 'ATTACK' && nextEvent.result === 'KILL') {
                            stats.set.assist++;
                        }
                        break;

                    default: break;
                }
            }

            // Block Events
            if (event.type === 'BLOCK' && event.players && Array.isArray(event.players)) {
                if (event.players.some(p => String(p.id) === String(playerId))) {
                    if (event.result === 'SHUTDOWN') { stats.block.points++; stats.points++; }
                    else if (event.result === 'TOUCH') stats.block.touch++;
                    else if (event.result === 'ERROR') stats.block.error++;
                }
            }
        });
    });

    // --- FORMULA CALCULATIONS ---
    const formatPct = (num, den) => {
        if (den === 0) return "0";
        return Math.max(0, (num / den) * 100).toFixed(0);
    };
    const formatEff = (k, e, b, total) => {
        if (total === 0) return "0.000";
        return ((k - e - b) / total).toFixed(3);
    };

    stats.receptionRate = formatPct(stats.reception.perfect + stats.reception.positive, stats.reception.total);
    stats.attackEff = formatEff(stats.attack.kill, stats.attack.error, stats.attack.blocked, stats.attack.total);

    return { stats };
};

// ==========================================
// 2. INITIAL STATE
// ==========================================

const INITIAL_RALLY_DATA = {
    startTime: null,
    servingTeam: null,
    startScore: { home: 0, away: 0 },
    events: [],
    serveType: null,
    serveResult: null,
    blockers: [],
    setter: null,
    attacker: null,
    receiver: null,
    target: null,
    pendingResult: null,
    landingPoint: null,
    landingZone: null,
    systemState: null
};

export const createInitialState = (setupData, savedState) => {
    if (savedState) {
        return {
            ...savedState,
            teamNames: savedState.teamNames || { home: setupData?.home?.name || 'Home', away: setupData?.away?.name || 'Away' },
            history: savedState.history || [],
            liberoLists: savedState.liberoLists || { home: setupData?.home?.liberos || [], away: setupData?.away?.liberos || [] },
            liberoOriginals: savedState.liberoOriginals || { home: {}, away: {} }
        };
    }
    return {
        teamNames: { home: setupData?.home?.name || 'Home', away: setupData?.away?.name || 'Away' },
        score: { home: 0, away: 0 },
        matchPhase: 'PRE_SERVE',
        actionTeam: null,
        servingTeam: 'home',
        lastServer: 'home',
        possession: 'home',
        challengesUsed: { home: 0, away: 0 },
        timeoutsUsed: { home: 0, away: 0 },
        previousState: null,
        rotations: { home: [...(setupData?.home?.court || [])], away: [...(setupData?.away?.court || [])] },
        liberoOriginals: { home: {}, away: {} },
        liberoLists: { home: [...(setupData?.home?.liberos || [])], away: [...(setupData?.away?.liberos || [])] },
        subsUsed: { home: 0, away: 0 },
        benches: { home: [...(setupData?.home?.bench || [])], away: [...(setupData?.away?.bench || [])] },
        history: [],
        logs: [{ id: Date.now(), time: new Date().toLocaleTimeString(), text: "Match Started", type: 'info' }],
        selectedPlayer: null,
        rallyData: INITIAL_RALLY_DATA
    };
};

// ==========================================
// 3. REDUCER
// ==========================================

export const gameReducer = (state, action) => {
    const getTime = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
    const addLog = (text, type = 'info', existingLogs = state.logs) => [{ id: Date.now(), time: getTime(), text, type }, ...existingLogs];

    // --- FORMATTERS ---
    const fmt = (p) => p ? `[#${p.number} ${p.name}]` : '[Unknown]';
    const fmtTeam = (side) => (state.teamNames && state.teamNames[side]) ? state.teamNames[side] : (side === 'home' ? 'HOME' : 'AWAY');
    const fmtGrade = (g) => { if (g === 3) return "Perfect"; if (g === 2) return "Positive"; if (g === 1) return "Poor"; return "Error"; };

    const recordEvent = (eventType, player, data = {}) => {
        const event = { type: eventType, player: player, timestamp: Date.now(), team: state.possession, ...data };
        return [...state.rallyData.events, event];
    };

    const finalizePoint = (currentState, winner, reason) => {
        const snapshot = deepClone(currentState);
        const newScore = { ...currentState.score, [winner]: currentState.score[winner] + 1 };

        const rallyRecord = {
            id: Date.now(),
            startTime: currentState.rallyData.startTime,
            endTime: Date.now(),
            winner,
            reason,
            scoreState: { ...currentState.score },
            endScore: newScore,
            servingTeam: currentState.servingTeam,
            events: currentState.rallyData.events,
            rotations: {
                home: currentState.rotations.home.map(p => p?.id),
                away: currentState.rotations.away.map(p => p?.id)
            },
        };

        const lastServer = currentState.lastServer || currentState.servingTeam;
        const shouldRotate = winner !== lastServer;
        let newRotations = { ...currentState.rotations };
        let newOriginals = { ...currentState.liberoOriginals };
        let rotationLog = null;

        if (shouldRotate) {
            const rotData = processRotation(newRotations[winner], newOriginals[winner]);
            newRotations[winner] = rotData.newRotation;
            newOriginals[winner] = rotData.newOriginals;
            if (rotData.autoSwapLog) rotationLog = rotData.autoSwapLog;
        }

        let newLogs = addLog(`${reason} -> ${fmtTeam(winner)} Point`, 'highlight', currentState.logs);
        if (rotationLog) newLogs = [{ id: Date.now() + 1, time: getTime(), text: rotationLog.text, type: rotationLog.type }, ...newLogs];

        return {
            ...currentState,
            previousState: snapshot,
            score: newScore,
            servingTeam: winner,
            rotations: newRotations,
            liberoOriginals: newOriginals,
            matchPhase: 'PRE_SERVE',
            history: [rallyRecord, ...currentState.history],
            logs: newLogs,
            rallyData: INITIAL_RALLY_DATA,
            selectedPlayer: null
        };
    };

    switch (action.type) {
        case 'REQUEST_TIMEOUT': { const team = action.payload; if (state.timeoutsUsed[team] >= 2) return state; return { ...state, timeoutsUsed: { ...state.timeoutsUsed, [team]: state.timeoutsUsed[team] + 1 }, logs: addLog(`[TIMEOUT] ${fmtTeam(team)}`, 'highlight') }; }
        case 'EXECUTE_SUB': { const { benchPlayer, courtPlayer } = action.payload; const subTeam = state.actionTeam; const newBench = state.benches[subTeam].filter(p => p.id !== benchPlayer.id); newBench.push(courtPlayer); const newRot = state.rotations[subTeam].map(p => p.id === courtPlayer.id ? benchPlayer : p); return { ...state, rotations: { ...state.rotations, [subTeam]: newRot }, benches: { ...state.benches, [subTeam]: newBench }, subsUsed: { ...state.subsUsed, [subTeam]: state.subsUsed[subTeam] + 1 }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`[SUB] ${fmtTeam(subTeam)}: ${fmt(benchPlayer)} In, ${fmt(courtPlayer)} Out`, 'info') }; }
        case 'EXECUTE_LIBERO_SWAP': { const { libero, player, zoneIndex, team: lTeam } = action.payload; const newLRotation = [...state.rotations[lTeam]]; const newLOriginals = { ...state.liberoOriginals[lTeam] }; let newLBench = [...state.benches[lTeam]]; const currentPlayerInZone = newLRotation[zoneIndex]; if (currentPlayerInZone.id !== libero.id) { newLRotation[zoneIndex] = libero; newLOriginals[libero.id] = currentPlayerInZone; if (!newLBench.some(p => p.id === currentPlayerInZone.id)) newLBench.push(currentPlayerInZone); } else { const original = newLOriginals[libero.id]; if (!original) { console.error("No original player found"); return state; } newLRotation[zoneIndex] = original; delete newLOriginals[libero.id]; newLBench = newLBench.filter(p => p.id !== original.id); } return { ...state, rotations: { ...state.rotations, [lTeam]: newLRotation }, liberoOriginals: { ...state.liberoOriginals, [lTeam]: newLOriginals }, benches: { ...state.benches, [lTeam]: newLBench }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`[L-SWAP] ${fmtTeam(lTeam)}: Libero Swap`, 'info') }; }
        case 'REQUEST_SUB': return { ...state, matchPhase: 'SUBSTITUTION', actionTeam: action.payload, selectedPlayer: null };
        case 'REQUEST_LIBERO_SWAP': return { ...state, matchPhase: 'LIBERO_SWAP', actionTeam: action.payload, selectedPlayer: null };

        case 'SELECT_PLAYER': {
            const p = action.payload; if (!p) return state;
            const isHome = state.rotations.home.some(x => x?.id === p.id) || state.benches.home.some(x => x.id === p.id) || (state.liberoLists?.home?.some(x => x.id === p.id));
            const pTeam = isHome ? 'home' : 'away';
            if (['SUBSTITUTION', 'LIBERO_SWAP'].includes(state.matchPhase)) {
                if (pTeam !== state.actionTeam) return state;
                if (!state.selectedPlayer) return { ...state, selectedPlayer: p };
                else {
                    const p1 = state.selectedPlayer; const p2 = p;
                    if (state.matchPhase === 'SUBSTITUTION') return gameReducer(state, { type: 'EXECUTE_SUB', payload: { benchPlayer: p1, courtPlayer: p2 } });
                    if (state.matchPhase === 'LIBERO_SWAP') {
                        if (!p1.isLibero && !p2.isLibero) { alert("One player must be a Libero"); return { ...state, selectedPlayer: null }; }
                        const currentRotation = state.rotations[pTeam];
                        let zoneIndex = currentRotation.findIndex(r => r && r.id === p1.id);
                        if (zoneIndex === -1) zoneIndex = currentRotation.findIndex(r => r && r.id === p2.id);
                        if (zoneIndex === -1) { alert("Select a player currently on court"); return { ...state, selectedPlayer: null }; }
                        if (zoneIndex > 2) { alert("Liberos only Back Row"); return { ...state, selectedPlayer: null }; }
                        const libero = p1.isLibero ? p1 : p2;
                        const courtPlayer = p1.isLibero ? p2 : p1;
                        return gameReducer(state, { type: 'EXECUTE_LIBERO_SWAP', payload: { libero, player: courtPlayer, zoneIndex, team: pTeam } });
                    }
                }
            }
            const pTeamStandard = (state.rotations.home.find(x => x?.id === p.id)) ? 'home' : 'away';
            if (state.matchPhase === 'SELECT_BLOCKERS') return gameReducer(state, { type: 'TOGGLE_BLOCKER', payload: p });
            if (state.matchPhase === 'COVER') return gameReducer(state, { type: 'EXECUTE_COVER', payload: { ...p } });
            let newData = { ...state.rallyData };
            if (state.matchPhase === 'RECEPTION') newData.receiver = p;
            if (state.matchPhase === 'DIG_DECISION') newData.target = p;
            return { ...state, selectedPlayer: p, rallyData: newData };
        }

        case 'CANCEL_SELECTION': case 'CANCEL_ACTION': return { ...state, selectedPlayer: null, matchPhase: state.matchPhase === 'DIG_DECISION' ? 'LANDING' : (['SUBSTITUTION', 'LIBERO_SWAP'].includes(state.matchPhase) ? 'PRE_SERVE' : state.matchPhase), actionTeam: null, rallyData: { ...state.rallyData, serveType: null, serveResult: null, blockers: [] } };
        case 'UNDO_STEP': { if (state.matchPhase === 'PRE_SERVE' && state.previousState) return state.previousState; const current = state.matchPhase; if (current === 'SERVE') return { ...state, rallyData: { ...state.rallyData, serveType: null } }; return { ...state, matchPhase: 'PRE_SERVE' }; }
        case 'INIT_SERVE': return { ...state, matchPhase: 'SERVE', lastServer: state.servingTeam, selectedPlayer: state.rotations[state.servingTeam][0], possession: state.servingTeam, rallyData: { ...INITIAL_RALLY_DATA, startTime: Date.now(), servingTeam: state.servingTeam, startScore: { ...state.score } } };
        case 'SET_SERVE_TYPE': return { ...state, rallyData: { ...state.rallyData, serveType: action.payload } };
        case 'SET_SERVE_RESULT': {
            const { serveType } = state.rallyData; const result = action.payload; const opp = state.servingTeam === 'home' ? 'away' : 'home';
            const serveEvent = { subType: serveType, result: result, fromZone: 1 }; const newEvents = recordEvent('SERVE', state.selectedPlayer, serveEvent);
            if (result === 'ERROR') return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: newEvents } }, opp, `[SERVICE] ${fmt(state.selectedPlayer)} Error`);
            if (result === 'ACE') return { ...state, matchPhase: 'SERVE_LANDING', rallyData: { ...state.rallyData, serveResult: 'ACE', events: newEvents }, logs: addLog(`[SERVICE] ${fmt(state.selectedPlayer)} Ace -> Select Landing`, 'success') };
            return { ...state, matchPhase: 'SERVE_LANDING', rallyData: { ...state.rallyData, serveResult: 'IN_PLAY', events: newEvents }, logs: addLog(`${fmt(state.selectedPlayer)} Serve (${serveType})`, 'info') };
        }
        case 'SELECT_LANDING_POINT': {
            const { point, opponentTeam } = action.payload; const isCoord = point && point.x !== undefined; const zone = isCoord ? getZoneFromPoint(point) : point; const locDesc = isCoord ? getCoordinateDescription(point) : `Zone ${point}`;
            if (state.matchPhase === 'SERVE_LANDING' && state.rallyData.serveResult === 'ACE') { const events = [...state.rallyData.events]; events[events.length - 1].toPoint = point; return finalizePoint({ ...state, rallyData: { ...state.rallyData, events } }, state.servingTeam, `${fmt(state.selectedPlayer)} Ace (${locDesc})`); }
            if (state.matchPhase === 'SERVE_LANDING') return { ...state, matchPhase: 'RECEPTION', possession: opponentTeam, rallyData: { ...state.rallyData, landingPoint: point, landingZone: zone, receiver: null }, selectedPlayer: null };
            let targetPlayer = null; if (!isCoord) { const zoneToIdxMap = { 1: 0, 6: 1, 5: 2, 4: 3, 3: 4, 2: 5 }; targetPlayer = state.rotations[opponentTeam][zoneToIdxMap[point]]; }
            return { ...state, matchPhase: 'DIG_DECISION', rallyData: { ...state.rallyData, landingPoint: point, landingZone: zone, target: targetPlayer }, selectedPlayer: targetPlayer };
        }
        case 'RECEPTION_GRADE': {
            const { quality, player } = action.payload; const sysState = quality >= 2 ? 'IN_SYSTEM' : 'OUT_OF_SYSTEM';
            const numQ = Number(quality); const landingDesc = state.rallyData.landingPoint ? getCoordinateDescription(state.rallyData.landingPoint) : ""; const isDig = (state.possession === state.servingTeam); const type = isDig ? 'DIG' : 'RECEPTION'; const eventData = { grade: numQ, systemState: sysState, fromPoint: state.rallyData.landingPoint, result: numQ === 0 ? 'ERROR' : 'IN_PLAY' }; const newEvents = recordEvent(type, player, eventData);
            if (numQ === 0) { const winner = state.possession === 'home' ? 'away' : 'home'; const reason = isDig ? 'Dig Error' : 'Reception Error'; const logText = `${fmt(player)} ${reason} @ ${landingDesc}`; return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: newEvents } }, winner, logText); }
            return { ...state, matchPhase: 'SET', selectedPlayer: null, rallyData: { ...state.rallyData, events: newEvents, systemState: sysState }, logs: addLog(`${fmt(player)} ${type} -> ${fmtGrade(numQ)}`, 'info') };
        }
        case 'EXECUTE_SET': {
            const type = action.payload; const newEvents = recordEvent('SET', state.selectedPlayer, { subType: type });
            if (type === 'Dump') return { ...state, matchPhase: 'LANDING', rallyData: { ...state.rallyData, events: newEvents, attacker: state.selectedPlayer, attackType: 'Dump' }, logs: addLog(`${fmt(state.selectedPlayer)} Dump`, 'info') };
            return { ...state, matchPhase: 'ATTACK', selectedPlayer: null, rallyData: { ...state.rallyData, events: newEvents, setter: state.selectedPlayer }, logs: addLog(`${fmt(state.selectedPlayer)} Set (${type})`, 'info') };
        }
        case 'EXECUTE_ATTACK': { const type = action.payload; return { ...state, matchPhase: 'LANDING', rallyData: { ...state.rallyData, attacker: state.selectedPlayer, attackType: type }, selectedPlayer: null, logs: addLog(`${fmt(state.selectedPlayer)} Attack (${type})`, 'info') }; }
        case 'ATTACK_RESULT': {
            const { result } = action.payload; const { attacker, attackType, landingPoint, target } = state.rallyData; const attTeam = state.possession; const defTeam = attTeam === 'home' ? 'away' : 'home'; const locDesc = landingPoint ? getCoordinateDescription(landingPoint) : ""; const attackEvent = { subType: attackType, result: result, toPoint: landingPoint }; const currentEvents = recordEvent('ATTACK', attacker, attackEvent);
            if (result === 'KILL') {
                let finalEvents = currentEvents; let logSuffix = "";
                if (target) { const digErrorEvent = { type: 'DIG', player: target, timestamp: Date.now(), team: defTeam, grade: 0, result: 'ERROR' }; finalEvents = [...currentEvents, digErrorEvent]; logSuffix = ` (${target.name} Error)`; }
                return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: finalEvents } }, attTeam, `${fmt(attacker)} Kill -> ${locDesc}${logSuffix}`);
            }
            if (result === 'ERROR') return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: currentEvents } }, defTeam, `${fmt(attacker)} Attack Error`);
            if (result === 'DIG') {
                let finalEvents = currentEvents;
                if (target) { const digSuccessEvent = { type: 'DIG', player: target, timestamp: Date.now(), team: defTeam, grade: 3, result: 'SUCCESS' }; finalEvents = [...currentEvents, digSuccessEvent]; }
                return { ...state, matchPhase: 'RECEPTION', possession: defTeam, selectedPlayer: target, rallyData: { ...state.rallyData, events: finalEvents, receiver: target, attacker: null } };
            }
            return state;
        }
        case 'BLOCK_DETECTED': return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
        case 'BLOCK_OUTCOME': {
            const outcome = action.payload; if (outcome === 'SHUTDOWN') return { ...state, matchPhase: 'SELECT_BLOCKERS', rallyData: { ...state.rallyData, pendingResult: 'SHUTDOWN' }, logs: addLog("Block Shutdown -> Select Blockers", "info") };
            const { blockers, attacker, attackType } = state.rallyData; const attTeam = state.possession; const attackEvent = { subType: attackType, result: 'IN_PLAY' }; let currentEvents = recordEvent('ATTACK', attacker, attackEvent); const blockEvent = { type: 'BLOCK', players: blockers, result: outcome, timestamp: Date.now(), team: attTeam === 'home' ? 'away' : 'home' }; const eventsWithBlock = [...currentEvents, blockEvent];
            if (outcome === 'TOUCH_OUT') return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: eventsWithBlock } }, attTeam, 'Tool / Kill');
            if (outcome === 'REBOUND') return { ...state, matchPhase: 'COVER', possession: attTeam, rallyData: { ...state.rallyData, events: eventsWithBlock }, logs: addLog('[BLOCK] Rebound -> Cover', 'info') };
            if (outcome === 'SOFT_BLOCK') return { ...state, matchPhase: 'RECEPTION', possession: attTeam === 'home' ? 'away' : 'home', rallyData: { ...state.rallyData, events: eventsWithBlock }, logs: addLog('[BLOCK] Soft Touch -> Transition', 'info') };
            return state;
        }
        case 'TOGGLE_BLOCKER': { const p = action.payload; const currentBlockers = state.rallyData.blockers; const exists = currentBlockers.find(b => b.id === p.id); const newBlockers = exists ? currentBlockers.filter(b => b.id !== p.id) : [...currentBlockers, p]; return { ...state, rallyData: { ...state.rallyData, blockers: newBlockers } }; }
        case 'CONFIRM_BLOCK': {
            const { pendingResult, blockers, attacker, attackType } = state.rallyData; const defTeam = state.possession === 'home' ? 'away' : 'home';
            if (pendingResult === 'SHUTDOWN') { const attackEvent = { subType: attackType, result: 'BLOCKED' }; let currentEvents = recordEvent('ATTACK', attacker, attackEvent); const blockEvent = { type: 'BLOCK', players: blockers, result: 'SHUTDOWN', timestamp: Date.now(), team: defTeam }; const eventsWithBlock = [...currentEvents, blockEvent]; const names = blockers.map(b => b.name).join(' & '); return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: eventsWithBlock } }, defTeam, `[BLOCK] ${names} -> Kill`); }
            return state;
        }
        case 'EXECUTE_COVER': { const coverEvent = { result: 'COVER' }; const newEvents = recordEvent('DIG', action.payload, coverEvent); return { ...state, matchPhase: 'SET', selectedPlayer: null, rallyData: { ...state.rallyData, events: newEvents }, logs: addLog(`${fmt(action.payload)} Cover`, 'info') }; }

        case 'REFEREE_DECISION': { const { winner, reason } = action.payload; if (!winner || reason === 'Replay') return { ...state, matchPhase: 'PRE_SERVE', selectedPlayer: null, rallyData: INITIAL_RALLY_DATA, logs: addLog(`[REFEREE] REPLAY`, 'correction') }; if (!['home', 'away'].includes(winner)) return state; return finalizePoint(state, winner, `[REFEREE] ${reason}`); }

        case 'CHALLENGE_RESULT': {
            const { team, success, reason } = action.payload;
            if (!success) {
                const newChallenges = { ...state.challengesUsed }; newChallenges[team] += 1;
                return { ...state, challengesUsed: newChallenges, logs: addLog(`[CHALLENGE] ${reason} -> FAILED`, 'danger') };
            }
            const winner = team;
            if (!state.previousState) { console.error("No previous state to revert to"); return state; }
            const baseState = deepClone(state.previousState);
            const newScore = { ...baseState.score, [winner]: baseState.score[winner] + 1 };
            const lastServer = baseState.lastServer || baseState.servingTeam;
            const shouldRotate = winner !== lastServer;
            let newRotations = { ...baseState.rotations };
            let newOriginals = { ...baseState.liberoOriginals };
            if (shouldRotate) {
                const rotData = processRotation(newRotations[winner], newOriginals[winner]);
                newRotations[winner] = rotData.newRotation;
                newOriginals[winner] = rotData.newOriginals;
            }

            // [FIX] ATTEMPT TO RESTORE EVENTS FROM OVERTURNED RALLY
            // This prevents "Ghost Points" where stats are lost.
            // We take the bad rally's events, remove the last event (the error/block), and assume point awarded.
            let salvagedEvents = [];
            const badRally = state.history[0]; // The rally being overturned
            if (badRally && badRally.events) {
                // Clone events
                let tempEvents = [...badRally.events];
                // Remove the last event (the one that caused the wrong call, e.g., the Block or the Attack Error)
                // In a blocked scenario: ATTACK (Blocked) -> BLOCK (Shutdown)
                // If we overturn (Net Touch), we remove Block. The Attack becomes the "Winner".
                if (tempEvents.length > 0) {
                    const lastEvent = tempEvents[tempEvents.length - 1];
                    // If it was a block, remove it.
                    if (lastEvent.type === 'BLOCK') {
                        tempEvents.pop();
                        // Now last event is likely ATTACK. We should update its result to KILL or IN_PLAY.
                        if (tempEvents.length > 0) {
                            const attackEv = tempEvents[tempEvents.length - 1];
                            if (attackEv.type === 'ATTACK') {
                                attackEv.result = 'KILL'; // Attribute point to attacker
                            }
                        }
                    } else {
                        // For generic overturns, just keep events as is, implies opponent error
                    }
                }
                salvagedEvents = tempEvents;
            }

            const correctionRally = {
                id: Date.now(),
                startTime: Date.now(),
                endTime: Date.now(),
                winner: winner,
                reason: `[CHALLENGE] ${reason} -> SUCCESS`,
                scoreState: { ...baseState.score },
                endScore: newScore,
                servingTeam: winner,
                events: salvagedEvents, // [FIX] Use salvaged events
                rotations: { home: newRotations.home.map(p => p?.id), away: newRotations.away.map(p => p?.id) }
            };

            return {
                ...baseState,
                previousState: null,
                score: newScore,
                servingTeam: winner,
                rotations: newRotations,
                liberoOriginals: newOriginals,
                matchPhase: 'PRE_SERVE',
                history: [correctionRally, ...baseState.history],
                logs: [{ id: Date.now(), time: getTime(), text: `[CHALLENGE] Overturn -> ${fmtTeam(winner)} Point`, type: 'success' }, ...baseState.logs],
                challengesUsed: state.challengesUsed,
                rallyData: INITIAL_RALLY_DATA,
                selectedPlayer: null
            };
        }

        default: return state;
    }
};