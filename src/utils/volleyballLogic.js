// src/utils/volleyballLogic.js

export const createSnapshot = (state) => ({
    ...state,
    score: { ...state.score },
    rotations: { home: [...state.rotations.home], away: [...state.rotations.away] },
    benches: { home: [...state.benches.home], away: [...state.benches.away] },
    liberoOriginals: { home: { ...state.liberoOriginals.home }, away: { ...state.liberoOriginals.away } },
    subsUsed: { ...state.subsUsed },
    timeoutsUsed: { ...state.timeoutsUsed },
    challengesUsed: { ...state.challengesUsed }
});

export const processRotation = (teamRotation, teamOriginals) => {
    let newRotation = [...teamRotation];
    let newOriginals = { ...teamOriginals };
    let autoSwapLog = null;
    let returningPlayer = null;

    // 1. ROTATE [P1, P6, P5, P4, P3, P2] -> [P2, P1, P6, P5, P4, P3]
    const mover = newRotation.pop();
    newRotation.unshift(mover);

    // 2. CHECK FRONT-LEFT (Zone 4, Index 3) for Libero Auto-Exit
    const playerAtPos4 = newRotation[3];

    if (playerAtPos4 && playerAtPos4.isLibero) {
        const originalPlayer = newOriginals[playerAtPos4.id];

        if (originalPlayer) {
            newRotation[3] = originalPlayer;
            delete newOriginals[playerAtPos4.id];
            returningPlayer = originalPlayer; // Track who returns to bench list
            autoSwapLog = {
                type: 'correction',
                text: `LIBERO ROTATION: ${playerAtPos4.name} (L) auto-swapped for ${originalPlayer.name}`
            };
        } else {
            autoSwapLog = { type: 'danger', text: `LIBERO ERROR: Original player not found for ${playerAtPos4.name}` };
        }
    }

    return { newRotation, newOriginals, autoSwapLog, returningPlayer };
};