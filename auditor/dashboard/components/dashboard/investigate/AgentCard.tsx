"use client";

import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { Search, Scale, ShieldAlert, FileText, Lock, Activity, CheckCircle2, XCircle, LucideIcon } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { ReactNode } from "react";

interface AgentNodeData {
    role?: string;
    // Updated to include COMPLETED to match your layout logic
    status?: "THINKING" | "FAILED" | "SUCCESS" | "COMPLETED";
    title?: string;
    content?: ReactNode;
    badge?: string;
    badgeColor?: string;
    [key: string]: unknown;
}

type AgentNode = Node<AgentNodeData, "agent">;

interface AgentTheme {
    color: string;
    icon: LucideIcon;
    label: string;
}

const AGENT_THEME: Record<string, AgentTheme> = {
    trigger: { color: "bg-zinc-600", icon: Activity, label: "INPUT TRIGGER" },
    triage: { color: "bg-blue-500", icon: Search, label: "TRIAGE ARCHITECT" },
    intel: { color: "bg-purple-500", icon: FileText, label: "INTEL LIBRARIAN" },
    judge: { color: "bg-yellow-500", icon: Scale, label: "JUNIOR JUDGE" },
    ciso: { color: "bg-orange-600", icon: ShieldAlert, label: "CISO OVERSIGHT" },
    enforcer: { color: "bg-red-600", icon: Lock, label: "ENFORCER" },
};

export default function AgentCard({ data, selected }: NodeProps<AgentNode>) {
    const role = data.role as string || 'trigger';
    const theme = AGENT_THEME[role] || AGENT_THEME['trigger'];
    const Icon = theme.icon;

    // 🔒 STRICT CHECK: Only spin if explicitly THINKING
    const isThinking = data.status === "THINKING";
    const isFailed = data.status === "FAILED";

    return (
        <div className={twMerge(
            "group relative min-w-[280px] max-w-[320px] bg-[#1a1a1a] rounded-xl border border-zinc-800/50 shadow-xl transition-all duration-300 overflow-hidden",
            selected ? "ring-2 ring-green-500/50 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)] scale-[1.02]" : "hover:shadow-2xl hover:-translate-y-1"
        )}>
            {/* Input Handle */}
            <Handle type="target" position={Position.Top} className="!bg-zinc-600 !w-3 !h-3 !-top-1.5 !border-2 !border-[#1a1a1a]" />

            {/* Colored Header Strip */}
            <div className={clsx("h-1 w-full", theme.color)} />

            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {/* 🛑 ADJUSTMENT: Removed 'animate-pulse' classes. This icon is now always static */}
                        <div className={clsx("p-2 rounded-lg bg-zinc-900 ring-1 ring-inset ring-white/5")}>
                            <Icon size={16} className="text-zinc-300" />
                        </div>
                        <div>
                            <div className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">{theme.label}</div>
                            <div className="text-xs font-bold text-zinc-200">{data.title || "Processing..."}</div>
                        </div>
                    </div>

                    {/* Status Icons: Only the Activity icon spins, and only when Thinking */}
                    <div>
                        {isThinking ? (
                            <Activity size={14} className="text-blue-400" />
                        ) : isFailed ? (
                            <XCircle size={14} className="text-red-400" />
                        ) : (
                            <CheckCircle2 size={14} className="text-zinc-500 group-hover:text-green-500 transition-colors" />
                        )}
                    </div>
                </div>

                {/* Content Box */}
                <div className="bg-zinc-900/50 rounded p-2 text-[10px] font-mono text-zinc-400 border border-zinc-800/50 leading-relaxed min-h-[40px]">
                    {data.content}
                </div>

                {/* Badge (Optional) */}
                {data.badge && (
                    <div className="mt-3 flex justify-end">
                        <span className={clsx(
                            "px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider",
                            data.badgeColor || "border-zinc-700 text-zinc-400"
                        )}>{data.badge}</span>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle type="source" position={Position.Bottom} className="!bg-zinc-600 !w-3 !h-3 !-bottom-1.5 !border-2 !border-[#1a1a1a]" />
        </div>
    );
}