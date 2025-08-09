

"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Levels, Transaction } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

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
  withdrawalRequests: Transaction[];
  submitDepositRequest: (amount: number) => void;
  approveDeposit: (transactionId: string) => void;
  submitWithdrawalRequest: (amount: number) => void;
  approveWithdrawal: (transactionId: string) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [websiteTitle, setWebsiteTitle] = useState("Staking Hub");
  const [depositRequests, setDepositRequests] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<Transaction[]>([]);
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
    const isNewUser = email === 'new@user.com';

    const dummyUser: User = {
        id: 'user123',
        email: email,
        password: pass,
        balance: isNewUser ? 0 : 1234.56,
        level: isNewUser ? 0 : 2, // Will be recalculated
        userReferralCode: 'REF' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        referredBy: 'ADMINREF',
        directReferrals: isNewUser ? 0 : 8,
        lastWithdrawalMonth: null,
        lastWithdrawalAmount: 0,
        transactions: [],
        referredUsers: [],
        lastInterestCreditTime: Date.now(),
        withdrawalCompletionTime: null,
        primaryWithdrawalAddress: '',
        firstDepositTime: isNewUser ? null : Date.now() - (10 * 24 * 60 * 60 * 1000),
        registrationTime: isNewUser ? Date.now() : Date.now() - (50 * 24 * 60 * 60 * 1000),
    };
    
    let newLevel = 0;
    for (const levelKey in levels) {
      const levelNum = parseInt(levelKey, 10);
      const levelData = levels[levelNum];
      if (dummyUser.balance >= levelData.minBalance && dummyUser.directReferrals >= levelData.directReferrals) {
        newLevel = Math.max(newLevel, levelNum);
      }
    }
    dummyUser.level = newLevel;

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
    toast({ title: "Account created successfully! Please sign in with 'new@user.com' to see the new user flow." });
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
    const request = depositRequests.find(r => r.id === transactionId);
    if (!request || request.status !== 'pending') return;

    setDepositRequests(prev => prev.map(r => r.id === transactionId ? { ...r, status: 'approved' } : r));

    if (currentUser && currentUser.id === request.userId) {
        setCurrentUser(prevUser => {
            if (!prevUser) return null;

            const updatedUser = { ...prevUser };
            const isFirstEligibleDeposit = updatedUser.level === 0 && request.amount >= 100;
            updatedUser.balance += request.amount;

            if (isFirstEligibleDeposit && !updatedUser.firstDepositTime) {
                updatedUser.firstDepositTime = Date.now();
            }

            let newLevel = 0;
            for (const levelKey in levels) {
                const levelNum = parseInt(levelKey, 10);
                const levelData = levels[levelNum];
                if (updatedUser.balance >= levelData.minBalance && updatedUser.directReferrals >= levelData.directReferrals) {
                    newLevel = Math.max(newLevel, levelNum);
                }
            }
            updatedUser.level = newLevel;

            return updatedUser;
        });
    } else {
         console.warn("User to approve deposit for is not currently logged in. Balance will not be updated in UI immediately.");
    }

    toast({ title: "Success", description: `Deposit of ${request.amount} for ${request.email} approved.` });
  };
  
  const submitWithdrawalRequest = (amount: number) => {
    if (!currentUser) {
        toast({ title: "Error", description: "You must be signed in.", variant: "destructive" });
        return;
    }
    if (!currentUser.primaryWithdrawalAddress) {
        toast({ title: "Error", description: "You must set a withdrawal address first.", variant: "destructive" });
        return;
    }
    if (amount <= 0) {
        toast({ title: "Error", description: "Withdrawal amount must be positive.", variant: "destructive" });
        return;
    }
    if (amount > currentUser.balance) {
        toast({ title: "Error", description: "Insufficient balance.", variant: "destructive" });
        return;
    }

    const newRequest: Transaction = {
        id: `txn_w_${Date.now()}`,
        userId: currentUser.id,
        email: currentUser.email,
        type: 'withdrawal',
        amount,
        status: 'pending',
        timestamp: Date.now(),
        walletAddress: currentUser.primaryWithdrawalAddress,
    };

    setWithdrawalRequests(prev => [...prev, newRequest]);
    toast({ title: "Success", description: "Withdrawal request submitted for admin approval." });
  };

  const approveWithdrawal = (transactionId: string) => {
    const request = withdrawalRequests.find(r => r.id === transactionId);
    if (!request || request.status !== 'pending') return;
  
    setWithdrawalRequests(prev => prev.map(r => r.id === transactionId ? { ...r, status: 'approved' } : r));
    
    if (currentUser && currentUser.id === request.userId) {
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, balance: prevUser.balance - request.amount };
      });
    } else {
      console.warn("User to approve withdrawal for is not currently logged in. Balance will not be updated in UI immediately.");
    }

    toast({ title: "Success", description: `Withdrawal of ${request.amount} for ${request.email} approved.` });
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
    withdrawalRequests,
    submitDepositRequest,
    approveDeposit,
    submitWithdrawalRequest,
    approveWithdrawal,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
