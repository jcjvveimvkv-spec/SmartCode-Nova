'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function ReferralTestPage() {
  const [code, setCode] = useState('Loading...');
  const [userEmail, setUserEmail] = useState('Checking...');

  useEffect(() => {
    async function fetchData() {
      try {
        // Get session using the new client
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setUserEmail('Session error');
          setCode('Error: ' + sessionError.message);
          return;
        }

        if (session?.user) {
          const user = session.user;
          setUserEmail(user.email || 'No email');
          console.log('👤 User found:', user.email);

          // Fetch referral code
          const response = await fetch('/api/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'stats',
              user_id: user.id,
            }),
          });
          const result = await response.json();
          console.log('📊 API Result:', result);

          if (result.data?.code?.code) {
            setCode(result.data.code.code);
          } else {
            setCode('No code found');
          }
        } else {
          setUserEmail('Not logged in');
          setCode('Please log in');
        }
      } catch (err: unknown) {
        console.error('❌ Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setCode('Error: ' + errorMessage);
        setUserEmail('Error');
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl text-white mb-4">🔍 Referral Code Test</h1>
      <div className="bg-[#1a2332] p-6 rounded-xl border border-white/10">
        <p className="text-gray-400">User:</p>
        <p className="text-white font-mono mb-4">{userEmail}</p>
        <p className="text-gray-400">Referral Code:</p>
        <p className="text-purple-400 text-2xl font-bold">{code}</p>
      </div>
      <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-yellow-400 text-sm">If this shows "Not logged in", try logging out and back in.</p>
      </div>
    </div>
  );
}