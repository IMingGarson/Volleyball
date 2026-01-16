import { BarChart3, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolleyballGame } from '../hooks/useVolleyballGame';
import { useMatchStore } from '../store/matchStore';

// Components
import BenchSidebar from '../components/volleyball/BenchSidebar';
import ControlPanel from '../components/volleyball/ControlPanel';
import CourtDisplay from '../components/volleyball/CourtDisplay';
import LogDrawer from '../components/volleyball/LogDrawer';
import MatchHeader from '../components/volleyball/MatchHeader';
import StatsDashboard from '../components/volleyball/StatsDashboard';

// Overlays
import ChallengeControl from '../components/overlays/ChallengeControl';
import RefereeControls from '../components/overlays/RefereeControls';
import TimeoutTimer from '../components/overlays/TimeoutTimer';
import WinnerOverlay from '../components/overlays/WinnerOverlay';

export default function VolleyballTracker() {
    const navigate = useNavigate();

    // Store Data
    const { setNumber, completeSet, matchRules, setsWon, setupData, resetMatch } = useMatchStore();
    const { state, actions } = useVolleyballGame();

    // UI State
    const [showReferee, setShowReferee] = useState(false);
    const [showChallengeTeam, setShowChallengeTeam] = useState(null);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [activeTimeoutTeam, setActiveTimeoutTeam] = useState(null);

    // Winner State
    const [setWinner, setSetWinner] = useState(null);
    const [isMatchOver, setIsMatchOver] = useState(false);

    const [showStats, setShowStats] = useState(false);

    // --- GAME END LOGIC ---
    useEffect(() => {
        const { home, away } = state.score;
        const { bestOf, setPoints, tiebreakPoints } = matchRules;

        // --- [FIX] UPDATED TIEBREAK LOGIC ---
        // 1. Is this the final possible set?
        const isFinalSet = setNumber === bestOf;

        // 2. It is only a "Short Set" (Tiebreak to 15) if it is the final set AND the match is multi-set.
        // If BestOf is 1, we play a full set (25).
        const isTiebreak = isFinalSet && bestOf > 1;

        const target = isTiebreak ? tiebreakPoints : setPoints;
        // 3. Check Win Condition (Target reached AND +2 lead)
        if (home >= target || away >= target) {
            if (Math.abs(home - away) < 2) {
                return;
            }
            // Avoid duplicate triggers
            if (setWinner) return;

            const winner = home > away ? 'home' : 'away';

            // 4. Check Match Over Condition
            const setsToWin = Math.ceil(bestOf / 2);
            // We use setsWon[winner] from store (previous sets) + 1 (this current set)
            const currentWins = (setsWon[winner] || 0) + 1;
            const matchFinished = currentWins >= setsToWin;

            setSetWinner(winner);
            setIsMatchOver(matchFinished);
        }
    }, [state.score, setNumber, matchRules, setsWon, setWinner]);


    // --- SAVE & NAVIGATE HANDLER ---
    const handleSaveAndContinue = () => {
        if (!setWinner) return;

        // 1. Prepare Data Packet
        const setRecord = {
            id: Date.now(),
            matchDate: new Date().toISOString(),
            setNumber: setNumber,
            winner: setWinner,
            score: state.score,
            duration: '00:00',
            logs: state.logs,
            lineups: {
                home: setupData.home.court,
                away: setupData.away.court
            },
            matchId: `${setupData.home.name}_vs_${setupData.away.name}`
        };

        // 2. Save to LocalStorage
        const history = JSON.parse(localStorage.getItem('volleyball_match_history') || '[]');
        history.push(setRecord);
        localStorage.setItem('volleyball_match_history', JSON.stringify(history));

        // 3. Update Store / Navigation
        if (!isMatchOver) {
            completeSet(setWinner);
            // Go to Setup Page Step 3 (Lineup)
            navigate('/setup', { state: { jumpToStep: 3 } });
        } else {
            // Match Over -> Reset
            resetMatch();
            navigate('/setup');
        }
    };

    const onTimeoutRequest = (team) => {
        actions.requestTimeout(team);
        setActiveTimeoutTeam(team);
    };

    const onChallengeResolve = (result) => {
        actions.handleChallenge(showChallengeTeam, result);
        setShowChallengeTeam(null);
    };

    return (
        <div className="w-full h-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-slate-800">

            {/* --- OVERLAYS --- */}
            {setWinner && (
                <WinnerOverlay
                    winner={setWinner}
                    score={state.score}
                    onSave={handleSaveAndContinue}
                    isMatchPoint={isMatchOver}
                />
            )}

            {showReferee && <RefereeControls onPointAwarded={(w, r) => { actions.handleReferee(w, r); setShowReferee(false); }} onClose={() => setShowReferee(false)} />}
            {showChallengeTeam && <ChallengeControl team={showChallengeTeam} onResolve={onChallengeResolve} onClose={() => setShowChallengeTeam(null)} />}
            {activeTimeoutTeam && <TimeoutTimer team={activeTimeoutTeam} onClose={() => setActiveTimeoutTeam(null)} />}

            {/* --- HEADER --- */}
            <MatchHeader score={state.score} phase={state.matchPhase} />

            <div className="flex-1 flex overflow-hidden relative">

                {/* --- LEFT SIDEBAR (home) --- */}
                <BenchSidebar
                    team="home"
                    data={setupData.home}
                    gameState={state}
                    actions={actions}
                    onTimeout={() => onTimeoutRequest('home')}
                    onChallenge={() => setShowChallengeTeam('home')}
                />

                {/* --- CENTER COURT --- */}
                <div className="flex-1 flex flex-col bg-slate-200 relative min-w-0 transition-all">
                    {/* Court Graphics */}
                    <div className="flex-1 p-2 bg-slate-300 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full p-4 xl:p-16 bg-blue-50 flex items-center justify-center relative overflow-hidden shadow-inner">
                            <div className="w-full max-w-[95%] aspect-[2/1] bg-white border-4 border-white shadow-2xl relative flex">

                                {/* Home Half */}
                                <div className="flex-1 relative border-r-2 border-slate-300">
                                    <CourtDisplay
                                        side="left"
                                        rotation={state.rotations.home}
                                        matchPhase={state.matchPhase}
                                        possession={state.possession}
                                        selectedPlayer={state.selectedPlayer}
                                        rallyData={state.rallyData}
                                        actionTeam={state.actionTeam}
                                        onPlayerClick={actions.selectPlayer}
                                        onZoneClick={(zone) => actions.selectZone(zone, 'home')}
                                    />
                                </div>

                                {/* Net / Ref Buttons */}
                                <div className="w-2 h-full bg-slate-800 relative z-30 flex items-center justify-center">
                                    <div className="h-full w-full bg-slate-800"></div>
                                    <button onClick={() => setShowReferee(true)} className="absolute -top-24 flex flex-col items-center z-50 hover:scale-110 transition-transform cursor-pointer group">
                                        <span className="text-[10px] font-black text-slate-800 mt-1 bg-white/80 px-2 py-0.5 rounded shadow-sm border border-slate-200 uppercase tracking-wider text-center whitespace-nowrap group-hover:bg-yellow-100">R2 Assist</span>
                                        <div className="bg-white rounded-full p-1.5 border-2 border-slate-800 shadow-md group-hover:border-yellow-500"><User size={22} className="text-slate-800" /></div>
                                    </button>
                                    <div className="absolute bg-white border-2 border-slate-900 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg tracking-widest z-40">NET</div>
                                    <button onClick={() => setShowReferee(true)} className="absolute -bottom-24 flex flex-col items-center z-50 hover:scale-110 transition-transform cursor-pointer group">
                                        <div className="relative"><div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border-2 border-slate-600 shadow-xl relative z-10 group-hover:border-yellow-400"><User size={24} className="text-white" /></div><div className="absolute -bottom-2 -left-1 w-1.5 h-4 bg-slate-700 skew-x-12"></div><div className="absolute -bottom-2 -right-1 w-1.5 h-4 bg-slate-700 -skew-x-12"></div></div>
                                        <span className="text-[10px] font-black text-white mt-1.5 bg-slate-800 px-2 py-0.5 rounded shadow-md border border-slate-600 uppercase tracking-wider text-center whitespace-nowrap group-hover:text-yellow-300">R1 CALL</span>
                                    </button>
                                </div>

                                {/* Away Half */}
                                <div className="flex-1 relative border-l-2 border-slate-300">
                                    <CourtDisplay
                                        side="right"
                                        rotation={state.rotations.away}
                                        matchPhase={state.matchPhase}
                                        possession={state.possession}
                                        selectedPlayer={state.selectedPlayer}
                                        rallyData={state.rallyData}
                                        actionTeam={state.actionTeam}
                                        onPlayerClick={actions.selectPlayer}
                                        onZoneClick={(zone) => actions.selectZone(zone, 'away')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <ControlPanel state={state} actions={actions} />
                </div>

                {/* --- RIGHT SIDEBAR (away) --- */}
                <BenchSidebar
                    team="away"
                    data={setupData.away}
                    gameState={state}
                    actions={actions}
                    onTimeout={() => onTimeoutRequest('away')}
                    onChallenge={() => setShowChallengeTeam('away')}
                />

                {/* --- LOGS --- */}
                <LogDrawer logs={state.logs} isOpen={isLogOpen} toggle={() => setIsLogOpen(!isLogOpen)} />
                <button
                    onClick={() => setShowStats(true)}
                    className="fixed top-8 right-16 z-40 bg-white p-3 rounded-full shadow-xl text-slate-700 hover:text-indigo-600 hover:scale-110 transition-all"
                >
                    <BarChart3 size={24} />
                </button>

                {/* Dashboard Overlay */}
                {showStats && <StatsDashboard state={state} onClose={() => setShowStats(false)} />}
            </div>
        </div>
    );
}