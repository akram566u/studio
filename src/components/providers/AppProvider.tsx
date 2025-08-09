

"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

const generateTxnId = () => `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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

  const addTransaction = useCallback((user: User, transactionData: Omit<Transaction, 'id' | 'userId' | 'timestamp'>): User => {
      const newTransaction: Transaction = {
          id: generateTxnId(),
          userId: user.id,
          timestamp: Date.now(),
          ...transactionData,
      };
      return { ...user, transactions: [newTransaction, ...user.transactions] };
  }, []);

  const signIn = (email: string, pass: string) => {
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
        setIsAdmin(true);
        setCurrentUser(null);
        toast({ title: "Admin signed in successfully!" });
        return;
    }
    
    // Simulating a new user vs an existing one
    const isNewUser = email === 'new@user.com';
    let dummyUser: User = {
        id: 'user123',
        email: email,
        password: pass,
        balance: isNewUser ? 0 : 1234.56,
        level: isNewUser ? 0 : 2,
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
    
    setCurrentUser(dummyUser);
    setIsAdmin(false);
    toast({ title: "Signed in successfully!" });
  };
  
  const signUp = (email: string, pass: string, referral: string) => {
    if(!email || !pass || !referral) {
        toast({ title: "Error", description: "Please fill all fields.", variant: "destructive"});
        return;
    }
    
    let newUser: User = {
        id: 'newUser' + Date.now(),
        email: 'new@user.com',
        password: 'password',
        balance: 0,
        level: 0,
        userReferralCode: 'REF' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        referredBy: referral,
        directReferrals: 0,
        lastWithdrawalMonth: null,
        lastWithdrawalAmount: 0,
        transactions: [],
        referredUsers: [],
        lastInterestCreditTime: Date.now(),
        withdrawalCompletionTime: null,
        primaryWithdrawalAddress: '',
        firstDepositTime: null,
        registrationTime: Date.now(),
    };
    
    newUser = addTransaction(newUser, {
        type: 'account_created',
        amount: 0,
        status: 'completed',
        description: `Account created successfully. Referred by ${referral}.`,
    });

    // In a real app, you would save this user to a database.
    // For this prototype, we just toast a message.
    console.log("New user created (not saved):", newUser);
    toast({ title: "Account created successfully! Please sign in with 'new@user.com' to see the new user flow." });
  };
  
  const signOut = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    toast({ title: "Signed out successfully!" });
  };

  const updateWithdrawalAddress = (address: string) => {
    if (currentUser) {
      let updatedUser = { ...currentUser, primaryWithdrawalAddress: address };
      updatedUser = addTransaction(updatedUser, {
          type: 'admin_adjusted',
          amount: 0,
          status: 'info',
          description: `Withdrawal address updated to ${address}.`
      });
      setCurrentUser(updatedUser);
      toast({ title: "Success", description: "Withdrawal address updated." });
    }
  };

  const deleteWithdrawalAddress = () => {
    if (currentUser && currentUser.primaryWithdrawalAddress) {
      let updatedUser = { ...currentUser, primaryWithdrawalAddress: '' };
      updatedUser = addTransaction(updatedUser, {
          type: 'admin_adjusted',
          amount: 0,
          status: 'info',
          description: `Withdrawal address deleted.`
      });
      setCurrentUser(updatedUser);
      toast({ title: "Success", description: "Withdrawal address deleted." });
    }
  };

  const submitDepositRequest = (amount: number) => {
    if (!currentUser) return;
    const newRequest: Transaction = {
      id: generateTxnId(),
      userId: currentUser.id,
      email: currentUser.email,
      type: 'deposit',
      amount,
      status: 'pending',
      timestamp: Date.now(),
      description: `User requested a deposit of ${amount} USDT.`
    };
    setDepositRequests(prev => [...prev, newRequest]);
    setCurrentUser(user => user ? addTransaction(user, newRequest) : null);
    toast({ title: "Success", description: "Deposit request submitted." });
  };

  const approveDeposit = (transactionId: string) => {
    const request = depositRequests.find(r => r.id === transactionId);
    if (!request) return;

    setDepositRequests(prev => prev.map(r => r.id === transactionId ? { ...r, status: 'approved' } : r));
    
    // This part would typically be handled by a backend, but for the prototype we update the current user if they are the one
    if (currentUser && currentUser.id === request.userId) {
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            let updatedUser = { ...prevUser };

            const isFirstEligibleDeposit = updatedUser.level === 0 && (updatedUser.balance + request.amount) >= 100;
            
            updatedUser.balance += request.amount;

            if (isFirstEligibleDeposit && !updatedUser.firstDepositTime) {
                updatedUser.firstDepositTime = Date.now();
            }

            const oldLevel = updatedUser.level;
            let newLevel = oldLevel;
            for (const levelKey in levels) {
                const levelNum = parseInt(levelKey, 10);
                if (updatedUser.balance >= levels[levelNum].minBalance && updatedUser.directReferrals >= levels[levelNum].directReferrals) {
                    newLevel = Math.max(newLevel, levelNum);
                }
            }
            updatedUser.level = newLevel;

            if (newLevel > oldLevel) {
                 updatedUser = addTransaction(updatedUser, { type: 'level_up', amount: newLevel, status: 'info', description: `User promoted to Level ${newLevel}` });
            }
            
            updatedUser = addTransaction(updatedUser, { type: 'deposit', amount: request.amount, status: 'completed', description: `Deposit of ${request.amount} USDT approved.` });

            return updatedUser;
        });
    }
    toast({ title: "Success", description: `Deposit for ${request.email} approved.` });
  };

  const submitWithdrawalRequest = (amount: number) => {
    if (!currentUser || !currentUser.primaryWithdrawalAddress) {
        toast({ title: "Error", description: "Set a withdrawal address first.", variant: "destructive" });
        return;
    }
     if (amount > currentUser.balance) {
        toast({ title: "Error", description: "Insufficient balance.", variant: "destructive" });
        return;
    }
    const newRequest: Transaction = {
        id: generateTxnId(),
        userId: currentUser.id,
        email: currentUser.email,
        type: 'withdrawal',
        amount,
        status: 'pending',
        timestamp: Date.now(),
        walletAddress: currentUser.primaryWithdrawalAddress,
        description: `User requested a withdrawal of ${amount} USDT.`
    };
    setWithdrawalRequests(prev => [...prev, newRequest]);
    setCurrentUser(user => user ? addTransaction(user, newRequest) : null);
    toast({ title: "Success", description: "Withdrawal request submitted." });
  };
  
  const approveWithdrawal = (transactionId: string) => {
    const request = withdrawalRequests.find(r => r.id === transactionId);
    if (!request) return;

    setWithdrawalRequests(prev => prev.map(r => r.id === transactionId ? { ...r, status: 'approved' } : r));

    if (currentUser && currentUser.id === request.userId) {
      setCurrentUser(prevUser => {
          if (!prevUser) return null;
          let updatedUser = { ...prevUser, balance: prevUser.balance - request.amount };
          updatedUser = addTransaction(updatedUser, { type: 'withdrawal', amount: request.amount, status: 'completed', description: `Withdrawal of ${request.amount} USDT approved.` });
          return updatedUser;
      });
    }
    toast({ title: "Success", description: `Withdrawal for ${request.email} approved.` });
  };
  
  // Effect for Daily Interest Credit
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser && currentUser.level > 0) {
        const now = Date.now();
        const timeSinceLastCredit = now - currentUser.lastInterestCreditTime;
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (timeSinceLastCredit >= twentyFourHours) {
          const interestRate = levels[currentUser.level].interest;
          const interestAmount = currentUser.balance * interestRate;
          
          setCurrentUser(prevUser => {
            if (!prevUser) return null;
            let updatedUser = { 
              ...prevUser, 
              balance: prevUser.balance + interestAmount,
              lastInterestCreditTime: now 
            };
            updatedUser = addTransaction(updatedUser, {
                type: 'interest_credit',
                amount: interestAmount,
                status: 'credited',
                description: `Daily interest of ${interestAmount.toFixed(4)} USDT credited.`
            });
            return updatedUser;
          });
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUser, levels, addTransaction]);

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
