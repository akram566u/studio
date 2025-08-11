
'use client';
import { useState, useContext, useEffect } from 'react';
import { AppContext } from './providers/AppProvider';

import Header from './layout/Header';
import ThreeBackground from './layout/ThreeBackground';
import StartScreen from './start/StartScreen';
import AdminDashboard from './dashboard/AdminDashboard';
import UserDashboard from './dashboard/UserDashboard';
import { SignInForm, SignUpForm } from './auth/AuthForms';
import { GlassPanel } from './ui/GlassPanel';
import { Button } from './ui/button';

export type View = 'start' | 'signup' | 'signin' | 'user_dashboard' | 'admin_dashboard' | 'verify_email';

const VerifyEmailView: React.FC<{ setView: React.Dispatch<React.SetStateAction<View>>, email: string | null }> = ({ setView, email }) => (
    <GlassPanel className="w-full max-w-md p-8 text-center">
        <h2 className="text-3xl font-bold text-blue-400 mb-4">Verify Your Email</h2>
        <p className="text-gray-300 mb-6">
            A verification link has been sent to <span className="font-bold text-yellow-400">{email || 'your email address'}</span>. Please check your inbox and click the link to activate your account.
        </p>
        <p className="text-sm text-gray-400 mb-6">
            You can close this window. Once verified, you will be able to sign in.
        </p>
        <Button onClick={() => setView('signin')}>Back to Sign In</Button>
    </GlassPanel>
);


export default function StakingApp() {
  const [view, setView] = useState<View>('start');
  const [emailForVerification, setEmailForVerification] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const context = useContext(AppContext);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!context) {
    // This can happen briefly on the very first load.
    return <div>Loading Context...</div>;
  }
  const { currentUser, isAdmin } = context;

  const renderView = () => {
    // Prevent rendering any view until client is mounted and auth state is known
    if (!isClient) {
        return <div>Loading...</div>;
    }
    
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
        return <SignUpForm setView={setView} setEmailForVerification={setEmailForVerification} />;
      case 'signin':
        return <SignInForm setView={setView} />;
      case 'verify_email':
        return <VerifyEmailView setView={setView} email={emailForVerification} />;
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
