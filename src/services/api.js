import dumpsterData from '../data/dumpster_battle.json';

export const MatchAPI = {
    /**
     * Simulates fetching match data from an external API endpoint
     * GET /api/v1/matches/:id/roster
     */
    getRosterData: async () => {
        // 1. Simulate Network Latency (0.8 seconds)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 2. Return the JSON data (acting as the response body)
        // In a real app, this would be: return axios.get('/api/...')
        return dumpsterData;
    }
};