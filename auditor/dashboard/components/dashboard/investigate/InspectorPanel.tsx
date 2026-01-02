"use client";

import { X, Copy, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InspectorPanel({ selectedNode, onClose }: { selectedNode: any, onClose: () => void }) {
  if (!selectedNode) return null;

  const data = selectedNode.data;
  
  return (
    <AnimatePresence>
        <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-4 right-4 bottom-4 w-[400px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-green-500" />
                    <span className="text-xs font-bold text-zinc-200">NODE INSPECTOR</span>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                    <X size={14} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                
                {/* Section 1: Overview */}
                <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Agent Role</label>
                    <div className="text-sm font-bold text-white uppercase">{data.role}</div>
                </div>

                {/* Section 2: The Output */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Output Payload</label>
                        <button className="text-[10px] flex items-center gap-1 text-zinc-500 hover:text-green-500" onClick={() => navigator.clipboard.writeText(JSON.stringify(data.fullOutput, null, 2))}>
                            <Copy size={10} /> COPY
                        </button>
                    </div>
                    <div className="bg-black/50 rounded-lg border border-zinc-800 p-3 overflow-x-auto">
                        <pre className="text-[10px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {JSON.stringify(data.fullOutput, null, 2)}
                        </pre>
                    </div>
                </div>

                {/* Section 3: Metadata */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                    <div>
                        <label className="text-[10px] text-zinc-600 block">Status</label>
                        <span className="text-xs text-zinc-300">{data.status}</span>
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-600 block">Timestamp</label>
                        <span className="text-xs text-zinc-300">{data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '-'}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    </AnimatePresence>
  );
}
