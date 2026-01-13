// src/reducers/fivbRefereeReducer.js

export const REF_ACTIONS = {
    MAKE_CALL: 'MAKE_CALL',
    CONFIRM_DECISION: 'CONFIRM_DECISION',
    RESET: 'RESET',
    CANCEL: 'CANCEL' // Added this for UI "Back" functionality
};

export const FAULTS = {
    TOUCH_NET: { code: 'TOUCH_NET', name: 'NET TOUCH', icon: 'Hand' },
    ANTENNA: { code: 'ANTENNA', name: 'ANTENNA', icon: 'Signal' },
    FOOT_FAULT: { code: 'FOOT_FAULT', name: 'FOOT FAULT', icon: 'Footprints' },
    DOUBLE: { code: 'DOUBLE', name: 'DOUBLE', icon: 'Users' },
    CATCH: { code: 'CATCH', name: 'LIFT / CATCH', icon: 'Hand' },
    FOUR_HITS: { code: 'FOUR_HITS', name: '4 HITS', icon: 'Hash' },
    SCREENING: { code: 'SCREENING', name: 'SCREEN', icon: 'UserX' },
    ROTATION: { code: 'ROTATION', name: 'ROTATION', icon: 'RefreshCcw' },
    SERVICE_DELAY: { code: 'SERVICE_DELAY', name: 'DELAY (8s)', icon: 'Timer' },
    // --- ADDED REPLAY ---
    REPLAY: { code: 'REPLAY', name: 'REPLAY POINT', icon: 'RefreshCcw' }
};

export const CHALLENGE_CATEGORIES = [
    { id: 'TOUCH_NET', label: 'Touch Net' },
    { id: 'FOOT_FAULT', label: 'Foot Fault' },
    { id: 'OVER_NET', label: 'Over Net' },
    { id: 'IN_OUT', label: 'In / Out' },
    { id: 'BLOCK_TOUCH', label: 'Block Touch Ball' }
];

export const initialRefereeState = {
    status: 'IDLE',      // IDLE | CONFIRMATION
    currentCall: null,   // { fault, faultingTeam }
    finalDecision: null, // { winner, reason }
};

export function refereeReducer(state, action) {
    switch (action.type) {
        case REF_ACTIONS.MAKE_CALL: {
            const { faultCode, faultingTeam } = action.payload;
            const fault = FAULTS[faultCode];

            // --- REPLAY LOGIC ---
            if (faultCode === 'REPLAY') {
                return {
                    ...state,
                    status: 'CONFIRMATION',
                    currentCall: {
                        fault,
                        faultingTeam: 'NO ONE'
                    },
                    finalDecision: {
                        winner: null, // No point awarded
                        reason: 'Replay'
                    }
                };
            }

            // --- STANDARD FAULT LOGIC ---
            // If Team A faults, Team B wins (and vice versa)
            const provisionalWinner = faultingTeam === 'A' ? 'B' : 'A';

            return {
                ...state,
                status: 'CONFIRMATION',
                currentCall: { fault, faultingTeam },
                finalDecision: {
                    winner: provisionalWinner,
                    reason: `${fault.name} (${faultingTeam})`
                }
            };
        }

        case REF_ACTIONS.CONFIRM_DECISION:
        case REF_ACTIONS.RESET:
        case REF_ACTIONS.CANCEL:
            return initialRefereeState;

        default:
            return state;
    }
}