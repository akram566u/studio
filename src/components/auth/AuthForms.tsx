"use client";
import React, { useState, useContext } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/components/providers/AppProvider';
import type { View } from '@/components/StakingApp';

interface AuthFormProps {
  setView: React.Dispatch<React.SetStateAction<View>>;
}

export const SignUpForm: React.FC<AuthFormProps> = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const context = useContext(AppContext);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    context?.signUp(email, password, referral);
    setView('signin');
  };

  return (
    <GlassPanel className="w-full max-w-md p-8">
      <h2 className="text-3xl font-bold text-center text-blue-400 mb-6">Create Your Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="signUpEmail">Email:</Label>
          <Input type="email" id="signUpEmail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@example.com" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="signUpPassword">Password:</Label>
          <Input type="password" id="signUpPassword" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" required minLength={6} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="referralCode">Referral Code (Mandatory):</Label>
          <Input type="text" id="referralCode" value={referral} onChange={(e) => setReferral(e.target.value)} placeholder="Enter referral code" required className="mt-1" />
        </div>
        <Button type="submit" className="w-full py-3 text-lg">Sign Up</Button>
      </form>
      <p className="text-center text-gray-400 text-sm mt-4">
        Already have an account?{' '}
        <button onClick={() => setView('signin')} className="text-blue-400 hover:underline">Sign In</button>
      </p>
    </GlassPanel>
  );
};

export const SignInForm: React.FC<AuthFormProps> = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const context = useContext(AppContext);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    context?.signIn(email, password);
  };

  return (
    <GlassPanel className="w-full max-w-md p-8">
      <h2 className="text-3xl font-bold text-center text-blue-400 mb-6">Welcome Back!</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="signInEmail">Email:</Label>
          <Input type="email" id="signInEmail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@example.com" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="signInPassword">Password:</Label>
          <Input type="password" id="signInPassword" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required className="mt-1" />
        </div>
        <Button type="submit" className="w-full py-3 text-lg">Sign In</Button>
      </form>
      <p className="text-center text-gray-400 text-sm mt-4">
        Don't have an account?{' '}
        <button onClick={() => setView('signup')} className="text-blue-400 hover:underline">Sign Up</button>
      </p>
    </GlassPanel>
  );
};
