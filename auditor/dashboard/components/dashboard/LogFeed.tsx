"use client";

import { LogEntry } from "@/app/page";
import { Terminal, ShieldAlert, ShieldCheck, Activity, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Create a motion-enabled Link component
const MotionLink = motion.create(Link);

export default function LogFeed({ logs }: { logs: LogEntry[] }) {

    return (
        <div className="h-full flex flex-col font-mono text-xs">
            {/* Header */}
            <div className="p-3 border-b border-green-900/30 flex justify-between items-center bg-zinc-900/80">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Terminal size={14} />
                    <span className="font-bold tracking-wider">NET_TRAFFIC</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] tracking-widest text-zinc-500">LINKED</span>
                </div>
            </div>

            {/* The List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                    {logs.map((log) => {
                        const payload = log.payload;
                        const analysis = payload.sentinel_analysis;
                        const isRisk = (analysis?.risk_score || 0) > 0.5;

                        return (
                            <MotionLink
                                key={payload.event_id}
                                href={`/investigate/${payload.event_id}`}
                                className={`block p-3 border-l-2 rounded bg-zinc-900/40 hover:bg-zinc-800/80 cursor-pointer transition-colors group ${isRisk ? 'border-red-500/80' : 'border-green-500/50'}`}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Row 1: Time & Risk Icon */}
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-zinc-500 text-[10px] group-hover:text-zinc-300 transition-colors">
                                        {new Date(log.created_at).toLocaleTimeString()}
                                    </span>
                                    {isRisk ? (
                                        <ShieldAlert size={14} className="text-red-500 animate-pulse" />
                                    ) : (
                                        <ShieldCheck size={14} className="text-green-500" />
                                    )}
                                </div>

                                {/* Row 2: Action Type (The "What") */}
                                <div className={`font-bold truncate text-[11px] mb-1 ${isRisk ? 'text-red-200' : 'text-zinc-200'}`}>
                                    {payload.action_context?.action_type?.toUpperCase().replace(/_/g, " ") || "UNKNOWN ACTION"}
                                </div>

                                {/* Row 3: Anomaly Tags (Only the first 2 to save space) */}
                                {isRisk && analysis?.anomaly_vectors && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {analysis.anomaly_vectors.slice(0, 2).map((ano, i) => (
                                            <span key={i} className="px-1 py-0.5 bg-red-900/40 text-red-300 text-[9px] rounded border border-red-800/30 truncate max-w-[100px]">
                                                {ano}
                                            </span>
                                        ))}
                                        {analysis.anomaly_vectors.length > 2 && (
                                            <span className="text-[9px] text-zinc-500">+{analysis.anomaly_vectors.length - 2}</span>
                                        )}
                                    </div>
                                )}

                                {/* Row 4: User & Score */}
                                <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-800/50 pt-1.5 mt-1">
                                    <span className="truncate max-w-[80px]">{payload.actor.user_id}</span>

                                    <div className="flex items-center gap-1">
                                        <span>RISK:</span>
                                        <span className={`font-bold ${isRisk ? "text-red-400" : "text-green-400"}`}>
                                            {(analysis?.risk_score || 0).toFixed(2)}
                                        </span>
                                        <ChevronRight size={10} className="text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </MotionLink>
                        );
                    })}
                </AnimatePresence>

                {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-2 opacity-50">
                        <Activity className="animate-pulse" />
                        <p>SCANNING...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

