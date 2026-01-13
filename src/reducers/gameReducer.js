import { createSnapshot, processRotation } from '../utils/volleyballLogic';

// Reusable initial rally state
const INITIAL_RALLY_DATA = { serveType: null, serveResult: null, blockers: [], setter: null, attacker: null, receiver: null, target: null, pendingResult: null };

export const createInitialState = (rosters, savedState) => {
    if (savedState) {
        return {
            ...savedState,
            liberoLists: savedState.liberoLists || { home: rosters.home.liberos || [], away: rosters.away.liberos || [] },
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
        rallyData: INITIAL_RALLY_DATA
    };
};

export const gameReducer = (state, action) => {
    const getTime = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
    const addLog = (text, type = 'info') => [{ id: Date.now(), time: getTime(), text, type }, ...state.logs];
    const fmt = (p) => p ? `#${p.number} ${p.name}` : 'Unknown';

    switch (action.type) {
        case 'REQUEST_TIMEOUT': {
            const team = action.payload;
            const teamCode = team === 'home' ? 'HOME' : 'AWAY';
            if (state.timeoutsUsed[team] >= 2) return state;
            if (!['PRE_SERVE', 'SERVE'].includes(state.matchPhase)) return state;
            return { ...state, timeoutsUsed: { ...state.timeoutsUsed, [team]: state.timeoutsUsed[team] + 1 }, logs: addLog(`TIMEOUT ${teamCode} (${state.timeoutsUsed[team] + 1}/2)`, 'highlight') };
        }

        case 'INIT_SERVE':
            if (state.matchPhase !== 'PRE_SERVE') return state;
            const currentServer = state.rotations[state.servingTeam][0];
            if (currentServer && currentServer.isLibero) alert("WARNING: Libero in Service Position (Zone 1). Rotate or swap.");
            return { ...state, matchPhase: 'SERVE', lastServer: state.servingTeam, selectedPlayer: currentServer, possession: state.servingTeam, rallyData: INITIAL_RALLY_DATA };

        case 'REFEREE_DECISION': {
            let { winner, reason } = action.payload;

            // [LOGIC UPDATE] REPLAY: Pure Reset of Current Rally
            // Does NOT undo previous points. Used to wipe "dirty" data from an interrupted rally.
            if (!winner || reason === 'Replay') {
                return {
                    ...state,
                    matchPhase: 'PRE_SERVE',
                    selectedPlayer: null,
                    rallyData: INITIAL_RALLY_DATA,
                    logs: addLog(`REFEREE: REPLAY POINT (Rally Reset)`, 'correction')
                };
            }

            // Normalize Winner Input (Robustness)
            if (winner === 'A' || winner === 'KARASUNO') winner = 'home';
            if (winner === 'B' || winner === 'NEKOMA') winner = 'away';

            const teamCode = winner === 'home' ? 'HOME' : 'AWAY';

            // [LOGIC UPDATE] FORWARD PROGRESS
            // We assume the score has NOT been updated yet (as per instruction).
            // We always use the CURRENT state as the baseline.
            const baseState = state;

            // Determine Rotation (Sideout Logic)
            const shouldRotate = winner !== baseState.servingTeam;

            // Safety Check
            const targetRotation = baseState.rotations[winner];
            if (!targetRotation) {
                console.error("CRITICAL ERROR: Invalid winner team key:", winner);
                return state;
            }

            const { newRotation, newOriginals, autoSwapLog, returningPlayer } = shouldRotate
                ? processRotation(targetRotation, baseState.liberoOriginals[winner])
                : { newRotation: targetRotation, newOriginals: baseState.liberoOriginals[winner], returningPlayer: null };

            let newBenches = { ...baseState.benches };
            if (returningPlayer) newBenches[winner] = newBenches[winner].filter(p => p.id !== returningPlayer.id);

            // Log Construction
            let l = [{ id: Date.now(), time: getTime(), text: `REFEREE: ${reason} -> POINT ${teamCode}`, type: 'highlight' }, ...baseState.logs];
            if (autoSwapLog) l = [{ id: Date.now() + 1, time: getTime(), text: autoSwapLog.text, type: autoSwapLog.type }, ...l];

            return {
                ...baseState,
                score: { ...baseState.score, [winner]: baseState.score[winner] + 1 }, // Add Point
                servingTeam: winner, // Set Server
                rotations: { ...baseState.rotations, [winner]: newRotation }, // Update Rotation
                liberoOriginals: { ...baseState.liberoOriginals, [winner]: newOriginals },
                benches: newBenches,
                matchPhase: 'PRE_SERVE', // Reset Phase
                logs: l,
                selectedPlayer: null,
                rallyData: INITIAL_RALLY_DATA,
                // Snapshot THIS state as the new restore point
                previousState: createSnapshot(baseState)
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

            // SUCCESSFUL CHALLENGE = OVERTURN / CORRECTION
            // This KEEPS the "Smart Undo" logic because Challenges often happen AFTER a point is awarded.
            const winner = challenger;
            const winnerCode = winner === 'home' ? 'HOME' : 'AWAY';

            // Check if we need to undo a point (Reversal)
            const currentTotalScore = state.score.home + state.score.away;
            const prevTotalScore = state.previousState ? (state.previousState.score.home + state.previousState.score.away) : 0;
            const isPointReversal = state.previousState && (currentTotalScore > prevTotalScore);

            // Use Previous State if reversing, else Current State
            let baseState = isPointReversal ? state.previousState : state;

            const shouldRotate = winner !== baseState.servingTeam;

            // Safety
            const targetRotation = baseState.rotations[winner];
            if (!targetRotation) return state;

            const { newRotation, newOriginals, autoSwapLog, returningPlayer } = shouldRotate
                ? processRotation(targetRotation, baseState.liberoOriginals[winner])
                : { newRotation: targetRotation, newOriginals: baseState.liberoOriginals[winner], returningPlayer: null };

            let newBenches = { ...baseState.benches };
            if (returningPlayer) newBenches[winner] = newBenches[winner].filter(p => p.id !== returningPlayer.id);

            let l = [{ id: Date.now(), time: getTime(), text: `CHALLENGE SUCCESS: VERDICT OVERTURNED -> POINT ${winnerCode}`, type: 'success' }, ...baseState.logs];
            if (autoSwapLog) l = [{ id: Date.now() + 1, time: getTime(), text: autoSwapLog.text, type: autoSwapLog.type }, ...l];

            return {
                ...baseState,
                score: { ...baseState.score, [winner]: baseState.score[winner] + 1 },
                servingTeam: winner,
                rotations: { ...baseState.rotations, [winner]: newRotation },
                liberoOriginals: { ...baseState.liberoOriginals, [winner]: newOriginals },
                benches: newBenches,
                matchPhase: 'PRE_SERVE',
                logs: l,
                rallyData: INITIAL_RALLY_DATA,
                previousState: createSnapshot(baseState),
                challengesUsed: state.challengesUsed
            };
        }

        // --- STANDARD GAME ACTIONS (Unchanged) ---
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
            const newLBench = [...state.benches[lTeam]];
            if (libero.isLibero) { newLRotation[zoneIndex] = libero; newLOriginals[libero.id] = courtPlayer; newLBench.push(courtPlayer); } else { newLRotation[zoneIndex] = libero; delete newLOriginals[courtPlayer.id]; }
            return { ...state, rotations: { ...state.rotations, [lTeam]: newLRotation }, liberoOriginals: { ...state.liberoOriginals, [lTeam]: newLOriginals }, benches: { ...state.benches, [lTeam]: newLBench }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`LIBERO SWAP: ${fmt(libero)} <-> ${fmt(courtPlayer)}`, 'info') };
        }

        case 'SELECT_PLAYER': {
            const p = action.payload; if (!p) return state;
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
                            if (idx > 2) { alert("Invalid Zone! Libero can only enter Back Row (Zones 1, 6, 5)."); return { ...state, selectedPlayer: null }; }
                            return gameReducer(state, { type: 'EXECUTE_LIBERO_SWAP', payload: { libero: p1, courtPlayer: p2, zoneIndex: idx, team: pTeam } });
                        }
                    }
                }
            }
            const pTeamStandard = (state.rotations.home.find(x => x?.id === p.id)) ? 'home' : 'away';
            if (state.matchPhase === 'SELECT_BLOCKERS') { const defTeam = state.possession === 'home' ? 'away' : 'home'; if (pTeamStandard !== defTeam) return state; return gameReducer(state, { type: 'TOGGLE_BLOCKER', payload: p }); }
            if (state.matchPhase === 'COVER') { if (pTeamStandard !== state.possession) return state; return gameReducer(state, { type: 'EXECUTE_COVER', payload: { ...p } }); }
            let newData = { ...state.rallyData }; if (state.matchPhase === 'RECEPTION') newData.receiver = p;
            return { ...state, selectedPlayer: p, rallyData: newData };
        }

        case 'CANCEL_SELECTION': case 'CANCEL_ACTION': return { ...state, selectedPlayer: null, matchPhase: state.matchPhase === 'DIG_DECISION' ? 'LANDING' : (['SUBSTITUTION', 'LIBERO_SWAP'].includes(state.matchPhase) ? 'PRE_SERVE' : state.matchPhase), actionTeam: null, rallyData: { ...state.rallyData, serveType: null, serveResult: null, blockers: [] } };

        case 'UNDO_STEP': {
            if (state.matchPhase === 'SERVE' && state.rallyData.serveType) return { ...state, rallyData: { ...state.rallyData, serveType: null } };
            // General UNDO could use previousState here if implemented fully
            return state;
        }

        case 'SET_SERVE_TYPE': return { ...state, rallyData: { ...state.rallyData, serveType: action.payload } };

        case 'SET_SERVE_RESULT': {
            const result = action.payload; const opp = state.servingTeam === 'home' ? 'away' : 'home';
            if (result === 'ERROR') { const snapshot = createSnapshot(state); const { newRotation, newOriginals, returningPlayer } = processRotation(state.rotations[opp], state.liberoOriginals[opp]); let newBenches = { ...state.benches }; if (returningPlayer) newBenches[opp] = newBenches[opp].filter(p => p.id !== returningPlayer.id); return { ...state, previousState: snapshot, score: { ...state.score, [opp]: state.score[opp] + 1 }, servingTeam: opp, rotations: { ...state.rotations, [opp]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [opp]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', selectedPlayer: null, logs: addLog(`SERVE ERROR -> POINT`, 'danger') }; }
            return { ...state, rallyData: { ...state.rallyData, serveResult: result }, matchPhase: 'SERVE_LANDING', selectedPlayer: null, logs: addLog(`Serve -> ${result}`, 'info') };
        }

        case 'SELECT_LANDING_ZONE': { const { zoneIndex, opponentTeam } = action.payload; const zoneToIdxMap = { 1: 0, 6: 1, 5: 2, 4: 3, 3: 4, 2: 5 }; const rec = state.rotations[opponentTeam][zoneToIdxMap[zoneIndex]]; if (state.matchPhase === 'SERVE_LANDING') { if (state.rallyData.serveResult === 'ACE') { const snapshot = createSnapshot(state); return { ...state, previousState: snapshot, score: { ...state.score, [state.servingTeam]: state.score[state.servingTeam] + 1 }, matchPhase: 'PRE_SERVE', logs: addLog(`ACE!`, 'success') }; } return { ...state, matchPhase: 'RECEPTION', possession: opponentTeam, selectedPlayer: rec, rallyData: { ...state.rallyData, receiver: rec } }; } return { ...state, selectedPlayer: rec, matchPhase: 'DIG_DECISION', rallyData: { ...state.rallyData, target: rec } }; }
        case 'RECEPTION_GRADE': { if (action.payload.quality === 0) { const snapshot = createSnapshot(state); return { ...state, previousState: snapshot, score: { ...state.score, [state.servingTeam]: state.score[state.servingTeam] + 1 }, matchPhase: 'PRE_SERVE', logs: addLog(`RECEPTION ERROR`, 'success') }; } return { ...state, matchPhase: 'SET', selectedPlayer: null, logs: addLog(`Pass: ${action.payload.quality}`, 'info') }; }
        case 'EXECUTE_SET': if (action.payload.type === 'Dump') return { ...state, matchPhase: 'LANDING', selectedPlayer: null, rallyData: { ...state.rallyData, setter: state.selectedPlayer, attacker: state.selectedPlayer, attackType: 'Dump' }, logs: addLog(`DUMP`, 'info') }; return { ...state, matchPhase: 'ATTACK', selectedPlayer: null, rallyData: { ...state.rallyData, setter: state.selectedPlayer }, logs: addLog(`SET`, 'info') };
        case 'EXECUTE_ATTACK': return { ...state, rallyData: { ...state.rallyData, attacker: state.selectedPlayer, attackType: action.payload.type }, matchPhase: 'LANDING', selectedPlayer: null, logs: addLog(`ATTACK`, 'info') };
        case 'BLOCK_DETECTED': return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };

        case 'BLOCK_OUTCOME': {
            const attTeam = state.possession; const defTeam = attTeam === 'home' ? 'away' : 'home';
            if (action.payload === 'SHUTDOWN') return { ...state, matchPhase: 'SELECT_BLOCKERS', rallyData: { ...state.rallyData, pendingResult: 'SHUTDOWN' }, logs: addLog(`SHUTDOWN (Select Blockers)`, 'info') };
            if (action.payload === 'TOUCH_OUT') { const snapshot = createSnapshot(state); const shouldRotate = attTeam !== state.servingTeam; const { newRotation, newOriginals, returningPlayer } = shouldRotate ? processRotation(state.rotations[attTeam], state.liberoOriginals[attTeam]) : { newRotation: state.rotations[attTeam], newOriginals: state.liberoOriginals[attTeam], returningPlayer: null }; let newBenches = { ...state.benches }; if (returningPlayer) newBenches[attTeam] = newBenches[attTeam].filter(p => p.id !== returningPlayer.id); return { ...state, previousState: snapshot, score: { ...state.score, [attTeam]: state.score[attTeam] + 1 }, servingTeam: attTeam, rotations: { ...state.rotations, [attTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [attTeam]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', logs: addLog(`BLOCK TOUCH OUT`, 'success') }; }
            if (action.payload === 'REBOUND') return { ...state, matchPhase: 'COVER', possession: attTeam, logs: addLog(`REBOUND`, 'info'), selectedPlayer: null };
            return { ...state, matchPhase: 'RECEPTION', possession: defTeam, logs: addLog(`SOFT BLOCK`, 'info'), selectedPlayer: null };
        }

        case 'TOGGLE_BLOCKER': { const p = action.payload; const currentBlockers = state.rallyData.blockers; const exists = currentBlockers.find(b => b.id === p.id); const newBlockers = exists ? currentBlockers.filter(b => b.id !== p.id) : [...currentBlockers, p]; return { ...state, rallyData: { ...state.rallyData, blockers: newBlockers } }; }

        case 'CONFIRM_BLOCK': {
            const { pendingResult } = state.rallyData;
            if (pendingResult === 'SHUTDOWN') {
                const defTeam = state.possession === 'home' ? 'away' : 'home'; const snapshot = createSnapshot(state); const shouldRotate = defTeam !== state.servingTeam; const { newRotation, newOriginals, returningPlayer } = shouldRotate ? processRotation(state.rotations[defTeam], state.liberoOriginals[defTeam]) : { newRotation: state.rotations[defTeam], newOriginals: state.liberoOriginals[defTeam], returningPlayer: null }; let newBenches = { ...state.benches }; if (returningPlayer) newBenches[defTeam] = newBenches[defTeam].filter(p => p.id !== returningPlayer.id);
                return { ...state, previousState: snapshot, score: { ...state.score, [defTeam]: state.score[defTeam] + 1 }, servingTeam: defTeam, rotations: { ...state.rotations, [defTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [defTeam]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', logs: addLog(`SHUTDOWN POINT`, 'highlight'), selectedPlayer: null, rallyData: INITIAL_RALLY_DATA };
            }
            return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
        }

        case 'EXECUTE_COVER': return { ...state, matchPhase: 'SET', selectedPlayer: null, logs: addLog(`COVER`, 'info') };

        case 'ATTACK_RESULT': {
            const { result } = action.payload; const attTeam = state.possession; const defTeam = attTeam === 'home' ? 'away' : 'home';
            if (result === 'KILL') { const snapshot = createSnapshot(state); const shouldRotate = attTeam !== state.servingTeam; const { newRotation, newOriginals, returningPlayer } = shouldRotate ? processRotation(state.rotations[attTeam], state.liberoOriginals[attTeam]) : { newRotation: state.rotations[attTeam], newOriginals: state.liberoOriginals[attTeam], returningPlayer: null }; let newBenches = { ...state.benches }; if (returningPlayer) newBenches[attTeam] = newBenches[attTeam].filter(p => p.id !== returningPlayer.id); return { ...state, previousState: snapshot, score: { ...state.score, [attTeam]: state.score[attTeam] + 1 }, servingTeam: attTeam, rotations: { ...state.rotations, [attTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [attTeam]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', logs: addLog(`KILL -> POINT`, 'success') }; }
            if (result === 'ERROR') { const snapshot = createSnapshot(state); const shouldRotate = defTeam !== state.servingTeam; const { newRotation, newOriginals, returningPlayer } = shouldRotate ? processRotation(state.rotations[defTeam], state.liberoOriginals[defTeam]) : { newRotation: state.rotations[defTeam], newOriginals: state.liberoOriginals[defTeam], returningPlayer: null }; let newBenches = { ...state.benches }; if (returningPlayer) newBenches[defTeam] = newBenches[defTeam].filter(p => p.id !== returningPlayer.id); return { ...state, previousState: snapshot, score: { ...state.score, [defTeam]: state.score[defTeam] + 1 }, servingTeam: defTeam, rotations: { ...state.rotations, [defTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [defTeam]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', logs: addLog(`ATTACK ERROR`, 'danger') }; }
            if (result === 'DIG') return { ...state, matchPhase: 'SET', possession: defTeam, logs: addLog(`DIG`, 'info'), selectedPlayer: null };
            return state;
        }

        default: return state;
    }
};