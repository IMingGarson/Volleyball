import { useEffect, useReducer } from 'react';
import { createInitialState, gameReducer } from '../reducers/gameReducer';
import { useMatchStore } from '../store/matchStore';

export const useVolleyballGame = () => {
    const { setupData, liveGameBackup, saveLiveState } = useMatchStore();

    // Initialize Reducer with backup if available
    const [state, dispatch] = useReducer(gameReducer, null, () =>
        createInitialState(setupData, liveGameBackup)
    );

    // Auto-Save Effect
    useEffect(() => {
        saveLiveState(state);
    }, [state, saveLiveState]);

    // Auto-Start Serve Phase Effect
    useEffect(() => {
        if (state.matchPhase === 'PRE_SERVE') {
            const t = setTimeout(() => dispatch({ type: 'INIT_SERVE' }), 200);
            return () => clearTimeout(t);
        }
    }, [state.matchPhase]);

    // Action Dispatchers
    const actions = {
        // --- Selection & Movement ---
        selectPlayer: (player) => dispatch({ type: 'SELECT_PLAYER', payload: player }),
        selectZone: (coordinateOrZone, opponentTeam) =>
            dispatch({ type: 'SELECT_LANDING_POINT', payload: { point: coordinateOrZone, opponentTeam } }),

        // --- Game Flow Control ---
        undo: () => dispatch({ type: 'UNDO_STEP' }),
        cancel: () => dispatch({ type: 'CANCEL_ACTION' }),

        // --- Referee & Admin ---
        handleChallenge: (team, challengeData) =>
            dispatch({
                type: 'CHALLENGE_RESULT',
                payload: {
                    team,
                    success: challengeData.success,
                    reason: challengeData.type
                }
            }),
        handleReferee: (winner, reason) => dispatch({ type: 'REFEREE_DECISION', payload: { winner, reason } }),
        requestSub: (team) => dispatch({ type: 'REQUEST_SUB', payload: team }),
        requestLiberoSwap: (team) => dispatch({ type: 'REQUEST_LIBERO_SWAP', payload: team }),
        requestTimeout: (team) => dispatch({ type: 'REQUEST_TIMEOUT', payload: team }),

        // --- Rally Actions ---
        setServeType: (t) => dispatch({ type: 'SET_SERVE_TYPE', payload: t }),
        setServeResult: (r) => dispatch({ type: 'SET_SERVE_RESULT', payload: r }),

        setReception: (q, p) => dispatch({ type: 'RECEPTION_GRADE', payload: { quality: q, player: p } }),

        setSetType: (t) => dispatch({ type: 'EXECUTE_SET', payload: t }),
        skipSet: () => dispatch({ type: 'SKIP_SET_PHASE' }), // [NEW] Added for Attack on 2

        setAttackType: (t) => dispatch({ type: 'EXECUTE_ATTACK', payload: t }),
        setAttackResult: (r) => dispatch({ type: 'ATTACK_RESULT', payload: { result: r } }),

        // --- Block Logic ---
        blockDetected: () => dispatch({ type: 'BLOCK_DETECTED' }),
        blockOutcome: (o) => dispatch({ type: 'BLOCK_OUTCOME', payload: o }),
        toggleBlocker: (p) => dispatch({ type: 'TOGGLE_BLOCKER', payload: p }),
        confirmBlock: () => dispatch({ type: 'CONFIRM_BLOCK' }),
    };

    return { state, actions, setupData };
};