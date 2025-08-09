"use client";
import React from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import type { View } from '@/components/StakingApp';

interface StartScreenProps {
  setView: React.Dispatch<React.SetStateAction<View>>;
}

const StartScreen: React.FC<StartScreenProps> = ({ setView }) => {
  return (
    <section className="relative text-center flex flex-col items-center justify-center overflow-hidden w-full h-full">
      <div className="relative z-10 p-8 glass-panel rounded-lg shadow-xl max-w-3xl">
        <h2 className="text-5xl font-extrabold text-white mb-6 animate-pulse">Staking Hub</h2>
        <p className="text-xl text-gray-300 mb-8">
          Unlock Your Financial Potential. Securely stake USDT and earn daily rewards.
        </p>
        <div className="mb-8 space-y-4"></div>
        <Button
          onClick={() => setView('signup')}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 h-auto"
        >
          Get Started
        </Button>
      </div>
    </section>
  );
};

export default StartScreen;
