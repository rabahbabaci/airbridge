import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plane, Car, Train, Bus, User, Shield, Luggage, DoorOpen, CheckCircle2, Navigation } from 'lucide-react';

const transportIcons = { uber: Car, driving: Car, train: Train, bus: Bus, other: User };

const stepMeta = {
    home:     { icon: Home,         label: 'Leave Home',    color: '#3b82f6', glow: 'rgba(59,130,246,0.5)'   },
    travel:   { icon: Car,          label: 'En Route',      color: '#f59e0b', glow: 'rgba(245,158,11,0.5)'   },
    airport:  { icon: Plane,        label: 'Arrive Airport',color: '#06b6d4', glow: 'rgba(6,182,212,0.5)'    },
    baggage:  { icon: Luggage,      label: 'Baggage Drop',  color: '#f97316', glow: 'rgba(249,115,22,0.5)'   },
    security: { icon: Shield,       label: 'TSA Security',  color: '#a855f7', glow: 'rgba(168,85,247,0.5)'   },
    walk:     { icon: DoorOpen,     label: 'At the Gate',   color: '#3b82f6', glow: 'rgba(59,130,246,0.5)'   },
    gate:     { icon: CheckCircle2, label: 'Boarding',      color: '#22c55e', glow: 'rgba(34,197,94,0.5)'    },
};

// ── Loading ──────────────────────────────────────────────────────────────────
const loadingMessages = [
    'Scanning live traffic...',
    'Checking TSA wait times...',
    'Calculating gate walk...',
    'Applying confidence buffer...',
    'Locking your departure time...',
];

function LoadingSequence({ onDone }) {
    const [msgIndex, setMsgIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const total = loadingMessages.length;
        let current = 0;
        const interval = setInterval(() => {
            current++;
            setMsgIndex(Math.min(current, total - 1));
            setProgress(Math.min((current / total) * 100, 100));
            if (current >= total) {
                clearInterval(interval);
                setTimeout(onDone, 400);
            }
        }, 480);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-7 max-w-xs mx-auto text-center"
        >
            <div className="relative w-20 h-20">
                <motion.div className="absolute inset-0 rounded-3xl"
                    animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35), transparent)', filter: 'blur(14px)' }} />
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <motion.div animate={{ rotate: [0, 8, -8, 0], y: [0, -4, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
                        <Plane className="w-9 h-9 text-blue-400" />
                    </motion.div>
                </div>
            </div>
            <div className="h-6">
                <AnimatePresence mode="wait">
                    <motion.p key={msgIndex}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }} className="text-sm font-medium text-gray-300">
                        {loadingMessages[msgIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>
            <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
            </div>
            <p className="text-xs text-gray-600">Building your door-to-gate plan...</p>
        </motion.div>
    );
}

// ── Node ─────────────────────────────────────────────────────────────────────
function StepNode({ stepId, time, dur, visible, TransportIcon, animDelay }) {
    const meta = stepMeta[stepId];
    const Icon = stepId === 'travel' ? TransportIcon : meta.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.4 }}
            transition={{ delay: animDelay, duration: 0.45, type: 'spring', stiffness: 200, damping: 18 }}
            className="flex flex-col items-center gap-2 select-none"
            style={{ minWidth: 72 }}
        >
            {/* Icon bubble */}
            <motion.div
                animate={visible ? { boxShadow: [`0 0 0px ${meta.glow}`, `0 0 18px ${meta.glow}`, `0 0 0px ${meta.glow}`] } : {}}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: animDelay + 0.5 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}44)`,
                    border: `2px solid ${meta.color}88`,
                }}
            >
                <Icon className="w-7 h-7" style={{ color: meta.color }} />
            </motion.div>

            {/* Label */}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-center leading-tight">
                {meta.label}
            </p>

            {/* Time */}
            {time && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }}
                    transition={{ delay: animDelay + 0.3 }}
                    className="text-sm font-bold text-white leading-none">
                    {time}
                </motion.p>
            )}

            {/* Dur */}
            {dur && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }}
                    transition={{ delay: animDelay + 0.4 }}
                    className="text-[11px] font-semibold" style={{ color: meta.color }}>
                    {dur}
                </motion.p>
            )}
        </motion.div>
    );
}

// ── Horizontal connector bar ──────────────────────────────────────────────────
function HBar({ visible, delay, color, reverse }) {
    return (
        <div className="flex items-center flex-1 px-1 min-w-[28px]" style={{ height: 64, marginTop: -32 }}>
            <div className="w-full h-px overflow-hidden rounded">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: visible ? 1 : 0 }}
                    transition={{ delay, duration: 0.5, ease: 'easeInOut' }}
                    style={{
                        height: 2,
                        width: '100%',
                        background: `linear-gradient(${reverse ? '270deg' : '90deg'}, ${color}00, ${color})`,
                        transformOrigin: reverse ? 'right' : 'left',
                        borderRadius: 2,
                    }}
                />
            </div>
        </div>
    );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, barColor, barPct, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500">{label}</p>
            <p className="text-xl font-bold text-white leading-none">
                {value}<span className="text-xs font-semibold text-gray-500 ml-0.5">{unit}</span>
            </p>
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: barPct / 100 }}
                    transition={{ delay: delay + 0.3, duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', background: barColor, transformOrigin: 'left', borderRadius: 2 }} />
            </div>
        </motion.div>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function JourneyVisualization({ locked, steps, transport, profile, confidenceColorMap }) {
    const [phase, setPhase] = useState('idle');
    const [revealed, setRevealed] = useState(new Set());
    const prevLockedRef = useRef(false);

    const TransportIcon = transportIcons[transport] || Car;
    const visibleSteps = steps.filter(s => s.id !== 'baggage' || s.visible);

    useEffect(() => {
        if (locked && !prevLockedRef.current) {
            setPhase('loading');
            setRevealed(new Set());
        }
        if (!locked && prevLockedRef.current) {
            setPhase('idle');
            setRevealed(new Set());
        }
        prevLockedRef.current = locked;
    }, [locked]);

    const handleLoadingDone = () => {
        setPhase('journey');
        // Reveal steps one by one
        visibleSteps.forEach((s, i) => {
            setTimeout(() => {
                setRevealed(prev => new Set([...prev, s.id]));
            }, i * 550);
        });
    };

    const leaveStep = steps.find(s => s.id === 'home');
    const allRevealed = revealed.size >= visibleSteps.length && visibleSteps.length > 0;

    // Build two rows: top row is first half of steps, bottom row is second half (reversed for RTL feel)
    // Row 1: home, travel, airport  (L→R)
    // Row 2: baggage/security, walk, gate  (R→L visually, but we render L→R reversed)
    const row1ids = ['home', 'travel', 'airport'];
    const row2ids = ['baggage', 'security', 'walk', 'gate'];
    const row1 = visibleSteps.filter(s => row1ids.includes(s.id));
    const row2 = visibleSteps.filter(s => row2ids.includes(s.id));

    // For timing: index in full sequence
    const seqIndex = (id) => visibleSteps.findIndex(s => s.id === id);

    // Stats data
    const homeStep     = steps.find(s => s.id === 'home');
    const securityStep = steps.find(s => s.id === 'security');
    const walkStep     = steps.find(s => s.id === 'walk');
    const baggageStep  = steps.find(s => s.id === 'baggage');
    const bufferDur    = steps[steps.length - 1]?.dur;

    const trafficVal  = homeStep?.dur?.replace(' min','') || '0';
    const tsaVal      = securityStep?.dur?.replace(' min','') || '0';
    const walkVal     = walkStep?.dur?.replace(' min','') || '0';
    const baggageVal  = baggageStep?.visible ? (baggageStep?.dur?.replace(' min','') || '0') : '0';
    const bufferVal   = steps[0]?.total || 0;
    const secVal      = walkStep?.dur?.replace(' min', '') || '0';

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
            <AnimatePresence mode="wait">

                {/* ── Idle ── */}
                {phase === 'idle' && (
                    <motion.div key="idle"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center text-center gap-6 max-w-sm mx-auto py-12"
                    >
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            className="w-20 h-20 rounded-3xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Plane className="w-9 h-9 text-gray-500" />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2 leading-snug">Your journey<br />starts here</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">Configure your trip on the left.<br />Your door-to-gate map will appear here.</p>
                        </div>
                        <div className="flex gap-2">
                            {[0, 1, 2].map(i => (
                                <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                                    className="w-2 h-2 rounded-full" style={{ background: 'rgba(59,130,246,0.4)' }} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Loading ── */}
                {phase === 'loading' && (
                    <LoadingSequence key="loading" onDone={handleLoadingDone} />
                )}

                {/* ── Journey Map ── */}
                {phase === 'journey' && (
                    <motion.div key="journey"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                        className="w-full flex flex-col gap-4"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Door-to-Gate Journey</p>
                            {allRevealed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="text-[10px] text-green-400 font-medium flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                    Live & Reactive
                                </motion.span>
                            )}
                        </div>

                        {/* Hero leave time */}
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl px-5 py-4 flex items-center justify-between"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">Leave Home At</p>
                                <span className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    {leaveStep?.time}
                                </span>
                                <p className="text-gray-500 text-[11px] mt-1">{steps[0]?.flightLabel} · {steps[0]?.total} min door-to-gate</p>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${confidenceColorMap[profile?.color]?.badge}`}>
                                {profile?.confidenceScore}% Confident
                            </span>
                        </motion.div>

                        {/* Map area */}
                        <div className="rounded-2xl p-5 overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

                            {/* Row 1: L → R */}
                            <div className="flex items-end mb-3">
                                {row1.map((s, i) => {
                                    const idx = seqIndex(s.id);
                                    const vis = revealed.has(s.id);
                                    const nextVis = i < row1.length - 1 ? revealed.has(row1[i + 1]?.id) : false;
                                    return (
                                        <React.Fragment key={s.id}>
                                            <StepNode stepId={s.id} time={s.time} dur={s.dur} visible={vis}
                                                TransportIcon={TransportIcon} animDelay={idx * 0.1} />
                                            {i < row1.length - 1 && (
                                                <HBar visible={nextVis} delay={(idx + 0.7) * 0.1} color={s.color} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            {/* Curved connector SVG */}
                            <div className="w-full overflow-hidden" style={{ height: 40 }}>
                                <motion.svg width="100%" height="40" viewBox="0 0 500 40" preserveAspectRatio="none"
                                    initial={{ opacity: 0 }} animate={{ opacity: revealed.size >= row1.length ? 1 : 0 }}
                                    transition={{ delay: row1.length * 0.55, duration: 0.5 }}>
                                    <motion.path
                                        d="M 480 4 Q 495 4 495 20 Q 495 36 480 36 L 20 36 Q 5 36 5 20"
                                        fill="none" stroke="url(#curveGrad)" strokeWidth="2.5" strokeLinecap="round"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: revealed.size >= row1.length ? 1 : 0 }}
                                        transition={{ delay: row1.length * 0.55, duration: 0.8, ease: 'easeInOut' }}
                                    />
                                    <defs>
                                        <linearGradient id="curveGrad" x1="1" y1="0" x2="0" y2="0">
                                            <stop offset="0%" stopColor="#06b6d4" />
                                            <stop offset="100%" stopColor="#a855f7" />
                                        </linearGradient>
                                    </defs>
                                </motion.svg>
                            </div>

                            {/* Row 2: R → L (rendered reversed so rightmost is first in DOM order) */}
                            <div className="flex items-start flex-row-reverse mt-1">
                                {[...row2].reverse().map((s, ri) => {
                                    const i = row2.length - 1 - ri; // original index in row2
                                    const idx = seqIndex(s.id);
                                    const vis = revealed.has(s.id);
                                    const prevS = row2[i - 1]; // left neighbour (rendered after in reversed flex)
                                    const prevVis = prevS ? revealed.has(prevS.id) : false;
                                    return (
                                        <React.Fragment key={s.id}>
                                            <StepNode stepId={s.id} time={s.time} dur={s.dur} visible={vis}
                                                TransportIcon={TransportIcon} animDelay={idx * 0.1} />
                                            {i > 0 && (
                                                <HBar visible={vis && prevVis} delay={(idx + 0.5) * 0.1}
                                                    color={s.color} reverse />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Seat ready pill */}
                        <AnimatePresence>
                            {allRevealed && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                                    className="flex items-center justify-center">
                                    <div className="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm"
                                        style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.08))', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}>
                                        <motion.span animate={{ rotate: [0, 12, -12, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                                            <Plane className="w-4 h-4" />
                                        </motion.span>
                                        Seat Ready. Just Fly.
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Stat cards */}
                        {allRevealed && (
                            <div className="grid grid-cols-3 gap-2">
                                <StatCard label="Transport"  value={trafficVal}  unit="m" barColor="#f59e0b" barPct={65} delay={0.1} />
                                <StatCard label="TSA Wait"   value={tsaVal}      unit="m" barColor="#a855f7" barPct={50} delay={0.2} />
                                <StatCard label="Gate Walk"  value={walkVal}     unit="m" barColor="#06b6d4" barPct={35} delay={0.3} />
                                <StatCard label="Baggage"    value={baggageVal}  unit="m" barColor="#f97316" barPct={baggageVal === '0' ? 0 : 40} delay={0.4} />
                                <StatCard label="Buffer"     value={steps[0]?.total - parseInt(trafficVal||0) - parseInt(tsaVal||0) - parseInt(walkVal||0)} unit="m" barColor="#22c55e" barPct={70} delay={0.5} />
                                <StatCard label="Confidence" value={profile?.confidenceScore} unit="%" barColor={profile?.color === 'green' ? '#22c55e' : profile?.color === 'amber' ? '#f59e0b' : '#3b82f6'} barPct={profile?.confidenceScore} delay={0.6} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}