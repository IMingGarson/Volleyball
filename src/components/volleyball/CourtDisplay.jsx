import { useMatchStore } from '../../store/matchStore';
import { THEME_MAP } from '../../utils/constants';
import CourtZone from './CourtZone';

export default function CourtDisplay({ side, rotation, matchPhase, possession, selectedPlayer, rallyData, actionTeam, onZoneClick, onPlayerClick }) {
    // 1. Access store for dynamic data
    const { setupData } = useMatchStore();

    const isLeft = side === 'left';
    const teamName = isLeft ? 'home' : 'away';

    // 2. Resolve Dynamic Theme
    const teamConfig = setupData[teamName];
    const themeKey = teamConfig?.theme || (isLeft ? 'orange' : 'red');
    const theme = THEME_MAP[themeKey] || THEME_MAP.orange;

    let isClickable = false;
    let highlight = false;
    let isLocked = false;

    if (matchPhase === 'SERVE') isLocked = true;
    else if (['RECEPTION', 'SET', 'ATTACK', 'COVER'].includes(matchPhase)) { if (possession === teamName) isClickable = true; }
    else if ((matchPhase === 'LANDING' || matchPhase === 'SERVE_LANDING' || matchPhase === 'DIG_DECISION') && possession !== teamName) { isClickable = true; highlight = true; }
    else if (matchPhase === 'LIBERO_SWAP' && actionTeam === teamName && selectedPlayer) { /* Logic inside loop */ }
    else if (matchPhase === 'SUBSTITUTION' && actionTeam === teamName && selectedPlayer) isClickable = true;
    else if (matchPhase === 'SELECT_BLOCKERS') { const defTeam = possession === 'home' ? 'away' : 'home'; if (teamName === defTeam) isClickable = true; }

    const getP = (z) => rotation[{ 1: 0, 6: 1, 5: 2, 4: 3, 3: 4, 2: 5 }[z]];

    const CardRow = ({ zones }) => (
        <div className="flex flex-col h-full gap-0.5">
            {zones.map(z => {
                const p = getP(z);
                let zoneDisabled = !isClickable && !highlight && selectedPlayer?.id !== p?.id;

                if (matchPhase === 'LIBERO_SWAP' && actionTeam === teamName && selectedPlayer) {
                    const allowedZones = [1, 5, 6];
                    if (allowedZones.includes(z)) { zoneDisabled = false; if (!zoneDisabled) highlight = true; } else { zoneDisabled = true; }
                }

                if (matchPhase === 'SELECT_BLOCKERS') { const defTeam = possession === 'home' ? 'away' : 'home'; if (teamName === defTeam) zoneDisabled = false; }
                if (matchPhase === 'COVER') { if (possession === teamName) zoneDisabled = false; else zoneDisabled = true; }
                if (isLocked) zoneDisabled = false;

                const isBlocker = p ? rallyData.blockers.some(b => b.id === p.id) : false;

                return (
                    <div key={z} className="flex-1">
                        <CourtZone
                            player={p}
                            zoneNumber={z}
                            theme={theme} // <--- Pass full theme object
                            isSelected={selectedPlayer?.id === p?.id}
                            onClick={(matchPhase === 'LANDING' || matchPhase === 'SERVE_LANDING' || matchPhase === 'DIG_DECISION') ? () => onZoneClick(z, side) : onPlayerClick}
                            isLibero={p?.isLibero}
                            isBlocker={isBlocker}
                            highlight={highlight}
                            disabled={zoneDisabled && !isLocked}
                            locked={isLocked}
                        />
                    </div>
                );
            })}
        </div>
    );

    // Styled divider line using theme colors
    const dividerClass = `w-1 h-full relative z-10 opacity-20 ${theme.bgTint}`;

    return isLeft
        ? (<div className="flex w-full h-full"><div className="flex-[2] h-full"><CardRow zones={[5, 6, 1]} /></div><div className={dividerClass}></div><div className="flex-1 pl-4 h-full"><CardRow zones={[4, 3, 2]} /></div></div>)
        : (<div className="flex w-full h-full"><div className="flex-1 pr-4 h-full"><CardRow zones={[2, 3, 4]} /></div><div className={dividerClass}></div><div className="flex-[2] h-full"><CardRow zones={[1, 6, 5]} /></div></div>);
}