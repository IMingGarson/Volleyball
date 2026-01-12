import { useEffect, useState } from 'react';
import SetSetup from './components/SetSetup';
import VolleyballTracker from './components/VolleyballTracker';

const MATCH_KEY = 'volleyball_match_data_v1';

const MatchManager = () => {
    const [view, setView] = useState('SETUP'); // 'SETUP' or 'TRACKER'
    const [currentSet, setCurrentSet] = useState(1);
    const [matchHistory, setMatchHistory] = useState([]);

    // Data passed from Setup to Tracker
    const [activeRosters, setActiveRosters] = useState(null);

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(MATCH_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            setMatchHistory(data.history || []);
            setCurrentSet(data.currentSet || 1);
            // Optional: Restore 'SETUP' or 'TRACKER' state if you want persistence across refreshes
        }
    }, []);

    const handleStartSet = (rosterData) => {
        setActiveRosters(rosterData);
        setView('TRACKER');
    };

    const handleSetComplete = (setSummary) => {
        // 1. Update History
        const newHistory = [...matchHistory, setSummary];
        setMatchHistory(newHistory);

        // 2. Increment Set
        const nextSet = currentSet + 1;
        setCurrentSet(nextSet);

        // 3. Save to Local Storage
        const saveData = {
            currentSet: nextSet,
            history: newHistory,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem(MATCH_KEY, JSON.stringify(saveData));

        // 4. Return to Setup for next set
        setView('SETUP');
    };

    const resetMatch = () => {
        if (window.confirm("Are you sure? This will delete all match history.")) {
            localStorage.removeItem(MATCH_KEY);
            setMatchHistory([]);
            setCurrentSet(1);
            setView('SETUP');
        }
    };

    if (view === 'SETUP') {
        return (
            <div>
                {/* Debug / History View (Optional - displayed at top of setup) */}
                {matchHistory.length > 0 && (
                    <div className="bg-slate-800 text-white p-4">
                        <div className="max-w-6xl mx-auto flex justify-between items-center">
                            <span>Sets Completed: {matchHistory.length}</span>
                            <button onClick={resetMatch} className="text-xs text-red-400 underline">Reset Match</button>
                        </div>
                    </div>
                )}
                <SetSetup
                    setNumber={currentSet}
                    onStartSet={handleStartSet}
                />
            </div>
        );
    }

    return (
        <VolleyballTracker
            setNumber={currentSet}
            initialRosters={activeRosters}
            onSetComplete={handleSetComplete}
        />
    );
};

export default MatchManager;