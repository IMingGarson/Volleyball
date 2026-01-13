// src/components/volleyball/LogDrawer.jsx
import { Clock, FileText, ScrollText, X } from 'lucide-react';

export default function LogDrawer({ logs, isOpen, toggle }) {
    return (
        <>
            <div className={`bg-white/95 backdrop-blur-md border-l border-slate-200 flex flex-col z-50 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-80' : 'w-0'}`}>
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-sm tracking-widest flex justify-between items-center whitespace-nowrap uppercase">
                    MATCH LOG <button onClick={() => toggle(false)} className="hover:bg-slate-200 p-1.5 rounded-full text-slate-400"><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50 min-w-[20rem]">
                    {logs.map(log => (
                        <div key={log.id} className={`text-xs p-3 rounded-lg border shadow-sm ${log.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : log.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-800' : log.type === 'highlight' ? 'bg-purple-50 border-purple-100 text-purple-800' : log.type === 'correction' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-white border-slate-200 text-slate-600'} flex flex-col gap-1.5 transition-all hover:shadow-md`}>
                            <div className="flex justify-between items-center opacity-60 text-[10px] font-bold uppercase tracking-wide">
                                <span className="flex items-center gap-1"><Clock size={10} /> {log.time.split(' ')[0]}</span>
                                {log.type === 'highlight' && <span className="bg-yellow-400 text-yellow-900 px-1.5 rounded-sm">SCORE</span>}
                            </div>
                            <div className="flex gap-2.5 items-start">
                                <div className="mt-0.5 opacity-80"><FileText size={16} /></div>
                                <span className="font-bold leading-relaxed">{log.text}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={toggle} className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 hover:scale-110 transition-all active:scale-95 border-4 border-white">
                {isOpen ? <X size={24} /> : <ScrollText size={24} />}
            </button>
        </>
    );
}