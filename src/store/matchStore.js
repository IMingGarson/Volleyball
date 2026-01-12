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

            // Initial state now supports a 'theme' property
            setupData: {
                home: { name: 'HOME', theme: 'orange', bench: [], court: Array(6).fill(null), liberos: [] },
                away: { name: 'AWAY', theme: 'red', bench: [], court: Array(6).fill(null), liberos: [] }
            },

            liveGameBackup: null,

            fetchRosters: async () => {
                set({ isLoading: true, error: null });
                try {
                    const data = await MatchAPI.getRosterData();

                    const processTeam = (apiTeamData) => {
                        const bench = [];
                        const liberos = [];
                        apiTeamData.roster.forEach(p => {
                            const playerObj = { ...p, id: uuidv4() };
                            if (p.isLibero) liberos.push(playerObj);
                            else bench.push(playerObj);
                        });
                        return {
                            name: apiTeamData.name,
                            theme: apiTeamData.theme, // CAPTURE THEME
                            bench,
                            liberos,
                            court: Array(6).fill(null)
                        };
                    };

                    set({
                        setupData: { home: processTeam(data.home), away: processTeam(data.away) },
                        isLoading: false
                    });

                } catch (error) {
                    console.error("API Call Failed", error);
                    set({ isLoading: false, error: "Failed to load match data." });
                }
            },

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