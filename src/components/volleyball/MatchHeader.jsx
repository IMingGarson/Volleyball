// src/components/volleyball/MatchHeader.jsx
export default function MatchHeader({ score, phase }) {
    return (
        <header className="bg-slate-900 text-white shadow-lg shrink-0 z-40 h-16 flex relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1/2 h-full bg-[#ff7b00] skew-x-12 origin-bottom -translate-x-10 z-0 border-r-4 border-black"></div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[#d9202a] skew-x-12 origin-top translate-x-10 z-0"></div>
            <div className="w-32 xl:w-64 flex-shrink-0 flex items-center gap-4 pl-4 z-10">
                <div className="bg-black w-12 h-9 xl:w-16 xl:h-10 flex items-center justify-center rounded text-2xl xl:text-3xl text-[#ff7b00] font-bold font-mono border-2 border-white">{score.home}</div>
            </div>
            <div className="flex-1 flex justify-center items-center z-10">
                <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded">
                    <span className="text-green-400 text-xs xl:text-sm font-bold uppercase tracking-wide">{phase}</span>
                </div>
            </div>
            <div className="w-32 xl:w-64 flex-shrink-0 flex items-center justify-end gap-4 pr-4 z-10">
                <div className="bg-black w-12 h-9 xl:w-16 xl:h-10 flex items-center justify-center rounded text-2xl xl:text-3xl text-[#d9202a] font-bold font-mono border-2 border-white">{score.away}</div>
            </div>
        </header>
    );
}