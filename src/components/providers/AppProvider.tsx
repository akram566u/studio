

"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs, writeBatch, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendEmailVerification } from "firebase/auth";
import { User, Levels, Transaction, AugmentedTransaction, RestrictionMessage, StartScreenSettings, Level, DashboardPanel, ReferralBonusSettings, BackgroundTheme, RechargeAddress, AppLinks, FloatingActionButtonSettings, FloatingActionItem, AppSettings, Notice } from '@/lib/types';
import { initialAppSettings } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { hexToHsl } from '@/lib/utils';
import Script from 'next/script';


// A version of the User type that is safe to expose to the admin panel
export type UserForAdmin = Pick<User, 'id' | 'email' | 'balance' | 'level' | 'primaryWithdrawalAddress' | 'directReferrals'>;

export interface AppContextType {
  currentUser: User | null;
  isAdmin: boolean;
  signIn: (email: string, pass: string) => void;
  signOut: () => void;
  signUp: (email: string, pass: string, referral: string) => Promise<boolean>;
  updateWithdrawalAddress: (address: string) => void;
  deleteWithdrawalAddress: () => void;
  websiteTitle: string;
  updateWebsiteTitle: (newTitle: string) => void;
  levels: Levels;
  updateLevel: (level: number, details: Partial<Level>) => void;
  addLevel: () => void;
  deleteLevel: (levelKey: number) => void;
  allPendingRequests: AugmentedTransaction[];
  adminHistory: AugmentedTransaction[];
  submitDepositRequest: (amount: number, address: string) => void;
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
  active3DTheme: BackgroundTheme;
  setActive3DTheme: (theme: BackgroundTheme) => void;
  rechargeAddresses: RechargeAddress[];
  addRechargeAddress: () => void;
  updateRechargeAddress: (id: string, updates: Partial<RechargeAddress>) => void;
  deleteRechargeAddress: (id: string) => void;
  forgotPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  appLinks: AppLinks;
  updateAppLinks: (links: AppLinks) => void;
  floatingActionButtonSettings: FloatingActionButtonSettings;
  updateFloatingActionButtonSettings: (settings: FloatingActionButtonSettings) => void;
  tawkToSrcUrl: string;
  notices: Notice[];
  addNotice: () => void;
  updateNotice: (id: string, updates: Partial<Notice>) => void;
  deleteNotice: (id: string) => void;
  claimDailyInterest: () => Promise<void>;
  totalUsers: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  totalReferralBonusPaid: number;
  allUsersForAdmin: UserForAdmin[];
}

export const AppContext = createContext<AppContextType | null>(null);

const generateTxnId = () => `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const generateReferralCode = () => `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // App settings - now fetched from Firestore
  const [appSettings, setAppSettings] = useState<AppSettings>(initialAppSettings);
  
  // Admin-specific state
  const [allPendingRequests, setAllPendingRequests] = useState<AugmentedTransaction[]>([]);
  const [adminReferrals, setAdminReferrals] = useState<UserForAdmin[]>([]);
  const [adminHistory, setAdminHistory] = useState<AugmentedTransaction[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDepositAmount, setTotalDepositAmount] = useState(0);
  const [totalWithdrawalAmount, setTotalWithdrawalAmount] = useState(0);
  const [totalReferralBonusPaid, setTotalReferralBonusPaid] = useState(0);
  const [allUsersForAdmin, setAllUsersForAdmin] = useState<UserForAdmin[]>([]);
  
  const { toast } = useToast();
  
  const ADMIN_EMAIL = "admin@stakinghub.com";
  const ADMIN_PASSWORD = "admin123";
  const ADMIN_REFERRAL_CODE = "ADMINREF";

  // Destructure for easier access
  const { 
    websiteTitle, 
    levels, 
    restrictionMessages, 
    startScreenContent, 
    dashboardPanels, 
    referralBonusSettings, 
    active3DTheme, 
    rechargeAddresses,
    appLinks,
    floatingActionButtonSettings,
    tawkToSrcUrl,
    notices,
  } = appSettings;

  // Effect to fetch and listen for real-time AppSettings from Firestore
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'global');
    
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure notices is an array to prevent crashes
        if (!data.notices) {
          data.notices = [];
        }
        setAppSettings(data as AppSettings);
      } else {
        // If no settings doc, create one from initial data
        console.log("No settings document found, creating one from initial data.");
        setDoc(settingsDocRef, initialAppSettings).then(() => {
          setAppSettings(initialAppSettings);
        });
      }
    });

    return () => unsubscribe();
  }, []);


  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    if (!firebaseUser) return;
    const userDocRef = doc(db, "users", firebaseUser.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (userDocSnap) => {
        if (userDocSnap.exists()) {
          setCurrentUser({ id: userDocSnap.id, ...userDocSnap.data() } as User);
        } else {
          console.log("No such user document!");
        }
        setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let userUnsubscribe: Unsubscribe | undefined;
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (userUnsubscribe) userUnsubscribe(); // Unsubscribe from previous user listener

      if (user) {
        if (user.email === ADMIN_EMAIL) {
            setIsAdmin(true);
            setCurrentUser(null);
            setLoading(false);
        } else {
            setIsAdmin(false);
            if (user.emailVerified) {
                userUnsubscribe = await fetchUserData(user);
            } else {
                // User is signed in but email is not verified
                setCurrentUser(null);
                setLoading(false);
            }
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });
    return () => {
        authUnsubscribe();
        if (userUnsubscribe) userUnsubscribe();
    };
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
        await signInWithEmailAndPassword(auth, email, pass);
        toast({ title: "Admin signed in successfully!" });
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        toast({ 
          title: "Email Not Verified", 
          description: "Please check your inbox and click the verification link before signing in.", 
          variant: "destructive" 
        });
        return;
      }
      toast({ title: "Signed in successfully!" });

    } catch (error: any) {
      console.error("Sign in error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          toast({ title: "Error", description: "Invalid email or password.", variant: "destructive" });
      } else if(error.code === 'auth/operation-not-allowed') {
          toast({ title: "Error", description: "Email/Password sign in is not enabled in Firebase.", variant: "destructive" });
      } else {
          toast({ title: "Error", description: "An unknown error occurred during sign in.", variant: "destructive" });
      }
    }
  };
  
  const signUp = async (email: string, pass: string, referral: string): Promise<boolean> => {
    if(!email || !pass || !referral) {
        toast({ title: "Error", description: "Please fill all fields.", variant: "destructive"});
        return false;
    }

    try {
        const usersRef = collection(db, "users");
        
        // Check for existing user with email
        const emailQuery = query(usersRef, where("email", "==", email));
        const emailQuerySnapshot = await getDocs(emailQuery);
        if (!emailQuerySnapshot.empty) {
            toast({ title: "Error", description: "User with this email already exists.", variant: "destructive"});
            return false;
        }

        // Check for referrer
        const referralQuery = query(usersRef, where("userReferralCode", "==", referral));
        const referralQuerySnapshot = await getDocs(referralQuery);
        
        const referrerDoc = referralQuerySnapshot.docs[0];
        
        if (referralQuerySnapshot.empty && referral !== ADMIN_REFERRAL_CODE) {
            toast({ title: "Error", description: "Invalid referral code.", variant: "destructive"});
            return false;
        }
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUserAuth = userCredential.user;

        // Send verification email
        await sendEmailVerification(newUserAuth);

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
            description: `Account created successfully. Referred by ${referral}. Awaiting email verification.`,
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
        
        toast({ title: "Verification Email Sent!", description: "Please check your inbox to activate your account." });
        return true;

    } catch (error) {
        console.error("Sign up error:", error);
        toast({ title: "Error", description: "Could not create account.", variant: "destructive" });
        return false;
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
      // No need for local state update, Firestore listener will handle it.
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
      // No need for local state update, Firestore listener will handle it.
      toast({ title: "Success", description: "Withdrawal address deleted." });
    }
  };

  const submitDepositRequest = async (amount: number, address: string) => {
    if (!currentUser) return;
    const newRequest = {
      id: generateTxnId(),
      type: 'deposit' as 'deposit',
      amount,
      status: 'pending' as 'pending',
      walletAddress: address,
      description: `User requested a deposit of ${amount} USDT.`
    };
    
    await addTransaction(currentUser.id, newRequest);
    // No need for local state update, Firestore listener will handle it.
    toast({ title: "Success", description: "Deposit request submitted." });
  };
  
  const processRequest = async (transactionId: string, newStatus: 'approved' | 'declined', type: 'deposit' | 'withdrawal') => {
    const usersRef = collection(db, "users");
    
    const allUsersSnap = await getDocs(usersRef);
    let userFound: User | null = null;
    let userDocId: string | null = null;
    let originalRequest: Transaction | null = null;

    for (const userDoc of allUsersSnap.docs) {
        const userData = userDoc.data() as User;
        const req = userData.transactions.find(t => t.id === transactionId && t.status === 'pending' && t.type === type);
        if (req) {
            userFound = userData;
            userDocId = userDoc.id;
            originalRequest = req;
            break;
        }
    }

    if (!userFound || !userDocId || !originalRequest) {
        toast({ title: "Error", description: `Transaction not found or already processed. ID: ${transactionId}`, variant: "destructive" });
        return;
    }

    const userRef = doc(db, "users", userDocId);
    
    const description = `${type.charAt(0).toUpperCase() + type.slice(1)} of ${originalRequest.amount} USDT ${newStatus}.`;
    const updatedTransactions = userFound.transactions.map(tx =>
        tx.id === transactionId ? { ...tx, status: newStatus, description } : tx
    );
    
    const batch = writeBatch(db);
    const updates: any = { transactions: updatedTransactions };
    const adminTxDescription = `Admin ${newStatus} ${type} of ${originalRequest.amount} for user ${userFound.email}`;


    if (newStatus === 'approved') {
        if (type === 'deposit') {
            updates.balance = userFound.balance + originalRequest.amount;
            if (!userFound.firstDepositTime) {
                updates.firstDepositTime = Date.now();
                 // On first deposit, set lastInterestCreditTime to now to start the first 24h cycle
                updates.lastInterestCreditTime = Date.now();
            }
        } else { // withdrawal
            updates.balance = userFound.balance - originalRequest.amount;
            updates.lastWithdrawalTime = Date.now();
        }
    }
    
    batch.update(userRef, updates);
    await batch.commit();

    // Log this action to admin history by adding a transaction to the admin's (or a global log's) doc
    // For simplicity, I'm logging it back to the user with a special type.
    await addTransaction(userDocId, {
      id: generateTxnId(),
      type: 'admin_adjusted',
      amount: originalRequest.amount,
      status: newStatus,
      description: adminTxDescription,
    });
    
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
        if (isFirstDeposit && referralBonusSettings.isEnabled && originalRequest.amount >= referralBonusSettings.minDeposit && userFound.referredBy && userFound.referredBy !== ADMIN_REFERRAL_CODE) {
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
    // No need to manually refresh admin list, Firestore listener will do it.
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
    
    const currentLevelDetails = levels[currentUser.level];
    if (!currentLevelDetails) {
        toast({ title: "Error", description: `Invalid level configuration.`, variant: "destructive" });
        return;
    }

    const withdrawalLimit = currentLevelDetails.withdrawalLimit;
    if (amount > withdrawalLimit) {
        toast({ title: "Error", description: `Withdrawal amount exceeds your level limit of ${withdrawalLimit} USDT.`, variant: "destructive" });
        return;
    }

    if (currentUser.transactions.some(tx => tx.type === 'withdrawal' && tx.status === 'pending')) {
        toast({ title: "Error", description: "You already have a pending withdrawal request.", variant: "destructive" });
        return;
    }

    const holdMsg = restrictionMessages.find(m => m.type === 'withdrawal_hold' && m.isActive);
    if (holdMsg && (holdMsg.durationDays || 0) > 0 && currentUser.lastWithdrawalTime) {
      const holdDuration = (holdMsg.durationDays || 0) * 24 * 60 * 60 * 1000;
      if (Date.now() - currentUser.lastWithdrawalTime < holdDuration) {
        toast({ title: "Error", description: `Please wait for the ${holdMsg.durationDays}-day withdrawal cooldown period to end.`, variant: "destructive" });
        return;
      }
    }
    
    const monthlyLimitMsg = restrictionMessages.find(m => m.type === 'withdrawal_monthly_limit' && m.isActive);
    if (monthlyLimitMsg) {
        const monthlyWithdrawalsAllowed = currentLevelDetails?.monthlyWithdrawals || 0;
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentWithdrawals = currentUser.transactions.filter(
            tx => tx.type === 'withdrawal' && tx.status === 'approved' && tx.timestamp > thirtyDaysAgo
        ).length;

        if (recentWithdrawals >= monthlyWithdrawalsAllowed) {
            toast({ title: "Withdrawal Limit", description: monthlyLimitMsg.message.replace('{limit}', monthlyWithdrawalsAllowed.toString()), variant: "destructive" });
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
    // No need for local state update, Firestore listener will handle it.
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
          directReferrals: userData.directReferrals,
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
      const userDocRef = doc(db, "users", userId);
      const emailQuery = query(collection(db, "users"), where("email", "==", newEmail));
      const snapshot = await getDocs(emailQuery);

      if (!snapshot.empty) {
          toast({ title: "Error", description: "Email is already in use.", variant: "destructive" });
          return null;
      }
      
      await updateDoc(userDocRef, { email: newEmail });
      toast({ title: "Success", description: `User email updated in Firestore. Note: Auth email is unchanged.` });
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

    const updateFirestoreSettings = async (updates: Partial<AppSettings>) => {
        const settingsDocRef = doc(db, 'settings', 'global');
        try {
            await updateDoc(settingsDocRef, updates);
            toast({ title: 'Success', description: 'Settings have been updated globally.' });
        } catch (error) {
            console.error("Error updating settings:", error);
            toast({ title: 'Error', description: 'Failed to update settings.', variant: 'destructive' });
        }
    };

    const updateRestrictionMessages = (messages: RestrictionMessage[]) => updateFirestoreSettings({ restrictionMessages: messages });
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
        updateFirestoreSettings({ restrictionMessages: [...restrictionMessages, newRestriction] });
        toast({ title: 'New restriction added', description: 'Please edit and save the details.'});
    };
    const deleteRestrictionMessage = (id: string) => updateFirestoreSettings({ restrictionMessages: restrictionMessages.filter(r => r.id !== id) });
    const updateStartScreenContent = (content: Omit<StartScreenSettings, 'customContent'>) => updateFirestoreSettings({ startScreenContent: { ...startScreenContent, ...content } });
    const updateWebsiteTitle = (newTitle: string) => updateFirestoreSettings({ websiteTitle: newTitle });
    const updateLevel = (levelKey: number, details: Partial<Level>) => {
        const updatedLevels = { ...levels, [levelKey]: { ...levels[levelKey], ...details } };
        updateFirestoreSettings({ levels: updatedLevels });
    };
    const addLevel = () => {
        const newLevelKey = Object.keys(levels).length;
        const newLevelData: Level = {
            name: 'New Level',
            interest: 0.1,
            minBalance: 20000,
            directReferrals: 60,
            withdrawalLimit: 1500,
            monthlyWithdrawals: 2,
            isEnabled: true,
        };
        const updatedLevels = { ...levels, [newLevelKey]: newLevelData };
        updateFirestoreSettings({ levels: updatedLevels });
    };
    const deleteLevel = (levelKey: number) => {
        const { [levelKey]: _, ...remainingLevels } = levels;
        updateFirestoreSettings({ levels: remainingLevels });
    };
    const updateReferralBonusSettings = (settings: ReferralBonusSettings) => updateFirestoreSettings({ referralBonusSettings: settings });
    const updateDashboardPanel = (id: string, updates: Partial<DashboardPanel>) => {
        const newPanels = dashboardPanels.map(p => p.id === id ? { ...p, ...updates } : p);
        updateFirestoreSettings({ dashboardPanels: newPanels });
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
        updateFirestoreSettings({ dashboardPanels: [...dashboardPanels, newPanel] });
    };
    const deleteDashboardPanel = (id: string) => {
        updateFirestoreSettings({ dashboardPanels: dashboardPanels.filter(p => p.id !== id) });
    };
    const setActive3DTheme = (theme: BackgroundTheme) => updateFirestoreSettings({ active3DTheme: theme });
    const addRechargeAddress = () => {
      const newAddress: RechargeAddress = {
        id: `addr_${Date.now()}`,
        address: 'New BEP-20 Address',
        network: 'BEP-20',
        isActive: false,
      };
      updateFirestoreSettings({ rechargeAddresses: [...rechargeAddresses, newAddress] });
    };
    const updateRechargeAddress = (id: string, updates: Partial<RechargeAddress>) => {
      let newAddresses;
      const addressToUpdate = rechargeAddresses.find(a => a.id === id);
      if (!addressToUpdate) return;
    
      const finalUpdates = {...addressToUpdate, ...updates};

      // If the address is being activated, deactivate all others.
      if (finalUpdates.isActive) {
        newAddresses = rechargeAddresses.map(addr => 
          addr.id === id ? { ...finalUpdates } : { ...addr, isActive: false }
        );
      } else {
        newAddresses = rechargeAddresses.map(addr => 
          addr.id === id ? { ...finalUpdates } : addr
        );
      }
      updateFirestoreSettings({ rechargeAddresses: newAddresses });
    };
    const deleteRechargeAddress = (id: string) => {
      updateFirestoreSettings({ rechargeAddresses: rechargeAddresses.filter(addr => addr.id !== id) });
    };
    const updateAppLinks = (links: AppLinks) => updateFirestoreSettings({ appLinks: links });
    const updateFloatingActionButtonSettings = (settings: FloatingActionButtonSettings) => updateFirestoreSettings({ floatingActionButtonSettings: settings });
    const addNotice = () => {
        const newNotice: Notice = {
            id: `notice_${Date.now()}`,
            title: 'New Notice',
            content: 'Enter your notice content here.',
            isActive: false,
        };
        updateFirestoreSettings({ notices: [...(notices || []), newNotice] });
    };
    const updateNotice = (id: string, updates: Partial<Notice>) => {
        const newNotices = (notices || []).map(n => n.id === id ? { ...n, ...updates } : n);
        updateFirestoreSettings({ notices: newNotices });
    };
    const deleteNotice = (id: string) => {
        updateFirestoreSettings({ notices: (notices || []).filter(n => n.id !== id) });
    };

    const applyTheme = (theme: {primary: string, accent: string}) => {
      const root = document.documentElement;
      const primaryHsl = hexToHsl(theme.primary);
      const accentHsl = hexToHsl(theme.accent);

      if (primaryHsl) root.style.setProperty('--primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
      if (accentHsl) root.style.setProperty('--accent', `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`);
      
      updateFirestoreSettings({ themeColors: theme });
      toast({ title: "Success", description: "Theme has been applied." });
    }

    const forgotPassword = async (email: string) => {
        if (!email) {
            toast({ title: "Error", description: "Please enter an email address.", variant: "destructive" });
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            toast({ title: "Success", description: "If an account with that email exists, a password reset link has been sent." });
        } catch (error) {
            console.error("Forgot password error:", error);
            toast({ title: "Error", description: "Failed to send password reset email. Please try again later.", variant: "destructive" });
        }
    };
    
    const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
        const user = auth.currentUser;
        if (!user || !user.email) {
            toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
            return false;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            toast({ title: "Success", description: "Your password has been changed." });
            return true;
        } catch (error) {
            console.error("Change password error:", error);
            toast({ title: "Error", description: "Failed to change password. Please check your current password.", variant: "destructive" });
            return false;
        }
    };

    const fetchAllUsersData = useCallback(async () => {
        if (!isAdmin) return;
        
        const usersRef = collection(db, "users");
        const allUsersSnap = await getDocs(usersRef);
        const allUsers: User[] = allUsersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        // Set total users
        setTotalUsers(allUsers.length);
        
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let totalBonuses = 0;

        allUsers.forEach(user => {
            user.transactions.forEach(tx => {
                if(tx.status === 'approved' || tx.status === 'credited') {
                    if (tx.type === 'deposit') totalDeposits += tx.amount;
                    if (tx.type === 'withdrawal') totalWithdrawals += tx.amount;
                    if (tx.type === 'referral_bonus') totalBonuses += tx.amount;
                }
            });
        });
        setTotalDepositAmount(totalDeposits);
        setTotalWithdrawalAmount(totalWithdrawals);
        setTotalReferralBonusPaid(totalBonuses);


        // Process for pending requests
        const allRequests: AugmentedTransaction[] = [];
        allUsers.forEach(userData => {
            const pending = userData.transactions.filter(tx => tx.status === 'pending');
            pending.forEach(p => {
                allRequests.push({
                    ...p,
                    email: userData.email,
                    userLevel: userData.level,
                    userDepositCount: userData.transactions.filter(tx => tx.type === 'deposit' && tx.status === 'approved').length,
                    userWithdrawalCount: userData.transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'approved').length,
                    userWithdrawalAddress: userData.primaryWithdrawalAddress,
                    directReferrals: userData.directReferrals,
                })
            })
        });
        setAllPendingRequests(allRequests.sort((a,b) => b.timestamp - a.timestamp));

        // Process for admin history
        const allHistory: AugmentedTransaction[] = [];
        allUsers.forEach(userData => {
            const completed = userData.transactions.filter(tx => 
                tx.status === 'approved' || tx.status === 'declined' || tx.type === 'admin_adjusted'
            );
            completed.forEach(c => {
                allHistory.push({ ...c, email: userData.email })
            })
        });
        setAdminHistory(allHistory.sort((a,b) => b.timestamp - a.timestamp));
        
        const allUsersAdminView: UserForAdmin[] = allUsers.map(u => ({
            id: u.id,
            email: u.email,
            balance: u.balance,
            level: u.level,
            primaryWithdrawalAddress: u.primaryWithdrawalAddress,
            directReferrals: u.directReferrals,
        }));
        setAllUsersForAdmin(allUsersAdminView);
        
        // Process admin referrals
        const referredUsers: UserForAdmin[] = [];
        allUsers.forEach(u => {
            if (u.referredBy === ADMIN_REFERRAL_CODE) {
                referredUsers.push({
                    id: u.id,
                    email: u.email,
                    balance: u.balance,
                    level: u.level,
                    primaryWithdrawalAddress: u.primaryWithdrawalAddress,
                    directReferrals: u.directReferrals,
                })
            }
        });
        setAdminReferrals(referredUsers);

    }, [isAdmin]);

    useEffect(() => {
        if(isAdmin) {
            const unsubscribe = onSnapshot(collection(db, "users"), () => {
                fetchAllUsersData();
            });
            return () => unsubscribe();
        }
    }, [isAdmin, fetchAllUsersData]);
    
    const claimDailyInterest = async () => {
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
                
                // No manual refetch needed due to onSnapshot listener.
                toast({ title: "Interest Claimed!", description: `You earned ${interestAmount.toFixed(4)} USDT.`});
            } else {
                toast({ title: "Not Yet", description: `You can claim your next interest in some time.`});
            }
        } else {
            toast({ title: "Ineligible", description: "You must make a deposit and be at least Level 1 to earn interest.", variant: "destructive" });
        }
    };


  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
            <div className="text-xl">Loading Application...</div>
        </div>
    );
  }

  const value: AppContextType = {
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
    adminHistory,
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
    active3DTheme,
    setActive3DTheme,
    rechargeAddresses,
    addRechargeAddress,
    updateRechargeAddress,
    deleteRechargeAddress,
    forgotPassword,
    changePassword,
    appLinks,
    updateAppLinks,
    floatingActionButtonSettings,
    updateFloatingActionButtonSettings,
    tawkToSrcUrl,
    notices,
    addNotice,
    updateNotice,
    deleteNotice,
    claimDailyInterest,
    totalUsers,
    totalDepositAmount,
    totalWithdrawalAmount,
    totalReferralBonusPaid,
    allUsersForAdmin,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {tawkToSrcUrl && (
        <Script id="tawk-to-script" strategy="lazyOnload">
          {`
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='${tawkToSrcUrl}';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
          `}
        </Script>
      )}
    </AppContext.Provider>
  );
};

    