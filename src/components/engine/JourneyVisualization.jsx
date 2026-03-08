import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, CheckCircle2 } from 'lucide-react';

function formatUTCToLocal(utcStr) {
    if (!utcStr) return '';
    const d = new Date(utcStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function addMinutesAndFormat(utcStr, minutes) {
    const d = new Date(utcStr);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function JourneyVisualization({ locked, recommendation, selectedFlight, transport, profile, confidenceColorMap, onReady }) {

    useEffect(() => {
        if (locked && recommendation && onReady) {
            const t = setTimeout(onReady, 600);
            return () => clearTimeout(t);
        }
    }, [locked, recommendation]);

    const totalMinutes = recommendation?.segments
        ? recommendation.segments.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
        : 0;

    const confidenceScore = recommendation
        ? Math.round((recommendation.confidence_score || 0) * 100)
        : 0;

    return (
        <div className="w-full min-h-full py-10 px-6">
            <div className="max-w-2xl mx-auto">
                <AnimatePresence mode="wait">

                    {/* ── IDLE STATE ── */}
                    {(!locked || !recommendation) && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center text-center gap-6 py-24"
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                                <Plane className="w-9 h-9 text-gray-500" />
                            </motion.div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2 leading-snug">Your journey<br />starts here</h2>
                                <p className="text-gray-500 text-sm leading-relaxed">Configure your trip on the left.<br />Your door-to-gate plan will appear here.</p>
                            </div>
                            <div className="flex gap-2.5">
                                {[0, 1, 2].map(i => (
                                    <motion.div key={i}
                                        animate={{ opacity: [0.2, 0.7, 0.2] }}
                                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.35 }}
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: 'rgba(59,130,246,0.5)' }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── RESULT STATE ── */}
                    {locked && recommendation && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-col gap-10"
                        >
                            {/* HERO */}
                            <motion.div
                                initial={{ opacity: 0, y: -16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col items-center text-center gap-3 pt-4"
                            >
                                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400">Leave Home By</p>

                                <p className="font-black text-white leading-none" style={{ fontSize: 64 }}>
                                    {formatUTCToLocal(recommendation.leave_home_at)}
                                </p>

                                {selectedFlight && (
                                    <p className="text-gray-400 text-sm font-medium">
                                        {selectedFlight.flight_number} · {selectedFlight.origin_code} → {selectedFlight.destination_code} · {totalMinutes}m door-to-gate
                                    </p>
                                )}

                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full mt-1"
                                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-green-400 text-xs font-bold">{confidenceScore}% Confident</span>
                                </div>
                            </motion.div>

                            {/* VERTICAL TIMELINE */}
                            <div className="relative flex flex-col gap-0 pl-8">
                                {/* Vertical gradient line */}
                                <div className="absolute left-[15px] top-3 bottom-3 w-0.5 rounded-full"
                                    style={{ background: 'linear-gradient(to bottom, #6366f1, #22c55e)' }} />

                                {recommendation.segments.map((seg, i) => {
                                    const cumulativeBefore = recommendation.segments
                                        .slice(0, i)
                                        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
                                    const stepTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 + 0.2, duration: 0.4, ease: 'easeOut' }}
                                            className="relative flex gap-4 pb-8"
                                        >
                                            {/* Circle on line */}
                                            <div className="absolute -left-8 w-8 flex items-start justify-center pt-0.5">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white z-10 shrink-0"
                                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: '2px solid rgba(99,102,241,0.4)' }}>
                                                    {i + 1}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex flex-col gap-1 pl-2 pt-0.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-bold text-white">{seg.label}</span>
                                                    {seg.duration_minutes > 0 && (
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                                                            {seg.duration_minutes}m
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-semibold text-blue-300">{stepTime}</p>
                                                {seg.advice && (
                                                    <p className="text-xs text-gray-500 leading-relaxed">{seg.advice}</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {/* Final boarding node */}
                                {selectedFlight && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: (recommendation.segments.length) * 0.1 + 0.2, duration: 0.4 }}
                                        className="relative flex gap-4 pb-4"
                                    >
                                        <div className="absolute -left-8 w-8 flex items-start justify-center pt-0.5">
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center z-10 shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: '2px solid rgba(34,197,94,0.4)' }}>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 pl-2 pt-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-green-400">Boarding</span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                    style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                                                    Departs
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-green-300">
                                                {formatUTCToLocal(selectedFlight.departure_time)}
                                            </p>
                                            <p className="text-xs text-gray-500">Gate closes — you're ready to fly.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* FOOTER STATS */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.4 }}
                                className="grid grid-cols-2 gap-3 pb-6"
                            >
                                <div className="rounded-2xl p-4 flex flex-col gap-1"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500">Total Journey</p>
                                    <p className="text-2xl font-black text-white">{totalMinutes}<span className="text-sm font-semibold text-gray-400 ml-1">min</span></p>
                                </div>
                                <div className="rounded-2xl p-4 flex flex-col gap-1"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500">Boarding</p>
                                    <p className="text-2xl font-black text-white">
                                        {selectedFlight ? formatUTCToLocal(selectedFlight.departure_time) : '—'}
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}