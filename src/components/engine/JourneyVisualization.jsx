import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Plane } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function getIcon(label) {
    if (!label) return '📍';
    const lower = label.toLowerCase();
    if (lower.includes('train')) return '🚆';
    if (lower.includes('bus')) return '🚌';
    if (lower.includes('drive') || lower.includes('driving') || lower.includes('uber') || lower.includes('lyft') || lower.includes('rideshare') || lower.includes('ride')) return '🚗';
    if (lower.includes('leave home') || lower.includes('depart home')) return '🚗';
    if (lower.includes('check-in') || lower.includes('check in') || lower.includes('curb') || lower.includes('terminal')) return '🏢';
    if (lower.includes('bag') || lower.includes('luggage')) return '🧳';
    if (lower.includes('walk')) return '🚶';
    if (lower.includes('tsa') || lower.includes('security')) return '🛡️';
    if (lower.includes('gate')) return '🎫';
    if (lower.includes('buffer') || lower.includes('wait')) return '⏱️';
    if (lower.includes('board')) return '✈️';
    if (lower.includes('arrive airport') || lower.includes('arrival')) return '🏢';
    return '📍';
}

// ── Animated number that pulses when value changes ────────────────────────────
function AnimatedTime({ value }) {
    const controls = useAnimationControls();
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value && prevValue.current !== '') {
            controls.start({
                scale: [1, 1.06, 1],
                transition: { duration: 0.35, ease: 'easeInOut' },
            });
        }
        prevValue.current = value;
    }, [value]);

    return (
        <motion.p
            animate={controls}
            className="font-extrabold leading-none mb-3"
            style={{
                fontSize: 76,
                letterSpacing: '-3px',
                background: 'linear-gradient(135deg, #ffffff 40%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}
        >
            {value}
        </motion.p>
    );
}

// ── Time label that flashes blue when value changes ───────────────────────────
function FlashingTime({ value }) {
    const [flash, setFlash] = useState(false);
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value && prevValue.current !== '') {
            setFlash(true);
            const t = setTimeout(() => setFlash(false), 350);
            return () => clearTimeout(t);
        }
        prevValue.current = value;
    }, [value]);

    return (
        <span
            className="font-mono text-base shrink-0 ml-4 transition-colors duration-300"
            style={{ color: flash ? '#60a5fa' : '#9ca3af' }}
        >
            {value}
        </span>
    );
}

// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow({ delay }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity, delay }}
            className="flex gap-4 pb-6"
        >
            <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
                <div className="w-8 h-8 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="w-0.5 flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.05)', minHeight: 32 }} />
            </div>
            <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                    <div className="h-4 rounded-full w-32" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <div className="h-4 rounded-full w-16" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div className="h-3 rounded-full w-48" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="h-5 rounded-full w-24" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
        </motion.div>
    );
}

// ── Segment row ───────────────────────────────────────────────────────────────
function SegmentRow({ seg, index, stepTime, isLast, isConnectedToFinal }) {
    return (
        <motion.div
            layout
            key={seg.label + index}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
            transition={{
                layout: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { delay: index * 0.08 + 0.1, duration: 0.35 },
                y: { delay: index * 0.08 + 0.1, duration: 0.35, ease: 'easeOut' },
            }}
            className="flex gap-4 relative"
        >
            {/* Connector column */}
            <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 z-10"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        boxShadow: '0 0 0 3px rgba(99,102,241,0.18)',
                    }}
                >
                    {index + 1}
                </div>
                {(!isLast || isConnectedToFinal) && (
                    <div
                        className="w-px flex-1 my-1"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(99,102,241,0.45), rgba(34,197,94,0.15))',
                            minHeight: 32,
                        }}
                    />
                )}
            </div>

            {/* Content */}
            <div className={`flex-1 flex flex-col gap-1.5 ${isLast && !isConnectedToFinal ? 'pb-0' : 'pb-5'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="text-lg leading-none">{getIcon(seg.label)}</span>
                        <span className="text-base font-semibold text-white">{seg.label}</span>
                    </div>
                    <FlashingTime value={stepTime} />
                </div>
                {seg.advice && (
                    <p className="text-sm text-gray-500 leading-relaxed ml-9">{seg.advice}</p>
                )}
                {seg.duration_minutes > 0 && (
                    <div className="ml-9 mt-0.5">
                        <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#a5b4fc',
                            }}
                        >
                            {seg.duration_minutes} min
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, valueColor = '#ffffff' }) {
    return (
        <div
            className="flex-1 flex flex-col gap-1.5 px-5 py-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">{label}</p>
            <p className="text-2xl font-bold" style={{ color: valueColor }}>{value}</p>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
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

    const gateCushion = recommendation && selectedFlight
        ? (() => {
            const departure = new Date(selectedFlight.departure_time);
            const leaveHome = new Date(recommendation.leave_home_at);
            const arrivalAtGate = new Date(leaveHome.getTime() + totalMinutes * 60000);
            const cushion = Math.round((departure - arrivalAtGate) / 60000);
            return cushion > 0 ? cushion : 0;
        })()
        : 0;

    const { boarding, departure: departureTime } = selectedFlight
        ? parseDepartureAndGetBoardingTime(selectedFlight.departure_time)
        : { boarding: '', departure: '' };

    const showResult = locked && recommendation;

    return (
        <div className="w-full min-h-full px-10 py-8">
            <AnimatePresence mode="wait">

                {/* ── IDLE STATE ── */}
                {!showResult && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center text-center gap-7 py-32"
                    >
                        <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
                            className="w-24 h-24 rounded-3xl flex items-center justify-center"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.09)',
                                boxShadow: '0 0 40px rgba(99,102,241,0.1)',
                            }}
                        >
                            <Plane className="w-10 h-10 text-gray-500" />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2 leading-snug">Your journey<br />starts here</h2>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                                Configure your trip on the left.<br />Your departure timeline will appear here.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.2, 0.7, 0.2] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.35 }}
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: 'rgba(96,165,250,0.6)' }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── RESULT STATE ── */}
                {showResult && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full flex flex-col gap-0"
                    >
                        {/* ── HERO ── */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            className="w-full flex flex-col items-center text-center pb-8"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <p
                                className="text-xs font-bold uppercase tracking-widest mb-3"
                                style={{ color: '#60a5fa', letterSpacing: '0.22em' }}
                            >
                                Leave Home By
                            </p>
                            <AnimatedTime value={formatUTCToLocal(recommendation.leave_home_at)} />
                            {selectedFlight && (
                                <p className="text-gray-400 text-sm font-medium mb-4">
                                    {selectedFlight.flight_number} · {selectedFlight.origin_code} → {selectedFlight.destination_code} · {totalToHM(totalMinutes)} door-to-gate
                                </p>
                            )}
                            <div
                                className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
                            >
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-green-400 text-sm font-semibold">{confidenceScore}% Confident</span>
                            </div>
                        </motion.div>

                        {/* ── TIMELINE ── */}
                        <div className="w-full pt-7 pb-2 flex flex-col">
                            <AnimatePresence>
                                {recommendation.segments.map((seg, i) => {
                                    const cumulativeBefore = recommendation.segments
                                        .slice(0, i)
                                        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
                                    const stepTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);
                                    const isLast = i === recommendation.segments.length - 1;

                                    return (
                                        <SegmentRow
                                            key={seg.label + i}
                                            seg={seg}
                                            index={i}
                                            stepTime={stepTime}
                                            isLast={isLast}
                                            isConnectedToFinal={isLast && !!selectedFlight}
                                        />
                                    );
                                })}
                            </AnimatePresence>

                            {/* Final boarding node */}
                            {selectedFlight && (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: recommendation.segments.length * 0.08 + 0.15,
                                        duration: 0.35,
                                        ease: 'easeOut',
                                    }}
                                    className="flex gap-4"
                                >
                                    <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 z-10"
                                            style={{
                                                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                                boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
                                            }}
                                        >
                                            ✓
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1.5 pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-lg leading-none">✈️</span>
                                                <span className="text-base font-semibold text-green-400">Boarding</span>
                                            </div>
                                            <span className="font-mono text-base shrink-0 ml-4" style={{ color: '#4ade80' }}>
                                                {boarding}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 ml-9">Flight departs {departureTime}</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* ── FOOTER STATS ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: recommendation.segments.length * 0.08 + 0.4, duration: 0.4 }}
                            className="w-full flex gap-3 pt-6 pb-2"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <StatCard label="Total Journey" value={totalToHM(totalMinutes)} />
                            <StatCard label="Gate Cushion" value={totalToHM(gateCushion)} valueColor="#4ade80" />
                            {selectedFlight && (
                                <StatCard label="Departs" value={departureTime} />
                            )}
                        </motion.div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}