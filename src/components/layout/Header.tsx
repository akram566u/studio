"use client";
import React, { useContext } from 'react';
import { AppContext } from '@/components/providers/AppProvider';
import { Button } from '@/components/ui/button';
import type { View } from '@/components/StakingApp';

interface HeaderProps {
  setView: React.Dispatch<React.SetStateAction<View>>;
}

const Header: React.FC<HeaderProps> = ({ setView }) => {
  const context = useContext(AppContext);
  
  if (!context) return null;
  const { currentUser, isAdmin, signOut, websiteTitle } = context;

  const handleSignOut = () => {
    signOut();
    setView('start');
  };

  return (
    <header className="glass-panel p-4 shadow-lg flex justify-between items-center z-10 w-full">
      <h1 className="text-3xl font-bold text-blue-400">{websiteTitle}</h1>
      <nav className="space-x-4">
        {!currentUser && !isAdmin ? (
          <>
            <Button onClick={() => setView('signin')} variant="secondary">Sign In</Button>
            <Button onClick={() => setView('signup')}>Sign Up</Button>
          </>
        ) : (
          <Button onClick={handleSignOut} variant="destructive">Sign Out</Button>
        )}
      </nav>
    </header>
  );
};

export default Header;
