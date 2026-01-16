import { Activity, Ban, BarChart3, X, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getPlayerStats } from '../../reducers/gameReducer';

export default function StatsDashboard({ state, onClose }) {
    const [activeTab, setActiveTab] = useState('TEAM');
    const { history, score } = state;

    // --- 1. AGGREGATE TEAM STATS ---
    const teamStats = useMemo(() => {
        const data = {
            home: { points: 0, kills: 0, blocks: 0, aces: 0, errors: 0 },
            away: { points: 0, kills: 0, blocks: 0, aces: 0, errors: 0 }
        };

        history.forEach(rally => {
            const winner = rally.winner;
            const loser = winner === 'home' ? 'away' : 'home';

            data[winner].points++;

            const events = rally.events || [];

            const kill = events.find(e => e.type === 'ATTACK' && e.result === 'KILL' && e.team === winner);
            const ace = events.find(e => e.type === 'SERVE' && e.result === 'ACE' && e.team === winner);
            const block = events.find(e => e.type === 'BLOCK' && e.result === 'SHUTDOWN' && e.team === winner);

            const error = events.find(e => {
                const isLoserAction = e.team === loser;
                const isExplicitError = e.result === 'ERROR';
                const isGradeZero = (e.type === 'RECEPTION' || e.type === 'DIG') && e.grade === 0;

                return isLoserAction && (isExplicitError || isGradeZero);
            });

            if (kill) data[winner].kills++;
            else if (ace) data[winner].aces++;
            else if (block) data[winner].blocks++;
            else if (error) data[winner].errors++;
        });

        return data;
    }, [history]);

    // --- 2. SUB-COMPONENTS ---

    const StatRow = ({ label, homeVal, awayVal, icon: Icon, colorClass }) => {
        const total = homeVal + awayVal || 1;
        const homePct = (homeVal / total) * 100;
        const awayPct = (awayVal / total) * 100;

        return (
            <div className="mb-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    <span>{homeVal}</span>
                    <span className="flex items-center gap-1">{Icon && <Icon size={12} />} {label}</span>
                    <span>{awayVal}</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                    <div style={{ width: `${homePct}%` }} className={`h-full ${colorClass} opacity-80`} />
                    <div style={{ width: `${awayPct}%` }} className={`h-full ${colorClass}`} />
                </div>
            </div>
        );
    };

    const HistoryItem = ({ rally }) => {
        const isHome = rally.winner === 'home';
        const [mainReason, detail] = (rally.reason || "").split("->");

        // [FIX] Use endScore if available, fallback to calculating it manually if old data
        const displayScore = rally.endScore
            ? `${rally.endScore.home}-${rally.endScore.away}`
            : `${rally.scoreState.home}-${rally.scoreState.away}`; // Fallback for old records

        return (
            <div className={`p-3 rounded-lg border-l-4 mb-2 flex justify-between items-center ${isHome ? 'border-orange-500 bg-orange-50' : 'border-red-600 bg-red-50'}`}>
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700 text-sm">{mainReason}</span>
                    <span className="text-xs text-slate-500">{detail || 'Point'}</span>
                </div>
                <div className="text-right">
                    <span className={`text-xs font-black px-2 py-1 rounded text-white ${isHome ? 'bg-orange-500' : 'bg-red-600'}`}>
                        {rally.winner === 'home' ? 'home' : 'away'}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                        {displayScore}
                    </div>
                </div>
            </div>
        );
    };

    const PlayerRow = ({ player }) => {
        const { stats } = getPlayerStats(history, player.id);

        const totalActivity =
            stats.points +
            stats.serve.total +
            stats.attack.total +
            stats.reception.total +
            stats.dig.total +
            stats.block.solo +
            stats.block.assist;

        if (totalActivity === 0) return null;

        return (
            <tr className="border-b border-slate-100 text-xs hover:bg-slate-50 transition-colors">
                <td className="py-2 pl-2 font-bold text-slate-700 truncate max-w-[90px]">#{player.number} {player.name}</td>
                <td className="text-center font-black text-slate-800 bg-slate-50">{stats.points}</td>
                <td className="text-center text-slate-500">{stats.attack.kill}</td>
                <td className="text-center text-slate-500">{stats.block.solo + stats.block.assist}</td>
                <td className="text-center text-slate-500">{stats.serve.ace}</td>
                <td className={`text-center font-bold ${stats.serve.error > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                    {stats.serve.error}
                </td>
                <td className="text-center text-slate-500">{stats.reception.perfect}</td>
            </tr>
        );
    };

    // --- 3. RENDER ---

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="text-slate-700" />
                        <span className="font-black text-slate-800 uppercase tracking-widest">Match Analytics</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                {/* Scoreboard Summary */}
                <div className="p-6 flex justify-between items-center bg-slate-900 text-white shadow-inner shrink-0">
                    <div className="text-center">
                        <div className="text-3xl font-black text-orange-500">{score.home}</div>
                        <div className="text-[10px] font-bold tracking-widest opacity-50">home</div>
                    </div>
                    <div className="text-xs font-mono opacity-30">VS</div>
                    <div className="text-center">
                        <div className="text-3xl font-black text-red-500">{score.away}</div>
                        <div className="text-[10px] font-bold tracking-widest opacity-50">away</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    {['TEAM', 'PLAYERS', 'LOG'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'border-b-2 border-slate-800 text-slate-800 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-white">

                    {activeTab === 'TEAM' && (
                        <div className="space-y-6">
                            <StatRow label="Attack Kills" icon={Activity} homeVal={teamStats.home.kills} awayVal={teamStats.away.kills} colorClass="bg-emerald-500" />
                            <StatRow label="Kill Blocks" icon={Ban} homeVal={teamStats.home.blocks} awayVal={teamStats.away.blocks} colorClass="bg-violet-500" />
                            <StatRow label="Service Aces" icon={Zap} homeVal={teamStats.home.aces} awayVal={teamStats.away.aces} colorClass="bg-yellow-500" />
                            <StatRow label="Opponent Errors" icon={X} homeVal={teamStats.home.errors} awayVal={teamStats.away.errors} colorClass="bg-rose-400" />

                            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Total Points Scored</span>
                                <div className="flex justify-center gap-8 mt-2 items-end">
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-slate-700">{teamStats.home.points}</div>
                                        <div className="h-1 w-8 bg-orange-500 mx-auto mt-1 rounded-full" />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-slate-700">{teamStats.away.points}</div>
                                        <div className="h-1 w-8 bg-red-600 mx-auto mt-1 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PLAYERS' && (
                        <div>
                            {['home', 'away'].map(team => (
                                <div key={team} className="mb-6">
                                    <h4 className={`text-xs font-black uppercase tracking-widest mb-2 px-2 ${team === 'home' ? 'text-orange-600' : 'text-red-600'}`}>
                                        {team === 'home' ? 'Home Team' : 'Away Team'}
                                    </h4>
                                    <table className="w-full">
                                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold">
                                            <tr>
                                                <th className="text-left py-2 pl-2">Player</th>
                                                <th className="w-8 text-center">PTS</th>
                                                <th className="w-8 text-center">ATK</th>
                                                <th className="w-8 text-center">BLK</th>
                                                <th className="w-8 text-center">ACE</th>
                                                <th className="w-8 text-center text-red-400">SE</th>
                                                <th className="w-8 text-center">REC</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...state.rotations[team], ...state.benches[team]]
                                                .filter(p => p)
                                                .sort((a, b) => a.number - b.number)
                                                .map(p => <PlayerRow key={p.id} player={p} />)
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'LOG' && (
                        <div className="space-y-1">
                            {history.length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-sm italic">No rallies recorded yet.</div>
                            )}
                            {history.map(rally => <HistoryItem key={rally.id} rally={rally} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}