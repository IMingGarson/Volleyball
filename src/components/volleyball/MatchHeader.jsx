import { useMatchStore } from '../../store/matchStore';
import { THEME_MAP } from '../../utils/constants';

export default function MatchHeader({ score }) {
    const { setupData, setNumber, matchRules } = useMatchStore();

    const homeTheme = THEME_MAP[setupData.home.theme] || THEME_MAP.orange;
    const awayTheme = THEME_MAP[setupData.away.theme] || THEME_MAP.red;

    const isTiebreak = setNumber === matchRules.bestOf;
    const setLabel = isTiebreak ? "TIEBREAK" : `SET ${setNumber}`;

    return (
        <header className="relative flex shrink-0 z-50 h-12 md:h-14 w-full font-sans overflow-hidden shadow-md bg-slate-900">

            {/* --- Backgrounds (Clean 50/50 Split - No Gradients) --- */}
            {/* Home Side */}
            <div
                className="absolute inset-y-0 left-0 w-1/2 transition-colors duration-500"
                style={{ backgroundColor: homeTheme.hex }}
            >
                {/* Optional: Simple dark overlay for text contrast if needed, purely flat */}
                <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Away Side */}
            <div
                className="absolute inset-y-0 right-0 w-1/2 transition-colors duration-500"
                style={{ backgroundColor: awayTheme.hex }}
            >
                {/* Optional: Simple dark overlay for text contrast if needed, purely flat */}
                <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Center Divider Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -ml-[1px] bg-white/20 z-0"></div>


            {/* --- Content Layer --- */}
            <div className="relative z-10 w-full h-full flex items-center justify-between px-3 md:px-6">

                {/* LEFT: HOME TEAM */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Score */}
                    <div className="text-3xl md:text-4xl font-black text-white font-mono leading-none drop-shadow-sm">
                        {score.home}
                    </div>
                    {/* Name */}
                    <div className="flex flex-col justify-center min-w-0">
                        <span className="text-sm md:text-lg font-black text-white uppercase tracking-tight truncate drop-shadow-sm opacity-95">
                            {setupData.home.name}
                        </span>
                    </div>
                </div>


                {/* CENTER: SET INDICATOR */}
                <div className="flex-shrink-0 mx-2">
                    <div className="bg-black/60 backdrop-blur-sm px-3 py-0.5 rounded-full border border-white/10 shadow-sm">
                        <span className={`text-[10px] md:text-xs font-bold tracking-widest ${isTiebreak ? 'text-amber-400' : 'text-slate-200'}`}>
                            {setLabel}
                        </span>
                    </div>
                </div>


                {/* RIGHT: AWAY TEAM */}
                <div className="flex items-center justify-end gap-3 flex-1 min-w-0 text-right">
                    {/* Name */}
                    <div className="flex flex-col justify-center min-w-0">
                        <span className="text-sm md:text-lg font-black text-white uppercase tracking-tight truncate drop-shadow-sm opacity-95">
                            {setupData.away.name}
                        </span>
                    </div>
                    {/* Score */}
                    <div className="text-3xl md:text-4xl font-black text-white font-mono leading-none drop-shadow-sm">
                        {score.away}
                    </div>
                </div>

            </div>
        </header>
    );
}