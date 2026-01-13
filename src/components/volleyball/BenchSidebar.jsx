import { RefreshCw, Users } from 'lucide-react';
import { THEME_MAP } from '../../utils/constants';
import { BenchCard, ChallengeButton, TimeoutButton } from '../common/ActionButtons';
import { PlayerTag } from '../common/PlayerTag';

// Helper component for Libero Section
const LiberoSection = ({ team, liberos, theme, rotation, onRequestSwap, onPlayerClick, selectedPlayerId }) => (
    <div className="flex flex-col items-center w-full px-2 gap-2 mt-2">
        <span className="text-xs font-black tracking-widest bg-slate-100 w-full text-center py-1 rounded text-slate-400 uppercase">LIBEROS</span>
        <div className="flex gap-2 w-full">
            <button
                onClick={() => onRequestSwap(team)}
                className={`flex-1 border-2 font-black text-[10px] py-1.5 rounded bg-white hover:bg-slate-50 transition-colors ${theme.courtLines} ${theme.tint}`}
            >
                <RefreshCw size={14} className="mx-auto mb-0.5" /> SWAP
            </button>
        </div>
        <div className="flex flex-col gap-1 w-full">
            {liberos.map(lib => {
                const isOnCourt = rotation.find(r => r && r.id === lib.id);
                return isOnCourt
                    ? (<div key={lib.id} className="w-full h-12 border-2 border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-[9px] text-slate-400 font-bold tracking-widest select-none">ON COURT</div>)
                    : (
                        <div key={lib.id} className="w-full" onClick={() => onPlayerClick(lib)}>
                            <PlayerTag
                                player={lib}
                                isLibero={true}
                                theme={theme}
                                isSelected={selectedPlayerId === lib.id}
                            />
                        </div>
                    )
            })}
        </div>
    </div>
);

export default function BenchSidebar({ team, data, gameState, actions, onTimeout, onChallenge }) {
    const isHome = team === 'home';
    const theme = THEME_MAP[data.theme] || THEME_MAP.orange;
    const bench = gameState.benches[team];
    const rotation = gameState.rotations[team];
    const subsUsed = gameState.subsUsed[team];
    const timeoutsUsed = gameState.timeoutsUsed[team];
    const challengesUsed = gameState.challengesUsed[team];
    const selectedPlayerId = gameState.selectedPlayer?.id;

    const borderClass = isHome ? "border-r" : "border-l";

    return (
        <div className={`hidden md:flex flex-col w-32 xl:w-64 bg-white ${borderClass} border-slate-300 py-2 gap-2 z-20 shadow-xl flex-shrink-0`}>
            <LiberoSection
                team={team}
                liberos={data.liberos}
                theme={theme}
                rotation={rotation}
                onRequestSwap={actions.requestLiberoSwap}
                onPlayerClick={actions.selectPlayer}
                selectedPlayerId={selectedPlayerId}
            />

            <div className="w-full border-t border-slate-100 my-1"></div>

            <div className="px-2">
                <button
                    onClick={() => actions.requestSub(team)}
                    disabled={['RALLY', 'ATTACK', 'SET', 'RECEPTION'].includes(gameState.matchPhase)}
                    className={`w-full border-2 font-black text-[10px] xl:text-xs py-2 rounded disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:brightness-95 ${theme.softBg} ${theme.courtLines} ${theme.tint}`}
                >
                    <Users size={14} /> SUB REQUEST ({subsUsed}/6)
                </button>
            </div>

            <div className="flex-1 flex flex-col w-full px-2 overflow-y-auto gap-2">
                <span className="text-xs font-black tracking-widest bg-slate-100 w-full text-center py-1 rounded text-slate-400 uppercase mt-2">BENCH</span>
                {bench.map(p => (
                    <BenchCard
                        key={p.id}
                        player={p}
                        theme={theme}
                        onClick={actions.selectPlayer}
                        isSelected={selectedPlayerId === p.id}
                    />
                ))}
            </div>

            <div className="px-2 pb-2 mt-auto flex flex-col gap-2">
                <div className="flex gap-2">
                    <TimeoutButton
                        onClick={onTimeout}
                        used={timeoutsUsed}
                        limit={2}
                        disabled={!['PRE_SERVE', 'SERVE'].includes(gameState.matchPhase)}
                        theme={theme} // <--- Pass Theme
                    />
                </div>
                <ChallengeButton
                    onClick={onChallenge}
                    used={challengesUsed}
                    limit={2}
                    theme={theme} // <--- Pass Theme
                />
            </div>
        </div>
    );
}