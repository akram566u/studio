
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { User, Levels, Transaction, AugmentedTransaction, RestrictionMessage, StartScreenSettings, Level, DashboardPanel, ReferralBonusSettings } from '@/lib/types';
import { initialLevels, initialRestrictionMessages, initialStartScreen, initialDashboardPanels, initialReferralBonusSettings } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { hexToHsl } from '@/lib/utils';


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
  updateWebsiteTitle: (newTitle: string) => void;
  levels: Levels;
  updateLevel: (level: number, details: Level) => void;
  addLevel: (newLevelKey: number) => void;
  deleteLevel: (levelKey: number) => void;
  allPendingRequests: AugmentedTransaction[];
  submitDepositRequest: (amount: number) => void;
  approveDeposit: (transactionId: string) => void;
  declineDeposit: (transactionId: string) => void;
  submitWithdrawalRequest: (amount: number) => void;
  approveWithdrawal: (transactionId: string) => void;
  declineWithdrawal: (transactionId: string) => void;
  findUser: (email: string) => Promise<UserForAdmin | null>;
  adjustUserBalance: (userId: string, amount: number) => Promise<UserForAdmin | null>;
  adjustUserLevel: (userId: string, level: number) => Promise<UserForAdmin | null>;
  adminUpdateUserEmail: (userId: string, newEmail: string) => Promise<UserForAdmin | null>;
  adminUpdateUserWithdrawalAddress: (userId: string, newAddress: string) => Promise<UserForAdmin | null>;
  restrictionMessages: RestrictionMessage[];
  updateRestrictionMessages: (messages: RestrictionMessage[]) => void;
  addRestrictionMessage: () => void;
  deleteRestrictionMessage: (id: string) => void;
  startScreenContent: StartScreenSettings;
  updateStartScreenContent: (content: Omit<StartScreenSettings, 'customContent'>) => void;
  adminReferrals: UserForAdmin[];
  applyTheme: (theme: {primary: string, accent: string}) => void;
  dashboardPanels: DashboardPanel[];
  updateDashboardPanel: (id: string, updates: Partial<DashboardPanel>) => void;
  addDashboardPanel: () => void;
  deleteDashboardPanel: (id: string) => void;
  referralBonusSettings: ReferralBonusSettings;
  updateReferralBonusSettings: (settings: ReferralBonusSettings) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

const generateTxnId = () => `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const generateReferralCode = () => `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // App settings - for a real app, these could be stored in Firestore as well
  const [websiteTitle, setWebsiteTitle] = useState("Staking Hub");
  const [levels, setLevels] = useState<Levels>(initialLevels);
  const [restrictionMessages, setRestrictionMessages] = useState<RestrictionMessage[]>(initialRestrictionMessages);
  const [startScreenContent, setStartScreenContent] = useState<StartScreenSettings>(initialStartScreen);
  const [dashboardPanels, setDashboardPanels] = useState<DashboardPanel[]>(initialDashboardPanels);
  const [referralBonusSettings, setReferralBonusSettings] = useState<ReferralBonusSettings>(initialReferralBonusSettings);
  
  // Admin-specific state
  const [allPendingRequests, setAllPendingRequests] = useState<AugmentedTransaction[]>([]);
  const [adminReferrals, setAdminReferrals] = useState<UserForAdmin[]>([]);
  
  const { toast } = useToast();
  
  const ADMIN_EMAIL = "admin@stakinghub.com";
  const ADMIN_PASSWORD = "admin123";
  const ADMIN_REFERRAL_CODE = "ADMINREF";

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      setCurrentUser({ id: userDocSnap.id, ...userDocSnap.data() } as User);
    } else {
      console.log("No such user document!");
      // This case might happen if user is created in Auth but not in Firestore.
      // We can create it here or handle as an error.
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email === ADMIN_EMAIL) {
            setIsAdmin(true);
            setCurrentUser(null);
            setLoading(false);
        } else {
            setIsAdmin(false);
            fetchUserData(user);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchUserData]);

  const addTransaction = useCallback(async (userId: string, transactionData: Omit<Transaction, 'userId' | 'timestamp'>) => {
      const newTransaction: Transaction = {
          userId,
          timestamp: Date.now(),
          ...transactionData,
      };
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        transactions: arrayUnion(newTransaction)
      });
      return newTransaction;
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
        // Sign in to a dummy admin account or handle admin logic
        await signInWithEmailAndPassword(auth, email, pass);
        toast({ title: "Admin signed in successfully!" });
        return;
      }
      await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Signed in successfully!" });
    } catch (error) {
      console.error("Sign in error:", error);
      toast({ title: "Error", description: "Invalid credentials.", variant: "destructive" });
    }
  };
  
  const signUp = async (email: string, pass: string, referral: string) => {
    if(!email || !pass || !referral) {
        toast({ title: "Error", description: "Please fill all fields.", variant: "destructive"});
        return;
    }

    try {
        const usersRef = collection(db, "users");
        
        // Check for existing user with email
        const emailQuery = query(usersRef, where("email", "==", email));
        const emailQuerySnapshot = await getDocs(emailQuery);
        if (!emailQuerySnapshot.empty) {
            toast({ title: "Error", description: "User with this email already exists.", variant: "destructive"});
            return;
        }

        // Check for referrer
        const referralQuery = query(usersRef, where("userReferralCode", "==", referral));
        const referralQuerySnapshot = await getDocs(referralQuery);
        
        const referrerDoc = referralQuerySnapshot.docs[0];
        
        if (referralQuerySnapshot.empty && referral !== ADMIN_REFERRAL_CODE) {
            toast({ title: "Error", description: "Invalid referral code.", variant: "destructive"});
            return;
        }
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUserAuth = userCredential.user;

        const newUser: User = {
            id: newUserAuth.uid,
            email: email,
            balance: 0,
            level: 0,
            userReferralCode: generateReferralCode(),
            referredBy: referrerDoc ? referrerDoc.id : ADMIN_REFERRAL_CODE,
            directReferrals: 0,
            transactions: [],
            referredUsers: [],
            lastInterestCreditTime: 0,
            primaryWithdrawalAddress: '',
            firstDepositTime: null,
            registrationTime: Date.now(),
            lastWithdrawalTime: null,
        };

        // Create user document in Firestore
        await setDoc(doc(db, "users", newUserAuth.uid), newUser);
        await addTransaction(newUserAuth.uid, {
            id: generateTxnId(),
            type: 'account_created',
            amount: 0,
            status: 'completed',
            description: `Account created successfully. Referred by ${referral}.`,
        });

        // Update referrer if one exists
        if(referrerDoc) {
            const referrerRef = doc(db, "users", referrerDoc.id);
            await updateDoc(referrerRef, {
                referredUsers: arrayUnion({ email: newUser.email, isActivated: false })
            });
            await addTransaction(referrerDoc.id, {
                id: generateTxnId(),
                type: 'new_referral',
                amount: 0,
                status: 'info',
                description: `New user registered with your code: ${newUser.email} (Pending activation)`
            });
        }
        
        toast({ title: "Account created successfully!", description: "You can now sign in." });

    } catch (error) {
        console.error("Sign up error:", error);
        toast({ title: "Error", description: "Could not create account.", variant: "destructive" });
    }
  };
  
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: "Signed out successfully!" });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const updateWithdrawalAddress = async (address: string) => {
    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.id);
      await updateDoc(userDocRef, { primaryWithdrawalAddress: address });
      await addTransaction(currentUser.id, {
          id: generateTxnId(),
          type: 'admin_adjusted',
          amount: 0,
          status: 'info',
          description: `Withdrawal address updated to ${address.substring(0, 10)}...`
      });
      setCurrentUser(prev => prev ? { ...prev, primaryWithdrawalAddress: address } : null);
      toast({ title: "Success", description: "Withdrawal address updated." });
    }
  };

  const deleteWithdrawalAddress = async () => {
    if (currentUser && currentUser.primaryWithdrawalAddress) {
      const userDocRef = doc(db, "users", currentUser.id);
      await updateDoc(userDocRef, { primaryWithdrawalAddress: '' });
      await addTransaction(currentUser.id, {
          id: generateTxnId(),
          type: 'admin_adjusted',
          amount: 0,
          status: 'info',
          description: `Withdrawal address deleted.`
      });
      setCurrentUser(prev => prev ? { ...prev, primaryWithdrawalAddress: '' } : null);
      toast({ title: "Success", description: "Withdrawal address deleted." });
    }
  };

  const submitDepositRequest = async (amount: number) => {
    if (!currentUser) return;
    const newRequest = {
      id: generateTxnId(),
      type: 'deposit' as 'deposit',
      amount,
      status: 'pending' as 'pending',
      description: `User requested a deposit of ${amount} USDT.`
    };
    
    await addTransaction(currentUser.id, newRequest);
    setCurrentUser(prev => prev ? { ...prev, transactions: [ ...prev.transactions, {...newRequest, userId: prev.id, timestamp: Date.now()} ]} : null);
    toast({ title: "Success", description: "Deposit request submitted." });
  };
  
  const processRequest = async (transactionId: string, newStatus: 'approved' | 'declined', type: 'deposit' | 'withdrawal') => {
    const usersRef = collection(db, "users");
    const allUsersSnap = await getDocs(usersRef);
    let userFound: User | null = null;
    let userDocId: string | null = null;
    
    for (const userDoc of allUsersSnap.docs) {
        const userData = userDoc.data() as User;
        if (userData.transactions.some(t => t.id === transactionId && t.status === 'pending')) {
            userFound = userData;
            userDocId = userDoc.id;
            break;
        }
    }

    if (!userFound || !userDocId) {
        toast({ title: "Error", description: "Transaction not found or already processed.", variant: "destructive" });
        return;
    }

    const userRef = doc(db, "users", userDocId);
    const request = userFound.transactions.find(tx => tx.id === transactionId)!;

    const description = `${type.charAt(0).toUpperCase() + type.slice(1)} of ${request.amount} USDT ${newStatus}.`;
    const updatedTransactions = userFound.transactions.map(tx =>
        tx.id === transactionId ? { ...tx, status: newStatus, description } : tx
    );
    
    const batch = writeBatch(db);
    const updates: any = { transactions: updatedTransactions };

    if (newStatus === 'approved') {
        if (type === 'deposit') {
            updates.balance = userFound.balance + request.amount;
            if (!userFound.firstDepositTime) {
                updates.firstDepositTime = Date.now();
            }
        } else { // withdrawal
            updates.balance = userFound.balance - request.amount;
            updates.lastWithdrawalTime = Date.now();
        }
    }
    
    batch.update(userRef, updates);
    await batch.commit();
    
    // Post-approval logic
    if (newStatus === 'approved' && type === 'deposit') {
        const postApprovalUserSnap = await getDoc(userRef);
        const postApprovalUserData = postApprovalUserSnap.data() as User;

        const oldLevel = userFound.level;
        let newLevel = oldLevel;
        const sortedLevels = Object.keys(levels).map(Number).sort((a, b) => b - a);
        for (const levelKey of sortedLevels) {
            if (levelKey > newLevel) { // Only check for promotion
                const levelDetails = levels[levelKey];
                if (postApprovalUserData.balance >= levelDetails.minBalance && postApprovalUserData.directReferrals >= levelDetails.directReferrals) {
                    newLevel = levelKey;
                    break;
                }
            }
        }

        if (newLevel > oldLevel) {
            await updateDoc(userRef, { level: newLevel });
            await addTransaction(userDocId, { id: generateTxnId(), type: 'level_up', amount: newLevel, status: 'info', description: `Promoted to Level ${newLevel}` });
        }

        const isFirstDeposit = !userFound.firstDepositTime;
        if (isFirstDeposit && referralBonusSettings.isEnabled && request.amount >= referralBonusSettings.minDeposit && userFound.referredBy && userFound.referredBy !== ADMIN_REFERRAL_CODE) {
            const referrerRef = doc(db, "users", userFound.referredBy);
            const referrerSnap = await getDoc(referrerRef);
            if (referrerSnap.exists()) {
                const referrerData = referrerSnap.data() as User;
                const bonusAmount = referralBonusSettings.bonusAmount;
                await updateDoc(referrerRef, {
                    balance: referrerData.balance + bonusAmount,
                    directReferrals: (referrerData.directReferrals || 0) + 1,
                    referredUsers: referrerData.referredUsers.map(u => u.email === postApprovalUserData.email ? { ...u, isActivated: true } : u)
                });
                await addTransaction(referrerData.id, {
                    id: generateTxnId(),
                    type: 'referral_bonus',
                    amount: bonusAmount,
                    status: 'credited',
                    description: `You received a ${bonusAmount} USDT bonus for activating ${postApprovalUserData.email}!`
                });
            }
        }
    }

    toast({ title: "Success", description: `${type} request has been ${newStatus}.` });
    fetchAllPendingRequests(); // Refresh admin list
  };
    
    const approveDeposit = (transactionId: string) => processRequest(transactionId, 'approved', 'deposit');
    const declineDeposit = (transactionId: string) => processRequest(transactionId, 'declined', 'deposit');
    
    const approveWithdrawal = (transactionId: string) => processRequest(transactionId, 'approved', 'withdrawal');
    const declineWithdrawal = (transactionId: string) => processRequest(transactionId, 'declined', 'withdrawal');

  const submitWithdrawalRequest = async (amount: number) => {
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

    const newRequest = {
        id: generateTxnId(),
        type: 'withdrawal' as 'withdrawal',
        amount,
        status: 'pending' as 'pending',
        walletAddress: currentUser.primaryWithdrawalAddress,
        description: `User requested a withdrawal of ${amount} USDT.`
    };
    
    await addTransaction(currentUser.id, newRequest);
    setCurrentUser(prev => prev ? { ...prev, transactions: [ ...prev.transactions, {...newRequest, userId: prev.id, timestamp: Date.now()} ]} : null);
    toast({ title: "Success", description: "Withdrawal request submitted." });
  };
  
  const findUser = async (email: string): Promise<UserForAdmin | null> => {
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;
      return {
          id: userDoc.id,
          email: userData.email,
          balance: userData.balance,
          level: userData.level,
          primaryWithdrawalAddress: userData.primaryWithdrawalAddress,
      };
  };

  const adjustUserBalance = async (userId: string, newBalance: number): Promise<UserForAdmin | null> => {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if(!userDoc.exists()) return null;
      
      const oldBalance = userDoc.data().balance;
      const amountDifference = newBalance - oldBalance;

      await updateDoc(userDocRef, { balance: newBalance });
      await addTransaction(userId, {
          id: generateTxnId(),
          type: 'admin_adjusted',
          amount: amountDifference,
          status: 'completed',
          description: `Admin adjusted balance by ${amountDifference.toFixed(2)} USDT.`
      });
      
      toast({ title: "Success", description: "User balance adjusted." });
      return findUser(userDoc.data().email);
  };

  const adjustUserLevel = async (userId: string, level: number): Promise<UserForAdmin | null> => {
      const userDocRef = doc(db, "users", userId);
      if (!levels[level]) {
        toast({ title: "Error", description: `Level ${level} does not exist.`, variant: "destructive"});
        return null;
      }
      await updateDoc(userDocRef, { level: level });
      await addTransaction(userId, {
          id: generateTxnId(),
          type: 'level_up',
          amount: level,
          status: 'info',
          description: `Admin set level to ${level}.`
      });
      
      const userDoc = await getDoc(userDocRef);
      if(!userDoc.exists()) return null;

      toast({ title: "Success", description: "User level adjusted." });
      return findUser(userDoc.data().email);
  };
  
  const adminUpdateUserEmail = async (userId: string, newEmail: string): Promise<UserForAdmin | null> => {
      // Note: This does NOT update Firebase Auth email. That requires a more secure, server-side (Cloud Function) implementation.
      const userDocRef = doc(db, "users", userId);
      const emailQuery = query(collection(db, "users"), where("email", "==", newEmail));
      const snapshot = await getDocs(emailQuery);

      if (!snapshot.empty) {
          toast({ title: "Error", description: "Email is already in use.", variant: "destructive" });
          return null;
      }
      
      await updateDoc(userDocRef, { email: newEmail });
      toast({ title: "Success", description: `User email updated.` });
      return findUser(newEmail);
  };

  const adminUpdateUserWithdrawalAddress = async (userId: string, newAddress: string): Promise<UserForAdmin | null> => {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { primaryWithdrawalAddress: newAddress });
      await addTransaction(userId, {
          id: generateTxnId(),
          type: 'admin_adjusted',
          amount: 0,
          status: 'info',
          description: `Admin updated withdrawal address.`
      });
      const userDoc = await getDoc(userDocRef);
      if(!userDoc.exists()) return null;

      toast({ title: "Success", description: "User withdrawal address updated." });
      return findUser(userDoc.data().email);
  };

    const updateRestrictionMessages = (messages: RestrictionMessage[]) => {
        setRestrictionMessages(messages);
        toast({ title: 'Success', description: 'Restriction messages have been updated.' });
    };

    const addRestrictionMessage = () => {
        const newId = `restriction_${Date.now()}`;
        const newRestriction: RestrictionMessage = {
            id: newId,
            title: 'New Restriction',
            type: 'deposit_no_address',
            message: '',
            isActive: true,
            durationDays: 0,
        };
        setRestrictionMessages(prev => [...prev, newRestriction]);
        toast({ title: 'New restriction added', description: 'Please edit and save the details.'});
    };

    const deleteRestrictionMessage = (id: string) => {
        setRestrictionMessages(prev => prev.filter(r => r.id !== id));
        toast({ title: 'Success', description: 'Restriction message deleted.'});
    };

    const updateStartScreenContent = (content: Omit<StartScreenSettings, 'customContent'>) => {
        setStartScreenContent(prev => ({ ...prev, ...content }));
        toast({ title: "Success", description: "Start screen content updated." });
    };

    const updateWebsiteTitle = (newTitle: string) => {
        setWebsiteTitle(newTitle);
        toast({ title: "Success", description: "Website title updated." });
    };

     const updateLevel = (levelKey: number, details: Level) => {
        const updatedLevels = { ...levels, [levelKey]: details };
        setLevels(updatedLevels);
        toast({ title: "Success", description: `Level ${levelKey} has been updated.` });
    };

    const addLevel = (newLevelKey: number) => {
        const newLevelData: Level = {
            interest: 0.1,
            minBalance: 20000,
            directReferrals: 60,
            withdrawalLimit: 1500,
        };
        const updatedLevels = { ...levels, [newLevelKey]: newLevelData };
        setLevels(updatedLevels);
        toast({ title: "Success", description: `Level ${newLevelKey} has been added.` });
    };

    const deleteLevel = (levelKey: number) => {
        const { [levelKey]: _, ...remainingLevels } = levels;
        setLevels(remainingLevels);
        toast({ title: "Success", description: `Level ${levelKey} has been deleted.` });
    };
    
    const updateReferralBonusSettings = (settings: ReferralBonusSettings) => {
        setReferralBonusSettings(settings);
        toast({title: 'Success', description: 'Referral bonus settings have been updated.'});
    }

    const applyTheme = (theme: {primary: string, accent: string}) => {
      const root = document.documentElement;
      const primaryHsl = hexToHsl(theme.primary);
      const accentHsl = hexToHsl(theme.accent);

      if (primaryHsl) {
        root.style.setProperty('--primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
        const primaryFg = primaryHsl.l > 50 ? '222.2 84% 4.9%' : '210 40% 98%';
        root.style.setProperty('--primary-foreground', primaryFg);
      }
      if (accentHsl) {
        root.style.setProperty('--accent', `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`);
        const accentFg = accentHsl.l > 50 ? '222.2 84% 4.9%' : '210 40% 98%';
         root.style.setProperty('--accent-foreground', accentFg);
      }

      toast({ title: "Success", description: "Theme has been applied." });
    }
    
    const updateDashboardPanel = (id: string, updates: Partial<DashboardPanel>) => {
        setDashboardPanels(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        toast({ title: 'Success', description: 'Panel updated.' });
    };

    const addDashboardPanel = () => {
        const newPanel: DashboardPanel = {
            id: `custom_${Date.now()}`,
            title: 'New Custom Panel',
            componentKey: 'Custom',
            isVisible: true,
            isDeletable: true,
            isEditable: true,
            content: 'Edit this content.',
        };
        setDashboardPanels(prev => [...prev, newPanel]);
        toast({ title: 'Panel Added', description: 'A new custom panel has been added to the user dashboard.' });
    };

    const deleteDashboardPanel = (id: string) => {
        setDashboardPanels(prev => prev.filter(p => p.id !== id));
        toast({ title: 'Panel Deleted', description: 'The panel has been removed from the user dashboard.' });
    };

    const fetchAllPendingRequests = useCallback(async () => {
        const usersRef = collection(db, "users");
        const allUsersSnap = await getDocs(usersRef);
        const allRequests: AugmentedTransaction[] = [];
        
        allUsersSnap.forEach(userDoc => {
            const userData = userDoc.data() as User;
            const pending = userData.transactions.filter(tx => tx.status === 'pending');
            pending.forEach(p => {
                allRequests.push({
                    ...p,
                    email: userData.email,
                    userLevel: userData.level,
                    userDepositCount: userData.transactions.filter(tx => tx.type === 'deposit' && tx.status === 'approved').length,
                    userWithdrawalCount: userData.transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'approved').length,
                    userWithdrawalAddress: userData.primaryWithdrawalAddress,
                })
            })
        });
        
        setAllPendingRequests(allRequests.sort((a,b) => b.timestamp - a.timestamp));

    }, []);

    useEffect(() => {
        if(isAdmin) {
            fetchAllPendingRequests();
            
            const fetchAdminReferrals = async () => {
                 const q = query(collection(db, "users"), where("referredBy", "==", ADMIN_REFERRAL_CODE));
                 const querySnapshot = await getDocs(q);
                 const referredUsers: UserForAdmin[] = [];
                 querySnapshot.forEach(doc => {
                     const u = doc.data() as User;
                     referredUsers.push({
                        id: u.id,
                        email: u.email,
                        balance: u.balance,
                        level: u.level,
                        primaryWithdrawalAddress: u.primaryWithdrawalAddress
                    })
                 });
                 setAdminReferrals(referredUsers);
            }
            fetchAdminReferrals();
        }
    }, [isAdmin, fetchAllPendingRequests]);


  // Effect for Daily Interest Credit (would be better as a Cloud Function in a real app)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentUser && currentUser.level > 0 && currentUser.firstDepositTime) {
          const now = Date.now();
          const lastCredit = currentUser.lastInterestCreditTime || currentUser.firstDepositTime;
          const timeSinceLastCredit = now - lastCredit;
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (timeSinceLastCredit >= twentyFourHours) {
            const interestRate = levels[currentUser.level].interest;
            const interestAmount = currentUser.balance * interestRate;
            
            const userDocRef = doc(db, "users", currentUser.id);
            await updateDoc(userDocRef, {
                balance: currentUser.balance + interestAmount,
                lastInterestCreditTime: now
            });
            await addTransaction(currentUser.id, {
                id: generateTxnId(),
                type: 'interest_credit',
                amount: interestAmount,
                status: 'credited',
                description: `Daily interest of ${interestAmount.toFixed(4)} USDT credited.`
            });
            
            // Re-fetch user data to update UI
            const updatedUserDoc = await getDoc(userDocRef);
            setCurrentUser(updatedUserDoc.data() as User);

            toast({ title: "Interest Credited!", description: `You earned ${interestAmount.toFixed(4)} USDT.`});
          }
        }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUser, levels, addTransaction, toast]);


  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-xl">Loading Application...</div>
        </div>
    );
  }

  const value = {
    currentUser,
    isAdmin,
    signIn,
    signOut,
    signUp,
    updateWithdrawalAddress,
    deleteWithdrawalAddress,
    websiteTitle,
    updateWebsiteTitle,
    levels,
    updateLevel,
    addLevel,
    deleteLevel,
    allPendingRequests,
    submitDepositRequest,
    approveDeposit,
    declineDeposit,
    submitWithdrawalRequest,
    approveWithdrawal,
    declineWithdrawal,
    findUser,
    adjustUserBalance,
    adjustUserLevel,
    adminUpdateUserEmail,
    adminUpdateUserWithdrawalAddress,
    restrictionMessages,
    updateRestrictionMessages,
    addRestrictionMessage,
    deleteRestrictionMessage,
    startScreenContent,
    updateStartScreenContent,
    adminReferrals,
    applyTheme,
    dashboardPanels,
    updateDashboardPanel,
    addDashboardPanel,
    deleteDashboardPanel,
    referralBonusSettings,
    updateReferralBonusSettings,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

    
    