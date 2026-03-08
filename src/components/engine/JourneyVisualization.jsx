import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane } from 'lucide-react';

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

function parseDepartureAndGetBoardingTime(localTimeStr) {
    if (!localTimeStr) return { boarding: '', departure: '' };
    const match = localTimeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return { boarding: localTimeStr, departure: localTimeStr };
    const d = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]));
    const boardingDate = new Date(d.getTime() - 30 * 60000);
    const fmt = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { boarding: fmt(boardingDate), departure: fmt(d) };
}

function totalToHM(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

const SEGMENT_ICONS = {
    'leave home': '🏠',
    'arrive airport': '🚗',
    'through tsa': '🛡️',
    'tsa': '🛡️',
    'security': '🛡️',
    'at gate': '🎫',
    'gate': '🎫',
    'boarding': '✈️',
};

function getIcon(label) {
    if (!label) return '📍';
    const lower = label.toLowerCase();
    for (const [key, icon] of Object.entries(SEGMENT_ICONS)) {
        if (lower.includes(key)) return icon;
    }
    return '📍';
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

    // Gate cushion = time between last segment end and departure
    const gateCushion = recommendation && selectedFlight
        ? (() => {
            const departure = new Date(selectedFlight.departure_time);
            const leaveHome = new Date(recommendation.leave_home_at);
            const arrivalAtGate = new Date(leaveHome.getTime() + totalMinutes * 60000);
            const cushion = Math.round((departure - arrivalAtGate) / 60000);
            return cushion > 0 ? cushion : 0;
        })()
        : 0;

    return (
        <div className="w-full min-h-full py-8 px-8">
            <div className="w-full max-w-2xl mx-auto">
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
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="w-full rounded-3xl overflow-hidden"
                            style={{ background: 'rgba(15,15,35,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                            {/* HERO */}
                            <div className="flex flex-col items-center text-center px-8 pt-8 pb-8 mb-2"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-2">Leave Home By</p>
                                <p className="font-black text-white leading-none mb-3" style={{ fontSize: 72, letterSpacing: '-2px' }}>
                                    {formatUTCToLocal(recommendation.leave_home_at)}
                                </p>
                                {selectedFlight && (
                                    <p className="text-gray-400 text-sm font-medium mb-3">
                                        {selectedFlight.flight_number} · {selectedFlight.origin_code} → {selectedFlight.destination_code} · {totalToHM(totalMinutes)} door-to-gate
                                    </p>
                                )}
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-green-400 text-sm font-semibold">{confidenceScore}% Confident</span>
                                </div>
                            </div>

                            {/* TIMELINE */}
                            <div className="px-8 py-6 flex flex-col">
                                {recommendation.segments.map((seg, i) => {
                                    const cumulativeBefore = recommendation.segments
                                        .slice(0, i)
                                        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
                                    const stepTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);
                                    const isLast = i === recommendation.segments.length - 1;

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 + 0.15, duration: 0.35, ease: 'easeOut' }}
                                            className="flex gap-4 relative"
                                        >
                                            {/* Line + Circle column */}
                                            <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 z-10"
                                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 0 3px rgba(99,102,241,0.2)' }}>
                                                    {i + 1}
                                                </div>
                                                {!isLast && (
                                                    <div className="w-0.5 flex-1 my-1"
                                                        style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.5), rgba(99,102,241,0.15))', minHeight: 32 }} />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className={`flex-1 flex flex-col gap-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{getIcon(seg.label)}</span>
                                                        <span className="text-base font-bold text-white">{seg.label}</span>
                                                    </div>
                                                    <span className="text-base font-bold text-blue-300 shrink-0 ml-2">{stepTime}</span>
                                                </div>
                                                {seg.advice && (
                                                    <p className="text-xs text-gray-500 leading-relaxed ml-8">{seg.advice}</p>
                                                )}
                                                {seg.duration_minutes > 0 && (
                                                    <div className="ml-8 mt-0.5">
                                                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                                                            style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                            {seg.duration_minutes} min estimated
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {/* Boarding final node */}
                                {selectedFlight && (() => {
                                    const { boarding, departure } = parseDepartureAndGetBoardingTime(selectedFlight.departure_time);
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: recommendation.segments.length * 0.1 + 0.15, duration: 0.35 }}
                                            className="flex gap-4 relative mt-0"
                                        >
                                            {/* Line + Circle column */}
                                            <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 z-10"
                                                    style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }}>
                                                    ✓
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1 pb-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">✈️</span>
                                                        <span className="text-base font-bold text-green-400">Boarding</span>
                                                    </div>
                                                    <span className="text-base font-bold text-green-300 shrink-0 ml-2">
                                                        {boarding}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 ml-8">
                                                    Flight departs {departure}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })()}
                            </div>

                            {/* FOOTER STATS */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.4 }}
                                className="flex items-center justify-between px-8 py-6"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                            >
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-1">Total Journey</p>
                                    <p className="text-2xl font-black text-white">{totalToHM(totalMinutes)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-1">Gate Cushion</p>
                                    <p className="text-2xl font-black text-green-400">{totalToHM(gateCushion)}</p>
                                </div>
                                {selectedFlight && (() => {
                                    const { departure } = parseDepartureAndGetBoardingTime(selectedFlight.departure_time);
                                    return (
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-1">Departs</p>
                                            <p className="text-2xl font-black text-white">{departure}</p>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}