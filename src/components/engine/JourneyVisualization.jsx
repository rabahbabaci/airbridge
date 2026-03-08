import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

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

/** Format backend local time like "2026-03-07 10:09-08:00" to "10:09 AM" */
function formatDepartureDisplay(timeStr) {
    if (!timeStr) return '';
    const match = timeStr.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return timeStr;
    const hours = parseInt(match[2]);
    const minutes = match[3];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${h12}:${minutes} ${ampm}`;
}

export default function JourneyVisualization({
    locked,
    recommendation,
    selectedFlight,
    transport,
    profile,
    confidenceColorMap,
    onReady,
}) {
    useEffect(() => {
        if (locked && recommendation && onReady) {
            onReady();
        }
    }, [locked, recommendation, onReady]);

    const showTimeline = locked && recommendation != null;

    if (!showTimeline) {
        return (
            <div className="w-full max-w-lg mx-auto h-full flex flex-col items-center justify-center text-center min-h-0">
                <h2 className="text-2xl font-bold text-white mb-2">Your journey<br />starts here</h2>
                <p className="text-sm text-gray-500">Configure your trip on the left.<br />Your departure timeline will appear here.</p>
            </div>
        );
    }

    const segments = recommendation.segments || [];
    const leaveHomeAt = recommendation.leave_home_at;
    const confidenceScore = Math.round((recommendation.confidence_score ?? recommendation.confidence ?? 0) * 100);

    let cumulativeMinutes = 0;
    const stepsWithTimes = segments.map((seg) => {
        const duration = seg.duration_minutes ?? 0;
        cumulativeMinutes += duration;
        const arrivalTime = addMinutesAndFormat(leaveHomeAt, cumulativeMinutes);
        return { ...seg, arrivalTime, durationMinutes: duration };
    });
    const totalMinutes = cumulativeMinutes;
    const boardingTimeStr = selectedFlight?.departure_time
        ? formatDepartureDisplay(selectedFlight.departure_time)
        : '';

    const timelineKey = recommendation?.computed_at ?? recommendation?.leave_home_at ?? 'timeline';

    return (
        <div className="w-full max-w-lg mx-auto h-full flex flex-col min-h-0 overflow-y-auto" key={timelineKey}>
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-10"
            >
                <p className="text-[10px] uppercase tracking-wider font-semibold text-blue-400 mb-1">
                    LEAVE HOME BY
                </p>
                <p className="text-5xl font-extrabold text-white leading-tight">
                    {formatUTCToLocal(leaveHomeAt)}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                    {selectedFlight?.flight_number} · {selectedFlight?.origin_code} → {selectedFlight?.destination_code} · {totalMinutes}m door-to-gate
                </p>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10"
                >
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-semibold text-green-400">
                        {confidenceScore}% Confident
                    </span>
                </motion.div>
            </motion.div>

            {/* Vertical timeline */}
            <div className="relative flex">
                {/* Vertical line */}
                <div
                    className="absolute left-5 top-0 bottom-0 w-0.5 rounded-full"
                    style={{ background: 'linear-gradient(180deg, #6366f1, #22c55e)' }}
                />

                <div className="flex flex-col gap-0 pl-0">
                    {stepsWithTimes.map((seg, i) => (
                        <motion.div
                            key={seg.id ?? i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.35 }}
                            className="flex items-start gap-4 py-3"
                        >
                            <div
                                className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-indigo-400/80 bg-gray-900 text-sm font-bold text-white"
                                style={{ marginLeft: 14 }}
                            >
                                {i + 1}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-white">{seg.label}</span>
                                    {seg.duration_minutes != null && (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                                            {seg.duration_minutes}m
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{seg.arrivalTime}</p>
                                {seg.advice && (
                                    <p className="text-xs text-gray-500 mt-1">{seg.advice}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {/* Boarding node */}
                    <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * segments.length, duration: 0.35 }}
                        className="flex items-start gap-4 py-3"
                    >
                        <div
                            className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-green-400/80 bg-gray-900 text-sm font-bold text-white"
                            style={{ marginLeft: 14 }}
                        >
                            {segments.length + 1}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <span className="text-sm font-semibold text-white">Boarding</span>
                            <p className="text-xs text-gray-500 mt-0.5">{boardingTimeStr}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Footer stats */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + segments.length * 0.05, duration: 0.3 }}
                className="mt-8 flex gap-6 justify-center flex-wrap"
            >
                <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Journey</p>
                    <p className="text-lg font-bold text-white">{totalMinutes}m</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Boarding</p>
                    <p className="text-lg font-bold text-white">{boardingTimeStr}</p>
                </div>
            </motion.div>
        </div>
    );
}
