import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import {
    Plane, Car, Train, Bus, User, Shield, Zap, AlertCircle,
    ChevronDown, ArrowRight, Clock, MapPin, Luggage
} from 'lucide-react';

const transportOffsets = { uber: 0, driving: -5, train: 10, bus: 15, other: 5 };

const confidenceProfiles = [
    { id: 'safety', name: 'Safety Net',  desc: 'Maximum buffer, lowest stress',    range: '95–99%', icon: Shield,      bufferMultiplier: 1.5, confidenceScore: 97, color: 'green' },
    { id: 'sweet',  name: 'Sweet Spot',  desc: 'Balanced time vs certainty',        range: '90–95%', icon: Zap,         bufferMultiplier: 1.0, confidenceScore: 91, color: 'blue'  },
    { id: 'risk',   name: 'Risk Taker',  desc: 'Reclaim time, higher risk',         range: '70–88%', icon: AlertCircle, bufferMultiplier: 0.4, confidenceScore: 79, color: 'amber' },
];

const transportModes = [
    { id: 'uber',    label: 'Uber/Lyft', icon: Car   },
    { id: 'driving', label: 'Driving',   icon: Car   },
    { id: 'train',   label: 'Train',     icon: Train },
    { id: 'bus',     label: 'Bus',       icon: Bus   },
    { id: 'other',   label: 'Other',     icon: User  },
];

const airportData = {
    SFO: { name: 'San Francisco Intl',       traffic: 63, tsa: 41, walking: 17, baseBuffer: 16 },
    LAX: { name: 'Los Angeles Intl',         traffic: 58, tsa: 48, walking: 22, baseBuffer: 16 },
    JFK: { name: 'John F. Kennedy Intl',     traffic: 72, tsa: 52, walking: 19, baseBuffer: 16 },
    ORD: { name: "O'Hare Intl",              traffic: 54, tsa: 38, walking: 15, baseBuffer: 16 },
    ATL: { name: 'Hartsfield-Jackson Intl',  traffic: 48, tsa: 45, walking: 18, baseBuffer: 16 },
    DFW: { name: 'Dallas/Fort Worth Intl',   traffic: 51, tsa: 35, walking: 20, baseBuffer: 16 },
};

const confidenceColorMap = {
    green: { badge: 'bg-green-500/20 text-green-400 border-green-500/30', bar: 'from-green-500 to-emerald-400' },
    blue:  { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',    bar: 'from-blue-500 to-purple-500'   },
    amber: { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', bar: 'from-amber-500 to-orange-400'  },
};

function fmt(date, offsetMins) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + offsetMins);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function Engine() {
    const [selectedProfile, setSelectedProfile] = useState('sweet');
    const [airport, setAirport]         = useState('SFO');
    const [flightNumber, setFlightNumber] = useState('');
    const [transport, setTransport]     = useState('uber');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [hasBaggage, setHasBaggage]   = useState(false);
    const [baggageCount, setBaggageCount] = useState(1);
    const [withChildren, setWithChildren] = useState(false);
    const [extraTime, setExtraTime]     = useState('none');
    const [locked, setLocked]           = useState(false);

    const profile  = confidenceProfiles.find(p => p.id === selectedProfile);
    const base     = airportData[airport];
    const trafficTime  = base.traffic + (transportOffsets[transport] ?? 0);
    const baggageTime  = hasBaggage ? baggageCount * 7 : 0;
    const buffer       = Math.round(base.baseBuffer * profile.bufferMultiplier)
        + (withChildren ? 10 : 0)
        + (extraTime === '+15' ? 15 : extraTime === '+30' ? 30 : 0);
    const total        = trafficTime + baggageTime + base.tsa + base.walking + buffer;

    const gate = new Date(); gate.setHours(10, 0, 0, 0);
    const leaveTime     = fmt(gate, -total);
    const arriveAirport = fmt(gate, -(baggageTime + base.tsa + base.walking + buffer));
    const dropBaggage   = hasBaggage ? fmt(gate, -(base.tsa + base.walking + buffer)) : null;
    const tsaClear      = fmt(gate, -(base.walking + buffer));
    const arriveGate    = fmt(gate, -buffer);
    const boarding      = fmt(gate, 0);

    const timelineSteps = [
        { label: 'Leave Home',     time: leaveTime,     dot: 'bg-blue-500',   dur: `${trafficTime} min drive` },
        { label: 'Arrive Airport', time: arriveAirport, dot: 'bg-purple-500', dur: hasBaggage ? `${baggageTime} min bag drop` : `${base.tsa} min security` },
        ...(hasBaggage ? [{ label: 'Drop Baggage', time: dropBaggage, dot: 'bg-orange-400', dur: `${base.tsa} min security` }] : []),
        { label: 'Clear Security', time: tsaClear,      dot: 'bg-indigo-500', dur: `${base.walking} min walk` },
        { label: 'Arrive Gate',    time: arriveGate,    dot: 'bg-teal-500',   dur: `${buffer} min buffer` },
        { label: 'Boarding',       time: boarding,      dot: 'bg-green-500',  dur: '' },
    ];

    const animKey = `${selectedProfile}-${airport}-${transport}-${withChildren}-${extraTime}-${hasBaggage}-${baggageCount}`;

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-950">
            {/* ── Topbar ── */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl shrink-0 z-10">
                <div className="flex items-center gap-6">
                    <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Plane className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold text-white text-sm">AirBridge</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-5">
                        <Link to={createPageUrl('Home')} className="text-sm text-gray-400 hover:text-white transition-colors">Home</Link>
                        <span className="text-sm text-white font-medium border-b border-blue-500 pb-0.5">Departure Engine</span>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400 font-medium">Engine Active</span>
                    </div>
                    <button className="text-sm text-gray-400 hover:text-white transition-colors">Sign In</button>
                    <button className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-1.5 rounded-full font-medium transition-all">
                        Get Started
                    </button>
                </div>
            </header>

            {/* ── Main Split ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* LEFT — Inputs */}
                <div className="w-full md:w-[360px] lg:w-[400px] shrink-0 bg-white overflow-y-auto flex flex-col">
                    <div className="p-6 flex flex-col gap-5 flex-1">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Departure Setup</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Fill in your flight details below</p>
                        </div>

                        {/* Flight Number */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">Flight Number</label>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <Plane className="w-4 h-4 text-gray-400 shrink-0" />
                                <Input
                                    value={flightNumber}
                                    onChange={e => setFlightNumber(e.target.value)}
                                    placeholder="e.g. UA 452"
                                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Airport */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">Departure Airport</label>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                <select
                                    value={airport}
                                    onChange={e => setAirport(e.target.value)}
                                    className="flex-1 bg-transparent text-sm text-gray-900 font-medium focus:outline-none"
                                >
                                    {Object.entries(airportData).map(([code, d]) => (
                                        <option key={code} value={code}>{code} — {d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Transportation Mode */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">Transportation Mode</label>
                            <div className="flex gap-2">
                                {transportModes.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setTransport(m.id)}
                                        className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                                            transport === m.id
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        <m.icon className="w-4 h-4" />
                                        <span className="text-[10px] leading-tight text-center">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Confidence Profile */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">Confidence Profile</label>
                            <div className="flex flex-col gap-2">
                                {confidenceProfiles.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedProfile(p.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                                            selectedProfile === p.id
                                                ? 'bg-blue-50 border-blue-400'
                                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${selectedProfile === p.id ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-200'}`}>
                                            <p.icon className={`w-3.5 h-3.5 ${selectedProfile === p.id ? 'text-white' : 'text-gray-500'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${selectedProfile === p.id ? 'text-blue-700' : 'text-gray-900'}`}>{p.name}</p>
                                            <p className="text-xs text-gray-400">{p.desc}</p>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedProfile === p.id ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {selectedProfile === p.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Options */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setAdvancedOpen(o => !o)}
                                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-colors"
                            >
                                Advanced Options
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {advancedOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-700 font-medium">Checked baggage</p>
                                                    {hasBaggage && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className="text-xs text-gray-400">Bags:</span>
                                                            {[1,2,3].map(n => (
                                                                <button key={n} onClick={() => setBaggageCount(n)}
                                                                    className={`w-6 h-6 rounded text-xs font-semibold border transition-all ${baggageCount === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                                    {n}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => setHasBaggage(b => !b)}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hasBaggage ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${hasBaggage ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-gray-700 font-medium">Traveling with children</p>
                                                <button onClick={() => setWithChildren(c => !c)}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${withChildren ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${withChildren ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-700 font-medium mb-2">Extra airport time</p>
                                                <div className="flex gap-2">
                                                    {['none', '+15', '+30'].map(v => (
                                                        <button key={v} onClick={() => setExtraTime(v)}
                                                            className={`flex-1 text-xs py-1.5 rounded-lg font-medium border transition-all ${extraTime === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                                            {v === 'none' ? 'None' : v + ' min'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* CTA pinned at bottom */}
                    <div className="p-6 pt-0 shrink-0">
                        <button
                            onClick={() => setLocked(true)}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 text-sm"
                        >
                            Lock In My Departure Time
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* RIGHT — Results */}
                <div className="flex-1 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center px-8 py-6 relative overflow-hidden">
                    {/* Glow effects */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {!locked ? (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col items-center text-center gap-5 max-w-xs"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <Plane className="w-7 h-7 text-gray-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Your departure time<br />appears here</h2>
                                    <p className="text-gray-500 text-sm leading-relaxed">Fill in your flight details on the left<br />and hit "Lock In My Departure Time"</p>
                                </div>
                                <div className="w-full space-y-2 mt-2">
                                    <div className="h-2.5 bg-white/5 rounded-full w-3/4 mx-auto" />
                                    <div className="h-2.5 bg-white/5 rounded-full w-1/2 mx-auto" />
                                    <div className="h-10 bg-white/5 rounded-xl w-full mt-4" />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={animKey}
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="w-full max-w-xl flex flex-col gap-5"
                            >
                                {/* Leave time hero */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-1">Leave Home At</p>
                                        <span className="text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{leaveTime}</span>
                                        <p className="text-gray-500 text-xs mt-2">{flightNumber || 'Your flight'} · {airport} · {total} min door-to-gate</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${confidenceColorMap[profile.color].badge}`}>
                                            {profile.confidenceScore}% Confident
                                        </span>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Buffer</p>
                                            <p className="text-white font-semibold text-lg">{buffer} min</p>
                                            <p className="text-xs text-gray-500">{profile.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Confidence bar */}
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                        <span>Confidence score</span>
                                        <span className="text-gray-300 font-medium">{profile.confidenceScore}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${profile.confidenceScore}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className={`h-full rounded-full bg-gradient-to-r ${confidenceColorMap[profile.color].bar}`}
                                        />
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">Door-to-Gate Timeline</p>
                                    <div className="space-y-0">
                                        {timelineSteps.map((step, i) => (
                                            <div key={step.label} className="flex items-stretch gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${step.dot}`} />
                                                    {i < timelineSteps.length - 1 && (
                                                        <div className="w-px flex-1 bg-white/10 my-1" />
                                                    )}
                                                </div>
                                                <div className={`flex items-start justify-between w-full ${i < timelineSteps.length - 1 ? 'pb-3.5' : ''}`}>
                                                    <div>
                                                        <span className={`text-sm ${i === 0 ? 'text-white font-semibold' : 'text-gray-300'}`}>{step.label}</span>
                                                        {step.dur && <p className="text-xs text-gray-600 mt-0.5">{step.dur}</p>}
                                                    </div>
                                                    <span className={`text-sm font-bold ml-4 shrink-0 ${i === 0 ? 'text-white' : 'text-gray-400'}`}>{step.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setLocked(false)}
                                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-center"
                                >
                                    ← Adjust inputs
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}