import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Car, Train, Bus, Shield, Clock, MapPin, Luggage, Building2, PersonStanding, Ticket, CheckCircle2 } from 'lucide-react';

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

// Parse flight departure time to get boarding time (30 min before departure)
function parseDepartureTime(localTimeStr) {
    if (!localTimeStr) return null;
    const match = localTimeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return null;
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]));
}

function parseDepartureAndGetBoardingTime(localTimeStr) {
    if (!localTimeStr) return { boarding: '', departure: '' };
    const d = parseDepartureTime(localTimeStr);
    if (!d) return { boarding: localTimeStr, departure: localTimeStr };
    const boardingDate = new Date(d.getTime() - 30 * 60000);
    const fmt = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { boarding: fmt(boardingDate), departure: fmt(d) };
}

function totalToHM(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

// Parse TSA advice "walk:3|wait:45|peak" → { walkMin, waitMin, period }
function parseTsaAdvice(advice) {
    if (!advice) return null;
    const walkMatch = advice.match(/walk:(\d+)/);
    const waitMatch = advice.match(/wait:(\d+)/);
    const periodMatch = advice.match(/\|([^|]+)$/);
    return {
        walkMin: walkMatch ? parseInt(walkMatch[1], 10) : 0,
        waitMin: waitMatch ? parseInt(waitMatch[1], 10) : undefined,
        period: periodMatch ? periodMatch[1].trim() : '',
    };
}

// Maps segment type → { Icon, from, to }
function getSegmentIcon(seg) {
    const id = (seg.id || '').toLowerCase();
    const label = (seg.label || '').toLowerCase();
    if (id === 'bag_drop' || label.includes('bag') || label.includes('luggage'))
        return { Icon: Luggage, from: '#f59e0b', to: '#d97706' };
    if (id === 'curb_to_checkin' || label.includes('check-in') || label.includes('check in') || label.includes('terminal'))
        return { Icon: Building2, from: '#6366f1', to: '#4f46e5' };
    if (id === 'walk_to_security' || id === 'walk_to_gate' || label.includes('walk'))
        return { Icon: PersonStanding, from: '#22d3ee', to: '#0891b2' };
    if (id === 'tsa' || label.includes('security') || label.includes('tsa'))
        return { Icon: Shield, from: '#f43f5e', to: '#be123c' };
    if (id === 'boarding_buffer')
        return { Icon: Clock, from: '#a78bfa', to: '#7c3aed' };
    if (id.includes('train') || label.includes('train'))
        return { Icon: Train, from: '#3b82f6', to: '#1d4ed8' };
    if (id.includes('bus') || label.includes('bus'))
        return { Icon: Bus, from: '#10b981', to: '#047857' };
    if (id.includes('drive') || label.includes('ride') || label.includes('drive') || label.includes('uber') || label.includes('lyft') || label.includes('leave home') || label.includes('depart'))
        return { Icon: Car, from: '#8b5cf6', to: '#6d28d9' };
    if (label.includes('gate'))
        return { Icon: Ticket, from: '#f97316', to: '#c2410c' };
    if (label.includes('board'))
        return { Icon: Plane, from: '#22c55e', to: '#15803d' };
    return { Icon: MapPin, from: '#6366f1', to: '#4f46e5' };
}

// Circular gradient icon using a div + Lucide icon (avoids SVG foreignObject cloning issues)
function SegIcon({ seg, size = 40 }) {
    const { Icon, from, to } = getSegmentIcon(seg);
    const iconSize = Math.round(size * 0.45);
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${from}, ${to})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <Icon style={{ width: iconSize, height: iconSize, color: 'white' }} />
        </div>
    );
}

// ── Hero time — pulses on change via key ──────────────────────────────────────
function AnimatedTime({ value }) {
    return (
        <motion.p
            key={value}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="font-extrabold leading-none mb-2"
            style={{
                fontSize: 58,
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

// ── Horizontal step node ──────────────────────────────────────────────────────
function StepNode({ seg, index, stepTime, delay, displayLabel, waitLabel, extraBadge }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center"
            style={{ flex: '0 0 auto', width: 100 }}
        >
            {/* Badge number */}
            <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mb-1.5 shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 0 2px rgba(99,102,241,0.3)' }}
            >
                {index + 1}
            </div>
            {/* Icon */}
            <SegIcon seg={seg} size={56} />
            {/* Wait time under icon (e.g. TSA wait, bag drop) */}
            {waitLabel && (
                <p className="text-[10px] font-semibold text-amber-400/90 mt-1 text-center leading-tight" style={{ maxWidth: 92 }}>{waitLabel}</p>
            )}
            {/* Label */}
            <p className="text-[11px] font-semibold text-gray-300 mt-1.5 text-center leading-tight" style={{ maxWidth: 92 }}>{displayLabel}</p>
            {/* Shiny time chip */}
            <span
                className="mt-1.5 font-mono text-[13px] font-bold px-2 py-0.5 rounded-lg"
                style={{
                    background: 'linear-gradient(135deg, rgba(96,165,250,0.22), rgba(139,92,246,0.18))',
                    border: '1px solid rgba(147,197,253,0.4)',
                    color: '#e0f2fe',
                    textShadow: '0 0 10px rgba(147,197,253,0.6)',
                    boxShadow: '0 0 8px rgba(96,165,250,0.15)',
                }}
            >{stepTime}</span>
            {extraBadge && (
                <span className="mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                    {extraBadge}
                </span>
            )}
        </motion.div>
    );
}

// ── Diagonal connector between row 1 and row 2 ───────────────────────────────
// Starts just left of the right-side icon (row 1), ends just right of the left-side icon (row 2)
// Icon center in the StepNode is roughly at x=46px from the node's left edge.
// The connector uses the same solid gradient arrow style as the horizontal Connector.
function UTurnConnector({ label, delay }) {
    const VW = 500;
    const VH = 60;
    // x1: left edge of right icon = where row 1 arrow tip ends (icon center ~46px from right, icon radius ~23px → left edge at VW - 46 - 23 = VW - 69)
    // x2: right edge of left icon = where row 2 arrow starts (icon center ~46px from left, right edge at 46 + 23 = 69)
    const x1 = VW - 69; // left edge of right-side icon
    const y1 = 4;
    const x2 = 69;      // right edge of left-side icon (symmetric)
    const y2 = VH + 60; // extend far down to reach TSA icon level

    // Arrowhead geometry
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const aLen = 10;
    const aSpread = 0.38;
    const ax1 = x2 - aLen * Math.cos(angle - aSpread);
    const ay1 = y2 - aLen * Math.sin(angle - aSpread);
    const ax2 = x2 - aLen * Math.cos(angle + aSpread);
    const ay2 = y2 - aLen * Math.sin(angle + aSpread);

    // Label at midpoint
    const lx = ((x1 + x2) / 2 / VW) * 100;
    const ly = (y1 + y2) / 2;

    return (
        <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay, duration: 0.4, ease: 'easeOut' }}
            className="w-full relative"
            style={{ height: VH + 76, transformOrigin: 'right', overflow: 'visible' }}
        >
            <svg
                width="100%"
                height={VH + 16}
                viewBox={`0 0 ${VW} ${VH + 16}`}
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0 }}
            >
                <defs>
                    <linearGradient id="diag-grad" x1="1" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(99,102,241,0.6)" />
                        <stop offset="100%" stopColor="rgba(139,92,246,0.4)" />
                    </linearGradient>
                </defs>
                <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="url(#diag-grad)"
                    strokeWidth="1.5"
                />
                <polygon
                    points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`}
                    fill="rgba(139,92,246,0.5)"
                />
            </svg>
            {/* Duration label centered on the diagonal */}
            <div
                style={{
                    position: 'absolute',
                    left: `${lx}%`,
                    top: ly,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                }}
            >
                <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                        background: 'rgba(99,102,241,0.14)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        color: '#a5b4fc',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </span>
            </div>
        </motion.div>
    );
}

// ── Connector line between steps (vertically centered at icon level) ──────────
// StepNode layout: badge(24) + mb(6) + icon(46) → icon center at 24+6+23 = 53px
// We use absolute positioning to center the connector at that exact vertical position.
function Connector({ label, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay, duration: 0.4, ease: 'easeOut' }}
            className="flex-1 relative"
            style={{ transformOrigin: 'left', minHeight: 130 }}
        >
            {/* Centered connector group: label above, arrow line below */}
            <div
                className="absolute left-0 right-0 flex flex-col items-center"
                style={{ top: 58, transform: 'translateY(-50%)' }}
            >
                <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full mb-1"
                    style={{
                        background: 'rgba(99,102,241,0.14)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        color: '#a5b4fc',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </span>
                <div className="flex items-center w-full">
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.6), rgba(139,92,246,0.4))' }} />
                    <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid rgba(139,92,246,0.5)' }} />
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

    // Calculate gate cushion from backend data
    const gateArrival = recommendation?.gate_arrival_utc ? new Date(recommendation.gate_arrival_utc) : null;
    const departureDateObj = selectedFlight?.departure_time ? parseDepartureTime(selectedFlight.departure_time) : null;
    const boardingTime = departureDateObj ? new Date(departureDateObj.getTime() - 30 * 60000) : null;
    const gateCushionMinutes = (gateArrival && boardingTime) ? Math.round((boardingTime - gateArrival) / 60000) : 0;
    const gateCushion = gateCushionMinutes > 0 ? gateCushionMinutes : 0;

    const { boarding, departure: departureTime } = selectedFlight
        ? parseDepartureAndGetBoardingTime(selectedFlight.departure_time)
        : { boarding: '', departure: '' };

    const showResult = locked && recommendation;

    // Filter out comfort_buffer from timeline — it will be shown on the Gate step
    const segments = recommendation?.segments || [];
    const comfortBuffer = segments.find(s => s.id === 'comfort_buffer');
    const displaySegments = segments.filter(s => s.id !== 'comfort_buffer');
    const hasBags = displaySegments.some(s => s.id === 'bag_drop');
    const topCount = Math.ceil(displaySegments.length / 2);
    const rows = displaySegments.length > 0
        ? [displaySegments.slice(0, topCount), displaySegments.slice(topCount)].filter(r => r.length > 0)
        : [];

    return (
        <div className="w-full min-h-full px-6 py-5 flex flex-col items-center">
            <div className="w-full" style={{ maxWidth: 960 }}>
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
                            className="w-full flex flex-col gap-3"
                        >
                            {/* ── HERO CARD ── */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.45, ease: 'easeOut' }}
                                className="w-full rounded-2xl px-6 py-4"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                            >
                                <p className="text-xs font-bold uppercase mb-0.5" style={{ color: '#60a5fa', letterSpacing: '0.22em' }}>
                                    Leave Home By
                                </p>
                                <div className="flex items-end justify-between gap-4">
                                    <AnimatedTime value={formatUTCToLocal(recommendation.leave_home_at)} />
                                    <div className="flex flex-col items-end gap-2 pb-3">
                                        <div
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                                            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                            <span className="text-green-400 text-xs font-semibold">{confidenceScore}% Confident</span>
                                        </div>
                                        {selectedFlight && (
                                            <p className="text-gray-500 text-xs font-medium">
                                                {selectedFlight.flight_number} · {selectedFlight.origin_code} → {selectedFlight.destination_code} · {totalToHM(totalMinutes)} door-to-gate
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* ── HORIZONTAL STEPS CARD ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                                className="w-full rounded-2xl px-5 py-4"
                            >
                                {rows.map((rowSegs, rowIdx) => {
                                    const globalOffset = rowIdx === 0 ? 0 : Math.ceil(displaySegments.length / 2);
                                    // The last seg of row 0 is the "U-turn" segment (its duration connects to first of row 1)
                                    const lastSegOfRow0 = rows.length > 1 ? rows[0][rows[0].length - 1] : null;
                                    return (
                                        <React.Fragment key={rowIdx}>
                                            {/* U-turn connector between rows */}
                                            {rowIdx === 1 && lastSegOfRow0 && (() => {
                                                // For TSA, parse walk time from advice
                                                let uturnLabel = `${lastSegOfRow0.duration_minutes} min`;
                                                if (lastSegOfRow0.id === 'tsa' && lastSegOfRow0.advice) {
                                                    const walkMatch = lastSegOfRow0.advice.match(/walk:(\d+)/);
                                                    if (walkMatch) {
                                                        uturnLabel = `${walkMatch[1]} min`;
                                                    }
                                                }
                                                // For bag_drop, show its duration
                                                if (lastSegOfRow0.id === 'bag_drop') {
                                                    uturnLabel = `${lastSegOfRow0.duration_minutes} min`;
                                                }
                                                return <UTurnConnector label={uturnLabel} delay={globalOffset * 0.07 + 0.1} />;
                                            })()}
                                            <div className={rowIdx > 0 ? 'mt-1' : ''}>
                                                <div className="flex items-center">
                                                    {rowSegs.map((seg, i) => {
                                                        const globalIdx = globalOffset + i;
                                                        const cumulativeBefore = displaySegments
                                                            .slice(0, globalIdx)
                                                            .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
                                                        const stepTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);
                                                        const delay = globalIdx * 0.07 + 0.15;
                                                        const isLastInRow = i === rowSegs.length - 1;
                                                        // For row 0, the last step connects via U-turn so no horizontal connector needed
                                                        const showConnector = !isLastInRow || rowIdx < rows.length - 1 ? !isLastInRow : false;

                                                        // Rename curb_to_checkin if no bags
                                                        let displayLabel = seg.label;
                                                        if (seg.id === 'curb_to_checkin' && !hasBags) {
                                                            displayLabel = 'Curb to security';
                                                        }

                                                        // Parse TSA advice for walk/wait split (walk on arrow TO TSA, wait under TSA icon)
                                                        let connectorLabel = `${seg.duration_minutes} min`;
                                                        let waitLabel = undefined;
                                                        // Bag Drop: show drop time under the step, arrow after shows next segment's duration
                                                        const isBagDrop = seg.id === 'bag_drop';
                                                        if (isBagDrop) {
                                                            waitLabel = `${seg.duration_minutes} min`;
                                                            const nextSeg = displaySegments[globalIdx + 1];
                                                            connectorLabel = nextSeg ? `${nextSeg.duration_minutes} min` : `${seg.duration_minutes} min`;
                                                        }
                                                        if (seg.id === 'tsa' && seg.advice) {
                                                            const walkMatch = seg.advice.match(/walk:(\d+)/);
                                                            const waitMatch = seg.advice.match(/wait:(\d+)/);
                                                            const periodMatch = seg.advice.match(/\|([^|]+)$/);
                                                            const walkMin = walkMatch ? parseInt(walkMatch[1], 10) : 0;
                                                            const waitMin = waitMatch ? parseInt(waitMatch[1], 10) : seg.duration_minutes;
                                                            const period = periodMatch ? periodMatch[1].trim() : '';
                                                            waitLabel = `${waitMin} min${period ? ' · ' + period : ''}`;
                                                            // Connector AFTER TSA shows the next segment's duration
                                                            const nextSeg = displaySegments[globalIdx + 1];
                                                            connectorLabel = nextSeg ? `${nextSeg.duration_minutes} min` : `${seg.duration_minutes} min`;
                                                        }
                                                        // Connector BEFORE TSA: use TSA's walk time on the arrow leading TO the TSA step
                                                        const nextSegInArray = displaySegments[globalIdx + 1];
                                                        if (nextSegInArray?.id === 'tsa' && nextSegInArray.advice) {
                                                            const walkMatch = nextSegInArray.advice.match(/walk:(\d+)/);
                                                            if (walkMatch) {
                                                                connectorLabel = `${walkMatch[1]} min`;
                                                            }
                                                        }
                                                        // Gate step: show comfort buffer as extra badge if present
                                                        const isGateStep = seg.id === 'walk_to_gate';
                                                        const extraBadge = (isGateStep && comfortBuffer)
                                                            ? `+${comfortBuffer.duration_minutes} min buffer`
                                                            : undefined;

                                                        return (
                                                            <React.Fragment key={seg.id || seg.label}>
                                                                <StepNode
                                                                    seg={seg}
                                                                    index={globalIdx}
                                                                    stepTime={stepTime}
                                                                    delay={delay}
                                                                    displayLabel={displayLabel}
                                                                    waitLabel={waitLabel}
                                                                    extraBadge={extraBadge}
                                                                />
                                                                {showConnector && (
                                                                    <Connector
                                                                        label={connectorLabel}
                                                                        delay={delay + 0.05}
                                                                    />
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </motion.div>

                            {/* ── BOARDING + STATS CARD ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: displaySegments.length * 0.07 + 0.3, duration: 0.4 }}
                                className="w-full rounded-2xl overflow-hidden"
                                style={{ border: '1px solid rgba(34,197,94,0.25)' }}
                            >
                                {/* Boarding row */}
                                <div
                                    className="flex items-center justify-between px-6 py-4 gap-4"
                                    style={{ background: 'rgba(34,197,94,0.07)', borderBottom: '1px solid rgba(34,197,94,0.15)' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                                            style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', boxShadow: '0 0 16px rgba(34,197,94,0.35)' }}
                                        >
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-0.5">Boarding</p>
                                            <p
                                                className="font-extrabold"
                                                style={{
                                                    fontSize: 26,
                                                    letterSpacing: '-0.5px',
                                                    background: 'linear-gradient(135deg, #ffffff, #86efac)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    backgroundClip: 'text',
                                                    textShadow: 'none',
                                                }}
                                            >{boarding}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-0.5">Flight Departs</p>
                                        <p
                                            className="font-extrabold"
                                            style={{
                                                fontSize: 22,
                                                letterSpacing: '-0.5px',
                                                background: 'linear-gradient(135deg, #e2e8f0, #93c5fd)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text',
                                            }}
                                        >{departureTime}</p>
                                    </div>
                                </div>

                                {/* Stats row — only Total Journey + Gate Cushion */}
                                <div
                                    className="grid grid-cols-2 divide-x"
                                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                                >
                                    {[
                                        { label: 'Total Journey', value: totalToHM(totalMinutes), color: '#ffffff' },
                                        { label: 'Gate Cushion', value: totalToHM(gateCushion), color: '#4ade80' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="flex flex-col items-center gap-0.5 px-5 py-3 text-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">{label}</p>
                                            <p className="text-xl font-bold" style={{ color }}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}