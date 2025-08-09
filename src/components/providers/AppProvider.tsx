"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Levels, Transaction } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

// A version of the User type that is safe to expose to the admin panel
export type UserForAdmin = Pick<User, 'id' | 'email' | 'balance' | 'level' | 'primaryWithdrawalAddress'>;

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
  declineDeposit: (transactionId: string) => void;
  submitWithdrawalRequest: (amount: number) => void;
  approveWithdrawal: (transactionId: string) => void;
  declineWithdrawal: (transactionId: string) => void;
  findUser: (email: string) => UserForAdmin | null;
  adjustUserBalance: (userId: string, amount: number) => UserForAdmin | null;
  adjustUserLevel: (userId: string, level: number) => UserForAdmin | null;
}

export const AppContext = createContext<AppContextType | null>(null);

const generateTxnId = () => `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const generateReferralCode = () => `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

// In-memory "database" for the prototype
let users: { [email: string]: User } = {};
let allTransactions: { [userId: string]: Transaction[] } = {};

const createInitialUser = (email: string, referredBy: string | null): User => {
    const userId = `user_${Date.now()}_${email}`;
    const newUser: User = {
        id: userId,
        email: email,
        password: 'password', // In a real app, this would be hashed
        balance: 0,
        level: 0,
        userReferralCode: generateReferralCode(),
        referredBy: referredBy,
        directReferrals: 0,
        transactions: [],
        referredUsers: [],
        lastInterestCreditTime: 0,
        primaryWithdrawalAddress: '',
        firstDepositTime: null,
        registrationTime: Date.now(),
        lastWithdrawalTime: null,
    };
    users[email] = newUser;
    allTransactions[userId] = [];
    return newUser;
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [websiteTitle, setWebsiteTitle] = useState("Staking Hub");
  const [depositRequests, setDepositRequests] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<Transaction[]>([]);
  const { toast } = useToast();

  const ADMIN_EMAIL = "admin@stakinghub.com";
  const ADMIN_PASSWORD = "admin123";
  const ADMIN_REFERRAL_CODE = "ADMINREF";

  const levels: Levels = {
    0: { interest: 0, minBalance: 0, directReferrals: 0, withdrawalLimit: 0 },
    1: { interest: 0.018, minBalance: 100, directReferrals: 0, withdrawalLimit: 150 },
    2: { interest: 0.03, minBalance: 800, directReferrals: 8, withdrawalLimit: 300 },
    3: { interest: 0.05, minBalance: 2000, directReferrals: 20, withdrawalLimit: 500 },
    4: { interest: 0.07, minBalance: 8000, directReferrals: 36, withdrawalLimit: 750 },
    5: { interest: 0.09, minBalance: 16000, directReferrals: 55, withdrawalLimit: 1000 },
  };
  
    // Initialize a default user for the prototype if it doesn't exist
    useEffect(() => {
        if (!users['user@example.com']) {
            const initialUser = createInitialUser('user@example.com', ADMIN_REFERRAL_CODE);
            users[initialUser.email] = addTransaction(initialUser, {
                type: 'account_created',
                amount: 0,
                status: 'completed',
                description: 'Account created successfully.',
            });
        }
    }, []);


  const addTransaction = useCallback((user: User, transactionData: Omit<Transaction, 'id' | 'userId' | 'timestamp'>): User => {
      const newTransaction: Transaction = {
          id: generateTxnId(),
          userId: user.id,
          timestamp: Date.now(),
          ...transactionData,
      };
      // Keep transactions sorted, newest first
      const sortedTransactions = [newTransaction, ...user.transactions].sort((a, b) => b.timestamp - a.timestamp);
      return { ...user, transactions: sortedTransactions };
  }, []);

  const signIn = (email: string, pass: string) => {
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
        setIsAdmin(true);
        setCurrentUser(null);
        toast({ title: "Admin signed in successfully!" });
        return;
    }
    
    const user = users[email];
    if (user) {
        // In a real app, compare hashed passwords
        setCurrentUser(user);
        setIsAdmin(false);
        toast({ title: "Signed in successfully!" });
    } else {
        toast({ title: "Error", description: "User not found. Please sign up.", variant: "destructive" });
    }
  };
  
  const signUp = (email: string, pass: string, referral: string) => {
    if(!email || !pass || !referral) {
        toast({ title: "Error", description: "Please fill all fields.", variant: "destructive"});
        return;
    }
    if(users[email]) {
        toast({ title: "Error", description: "User with this email already exists.", variant: "destructive"});
        return;
    }
    
    const referrer = Object.values(users).find(u => u.userReferralCode === referral);
    
    if (!referrer && referral !== ADMIN_REFERRAL_CODE) {
        toast({ title: "Error", description: "Invalid referral code.", variant: "destructive"});
        return;
    }
    
    const referrerCode = referrer ? referrer.userReferralCode : ADMIN_REFERRAL_CODE;
    let newUser = createInitialUser(email, referrerCode);

    newUser = addTransaction(newUser, {
        type: 'account_created',
        amount: 0,
        status: 'completed',
        description: `Account created successfully. Referred by ${referral}.`,
    });
    
    users[newUser.email] = newUser;

    if (referrer) {
        const updatedReferredUsers = [...referrer.referredUsers, { email: newUser.email, isActivated: false }];
        let updatedReferrer = { ...referrer, referredUsers: updatedReferredUsers };
        
        updatedReferrer = addTransaction(updatedReferrer, {
            type: 'new_referral',
            amount: 0,
            status: 'info',
            description: `New user registered with your code: ${newUser.email} (Pending activation)`
        });
        users[referrer.email] = updatedReferrer;

        if(currentUser && currentUser.id === referrer.id) {
            setCurrentUser(updatedReferrer);
        }
    }

    toast({ title: "Account created successfully!", description: "You can now sign in." });
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
          description: `Withdrawal address updated to ${address.substring(0, 10)}...`
      });
      setCurrentUser(updatedUser);
      users[updatedUser.email] = updatedUser;
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
      users[updatedUser.email] = updatedUser;
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
    setDepositRequests(prev => [...prev, newRequest].sort((a,b) => b.timestamp - a.timestamp));
    let updatedUser = addTransaction(currentUser, newRequest);
    setCurrentUser(updatedUser);
    users[updatedUser.email] = updatedUser;
    toast({ title: "Success", description: "Deposit request submitted." });
  };

  const approveDeposit = (transactionId: string) => {
    const request = depositRequests.find(r => r.id === transactionId);
    if (!request || !request.email) return;

    setDepositRequests(prev => prev.filter(r => r.id !== transactionId));
    
    let userToUpdate = users[request.email];
    if (userToUpdate) {
        
        userToUpdate.transactions = userToUpdate.transactions.map(tx => 
            tx.id === transactionId ? { ...tx, status: 'approved' as const, description: `Deposit of ${request.amount} USDT approved.` } : tx
        );
        
        const isFirstEligibleDeposit = userToUpdate.level === 0 && (userToUpdate.balance + request.amount) >= levels[1].minBalance;
        
        userToUpdate.balance += request.amount;

        if (isFirstEligibleDeposit) {
            userToUpdate.firstDepositTime = Date.now();
            userToUpdate = addTransaction(userToUpdate, { 
                type: 'info', amount: 0, status: 'info', description: '45-day withdrawal hold has started.' 
            });

            if (userToUpdate.referredBy && userToUpdate.referredBy !== ADMIN_REFERRAL_CODE) {
                const referrer = Object.values(users).find(u => u.userReferralCode === userToUpdate.referredBy);
                if (referrer) {
                    referrer.directReferrals += 1;
                    referrer.referredUsers = referrer.referredUsers.map(u => 
                        u.email === userToUpdate.email ? { ...u, isActivated: true } : u
                    );
                     const updatedReferrer = addTransaction(referrer, {
                        type: 'new_referral',
                        amount: 1,
                        status: 'info',
                        description: `Your referred user ${userToUpdate.email} is now active!`
                    });
                    users[referrer.email] = updatedReferrer;
                    if (currentUser && currentUser.id === referrer.id) {
                        setCurrentUser(updatedReferrer);
                    }
                }
            }
        }

        const oldLevel = userToUpdate.level;
        let newLevel = oldLevel;
        const sortedLevels = Object.keys(levels).map(Number).sort((a,b) => b-a);
        for (const levelKey of sortedLevels) {
            const levelDetails = levels[levelKey];
            if (userToUpdate.balance >= levelDetails.minBalance && userToUpdate.directReferrals >= levelDetails.directReferrals) {
                newLevel = levelKey;
                break;
            }
        }
        
        if (newLevel > oldLevel) {
             userToUpdate.level = newLevel;
             userToUpdate = addTransaction(userToUpdate, { type: 'level_up', amount: newLevel, status: 'info', description: `Promoted to Level ${newLevel}` });
        }
        
        users[userToUpdate.email] = userToUpdate;
        if (currentUser && currentUser.id === userToUpdate.id) {
            setCurrentUser(userToUpdate);
        }
    }
    toast({ title: "Success", description: `Deposit for ${request.email} approved.` });
  };
  
  const declineDeposit = (transactionId: string) => {
    const request = depositRequests.find(r => r.id === transactionId);
    if (!request || !request.email) return;

    setDepositRequests(prev => prev.filter(r => r.id !== transactionId));

    let userToUpdate = users[request.email];
    if (userToUpdate) {
        userToUpdate.transactions = userToUpdate.transactions.map(tx =>
            tx.id === transactionId ? { ...tx, status: 'declined' as const, description: `Deposit of ${request.amount} USDT declined.` } : tx
        );
        users[userToUpdate.email] = userToUpdate;
        if (currentUser && currentUser.id === userToUpdate.id) {
            setCurrentUser(userToUpdate);
        }
    }
    toast({ title: "Request Declined", description: `Deposit for ${request.email} has been declined.` });
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
    
    const withdrawalLimit = levels[currentUser.level].withdrawalLimit;
    if (amount > withdrawalLimit) {
        toast({ title: "Error", description: `Withdrawal amount exceeds your level limit of ${withdrawalLimit} USDT.`, variant: "destructive" });
        return;
    }

    if(currentUser.lastWithdrawalTime) {
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - currentUser.lastWithdrawalTime < thirtyDays) {
            toast({ title: "Error", description: "You can only make one withdrawal per month.", variant: "destructive" });
            return;
        }
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
    setWithdrawalRequests(prev => [...prev, newRequest].sort((a, b) => b.timestamp - a.timestamp));
    const updatedUser = addTransaction(currentUser, newRequest);
    setCurrentUser(updatedUser);
    users[updatedUser.email] = updatedUser;
    toast({ title: "Success", description: "Withdrawal request submitted." });
  };
  
  const approveWithdrawal = (transactionId: string) => {
    const request = withdrawalRequests.find(r => r.id === transactionId);
    if (!request || !request.email) return;

    setWithdrawalRequests(prev => prev.filter(r => r.id !== transactionId));

    let userToUpdate = users[request.email];
    if (userToUpdate) {
        userToUpdate.balance -= request.amount;
        userToUpdate.lastWithdrawalTime = Date.now();
        userToUpdate.transactions = userToUpdate.transactions.map(tx => 
            tx.id === transactionId ? { ...tx, status: 'approved' as const, description: `Withdrawal of ${request.amount} USDT approved.` } : tx
        );
        users[userToUpdate.email] = userToUpdate;
        if (currentUser && currentUser.id === userToUpdate.id) {
            setCurrentUser(userToUpdate);
        }
    }
    toast({ title: "Success", description: `Withdrawal for ${request.email} approved.` });
  };

  const declineWithdrawal = (transactionId: string) => {
    const request = withdrawalRequests.find(r => r.id === transactionId);
    if (!request || !request.email) return;

    setWithdrawalRequests(prev => prev.filter(r => r.id !== transactionId));

    let userToUpdate = users[request.email];
    if (userToUpdate) {
        userToUpdate.transactions = userToUpdate.transactions.map(tx =>
            tx.id === transactionId ? { ...tx, status: 'declined' as const, description: `Withdrawal of ${request.amount} USDT declined.` } : tx
        );
        users[userToUpdate.email] = userToUpdate;
        if (currentUser && currentUser.id === userToUpdate.id) {
            setCurrentUser(userToUpdate);
        }
    }
    toast({ title: "Request Declined", description: `Withdrawal for ${request.email} has been declined.` });
  };

  const findUser = (email: string): UserForAdmin | null => {
      const user = users[email];
      if (!user) return null;
      // Return a "safe" version of the user object
      return {
          id: user.id,
          email: user.email,
          balance: user.balance,
          level: user.level,
          primaryWithdrawalAddress: user.primaryWithdrawalAddress,
      };
  };

  const adjustUserBalance = (userId: string, amount: number): UserForAdmin | null => {
      const user = Object.values(users).find(u => u.id === userId);
      if (!user) return null;

      user.balance += amount;
      const updatedUser = addTransaction(user, {
          type: 'admin_adjusted',
          amount: amount,
          status: 'completed',
          description: `Admin adjusted balance by ${amount.toFixed(2)} USDT.`
      });
      users[user.email] = updatedUser;
      
      if (currentUser && currentUser.id === userId) {
          setCurrentUser(updatedUser);
      }
      toast({ title: "Success", description: "User balance adjusted." });
      return findUser(user.email);
  };

  const adjustUserLevel = (userId: string, level: number): UserForAdmin | null => {
      const user = Object.values(users).find(u => u.id === userId);
      if (!user) return null;

      user.level = level;
      const updatedUser = addTransaction(user, {
          type: 'level_up',
          amount: level,
          status: 'info',
          description: `Admin set level to ${level}.`
      });
      users[user.email] = updatedUser;
      
      if (currentUser && currentUser.id === userId) {
          setCurrentUser(updatedUser);
      }
      toast({ title: "Success", description: "User level adjusted." });
      return findUser(user.email);
  };
  
  // Effect for Daily Interest Credit
  useEffect(() => {
    const interval = setInterval(() => {
      Object.values(users).forEach(user => {
        if (user && user.level > 0 && user.firstDepositTime) {
          const now = Date.now();
          const lastCredit = user.lastInterestCreditTime || user.firstDepositTime;
          const timeSinceLastCredit = now - lastCredit;
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (timeSinceLastCredit >= twentyFourHours) {
            const interestRate = levels[user.level].interest;
            const interestAmount = user.balance * interestRate;
            
            let updatedUser = { 
              ...user, 
              balance: user.balance + interestAmount,
              lastInterestCreditTime: now 
            };
            updatedUser = addTransaction(updatedUser, {
                type: 'interest_credit',
                amount: interestAmount,
                status: 'credited',
                description: `Daily interest of ${interestAmount.toFixed(4)} USDT credited.`
            });
            users[updatedUser.email] = updatedUser;

            if (currentUser && currentUser.id === updatedUser.id) {
              setCurrentUser(updatedUser);
              toast({ title: "Interest Credited!", description: `You earned ${interestAmount.toFixed(4)} USDT.`});
            }
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUser, levels, addTransaction, toast]);


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
    declineDeposit,
    submitWithdrawalRequest,
    approveWithdrawal,
    declineWithdrawal,
    findUser,
    adjustUserBalance,
    adjustUserLevel,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
