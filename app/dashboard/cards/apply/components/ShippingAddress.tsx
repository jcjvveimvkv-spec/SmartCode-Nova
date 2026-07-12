'use client';

import { MapPin } from 'lucide-react';
import type { FormData } from '../types';

interface ShippingAddressProps {
    formData: FormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    countryOptions: { value: string; label: string }[];
}

export default function ShippingAddress({ formData, onChange, countryOptions }: ShippingAddressProps) {
    return (
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-400" />
                Shipping Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-gray-400 text-sm block mb-1">Street Address *</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={onChange}
                        placeholder="123 Main Street, Apt 4B"
                        className="w-full bg-[#0b0e14] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="text-gray-400 text-sm block mb-1">City *</label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={onChange}
                        placeholder="New York"
                        className="w-full bg-[#0b0e14] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="text-gray-400 text-sm block mb-1">State/Province *</label>
                    <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={onChange}
                        placeholder="NY"
                        className="w-full bg-[#0b0e14] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="text-gray-400 text-sm block mb-1">ZIP/Postal Code *</label>
                    <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={onChange}
                        placeholder="10001"
                        className="w-full bg-[#0b0e14] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="text-gray-400 text-sm block mb-1">Country *</label>
                    <select
                        name="country"
                        value={formData.country}
                        onChange={onChange}
                        className="w-full bg-[#0b0e14] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                        required
                    >
                        {countryOptions.map((country) => (
                            <option key={country.value} value={country.value}>
                                {country.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}