import { processRotation } from '../utils/volleyballLogic';

// ==========================================
// 1. HELPERS & ANALYTICS
// ==========================================

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const getZoneFromPoint = (point) => {
    if (!point) return null;
    if (typeof point === 'number' || (typeof point === 'string' && !isNaN(point))) {
        return parseInt(point);
    }
    if (point.x !== undefined && point.y !== undefined) {
        const x = parseFloat(point.x);
        const y = parseFloat(point.y);
        const isLeftCourt = x <= 9;
        const distFromNet = isLeftCourt ? (9 - x) : (x - 9);
        const isFrontRow = distFromNet <= 3.5;
        const isTopThird = y >= 6;
        const isBottomThird = y <= 3;

        if (isLeftCourt) {
            if (isFrontRow) return isTopThird ? 4 : isBottomThird ? 2 : 3;
            return isTopThird ? 5 : isBottomThird ? 1 : 6;
        } else {
            if (isFrontRow) return isTopThird ? 2 : isBottomThird ? 4 : 3;
            return isTopThird ? 1 : isBottomThird ? 5 : 6;
        }
    }
    return null;
};

const getCoordinateDescription = (point) => {
    if (!point || !point.x || !point.y) return "";
    const zone = getZoneFromPoint(point);
    const distFromNet = (parseFloat(point.x) <= 9 ? (9 - parseFloat(point.x)) : (parseFloat(point.x) - 9));
    let desc = distFromNet < 0.8 ? "Tight" : distFromNet <= 3.2 ? "3m" : distFromNet <= 6.0 ? "Short" : "Deep";
    return `${desc} (Zone ${zone})`;
};

export const getPlayerStats = (history, playerId) => {
    let stats = {
        points: 0, serve: { total: 0, ace: 0, error: 0 },
        reception: { total: 0, perfect: 0, positive: 0, error: 0, byZone: {} },
        attack: { total: 0, kill: 0, error: 0, blocked: 0, byZone: {} },
        block: { points: 0, touch: 0, error: 0 }, dig: { total: 0, success: 0, error: 0 },
        set: { total: 0, assist: 0 }, receptionRate: "0", attackEff: "0.000"
    };

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
                        if (g === 3) stats.reception.perfect++; else if (g === 2) stats.reception.positive++; else if (g === 0) stats.reception.error++;
                        if (zone && stats.reception.byZone[zone]) {
                            stats.reception.byZone[zone].total++;
                            if (g >= 2) stats.reception.byZone[zone].success++;
                        }
                        break;
                    case 'ATTACK':
                        stats.attack.total++;
                        if (zone && stats.attack.byZone[zone]) stats.attack.byZone[zone].total++;
                        if (event.result === 'KILL') {
                            stats.attack.kill++; stats.points++;
                            if (zone && stats.attack.byZone[zone]) stats.attack.byZone[zone].kill++;
                        } else if (event.result === 'ERROR') {
                            stats.attack.error++;
                            if (zone && stats.attack.byZone[zone]) stats.attack.byZone[zone].error++;
                        } else if (event.result === 'BLOCKED') stats.attack.blocked++;
                        break;
                    case 'DIG':
                        stats.dig.total++;
                        if (event.result === 'ERROR' || Number(event.grade) === 0) stats.dig.error++; else stats.dig.success++;
                        break;
                    case 'SET':
                        stats.set.total++;
                        const nextEvent = rally.events[index + 1];
                        if (nextEvent && nextEvent.type === 'ATTACK' && nextEvent.result === 'KILL') stats.set.assist++;
                        break;
                    default: break;
                }
            }
            if (event.type === 'BLOCK' && event.players?.some(p => String(p.id) === String(playerId))) {
                if (event.result === 'SHUTDOWN') { stats.block.points++; stats.points++; }
                else if (event.result === 'TOUCH') stats.block.touch++;
                else if (event.result === 'ERROR') stats.block.error++;
            }
        });
    });

    const formatPct = (num, den) => den === 0 ? "0" : Math.max(0, (num / den) * 100).toFixed(0);
    const formatEff = (k, e, b, total) => total === 0 ? "0.000" : ((k - e - b) / total).toFixed(3);
    stats.receptionRate = formatPct(stats.reception.perfect + stats.reception.positive, stats.reception.total);
    stats.attackEff = formatEff(stats.attack.kill, stats.attack.error, stats.attack.blocked, stats.attack.total);
    return { stats };
};

const INITIAL_RALLY_DATA = {
    startTime: null, servingTeam: null, startScore: { home: 0, away: 0 },
    events: [], serveType: null, serveResult: null, blockers: [],
    setter: null, attacker: null, receiver: null, target: null,
    pendingResult: null, landingPoint: null, landingZone: null, systemState: null
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
        score: { home: 0, away: 0 }, matchPhase: 'PRE_SERVE', actionTeam: null, servingTeam: 'home', lastServer: 'home', possession: 'home',
        challengesUsed: { home: 0, away: 0 }, timeoutsUsed: { home: 0, away: 0 }, previousState: null,
        rotations: { home: [...(setupData?.home?.court || [])], away: [...(setupData?.away?.court || [])] },
        liberoOriginals: { home: {}, away: {} }, liberoLists: { home: [...(setupData?.home?.liberos || [])], away: [...(setupData?.away?.liberos || [])] },
        subsUsed: { home: 0, away: 0 }, benches: { home: [...(setupData?.home?.bench || [])], away: [...(setupData?.away?.bench || [])] },
        history: [], logs: [{ id: Date.now(), time: new Date().toLocaleTimeString(), text: "Match Started", type: 'info' }],
        selectedPlayer: null, rallyData: INITIAL_RALLY_DATA
    };
};

export const gameReducer = (state, action) => {
    const getTime = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
    const addLog = (text, type = 'info', existingLogs = state.logs) => [{ id: Date.now(), time: getTime(), text, type }, ...existingLogs];
    const fmt = (p) => p ? `[#${p.number} ${p.name}]` : '[Unknown]';
    const fmtTeam = (side) => (state.teamNames && state.teamNames[side]) ? state.teamNames[side] : (side === 'home' ? 'HOME' : 'AWAY');
    const fmtGrade = (g) => g === 3 ? "Perfect" : g === 2 ? "Positive" : g === 1 ? "Poor" : "Error";

    const recordEvent = (eventType, player, data = {}) => {
        const event = { type: eventType, player, timestamp: Date.now(), team: state.possession, ...data };
        return [...state.rallyData.events, event];
    };

    const undoLastEvent = () => {
        const newEvents = [...state.rallyData.events];
        newEvents.pop();
        return { ...state.rallyData, events: newEvents };
    };

    const finalizePoint = (currentState, winner, reason) => {
        const snapshot = deepClone(currentState);
        const newScore = { ...currentState.score, [winner]: currentState.score[winner] + 1 };
        const rallyRecord = {
            id: Date.now(), startTime: currentState.rallyData.startTime, endTime: Date.now(),
            winner, reason, scoreState: { ...currentState.score }, endScore: newScore,
            servingTeam: currentState.servingTeam, events: currentState.rallyData.events,
            rotations: { home: currentState.rotations.home.map(p => p?.id), away: currentState.rotations.away.map(p => p?.id) },
        };
        const lastServer = currentState.lastServer || currentState.servingTeam;
        const shouldRotate = winner !== lastServer;
        let newRotations = { ...currentState.rotations }, newOriginals = { ...currentState.liberoOriginals }, rotationLog = null;
        if (shouldRotate) {
            const rotData = processRotation(newRotations[winner], newOriginals[winner]);
            newRotations[winner] = rotData.newRotation; newOriginals[winner] = rotData.newOriginals;
            if (rotData.autoSwapLog) rotationLog = rotData.autoSwapLog;
        }
        let newLogs = addLog(`${reason} -> ${fmtTeam(winner)} Point`, 'highlight', currentState.logs);
        if (rotationLog) newLogs = [{ id: Date.now() + 1, time: getTime(), text: rotationLog.text, type: rotationLog.type }, ...newLogs];
        return {
            ...currentState, previousState: snapshot, score: newScore, servingTeam: winner,
            rotations: newRotations, liberoOriginals: newOriginals, matchPhase: 'PRE_SERVE',
            history: [rallyRecord, ...currentState.history], logs: newLogs, rallyData: INITIAL_RALLY_DATA, selectedPlayer: null
        };
    };

    switch (action.type) {
        case 'REQUEST_TIMEOUT': return { ...state, timeoutsUsed: { ...state.timeoutsUsed, [action.payload]: state.timeoutsUsed[action.payload] + 1 }, logs: addLog(`[TIMEOUT] ${fmtTeam(action.payload)}`, 'highlight') };
        case 'EXECUTE_SUB': {
            const { benchPlayer, courtPlayer } = action.payload; const subTeam = state.actionTeam;
            const newBench = state.benches[subTeam].filter(p => p.id !== benchPlayer.id); newBench.push(courtPlayer);
            const newRot = state.rotations[subTeam].map(p => p.id === courtPlayer.id ? benchPlayer : p);
            return { ...state, rotations: { ...state.rotations, [subTeam]: newRot }, benches: { ...state.benches, [subTeam]: newBench }, subsUsed: { ...state.subsUsed, [subTeam]: state.subsUsed[subTeam] + 1 }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`[SUB] ${fmtTeam(subTeam)}: ${fmt(benchPlayer)} In, ${fmt(courtPlayer)} Out`, 'info') };
        }
        case 'EXECUTE_LIBERO_SWAP': {
            const { libero, player, zoneIndex, team: lTeam } = action.payload;
            const newLRotation = [...state.rotations[lTeam]]; const newLOriginals = { ...state.liberoOriginals[lTeam] }; let newLBench = [...state.benches[lTeam]];
            const currentPlayerInZone = newLRotation[zoneIndex];
            if (currentPlayerInZone.id !== libero.id) { newLRotation[zoneIndex] = libero; newLOriginals[libero.id] = currentPlayerInZone; if (!newLBench.some(p => p.id === currentPlayerInZone.id)) newLBench.push(currentPlayerInZone); }
            else { const original = newLOriginals[libero.id]; if (!original) return state; newLRotation[zoneIndex] = original; delete newLOriginals[libero.id]; newLBench = newLBench.filter(p => p.id !== original.id); }
            return { ...state, rotations: { ...state.rotations, [lTeam]: newLRotation }, liberoOriginals: { ...state.liberoOriginals, [lTeam]: newLOriginals }, benches: { ...state.benches, [lTeam]: newLBench }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`[L-SWAP] ${fmtTeam(lTeam)}: Libero Swap`, 'info') };
        }
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
                        if (!p1.isLibero && !p2.isLibero) { alert("One must be Libero"); return { ...state, selectedPlayer: null }; }
                        const currentRotation = state.rotations[pTeam];
                        let zoneIndex = currentRotation.findIndex(r => r && r.id === p1.id); if (zoneIndex === -1) zoneIndex = currentRotation.findIndex(r => r && r.id === p2.id);
                        if (zoneIndex === -1 || zoneIndex > 2) { alert("Invalid Libero Swap"); return { ...state, selectedPlayer: null }; }
                        return gameReducer(state, { type: 'EXECUTE_LIBERO_SWAP', payload: { libero: p1.isLibero ? p1 : p2, player: p1.isLibero ? p2 : p1, zoneIndex, team: pTeam } });
                    }
                }
            }
            if (state.matchPhase === 'SELECT_BLOCKERS') return gameReducer(state, { type: 'TOGGLE_BLOCKER', payload: p });
            if (state.matchPhase === 'COVER') return gameReducer(state, { type: 'EXECUTE_COVER', payload: { ...p } });
            let newData = { ...state.rallyData }; if (state.matchPhase === 'RECEPTION') newData.receiver = p; if (state.matchPhase === 'DIG_DECISION') newData.target = p;
            return { ...state, selectedPlayer: p, rallyData: newData };
        }
        case 'CANCEL_SELECTION': case 'CANCEL_ACTION': return { ...state, selectedPlayer: null, matchPhase: state.matchPhase === 'DIG_DECISION' ? 'LANDING' : (['SUBSTITUTION', 'LIBERO_SWAP'].includes(state.matchPhase) ? 'PRE_SERVE' : state.matchPhase), actionTeam: null, rallyData: { ...state.rallyData, serveType: null, serveResult: null, blockers: [] } };

        // [FIXED] Robust UNDO Logic
        case 'UNDO_STEP': {
            if (state.matchPhase === 'PRE_SERVE' && state.previousState) return state.previousState;
            const { matchPhase, rallyData } = state;
            const currentServer = state.rotations[state.servingTeam][0];

            // 1. RECEPTION -> SERVE (Select Result)
            if (matchPhase === 'RECEPTION') {
                if (state.selectedPlayer) return { ...state, selectedPlayer: null }; // Deselect player first
                return {
                    ...state, matchPhase: 'SERVE_LANDING', selectedPlayer: null,
                    // [CRITICAL FIX] Reset possession back to server so grid shows on correct side
                    possession: state.servingTeam,
                    rallyData: { ...rallyData, landingPoint: null, landingZone: null, receiver: null }
                };
            }

            // 2. SERVE_LANDING -> SERVE (Select Result)
            if (matchPhase === 'SERVE_LANDING') {
                return {
                    ...state, matchPhase: 'SERVE', selectedPlayer: currentServer,
                    // [CRITICAL FIX] Ensure possession is server
                    possession: state.servingTeam,
                    rallyData: { ...undoLastEvent(), serveResult: null, landingPoint: null }
                };
            }

            // 3. SERVE (Result Selected) -> SERVE (Type Selected)
            if (matchPhase === 'SERVE') {
                if (rallyData.serveType) return { ...state, rallyData: { ...state.rallyData, serveType: null } };
                return { ...state, matchPhase: 'PRE_SERVE', selectedPlayer: null };
            }

            // 4. Set -> Reception
            if (matchPhase === 'SET') {
                return { ...state, matchPhase: 'RECEPTION', rallyData: undoLastEvent(), selectedPlayer: state.rallyData.receiver };
            }
            // 5. Attack -> Set (or Skip)
            if (matchPhase === 'ATTACK') {
                const lastEvent = rallyData.events[rallyData.events.length - 1];
                if (lastEvent && lastEvent.type === 'SET') return { ...state, matchPhase: 'SET', rallyData: undoLastEvent(), selectedPlayer: state.rallyData.setter };
                return { ...state, matchPhase: 'SET', selectedPlayer: null };
            }
            if (matchPhase === 'LANDING') return { ...state, matchPhase: 'ATTACK', selectedPlayer: state.rallyData.attacker };
            if (matchPhase === 'DIG_DECISION') return { ...state, matchPhase: 'LANDING' };
            if (matchPhase === 'BLOCK_RESULT') return { ...state, matchPhase: 'DIG_DECISION' };
            if (matchPhase === 'SELECT_BLOCKERS') return { ...state, matchPhase: 'BLOCK_RESULT', rallyData: { ...state.rallyData, pendingResult: null } };
            if (matchPhase === 'COVER') return { ...state, matchPhase: 'BLOCK_RESULT', rallyData: undoLastEvent() };
            return { ...state, matchPhase: 'PRE_SERVE' };
        }

        case 'SKIP_SET_PHASE': return { ...state, matchPhase: 'ATTACK', selectedPlayer: null, logs: addLog(`Attack on 2 (No Set)`, 'info') };
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
            if (result === 'KILL') { let finalEvents = currentEvents; let logSuffix = ""; if (target) { const digErrorEvent = { type: 'DIG', player: target, timestamp: Date.now(), team: defTeam, grade: 0, result: 'ERROR' }; finalEvents = [...currentEvents, digErrorEvent]; logSuffix = ` (${target.name} Error)`; } return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: finalEvents } }, attTeam, `${fmt(attacker)} Kill -> ${locDesc}${logSuffix}`); }
            if (result === 'ERROR') return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: currentEvents } }, defTeam, `${fmt(attacker)} Attack Error`);
            if (result === 'DIG') { let finalEvents = currentEvents; if (target) { const digSuccessEvent = { type: 'DIG', player: target, timestamp: Date.now(), team: defTeam, grade: 3, result: 'SUCCESS' }; finalEvents = [...currentEvents, digSuccessEvent]; } return { ...state, matchPhase: 'RECEPTION', possession: defTeam, selectedPlayer: target, rallyData: { ...state.rallyData, events: finalEvents, receiver: target, attacker: null } }; }
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
        case 'REFEREE_DECISION': { const { winner, reason } = action.payload; if (!winner || reason === 'Replay') return { ...state, matchPhase: 'PRE_SERVE', selectedPlayer: null, rallyData: INITIAL_RALLY_DATA, logs: addLog(`Replay Point Requested`, 'correction') }; if (!['home', 'away'].includes(winner)) return state; return finalizePoint(state, winner, `[REFEREE] ${reason}`); }
        case 'CHALLENGE_RESULT': {
            const { team, success, reason } = action.payload; if (!success) { const newChallenges = { ...state.challengesUsed }; newChallenges[team] += 1; return { ...state, challengesUsed: newChallenges, logs: addLog(`[CHALLENGE] ${reason} -> FAILED`, 'danger') }; }
            const winner = team; if (!state.previousState) return state; const baseState = deepClone(state.previousState); const newScore = { ...baseState.score, [winner]: baseState.score[winner] + 1 };
            const lastServer = baseState.lastServer || baseState.servingTeam; const shouldRotate = winner !== lastServer; let newRotations = { ...baseState.rotations }, newOriginals = { ...baseState.liberoOriginals };
            if (shouldRotate) { const rotData = processRotation(newRotations[winner], newOriginals[winner]); newRotations[winner] = rotData.newRotation; newOriginals[winner] = rotData.newOriginals; }
            let salvagedEvents = []; const badRally = state.history[0];
            if (badRally?.events) {
                let tempEvents = badRally.events.map(e => ({ ...e }));
                if (tempEvents.length > 0) {
                    const lastEvent = tempEvents[tempEvents.length - 1];
                    if (lastEvent.type === 'BLOCK') { tempEvents.pop(); if (tempEvents.length > 0 && tempEvents[tempEvents.length - 1].type === 'ATTACK') tempEvents[tempEvents.length - 1].result = 'KILL'; }
                }
                salvagedEvents = tempEvents;
            }
            const correctionRally = { id: Date.now(), startTime: Date.now(), endTime: Date.now(), winner, reason: `[CHALLENGE] ${reason} -> SUCCESS`, scoreState: { ...baseState.score }, endScore: newScore, servingTeam: winner, events: salvagedEvents, rotations: { home: newRotations.home.map(p => p?.id), away: newRotations.away.map(p => p?.id) } };
            return { ...baseState, previousState: null, score: newScore, servingTeam: winner, rotations: newRotations, liberoOriginals: newOriginals, matchPhase: 'PRE_SERVE', history: [correctionRally, ...baseState.history], logs: [{ id: Date.now(), time: getTime(), text: `[CHALLENGE] Overturn -> ${fmtTeam(winner)} Point`, type: 'success' }, ...baseState.logs], challengesUsed: state.challengesUsed, rallyData: INITIAL_RALLY_DATA, selectedPlayer: null };
        }
        default: return state;
    }
};