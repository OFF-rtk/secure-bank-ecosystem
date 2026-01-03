"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, Fingerprint, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [scanComplete, setScanComplete] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setScanComplete(false)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
                setIsLoading(false)
                return
            }

            // Show scan complete animation before redirect
            setScanComplete(true)
            setTimeout(() => {
                router.push("/")
                router.refresh()
            }, 1000)
        } catch {
            setError("An unexpected error occurred")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black font-mono flex items-center justify-center p-4 overflow-hidden">
            {/* Animated grid background */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    animation: 'gridMove 20s linear infinite'
                }}
            />

            {/* Noise overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

            {/* Radial glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-lg p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-block mb-4"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{
                                        boxShadow: scanComplete
                                            ? "0 0 40px rgba(34, 197, 94, 0.5)"
                                            : isLoading
                                                ? ["0 0 20px rgba(34, 197, 94, 0.2)", "0 0 40px rgba(34, 197, 94, 0.4)", "0 0 20px rgba(34, 197, 94, 0.2)"]
                                                : "0 0 20px rgba(34, 197, 94, 0.2)"
                                    }}
                                    transition={{ duration: 1.5, repeat: isLoading && !scanComplete ? Infinity : 0 }}
                                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-500 ${scanComplete
                                        ? "bg-green-500/20 border-green-500/50"
                                        : "bg-green-500/10 border-green-900/50"
                                        } border`}
                                >
                                    {scanComplete ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200 }}
                                        >
                                            <Shield className="w-10 h-10 text-green-500" />
                                        </motion.div>
                                    ) : (
                                        <Fingerprint className={`w-10 h-10 ${isLoading ? "text-green-400" : "text-green-500"}`} />
                                    )}
                                </motion.div>

                                {/* Scanning ring animation */}
                                {isLoading && !scanComplete && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 1 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full border-2 border-green-500"
                                    />
                                )}
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="text-2xl font-bold text-white mb-2 tracking-tight"
                        >
                            SENTINEL <span className="text-green-500">ACCESS</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="text-zinc-500 text-xs tracking-widest uppercase"
                        >
                            Auditor Authentication Portal
                        </motion.p>
                    </div>

                    {/* Form */}
                    <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        onSubmit={handleLogin}
                        className="space-y-5"
                    >
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-[10px] font-bold text-zinc-500 mb-2 tracking-widest uppercase">
                                Operator ID
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="operator@sentinel.io"
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all disabled:opacity-50 font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-[10px] font-bold text-zinc-500 mb-2 tracking-widest uppercase">
                                Access Key
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 pr-12 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all disabled:opacity-50 font-mono text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-900/50"
                            >
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="text-red-400 text-xs font-mono">{error}</span>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm tracking-wide"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {scanComplete ? "ACCESS GRANTED" : "AUTHENTICATING..."}
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5" />
                                    INITIATE VERIFICATION
                                </>
                            )}
                        </button>
                    </motion.form>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-6 pt-6 border-t border-zinc-800"
                    >
                        <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="tracking-widest uppercase">Secure Connection Established</span>
                        </div>
                    </motion.div>
                </div>

                {/* Terminal-style security info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="mt-4 text-center"
                >
                    <p className="text-zinc-600 text-[10px] font-mono tracking-widest">
                        PROTOCOL: TLS 1.3 | CIPHER: AES-256-GCM | SESSION: ENCRYPTED
                    </p>
                </motion.div>
            </motion.div>

            {/* CSS for grid animation */}
            <style jsx global>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
      `}</style>
        </div>
    )
}
