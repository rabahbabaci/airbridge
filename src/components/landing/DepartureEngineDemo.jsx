import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plane, MapPin, Calendar as CalendarIcon, Shield, Zap, AlertCircle, ChevronDown, ArrowRight, Car, Users, Footprints, Timer } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

const confidenceProfiles = [
    { 
        id: 'safety', 
        name: 'Safety Net', 
        desc: 'Zero stress. Maximum buffer.', 
        range: '95-99%', 
        icon: Shield, 
        bufferMultiplier: 1.5,
        confidenceScore: 97,
        riskLabel: 'Low risk'
    },
    { 
        id: 'sweet', 
        name: 'Sweet Spot', 
        desc: 'Balanced. The smart traveler.', 
        range: '90-95%', 
        icon: Zap, 
        bufferMultiplier: 1.0,
        confidenceScore: 91,
        riskLabel: 'Low risk'
    },
    { 
        id: 'risk', 
        name: 'Risk Taker', 
        desc: 'Maximize reclaimed time.', 
        range: '70-88%', 
        icon: AlertCircle, 
        bufferMultiplier: 0.4,
        confidenceScore: 79,
        riskLabel: 'Tight window'
    }
];

const calculateTimes = (airport, profile) => {
    // Base times vary by airport size
    const airportProfiles = {
        'SFO': { traffic: 63, tsa: 41, walking: 17, baseBuffer: 16 },
        'LAX': { traffic: 58, tsa: 48, walking: 22, baseBuffer: 16 },
        'JFK': { traffic: 72, tsa: 52, walking: 19, baseBuffer: 16 },
        'ORD': { traffic: 54, tsa: 38, walking: 15, baseBuffer: 16 },
        'ATL': { traffic: 48, tsa: 45, walking: 18, baseBuffer: 16 },
        'DFW': { traffic: 51, tsa: 35, walking: 20, baseBuffer: 16 }
    };

    const base = airportProfiles[airport] || airportProfiles['SFO'];
    const buffer = Math.round(base.baseBuffer * profile.bufferMultiplier);
    
    return {
        traffic: base.traffic,
        tsa: base.tsa,
        walking: base.walking,
        buffer: buffer,
        total: base.traffic + base.tsa + base.walking + buffer
    };
};

const mockFlights = [
    'UA 452', 'AA 1234', 'DL 567', 'UA 890', 'AA 223', 'SW 456',
    'B6 789', 'AS 321', 'NK 654', 'F9 987'
];

export default function DepartureEngineDemo() {
    const [selectedProfile, setSelectedProfile] = useState('sweet');
    const [viewMode, setViewMode] = useState('breakdown');
    const [airport, setAirport] = useState('SFO');
    const [flightNumber, setFlightNumber] = useState('UA 452');
    const [date, setDate] = useState(new Date(2026, 2, 15));
    const [flightInputFocused, setFlightInputFocused] = useState(false);
    const [filteredFlights, setFilteredFlights] = useState([]);
    
    const currentProfile = confidenceProfiles.find(p => p.id === selectedProfile);
    const times = calculateTimes(airport, currentProfile);
    
    const timeBreakdown = [
        { label: 'Traffic', time: `${times.traffic} min`, percent: Math.round((times.traffic / times.total) * 100), color: 'bg-gradient-to-r from-blue-500 to-blue-400' },
        { label: 'TSA Wait', time: `${times.tsa} min`, percent: Math.round((times.tsa / times.total) * 100), color: 'bg-gradient-to-r from-purple-500 to-purple-400' },
        { label: 'Walking', time: `${times.walking} min`, percent: Math.round((times.walking / times.total) * 100), color: 'bg-gradient-to-r from-gray-400 to-gray-300' },
        { label: 'Buffer', time: `${times.buffer} min`, percent: Math.round((times.buffer / times.total) * 100), color: 'bg-gradient-to-r from-green-500 to-green-400' }
    ];
    
    const calculateDepartureTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - times.total);
        return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const calculateArrivalTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const handleFlightNumberChange = (value) => {
        setFlightNumber(value);
        if (value.length > 0) {
            const filtered = mockFlights.filter(flight => 
                flight.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredFlights(filtered);
        } else {
            setFilteredFlights([]);
        }
    };

    return (
        <section className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">Live Preview</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-3">
                        See the Engine in Action
                    </h2>
                    <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
                        This is what smart departure planning looks like.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto"
                >
                    {/* Left Panel - Departure Engine */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 flex flex-col">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Clock className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-gray-700 font-medium text-sm">Departure Engine</span>
                        </div>

                        {/* Flight Number Input */}
                        <div className="mb-6 relative">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block font-medium">Flight Number</label>
                            <div className="relative">
                                <Plane className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <Input
                                    value={flightNumber}
                                    onChange={(e) => handleFlightNumberChange(e.target.value)}
                                    onFocus={() => setFlightInputFocused(true)}
                                    onBlur={() => setTimeout(() => setFlightInputFocused(false), 200)}
                                    className="pl-10 h-10 border-gray-200 text-sm font-medium"
                                    placeholder="UA 452"
                                />
                            </div>
                            {flightInputFocused && filteredFlights.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredFlights.map((flight) => (
                                        <button
                                            key={flight}
                                            onClick={() => {
                                                setFlightNumber(flight);
                                                setFilteredFlights([]);
                                            }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-900 font-medium transition-colors"
                                        >
                                            {flight}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Airport & Date */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block font-medium">Airport</label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <select
                                        value={airport}
                                        onChange={(e) => setAirport(e.target.value)}
                                        className="w-full h-10 pl-10 pr-3 border border-gray-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="SFO">SFO</option>
                                        <option value="LAX">LAX</option>
                                        <option value="JFK">JFK</option>
                                        <option value="ORD">ORD</option>
                                        <option value="ATL">ATL</option>
                                        <option value="DFW">DFW</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block font-medium">Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="w-full h-10 border border-gray-200 rounded-md px-3 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900">
                                                {date ? format(date, 'MMM d, yyyy') : 'Pick a date'}
                                            </span>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Confidence Profile */}
                        <div className="flex-1 mb-6">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 block font-medium">Confidence Profile</label>
                            <div className="space-y-3">
                                {confidenceProfiles.map((profile) => (
                                    <button
                                        key={profile.id}
                                        onClick={() => setSelectedProfile(profile.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                            selectedProfile === profile.id
                                                ? 'bg-blue-50 border-blue-500'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                selectedProfile === profile.id ? 'border-blue-500' : 'border-gray-300'
                                            }`}>
                                                {selectedProfile === profile.id && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                                                <p className="text-xs text-gray-500">{profile.desc}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-400">{profile.range}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button className="w-full mt-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md text-sm">
                            Lock In My Departure Time
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Right Panel - Results */}
                    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl p-6 text-white relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
                        
                        <div className="relative">
                            {/* Leave Time */}
                            <motion.div 
                                key={`${selectedProfile}-${airport}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="mb-6"
                            >
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-medium">Leave Home At</p>
                                <h3 className="text-5xl font-bold text-white mb-2">{calculateDepartureTime()}</h3>
                                <p className="text-gray-400 text-sm mb-4">{currentProfile.desc}</p>
                                <p className="text-xs text-gray-500">Recommended window: 6:01-6:05 PM</p>
                            </motion.div>

                            {/* Flight Info */}
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
                                <span className="px-2 py-1 bg-gray-800 rounded">{flightNumber}</span>
                                <span>•</span>
                                <span>{airport}</span>
                                <span>•</span>
                                <span>{date ? format(date, 'MMM d') : ''}</span>
                            </div>

                            {/* Breakdown View */}
                            <div className="space-y-4 mb-6">
                                {timeBreakdown.map((item, index) => (
                                    <motion.div 
                                        key={item.label}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                {index === 0 && <Car className="w-4 h-4 text-gray-500" />}
                                                {index === 1 && <Users className="w-4 h-4 text-gray-500" />}
                                                {index === 2 && <Footprints className="w-4 h-4 text-gray-500" />}
                                                {index === 3 && <Timer className="w-4 h-4 text-gray-500" />}
                                                {item.label}
                                            </div>
                                            <span className="text-sm text-white font-bold">{item.time}</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.percent}%` }}
                                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                                className={`h-full ${item.color}`}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Model Insight */}
                            <div className="mb-6">
                                <p className="text-xs text-gray-500 italic">Model insight: Traffic is the main driver today.</p>
                                <button className="text-xs text-blue-400 flex items-center gap-1 mt-1 hover:text-blue-300 transition-colors">
                                    Why this time? <ChevronDown className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Confidence Score */}
                            <motion.div 
                                key={`score-${selectedProfile}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center justify-between pt-4 border-t border-gray-700/50"
                            >
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Confidence Score</span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                                        currentProfile.confidenceScore >= 95 ? 'bg-green-500/20 text-green-400' :
                                        currentProfile.confidenceScore >= 85 ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-amber-500/20 text-amber-400'
                                    }`}>
                                        {currentProfile.riskLabel}
                                    </span>
                                    <span className="text-3xl font-bold">{currentProfile.confidenceScore}%</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}