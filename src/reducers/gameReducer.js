import { createSnapshot, processRotation } from '../utils/volleyballLogic';

const INITIAL_RALLY_DATA = {
    serveType: null,
    serveResult: null,
    blockers: [],
    setter: null,
    attacker: null,
    receiver: null,
    target: null,
    pendingResult: null,
    landingPoint: null,
    landingZone: null
};

// ... [getCoordinateDescription function remains the same] ...
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

    let depthDesc = "";
    let angleDesc = "";
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
    const teamName = (t) => t === 'home' ? 'Home' : 'Away';

    const calculateRotation = (winner, currentTeamState) => {
        const lastServer = currentTeamState.lastServer || currentTeamState.servingTeam;
        const shouldRotate = winner !== lastServer;
        const targetRotation = currentTeamState.rotations[winner];
        if (!targetRotation) return null;
        if (shouldRotate) {
            return { ...processRotation(targetRotation, currentTeamState.liberoOriginals[winner]), rotated: true };
        }
        return { newRotation: targetRotation, newOriginals: currentTeamState.liberoOriginals[winner], returningPlayer: null, rotated: false };
    };

    switch (action.type) {
        // ... [TIMEOUT, INIT_SERVE, REFEREE, CHALLENGE, SUBS, SELECT_PLAYER unchanged] ...
        case 'REQUEST_TIMEOUT': {
            const team = action.payload;
            if (state.timeoutsUsed[team] >= 2) return state;
            if (!['PRE_SERVE', 'SERVE'].includes(state.matchPhase)) return state;
            return { ...state, timeoutsUsed: { ...state.timeoutsUsed, [team]: state.timeoutsUsed[team] + 1 }, logs: addLog(`TIMEOUT ${teamName(team)} (${state.timeoutsUsed[team] + 1}/2)`, 'highlight') };
        }
        case 'INIT_SERVE':
            if (state.matchPhase !== 'PRE_SERVE') return state;
            const currentServer = state.rotations[state.servingTeam][0];
            if (currentServer && currentServer.isLibero) alert("WARNING: Libero in Service Position (Zone 1). Rotate or swap.");
            return { ...state, matchPhase: 'SERVE', lastServer: state.servingTeam, selectedPlayer: currentServer, possession: state.servingTeam, rallyData: INITIAL_RALLY_DATA };
        case 'REFEREE_DECISION': {
            let { winner, reason } = action.payload;
            if (!winner || reason === 'Replay') {
                return { ...state, matchPhase: 'PRE_SERVE', selectedPlayer: null, rallyData: INITIAL_RALLY_DATA, logs: addLog(`REFEREE: REPLAY (Rally Reset)`, 'correction') };
            }
            if (winner === 'A' || winner === 'KARASUNO') winner = 'home';
            if (winner === 'B' || winner === 'NEKOMA') winner = 'away';
            const baseState = state;
            const rotResult = calculateRotation(winner, baseState);
            if (!rotResult) return state;
            const { newRotation, newOriginals, autoSwapLog, returningPlayer } = rotResult;
            let newBenches = { ...baseState.benches };
            if (returningPlayer) newBenches[winner] = newBenches[winner].filter(p => p.id !== returningPlayer.id);
            let l = [{ id: Date.now(), time: getTime(), text: `REFEREE: ${reason} -> ${teamName(winner)} Point`, type: 'highlight' }, ...baseState.logs];
            if (autoSwapLog) l = [{ id: Date.now() + 1, time: getTime(), text: autoSwapLog.text, type: autoSwapLog.type }, ...l];
            return { ...baseState, score: { ...baseState.score, [winner]: baseState.score[winner] + 1 }, servingTeam: winner, rotations: { ...baseState.rotations, [winner]: newRotation }, liberoOriginals: { ...baseState.liberoOriginals, [winner]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', logs: l, selectedPlayer: null, rallyData: INITIAL_RALLY_DATA, previousState: createSnapshot(baseState) };
        }
        case 'CHALLENGE_RESULT': {
            const { team, success } = action.payload;
            if (!success) {
                const newChallenges = { ...state.challengesUsed }; newChallenges[team] += 1;
                return { ...state, challengesUsed: newChallenges, logs: addLog(`CHALLENGE FAILED (${teamName(team)})`, 'danger') };
            }
            const winner = team;
            const currentTotalScore = state.score.home + state.score.away;
            const prevTotalScore = state.previousState ? (state.previousState.score.home + state.previousState.score.away) : 0;
            const isPointReversal = state.previousState && (currentTotalScore > prevTotalScore);
            let baseState = isPointReversal ? state.previousState : state;
            const rotResult = calculateRotation(winner, baseState);
            if (!rotResult) return state;
            const { newRotation, newOriginals, autoSwapLog, returningPlayer } = rotResult;
            let newBenches = { ...baseState.benches };
            if (returningPlayer) newBenches[winner] = newBenches[winner].filter(p => p.id !== returningPlayer.id);
            let l = [{ id: Date.now(), time: getTime(), text: `CHALLENGE SUCCESS: Overturn -> ${teamName(winner)} Point`, type: 'success' }, ...baseState.logs];
            if (autoSwapLog) l = [{ id: Date.now() + 1, time: getTime(), text: autoSwapLog.text, type: autoSwapLog.type }, ...l];
            return { ...baseState, score: { ...baseState.score, [winner]: baseState.score[winner] + 1 }, servingTeam: winner, rotations: { ...baseState.rotations, [winner]: newRotation }, liberoOriginals: { ...baseState.liberoOriginals, [winner]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', logs: l, rallyData: INITIAL_RALLY_DATA, previousState: createSnapshot(baseState), challengesUsed: state.challengesUsed };
        }
        case 'REQUEST_SUB': return { ...state, matchPhase: 'SUBSTITUTION', actionTeam: action.payload, selectedPlayer: null };
        case 'REQUEST_LIBERO_SWAP': return { ...state, matchPhase: 'LIBERO_SWAP', actionTeam: action.payload, selectedPlayer: null };
        case 'EXECUTE_SUB': {
            const { benchPlayer, courtPlayer } = action.payload; const subTeam = state.actionTeam;
            const newBench = state.benches[subTeam].filter(p => p.id !== benchPlayer.id); newBench.push(courtPlayer);
            const newRot = state.rotations[subTeam].map(p => p.id === courtPlayer.id ? benchPlayer : p);
            return { ...state, rotations: { ...state.rotations, [subTeam]: newRot }, benches: { ...state.benches, [subTeam]: newBench }, subsUsed: { ...state.subsUsed, [subTeam]: state.subsUsed[subTeam] + 1 }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`SUB: ${teamName(subTeam)} ${fmt(benchPlayer)} In, ${fmt(courtPlayer)} Out`, 'info') };
        }
        case 'EXECUTE_LIBERO_SWAP': {
            const { libero, courtPlayer, zoneIndex, team: lTeam } = action.payload;
            const newLRotation = [...state.rotations[lTeam]]; const newLOriginals = { ...state.liberoOriginals[lTeam] }; const newLBench = [...state.benches[lTeam]];
            if (libero.isLibero) { newLRotation[zoneIndex] = libero; newLOriginals[libero.id] = courtPlayer; newLBench.push(courtPlayer); } else { newLRotation[zoneIndex] = libero; delete newLOriginals[courtPlayer.id]; }
            return { ...state, rotations: { ...state.rotations, [lTeam]: newLRotation }, liberoOriginals: { ...state.liberoOriginals, [lTeam]: newLOriginals }, benches: { ...state.benches, [lTeam]: newLBench }, matchPhase: 'PRE_SERVE', selectedPlayer: null, actionTeam: null, logs: addLog(`L-SWAP: ${teamName(lTeam)} ${fmt(libero)} <-> ${fmt(courtPlayer)}`, 'info') };
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
                            if (idx > 2) { alert("Invalid Zone!"); return { ...state, selectedPlayer: null }; }
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
            const current = state.matchPhase;
            if (current === 'SERVE') { if (state.rallyData.serveType) return { ...state, rallyData: { ...state.rallyData, serveType: null } }; return state; }
            if (current === 'SERVE_LANDING') return { ...state, matchPhase: 'SERVE', possession: state.servingTeam, rallyData: { ...state.rallyData, serveResult: null }, selectedPlayer: state.rotations[state.servingTeam][0] };

            // UNDO FROM RECEPTION: Check where we came from
            if (current === 'RECEPTION') {
                // If there is an attacker, we came from DIG_DECISION
                if (state.rallyData.attacker) {
                    const attId = state.rallyData.attacker.id;
                    const isHomeAttacker = state.rotations.home.some(p => p && p.id === attId) || state.benches.home.some(p => p.id === attId);
                    const attTeam = isHomeAttacker ? 'home' : 'away';
                    return {
                        ...state,
                        matchPhase: 'DIG_DECISION',
                        possession: attTeam, // Give ball back to attacker for UI
                        selectedPlayer: state.rallyData.target
                    };
                }
                // Else we came from SERVE_LANDING
                return { ...state, matchPhase: 'SERVE_LANDING', possession: state.servingTeam, selectedPlayer: null, rallyData: { ...state.rallyData, landingPoint: null } };
            }

            // UNDO FROM SET: Always go back to RECEPTION (since we inserted it)
            if (current === 'SET') {
                return { ...state, matchPhase: 'RECEPTION', selectedPlayer: state.rallyData.receiver };
            }

            if (current === 'ATTACK') return { ...state, matchPhase: 'SET', selectedPlayer: state.rallyData.setter };
            if (current === 'LANDING') { if (state.rallyData.attackType === 'Dump') return { ...state, matchPhase: 'SET', selectedPlayer: state.rallyData.setter, rallyData: { ...state.rallyData, attackType: null } }; return { ...state, matchPhase: 'ATTACK', selectedPlayer: state.rallyData.attacker }; }
            if (current === 'DIG_DECISION') return { ...state, matchPhase: 'LANDING', selectedPlayer: null, rallyData: { ...state.rallyData, landingPoint: null } };
            if (current === 'BLOCK_RESULT') return { ...state, matchPhase: 'DIG_DECISION', selectedPlayer: state.rallyData.target };
            if (current === 'SELECT_BLOCKERS') return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null, rallyData: { ...state.rallyData, blockers: [], pendingResult: null } };
            if (current === 'COVER') return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
            if (current === 'PRE_SERVE' && state.previousState) { return state.previousState; }
            return state;
        }

        case 'SET_SERVE_TYPE': return { ...state, rallyData: { ...state.rallyData, serveType: action.payload } };
        case 'SET_SERVE_RESULT': {
            const result = action.payload; const opp = state.servingTeam === 'home' ? 'away' : 'home';
            if (result === 'ERROR') {
                const snapshot = createSnapshot(state);
                const { newRotation, newOriginals, returningPlayer } = calculateRotation(opp, state);
                let newBenches = { ...state.benches }; if (returningPlayer) newBenches[opp] = newBenches[opp].filter(p => p.id !== returningPlayer.id);
                return { ...state, previousState: snapshot, score: { ...state.score, [opp]: state.score[opp] + 1 }, servingTeam: opp, rotations: { ...state.rotations, [opp]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [opp]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', selectedPlayer: null, logs: addLog(`${fmt(state.selectedPlayer)} Serve Error`, 'danger') };
            }
            return { ...state, rallyData: { ...state.rallyData, serveResult: result }, matchPhase: 'SERVE_LANDING', selectedPlayer: null, logs: addLog(`${fmt(state.selectedPlayer)} Serve -> ${result}`, 'info') };
        }

        case 'SELECT_LANDING_POINT': {
            const { point, opponentTeam } = action.payload;
            const zoneToIdxMap = { 1: 0, 6: 1, 5: 2, 4: 3, 3: 4, 2: 5 };
            const isCoordinate = typeof point === 'object' && point !== null && 'x' in point;
            let rec = null;
            if (!isCoordinate) rec = state.rotations[opponentTeam][zoneToIdxMap[point]];

            const updatedRallyData = {
                ...state.rallyData,
                landingPoint: isCoordinate ? point : null,
                landingZone: isCoordinate ? null : point,
                receiver: isCoordinate ? state.rallyData.receiver : rec,
                target: isCoordinate ? state.rallyData.target : rec
            };

            const locDesc = isCoordinate ? getCoordinateDescription(point) : `Zone ${point}`;

            if (state.matchPhase === 'SERVE_LANDING' && state.rallyData.serveResult === 'ACE') {
                const snapshot = createSnapshot(state);
                const serverName = fmt(state.rotations[state.servingTeam][0]);
                const logText = `${serverName} ACE -> ${locDesc}`;
                return { ...state, previousState: snapshot, score: { ...state.score, [state.servingTeam]: state.score[state.servingTeam] + 1 }, matchPhase: 'PRE_SERVE', rallyData: updatedRallyData, logs: addLog(logText, 'success') };
            }

            if (state.matchPhase === 'SERVE_LANDING') {
                return { ...state, matchPhase: 'RECEPTION', possession: opponentTeam, selectedPlayer: rec, rallyData: updatedRallyData };
            }

            return { ...state, matchPhase: 'DIG_DECISION', selectedPlayer: rec, rallyData: updatedRallyData };
        }

        case 'RECEPTION_GRADE': {
            const grade = action.payload.quality;
            const landingDesc = state.rallyData.landingPoint ? getCoordinateDescription(state.rallyData.landingPoint) : (state.rallyData.landingZone ? `Zone ${state.rallyData.landingZone}` : "");

            // Check if this is a DIG or a PASS (Serve Receive)
            const isDig = !!state.rallyData.attacker;
            const actionType = isDig ? "Dig" : "Pass";

            const playerStr = state.rallyData.receiver ? fmt(state.rallyData.receiver) : (isDig ? "Unknown Dig" : "Ball Received");

            if (grade === 0) {
                // Error on Reception/Dig -> Point to the OTHER team.
                // Since possession is already set to the receiving/digging team in this phase,
                // the winner is the opponent of 'state.possession'.
                const winner = state.possession === 'home' ? 'away' : 'home';

                const snapshot = createSnapshot(state);
                const logText = `${playerStr} ${actionType} Error @ ${landingDesc}`;

                // Calculate rotation for the winner
                const rotResult = calculateRotation(winner, state);
                // ... (standard win logic below) ...
                if (!rotResult) return state;
                const { newRotation, newOriginals, returningPlayer } = rotResult;
                let newBenches = { ...state.benches };
                if (returningPlayer) newBenches[winner] = newBenches[winner].filter(p => p.id !== returningPlayer.id);

                return {
                    ...state,
                    previousState: snapshot,
                    score: { ...state.score, [winner]: state.score[winner] + 1 },
                    servingTeam: winner,
                    rotations: { ...state.rotations, [winner]: newRotation },
                    liberoOriginals: { ...state.liberoOriginals, [winner]: newOriginals },
                    benches: newBenches,
                    matchPhase: 'PRE_SERVE',
                    logs: addLog(logText, 'success')
                };
            }

            // Success -> Move to SET
            return {
                ...state,
                matchPhase: 'SET',
                selectedPlayer: null,
                logs: addLog(`${playerStr} ${actionType}: ${grade} (${landingDesc})`, 'info')
            };
        }

        case 'EXECUTE_SET':
            if (action.payload.type === 'Dump') return { ...state, matchPhase: 'LANDING', selectedPlayer: null, rallyData: { ...state.rallyData, setter: state.selectedPlayer, attacker: state.selectedPlayer, attackType: 'Dump' }, logs: addLog(`${fmt(state.selectedPlayer)} Dump`, 'info') };
            return { ...state, matchPhase: 'ATTACK', selectedPlayer: null, rallyData: { ...state.rallyData, setter: state.selectedPlayer }, logs: addLog(`${fmt(state.selectedPlayer)} Set`, 'info') };

        case 'EXECUTE_ATTACK':
            return { ...state, rallyData: { ...state.rallyData, attacker: state.selectedPlayer, attackType: action.payload.type }, matchPhase: 'LANDING', selectedPlayer: null, logs: addLog(`${fmt(state.selectedPlayer)} Attack (${action.payload.type})`, 'info') };

        case 'BLOCK_DETECTED': return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
        case 'BLOCK_OUTCOME': {
            const attTeam = state.possession; const defTeam = attTeam === 'home' ? 'away' : 'home';
            if (action.payload === 'SHUTDOWN') return { ...state, matchPhase: 'SELECT_BLOCKERS', rallyData: { ...state.rallyData, pendingResult: 'SHUTDOWN' }, logs: addLog(`Block Shutdown (Select Blockers)`, 'info') };
            if (action.payload === 'TOUCH_OUT') {
                const snapshot = createSnapshot(state);
                const { newRotation, newOriginals, returningPlayer } = calculateRotation(attTeam, state);
                let newBenches = { ...state.benches }; if (returningPlayer) newBenches[attTeam] = newBenches[attTeam].filter(p => p.id !== returningPlayer.id);
                return { ...state, previousState: snapshot, score: { ...state.score, [attTeam]: state.score[attTeam] + 1 }, servingTeam: attTeam, rotations: { ...state.rotations, [attTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [attTeam]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', logs: addLog(`${fmt(state.rallyData.attacker)} Tool / Block Touch Out`, 'success') };
            }
            if (action.payload === 'REBOUND') return { ...state, matchPhase: 'COVER', possession: attTeam, logs: addLog(`Block Rebound`, 'info'), selectedPlayer: null };
            return { ...state, matchPhase: 'RECEPTION', possession: defTeam, logs: addLog(`Soft Block / Touch`, 'info'), selectedPlayer: null };
        }
        case 'TOGGLE_BLOCKER': { const p = action.payload; const currentBlockers = state.rallyData.blockers; const exists = currentBlockers.find(b => b.id === p.id); const newBlockers = exists ? currentBlockers.filter(b => b.id !== p.id) : [...currentBlockers, p]; return { ...state, rallyData: { ...state.rallyData, blockers: newBlockers } }; }
        case 'CONFIRM_BLOCK': {
            const { pendingResult, blockers } = state.rallyData;
            if (pendingResult === 'SHUTDOWN') {
                const defTeam = state.possession === 'home' ? 'away' : 'home';
                const snapshot = createSnapshot(state);
                const { newRotation, newOriginals, returningPlayer } = calculateRotation(defTeam, state);
                let newBenches = { ...state.benches }; if (returningPlayer) newBenches[defTeam] = newBenches[defTeam].filter(p => p.id !== returningPlayer.id);
                const blockerNames = blockers.length > 0 ? blockers.map(fmt).join(' & ') : 'Block';
                return { ...state, previousState: snapshot, score: { ...state.score, [defTeam]: state.score[defTeam] + 1 }, servingTeam: defTeam, rotations: { ...state.rotations, [defTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [defTeam]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', logs: addLog(`Shutdown: ${blockerNames}`, 'highlight'), selectedPlayer: null, rallyData: INITIAL_RALLY_DATA };
            }
            return { ...state, matchPhase: 'BLOCK_RESULT', selectedPlayer: null };
        }
        case 'EXECUTE_COVER': return { ...state, matchPhase: 'SET', selectedPlayer: null, logs: addLog(`${fmt(action.payload)} Cover`, 'info') };

        case 'ATTACK_RESULT': {
            const { result } = action.payload;
            const attTeam = state.possession;
            const defTeam = attTeam === 'home' ? 'away' : 'home';

            const landingDesc = state.rallyData.landingPoint
                ? getCoordinateDescription(state.rallyData.landingPoint)
                : (state.rallyData.landingZone ? `Zone ${state.rallyData.landingZone}` : "");

            if (result === 'KILL') {
                const snapshot = createSnapshot(state);
                const { newRotation, newOriginals, returningPlayer } = calculateRotation(attTeam, state);
                let newBenches = { ...state.benches }; if (returningPlayer) newBenches[attTeam] = newBenches[attTeam].filter(p => p.id !== returningPlayer.id);
                return { ...state, previousState: snapshot, score: { ...state.score, [attTeam]: state.score[attTeam] + 1 }, servingTeam: attTeam, rotations: { ...state.rotations, [attTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [attTeam]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', logs: addLog(`${fmt(state.rallyData.attacker)} Kill -> ${landingDesc}`, 'success') };
            }
            if (result === 'ERROR') {
                const snapshot = createSnapshot(state);
                const { newRotation, newOriginals, returningPlayer } = calculateRotation(defTeam, state);
                let newBenches = { ...state.benches }; if (returningPlayer) newBenches[defTeam] = newBenches[defTeam].filter(p => p.id !== returningPlayer.id);
                return { ...state, previousState: snapshot, score: { ...state.score, [defTeam]: state.score[defTeam] + 1 }, servingTeam: defTeam, rotations: { ...state.rotations, [defTeam]: newRotation }, liberoOriginals: { ...state.liberoOriginals, [defTeam]: newOriginals }, benches: newBenches, matchPhase: 'PRE_SERVE', logs: addLog(`${fmt(state.rallyData.attacker)} Attack Error`, 'danger') };
            }

            // [FIXED] TRANSITION TO RECEPTION (Grading) FOR DIGS
            if (result === 'DIG') {
                // If digger is known (from Zone click), select them.
                const digger = state.rallyData.target;

                return {
                    ...state,
                    matchPhase: 'RECEPTION', // Move to grading phase!
                    possession: defTeam,
                    selectedPlayer: digger, // Select them so you can just click grade
                    rallyData: {
                        ...state.rallyData,
                        receiver: digger // Ensure receiver field is populated for RECEPTION phase
                    }
                    // Note: We do NOT log "Dig" yet. We wait for the Grade.
                };
            }
            return state;
        }

        default: return state;
    }
};