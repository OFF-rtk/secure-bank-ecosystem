"use client";

import { useEffect, useState, useMemo, useCallback, use } from "react";
import { ReactFlow, Background, Controls, Edge, Node, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from "@/lib/supabaseClient";
import AgentCard from "@/components/dashboard/investigate/AgentCard";
import InspectorPanel from "@/components/dashboard/investigate/InspectorPanel";
import MetadataPanel from "@/components/dashboard/investigate/MetadataPanel";
import Link from "next/link";
import { ArrowLeft, Play, Activity } from "lucide-react";

const nodeTypes = { agent: AgentCard };

// 📐 CONFIG: Input is back at 0
const COLUMN_CONFIG: Record<string, number> = {
    'trigger': 0,   // Input Node
    'triage': 1,
    'intel': 2,
    'judge': 3,
    'ciso': 3,      // CISO stacks with Judge
    'enforcer': 4
};

const COL_WIDTH = 350;
const ROW_HEIGHT = 180;

export default function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // State
    const [log, setLog] = useState<any>(null);
    const [traceHistory, setTraceHistory] = useState<any[]>([]);
    const [visibleCount, setVisibleCount] = useState<number>(0);
    const [isReplaying, setIsReplaying] = useState(false);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // Fetch Logic
    useEffect(() => {
        const init = async () => {
            const { data: logData } = await supabase.from("audit_logs").select("*").eq("event_id", id).single();
            if (logData) setLog(logData);

            const { data: traces } = await supabase.from("agent_traces").select("*").eq("event_id", id).order("id", { ascending: true });
            if (traces) {
                setTraceHistory(traces);
                setVisibleCount(traces.length);
            }
        };
        init();

        const channel = supabase.channel(`trace-${id}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_traces", filter: `event_id=eq.${id}` }, (payload) => {
                setTraceHistory(prev => {
                    const newHistory = [...prev, payload.new];
                    if (!isReplaying) setVisibleCount(newHistory.length);
                    return newHistory;
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [id, isReplaying]);

    // Replay Logic
    const runReplay = useCallback(() => {
        if (isReplaying) return;
        setIsReplaying(true);
        setVisibleCount(0);
        setSelectedNode(null);

        let step = 0;
        // We add 1 extra step for the Input Node which is always there 
        // but we want to simulate the "flow" starting
        const totalSteps = traceHistory.length;

        const interval = setInterval(() => {
            step++;
            setVisibleCount(step);
            if (step >= totalSteps) {
                clearInterval(interval);
                setIsReplaying(false);
            }
        }, 600);

    }, [traceHistory, isReplaying]);

    // Graph Logic
    const { nodes, edges } = useMemo(() => {
        const currentTraces = traceHistory.slice(0, visibleCount);
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const columnDepths: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

        // --- 1. The Input Node (Restored!) ---
        if (log) {
            newNodes.push({
                id: 'input',
                position: { x: 0, y: 0 },
                type: 'agent',
                data: {
                    role: 'trigger',
                    title: 'INCOMING SIGNAL',
                    content: `${log.payload.action_context?.action_type || 'Event'} via ${log.payload.network_context?.ip_address}`,
                    fullOutput: log.payload,
                    status: 'SUCCESS', // Always green
                    timestamp: log.created_at
                }
            });
            columnDepths[0] += 1;
        }

        // --- 2. The Agents ---
        currentTraces.forEach((trace, index) => {
            const nodeId = `trace-${trace.id}`;
            const roleKey = trace.agent_role.toLowerCase();

            const colIndex = COLUMN_CONFIG[roleKey] ?? 1;
            const rowIndex = columnDepths[colIndex];

            const xPos = colIndex * COL_WIDTH;
            const yPos = rowIndex * ROW_HEIGHT;
            columnDepths[colIndex] += 1;

            let content = trace.output.msg || "Processing...";
            let badge = null, badgeColor = "";

            if (trace.agent_role === "TRIAGE" && trace.status === "COMPLETED") {
                content = trace.output.risk === "HIGH" ? `Risk HIGH. Vectors detected.` : `Risk LOW.`;
            }
            if ((trace.agent_role === "JUDGE" || trace.agent_role === "CISO") && trace.output.verdict) {
                badge = trace.output.verdict;
                badgeColor = badge === "BLOCK" ? "border-red-500 text-red-500" : "border-green-500 text-green-500";
            }
            if (trace.agent_role === "ENFORCER" && trace.output.action === "SESSION_TERMINATED") {
                badge = "KILLED";
                badgeColor = "border-red-600 bg-red-900 text-white";
            }

            newNodes.push({
                id: nodeId,
                position: { x: xPos, y: yPos },
                type: 'agent',
                data: {
                    role: roleKey,
                    title: `${trace.agent_role}`,
                    content: content,
                    fullOutput: trace.output,
                    status: trace.status,
                    badge, badgeColor,
                    timestamp: trace.created_at
                }
            });

            // Edges
            // First agent connects to Input, others connect to previous agent
            const prevNodeId = index === 0 ? 'input' : `trace-${currentTraces[index - 1].id}`;

            newEdges.push({
                id: `e-${prevNodeId}-${nodeId}`,
                source: prevNodeId,
                target: nodeId,
                animated: trace.status === "THINKING",
                type: 'smoothstep',
                style: { stroke: trace.status === "FAILED" ? '#ef4444' : '#555', strokeWidth: 2 }
            });
        });

        return { nodes: newNodes, edges: newEdges };
    }, [traceHistory, visibleCount, log]);


    if (!log) return <div className="h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono">LOADING_CASE_FILE...</div>;

    return (
        <div className="h-screen w-full bg-[#09090b] flex flex-col font-mono overflow-hidden">

            {/* Header */}
            <header className="flex-none h-14 px-4 border-b border-zinc-800 bg-[#09090b] flex justify-between items-center z-30 relative">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><ArrowLeft size={18} /></Link>
                    <div>
                        <h1 className="text-xs font-bold text-zinc-100 tracking-wider">INVESTIGATION ID: <span className="text-green-500 font-mono">{log.event_id}</span></h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={runReplay} disabled={isReplaying} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isReplaying ? 'bg-zinc-800 text-zinc-500' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                        {isReplaying ? <Activity size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                        {isReplaying ? 'REPLAYING...' : 'RUN SIMULATION'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar */}
                <div className="flex-none z-20">
                    <MetadataPanel log={log} />
                </div>

                {/* Right Canvas */}
                <div className="flex-1 relative bg-black">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodeClick={(_, node) => setSelectedNode(node)}
                        defaultViewport={{ x: 50, y: 150, zoom: 1 }}
                        minZoom={0.1}
                        maxZoom={1.5}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background color="#222" gap={24} size={1} variant={BackgroundVariant.Dots} />
                        <Controls className="!bg-zinc-800 !border-zinc-700 !fill-zinc-400 !rounded-lg !shadow-xl" />
                    </ReactFlow>

                    <InspectorPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />

                    {/* Waiting State */}
                    {nodes.length === 1 && !isReplaying && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full text-zinc-500 text-xs backdrop-blur-sm animate-pulse">
                            Waiting for Agents to start...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}