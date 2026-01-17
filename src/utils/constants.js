// src/utils/constants.js

export const MOCK_SETUP_DATA = {
    home: {
        name: "KARASUNO",
        theme: "orange",
        court: [
            { id: "h9", number: "9", name: "KAGEYAMA", pos: "S", isLibero: false },
            { id: "h10", number: "10", name: "HINATA", pos: "MB", isLibero: false },
            { id: "h5", number: "5", name: "TANAKA", pos: "OH", isLibero: false },
            { id: "h1", number: "1", name: "DAICHI", "pos": "OPP", isLibero: false },
            { id: "h11", number: "11", name: "TSUKISHIMA", pos: "MB", isLibero: false },
            { id: "h3", number: "3", name: "ASAHI", pos: "OH", isLibero: false }
        ],
        bench: [
            { id: "h2", number: "2", name: "SUGAWARA", pos: "S", isLibero: false },
            { id: "h12", number: "12", "name": "YAMAGUCHI", pos: "MB", isLibero: false }
        ],
        liberos: [
            { id: "h4", number: "4", name: "NISHINOYA", pos: "L", isLibero: true }
        ]
    },
    away: {
        name: "NEKOMA",
        theme: "red",
        court: [
            { id: "a5", number: "5", name: "KENMA", pos: "S", isLibero: false },
            { id: "a11", number: "11", name: "LEV", pos: "MB", isLibero: false },
            { id: "a6", number: "6", name: "FUKUNAGA", pos: "OH", isLibero: false },
            { id: "a2", number: "2", name: "KAI", pos: "OPP", isLibero: false },
            { id: "a1", number: "1", name: "KUROO", pos: "MB", isLibero: false },
            { id: "a4", number: "4", name: "YAMAMOTO", pos: "OH", isLibero: false }
        ],
        bench: [
            { id: "a7", number: "7", name: "INUOKA", pos: "OH", isLibero: false }
        ],
        liberos: [
            { id: "a3", number: "3", name: "YAKU", pos: "L", isLibero: true },
            { id: "a12", number: "12", name: "SHIBAYAMA", pos: "L", isLibero: true }
        ]
    }
};

export const FALLBACK_THEME = {
    hex: '#64748b',
    tint: 'text-slate-600',
    border: 'border-slate-300',
    bgTint: 'bg-slate-600',
    softBg: 'bg-slate-50',
    courtLines: 'border-slate-200',
    refColor: 'bg-slate-700'
};

export const THEME_MAP = {
    orange: {
        hex: '#ff7b00', // Added for dynamic inline styles
        tint: 'text-[#ff7b00]',
        border: 'border-[#ff7b00]',
        bgTint: 'bg-[#ff7b00]',
        softBg: 'bg-orange-50',
        gradient: 'from-[#ff7b00] to-[#c75c14]',
        courtLines: 'border-orange-200',
        refColor: 'bg-orange-800'
    },
    red: {
        hex: '#d9202a',
        tint: 'text-[#d9202a]',
        border: 'border-[#d9202a]',
        bgTint: 'bg-[#d9202a]',
        softBg: 'bg-red-50',
        gradient: 'from-[#d9202a] to-[#9e212d]',
        courtLines: 'border-red-200',
        refColor: 'bg-red-800'
    },
    purple: {
        hex: '#ac217f',
        tint: 'text-[#ac217f]',
        border: 'border-[#ac217f]',
        bgTint: 'bg-[#ac217f]',
        softBg: 'bg-fuchsia-50',
        gradient: 'from-[#ac217f] to-[#5c575a]',
        courtLines: 'border-fuchsia-200',
        refColor: 'bg-[#5c575a]'
    },
    teal: {
        hex: '#00897b',
        tint: 'text-[#00897b]',
        border: 'border-[#00897b]',
        bgTint: 'bg-[#00897b]',
        softBg: 'bg-teal-50',
        gradient: 'from-[#79c6c6] to-[#141414]',
        courtLines: 'border-teal-200',
        refColor: 'bg-[#343434]'
    }
};