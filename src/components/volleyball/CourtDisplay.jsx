import { useMatchStore } from '../../store/matchStore';
import { THEME_MAP } from '../../utils/constants';
import CourtZone from './CourtZone';
import PrecisionGridOverlay from './PrecisionGridOverlay';

/**
 * Visual Marker Component
 * Renders the saved landing point on top of the court.
 * STRICTLY POINTER-EVENTS-NONE so clicks pass through to players underneath.
 */
const PersistentLandingPoint = ({ point, theme, isLeft }) => {
    if (!point || point.x === undefined || point.y === undefined) return null;

    const xNum = parseFloat(point.x);
    const yNum = parseFloat(point.y);

    // Boundary Check
    const belongsToSide = isLeft ? (xNum <= 9) : (xNum > 9);
    if (!belongsToSide) return null;

    // Normalize
    const localX = isLeft ? xNum : (xNum - 9);

    // Percentages
    const leftPct = (localX / 9.0) * 100;
    const bottomPct = (yNum / 9.0) * 100;

    return (
        <div
            className="absolute z-20 pointer-events-none"
            style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
        >
            {/* Visual matches the Overlay selection state */}
            <div
                className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 animate-ping opacity-60"
                style={{ borderColor: theme.hex }}
            />
            <div
                className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full shadow-lg border-2 border-white"
                style={{ backgroundColor: theme.hex }}
            />
            <div
                className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border border-dashed animate-spin-slow opacity-80"
                style={{ borderColor: theme.hex }}
            />
        </div>
    );
};

export default function CourtDisplay({ side, rotation, matchPhase, possession, selectedPlayer, rallyData, actionTeam, onZoneClick, onPlayerClick }) {
    const { setupData } = useMatchStore();

    const isLeft = side === 'left';
    const currentSideTeamKey = isLeft ? 'home' : 'away';

    const teamConfig = setupData[currentSideTeamKey];
    const themeKey = teamConfig?.theme || (isLeft ? 'orange' : 'red');
    const theme = THEME_MAP[themeKey] || THEME_MAP.orange;

    // --- PHASE LOGIC ---
    const isLandingPhase = ['LANDING', 'SERVE_LANDING', 'DIG_DECISION'].includes(matchPhase);
    const isTargetSide = possession !== currentSideTeamKey;
    const showPrecisionGrid = isLandingPhase && isTargetSide;

    // --- INTERACTION LOGIC ---
    let isZoneClickable = false;
    let isZoneHighlight = false;
    let isLocked = false;

    if (showPrecisionGrid) {
        // When grid is active, we disable the player zones visually
        isZoneClickable = false;
        isLocked = true;
    } else {
        if (matchPhase === 'SERVE') isLocked = true;
        else if (['RECEPTION', 'SET', 'ATTACK', 'COVER'].includes(matchPhase)) {
            if (possession === currentSideTeamKey) isZoneClickable = true;
        } else if (matchPhase === 'SUBSTITUTION' && actionTeam === currentSideTeamKey && selectedPlayer) {
            isZoneClickable = true;
        } else if (matchPhase === 'SELECT_BLOCKERS') {
            const defTeam = possession === 'home' ? 'away' : 'home';
            if (currentSideTeamKey === defTeam) isZoneClickable = true;
        }
    }

    const getP = (z) => rotation[{ 1: 0, 6: 1, 5: 2, 4: 3, 3: 4, 2: 5 }[z]];

    const CardRow = ({ zones }) => (
        <div className="flex flex-col h-full gap-0.5">
            {zones.map(z => {
                const p = getP(z);
                let zoneDisabled = !isZoneClickable && !isZoneHighlight && selectedPlayer?.id !== p?.id;

                if (matchPhase === 'LIBERO_SWAP' && actionTeam === currentSideTeamKey && selectedPlayer) {
                    const allowedZones = [1, 5, 6];
                    if (allowedZones.includes(z)) { zoneDisabled = false; isZoneHighlight = true; } else { zoneDisabled = true; }
                }
                if (matchPhase === 'SELECT_BLOCKERS') {
                    const defTeam = possession === 'home' ? 'away' : 'home';
                    if (currentSideTeamKey === defTeam) zoneDisabled = false;
                }
                if (matchPhase === 'COVER') {
                    if (possession === currentSideTeamKey) zoneDisabled = false; else zoneDisabled = true;
                }

                // If Grid is active, force disable clicks on players
                if (showPrecisionGrid) zoneDisabled = true;

                const isBlocker = p ? rallyData.blockers.some(b => b.id === p.id) : false;

                return (
                    <div key={z} className="flex-1">
                        <CourtZone
                            player={p}
                            zoneNumber={z}
                            theme={theme}
                            isSelected={selectedPlayer?.id === p?.id}
                            // Only pass click handler if grid is NOT active
                            onClick={!showPrecisionGrid ? onPlayerClick : undefined}
                            isLibero={p?.isLibero}
                            isBlocker={isBlocker}
                            highlight={isZoneHighlight && !showPrecisionGrid}
                            disabled={zoneDisabled && !isLocked}
                            locked={isLocked && !showPrecisionGrid}
                        />
                    </div>
                );
            })}
        </div>
    );

    const dividerClass = `w-1 h-full relative z-10 opacity-20 ${theme.bgTint}`;

    return (
        <div className="relative w-full h-full isolate">

            {/* LAYER 0: PLAYERS (Bottom) */}
            {/* z-0 ensures players are at base level. pointer-events-auto allows clicks. */}
            <div className="absolute inset-0 z-0 flex pointer-events-auto">
                {isLeft ? (
                    <>
                        <div className="flex-[2] h-full"><CardRow zones={[5, 6, 1]} /></div>
                        <div className={dividerClass}></div>
                        <div className="flex-1 pl-4 h-full"><CardRow zones={[4, 3, 2]} /></div>
                    </>
                ) : (
                    <>
                        <div className="flex-1 pr-4 h-full"><CardRow zones={[2, 3, 4]} /></div>
                        <div className={dividerClass}></div>
                        <div className="flex-[2] h-full"><CardRow zones={[1, 6, 5]} /></div>
                    </>
                )}
            </div>

            {/* LAYER 1: SAVED MARKER (Middle) */}
            {/* z-20 puts it above players. pointer-events-none ensures it doesn't block player clicks. */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <PersistentLandingPoint
                    point={rallyData.landingPoint}
                    theme={theme}
                    isLeft={isLeft}
                />
            </div>

            {/* LAYER 2: INTERACTIVE GRID (Top) */}
            {/* z-30 puts it on top. 
                CRITICAL FIX: pointer-events-auto ONLY when active. 
                Otherwise pointer-events-none so we can click the players underneath. */}
            <div className={`absolute inset-0 z-30 ${showPrecisionGrid ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <PrecisionGridOverlay
                    active={showPrecisionGrid}
                    theme={theme}
                    xOffset={isLeft ? 0 : 9}
                    onPointSelect={(coords) => onZoneClick(coords, side)}
                />
            </div>

        </div>
    );
}