import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Clock, Smile } from 'lucide-react';

const steps = [
    {
        icon: Plane,
        number: "01",
        title: "Enter your flight details",
        description: "Add your flight number, departure time, and home location."
    },
    {
        icon: Clock,
        number: "02",
        title: "Get your exact leave time",
        description: "Our AI calculates the optimal departure time with smart buffers."
    },
    {
        icon: Smile,
        number: "03",
        title: "Arrive stres-free guaranteed",
        description: "Follow our timing and enjoy peace of mind with our protection."
    }
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 lg:py-32 bg-gradient-to-b from-white via-blue-50/30 to-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">Simple Process</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-3">
                        How It Works
                    </h2>
                </motion.div>

                <div className="relative">
                    {/* Timeline line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent -translate-y-1/2" />

                    <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                className="relative"
                            >
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                                    {/* Number badge */}
                                    <div className="absolute -top-4 left-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                        Step {step.number}
                                    </div>

                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-6 mt-2">
                                        <step.icon className="w-7 h-7 text-blue-600" />
                                    </div>

                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Connector dot for desktop */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:flex absolute top-1/2 -right-6 w-3 h-3 bg-blue-500 rounded-full -translate-y-1/2 z-10">
                                        <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}