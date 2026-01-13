// src/components/volleyball/CourtZone.jsx
import { PlayerTag } from '../common/PlayerTag';

const CourtZone = ({ player, zoneNumber, isSelected, onClick, teamColor, isLibero, highlight, disabled, locked, isBlocker }) => {
    let containerClass = "cursor-pointer bg-slate-50/50 hover:bg-slate-100/80";
    if (disabled) containerClass = "opacity-30 cursor-not-allowed bg-slate-200";
    else if (locked) containerClass = "cursor-default bg-slate-50/50";

    return (
        <div onClick={() => !disabled && !locked && onClick(player)} className={`w-full h-full border border-slate-200 flex flex-col items-center justify-center py-1 transition-colors gap-1 group relative ${containerClass} ${highlight ? 'bg-green-50 ring-4 ring-inset ring-green-400/50 opacity-100' : ''} ${isBlocker ? 'bg-purple-50 ring-4 ring-inset ring-purple-400/50 opacity-100' : ''}`}>
            <span className="absolute top-1 left-2 text-4xl md:text-6xl font-black text-slate-300 select-none z-0">{zoneNumber}</span>
            {highlight && <div className="absolute top-1 right-1 text-[9px] font-bold text-green-700 bg-green-200 px-1 rounded z-30 animate-pulse">SWAP</div>}
            <div className="flex-grow flex items-center justify-center z-10 w-36 md:w-40 lg:w-44">
                {player && <PlayerTag player={player} isSelected={isSelected} teamColor={teamColor} isLibero={isLibero} isBlocker={isBlocker} />}
            </div>
        </div>
    );
};
export default CourtZone;