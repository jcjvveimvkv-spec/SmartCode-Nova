'use client';

import { User } from 'lucide-react';
import type { UserData, FormData } from '../types';

interface PersonalInfoProps {
    user: UserData | null;
    formData: FormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PersonalInfo({ user, formData, onChange }: PersonalInfoProps) {
    return (
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-gray-400 text-sm block mb-1">Full Name</label>
                    <input
                        type="text"
                        value={user?.full_name || ''}
                        disabled
                        className="w-full bg-[#0b0e14] text-white/70 px-4 py-3 rounded-lg border border-white/10 cursor-not-allowed"
                        placeholder="Your full name"
                    />
                    <p className="text-gray-500 text-xs mt-1">Auto-filled from your profile</p>
                </div>
                <div>
                    <label className="text-gray-400 text-sm block mb-1">Email</label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full bg-[#0b0e14] text-white/70 px-4 py-3 rounded-lg border border-white/10 cursor-not-allowed"
                        placeholder="Your email"
                    />
                    <p className="text-gray-500 text-xs mt-1">Auto-filled from your profile</p>
                </div>
                <div>
                    <label className="text-gray-400 text-sm block mb-1">Phone Number *</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={onChange}
                        placeholder="+1 234 567 8900"
                        className="w-full bg-[#0b0e14] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="text-gray-400 text-sm block mb-1">Alternative Phone (Optional)</label>
                    <input
                        type="tel"
                        name="alternativePhone"
                        value={formData.alternativePhone}
                        onChange={onChange}
                        placeholder="+1 234 567 8901"
                        className="w-full bg-[#0b0e14] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="text-gray-400 text-sm block mb-1">Alternative Email (Optional)</label>
                    <input
                        type="email"
                        name="alternativeEmail"
                        value={formData.alternativeEmail}
                        onChange={onChange}
                        placeholder="alternative@email.com"
                        className="w-full bg-[#0b0e14] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
}