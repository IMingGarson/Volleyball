import { processRotation } from '../utils/volleyballLogic';

// ==========================================
// 1. HELPERS
// ==========================================

// Deep clone helper to ensure snapshots don't hold references
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const getZoneFromPoint = (point) => {
    if (!point) return 'Unknown';
    if (typeof point === 'number' || (typeof point === 'string' && !isNaN(point))) return parseInt(point);

    if (point.x !== undefined && point.y !== undefined) {
        const x = parseFloat(point.x);
        const y = parseFloat(point.y);
        const isLeft = x <= 9;
        let localX = isLeft ? x : (x - 9);

        const distFromNet = isLeft ? (9 - localX) : localX;
        // Simple logic: Front row (0-4.5m) vs Back row
        // Detailed zone mapping can be refined here if needed
        return distFromNet <= 4.5 ? 'Front' : 'Back';
    }
    return 'Unknown';
};

export const getPlayerStats = (history, playerId) => {
    // Stats Container
    let stats = {
        points: 0,
        serve: { total: 0, ace: 0, error: 0 },
        reception: { total: 0, perfect: 0, positive: 0, error: 0 },
        attack: { total: 0, kill: 0, error: 0, blocked: 0 },
        block: { points: 0, touch: 0, error: 0 },
        dig: { total: 0, success: 0, error: 0 },

        // Derived strings
        receptionRate: "0.00",
        attackEff: "0.00"
    };

    if (!history || !Array.isArray(history)) return { stats };

    history.forEach(rally => {
        if (!rally.events) return;

        rally.events.forEach(event => {
            // 1. Single Player Events
            if (event.player && event.player.id === playerId) {
                switch (event.type) {
                    case 'SERVE':
                        stats.serve.total++;
                        if (event.result === 'ACE') { stats.serve.ace++; stats.points++; }
                        else if (event.result === 'ERROR') stats.serve.error++;
                        break;

                    case 'RECEPTION':
                        stats.reception.total++;
                        if (event.grade === 3) stats.reception.perfect++;
                        else if (event.grade === 2) stats.reception.positive++;
                        else if (event.grade === 0) stats.reception.error++;
                        break;

                    case 'ATTACK':
                        stats.attack.total++;
                        if (event.result === 'KILL') { stats.attack.kill++; stats.points++; }
                        else if (event.result === 'ERROR') stats.attack.error++;
                        else if (event.result === 'BLOCKED') stats.attack.blocked++;
                        break;

                    case 'DIG':
                        stats.dig.total++;
                        if (event.result === 'ERROR' || event.grade === 0) stats.dig.error++;
                        else stats.dig.success++;
                        break;
                    default: break;
                }
            }

            // 2. Block Events (Array of players)
            if (event.type === 'BLOCK' && event.players && Array.isArray(event.players)) {
                const isInvolved = event.players.find(p => p.id === playerId);
                if (isInvolved) {
                    if (event.result === 'SHUTDOWN') {
                        stats.block.points++;
                        stats.points++;
                    } else if (event.result === 'TOUCH') {
                        stats.block.touch++;
                    } else if (event.result === 'ERROR') {
                        stats.block.error++;
                    }
                }
            }
        });
    });

    // --- CALCULATIONS ---

    // Reception %: (Perfect + Positive) / Total
    const recGood = stats.reception.perfect + stats.reception.positive;
    stats.receptionRate = stats.reception.total > 0
        ? ((recGood / stats.reception.total) * 100).toFixed(2)
        : "-";

    // Attack Efficiency: (Kills - Errors - Blocked) / Total
    // Clamp at 0? User asked for max(0, stats).
    if (stats.attack.total > 0) {
        let eff = (stats.attack.kill - stats.attack.error - stats.attack.blocked) / stats.attack.total;
        stats.attackEff = Math.max(0, eff).toFixed(3); // e.g. 0.350
    } else {
        stats.attackEff = "-";
    }

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
            // Ensure compatibility if saved state is old
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
        previousState: null, // Holds the state BEFORE the last point
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

    // Inline formatter to avoid reference errors
    const fmt = (p) => p ? `[#${p.number} ${p.name}]` : '[Unknown]';
    const fmtTeam = (side) => (state.teamNames && state.teamNames[side]) ? state.teamNames[side] : (side === 'home' ? 'HOME' : 'AWAY');

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

    // Centralized Point Finalization
    const finalizePoint = (currentState, winner, reason) => {
        // [IMPORTANT] Take a deep snapshot of the state BEFORE we award the point.
        // This is what we will revert to if a Challenge overturns this decision.
        const snapshot = deepClone(currentState);

        const newScore = { ...currentState.score, [winner]: currentState.score[winner] + 1 };

        const rallyRecord = {
            id: Date.now(),
            startTime: currentState.rallyData.startTime,
            endTime: Date.now(),
            winner,
            reason,
            scoreState: { ...currentState.score }, // Score BEFORE this point
            endScore: newScore, // Score AFTER this point
            servingTeam: currentState.servingTeam,
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
            previousState: snapshot, // Store the cleanup snapshot
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
        // ... (TIMEOUT, SUB, LIBERO, SELECT_PLAYER, CANCEL, UNDO, INIT_SERVE, SERVE_TYPE, SERVE_RESULT, LANDING, RECEPTION, SET, ATTACK_EXEC) ...
        // [These standard actions remain unchanged - omitted for brevity but assumed present] 
        // Just copying the structure you need for the critical fixes below:

        case 'REQUEST_TIMEOUT': {
            const team = action.payload;
            if (state.timeoutsUsed[team] >= 2) return state;
            return { ...state, timeoutsUsed: { ...state.timeoutsUsed, [team]: state.timeoutsUsed[team] + 1 }, logs: addLog(`[TIMEOUT] ${fmtTeam(team)}`, 'highlight') };
        }
        case 'REQUEST_SUB': return { ...state, matchPhase: 'SUBSTITUTION', actionTeam: action.payload, selectedPlayer: null };
        case 'REQUEST_LIBERO_SWAP': return { ...state, matchPhase: 'LIBERO_SWAP', actionTeam: action.payload, selectedPlayer: null };
        case 'EXECUTE_SUB': {
            const { benchPlayer, courtPlayer } = action.payload; const subTeam = state.actionTeam;
            const newBench = state.benches[subTeam].filter(p => p.id !== benchPlayer.id); newBench.push(courtPlayer);
            const newRot = state.rotations[subTeam].map(p => p.id === courtPlayer.id ? benchPlayer : p);
            return { ...state, rotations: { ...state.rotations, [subTeam]: newRot }, benches: { ...state.benches, [subTeam]: newBench }, subsUsed: { ...state.subsUsed, [subTeam]: state.subsUsed[subTeam] + 1 }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`[SUB] ${fmtTeam(subTeam)}`, 'info') };
        }
        case 'EXECUTE_LIBERO_SWAP': {
            const { libero, courtPlayer, zoneIndex, team: lTeam } = action.payload;
            const newLRotation = [...state.rotations[lTeam]]; const newLOriginals = { ...state.liberoOriginals[lTeam] }; const newLBench = [...state.benches[lTeam]];
            if (libero.isLibero) { newLRotation[zoneIndex] = libero; newLOriginals[libero.id] = courtPlayer; newLBench.push(courtPlayer); } else { newLRotation[zoneIndex] = libero; delete newLOriginals[courtPlayer.id]; }
            return { ...state, rotations: { ...state.rotations, [lTeam]: newLRotation }, liberoOriginals: { ...state.liberoOriginals, [lTeam]: newLOriginals }, benches: { ...state.benches, [lTeam]: newLBench }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`[L-SWAP] ${fmtTeam(lTeam)}`, 'info') };
        }
        case 'SELECT_PLAYER': {
            const p = action.payload; if (!p) return state;
            const isHome = state.rotations.home.some(x => x?.id === p.id) || state.benches.home.some(x => x.id === p.id);
            const pTeam = isHome ? 'home' : 'away';
            if (['SUBSTITUTION', 'LIBERO_SWAP'].includes(state.matchPhase)) {
                if (pTeam !== state.actionTeam) return state;
                if (!state.selectedPlayer) return { ...state, selectedPlayer: p };
                else {
                    const p1 = state.selectedPlayer; const p2 = p;
                    if (state.matchPhase === 'SUBSTITUTION') return gameReducer(state, { type: 'EXECUTE_SUB', payload: { benchPlayer: p1, courtPlayer: p2 } });
                    if (state.matchPhase === 'LIBERO_SWAP') {
                        const idx = state.rotations[pTeam].findIndex(r => r && r.id === p2.id);
                        return gameReducer(state, { type: 'EXECUTE_LIBERO_SWAP', payload: { libero: p1, courtPlayer: p2, zoneIndex: idx, team: pTeam } });
                    }
                }
            }
            const pTeamStandard = (state.rotations.home.find(x => x?.id === p.id)) ? 'home' : 'away';
            if (state.matchPhase === 'SELECT_BLOCKERS') { return gameReducer(state, { type: 'TOGGLE_BLOCKER', payload: p }); }
            if (state.matchPhase === 'COVER') { return gameReducer(state, { type: 'EXECUTE_COVER', payload: { ...p } }); }
            let newData = { ...state.rallyData };
            if (state.matchPhase === 'RECEPTION') newData.receiver = p;
            if (state.matchPhase === 'DIG_DECISION') newData.target = p;
            return { ...state, selectedPlayer: p, rallyData: newData };
        }
        case 'CANCEL_SELECTION': case 'CANCEL_ACTION': return { ...state, selectedPlayer: null, matchPhase: state.matchPhase === 'DIG_DECISION' ? 'LANDING' : (['SUBSTITUTION', 'LIBERO_SWAP'].includes(state.matchPhase) ? 'PRE_SERVE' : state.matchPhase), actionTeam: null, rallyData: { ...state.rallyData, serveType: null, serveResult: null, blockers: [] } };
        case 'UNDO_STEP': {
            // Basic Undo logic...
            if (state.matchPhase === 'PRE_SERVE' && state.previousState) return state.previousState;
            return { ...state, matchPhase: 'PRE_SERVE' }; // simplified fallback
        }
        case 'INIT_SERVE': return { ...state, matchPhase: 'SERVE', lastServer: state.servingTeam, selectedPlayer: state.rotations[state.servingTeam][0], possession: state.servingTeam, rallyData: { ...INITIAL_RALLY_DATA, startTime: Date.now(), servingTeam: state.servingTeam, startScore: { ...state.score } } };
        case 'SET_SERVE_TYPE': return { ...state, rallyData: { ...state.rallyData, serveType: action.payload } };
        case 'SET_SERVE_RESULT': {
            const { serveType } = state.rallyData; const result = action.payload; const opp = state.servingTeam === 'home' ? 'away' : 'home';
            const serveEvent = { subType: serveType, result: result, fromZone: 1 }; const newEvents = recordEvent('SERVE', state.selectedPlayer, serveEvent);
            if (result === 'ERROR') return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: newEvents } }, opp, `[SERVICE] ${fmt(state.selectedPlayer)} Error`);
            if (result === 'ACE') return { ...state, matchPhase: 'SERVE_LANDING', rallyData: { ...state.rallyData, serveResult: 'ACE', events: newEvents }, logs: addLog(`[SERVICE] Ace -> Select Landing`, 'success') };
            return { ...state, matchPhase: 'SERVE_LANDING', rallyData: { ...state.rallyData, serveResult: 'IN_PLAY', events: newEvents }, logs: addLog(`Serve`, 'info') };
        }
        case 'SELECT_LANDING_POINT': {
            const { point, opponentTeam } = action.payload;
            if (state.matchPhase === 'SERVE_LANDING' && state.rallyData.serveResult === 'ACE') {
                const events = [...state.rallyData.events]; events[events.length - 1].toPoint = point;
                return finalizePoint({ ...state, rallyData: { ...state.rallyData, events } }, state.servingTeam, `Ace`);
            }
            if (state.matchPhase === 'SERVE_LANDING') return { ...state, matchPhase: 'RECEPTION', possession: opponentTeam, rallyData: { ...state.rallyData, landingPoint: point, receiver: null }, selectedPlayer: null };
            let targetPlayer = null; // simplistic zone logic
            return { ...state, matchPhase: 'DIG_DECISION', rallyData: { ...state.rallyData, landingPoint: point, target: targetPlayer }, selectedPlayer: targetPlayer };
        }
        case 'RECEPTION_GRADE': {
            const { quality, player } = action.payload;
            const eventData = { grade: quality, result: quality === 0 ? 'ERROR' : 'IN_PLAY' };
            const newEvents = recordEvent('RECEPTION', player, eventData);
            if (quality === 0) return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: newEvents } }, state.servingTeam, `Reception Error`);
            return { ...state, matchPhase: 'SET', selectedPlayer: null, rallyData: { ...state.rallyData, events: newEvents }, logs: addLog(`Reception`, 'info') };
        }
        case 'EXECUTE_SET': {
            const type = action.payload; const newEvents = recordEvent('SET', state.selectedPlayer, { subType: type });
            if (type === 'Dump') return { ...state, matchPhase: 'LANDING', rallyData: { ...state.rallyData, events: newEvents, attacker: state.selectedPlayer, attackType: 'Dump' }, logs: addLog(`Dump`, 'info') };
            return { ...state, matchPhase: 'ATTACK', selectedPlayer: null, rallyData: { ...state.rallyData, events: newEvents, setter: state.selectedPlayer }, logs: addLog(`Set`, 'info') };
        }
        case 'EXECUTE_ATTACK': { const type = action.payload; return { ...state, matchPhase: 'LANDING', rallyData: { ...state.rallyData, attacker: state.selectedPlayer, attackType: type }, selectedPlayer: null, logs: addLog(`Attack`, 'info') }; }

        case 'ATTACK_RESULT': {
            const { result } = action.payload;
            const { attacker, attackType, landingPoint, target } = state.rallyData;
            const attTeam = state.possession;
            const defTeam = attTeam === 'home' ? 'away' : 'home';

            const attackEvent = { subType: attackType, result: result, toPoint: landingPoint };

            // 1. Record Attack (Always happen first)
            const currentEvents = recordEvent('ATTACK', attacker, attackEvent);

            if (result === 'KILL') {
                let finalEvents = currentEvents;
                // 2. If it was a kill, did someone try to dig it?
                if (target) {
                    const digErrorEvent = {
                        type: 'DIG',
                        player: target,
                        timestamp: Date.now(),
                        team: defTeam,
                        grade: 0,
                        result: 'ERROR'
                    };
                    finalEvents = [...currentEvents, digErrorEvent];
                }

                return finalizePoint(
                    { ...state, rallyData: { ...state.rallyData, events: finalEvents } },
                    attTeam,
                    `${fmt(attacker)} Kill`
                );
            }
            if (result === 'ERROR') {
                return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: currentEvents } }, defTeam, `Attack Error`);
            }
            if (result === 'DIG') {
                // 3. Successful Dig
                let finalEvents = currentEvents;
                if (target) {
                    const digSuccessEvent = {
                        type: 'DIG',
                        player: target,
                        timestamp: Date.now(),
                        team: defTeam,
                        grade: 3,
                        result: 'SUCCESS'
                    };
                    finalEvents = [...currentEvents, digSuccessEvent];
                }
                return { ...state, matchPhase: 'RECEPTION', possession: defTeam, selectedPlayer: target, rallyData: { ...state.rallyData, events: finalEvents, receiver: target, attacker: null } };
            }
            return state;
        }

        case 'BLOCK_DETECTED': return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
        case 'BLOCK_OUTCOME': {
            const outcome = action.payload;
            if (outcome === 'SHUTDOWN') return { ...state, matchPhase: 'SELECT_BLOCKERS', rallyData: { ...state.rallyData, pendingResult: 'SHUTDOWN' }, logs: addLog("Select Blockers", "info") };

            const { blockers, attacker, attackType } = state.rallyData;
            const attTeam = state.possession;

            // Attack continues or tools off block
            const attackEvent = { subType: attackType, result: 'IN_PLAY' };
            let currentEvents = recordEvent('ATTACK', attacker, attackEvent);
            const blockEvent = { type: 'BLOCK', players: blockers, result: outcome, timestamp: Date.now(), team: attTeam === 'home' ? 'away' : 'home' };
            const eventsWithBlock = [...currentEvents, blockEvent];

            if (outcome === 'TOUCH_OUT') return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: eventsWithBlock } }, attTeam, 'Tool / Kill');
            if (outcome === 'REBOUND') return { ...state, matchPhase: 'COVER', possession: attTeam, rallyData: { ...state.rallyData, events: eventsWithBlock }, logs: addLog('Block Rebound', 'info') };
            if (outcome === 'SOFT_BLOCK') return { ...state, matchPhase: 'RECEPTION', possession: attTeam === 'home' ? 'away' : 'home', rallyData: { ...state.rallyData, events: eventsWithBlock }, logs: addLog('Soft Touch', 'info') };
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
                return finalizePoint({ ...state, rallyData: { ...state.rallyData, events: eventsWithBlock } }, defTeam, `Block Kill`);
            }
            return state;
        }
        case 'EXECUTE_COVER': { const coverEvent = { result: 'COVER' }; const newEvents = recordEvent('DIG', action.payload, coverEvent); return { ...state, matchPhase: 'SET', selectedPlayer: null, rallyData: { ...state.rallyData, events: newEvents }, logs: addLog(`Cover`, 'info') }; }

        case 'REFEREE_DECISION': {
            const { winner, reason } = action.payload;
            if (!winner || reason === 'Replay') return { ...state, matchPhase: 'PRE_SERVE', selectedPlayer: null, rallyData: INITIAL_RALLY_DATA, logs: addLog(`[REFEREE] REPLAY`, 'correction') };
            // Ensure winner is home/away
            if (!['home', 'away'].includes(winner)) return state;
            return finalizePoint(state, winner, `[REFEREE] ${reason}`);
        }

        // [FIXED] CHALLENGE LOGIC TO FORCE REVERT STATS
        case 'CHALLENGE_RESULT': {
            const { team, success, reason } = action.payload;
            if (!success) {
                const newChallenges = { ...state.challengesUsed }; newChallenges[team] += 1;
                return { ...state, challengesUsed: newChallenges, logs: addLog(`[CHALLENGE] ${reason} -> FAILED`, 'danger') };
            }

            // Challenge SUCCESS (Overturn)
            const winner = team;

            // 1. REVERT: Go back to the state EXACTLY before the last point was finalized.
            // This wipes the "Bad Rally" from history, effectively removing stats for Attacker/Blocker.
            if (!state.previousState) {
                console.error("Cannot overturn: No previous state available");
                return state;
            }

            const baseState = deepClone(state.previousState);

            // 2. APPLY CORRECT RESULT: Award point to the challenge winner.
            // Since we reverted, baseState is at PRE_SERVE (or similar) of the previous rally? 
            // No, previousState in finalizePoint is the snapshot taken *during* processing.
            // It puts us back to the moment *before* score increment.

            // Wait, if we revert to previousState, we lose the rally context (who served, etc) if not careful.
            // But finalizePoint's snapshot captures everything.

            // Construct the Administrative Point for the Challenge Winner
            const newScore = { ...baseState.score, [winner]: baseState.score[winner] + 1 };

            // Rotation Logic on the Base State
            const lastServer = baseState.lastServer || baseState.servingTeam;
            const shouldRotate = winner !== lastServer;
            let newRotations = { ...baseState.rotations };
            let newOriginals = { ...baseState.liberoOriginals };

            if (shouldRotate) {
                const rotData = processRotation(newRotations[winner], newOriginals[winner]);
                newRotations[winner] = rotData.newRotation;
                newOriginals[winner] = rotData.newOriginals;
            }

            // Create a specific "Correction Rally" entry for history so the score makes sense
            const correctionRally = {
                id: Date.now(),
                startTime: Date.now(),
                endTime: Date.now(),
                winner: winner,
                reason: `[CHALLENGE] ${reason} -> SUCCESS`,
                scoreState: { ...baseState.score },
                endScore: newScore,
                servingTeam: winner,
                events: [], // NO events, so no stats are awarded for this administrative point
                rotations: { home: newRotations.home.map(p => p?.id), away: newRotations.away.map(p => p?.id) }
            };

            return {
                ...baseState,
                previousState: null, // Clear prev state to prevent double undo
                score: newScore,
                servingTeam: winner,
                rotations: newRotations,
                liberoOriginals: newOriginals,
                matchPhase: 'PRE_SERVE',
                history: [correctionRally, ...baseState.history],
                logs: [{ id: Date.now(), time: getTime(), text: `[CHALLENGE] Overturn -> ${fmtTeam(winner)} Point`, type: 'success' }, ...baseState.logs],
                challengesUsed: state.challengesUsed, // Keep current challenge count (don't revert usage)
                rallyData: INITIAL_RALLY_DATA,
                selectedPlayer: null
            };
        }

        default: return state;
    }
};