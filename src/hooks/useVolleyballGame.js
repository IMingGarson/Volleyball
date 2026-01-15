import { useEffect, useReducer } from 'react';
import { createInitialState, gameReducer } from '../reducers/gameReducer';
import { useMatchStore } from '../store/matchStore';

export const useVolleyballGame = () => {
    const { setupData, liveGameBackup, saveLiveState } = useMatchStore();
    const [state, dispatch] = useReducer(gameReducer, null, () => createInitialState(setupData, liveGameBackup));

    // Auto-save effect
    useEffect(() => { saveLiveState(state); }, [state, saveLiveState]);

    // Auto-Serve Transition
    useEffect(() => {
        if (state.matchPhase === 'PRE_SERVE') {
            const t = setTimeout(() => dispatch({ type: 'INIT_SERVE' }), 200);
            return () => clearTimeout(t);
        }
    }, [state.matchPhase]);

    // Action wrappers for clearer UI code
    const actions = {
        selectPlayer: (player) => dispatch({ type: 'SELECT_PLAYER', payload: player }),

        // [UPDATED] selectZone now triggers SELECT_LANDING_POINT
        // coordinateOrZone can be a number (1-6) OR an object {x, y}
        selectZone: (coordinateOrZone, opponentTeam) =>
            dispatch({ type: 'SELECT_LANDING_POINT', payload: { point: coordinateOrZone, opponentTeam } }),

        handleChallenge: (team, result) => dispatch({ type: 'CHALLENGE_RESULT', payload: { team, success: result.success } }),
        handleReferee: (winner, reason) => dispatch({ type: 'REFEREE_DECISION', payload: { winner, reason } }),
        requestSub: (team) => dispatch({ type: 'REQUEST_SUB', payload: team }),
        requestLiberoSwap: (team) => dispatch({ type: 'REQUEST_LIBERO_SWAP', payload: team }),
        requestTimeout: (team) => dispatch({ type: 'REQUEST_TIMEOUT', payload: team }),
        undo: () => dispatch({ type: 'UNDO_STEP' }),
        cancel: () => dispatch({ type: 'CANCEL_ACTION' }),

        // Rally Specifics
        setServeType: (t) => dispatch({ type: 'SET_SERVE_TYPE', payload: t }),
        setServeResult: (r) => dispatch({ type: 'SET_SERVE_RESULT', payload: r }),
        setReception: (q, p) => dispatch({ type: 'RECEPTION_GRADE', payload: { quality: q, player: p } }),
        setSetType: (t) => dispatch({ type: 'EXECUTE_SET', payload: { type: t } }),
        setAttackType: (t) => dispatch({ type: 'EXECUTE_ATTACK', payload: { type: t } }),
        setAttackResult: (r) => dispatch({ type: 'ATTACK_RESULT', payload: { result: r } }),
        toggleBlocker: (p) => dispatch({ type: 'TOGGLE_BLOCKER', payload: p }),
        confirmBlock: () => dispatch({ type: 'CONFIRM_BLOCK' }),
        blockOutcome: (o) => dispatch({ type: 'BLOCK_OUTCOME', payload: o }),
        blockDetected: () => dispatch({ type: 'BLOCK_DETECTED' }),
    };

    return { state, actions, setupData };
};