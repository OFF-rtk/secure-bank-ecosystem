"use client"

import { motion } from "framer-motion"
import { ShieldX, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function AccessDenied() {
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    return (
        <div className="min-h-screen bg-black font-mono flex items-center justify-center p-4">
            {/* Background grid effect */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Noise overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 text-center"
            >
                {/* Shield Icon with pulse animation */}
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="relative inline-block">
                        <motion.div
                            animate={{
                                boxShadow: [
                                    "0 0 20px rgba(239, 68, 68, 0.2)",
                                    "0 0 40px rgba(239, 68, 68, 0.4)",
                                    "0 0 20px rgba(239, 68, 68, 0.2)"
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-24 h-24 rounded-full bg-red-500/10 border border-red-900/50 flex items-center justify-center mx-auto"
                        >
                            <ShieldX className="w-12 h-12 text-red-500" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-3xl font-bold text-white mb-4 tracking-tight"
                >
                    ACCESS <span className="text-red-500">DENIED</span>
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-zinc-500 text-sm mb-8 max-w-md"
                >
                    You do not have administrator privileges to access the Sentinel Auditor Dashboard.
                </motion.p>

                {/* Security Code */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mb-8"
                >
                    <div className="inline-block px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
                        <span className="text-zinc-600 text-[10px] tracking-widest uppercase">ERROR CODE: </span>
                        <span className="text-red-400 text-xs">AUTH_403_INSUFFICIENT_PRIVILEGES</span>
                    </div>
                </motion.div>

                {/* Logout Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    onClick={handleLogout}
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white transition-all duration-200 cursor-pointer text-sm tracking-wide"
                >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    SIGN OUT
                </motion.button>
            </motion.div>
        </div>
    )
}
