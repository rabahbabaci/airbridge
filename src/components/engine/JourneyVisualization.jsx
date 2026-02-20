import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plane, Car, Train, Bus, User, Shield, Luggage, Navigation, CheckCircle2 } from 'lucide-react';

const transportIcons = { uber: Car, driving: Car, train: Train, bus: Bus, other: User };

const stepIconMap = {
    home:     Home,
    travel:   Car,
    airport:  Plane,
    baggage:  Luggage,
    security: Shield,
    walk:     Navigation,
    gate:     CheckCircle2,
};

const stepColorMap = {
    home:     '#3b82f6',
    travel:   '#8b5cf6',
    airport:  '#6366f1',
    baggage:  '#f97316',
    security: '#06b6d4',
    walk:     '#14b8a6',
    gate:     '#22c55e',
};

// ── Loading overlay ──────────────────────────────────────────────────────────
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
            key="loading"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center gap-7 max-w-xs mx-auto text-center"
        >
            {/* Animated plane */}
            <div className="relative w-20 h-20">
                <motion.div
                    className="absolute inset-0 rounded-3xl"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent)', filter: 'blur(12px)' }}
                />
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0], y: [0, -3, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    >
                        <Plane className="w-9 h-9 text-blue-400" />
                    </motion.div>
                </div>
            </div>

            {/* Message */}
            <div className="h-6">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={msgIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="text-sm font-medium text-gray-300"
                    >
                        {loadingMessages[msgIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
                />
            </div>

            <p className="text-xs text-gray-600">Building your door-to-gate plan...</p>
        </motion.div>
    );
}

// ── Node Bubble ──────────────────────────────────────────────────────────────
function NodeBubble({ stepId, label, color, active, done, time, dur, delay, TransportIcon }) {
    const IconComponent = stepId === 'travel' ? TransportIcon : stepIconMap[stepId];
    if (!IconComponent) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-2"
        >
            <motion.div
                animate={active ? { boxShadow: [`0 0 0px ${color}00`, `0 0 20px ${color}88`, `0 0 0px ${color}00`] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="relative"
            >
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-500"
                    style={{
                        background: done || active ? `linear-gradient(135deg, ${color}33, ${color}66)` : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${done || active ? color + '88' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <IconComponent className="w-5 h-5" style={{ color: done || active ? color : '#4b5563' }} />
                    {active && (
                        <motion.div
                            className="absolute inset-0 rounded-2xl"
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            style={{ background: `radial-gradient(circle, ${color}44, transparent)` }}
                        />
                    )}
                </div>
                {done && (
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                    >
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                )}
            </motion.div>
            <div className="text-center">
                <p className="text-[11px] font-semibold" style={{ color: done || active ? '#e5e7eb' : '#4b5563' }}>
                    {label}
                </p>
                {time && (done || active) && (
                    <motion.p
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.3 }}
                        className="text-[10px] font-bold mt-0.5" style={{ color }}
                    >
                        {time}
                    </motion.p>
                )}
                {dur && (done || active) && (
                    <p className="text-[9px] text-gray-600 mt-0.5">{dur}</p>
                )}
            </div>
        </motion.div>
    );
}

// ── Connector ────────────────────────────────────────────────────────────────
function ConnectorLine({ horizontal, delay, color = '#3b82f6' }) {
    return (
        <div className={`flex items-center justify-center ${horizontal ? 'flex-row' : 'flex-col'}`}
            style={{ [horizontal ? 'width' : 'height']: horizontal ? '40px' : '28px', [horizontal ? 'height' : 'width']: '2px' }}>
            <motion.div
                initial={{ [horizontal ? 'scaleX' : 'scaleY']: 0 }}
                animate={{ [horizontal ? 'scaleX' : 'scaleY']: 1 }}
                transition={{ delay, duration: 0.45, ease: 'easeInOut' }}
                style={{
                    width: horizontal ? '100%' : '2px',
                    height: horizontal ? '2px' : '100%',
                    background: `linear-gradient(${horizontal ? '90deg' : '180deg'}, ${color}66, ${color})`,
                    transformOrigin: horizontal ? 'left' : 'top',
                    borderRadius: '2px',
                }}
            />
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function JourneyVisualization({ locked, steps, transport, profile, confidenceColorMap }) {
    const [phase, setPhase] = useState('idle'); // idle | loading | journey
    const [activeStep, setActiveStep] = useState(-1);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const prevLockedRef = useRef(false);

    const TransportIcon = transportIcons[transport] || Car;
    const visibleSteps = steps.filter(s => s.id !== 'baggage' || s.visible);

    useEffect(() => {
        if (locked && !prevLockedRef.current) {
            // First lock: show loading then animate
            setPhase('loading');
            setActiveStep(-1);
            setCompletedSteps(new Set());
        }
        if (!locked && prevLockedRef.current) {
            setPhase('idle');
            setActiveStep(-1);
            setCompletedSteps(new Set());
        }
        prevLockedRef.current = locked;
    }, [locked]);

    const handleLoadingDone = () => {
        setPhase('journey');
        let i = 0;
        const run = () => {
            if (i < visibleSteps.length) {
                setActiveStep(i);
                setCompletedSteps(prev => { const n = new Set(prev); if (i > 0) n.add(i - 1); return n; });
                i++;
                setTimeout(run, 800);
            } else {
                setCompletedSteps(prev => { const n = new Set(prev); n.add(i - 1); return n; });
                setActiveStep(-1);
            }
        };
        setTimeout(run, 200);
    };

    const allStepIds = visibleSteps.map(s => s.id);
    const isActive = (id) => activeStep >= 0 && allStepIds[activeStep] === id;
    const isDone = (id) => completedSteps.has(allStepIds.indexOf(id));
    const allDone = completedSteps.size >= visibleSteps.length && visibleSteps.length > 0;

    const leaveStep = steps.find(s => s.id === 'home');

    const row0 = visibleSteps.filter(s => ['home', 'travel'].includes(s.id));
    const row1 = visibleSteps.filter(s => ['airport', 'baggage'].includes(s.id));
    const row2 = visibleSteps.filter(s => ['security', 'walk'].includes(s.id));
    const row3 = visibleSteps.filter(s => s.id === 'gate');

    const renderNode = (s, delay) => (
        <NodeBubble
            key={s.id}
            stepId={s.id}
            label={s.label}
            color={s.color || stepColorMap[s.id]}
            active={isActive(s.id)}
            done={isDone(s.id) || allDone}
            time={s.time}
            dur={s.dur}
            delay={delay}
            TransportIcon={TransportIcon}
        />
    );

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
            <AnimatePresence mode="wait">
                {phase === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center text-center gap-6 max-w-sm mx-auto"
                    >
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            className="w-20 h-20 rounded-3xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <Plane className="w-9 h-9 text-gray-500" />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2 leading-snug">Your journey<br />starts here</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">Configure your trip on the left.<br />Your door-to-gate timeline will appear here.</p>
                        </div>
                        <div className="flex gap-2">
                            {[0.3, 0.5, 0.7].map((o, i) => (
                                <motion.div key={i} animate={{ opacity: [o, o + 0.3, o] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                                    className="w-2 h-2 rounded-full" style={{ background: 'rgba(59,130,246,0.4)' }} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {phase === 'loading' && (
                    <LoadingSequence key="loading" onDone={handleLoadingDone} />
                )}

                {phase === 'journey' && (
                    <motion.div
                        key="journey"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full flex flex-col gap-4"
                    >
                        {/* Hero card */}
                        <div className="rounded-2xl p-5 flex items-center justify-between"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium mb-1">Leave Home At</p>
                                <motion.span
                                    key={leaveStep?.time}
                                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                    className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                                >
                                    {leaveStep?.time}
                                </motion.span>
                                <p className="text-gray-500 text-xs mt-1.5">{steps[0]?.flightLabel} · {steps[0]?.total} min door-to-gate</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${confidenceColorMap[profile?.color]?.badge}`}>
                                    {profile?.confidenceScore}% Confident
                                </span>
                                {allDone && (
                                    <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                        Live & Reactive
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Journey path */}
                        <div className="rounded-2xl p-6 flex flex-col gap-4"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-[11px] text-gray-600 uppercase tracking-wider font-semibold">Door-to-Gate Journey</p>

                            {/* Row 0: L → R */}
                            <div className="flex items-start gap-2">
                                {row0.map((s, i) => (
                                    <React.Fragment key={s.id}>
                                        {renderNode(s, i * 0.15)}
                                        {i < row0.length - 1 && <ConnectorLine horizontal delay={0.3} color={s.color} />}
                                    </React.Fragment>
                                ))}
                                {row1.length > 0 && <ConnectorLine horizontal delay={0.5} color="#6366f1" />}
                            </div>

                            {/* Vertical connector — right side down */}
                            <div className="flex justify-end pr-[26px]">
                                <ConnectorLine horizontal={false} delay={0.7} color="#6366f1" />
                            </div>

                            {/* Row 1: R → L */}
                            <div className="flex items-start gap-2 flex-row-reverse">
                                {[...row1].reverse().map((s, i) => (
                                    <React.Fragment key={s.id}>
                                        {renderNode(s, 0.8 + i * 0.15)}
                                        {i < row1.length - 1 && <ConnectorLine horizontal delay={0.9 + i * 0.1} color={s.color} />}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Vertical connector — left side down */}
                            <div className="flex justify-start pl-[26px]">
                                <ConnectorLine horizontal={false} delay={1.1} color="#06b6d4" />
                            </div>

                            {/* Row 2: L → R */}
                            <div className="flex items-start gap-2">
                                {row2.map((s, i) => (
                                    <React.Fragment key={s.id}>
                                        {renderNode(s, 1.2 + i * 0.15)}
                                        {i < row2.length - 1 && <ConnectorLine horizontal delay={1.35} color={s.color} />}
                                    </React.Fragment>
                                ))}
                                {row3.length > 0 && <ConnectorLine horizontal delay={1.5} color="#14b8a6" />}
                            </div>

                            {/* Vertical connector — right side down to gate */}
                            {row3.length > 0 && (
                                <>
                                    <div className="flex justify-end pr-[26px]">
                                        <ConnectorLine horizontal={false} delay={1.65} color="#22c55e" />
                                    </div>
                                    <div className="flex justify-end">
                                        {renderNode(row3[0], 1.8)}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* End state */}
                        <AnimatePresence>
                            {allDone && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="text-center py-3 rounded-xl"
                                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                                >
                                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }} className="inline-block">
                                        <Plane className="w-5 h-5 text-green-400 mx-auto mb-1" />
                                    </motion.div>
                                    <p className="text-green-400 font-semibold text-sm">Seat Ready. Just Fly.</p>
                                    <p className="text-gray-600 text-xs mt-0.5">Engine is live — adjust inputs to recalibrate</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}