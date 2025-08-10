'use client';
import { useState, useContext, useEffect } from 'react';
import { AppContext } from './providers/AppProvider';

import Header from './layout/Header';
import ThreeBackground from './layout/ThreeBackground';
import StartScreen from './start/StartScreen';
import AdminDashboard from './dashboard/AdminDashboard';
import UserDashboard from './dashboard/UserDashboard';
import { SignInForm, SignUpForm } from './auth/AuthForms';

export type View = 'start' | 'signup' | 'signin' | 'user_dashboard' | 'admin_dashboard';

export default function StakingApp() {
  const [view, setView] = useState<View>('start');
  const [isClient, setIsClient] = useState(false);
  const context = useContext(AppContext);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!context) {
    return <div>Loading...</div>; // Or some other loading state
  }
  const { currentUser, isAdmin } = context;

  const renderView = () => {
    if (isAdmin) {
        return <AdminDashboard />;
    }
    if (currentUser) {
        return <UserDashboard />;
    }

    switch (view) {
      case 'start':
        return <StartScreen setView={setView} />;
      case 'signup':
        return <SignUpForm setView={setView} />;
      case 'signin':
        return <SignInForm setView={setView} />;
      default:
        return <StartScreen setView={setView} />;
    }
  };
  
  return (
    <>
      {isClient && <ThreeBackground />}
      <Header setView={setView} />
      <main className="flex-grow flex items-center justify-center p-4 z-10">
        {renderView()}
      </main>
    </>
  );
}
