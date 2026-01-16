import { createSnapshot, processRotation } from '../utils/volleyballLogic';

// ==========================================
// 1. ANALYTICS & STATS HELPERS
// ==========================================

export const getPlayerStats = (history, playerId) => {
    let stats = {
        matches: 0, sets: 0, points: 0,
        serve: { total: 0, ace: 0, error: 0, inPlay: 0 },
        reception: { total: 0, perfect: 0, positive: 0, poor: 0, error: 0 },
        attack: { total: 0, kill: 0, error: 0, blocked: 0, inPlay: 0 },
        block: { solo: 0, assist: 0, error: 0, touch: 0 },
        dig: { total: 0, error: 0 },
        set: { total: 0, error: 0, assist: 0 }
    };

    const actions = [];

    history.forEach(rally => {
        if (!rally.events) return;

        rally.events.forEach(event => {
            if (event.player && event.player.id === playerId) {
                switch (event.type) {
                    case 'SERVE':
                        stats.serve.total++;
                        if (event.result === 'ACE') { stats.serve.ace++; stats.points++; actions.push(`Ace`); }
                        else if (event.result === 'ERROR') { stats.serve.error++; actions.push('Service Error'); }
                        else stats.serve.inPlay++;
                        break;
                    case 'RECEPTION':
                        stats.reception.total++;
                        if (event.grade === 3) stats.reception.perfect++;
                        else if (event.grade === 2) stats.reception.positive++;
                        else if (event.grade === 0) { stats.reception.error++; actions.push('Reception Error'); }
                        else stats.reception.poor++;
                        break;
                    case 'ATTACK':
                        stats.attack.total++;
                        if (event.result === 'KILL') { stats.attack.kill++; stats.points++; actions.push(`Kill`); }
                        else if (event.result === 'ERROR') { stats.attack.error++; actions.push('Attack Error'); }
                        else if (event.result === 'BLOCKED') { stats.attack.blocked++; actions.push('Blocked'); }
                        else stats.attack.inPlay++;
                        break;
                    case 'DIG':
                        stats.dig.total++;
                        if (event.grade === 0) { stats.dig.error++; actions.push('Dig Error'); }
                        break;
                    default: break;
                }
            }
            if (event.type === 'BLOCK' && event.players && Array.isArray(event.players)) {
                const isInvolved = event.players.find(p => p.id === playerId);
                if (isInvolved) {
                    if (event.result === 'SHUTDOWN') {
                        if (event.players.length === 1) stats.block.solo++; else stats.block.assist++;
                        stats.points++; actions.push('Block Kill');
                    } else if (event.result === 'TOUCH') { stats.block.touch++; }
                }
            }
        });
    });
    return { stats, actions };
};

const getCoordinateDescription = (point) => {
    if (!point || !point.x || !point.y) return "";
    const x = parseFloat(point.x);
    const y = parseFloat(point.y);
    const isLeft = x <= 9;
    let localX = isLeft ? x : (x - 9);
    let localY = y;
    const distFromNet = isLeft ? (9 - localX) : localX;
    const distFromSideline = Math.min(y, 9 - y);

    let zone;
    let isLeftSideOfCourt, isRightSideOfCourt;
    if (isLeft) { isLeftSideOfCourt = localY >= 6; isRightSideOfCourt = localY <= 3; }
    else { isLeftSideOfCourt = localY <= 3; isRightSideOfCourt = localY >= 6; }

    if (distFromNet <= 4.5) {
        if (isLeftSideOfCourt) zone = 4; else if (isRightSideOfCourt) zone = 2; else zone = 3;
    } else {
        if (isLeftSideOfCourt) zone = 5; else if (isRightSideOfCourt) zone = 1; else zone = 6;
    }

    let depthDesc = "", angleDesc = "";
    if (distFromNet < 0.8) depthDesc = "Tight";
    else if (distFromNet <= 3.2) depthDesc = "3m";
    else if (distFromNet <= 6.0) depthDesc = "Short";
    else if (distFromNet >= 7.5) depthDesc = "Deep";

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

// --- LOGGING FORMATTERS ---
const fmt = (p) => p ? `[#${p.number} ${p.name}]` : '[Unknown]';
const fmtGrade = (g) => {
    if (g === 3) return "Perfect";
    if (g === 2) return "Positive";
    if (g === 1) return "Poor";
    return "Error";
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
    // Helper to safely extract names
    const homeName = setupData?.home?.name || 'Home';
    const awayName = setupData?.away?.name || 'Away';

    if (savedState) {
        return {
            ...savedState,
            // [FIX] Force update/inject teamNames if missing in old save
            teamNames: { home: homeName, away: awayName },
            history: savedState.history || [],
            liberoLists: savedState.liberoLists || { home: setupData?.home?.liberos || [], away: setupData?.away?.liberos || [] },
            liberoOriginals: savedState.liberoOriginals || { home: {}, away: {} }
        };
    }
    return {
        teamNames: { home: homeName, away: awayName },
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

    // [FIXED] Robust Team Name Getter
    const fmtTeam = (side) => {
        if (state.teamNames && state.teamNames[side]) return state.teamNames[side];
        return side === 'home' ? 'home' : 'away';
    };

    const recordEvent = (eventType, player, data = {}) => {
        const event = {
            type: eventType,
            player: player,
            timestamp: Date.now(),
            team: state.possession,
            ...data
        };
        return [...state.rallyData.events, event];
    };

    const finalizePoint = (currentState, winner, reason) => {
        const snapshot = createSnapshot(currentState);
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
            rotations: {
                home: currentState.rotations.home.map(p => p?.id),
                away: currentState.rotations.away.map(p => p?.id)
            },
            events: currentState.rallyData.events
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
        // --- Standard Actions ---
        case 'REQUEST_TIMEOUT': {
            const team = action.payload;
            if (state.timeoutsUsed[team] >= 2) return state;
            if (!['PRE_SERVE', 'SERVE'].includes(state.matchPhase)) return state;
            return { ...state, timeoutsUsed: { ...state.timeoutsUsed, [team]: state.timeoutsUsed[team] + 1 }, logs: addLog(`[TIMEOUT] ${fmtTeam(team)} (${state.timeoutsUsed[team] + 1}/2)`, 'highlight') };
        }

        case 'EXECUTE_SUB': {
            const { benchPlayer, courtPlayer } = action.payload; const subTeam = state.actionTeam;
            const newBench = state.benches[subTeam].filter(p => p.id !== benchPlayer.id); newBench.push(courtPlayer);
            const newRot = state.rotations[subTeam].map(p => p.id === courtPlayer.id ? benchPlayer : p);
            return { ...state, rotations: { ...state.rotations, [subTeam]: newRot }, benches: { ...state.benches, [subTeam]: newBench }, subsUsed: { ...state.subsUsed, [subTeam]: state.subsUsed[subTeam] + 1 }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`[SUB] ${fmtTeam(subTeam)}: ${fmt(benchPlayer)} In, ${fmt(courtPlayer)} Out`, 'info') };
        }

        case 'EXECUTE_LIBERO_SWAP': {
            const { libero, courtPlayer, zoneIndex, team: lTeam } = action.payload;
            const newLRotation = [...state.rotations[lTeam]]; const newLOriginals = { ...state.liberoOriginals[lTeam] }; const newLBench = [...state.benches[lTeam]];
            if (libero.isLibero) { newLRotation[zoneIndex] = libero; newLOriginals[libero.id] = courtPlayer; newLBench.push(courtPlayer); } else { newLRotation[zoneIndex] = libero; delete newLOriginals[courtPlayer.id]; }
            return { ...state, rotations: { ...state.rotations, [lTeam]: newLRotation }, liberoOriginals: { ...state.liberoOriginals, [lTeam]: newLOriginals }, benches: { ...state.benches, [lTeam]: newLBench }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`[L-SWAP] ${fmtTeam(lTeam)}: ${fmt(libero)} <-> ${fmt(courtPlayer)}`, 'info') };
        }

        // ... (Selectors / Cancel / Undo) ...
        case 'REQUEST_SUB': return { ...state, matchPhase: 'SUBSTITUTION', actionTeam: action.payload, selectedPlayer: null };
        case 'REQUEST_LIBERO_SWAP': return { ...state, matchPhase: 'LIBERO_SWAP', actionTeam: action.payload, selectedPlayer: null };
        case 'SELECT_PLAYER': {
            const p = action.payload; if (!p) return state;

            // Validate Team
            const isHome = state.rotations.home.some(x => x?.id === p.id) || state.benches.home.some(x => x.id === p.id) || state.liberoLists?.home?.some(x => x.id === p.id);
            const pTeam = isHome ? 'home' : 'away';

            if (['SUBSTITUTION', 'LIBERO_SWAP'].includes(state.matchPhase)) {
                if (pTeam !== state.actionTeam) return state;
                if (!state.selectedPlayer) {
                    if (state.matchPhase === 'SUBSTITUTION' && !state.benches[pTeam].find(b => b.id === p.id)) return state;
                    return { ...state, selectedPlayer: p };
                } else {
                    const p1 = state.selectedPlayer; const p2 = p;
                    if (state.matchPhase === 'SUBSTITUTION') return gameReducer(state, { type: 'EXECUTE_SUB', payload: { benchPlayer: p1, courtPlayer: p2 } });
                    if (state.matchPhase === 'LIBERO_SWAP') {
                        if (p1.isLibero && !p2.isLibero) {
                            const idx = state.rotations[pTeam].findIndex(r => r && r.id === p2.id);
                            if (idx > 2) { alert("Invalid Zone!"); return { ...state, selectedPlayer: null }; }
                            return gameReducer(state, { type: 'EXECUTE_LIBERO_SWAP', payload: { libero: p1, courtPlayer: p2, zoneIndex: idx, team: pTeam } });
                        }
                    }
                }
            }
            const pTeamStandard = (state.rotations.home.find(x => x?.id === p.id)) ? 'home' : 'away';
            if (state.matchPhase === 'SELECT_BLOCKERS') { const defTeam = state.possession === 'home' ? 'away' : 'home'; if (pTeamStandard !== defTeam) return state; return gameReducer(state, { type: 'TOGGLE_BLOCKER', payload: p }); }
            if (state.matchPhase === 'COVER') { if (pTeamStandard !== state.possession) return state; return gameReducer(state, { type: 'EXECUTE_COVER', payload: { ...p } }); }

            let newData = { ...state.rallyData };
            if (state.matchPhase === 'RECEPTION') newData.receiver = p;
            if (state.matchPhase === 'DIG_DECISION') newData.target = p;

            return { ...state, selectedPlayer: p, rallyData: newData };
        }
        case 'CANCEL_SELECTION': case 'CANCEL_ACTION': return { ...state, selectedPlayer: null, matchPhase: state.matchPhase === 'DIG_DECISION' ? 'LANDING' : (['SUBSTITUTION', 'LIBERO_SWAP'].includes(state.matchPhase) ? 'PRE_SERVE' : state.matchPhase), actionTeam: null, rallyData: { ...state.rallyData, serveType: null, serveResult: null, blockers: [] } };
        case 'UNDO_STEP': {
            const current = state.matchPhase;
            if (current === 'SERVE') { if (state.rallyData.serveType) return { ...state, rallyData: { ...state.rallyData, serveType: null } }; return state; }
            if (current === 'SERVE_LANDING') return { ...state, matchPhase: 'SERVE', possession: state.servingTeam, rallyData: { ...state.rallyData, serveResult: null, events: [] }, selectedPlayer: state.rotations[state.servingTeam][0] };

            if (current === 'RECEPTION') {
                if (state.rallyData.attacker) {
                    const attId = state.rallyData.attacker.id;
                    const isHomeAttacker = state.rotations.home.some(p => p && p.id === attId) || state.benches.home.some(p => p.id === attId);
                    const attTeam = isHomeAttacker ? 'home' : 'away';
                    return { ...state, matchPhase: 'DIG_DECISION', possession: attTeam, selectedPlayer: state.rallyData.target };
                }
                return { ...state, matchPhase: 'SERVE_LANDING', possession: state.servingTeam, selectedPlayer: null, rallyData: { ...state.rallyData, landingPoint: null } };
            }
            if (current === 'DIG_DECISION') return { ...state, matchPhase: 'LANDING', selectedPlayer: null, rallyData: { ...state.rallyData, landingPoint: null } };
            if (current === 'SET') return { ...state, matchPhase: 'RECEPTION', selectedPlayer: state.rallyData.receiver };
            if (current === 'ATTACK') return { ...state, matchPhase: 'SET', selectedPlayer: state.rallyData.setter };
            if (current === 'LANDING') {
                if (state.rallyData.attackType === 'Dump') return { ...state, matchPhase: 'SET', selectedPlayer: state.rallyData.setter, rallyData: { ...state.rallyData, attackType: null } };
                return { ...state, matchPhase: 'ATTACK', selectedPlayer: state.rallyData.attacker };
            }
            if (current === 'BLOCK_RESULT') return { ...state, matchPhase: 'DIG_DECISION', selectedPlayer: state.rallyData.target };
            if (current === 'SELECT_BLOCKERS') return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null, rallyData: { ...state.rallyData, blockers: [], pendingResult: null } };
            if (current === 'COVER') return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
            if (current === 'PRE_SERVE' && state.previousState) { return state.previousState; }
            return state;
        }

        case 'INIT_SERVE':
            if (state.matchPhase !== 'PRE_SERVE') return state;
            const currentServer = state.rotations[state.servingTeam][0];
            if (currentServer && currentServer.isLibero) alert("WARNING: Libero in Service Position (Zone 1). Rotate or swap.");

            return {
                ...state,
                matchPhase: 'SERVE',
                lastServer: state.servingTeam,
                selectedPlayer: currentServer,
                possession: state.servingTeam,
                rallyData: {
                    ...INITIAL_RALLY_DATA,
                    startTime: Date.now(),
                    servingTeam: state.servingTeam,
                    startScore: { ...state.score }
                }
            };

        case 'SET_SERVE_TYPE':
            return { ...state, rallyData: { ...state.rallyData, serveType: action.payload } };

        case 'SET_SERVE_RESULT': {
            const { serveType } = state.rallyData;
            const result = action.payload;
            const opp = state.servingTeam === 'home' ? 'away' : 'home';

            const serveEvent = { subType: serveType, result: result, fromZone: 1 };
            const newEvents = recordEvent('SERVE', state.selectedPlayer, serveEvent);

            if (result === 'ERROR') {
                return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: newEvents } }, opp, `[SERVICE] ${fmt(state.selectedPlayer)} Error`);
            }
            if (result === 'ACE') {
                return {
                    ...state,
                    matchPhase: 'SERVE_LANDING',
                    rallyData: { ...state.rallyData, serveResult: 'ACE', events: newEvents },
                    logs: addLog(`[SERVICE] ${fmt(state.selectedPlayer)} Ace -> Select Landing`, 'success')
                };
            }
            return {
                ...state,
                matchPhase: 'SERVE_LANDING',
                rallyData: { ...state.rallyData, serveResult: 'IN_PLAY', events: newEvents },
                logs: addLog(`${fmt(state.selectedPlayer)} Serve (${serveType})`, 'info')
            };
        }

        case 'SELECT_LANDING_POINT': {
            const { point, opponentTeam } = action.payload;
            const isCoord = point && point.x !== undefined;
            const zone = isCoord ? null : point;
            const locDesc = isCoord ? getCoordinateDescription(point) : `Zone ${point}`;

            if (state.matchPhase === 'SERVE_LANDING' && state.rallyData.serveResult === 'ACE') {
                const events = [...state.rallyData.events];
                events[events.length - 1].toPoint = point;
                return finalizePoint({ ...state, rallyData: { ...state.rallyData, events } }, state.servingTeam, `${fmt(state.selectedPlayer)} Ace (${locDesc})`);
            }

            if (state.matchPhase === 'SERVE_LANDING') {
                return {
                    ...state,
                    matchPhase: 'RECEPTION',
                    possession: opponentTeam,
                    rallyData: { ...state.rallyData, landingPoint: point, landingZone: zone, receiver: null },
                    selectedPlayer: null
                };
            }

            let targetPlayer = null;
            if (!isCoord) {
                const zoneToIdxMap = { 1: 0, 6: 1, 5: 2, 4: 3, 3: 4, 2: 5 };
                targetPlayer = state.rotations[opponentTeam][zoneToIdxMap[point]];
            }

            return {
                ...state,
                matchPhase: 'DIG_DECISION',
                rallyData: { ...state.rallyData, landingPoint: point, landingZone: zone, target: targetPlayer },
                selectedPlayer: targetPlayer
            };
        }

        case 'RECEPTION_GRADE': {
            const { quality, player } = action.payload;
            const sysState = quality >= 2 ? 'IN_SYSTEM' : 'OUT_OF_SYSTEM';
            const landingDesc = state.rallyData.landingPoint
                ? getCoordinateDescription(state.rallyData.landingPoint)
                : (state.rallyData.landingZone ? `Zone ${state.rallyData.landingZone}` : "");

            const isDig = (state.possession === state.servingTeam);
            const type = isDig ? 'DIG' : 'RECEPTION';
            const eventData = { grade: quality, systemState: sysState, fromPoint: state.rallyData.landingPoint, result: quality === 0 ? 'ERROR' : 'IN_PLAY' };
            const newEvents = recordEvent(type, player, eventData);

            if (quality === 0) {
                const winner = state.possession === 'home' ? 'away' : 'home';
                const reason = isDig ? 'Dig Error' : 'Reception Error';
                const logText = `${fmt(player)} ${reason} @ ${landingDesc}`;
                return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: newEvents } }, winner, logText);
            }

            return {
                ...state,
                matchPhase: 'SET',
                selectedPlayer: null,
                rallyData: { ...state.rallyData, events: newEvents, systemState: sysState },
                logs: addLog(`${fmt(player)} ${type} -> ${fmtGrade(quality)}`, 'info')
            };
        }

        case 'EXECUTE_SET': {
            const type = action.payload;
            const newEvents = recordEvent('SET', state.selectedPlayer, { subType: type });

            if (type === 'Dump') {
                return {
                    ...state,
                    matchPhase: 'LANDING',
                    rallyData: { ...state.rallyData, events: newEvents, attacker: state.selectedPlayer, attackType: 'Dump' },
                    logs: addLog(`${fmt(state.selectedPlayer)} Dump`, 'info')
                };
            }
            return {
                ...state,
                matchPhase: 'ATTACK',
                selectedPlayer: null,
                rallyData: { ...state.rallyData, events: newEvents, setter: state.selectedPlayer },
                logs: addLog(`${fmt(state.selectedPlayer)} Set (${type})`, 'info')
            };
        }

        case 'EXECUTE_ATTACK': {
            const type = action.payload;
            return {
                ...state,
                matchPhase: 'LANDING',
                rallyData: { ...state.rallyData, attacker: state.selectedPlayer, attackType: type },
                selectedPlayer: null,
                logs: addLog(`${fmt(state.selectedPlayer)} Attack (${type})`, 'info')
            };
        }

        case 'ATTACK_RESULT': {
            const { result } = action.payload;
            const { attacker, attackType, landingPoint, target } = state.rallyData;
            const attTeam = state.possession;
            const defTeam = attTeam === 'home' ? 'away' : 'home';
            const locDesc = landingPoint ? getCoordinateDescription(landingPoint) : "";

            const attackEvent = { subType: attackType, result: result, toPoint: landingPoint };
            const currentEvents = recordEvent('ATTACK', attacker, attackEvent);

            if (result === 'KILL') {
                let finalEvents = currentEvents;
                let logSuffix = "";
                if (target) {
                    const digErrorEvent = { type: 'DIG', player: target, timestamp: Date.now(), team: defTeam, grade: 0, result: 'ERROR' };
                    finalEvents = [...currentEvents, digErrorEvent];
                    logSuffix = ` (${target.name} Error)`;
                }
                return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: finalEvents } }, attTeam, `${fmt(attacker)} Kill -> ${locDesc}${logSuffix}`);
            }
            if (result === 'ERROR') {
                return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: currentEvents } }, defTeam, `${fmt(attacker)} Attack Error`);
            }
            if (result === 'DIG') {
                return {
                    ...state,
                    matchPhase: 'RECEPTION',
                    possession: defTeam,
                    selectedPlayer: target,
                    rallyData: { ...state.rallyData, events: currentEvents, receiver: target, attacker: null }
                };
            }
            return state;
        }

        case 'BLOCK_DETECTED': return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };

        case 'BLOCK_OUTCOME': {
            const outcome = action.payload;
            if (outcome === 'SHUTDOWN') {
                return {
                    ...state, matchPhase: 'SELECT_BLOCKERS',
                    rallyData: { ...state.rallyData, pendingResult: 'SHUTDOWN' },
                    logs: addLog("Block Shutdown -> Select Blockers", "info")
                };
            }

            const { blockers, attacker, attackType } = state.rallyData;
            const attTeam = state.possession;
            const defTeam = attTeam === 'home' ? 'away' : 'home';

            const attackEvent = { subType: attackType, result: 'IN_PLAY' };
            let currentEvents = recordEvent('ATTACK', attacker, attackEvent);

            const blockEvent = { type: 'BLOCK', players: blockers, result: outcome, timestamp: Date.now(), team: defTeam };
            const eventsWithBlock = [...currentEvents, blockEvent];

            if (outcome === 'TOUCH_OUT') return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: eventsWithBlock } }, attTeam, 'Tool / Kill');
            if (outcome === 'REBOUND') return { ...state, matchPhase: 'COVER', possession: attTeam, rallyData: { ...state.rallyData, events: eventsWithBlock }, logs: addLog('[BLOCK] Rebound -> Cover', 'info') };
            if (outcome === 'SOFT_BLOCK') return { ...state, matchPhase: 'RECEPTION', possession: defTeam, rallyData: { ...state.rallyData, events: eventsWithBlock }, logs: addLog('[BLOCK] Soft Touch -> Transition', 'info') };

            return state;
        }

        case 'TOGGLE_BLOCKER': {
            const p = action.payload;
            const currentBlockers = state.rallyData.blockers;
            const exists = currentBlockers.find(b => b.id === p.id);
            const newBlockers = exists ? currentBlockers.filter(b => b.id !== p.id) : [...currentBlockers, p];
            return { ...state, rallyData: { ...state.rallyData, blockers: newBlockers } };
        }

        case 'CONFIRM_BLOCK': {
            const { pendingResult, blockers, attacker, attackType } = state.rallyData;
            const defTeam = state.possession === 'home' ? 'away' : 'home';

            if (pendingResult === 'SHUTDOWN') {
                const attackEvent = { subType: attackType, result: 'BLOCKED' };
                let currentEvents = recordEvent('ATTACK', attacker, attackEvent);

                const blockEvent = { type: 'BLOCK', players: blockers, result: 'SHUTDOWN', timestamp: Date.now(), team: defTeam };
                const eventsWithBlock = [...currentEvents, blockEvent];

                const names = blockers.map(b => b.name).join(' & ');
                const logReason = blockers.length > 0 ? `[BLOCK] ${names} -> Kill` : `[BLOCK] Shutdown`;

                return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: eventsWithBlock } }, defTeam, logReason);
            }
            return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
        }

        case 'EXECUTE_COVER': {
            const coverEvent = { result: 'COVER' };
            const newEvents = recordEvent('DIG', action.payload, coverEvent);
            return { ...state, matchPhase: 'SET', selectedPlayer: null, rallyData: { ...state.rallyData, events: newEvents }, logs: addLog(`${fmt(action.payload)} Cover`, 'info') };
        }

        case 'REFEREE_DECISION': {
            // [FIXED] Removed A/B mapping logic. Winner must be 'home' or 'away'
            const { winner, reason } = action.payload;
            if (!winner || reason === 'Replay') return { ...state, matchPhase: 'PRE_SERVE', selectedPlayer: null, rallyData: INITIAL_RALLY_DATA, logs: addLog(`[REFEREE] REPLAY`, 'correction') };

            // Assume winner is 'home' or 'away'. If not, fallback to console error or no-op?
            if (!['home', 'away'].includes(winner)) {
                console.error("Invalid winner in REFEREE_DECISION:", winner);
                return state;
            }

            return finalizePoint(state, winner, `[REFEREE] ${reason}`);
        }

        case 'CHALLENGE_RESULT': {
            const { team, success, reason } = action.payload;
            if (!success) {
                const newChallenges = { ...state.challengesUsed }; newChallenges[team] += 1;
                return { ...state, challengesUsed: newChallenges, logs: addLog(`[CHALLENGE] ${reason || 'Review'} -> FAILED`, 'danger') };
            }
            const winner = team;
            const currentTotal = state.score.home + state.score.away;
            const prevTotal = state.previousState ? (state.previousState.score.home + state.previousState.score.away) : 0;
            const baseState = (currentTotal > prevTotal && state.previousState) ? state.previousState : state;

            const stateWithUpdatedLogs = {
                ...baseState,
                challengesUsed: state.challengesUsed,
                logs: addLog(`[CHALLENGE] ${reason || 'Review'} -> SUCCESS (Overturn)`, 'success', baseState.logs)
            };

            return finalizePoint(stateWithUpdatedLogs, winner, `[CHALLENGE] ${reason || 'Overturn'} -> Success`);
        }

        default: return state;
    }
};