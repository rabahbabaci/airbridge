import React from 'react';
import { motion } from 'framer-motion';
import { Car, Building2, Shield, Luggage, Clock, SlidersHorizontal, Footprints, CheckCircle2 } from 'lucide-react';

const steps = [
    { icon: Car, number: '01', title: 'Choose transport mode', desc: 'Uber, driving, train, bus — each has a different timing profile.' },
    { icon: Building2, number: '02', title: 'Arrive at airport', desc: 'Drop-off, parking, or transit — we account for the approach.' },
    { icon: Shield, number: '03', title: 'Security checkpoint', desc: 'TSA PreCheck, standard lane, or CLEAR — we know the difference.' },
    { icon: Luggage, number: '04', title: 'Baggage logic', desc: 'Checked bags add time. Tell us how many — we factor it in.' },
    { icon: Clock, number: '05', title: 'TSA timing layer', desc: 'Live wait time data layered with historical patterns by airport.' },
    { icon: SlidersHorizontal, number: '06', title: 'Personal preference buffers', desc: 'Your confidence profile sets how much cushion you want.' },
    { icon: Footprints, number: '07', title: 'Post-security gate walk', desc: 'Terminal size and gate distance are calculated per airport.' },
    { icon: CheckCircle2, number: '08', title: 'Final gate arrival', desc: 'Confidence-scored output so you know exactly how safe your timing is.' },
];

export default function JourneyFlow() {
    return (
        <section className="py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">How We Think</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-3">
                        The Full Door-to-Gate Journey
                    </h2>
                    <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
                        Every leg of your trip, modeled intelligently.
                    </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.07 }}
                            className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-5"
                        >
                            <div className="absolute -top-3 left-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {step.number}
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-4 mt-2">
                                <step.icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{step.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/25">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">One optimized door-to-gate departure time.</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}