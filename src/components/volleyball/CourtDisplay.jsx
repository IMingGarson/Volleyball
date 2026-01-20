import { useMatchStore } from '../../store/matchStore';
import { THEME_MAP } from '../../utils/constants';
import { CourtZone } from './CourtZone';
import PrecisionGridOverlay from './PrecisionGridOverlay';

/**
 * 1. PersistentLandingPoint
 * Visual marker for where the ball landed previously.
 * Completely strictly decorative (pointer-events-none).
 */
const PersistentLandingPoint = ({ point, theme, isLeft }) => {
    if (!point || point.x === undefined || point.y === undefined) return null;

    const xNum = parseFloat(point.x);
    const yNum = parseFloat(point.y);

    // Boundary Check: 0-9 is Left, 9-18 is Right
    const belongsToSide = isLeft ? (xNum <= 9) : (xNum > 9);
    if (!belongsToSide) return null;

    // Normalize X to 0-9 relative to the specific court side
    const localX = isLeft ? xNum : (xNum - 9);

    // Convert to CSS Percentages
    const leftPct = (localX / 9.0) * 100;
    const bottomPct = (yNum / 9.0) * 100;

    return (
        <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
        >
            {/* Pulsing Ring */}
            <div
                className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-[3px] animate-ping opacity-40"
                style={{ borderColor: theme.hex }}
            />
            {/* Core Dot */}
            <div
                className="relative w-4 h-4 rounded-full shadow-md border-2 border-white"
                style={{ backgroundColor: theme.hex }}
            />
            {/* Dashed Target Ring */}
            <div
                className="absolute w-8 h-8 -ml-2 -mt-2 rounded-full border border-dashed animate-spin-slow opacity-60"
                style={{ borderColor: theme.hex }}
            />
        </div>
    );
};

/**
 * 3. Main Court Display
 */
export default function CourtDisplay({ side, rotation, matchPhase, possession, selectedPlayer, rallyData, actionTeam, onZoneClick, onPlayerClick }) {
    const { setupData } = useMatchStore();

    const isLeft = side === 'left';
    const currentSideTeamKey = isLeft ? 'home' : 'away';

    const teamConfig = setupData[currentSideTeamKey];
    const themeKey = teamConfig?.theme || (isLeft ? 'orange' : 'red');
    const theme = THEME_MAP[themeKey] || THEME_MAP.orange;

    // --- PHASE LOGIC ---
    const isLandingPhase = ['LANDING', 'SERVE_LANDING', 'DIG_DECISION'].includes(matchPhase);

    // Show grid if we are selecting a point on THIS side
    // (If possession is Away, we are attacking Home, so Home side shows grid)
    const showPrecisionGrid = isLandingPhase && (possession !== currentSideTeamKey);

    // --- INTERACTION LOGIC ---
    let isZoneClickable = false;
    let isZoneHighlight = false;
    let isLocked = false;

    if (showPrecisionGrid) {
        isZoneClickable = false; // Disable player clicks when placing ball
        isLocked = true;
    } else {
        // Normal Gameplay Logic
        if (matchPhase === 'SERVE') isLocked = true; // Can't move players during serve
        else if (['RECEPTION', 'SET', 'ATTACK', 'COVER'].includes(matchPhase)) {
            // Can select active team's players
            if (possession === currentSideTeamKey) isZoneClickable = true;
        } else if (matchPhase === 'SUBSTITUTION' && actionTeam === currentSideTeamKey && selectedPlayer) {
            isZoneClickable = true; // Select player to sub out
        } else if (matchPhase === 'SELECT_BLOCKERS') {
            // Select defending team's players
            const defTeam = possession === 'home' ? 'away' : 'home';
            if (currentSideTeamKey === defTeam) isZoneClickable = true;
        }
    }

    const getP = (z) => rotation[{ 1: 0, 6: 1, 5: 2, 4: 3, 3: 4, 2: 5 }[z]];

    // Render a row of 3 zones (Front or Back)
    const CardRow = ({ zones }) => (
        <div className="flex flex-col h-full gap-1">
            {zones.map(z => {
                const p = getP(z);
                let zoneDisabled = !isZoneClickable && !isZoneHighlight && selectedPlayer?.id !== p?.id;

                // Special Phase Overrides
                if (matchPhase === 'LIBERO_SWAP' && actionTeam === currentSideTeamKey && selectedPlayer) {
                    // Only Back Row (1, 5, 6) allowed for Libero swap
                    if ([1, 5, 6].includes(z)) { zoneDisabled = false; isZoneHighlight = true; }
                    else { zoneDisabled = true; }
                }
                if (matchPhase === 'SELECT_BLOCKERS') {
                    const defTeam = possession === 'home' ? 'away' : 'home';
                    if (currentSideTeamKey === defTeam) zoneDisabled = false;
                }
                if (matchPhase === 'COVER') {
                    // Only attackers cover
                    if (possession === currentSideTeamKey) zoneDisabled = false;
                    else zoneDisabled = true;
                }

                // If Grid is active, player clicks are strictly disabled
                if (showPrecisionGrid) zoneDisabled = true;

                const isBlocker = p ? rallyData.blockers.some(b => b.id === p.id) : false;

                return (
                    <div key={z} className="flex-1 min-h-0">
                        <CourtZone
                            player={p}
                            zoneNumber={z}
                            theme={theme}
                            isSelected={selectedPlayer?.id === p?.id}
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

    const dividerClass = `w-1.5 h-full relative z-10 opacity-30 ${theme.bgTint}`;

    return (
        <div className="relative w-full h-full isolate bg-white">

            {/* LAYER 0: PLAYERS (Bottom) */}
            <div className="absolute inset-0 z-0 flex pointer-events-auto">
                {isLeft ? (
                    // Left Court: Back Row (Left) | Front Row (Right)
                    <>
                        <div className="flex-[2] h-full py-1 pl-1"><CardRow zones={[5, 6, 1]} /></div>
                        <div className={dividerClass}></div>
                        <div className="flex-1 h-full py-1 pr-1"><CardRow zones={[4, 3, 2]} /></div>
                    </>
                ) : (
                    // Right Court: Front Row (Left) | Back Row (Right)
                    <>
                        <div className="flex-1 h-full py-1 pl-1"><CardRow zones={[2, 3, 4]} /></div>
                        <div className={dividerClass}></div>
                        <div className="flex-[2] h-full py-1 pr-1"><CardRow zones={[1, 6, 5]} /></div>
                    </>
                )}
            </div>

            {/* LAYER 1: SAVED MARKER (Middle) */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <PersistentLandingPoint
                    point={rallyData.landingPoint}
                    theme={theme}
                    isLeft={isLeft}
                />
            </div>

            {/* LAYER 2: INTERACTIVE GRID (Top) */}
            <div className={`absolute inset-0 z-30 transition-opacity duration-200 ${showPrecisionGrid ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
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