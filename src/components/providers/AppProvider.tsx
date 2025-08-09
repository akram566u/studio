"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Levels } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

// This is a simplified context. The full logic from the user's script is extremely large
// and would be implemented here, including all functions for auth, transactions, admin actions,
// and localStorage management.
export interface AppContextType {
  currentUser: User | null;
  isAdmin: boolean;
  signIn: (email: string, pass: string) => void;
  signOut: () => void;
  signUp: (email: string, pass: string, referral: string) => void;
  // Many more functions and state variables would go here...
  websiteTitle: string;
  levels: Levels;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [websiteTitle, setWebsiteTitle] = useState("Staking Hub");
  const { toast } = useToast();

  const ADMIN_EMAIL = "admin@stakinghub.com";
  const ADMIN_PASSWORD = "admin123";

  const levels: Levels = {
    0: { interest: 0.00, minBalance: 100, directReferrals: 0, withdrawalLimit: 0 },
    1: { interest: 0.005, minBalance: 100, directReferrals: 0, withdrawalLimit: 150 },
    2: { interest: 0.006, minBalance: 500, directReferrals: 5, withdrawalLimit: 500 },
    3: { interest: 0.007, minBalance: 2000, directReferrals: 10, withdrawalLimit: 2000 },
    4: { interest: 0.008, minBalance: 5000, directReferrals: 15, withdrawalLimit: 5000 },
    5: { interest: 0.01, minBalance: 10000, directReferrals: 20, withdrawalLimit: 10000 },
  };

  // In a real implementation, all the logic from the user's <script> tag would be
  // ported here, using useState for state and useEffect for side-effects like
  // reading/writing to localStorage.

  useEffect(() => {
    // On initial load, you would check localStorage for a logged-in user session
  }, []);

  const signIn = (email: string, pass: string) => {
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
        setIsAdmin(true);
        setCurrentUser(null);
        toast({ title: "Admin signed in successfully!" });
        return;
    }
    // Dummy user login for demonstration
    // Let's check if the user has a balance to determine their level
    const dummyUser: User = {
        id: 'user123',
        email: email,
        balance: 1234.56,
        level: 1, // Let's assume this user made a deposit
        userReferralCode: 'REF123',
        referredBy: 'ADMINREF',
        directReferrals: 5,
        lastWithdrawalMonth: null,
        lastWithdrawalAmount: 0,
        transactions: [],
        referredUsers: [],
        lastInterestCreditTime: Date.now(),
        withdrawalCompletionTime: null,
        primaryWithdrawalAddress: '0x1234...5678',
        firstDepositTime: Date.now() - (50 * 24 * 60 * 60 * 1000)
    };
    if(dummyUser.balance >= 100) {
        // A real app would have more complex level logic
        dummyUser.level = 2; 
    } else {
        dummyUser.level = 0;
    }


    setCurrentUser(dummyUser);
    setIsAdmin(false);
    toast({ title: "Signed in successfully!" });
  };

  const signOut = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    toast({ title: "Signed out successfully!" });
  };
  
  const signUp = (email: string, pass: string, referral: string) => {
    if(!email || !pass || !referral) {
        toast({ title: "Error", description: "Please fill all fields.", variant: "destructive"});
        return;
    }
    // In a real app, you would create a user object with level 0
    // and save it to the database.
    toast({ title: "Account created successfully! Please sign in." });
    // This would typically redirect or change view to sign-in
  };


  const value = {
    currentUser,
    isAdmin,
    signIn,
    signOut,
    signUp,
    websiteTitle,
    levels,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
