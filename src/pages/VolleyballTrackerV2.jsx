import { BarChart3, ChevronLeft, ChevronRight, User } from 'lucide-react';
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
    const { setNumber, completeSet, matchRules, setsWon, setupData, resetMatch } = useMatchStore();
    const { state, actions } = useVolleyballGame();

    // UI State
    const [showReferee, setShowReferee] = useState(false);
    const [showChallengeTeam, setShowChallengeTeam] = useState(null);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [activeTimeoutTeam, setActiveTimeoutTeam] = useState(null);
    const [setWinner, setSetWinner] = useState(null);
    const [isMatchOver, setIsMatchOver] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // Sidebar State
    // Initialize based on current width
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1280);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(window.innerWidth >= 1280);

    // [FIX] Resize Listener for DevTools
    // This ensures that when you switch device mode in Chrome DevTools, 
    // the UI reacts immediately without requiring a page refresh.
    useEffect(() => {
        const handleResize = () => {
            const isDesktop = window.innerWidth > 1440;
            setIsLeftSidebarOpen(isDesktop);
            setIsRightSidebarOpen(isDesktop);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- GAME END LOGIC ---
    useEffect(() => {
        const { home, away } = state.score;
        const { bestOf, setPoints, tiebreakPoints } = matchRules;
        const isFinalSet = setNumber === bestOf;
        const isTiebreak = isFinalSet && bestOf > 1;
        const target = isTiebreak ? tiebreakPoints : setPoints;

        if (home >= target || away >= target) {
            if (Math.abs(home - away) < 2) return;
            if (setWinner) return;

            const winner = home > away ? 'home' : 'away';
            const setsToWin = Math.ceil(bestOf / 2);
            const currentWins = (setsWon[winner] || 0) + 1;
            const matchFinished = currentWins >= setsToWin;

            setSetWinner(winner);
            setIsMatchOver(matchFinished);
        }
    }, [state.score, setNumber, matchRules, setsWon, setWinner]);

    const handleSaveAndContinue = () => {
        if (!setWinner) return;
        const setRecord = {
            id: Date.now(), matchDate: new Date().toISOString(),
            setNumber: setNumber, winner: setWinner, score: state.score,
            duration: '00:00', logs: state.logs,
            lineups: { home: setupData.home.court, away: setupData.away.court },
            matchId: `${setupData.home.name}_vs_${setupData.away.name}`
        };

        const history = JSON.parse(localStorage.getItem('volleyball_match_history') || '[]');
        history.push(setRecord);
        localStorage.setItem('volleyball_match_history', JSON.stringify(history));

        if (!isMatchOver) {
            completeSet(setWinner);
            navigate('/setup', { state: { jumpToStep: 3 } });
        } else {
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

    // Toggle Button Component
    const SidebarToggle = ({ side, isOpen, onClick }) => {
        const isLeft = side === 'left';
        const Icon = isLeft
            ? (isOpen ? ChevronLeft : ChevronRight)
            : (isOpen ? ChevronRight : ChevronLeft);

        return (
            <button
                onClick={onClick}
                className={`
                    absolute top-1/2 -translate-y-1/2 z-30
                    w-5 h-12 md:w-6 md:h-16
                    flex items-center justify-center
                    bg-white border-y border-${isLeft ? 'r' : 'l'} border-slate-300
                    shadow-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50
                    transition-all duration-200 active:scale-95
                    ${isLeft ? 'left-0 rounded-r-lg' : 'right-0 rounded-l-lg'}
                `}
            >
                <Icon size={18} />
            </button>
        );
    };

    return (
        <div className="w-full h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-800">
            {/* Overlays */}
            {setWinner && <WinnerOverlay winner={setWinner} score={state.score} onSave={handleSaveAndContinue} isMatchPoint={isMatchOver} />}
            {showReferee && <RefereeControls onPointAwarded={(w, r) => { actions.handleReferee(w, r); setShowReferee(false); }} onClose={() => setShowReferee(false)} />}
            {showChallengeTeam && <ChallengeControl team={showChallengeTeam} onResolve={onChallengeResolve} onClose={() => setShowChallengeTeam(null)} />}
            {activeTimeoutTeam && <TimeoutTimer team={activeTimeoutTeam} onClose={() => setActiveTimeoutTeam(null)} />}
            {showStats && <StatsDashboard state={state} onClose={() => setShowStats(false)} />}

            {/* Header */}
            <MatchHeader score={state.score} phase={state.matchPhase} />

            {/* --- MAIN STAGE --- */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* --- LEFT SIDEBAR CONTAINER (Squeezable) --- */}
                <div
                    className={`
                        transition-all duration-300 ease-in-out relative flex-shrink-0
                        ${isLeftSidebarOpen ? 'w-32 lg:w-40 xl:w-80 opacity-100' : 'w-0 opacity-0'}
                    `}
                >
                    <div className="w-32 lg:w-40 xl:w-80 h-full absolute top-0 right-0">
                        <BenchSidebar
                            team="home"
                            data={setupData.home}
                            gameState={state}
                            actions={actions}
                            onTimeout={() => onTimeoutRequest('home')}
                            onChallenge={() => setShowChallengeTeam('home')}
                        />
                    </div>
                </div>

                {/* --- CENTER COURT --- */}
                <div className="flex-1 flex flex-col relative min-w-0 bg-slate-100 transition-all duration-300 z-10">

                    {/* Toggle Buttons */}
                    <SidebarToggle side="left" isOpen={isLeftSidebarOpen} onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} />
                    <SidebarToggle side="right" isOpen={isRightSidebarOpen} onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} />

                    {/* Court Wrapper */}
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden p-1 md:p-4 mt-8 md:mt-12">

                        <div className="w-full max-w-[98%] aspect-[1.8/1] md:aspect-[2/1] flex relative shadow-xl rounded-sm overflow-hidden bg-white border-4 border-white">

                            {/* Left Half */}
                            <div className="flex-1 relative border-r-2 border-slate-200">
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

                            {/* Net & Ref Controls */}
                            <div className="w-1.5 md:w-2 h-full bg-slate-800 relative z-30 flex items-center justify-center">
                                <div className="h-full w-full bg-slate-800 shadow-xl"></div>
                                <button onClick={() => setShowReferee(true)} className="absolute -top-12 md:-top-16 flex flex-col items-center z-50 hover:scale-110 transition-transform cursor-pointer group">
                                    <span className="hidden md:block text-[9px] font-black text-slate-500 mb-1 bg-white/90 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">R2 Assist</span>
                                    <div className="bg-white rounded-full p-1 md:p-1.5 border-2 border-slate-800 shadow-md group-hover:border-yellow-500"><User className="w-4 h-4 md:w-5 md:h-5 text-slate-800" /></div>
                                </button>
                                <div className="absolute bg-white border border-slate-900 text-slate-900 text-[8px] md:text-[9px] font-black px-1 py-0.5 rounded-full shadow-lg tracking-widest z-40 select-none">NET</div>
                                <button onClick={() => setShowReferee(true)} className="absolute -bottom-14 md:-bottom-20 flex flex-col items-center z-50 hover:scale-110 transition-transform cursor-pointer group">
                                    <div className="relative"><div className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-lg flex items-center justify-center border-2 border-slate-600 shadow-xl relative z-10 group-hover:border-yellow-400"><User className="w-5 h-5 md:w-6 md:h-6 text-white" /></div><div className="absolute -bottom-1.5 -left-0.5 w-1 h-3 bg-slate-700 skew-x-12"></div><div className="absolute -bottom-1.5 -right-0.5 w-1 h-3 bg-slate-700 -skew-x-12"></div></div>
                                    <span className="text-[9px] md:text-[10px] font-black text-white mt-1 md:mt-1.5 bg-slate-800 px-2 py-0.5 rounded shadow-md border border-slate-600 uppercase tracking-wider group-hover:text-yellow-300">R1 CALL</span>
                                </button>
                            </div>

                            {/* Right Half */}
                            <div className="flex-1 relative border-l-2 border-slate-200">
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

                    {/* Control Panel */}
                    <ControlPanel state={state} actions={actions} />
                </div>

                {/* --- RIGHT SIDEBAR CONTAINER (Squeezable) --- */}
                <div
                    className={`
                        transition-all duration-300 ease-in-out relative flex-shrink-0
                        ${isRightSidebarOpen ? 'w-32 lg:w-40 xl:w-80 opacity-100' : 'w-0 opacity-0'}
                    `}
                >
                    <div className="w-32 lg:w-40 xl:w-80 h-full absolute top-0 left-0">
                        <BenchSidebar
                            team="away"
                            data={setupData.away}
                            gameState={state}
                            actions={actions}
                            onTimeout={() => onTimeoutRequest('away')}
                            onChallenge={() => setShowChallengeTeam('away')}
                        />
                    </div>
                </div>

                {/* Utils */}
                <LogDrawer logs={state.logs} isOpen={isLogOpen} toggle={() => setIsLogOpen(!isLogOpen)} />
                <button onClick={() => setShowStats(true)} className="absolute top-2 right-12 md:top-4 md:right-16 z-30 bg-white p-2 md:p-2.5 rounded-full shadow-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:scale-105 transition-all">
                    <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </div>
        </div>
    );
}