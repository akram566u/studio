
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Levels, Transaction } from '@/lib/types';
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
  updateWithdrawalAddress: (address: string) => void;
  deleteWithdrawalAddress: () => void;
  websiteTitle: string;
  levels: Levels;
  depositRequests: Transaction[];
  submitDepositRequest: (amount: number) => void;
  approveDeposit: (transactionId: string) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [websiteTitle, setWebsiteTitle] = useState("Staking Hub");
  const [depositRequests, setDepositRequests] = useState<Transaction[]>([]);
  const { toast } = useToast();

  const ADMIN_EMAIL = "admin@stakinghub.com";
  const ADMIN_PASSWORD = "admin123";

  const levels: Levels = {
    0: { interest: 0.00, minBalance: 0, directReferrals: 0, withdrawalLimit: 0 },
    1: { interest: 0.018, minBalance: 100, directReferrals: 0, withdrawalLimit: 150 },
    2: { interest: 0.03, minBalance: 800, directReferrals: 8, withdrawalLimit: 500 },
    3: { interest: 0.05, minBalance: 2000, directReferrals: 20, withdrawalLimit: 2000 },
    4: { interest: 0.07, minBalance: 8000, directReferrals: 36, withdrawalLimit: 5000 },
    5: { interest: 0.09, minBalance: 16000, directReferrals: 55, withdrawalLimit: 10000 },
  };

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
    const dummyUser: User = {
        id: 'user123',
        email: email,
        password: pass,
        balance: 0,
        level: 0, 
        userReferralCode: 'REF' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        referredBy: 'ADMINREF',
        directReferrals: 0,
        lastWithdrawalMonth: null,
        lastWithdrawalAmount: 0,
        transactions: [],
        referredUsers: [],
        lastInterestCreditTime: Date.now(),
        withdrawalCompletionTime: null,
        primaryWithdrawalAddress: '',
        firstDepositTime: null,
        registrationTime: Date.now(), // Set registration time
    };
    
    // For demonstration, if a user already "exists" (i.e. not a new signup)
    // we give them some stats. A real app would fetch this from a DB.
    if (email !== 'new@user.com') {
      dummyUser.balance = 1234.56;
      dummyUser.directReferrals = 8;
      
      // Logic to update level based on balance and referrals
      let newLevel = 0;
      for (const levelKey in levels) {
        const levelNum = parseInt(levelKey, 10);
        const levelData = levels[levelNum];
        if (dummyUser.balance >= levelData.minBalance && dummyUser.directReferrals >= levelData.directReferrals) {
          newLevel = Math.max(newLevel, levelNum);
        }
      }
      dummyUser.level = newLevel;

      // Simulate first deposit if balance is present for an existing user
      if (dummyUser.balance > 0 && !dummyUser.firstDepositTime) {
        dummyUser.firstDepositTime = Date.now() - (10 * 24 * 60 * 60 * 1000); 
      }
      // Simulate older registration for testing withdrawal availability
      dummyUser.registrationTime = Date.now() - (50 * 24 * 60 * 60 * 1000);
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
    // In a real app, you would create a user object and save to DB.
    // For this prototype, a new user is created with default values upon signing in
    // with an email like 'new@user.com'
    toast({ title: "Account created successfully! Please sign in." });
  };

  const updateWithdrawalAddress = (address: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, primaryWithdrawalAddress: address });
      toast({ title: "Success", description: "Withdrawal address updated." });
    }
  };

  const deleteWithdrawalAddress = () => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, primaryWithdrawalAddress: '' });
      toast({ title: "Success", description: "Withdrawal address deleted." });
    }
  };

  const submitDepositRequest = (amount: number) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be signed in.", variant: "destructive" });
      return;
    }
    if (amount <= 0) {
      toast({ title: "Error", description: "Deposit amount must be positive.", variant: "destructive" });
      return;
    }
    const newRequest: Transaction = {
      id: `txn_${Date.now()}_${Math.random()}`,
      userId: currentUser.id,
      email: currentUser.email,
      type: 'deposit',
      amount,
      status: 'pending',
      timestamp: Date.now(),
    };
    setDepositRequests(prev => [...prev, newRequest]);
    toast({ title: "Success", description: "Deposit request submitted for admin approval." });
  };

  const approveDeposit = (transactionId: string) => {
    setDepositRequests(prev => {
        const request = prev.find(r => r.id === transactionId);
        if (!request || request.status !== 'pending') return prev;

        // In a real app, you'd find the user by request.userId and update their data in the DB.
        // For this prototype, we'll assume the currently logged-in user is the one being approved
        // if their ID matches. This is a simplification.
        if (currentUser && currentUser.id === request.userId) {
            const updatedUser = { ...currentUser };
            const isFirstDeposit = updatedUser.balance === 0;
            updatedUser.balance += request.amount;

            // Set first deposit time if this is the first deposit that brings balance > 0
            if (isFirstDeposit && updatedUser.balance > 0 && !updatedUser.firstDepositTime) {
                updatedUser.firstDepositTime = Date.now();
            }

            // Update level
            let newLevel = 0;
            for (const levelKey in levels) {
                const levelNum = parseInt(levelKey, 10);
                const levelData = levels[levelNum];
                if (updatedUser.balance >= levelData.minBalance && updatedUser.directReferrals >= levelData.directReferrals) {
                    newLevel = Math.max(newLevel, levelNum);
                }
            }
            updatedUser.level = newLevel;

            setCurrentUser(updatedUser);
        } else {
             console.warn("User to approve deposit for is not currently logged in. Balance will not be updated in UI immediately.");
             // In a real app, you would still update the user in the database here.
        }

        toast({ title: "Success", description: `Deposit of ${request.amount} for ${request.email} approved.` });

        // Update request status to 'approved'
        return prev.map(r => r.id === transactionId ? { ...r, status: 'approved' } : r);
    });
};


  const value = {
    currentUser,
    isAdmin,
    signIn,
    signOut,
    signUp,
    updateWithdrawalAddress,
    deleteWithdrawalAddress,
    websiteTitle,
    levels,
    depositRequests,
    submitDepositRequest,
    approveDeposit,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
