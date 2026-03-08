import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Plane } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getIcon(seg) {
    const id = (seg.id || '').toLowerCase();
    const label = (seg.label || '').toLowerCase();

    if (id === 'bag_drop') return '🧳';
    if (id === 'curb_to_checkin') return '🏢';
    if (id === 'walk_to_security' || id === 'walk_to_gate') return '🚶';
    if (id === 'tsa') return '🛡️';
    if (id === 'boarding_buffer') return '⏱️';
    if (id.includes('train') || label.includes('train')) return '🚆';
    if (id.includes('bus') || label.includes('bus')) return '🚌';
    if (id.includes('drive') || label.includes('ride') || label.includes('drive') || label.includes('uber') || label.includes('lyft')) return '🚗';
    if (label.includes('security') || label.includes('tsa')) return '🛡️';
    if (label.includes('walk')) return '🚶';
    if (label.includes('bag') || label.includes('luggage')) return '🧳';
    if (label.includes('check-in') || label.includes('check in') || label.includes('terminal')) return '🏢';
    if (label.includes('gate')) return '🎫';
    if (label.includes('board')) return '✈️';
    if (label.includes('leave home') || label.includes('depart')) return '🚗';
    return '📍';
}

// ── Hero time — pulses on change via key ──────────────────────────────────────
function AnimatedTime({ value }) {
    return (
        <motion.p
            key={value}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
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

// ── Single segment row (card style) ──────────────────────────────────────────
function SegmentRow({ seg, index, stepTime, isLast, hasNextNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{
                opacity: { delay: index * 0.08 + 0.1, duration: 0.3 },
                y: { delay: index * 0.08 + 0.1, duration: 0.3, ease: 'easeOut' },
                height: { duration: 0.25, ease: 'easeInOut' },
            }}
            className="flex gap-4"
        >
            {/* Left: number + connector line */}
            <div className="flex flex-col items-center pt-4" style={{ minWidth: 36 }}>
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 z-10"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        boxShadow: '0 0 0 3px rgba(99,102,241,0.18)',
                    }}
                >
                    {index + 1}
                </div>
                {(!isLast || hasNextNode) && (
                    <div
                        className="w-px flex-1 mt-2"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(99,102,241,0.4), rgba(34,197,94,0.12))',
                            minHeight: 24,
                        }}
                    />
                )}
            </div>

            {/* Right: card */}
            <div className={`flex-1 ${isLast && !hasNextNode ? 'pb-0' : 'pb-4'}`}>
                <div
                    className="w-full rounded-2xl px-5 py-4 flex flex-col gap-2"
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                    }}
                >
                    {/* Top row: emoji + label + time */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl leading-none">{getIcon(seg)}</span>
                            <span className="text-base font-semibold text-white">{seg.label}</span>
                        </div>
                        <span className="font-mono text-base font-semibold text-gray-300 shrink-0">{stepTime}</span>
                    </div>
                    {/* Bottom row: advice + duration pill */}
                    {(seg.advice || seg.duration_minutes > 0) && (
                        <div className="flex items-center justify-between gap-3 mt-0.5">
                            {seg.advice ? (
                                <p className="text-sm text-gray-500 leading-relaxed flex-1">{seg.advice}</p>
                            ) : <span />}
                            {seg.duration_minutes > 0 && (
                                <span
                                    className="text-xs font-medium px-3 py-1 rounded-full shrink-0"
                                    style={{
                                        background: 'rgba(99,102,241,0.12)',
                                        border: '1px solid rgba(99,102,241,0.2)',
                                        color: '#a5b4fc',
                                    }}
                                >
                                    {seg.duration_minutes} min
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
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
        <div className="w-full min-h-full px-10 py-8 flex flex-col items-center">
            <div className="w-full" style={{ maxWidth: 640 }}>
            <AnimatePresence mode="wait">

                {/* ── IDLE ── */}
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

                {/* ── RESULT ── */}
                {showResult && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full flex flex-col gap-0"
                    >
                        {/* HERO */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            className="w-full flex flex-col items-center text-center pb-8"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <p className="text-xs font-bold uppercase mb-3" style={{ color: '#60a5fa', letterSpacing: '0.22em' }}>
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

                        {/* TIMELINE */}
                        <div className="w-full pt-6 pb-2 flex flex-col">
                            <AnimatePresence>
                                {recommendation.segments.map((seg, i) => {
                                    const cumulativeBefore = recommendation.segments
                                        .slice(0, i)
                                        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
                                    const stepTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);
                                    const isLast = i === recommendation.segments.length - 1;

                                    return (
                                        <SegmentRow
                                            key={seg.id || seg.label}
                                            seg={seg}
                                            index={i}
                                            stepTime={stepTime}
                                            isLast={isLast}
                                            hasNextNode={isLast && !!selectedFlight}
                                        />
                                    );
                                })}
                            </AnimatePresence>

                            {/* Boarding final node */}
                            {selectedFlight && (
                                <motion.div
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: recommendation.segments.length * 0.08 + 0.15,
                                        duration: 0.3,
                                        ease: 'easeOut',
                                    }}
                                    className="flex gap-4"
                                >
                                    <div className="flex flex-col items-center pt-4" style={{ minWidth: 36 }}>
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 z-10"
                                            style={{
                                                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                                boxShadow: '0 0 0 3px rgba(34,197,94,0.18)',
                                            }}
                                        >
                                            ✓
                                        </div>
                                    </div>
                                    <div className="flex-1 pb-2">
                                        <div
                                            className="w-full rounded-2xl px-5 py-4 flex flex-col gap-2"
                                            style={{
                                                background: 'rgba(34,197,94,0.07)',
                                                border: '1px solid rgba(34,197,94,0.2)',
                                            }}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl leading-none">✈️</span>
                                                    <span className="text-base font-semibold text-green-400">Boarding</span>
                                                </div>
                                                <span className="font-mono text-base font-semibold" style={{ color: '#4ade80' }}>{boarding}</span>
                                            </div>
                                            <p className="text-sm text-gray-500">Flight departs {departureTime}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* FOOTER STATS */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: recommendation.segments.length * 0.08 + 0.4, duration: 0.4 }}
                            className="w-full flex gap-3 pt-6 pb-2"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <StatCard label="Total Journey" value={totalToHM(totalMinutes)} />
                            <StatCard label="Gate Cushion" value={totalToHM(gateCushion)} valueColor="#4ade80" />
                            {selectedFlight && <StatCard label="Departs" value={departureTime} />}
                        </motion.div>
                    </motion.div>
                )}

            </AnimatePresence>
            </div>
            </div>
        </div>
    );
}