import teamsData from '../data/teams.json';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const MatchAPI = {
    // Fetch the list of all available teams for the selector
    getAvailableTeams: async () => {
        await delay(600); // Fake 600ms loading time
        return teamsData;
    },

    // (Optional) If you needed to fetch specific match details later
    getMatchDetails: async (matchId) => {
        await delay(300);
        return { matchId, status: 'scheduled' };
    }
};