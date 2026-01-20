import { RefreshCw, Users } from 'lucide-react';
import { THEME_MAP } from '../../utils/constants';
import { ChallengeButton, TimeoutButton } from '../common/ActionButtons';
import { PlayerTag } from '../common/PlayerTag';

const LiberoSection = ({ team, liberos, theme, rotation, onRequestSwap, onPlayerClick, selectedPlayerId, isLocked }) => (
    <div className="flex flex-col w-full px-2 gap-2 mt-2 flex-shrink-0">
        <span className="text-[9px] xl:text-xs font-black tracking-widest bg-slate-100 w-full text-center py-1 rounded text-slate-400 uppercase truncate">
            LIBEROS
        </span>
        <div className="flex gap-2 w-full">
            <button
                onClick={() => onRequestSwap(team)}
                disabled={isLocked}
                className={`flex-1 border-2 font-black text-[9px] xl:text-[10px] py-1.5 rounded bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 ${theme.courtLines} ${theme.tint} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <RefreshCw size={12} className="mb-0.5" />
                <span className="hidden md:inline">SWAP</span>
            </button>
        </div>
        <div className="flex flex-col gap-1.5 w-full">
            {liberos.map(lib => {
                const isOnCourt = rotation.find(r => r && r.id === lib.id);
                const isItemDisabled = isLocked && selectedPlayerId !== lib.id;

                if (isOnCourt) {
                    return (
                        <div key={lib.id} className="w-full h-10 xl:h-12 border-2 border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-[8px] xl:text-[9px] text-slate-400 font-bold tracking-widest select-none">
                            ON COURT
                        </div>
                    );
                }

                return (
                    <div
                        key={lib.id}
                        className={`w-full ${isItemDisabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}`}
                        onClick={() => !isItemDisabled && onPlayerClick(lib)}
                    >
                        <PlayerTag
                            player={lib}
                            isLibero={true}
                            theme={theme}
                            isSelected={selectedPlayerId === lib.id}
                        />
                    </div>
                );
            })}
        </div>
    </div>
);

export default function BenchSidebar({ team, data, gameState, actions, onTimeout, onChallenge, className = "" }) {
    const isHome = team === 'home';
    const theme = THEME_MAP[data.theme] || THEME_MAP.orange;
    const bench = gameState.benches[team];
    const rotation = gameState.rotations[team];
    const subsUsed = gameState.subsUsed[team];
    const timeoutsUsed = gameState.timeoutsUsed[team];
    const challengesUsed = gameState.challengesUsed[team];
    const selectedPlayerId = gameState.selectedPlayer?.id;
    const matchPhase = gameState.matchPhase;

    const borderClass = isHome ? "border-r-4" : "border-l-4";
    const isSelectionLocked = ['SUBSTITUTION', 'LIBERO_SWAP'].includes(matchPhase) && selectedPlayerId;
    const canSub = !['RALLY', 'ATTACK', 'SET', 'RECEPTION'].includes(matchPhase);

    return (
        <div className={`flex flex-col w-32 lg:w-40 xl:w-80 bg-white ${borderClass} border-slate-300 py-2 gap-2 shadow-xl flex-shrink-0 h-full ${className}`}>

            <LiberoSection
                team={team}
                liberos={data.liberos}
                theme={theme}
                rotation={rotation}
                onRequestSwap={actions.requestLiberoSwap}
                onPlayerClick={actions.selectPlayer}
                selectedPlayerId={selectedPlayerId}
                isLocked={isSelectionLocked}
            />

            <div className="w-full border-t border-slate-100 my-1"></div>

            <div className="px-2 flex-shrink-0">
                <button
                    onClick={() => actions.requestSub(team)}
                    disabled={!canSub}
                    className={`w-full border-2 font-black text-[9px] xl:text-xs py-2 rounded disabled:opacity-50 flex items-center justify-center gap-1 xl:gap-2 transition-all hover:brightness-95 ${theme.softBg} ${theme.courtLines} ${theme.tint}`}
                >
                    <Users size={14} className="flex-shrink-0" />
                    <div className="flex flex-col items-start leading-none">
                        <span>SUB REQUEST</span>
                        <span className="text-[9px] opacity-70 font-bold whitespace-nowrap">
                            USED: {subsUsed}/6
                        </span>
                    </div>
                </button>
            </div>

            <div className="flex-1 flex flex-col w-full px-2 overflow-y-auto gap-1.5 scrollbar-hide mt-1">
                <span className="text-[10px] xl:text-xs font-black tracking-widest bg-slate-100 w-full text-center py-1 rounded text-slate-400 uppercase flex-shrink-0">
                    BENCH
                </span>

                {bench.map(p => {
                    const isOnCourt = rotation.some(r => r && r.id === p.id);
                    if (isOnCourt) return null;
                    const isDisabled = isSelectionLocked && selectedPlayerId !== p.id;

                    return (
                        <div
                            key={p.id}
                            // [FIX] Ensuring this is clickable
                            className={isDisabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer hover:brightness-95 transition-all'}
                            onClick={() => !isDisabled && actions.selectPlayer(p)}
                        >
                            <PlayerTag
                                player={p}
                                theme={theme}
                                isSelected={selectedPlayerId === p.id}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="px-2 pb-1 mt-auto flex flex-col gap-1.5 flex-shrink-0">
                <div className="w-full">
                    <TimeoutButton
                        onClick={onTimeout}
                        used={timeoutsUsed}
                        limit={2}
                        disabled={!['PRE_SERVE', 'SERVE'].includes(gameState.matchPhase)}
                        theme={theme}
                    />
                </div>
                <div className="w-full">
                    <ChallengeButton
                        onClick={onChallenge}
                        used={challengesUsed}
                        limit={2}
                        theme={theme}
                    />
                </div>
            </div>
        </div>
    );
}