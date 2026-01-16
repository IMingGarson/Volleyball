import { useMatchStore } from '../../store/matchStore';
import { THEME_MAP } from '../../utils/constants';

export default function MatchHeader({ score }) {
    const { setupData, setNumber, matchRules } = useMatchStore();

    const homeTheme = THEME_MAP[setupData.home.theme] || THEME_MAP.orange;
    const awayTheme = THEME_MAP[setupData.away.theme] || THEME_MAP.red;

    const isTiebreak = setNumber === matchRules.bestOf;
    const setLabel = isTiebreak ? "TIEBREAK SET" : `SET ${setNumber}`;

    return (
        <header className="bg-slate-900 text-white shadow-lg shrink-0 z-40 h-16 flex relative overflow-hidden font-sans">
            {/* Home Background (Left) */}
            <div
                className="absolute top-0 left-0 w-1/2 h-full skew-x-12 origin-bottom -translate-x-10 z-0 border-r-4 border-black transition-colors duration-500"
                style={{ backgroundColor: homeTheme.hex }}
            ></div>

            {/* Away Background (Right) */}
            <div
                className="absolute top-0 right-0 w-1/2 h-full skew-x-12 origin-top translate-x-10 z-0 transition-colors duration-500"
                style={{ backgroundColor: awayTheme.hex }}
            ></div>

            {/* --- Content Layer --- */}

            {/* home SIDE (Left) */}
            <div className="flex-1 flex items-center justify-start z-10 pl-4 gap-4">
                {/* Score Box */}
                <div
                    className="bg-black w-14 h-10 flex items-center justify-center rounded text-3xl font-black font-mono border-2 border-white shadow-lg order-2 xl:order-1 transition-colors duration-500"
                    style={{ color: homeTheme.hex }}
                >
                    {score.home}
                </div>
                {/* Team Name */}
                <div className="hidden xl:flex flex-col items-start order-1 xl:order-2">
                    <span className="font-black text-xl uppercase tracking-tighter leading-none shadow-black drop-shadow-md text-white">
                        {setupData.home.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-white">Home</span>
                </div>
            </div>

            {/* CENTER (Set Info) */}
            <div className="flex-shrink-0 flex justify-center items-center z-20 px-4">
                <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm px-6 py-1.5 rounded-full border border-white/10 shadow-xl">
                    <span className={`text-sm font-black uppercase tracking-widest ${isTiebreak ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>
                        {setLabel}
                    </span>
                </div>
            </div>

            {/* away SIDE (Right) */}
            <div className="flex-1 flex items-center justify-end z-10 pr-4 gap-4">
                {/* Team Name */}
                <div className="hidden xl:flex flex-col items-end">
                    <span className="font-black text-xl uppercase tracking-tighter leading-none shadow-black drop-shadow-md text-white text-right">
                        {setupData.away.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-white">Away</span>
                </div>
                {/* Score Box */}
                <div
                    className="bg-black w-14 h-10 flex items-center justify-center rounded text-3xl font-black font-mono border-2 border-white shadow-lg transition-colors duration-500"
                    style={{ color: awayTheme.hex }}
                >
                    {score.away}
                </div>
            </div>

            {/* Mobile Name Overlay */}
            <div className="xl:hidden absolute bottom-0.5 left-2 z-20 text-[10px] font-black uppercase text-white/90 drop-shadow-md">
                {setupData.home.name}
            </div>
            <div className="xl:hidden absolute bottom-0.5 right-2 z-20 text-[10px] font-black uppercase text-white/90 drop-shadow-md text-right">
                {setupData.away.name}
            </div>
        </header>
    );
}