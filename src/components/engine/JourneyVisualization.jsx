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
    if (lower.includes('leave home') || lower.includes('depart home')) return '🏠';
    if (lower.includes('check-in') || lower.includes('check in') || lower.includes('curb')) return '🧳';
    if (lower.includes('bag') || lower.includes('luggage')) return '🧳';
    if (lower.includes('walk to gate') || lower.includes('gate')) return '🚶';
    if (lower.includes('walk')) return '🚶';
    if (lower.includes('tsa') || lower.includes('security')) return '🛡️';
    if (lower.includes('terminal')) return '🏢';
    if (lower.includes('buffer') || lower.includes('wait')) return '⏱️';
    if (lower.includes('board')) return '✈️';
    if (lower.includes('arrive airport') || lower.includes('arrival') || lower.includes('airport')) return '🏢';
    return '📍';
}

// Icon background colors per step type
function getIconBg(label) {
    if (!label) return 'rgba(99,102,241,0.15)';
    const lower = label.toLowerCase();
    if (lower.includes('train') || lower.includes('bus') || lower.includes('drive') || lower.includes('driving') || lower.includes('uber') || lower.includes('lyft') || lower.includes('ride') || lower.includes('leave home')) return 'rgba(59,130,246,0.18)';
    if (lower.includes('tsa') || lower.includes('security')) return 'rgba(245,158,11,0.18)';
    if (lower.includes('walk') || lower.includes('curb') || lower.includes('check')) return 'rgba(99,102,241,0.18)';
    if (lower.includes('gate') || lower.includes('board')) return 'rgba(34,197,94,0.15)';
    return 'rgba(99,102,241,0.15)';
}

// ── Animated big time that pulses + shakes when value changes ─────────────────
function AnimatedHeroTime({ value }) {
    const controls = useAnimationControls();
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value && prevValue.current !== '') {
            controls.start({
                scale: [1, 1.08, 0.97, 1.03, 1],
                x: [0, -4, 4, -2, 0],
                transition: { duration: 0.5, ease: 'easeInOut' },
            });
        }
        prevValue.current = value;
    }, [value]);

    return (
        <motion.p
            animate={controls}
            className="font-extrabold leading-none mb-2"
            style={{
                fontSize: 68,
                letterSpacing: '-2px',
                background: 'linear-gradient(135deg, #ffffff 50%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}
        >
            {value}
        </motion.p>
    );
}

// ── Animated time value for step cards ────────────────────────────────────────
function AnimatedStepTime({ value }) {
    const controls = useAnimationControls();
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value && prevValue.current !== '') {
            controls.start({
                scale: [1, 1.15, 0.95, 1.05, 1],
                color: ['#e5e7eb', '#60a5fa', '#e5e7eb'],
                transition: { duration: 0.45, ease: 'easeInOut' },
            });
        }
        prevValue.current = value;
    }, [value]);

    return (
        <motion.span
            animate={controls}
            className="text-base font-bold"
            style={{ color: '#e5e7eb', fontVariantNumeric: 'tabular-nums' }}
        >
            {value}
        </motion.span>
    );
}

// ── Animated duration that shakes when value changes ─────────────────────────
function AnimatedDuration({ value }) {
    const controls = useAnimationControls();
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value && prevValue.current !== '') {
            controls.start({
                scale: [1, 1.2, 0.9, 1.1, 1],
                color: ['#9ca3af', '#60a5fa', '#9ca3af'],
                transition: { duration: 0.4 },
            });
        }
        prevValue.current = value;
    }, [value]);

    return (
        <motion.span
            animate={controls}
            className="text-sm"
            style={{ color: '#9ca3af' }}
        >
            {value} min
        </motion.span>
    );
}

// ── Single step card ──────────────────────────────────────────────────────────
function StepCard({ seg, stepTime, index }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
            transition={{
                layout: { type: 'spring', stiffness: 280, damping: 28 },
                opacity: { delay: index * 0.09 + 0.05, duration: 0.35 },
                y: { delay: index * 0.09 + 0.05, duration: 0.38, ease: [0.22, 1, 0.36, 1] },
            }}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            {/* Icon circle */}
            <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: getIconBg(seg.label) }}
            >
                {getIcon(seg.label)}
            </div>

            {/* Label + detail */}
            <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-white leading-snug">{seg.label}</p>
                {seg.advice && (
                    <p className="text-sm text-gray-500 leading-snug mt-0.5 truncate">{seg.advice}</p>
                )}
            </div>

            {/* Time + duration */}
            <div className="text-right shrink-0">
                <AnimatedStepTime value={stepTime} />
                <div className="mt-0.5">
                    {seg.duration_minutes > 0 && (
                        <AnimatedDuration value={seg.duration_minutes} />
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

    // Arrival at gate = leave home + all segment minutes
    const arriveAtGate = recommendation?.leave_home_at
        ? addMinutesAndFormat(recommendation.leave_home_at, totalMinutes)
        : '';

    const showResult = locked && recommendation;

    // Flight meta line
    const flightMeta = selectedFlight
        ? [
            selectedFlight.flight_number,
            `${selectedFlight.origin_code} → ${selectedFlight.destination_code}`,
            selectedFlight.departure_terminal ? `Terminal ${selectedFlight.departure_terminal}` : null,
            selectedFlight.departure_gate ? `Gate ${selectedFlight.departure_gate}` : null,
        ].filter(Boolean).join(' · ')
        : '';

    return (
        <div className="w-full min-h-full px-6 py-8">
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex flex-col gap-3"
                    >

                        {/* ── HERO CARD ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full flex flex-col items-center text-center px-6 pt-7 pb-6 rounded-2xl"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.09)',
                            }}
                        >
                            <p
                                className="text-xs font-bold uppercase mb-3"
                                style={{ color: '#60a5fa', letterSpacing: '0.2em' }}
                            >
                                Leave Home By
                            </p>
                            <AnimatedHeroTime value={formatUTCToLocal(recommendation.leave_home_at)} />
                            {selectedFlight && (
                                <p className="text-sm text-gray-400 mb-4 mt-1">{flightMeta}</p>
                            )}
                            <div
                                className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
                            >
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-green-400 text-sm font-semibold">{confidenceScore}% Confident</span>
                            </div>
                        </motion.div>

                        {/* ── STEP CARDS ── */}
                        <div className="flex flex-col gap-2">
                            <AnimatePresence>
                                {recommendation.segments.map((seg, i) => {
                                    const cumulativeBefore = recommendation.segments
                                        .slice(0, i)
                                        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
                                    const stepTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);

                                    return (
                                        <StepCard
                                            key={seg.label + i}
                                            seg={seg}
                                            index={i}
                                            stepTime={stepTime}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* ── FOOTER CARD: Arrive at gate + Boarding ── */}
                        {selectedFlight && (
                            <motion.div
                                initial={{ opacity: 0, y: 32 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: recommendation.segments.length * 0.09 + 0.12,
                                    duration: 0.4,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="w-full flex items-end justify-between px-5 py-4 rounded-2xl"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.09)',
                                }}
                            >
                                {/* Left: arrive at gate */}
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Arrive at Gate</p>
                                    <AnimatedStepTime value={arriveAtGate} />
                                </div>

                                {/* Right: boarding */}
                                <div className="text-right">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Boarding</p>
                                    <p className="text-xl font-extrabold text-green-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {boarding}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-0.5">Departs {departureTime}</p>
                                </div>
                            </motion.div>
                        )}

                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}