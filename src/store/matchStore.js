import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MatchAPI } from '../services/api';

export const useMatchStore = create(
    persist(
        (set, get) => ({
            setNumber: 1,
            isLoading: false,
            error: null,

            // List of teams for the "Select Team" Wizard
            availableTeams: [],

            // Active Game State
            setupData: {
                home: { name: 'HOME', theme: 'orange', bench: [], court: Array(6).fill(null), liberos: [] },
                away: { name: 'AWAY', theme: 'red', bench: [], court: Array(6).fill(null), liberos: [] }
            },

            liveGameBackup: null,

            // 1. Fetch the list of teams from API
            loadAvailableTeams: async () => {
                // If we already have data, don't re-fetch unless forced (optional optimization)
                if (get().availableTeams.length > 0) return;

                set({ isLoading: true, error: null });
                try {
                    const teams = await MatchAPI.getAvailableTeams();
                    set({ availableTeams: teams, isLoading: false });
                } catch (err) {
                    console.error("Failed to load teams", err);
                    set({ isLoading: false, error: "Could not load teams." });
                }
            },

            // 2. Process selected teams into Active Game State
            setMatchTeams: (homeTeamRaw, awayTeamRaw) => {
                const processTeam = (rawTeam) => {
                    const bench = [];
                    const liberos = [];

                    rawTeam.roster.forEach(p => {
                        const playerObj = { ...p, id: uuidv4() }; // Add UUID for game tracking
                        if (p.isLibero) liberos.push(playerObj);
                        else bench.push(playerObj);
                    });

                    return {
                        name: rawTeam.name,
                        theme: rawTeam.theme,
                        bench,
                        liberos,
                        court: Array(6).fill(null),
                        liberoAssignment: { index: null, player: null },
                        registeredLibero: null
                    };
                };

                set({
                    setupData: {
                        home: processTeam(homeTeamRaw),
                        away: processTeam(awayTeamRaw)
                    }
                });
            },

            // 3. Game Logic Actions
            updateTeamSetup: (side, data) => set(state => ({
                setupData: { ...state.setupData, [side]: { ...state.setupData[side], ...data } }
            })),

            startSet: () => set({ liveGameBackup: null }),
            saveLiveState: (gameState) => set({ liveGameBackup: gameState }),
            completeSet: (winner) => set(state => ({ setNumber: state.setNumber + 1, liveGameBackup: null })),

            resetMatch: () => set({
                setNumber: 1,
                liveGameBackup: null,
                setupData: {
                    home: { name: 'HOME', theme: 'orange', bench: [], court: Array(6).fill(null), liberos: [] },
                    away: { name: 'AWAY', theme: 'red', bench: [], court: Array(6).fill(null), liberos: [] }
                }
            })
        }),
        {
            name: 'volleyball-match-manager',
            storage: createJSONStorage(() => localStorage),
        }
    )
);