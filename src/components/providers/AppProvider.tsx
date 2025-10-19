

"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs, writeBatch, onSnapshot, Unsubscribe, runTransaction, deleteDoc, collectionGroup, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendEmailVerification, deleteUser } from "firebase/auth";
import { User, Levels, Transaction, AugmentedTransaction, RestrictionMessage, StartScreenSettings, Level, DashboardPanel, ReferralBonusSettings, BackgroundTheme, RechargeAddress, AppLinks, FloatingActionButtonSettings, AppSettings, Notice, BoosterPack, StakingPool, StakingVault, UserVaultInvestment, ActiveBooster, TeamCommissionSettings, TeamSizeReward, TeamBusinessReward, PrioritizeMessageOutput, Message, FABSettings, DailyEngagementSettings, DailyQuest, LoginStreakReward, Leaderboard, LeaderboardCategory, UserDailyQuest, AdminDashboardLayout, LayoutSettings, SignInPopupSettings, SalaryRule, SignUpBonusSettings } from '@/lib/types';
import { initialAppSettings } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { hexToHsl } from '@/lib/utils';
import Script from 'next/script';
import { prioritizeMessage } from '@/ai/flows/prioritize-message-flow';
import { produce } from 'immer';


// A version of the User type that is safe to expose to the admin panel
export type UserForAdmin = Pick<User, 'id' | 'email' | 'balance' | 'level' | 'primaryWithdrawalAddress' | 'directReferrals' | 'messages'>;

export interface DownlineUser {
  id: string;
  email: string;
}

export type ReferredUserWithStatus = {
    email: string;
    isActivated: boolean;
};

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
  allOnHoldRequests: AugmentedTransaction[];
  adminHistory: AugmentedTransaction[];
  approveRequest: (transactionId: string, type: Transaction['type']) => void;
  declineRequest: (transactionId: string, type: Transaction['type']) => void;
  holdRequest: (transactionId: string, type: Transaction['type']) => void;
  submitDepositRequest: (amount: number, address: string) => void;
  submitWithdrawalRequest: (amount: number) => void;
  findUser: (email: string) => Promise<UserForAdmin | null>;
  adjustUserBalance: (userId: string, amount: number) => Promise<UserForAdmin | null>;
  adjustUserLevel: (userId: string, level: number) => Promise<UserForAdmin | null>;
  adjustUserDirectReferrals: (userId: string, count: number) => Promise<UserForAdmin | null>;
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
  updateDashboardPanels: (panels: DashboardPanel[]) => void;
  addDashboardPanel: () => void;
  deleteDashboardPanel: (id: string) => void;
  referralBonusSettings: ReferralBonusSettings;
  updateReferralBonusSettings: (settings: ReferralBonusSettings) => void;
  signUpBonusSettings: SignUpBonusSettings;
  updateSignUpBonusSettings: (settings: SignUpBonusSettings) => void;
  teamCommissionSettings: TeamCommissionSettings;
  updateTeamCommissionSettings: (settings: TeamCommissionSettings) => void;
  teamSizeRewards: TeamSizeReward[];
  addTeamSizeReward: () => void;
  updateTeamSizeReward: (id: string, updates: Partial<TeamSizeReward>) => void;
  deleteTeamSizeReward: (id: string) => void;
  teamBusinessRewards: TeamBusinessReward[];
  addTeamBusinessReward: () => void;
  updateTeamBusinessReward: (id: string, updates: Partial<TeamBusinessReward>) => void;
  deleteTeamBusinessReward: (id: string) => void;
  claimTeamReward: (type: 'team_size_reward' | 'team_business_reward', rewardId: string) => Promise<void>;
  salaryRules: SalaryRule[];
  addSalaryRule: () => void;
  updateSalaryRule: (id: string, updates: Partial<SalaryRule>) => void;
  deleteSalaryRule: (id: string) => void;
  claimSalary: () => Promise<void>;
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
  floatingActionButtonSettings: FABSettings;
  updateFloatingActionButtonSettings: (settings: FABSettings) => void;
  layoutSettings: LayoutSettings;
  updateLayoutSettings: (settings: LayoutSettings) => void;
  adminDashboardLayout: AdminDashboardLayout;
  updateAdminDashboardLayout: (layout: AdminDashboardLayout) => void;
  signInPopupSettings: SignInPopupSettings;
  updateSignInPopupSettings: (settings: SignInPopupSettings) => void;
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
  boosterPacks: BoosterPack[];
  boosterPurchaseHistory: AugmentedTransaction[];
  addBoosterPack: () => void;
  updateBoosterPack: (id: string, updates: Partial<BoosterPack>) => void;
  deleteBoosterPack: (id: string) => void;
  purchaseBooster: (boosterId: string) => Promise<void>;
  stakingPools: StakingPool[];
  addStakingPool: () => void;
  updateStakingPool: (id: string, updates: Partial<StakingPool>) => void;
  deleteStakingPool: (id: string) => void;
  joinStakingPool: (poolId: string, amount: number) => Promise<void>;
  endStakingPool: (poolId: string) => Promise<void>;
  validateWithdrawal: (amount: number) => string | null;
  stakingVaults: StakingVault[];
  addStakingVault: () => void;
  updateStakingVault: (id: string, updates: Partial<StakingVault>) => void;
  deleteStakingVault: (id: string) => void;
  investInVault: (vaultId: string, amount: number) => Promise<void>;
  sendAnnouncement: (userId: string, message: string) => void;
  getPrioritizedMessage: () => Promise<PrioritizeMessageOutput | null>;
  markAnnouncementAsRead: (announcementId: string) => void;
  sendMessageToUser: (userId: string, content: string) => Promise<UserForAdmin | null>;
  sendMessageToAdmin: (content: string) => void;
  deactivateCurrentUserAccount: (password: string) => Promise<void>;
  deactivateUserAccount: (userId: string) => Promise<void>;
  getDownline: () => Promise<{downline: Record<string, DownlineUser[]>, l4PlusCount: number, rechargedTodayCount: number}>;
  getReferredUsersWithStatus: () => Promise<ReferredUserWithStatus[]>;
  dailyEngagement: DailyEngagementSettings;
  updateDailyEngagement: (settings: DailyEngagementSettings) => void;
  leaderboards: Leaderboard[];
  updateLeaderboardSettings: (category: LeaderboardCategory, updates: Partial<Leaderboard>) => void;
  adminReferralCode: string;
  checkAndApplyLevelDowngrade: (userId: string) => Promise<void>;
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
  const [allOnHoldRequests, setAllOnHoldRequests] = useState<AugmentedTransaction[]>([]);
  const [adminReferrals, setAdminReferrals] = useState<UserForAdmin[]>([]);
  const [adminHistory, setAdminHistory] = useState<AugmentedTransaction[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDepositAmount, setTotalDepositAmount] = useState(0);
  const [totalWithdrawalAmount, setTotalWithdrawalAmount] = useState(0);
  const [totalReferralBonusPaid, setTotalReferralBonusPaid] = useState(0);
  const [allUsersForAdmin, setAllUsersForAdmin] = useState<UserForAdmin[]>([]);
  const [boosterPurchaseHistory, setBoosterPurchaseHistory] = useState<AugmentedTransaction[]>([]);
  
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
    signUpBonusSettings,
    teamCommissionSettings,
    teamSizeRewards,
    teamBusinessRewards,
    salaryRules,
    active3DTheme, 
    rechargeAddresses,
    appLinks,
    floatingActionButtonSettings,
    layoutSettings,
    adminDashboardLayout,
    signInPopupSettings,
    tawkToSrcUrl,
    notices,
    boosterPacks,
    stakingPools,
    stakingVaults,
    dailyEngagement,
    leaderboards,
  } = appSettings;

  // Effect to fetch and listen for real-time AppSettings from Firestore
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'global');
    
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Deep merge fetched data with initial defaults to prevent crashes
        const mergedSettings = produce(initialAppSettings, draft => {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const typedKey = key as keyof AppSettings;
                    if (draft[typedKey] !== undefined && typeof data[typedKey] === 'object' && !Array.isArray(data[typedKey]) && data[typedKey] !== null && typeof draft[typedKey] === 'object' && !Array.isArray(draft[typedKey])) {
                        Object.assign(draft[typedKey] as object, data[typedKey]);
                    } else if (data[typedKey] !== undefined) {
                        (draft as any)[typedKey] = data[typedKey];
                    }
                }
            }
        });
        setAppSettings(mergedSettings);

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
    
    // Check for matured vaults before setting up the listener
    const initialUserDoc = await getDoc(userDocRef);
    if (initialUserDoc.exists()) {
        await processMaturedVaults(initialUserDoc.id, initialUserDoc.data() as User);
        await processDailyLogin(initialUserDoc.id, initialUserDoc.data() as User);
    }
    
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

  const checkAndApplyLevelUp = useCallback(async (userId: string) => {
    const userRef = doc(db, "users", userId);
    await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return;

        const userData = userSnap.data() as User;
        const oldLevel = userData.level;
        let newLevel = oldLevel;

        const sortedLevels = Object.keys(levels).map(Number).sort((a, b) => b - a);

        for (const levelKey of sortedLevels) {
            if (levelKey > newLevel) {
                const levelDetails = levels[levelKey];
                const totalReferrals = (userData.directReferrals || 0) + (userData.purchasedReferralPoints || 0);

                if (userData.balance >= levelDetails.minBalance && totalReferrals >= levelDetails.directReferrals) {
                    newLevel = levelKey;
                    break;
                }
            }
        }

        if (newLevel > oldLevel) {
            transaction.update(userRef, { level: newLevel });
            const levelUpTx: Transaction = {
                id: generateTxnId(),
                userId: userId,
                timestamp: Date.now(),
                type: 'level_up',
                amount: newLevel,
                status: 'info',
                description: `Promoted to Level ${newLevel} - ${levels[newLevel].name}`
            };
            transaction.update(userRef, { transactions: arrayUnion(levelUpTx) });
            // Defer toast until after transaction commits
            setTimeout(() => toast({ title: "Congratulations!", description: `You have been promoted to Level ${newLevel}!` }), 0);
        }
    });
}, [levels, toast]);


    const checkAndApplyLevelDowngrade = useCallback(async (userId: string) => {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        
        const userData = userSnap.data() as User;
        const oldLevel = userData.level;
        let newLevel = 0; // Start from the bottom

        // Find the highest level the user qualifies for
        const sortedLevels = Object.keys(levels).map(Number).sort((a, b) => b - a);
        for (const levelKey of sortedLevels) {
            const levelDetails = levels[levelKey];
            const totalReferrals = (userData.directReferrals || 0) + (userData.purchasedReferralPoints || 0);
            if (userData.balance >= levelDetails.minBalance && totalReferrals >= levelDetails.directReferrals) {
                newLevel = levelKey;
                break;
            }
        }

        if (newLevel < oldLevel) {
            await updateDoc(userRef, { level: newLevel });
            await addTransaction(userId, { 
                id: generateTxnId(), 
                type: 'level_down', 
                amount: newLevel, 
                status: 'info', 
                description: `Your level has been adjusted to Level ${newLevel} - ${levels[newLevel].name} based on your current balance.` 
            });
            toast({ title: "Level Adjusted", description: `You are now Level ${newLevel}.`});
        }

    }, [levels, addTransaction, toast]);


  const signIn = async (email: string, pass: string) => {
    try {
        if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
            // This is a bypass for the admin user, no firebase auth involved
            setIsAdmin(true);
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
    if (!email || !pass || !referral) {
        toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
        return false;
    }

    try {
        const usersRef = collection(db, "users");
        const emailQuery = query(usersRef, where("email", "==", email));
        const emailQuerySnapshot = await getDocs(emailQuery);
        if (!emailQuerySnapshot.empty) {
            toast({ title: "Error", description: "User with this email already exists.", variant: "destructive" });
            return false;
        }

        const referralQuery = query(usersRef, where("userReferralCode", "==", referral));
        const referralQuerySnapshot = await getDocs(referralQuery);
        const referrerDoc = referralQuerySnapshot.docs[0];

        if (referralQuerySnapshot.empty && referral !== ADMIN_REFERRAL_CODE) {
            toast({ title: "Error", description: "Invalid referral code.", variant: "destructive" });
            return false;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUserAuth = userCredential.user;
        await sendEmailVerification(newUserAuth);

        const referrerData = referrerDoc ? (referrerDoc.data() as User) : null;
        const newReferralPath = referrerDoc ? [referrerDoc.id, ...(referrerData?.referralPath || [])] : [];

        const newUser: User = {
            id: newUserAuth.uid,
            email: email,
            balance: 0,
            totalDeposits: 0,
            level: 0,
            userReferralCode: generateReferralCode(),
            referredBy: referrerDoc ? referrerDoc.id : ADMIN_REFERRAL_CODE,
            referralPath: newReferralPath,
            directReferrals: 0,
            purchasedReferralPoints: 0,
            transactions: [],
            referredUsers: [],
            lastInterestCreditTime: 0,
            primaryWithdrawalAddress: '',
            firstDepositTime: null,
            registrationTime: Date.now(),
            lastWithdrawalTime: null,
            activeBoosters: [],
            vaultInvestments: [],
            teamSize: 0,
            teamBusiness: 0,
            claimedTeamSizeRewards: [],
            claimedTeamBusinessRewards: [],
            announcements: [],
            messages: [],
            lastLoginTime: 0,
            loginStreak: 0,
            dailyQuests: [],
            lastQuestResetTime: 0,
        };

        const batch = writeBatch(db);
        batch.set(doc(db, "users", newUserAuth.uid), newUser);
        
        let teamUpdates = new Map<string, { size: number, business: number }>();

        if (referrerDoc) {
            // This is just to show the list of emails in sponsor's referral list.
            batch.update(doc(db, "users", referrerDoc.id), {
                referredUsers: arrayUnion({ email: newUser.email, isActivated: false })
            });
        }
        
        await batch.commit();

        await addTransaction(newUserAuth.uid, {
            id: generateTxnId(),
            type: 'account_created',
            amount: 0,
            status: 'completed',
            description: `Account created successfully. Referred by ${referral}. Awaiting email verification.`,
        });

        if (referrerDoc) {
            await addTransaction(referrerDoc.id, {
                id: generateTxnId(),
                type: 'new_referral',
                amount: 0,
                status: 'pending',
                description: `New user registered with your code: ${newUser.email} (Pending activation)`,
                referredUserId: newUserAuth.uid, // Store the new user's ID here
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
  
    const processRequest = async (transactionId: string, newStatus: 'approved' | 'declined' | 'on_hold', type: Transaction['type']) => {
        const usersRef = collection(db, "users");
        
        const allUsersSnap = await getDocs(usersRef);
        let userFound: User | null = null;
        let userDocId: string | null = null;
        let originalRequest: Transaction | null = null;

        for (const userDoc of allUsersSnap.docs) {
            const userData = userDoc.data() as User;
            const req = userData.transactions.find(t => t.id === transactionId && (t.status === 'pending' || t.status === 'on_hold') && t.type === type);
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
        
        let description = `${type.replace('_', ' ')} of ${originalRequest.amount} USDT ${newStatus}.`;
        if (newStatus === 'declined' && type === 'salary_claim') {
            description = `Your salary claim was declined. You may claim again if you are still eligible.`;
        }
        
        const updatedTransactions = userFound.transactions.map(tx =>
            tx.id === transactionId ? { ...tx, status: newStatus, description } : tx
        );
        
        let finalBalance = userFound.balance;
        const updates: any = { transactions: updatedTransactions };
        const adminTxDescription = `Admin ${newStatus} ${type.replace('_', ' ')} of ${originalRequest.amount} for user ${userFound.email}`;

        if (newStatus === 'approved') {
            switch(type) {
                case 'deposit':
                    finalBalance += originalRequest.amount;
                    updates.totalDeposits = (userFound.totalDeposits || 0) + originalRequest.amount;
                    if (!userFound.firstDepositTime) {
                        updates.firstDepositTime = Date.now();
                        updates.lastInterestCreditTime = Date.now();
                    }
                    break;
                case 'withdrawal':
                    // Balance was already deducted at request time, so no change on approval.
                    updates.lastWithdrawalTime = Date.now();
                    break;
                case 'team_size_reward':
                    finalBalance += originalRequest.amount;
                    updates.claimedTeamSizeRewards = arrayUnion(originalRequest.note); // Note stores reward ID
                    break;
                 case 'team_business_reward':
                    finalBalance += originalRequest.amount;
                    updates.claimedTeamBusinessRewards = arrayUnion(originalRequest.note); // Note stores reward ID
                    break;
                 case 'salary_claim':
                    finalBalance += originalRequest.amount;
                    updates.lastSalaryClaim = {
                        timestamp: Date.now(),
                        teamBusinessAtClaim: userFound.teamBusiness || 0,
                    };
                    break;
            }
        } else if (newStatus === 'declined') {
            if (type === 'withdrawal' || type === 'salary_claim') {
                 finalBalance += originalRequest.amount;
            }
        }

        updates.balance = finalBalance;

        await updateDoc(userRef, updates);

        await addTransaction(userDocId, {
          id: generateTxnId(),
          type: 'admin_adjusted',
          amount: originalRequest.amount,
          status: newStatus,
          description: adminTxDescription,
        });
        
        if (newStatus === 'approved' && type === 'deposit') {
            const isFirstDeposit = !userFound.firstDepositTime;

            // Distribute team business for *every* deposit
            for (const uplineId of userFound.referralPath) {
                await runTransaction(db, async (transaction) => {
                    const uplineRef = doc(db, 'users', uplineId);
                    const uplineSnap = await transaction.get(uplineRef);
                    if (uplineSnap.exists()) {
                        const newBusiness = (uplineSnap.data().teamBusiness || 0) + originalRequest.amount;
                        transaction.update(uplineRef, { teamBusiness: newBusiness });
                    }
                });
            }

            // Only run activation logic on first deposit
            if (isFirstDeposit) {
                await checkAndApplyLevelUp(userDocId);

                // Fetch the newly updated user to check their level
                const newlyActivatedUserSnap = await getDoc(userRef);
                const newlyActivatedUserData = newlyActivatedUserSnap.data() as User;
                const isNowActive = newlyActivatedUserData.level > 0;
                
                if (isNowActive) {
                    // Activate referrer and update team size for the entire upline
                    if (userFound.referredBy && userFound.referredBy !== ADMIN_REFERRAL_CODE) {
                        const referrerRef = doc(db, "users", userFound.referredBy);
                        
                        await runTransaction(db, async (transaction) => {
                            const referrerSnap = await transaction.get(referrerRef);
                            if (!referrerSnap.exists()) return;
                            const referrerData = referrerSnap.data() as User;

                            // Update sponsor's transaction history to mark user as active
                            const updatedSponsorTransactions = referrerData.transactions.map(
                                tx => (tx.type === 'new_referral' && tx.referredUserId === userDocId)
                                    ? { ...tx, status: 'completed', description: `New user activated with your code: ${userFound!.email}` }
                                    : tx
                            );

                            // Increment direct referrals for sponsor
                            transaction.update(referrerRef, { 
                                directReferrals: (referrerData.directReferrals || 0) + 1,
                                transactions: updatedSponsorTransactions
                            });
                        });
                        
                        // Award referral bonus
                        if (referralBonusSettings.isEnabled && originalRequest.amount >= referralBonusSettings.minDeposit) {
                            const referrerData = (await getDoc(referrerRef)).data() as User;
                            const now = Date.now();
                            const activeBoosters = (referrerData.activeBoosters || []).filter(b => b.type === 'referral_bonus_boost' && b.expiresAt > now);
                            let bonusAmount = referralBonusSettings.bonusAmount;
                            const boostMultiplier = activeBoosters.reduce((acc, b) => acc * b.effectValue, 1);
                            bonusAmount *= boostMultiplier;
                            
                            await updateDoc(referrerRef, { balance: referrerData.balance + bonusAmount });
                            await checkAndApplyLevelUp(referrerData.id);
                            await addTransaction(referrerData.id, {
                                id: generateTxnId(), type: 'referral_bonus', amount: bonusAmount, status: 'credited',
                                description: `You received a ${bonusAmount.toFixed(2)} USDT bonus for activating ${userFound!.email}! ${boostMultiplier > 1 ? '(Boosted!)' : ''}`
                            });
                        }
                    }

                    // Increment team size for the entire upline
                    for (const uplineId of userFound.referralPath) {
                        await runTransaction(db, async (transaction) => {
                            const uplineRef = doc(db, 'users', uplineId);
                            const uplineSnap = await transaction.get(uplineRef);
                            if (uplineSnap.exists()) {
                                const newTeamSize = (uplineSnap.data().teamSize || 0) + 1;
                                transaction.update(uplineRef, { teamSize: newTeamSize });
                            }
                        });
                    }
                }
            }

            await checkQuestProgress(userDocId, 'deposit_amount', originalRequest.amount);
        }

        // Check for level downgrade on withdrawal approval
        if (newStatus === 'approved' && type === 'withdrawal') {
            await checkAndApplyLevelDowngrade(userDocId);
        }
        
        toast({ title: "Success", description: `${type.replace('_', ' ')} request has been ${newStatus}.` });
    };

    const approveRequest = (transactionId: string, type: Transaction['type']) => processRequest(transactionId, 'approved', type);
    const declineRequest = (transactionId: string, type: Transaction['type']) => processRequest(transactionId, 'declined', type);
    const holdRequest = (transactionId: string, type: Transaction['type']) => processRequest(transactionId, 'on_hold', type);

  const validateWithdrawal = (amount: number): string | null => {
    if (!currentUser) return "Not logged in.";
    
    // Check if interest timer is running
    if (currentUser.level > 0 && currentUser.firstDepositTime) {
      const now = Date.now();
      const lastCredit = currentUser.lastInterestCreditTime || currentUser.firstDepositTime;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (now < lastCredit + twentyFourHours) {
          return "Withdrawals are disabled while the daily interest timer is active. Please claim your interest first.";
      }
    }
    
    if (!currentUser.primaryWithdrawalAddress) return "Set a withdrawal address first.";
    if (amount > currentUser.balance) return "Insufficient balance.";

    const currentLevelDetails = levels[currentUser.level];
    if (!currentLevelDetails) return `Invalid level configuration.`;

    const withdrawalLimit = currentLevelDetails.withdrawalLimit;
    if (amount > withdrawalLimit) return `Withdrawal amount exceeds your level limit of ${withdrawalLimit} USDT.`;

    if (currentUser.transactions.some(tx => tx.type === 'withdrawal' && tx.status === 'pending')) {
        return "You already have a pending withdrawal request.";
    }
    
    // Check applicable restrictions for the user's level
    const applicableRestrictions = restrictionMessages.filter(m => m.isActive && (!m.applicableLevels || m.applicableLevels.length === 0 || m.applicableLevels.includes(currentUser.level)));
    
    const initialDepositMsg = applicableRestrictions.find(m => m.type === 'withdrawal_initial_deposit');
    if(initialDepositMsg) {
        const principal = currentUser.totalDeposits || 0;
        const earnings = currentUser.balance - principal;
        const withdrawablePrincipal = principal * ((initialDepositMsg.withdrawalPercentage || 0) / 100);
        const maxWithdrawal = Math.max(0, earnings + withdrawablePrincipal);

        if (amount > maxWithdrawal) {
            return initialDepositMsg.message.replace('{max_amount}', maxWithdrawal.toFixed(2));
        }
    }

    const holdMsg = applicableRestrictions.find(m => m.type === 'withdrawal_hold');
    if (holdMsg && (holdMsg.durationDays || 0) > 0 && currentUser.lastWithdrawalTime) {
      const holdDuration = (holdMsg.durationDays || 0) * 24 * 60 * 60 * 1000;
      const timeSinceLast = Date.now() - currentUser.lastWithdrawalTime;

      if (timeSinceLast < holdDuration) {
        const remainingTime = holdDuration - timeSinceLast;
        const remainingDays = Math.floor(remainingTime / (24 * 60 * 60 * 1000));
        const remainingHours = Math.floor((remainingTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const countdown = `${remainingDays}d ${remainingHours}h`;
        
        let message = holdMsg.message.replace('{durationDays}', (holdMsg.durationDays || 0).toString());
        message = message.replace('{countdown}', countdown);
        return message;
      }
    }
    
    const monthlyLimitMsg = applicableRestrictions.find(m => m.type === 'withdrawal_monthly_limit');
    if (monthlyLimitMsg) {
        const monthlyWithdrawalsAllowed = currentLevelDetails?.monthlyWithdrawals || 0;
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentWithdrawals = currentUser.transactions.filter(
            (tx): tx is Transaction & { type: 'withdrawal', status: 'approved' } => tx.type === 'withdrawal' && tx.status === 'approved' && tx.timestamp > thirtyDaysAgo
        ).length;

        if (recentWithdrawals >= monthlyWithdrawalsAllowed) {
            return monthlyLimitMsg.message.replace('{limit}', monthlyWithdrawalsAllowed.toString());
        }
    }

    return null; // No validation errors
  }

  const submitWithdrawalRequest = async (amount: number) => {
    if (!currentUser) return;

    const validationError = validateWithdrawal(amount);
    if(validationError) {
        toast({ title: "Withdrawal Error", description: validationError, variant: "destructive" });
        return;
    }
    
    const feePercentage = levels[currentUser.level]?.withdrawalFee || 0;
    const fee = (amount * feePercentage) / 100;
    const totalDeduction = amount; 

    if (currentUser.balance < totalDeduction) {
        toast({ title: "Error", description: "Insufficient balance to cover withdrawal.", variant: "destructive" });
        return;
    }

    const newRequest: Omit<Transaction, 'userId' | 'timestamp'> = {
        id: generateTxnId(),
        type: 'withdrawal' as 'withdrawal',
        amount: amount,
        status: 'pending' as 'pending',
        walletAddress: currentUser.primaryWithdrawalAddress,
        description: `User requested withdrawal of ${amount} USDT (Fee: ${fee.toFixed(2)} USDT).`
    };
    
    // Atomically deduct balance and add transaction
    const userRef = doc(db, 'users', currentUser.id);
    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw "User document does not exist!";
        }
        const currentBalance = userDoc.data().balance;
        if(currentBalance < totalDeduction) {
            throw "Insufficient balance to cover withdrawal and fee.";
        }
        const newBalance = currentBalance - totalDeduction;
        
        transaction.update(userRef, { 
            balance: newBalance,
            transactions: arrayUnion(newRequest)
        });
    });

    toast({ title: "Success", description: "Withdrawal request submitted. Your balance has been updated." });
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
          messages: userData.messages || [],
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
      const updatedUserDoc = await getDoc(userDocRef);
      return findUser(updatedUserDoc.data()?.email);
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
  
  const adjustUserDirectReferrals = async (userId: string, count: number): Promise<UserForAdmin | null> => {
      if (count < 0) {
        toast({ title: "Error", description: "Referral count cannot be negative.", variant: "destructive" });
        return null;
      }
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { directReferrals: count });
      await addTransaction(userId, {
          id: generateTxnId(),
          type: 'admin_adjusted',
          amount: count,
          status: 'info',
          description: `Admin set direct referrals to ${count}.`
      });

      await checkAndApplyLevelUp(userId);

      toast({ title: "Success", description: "User referral count updated." });
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) return null;
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
            withdrawalPercentage: 0,
            applicableLevels: [],
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
            withdrawalFee: 0,
        };
        const updatedLevels = { ...levels, [newLevelKey]: newLevelData };
        updateFirestoreSettings({ levels: updatedLevels });
    };
    const deleteLevel = (levelKey: number) => {
        const { [levelKey]: _, ...remainingLevels } = levels;
        updateFirestoreSettings({ levels: remainingLevels });
    };
    const updateReferralBonusSettings = (settings: ReferralBonusSettings) => updateFirestoreSettings({ referralBonusSettings: settings });
    const updateSignUpBonusSettings = (settings: SignUpBonusSettings) => updateFirestoreSettings({ signUpBonusSettings: settings });
    const updateTeamCommissionSettings = (settings: TeamCommissionSettings) => updateFirestoreSettings({ teamCommissionSettings: settings });
    const addTeamSizeReward = () => {
        const newReward: TeamSizeReward = {
            id: `tsr_${Date.now()}`,
            teamSize: 200,
            rewardAmount: 300,
            isEnabled: true,
        };
        updateFirestoreSettings({ teamSizeRewards: [...teamSizeRewards, newReward] });
    }
    const updateTeamSizeReward = (id: string, updates: Partial<TeamSizeReward>) => {
        const newRewards = teamSizeRewards.map(r => r.id === id ? { ...r, ...updates } : r);
        updateFirestoreSettings({ teamSizeRewards: newRewards });
    }
    const deleteTeamSizeReward = (id: string) => {
        updateFirestoreSettings({ teamSizeRewards: teamSizeRewards.filter(r => r.id !== id) });
    }
    const addTeamBusinessReward = () => {
        const newReward: TeamBusinessReward = {
            id: `tbr_${Date.now()}`,
            businessAmount: 10000,
            rewardAmount: 500,
            isEnabled: true,
        };
        updateFirestoreSettings({ teamBusinessRewards: [...(teamBusinessRewards || []), newReward] });
    }
    const updateTeamBusinessReward = (id: string, updates: Partial<TeamBusinessReward>) => {
        const newRewards = (teamBusinessRewards || []).map(r => r.id === id ? { ...r, ...updates } : r);
        updateFirestoreSettings({ teamBusinessRewards: newRewards });
    }
    const deleteTeamBusinessReward = (id: string) => {
        updateFirestoreSettings({ teamBusinessRewards: (teamBusinessRewards || []).filter(r => r.id !== id) });
    }
    const addSalaryRule = () => {
        const newRule: SalaryRule = {
            id: `sr_${Date.now()}`,
            level: 1,
            directReferrals: 10,
            teamBusiness: 10000,
            salaryAmount: 100,
            requiredGrowthPercentage: 10,
            claimCooldownDays: 30,
            isEnabled: true,
        };
        updateFirestoreSettings({ salaryRules: [...(salaryRules || []), newRule] });
    };
    const updateSalaryRule = (id: string, updates: Partial<SalaryRule>) => {
        const newRules = (salaryRules || []).map(r => r.id === id ? { ...r, ...updates } : r);
        updateFirestoreSettings({ salaryRules: newRules });
    };
    const deleteSalaryRule = (id: string) => {
        updateFirestoreSettings({ salaryRules: (salaryRules || []).filter(r => r.id !== id) });
    };

    const claimTeamReward = async (type: 'team_size_reward' | 'team_business_reward', rewardId: string) => {
        if (!currentUser) return;

        let reward;
        let userValue = 0;
        let rewardValue = 0;
        let claimedList: string[] = [];
        let description = '';

        if (type === 'team_size_reward') {
            reward = teamSizeRewards.find(r => r.id === rewardId);
            userValue = currentUser.teamSize || 0;
            rewardValue = reward?.teamSize || 0;
            claimedList = currentUser.claimedTeamSizeRewards || [];
            description = `User requested Team Size Reward of ${reward?.rewardAmount} for reaching ${reward?.teamSize} active members.`;
        } else {
            reward = teamBusinessRewards.find(r => r.id === rewardId);
            userValue = currentUser.teamBusiness || 0;
            rewardValue = reward?.businessAmount || 0;
            claimedList = currentUser.claimedTeamBusinessRewards || [];
            description = `User requested Team Business Reward of ${reward?.rewardAmount} for reaching ${reward?.businessAmount} USDT business.`;
        }

        if (!reward || !reward.isEnabled) {
            toast({ title: "Error", description: "This reward is not available.", variant: "destructive" });
            return;
        }
        if (userValue < rewardValue) {
            toast({ title: "Error", description: "You have not met the requirement.", variant: "destructive" });
            return;
        }
        if (claimedList.includes(rewardId)) {
            toast({ title: "Error", description: "You have already claimed this reward.", variant: "destructive" });
            return;
        }
        if (currentUser.transactions.some(tx => tx.status === 'pending' && tx.note === rewardId)) {
            toast({ title: "Error", description: "You have a pending claim for this reward.", variant: "destructive" });
            return;
        }

        await addTransaction(currentUser.id, {
            id: generateTxnId(),
            type,
            amount: reward.rewardAmount,
            status: 'pending',
            description,
            note: reward.id, // Store reward ID in note field for processing
        });

        toast({ title: "Claim Submitted!", description: "Your reward claim has been sent for admin approval." });
    };

    const claimSalary = async () => {
        if (!currentUser) return;

        const rule = (salaryRules || []).find(r => r.isEnabled && r.level === currentUser.level);
        if (!rule) {
            toast({ title: "Not Eligible", description: "No salary rule is active for your current level.", variant: "destructive" });
            return;
        }

        if (currentUser.transactions.some(tx => tx.type === 'salary_claim' && tx.status === 'pending')) {
            toast({ title: "Error", description: "You already have a pending salary claim.", variant: "destructive" });
            return;
        }
        
        let isEligible = false;
        if (currentUser.lastSalaryClaim) {
             // Check for cooldown
            const cooldownMillis = (rule.claimCooldownDays || 30) * 24 * 60 * 60 * 1000;
            if (Date.now() < currentUser.lastSalaryClaim.timestamp + cooldownMillis) {
                toast({ title: "Not Yet", description: `You can claim your next salary after the ${rule.claimCooldownDays || 30}-day cooldown period.`, variant: "destructive"});
                return;
            }

            // Check for growth
            const requiredBusiness = currentUser.lastSalaryClaim.teamBusinessAtClaim * (1 + (rule.requiredGrowthPercentage || 0) / 100);
            isEligible = (currentUser.directReferrals || 0) >= rule.directReferrals && (currentUser.teamBusiness || 0) >= requiredBusiness;
        } else {
            // First time claim
            isEligible = (currentUser.directReferrals || 0) >= rule.directReferrals && (currentUser.teamBusiness || 0) >= rule.teamBusiness;
        }

        if (!isEligible) {
            toast({ title: "Not Eligible", description: "You have not met the requirements for this month's salary.", variant: "destructive" });
            return;
        }

        const newRequest: Omit<Transaction, 'userId' | 'timestamp'> = {
            id: generateTxnId(),
            type: 'salary_claim',
            amount: rule.salaryAmount,
            status: 'pending',
            description: `User claimed salary of ${rule.salaryAmount} USDT for Level ${rule.level}.`,
        };
        
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, {
            transactions: arrayUnion(newRequest)
        });

        toast({ title: "Salary Claim Submitted!", description: "Your claim has been sent for admin approval." });
    };

    const updateDashboardPanel = (id: string, updates: Partial<DashboardPanel>) => {
        const newPanels = dashboardPanels.map(p => p.id === id ? { ...p, ...updates } : p);
        updateFirestoreSettings({ dashboardPanels: newPanels });
    };
    const updateDashboardPanels = (panels: DashboardPanel[]) => {
        updateFirestoreSettings({ dashboardPanels: panels });
    }
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
    const updateFloatingActionButtonSettings = (settings: FABSettings) => updateFirestoreSettings({ floatingActionButtonSettings: settings });
    const updateLayoutSettings = (settings: LayoutSettings) => updateFirestoreSettings({ layoutSettings: settings });
    const updateAdminDashboardLayout = (layout: AdminDashboardLayout) => updateFirestoreSettings({ adminDashboardLayout: layout });
    const updateSignInPopupSettings = (settings: SignInPopupSettings) => updateFirestoreSettings({ signInPopupSettings: settings });
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

        const boosterHistory: AugmentedTransaction[] = [];

        allUsers.forEach(user => {
            (user.transactions || []).forEach(tx => {
                if(tx.status === 'approved' || tx.status === 'credited' || tx.status === 'completed') {
                    if (tx.type === 'deposit') totalDeposits += tx.amount;
                    if (tx.type === 'withdrawal') totalWithdrawals += tx.amount;
                    if (tx.type === 'referral_bonus' || tx.type === 'sign_up_bonus') totalBonuses += tx.amount;
                    if (tx.type === 'booster_purchase') boosterHistory.push({ ...tx, email: user.email });
                }
            });
        });
        setTotalDepositAmount(totalDeposits);
        setTotalWithdrawalAmount(totalWithdrawals);
        setTotalReferralBonusPaid(totalBonuses);
        setBoosterPurchaseHistory(boosterHistory.sort((a,b) => b.timestamp - a.timestamp));

        // Process for pending requests
        const requests: AugmentedTransaction[] = [];
        const onHoldRequests: AugmentedTransaction[] = [];

        allUsers.forEach(userData => {
            (userData.transactions || []).forEach(p => {
                const augmentedTx = {
                    ...p,
                    email: userData.email,
                    userLevel: userData.level,
                    userDepositCount: (userData.transactions || []).filter(tx => tx.type === 'deposit' && tx.status === 'approved').length,
                    userWithdrawalCount: (userData.transactions || []).filter(tx => tx.type === 'withdrawal' && tx.status === 'approved').length,
                    userWithdrawalAddress: userData.primaryWithdrawalAddress,
                    directReferrals: userData.directReferrals,
                };
                if (p.status === 'pending') {
                    requests.push(augmentedTx);
                } else if (p.status === 'on_hold') {
                    onHoldRequests.push(augmentedTx);
                }
            })
        });
        setAllPendingRequests(requests.sort((a,b) => b.timestamp - a.timestamp));
        setAllOnHoldRequests(onHoldRequests.sort((a,b) => b.timestamp - a.timestamp));


        // Process for admin history
        const allHistory: AugmentedTransaction[] = [];
        allUsers.forEach(userData => {
            const completed = (userData.transactions || []).filter(tx => 
                tx.status === 'approved' || tx.status === 'declined' || tx.type === 'admin_adjusted' || tx.type === 'salary_claim'
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
            messages: u.messages || [],
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
                    messages: u.messages || [],
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
            const canEarnInterest = currentUser.level > 0 && currentUser.balance >= (levels[1]?.minBalance || 100);
            if (!canEarnInterest) {
                 toast({ title: "Ineligible", description: "Your account is inactive. You must have a balance sufficient for Level 1 to earn interest.", variant: "destructive" });
                 return;
            }

            const now = Date.now();
            const lastCredit = currentUser.lastInterestCreditTime || currentUser.firstDepositTime;
            const twentyFourHours = 24 * 60 * 60 * 1000;

            if (now - lastCredit >= twentyFourHours) {
                let interestRate = levels[currentUser.level].interest;
                
                // Check for active interest boosters
                const activeBoosters = (currentUser.activeBoosters || []).filter(b => b.type === 'interest_boost' && b.expiresAt > now);
                const boostAmount = activeBoosters.reduce((acc, b) => acc + b.effectValue, 0);
                interestRate += boostAmount;
                
                const interestAmount = currentUser.balance * interestRate;
                
                const userDocRef = doc(db, "users", currentUser.id);
                await updateDoc(userDocRef, {
                    balance: currentUser.balance + interestAmount,
                    lastInterestCreditTime: now,
                    activeBoosters: (currentUser.activeBoosters || []).filter(b => b.expiresAt > now) // Clean out expired boosters
                });
                await addTransaction(currentUser.id, {
                    id: generateTxnId(),
                    type: 'interest_credit',
                    amount: interestAmount,
                    status: 'credited',
                    description: `Daily interest of ${interestAmount.toFixed(4)} USDT credited ${boostAmount > 0 ? '(Boosted!)' : ''}.`
                });

                if (teamCommissionSettings.isEnabled) {
                    await processTeamCommissions(currentUser.id, interestAmount);
                }
                
                toast({ title: "Interest Claimed!", description: `You earned ${interestAmount.toFixed(4)} USDT.`});
            } else {
                toast({ title: "Not Yet", description: `You can claim your next interest in some time.`});
            }
        } else {
            toast({ title: "Ineligible", description: "You must be an active user (Level 1+) to earn interest.", variant: "destructive" });
        }
    };
    
    const processTeamCommissions = async (userId: string, interestEarned: number) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data() as User;
      
        const rates = [
          teamCommissionSettings.rates.level1,
          teamCommissionSettings.rates.level2,
          teamCommissionSettings.rates.level3,
        ];
      
        for (let i = 0; i < userData.referralPath.length; i++) {
          const referrerId = userData.referralPath[i];
          const level = i + 1;
      
          await runTransaction(db, async (transaction) => {
            const referrerRef = doc(db, 'users', referrerId);
            const referrerSnap = await transaction.get(referrerRef);
            if (!referrerSnap.exists()) return;
      
            const referrerData = referrerSnap.data() as User;
            const activeReferrals = (referrerData.referredUsers || []).filter(u => u.isActivated).length;
            
            let commissionRate = 0;
            let commissionType = '';
            
            if (level <= 3) {
              // Standard L1-L3 commission
              if (referrerData.level > 0 && activeReferrals >= teamCommissionSettings.minDirectReferrals && activeReferrals >= level) {
                commissionRate = rates[i];
                commissionType = `L${level}`;
              }
            } else {
              // Community L4+ commission
              if (referrerData.level > 0 && activeReferrals >= teamCommissionSettings.minReferralsForCommunity) {
                commissionRate = teamCommissionSettings.communityRate;
                commissionType = `L4+`;
              }
            }
      
            if (commissionRate > 0) {
              const commissionAmount = interestEarned * commissionRate;
      
              if (commissionAmount > 0) {
                const newBalance = referrerData.balance + commissionAmount;
                transaction.update(referrerRef, { balance: newBalance });
      
                const commissionTx: Transaction = {
                  userId: referrerId,
                  timestamp: Date.now(),
                  id: generateTxnId(),
                  type: 'team_commission',
                  amount: commissionAmount,
                  status: 'credited',
                  description: `Received ${commissionAmount.toFixed(4)} USDT ${commissionType} commission from ${userData.email}.`
                };
                
                transaction.update(referrerRef, { transactions: arrayUnion(commissionTx) });
              }
            }
          });
        }
    };
    
    // Booster and Pool Management
    const addBoosterPack = () => {
        const newBooster: BoosterPack = {
            id: `bp_${Date.now()}`,
            name: 'New Booster Pack',
            description: 'Edit this description.',
            cost: 10,
            type: 'referral_points',
            effectValue: 1,
            durationDays: 0,
            durationHours: 0,
            isActive: false,
            applicableLevels: [],
            purchaseLimit: -1, // Unlimited by default
        };
        updateFirestoreSettings({ boosterPacks: [...(boosterPacks || []), newBooster] });
    };

    const updateBoosterPack = async (id: string, updates: Partial<BoosterPack>) => {
        const oldPack = boosterPacks.find(p => p.id === id);
        if (!oldPack) return;
        
        const newPacks = (boosterPacks || []).map(p => p.id === id ? { ...p, ...updates } : p);
        await updateFirestoreSettings({ boosterPacks: newPacks });
    
        // Refund logic: if the pack is being deactivated or deleted
        if (oldPack.isActive && (updates.isActive === false || updates.isActive === undefined)) {
            await refundBooster(id, oldPack.cost);
        }
    };
    
    const deleteBoosterPack = async (id: string) => {
        const packToDelete = boosterPacks.find(p => p.id === id);
        if (!packToDelete) return;
    
        await updateFirestoreSettings({ boosterPacks: (boosterPacks || []).filter(p => p.id !== id) });
        
        // Refund logic: if the deleted pack was active
        if (packToDelete.isActive) {
            await refundBooster(id, packToDelete.cost);
        }
    };

    const refundBooster = async (boosterId: string, cost: number) => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("activeBoosters", "array-contains", { boosterId: boosterId }));
        const affectedUsersSnap = await getDocs(q);
        
        const batch = writeBatch(db);

        affectedUsersSnap.forEach(userDoc => {
            const userData = userDoc.data() as User;
            const userRef = doc(db, "users", userDoc.id);
            const updatedBoosters = (userData.activeBoosters || []).filter(b => b.boosterId !== boosterId);
            
            batch.update(userRef, {
                activeBoosters: updatedBoosters,
                balance: userData.balance + cost
            });

            const refundTx: Omit<Transaction, 'userId' | 'timestamp'> = {
                id: generateTxnId(),
                type: 'admin_adjusted',
                amount: cost,
                status: 'credited',
                description: `Refund for disabled booster pack.`
            };
            batch.update(userRef, { transactions: arrayUnion(refundTx) });
        });

        try {
            await batch.commit();
            if (!affectedUsersSnap.empty) {
               toast({ title: 'Booster Disabled', description: `Refunds have been processed for ${affectedUsersSnap.size} affected users.` });
            }
        } catch(e) {
            console.error("Error during booster refund batch commit:", e);
            toast({ title: 'Error', description: 'Failed to process booster refunds.', variant: 'destructive' });
        }
    };

    const purchaseBooster = async (boosterId: string) => {
        if (!currentUser) return;
        const booster = boosterPacks.find(b => b.id === boosterId);
        if (!booster) {
            toast({ title: "Error", description: "Booster pack not found.", variant: "destructive" });
            return;
        }

        const earnedBalance = currentUser.balance - (currentUser.totalDeposits || 0);
        if (earnedBalance < booster.cost) {
            toast({ title: "Error", description: `You can only purchase boosters with your earned balance. You need ${booster.cost.toFixed(2)} USDT in earnings.`, variant: "destructive" });
            return;
        }

        if (booster.purchaseLimit !== -1) {
            const purchaseCount = currentUser.transactions.filter(
                tx => tx.type === 'booster_purchase' && tx.note === booster.name && tx.status === 'completed'
            ).length;
            if (purchaseCount >= booster.purchaseLimit) {
                toast({ title: "Error", description: `You have reached the purchase limit for '${booster.name}'.`, variant: "destructive" });
                return;
            }
        }

        const userDocRef = doc(db, "users", currentUser.id);
        const updates: any = {
            balance: currentUser.balance - booster.cost,
        };

        if (booster.type === 'referral_points') {
            updates.purchasedReferralPoints = (currentUser.purchasedReferralPoints || 0) + booster.effectValue;
        } else if (booster.type === 'interest_boost' || booster.type === 'referral_bonus_boost') {
            const durationMillis = ((booster.durationDays || 0) * 24 * 60 * 60 * 1000) + ((booster.durationHours || 0) * 60 * 60 * 1000);
            const newBooster: ActiveBooster = {
                boosterId: booster.id,
                type: booster.type,
                expiresAt: Date.now() + durationMillis,
                effectValue: booster.effectValue,
                cost: booster.cost,
            };
            updates.activeBoosters = arrayUnion(newBooster);
        }

        await updateDoc(userDocRef, updates);
        await addTransaction(currentUser.id, {
            id: generateTxnId(),
            type: 'booster_purchase',
            amount: booster.cost,
            status: 'completed',
            description: `Purchased '${booster.name}' for ${booster.cost} USDT.`,
            note: booster.name,
        });
        
        // Immediately check for level up if referral points were purchased
        if (booster.type === 'referral_points') {
            await checkAndApplyLevelUp(currentUser.id);
        }

        toast({ title: "Success", description: `'${booster.name}' purchased and activated!` });
    };
    
    const addStakingPool = () => {
        const newPool: StakingPool = {
            id: `sp_${Date.now()}`,
            name: 'New Staking Pool',
            description: 'A new limited-time staking event.',
            endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // Default to 7 days from now
            interestRate: 0.1, // 10% interest for the pool duration
            totalStaked: 0,
            minContribution: 10,
            maxContribution: 1000,
            participants: [],
            status: 'active',
            isActive: false, // Start as inactive
        };
        updateFirestoreSettings({ stakingPools: [...(stakingPools || []), newPool] });
    };

    const updateStakingPool = (id: string, updates: Partial<StakingPool>) => {
        const newPools = (stakingPools || []).map(p => p.id === id ? { ...p, ...updates } : p);
        updateFirestoreSettings({ stakingPools: newPools });
    };

    const deleteStakingPool = (id: string) => {
        updateFirestoreSettings({ stakingPools: (stakingPools || []).filter(p => p.id !== id) });
    };
    
    const joinStakingPool = async (poolId: string, amount: number) => {
        if (!currentUser) return;
        const pool = stakingPools.find(p => p.id === poolId);
        if (!pool || !pool.isActive || pool.status !== 'active') {
            toast({ title: "Error", description: "This pool is not active.", variant: "destructive" });
            return;
        }
        if (amount < pool.minContribution || amount > pool.maxContribution) {
            toast({ title: "Error", description: `Contribution must be between ${pool.minContribution} and ${pool.maxContribution} USDT.`, variant: "destructive" });
            return;
        }
        if (currentUser.balance < amount) {
            toast({ title: "Error", description: "Insufficient balance.", variant: "destructive" });
            return;
        }
        if (pool.participants.some(p => p.userId === currentUser.id)) {
            toast({ title: "Error", description: "You have already joined this pool.", variant: "destructive" });
            return;
        }

        // User-side update
        const userDocRef = doc(db, "users", currentUser.id);
        await updateDoc(userDocRef, { balance: currentUser.balance - amount });
        await addTransaction(currentUser.id, {
            id: generateTxnId(),
            type: 'pool_join',
            amount,
            status: 'completed',
            description: `Joined '${pool.name}' with ${amount} USDT.`
        });
        
        // Pool-side update
        const settingsDocRef = doc(db, 'settings', 'global');
        const updatedPools = stakingPools.map(p => {
            if (p.id === poolId) {
                return {
                    ...p,
                    totalStaked: p.totalStaked + amount,
                    participants: [...p.participants, { userId: currentUser.id, email: currentUser.email, amount }]
                }
            }
            return p;
        });
        await updateDoc(settingsDocRef, { stakingPools: updatedPools });
        
        toast({ title: "Success", description: `You have joined '${pool.name}'!` });
    };

    const endStakingPool = async (poolId: string) => {
        const pool = stakingPools.find(p => p.id === poolId);
        if (!pool || pool.status === 'completed') {
            toast({ title: "Error", description: "Pool already completed or does not exist.", variant: "destructive" });
            return;
        }
        if (pool.participants.length === 0) {
            toast({ title: "Pool Ended", description: "Pool had no participants. No payouts made."});
            const updatedPools = stakingPools.map(p => p.id === poolId ? { ...p, status: 'completed' as 'completed', isActive: false } : p);
            await updateFirestoreSettings({ stakingPools: updatedPools });
            return;
        }

        const totalInterest = pool.totalStaked * pool.interestRate;
        
        // Select a winner
        const winner = pool.participants[Math.floor(Math.random() * pool.participants.length)];

        const batch = writeBatch(db);

        // Refund all participants and give winner the prize
        for (const participant of pool.participants) {
            const userRef = doc(db, "users", participant.userId);
            const userSnap = await getDoc(userRef);
            if(userSnap.exists()) {
                const userData = userSnap.data() as User;
                let newBalance = userData.balance + participant.amount;
                
                if (participant.userId === winner.userId) {
                    newBalance += totalInterest;
                }

                batch.update(userRef, { balance: newBalance });
            }
        }
        
        // Update pool status in settings
        const settingsDocRef = doc(db, 'settings', 'global');
        const updatedPools = stakingPools.map(p => {
            if (p.id === poolId) {
                return {
                    ...p,
                    status: 'completed' as 'completed',
                    winners: [{ userId: winner.userId, email: winner.email, prize: totalInterest }]
                }
            }
            return p;
        });
        batch.update(settingsDocRef, { stakingPools: updatedPools });
        
        await batch.commit();

        // Add transaction logs after commit
        for (const participant of pool.participants) {
            let amount = participant.amount;
            let description = `Staking pool '${pool.name}' ended. Contribution returned.`;
            if (participant.userId === winner.userId) {
                amount += totalInterest;
                description = `Won staking pool '${pool.name}'! Prize: ${totalInterest.toFixed(2)} USDT.`;
            }
            await addTransaction(participant.userId, {
                id: generateTxnId(),
                type: 'pool_payout',
                amount: amount,
                status: 'credited',
                description,
            });
        }
        
        toast({ title: "Pool Ended", description: `Winner ${winner.email} has been paid ${totalInterest.toFixed(2)} USDT.`});
    };
    
    // Staking Vaults Management
    const addStakingVault = () => {
        const newVault: StakingVault = {
            id: `sv_${Date.now()}`,
            name: 'New Vault',
            termDays: 30,
            interestRate: 0.15,
            minInvestment: 100,
            maxInvestment: 1000,
            totalInvested: 0,
            totalInvestors: 0,
            isActive: false,
        };
        updateFirestoreSettings({ stakingVaults: [...(stakingVaults || []), newVault] });
    };
    const updateStakingVault = (id: string, updates: Partial<StakingVault>) => {
        const newVaults = (stakingVaults || []).map(v => v.id === id ? { ...v, ...updates } : v);
        updateFirestoreSettings({ stakingVaults: newVaults });
    };
    const deleteStakingVault = (id: string) => {
        updateFirestoreSettings({ stakingVaults: (stakingVaults || []).filter(v => v.id !== id) });
    };

    const investInVault = async (vaultId: string, amount: number) => {
        if (!currentUser) return;
        const vault = stakingVaults.find(v => v.id === vaultId);
        if (!vault || !vault.isActive) {
            toast({ title: "Error", description: "This vault is not available.", variant: "destructive" });
            return;
        }
        if (amount < vault.minInvestment || amount > vault.maxInvestment) {
            toast({ title: "Error", description: `Investment must be between ${vault.minInvestment} and ${vault.maxInvestment} USDT.`, variant: "destructive" });
            return;
        }
        if (currentUser.balance < amount) {
            toast({ title: "Error", description: "Insufficient balance.", variant: "destructive" });
            return;
        }
        
        const now = Date.now();
        const newInvestment: UserVaultInvestment = {
            investmentId: `inv_${now}`,
            vaultId: vault.id,
            vaultName: vault.name,
            amount: amount,
            interestRate: vault.interestRate,
            startedAt: now,
            maturesAt: now + vault.termDays * 24 * 60 * 60 * 1000,
        };

        const batch = writeBatch(db);

        // Update user
        const userRef = doc(db, "users", currentUser.id);
        batch.update(userRef, {
            balance: currentUser.balance - amount,
            vaultInvestments: arrayUnion(newInvestment)
        });

        // Update vault stats in settings
        const settingsRef = doc(db, "settings", "global");
        const updatedVaults = stakingVaults.map(v => v.id === vaultId ? {
            ...v,
            totalInvested: v.totalInvested + amount,
            totalInvestors: v.totalInvestors + 1,
        } : v);
        batch.update(settingsRef, { stakingVaults: updatedVaults });

        await batch.commit();

        await addTransaction(currentUser.id, {
            id: generateTxnId(),
            type: 'vault_investment',
            amount: amount,
            status: 'active',
            description: `Invested ${amount} USDT in '${vault.name}' for ${vault.termDays} days.`
        });
        
        toast({ title: "Success!", description: `Your investment in '${vault.name}' is now active.` });
    };

    const processMaturedVaults = async (userId: string, userData: User) => {
        const now = Date.now();
        const maturedInvestments = (userData.vaultInvestments || []).filter(inv => now >= inv.maturesAt);
        if (maturedInvestments.length === 0) return;

        let totalPayout = 0;
        const batch = writeBatch(db);

        for (const inv of maturedInvestments) {
            const termInDays = (inv.maturesAt - inv.startedAt) / (24 * 60 * 60 * 1000);
            const interest = inv.amount * inv.interestRate * (termInDays / 365);
            const payout = inv.amount + interest;
            totalPayout += payout;
            
            // Add a payout transaction record
            await addTransaction(userId, {
                id: generateTxnId(),
                type: 'vault_payout',
                amount: payout,
                status: 'credited',
                description: `Vault '${inv.vaultName}' matured. Payout of ${payout.toFixed(2)} USDT credited.`
            });
        }
        
        const userRef = doc(db, "users", userId);
        const remainingInvestments = (userData.vaultInvestments || []).filter(inv => now < inv.maturesAt);
        
        batch.update(userRef, {
            balance: userData.balance + totalPayout,
            vaultInvestments: remainingInvestments
        });

        await batch.commit();
        toast({ title: "Vault Matured!", description: `A total of ${totalPayout.toFixed(2)} USDT has been credited to your balance.` });
    };

    const sendAnnouncement = async (userId: string, message: string) => {
        const userRef = doc(db, "users", userId);
        const newAnnouncement = {
            id: `ann_${Date.now()}`,
            message,
            createdAt: Date.now(),
            createdBy: 'admin',
            read: false,
            priority: 1, // Admin announcements are high priority
        };
        await updateDoc(userRef, {
            announcements: arrayUnion(newAnnouncement)
        });
        toast({ title: "Announcement Sent!", description: "The personalized message has been sent to the user." });
    };

    const getPrioritizedMessage = useCallback(async (): Promise<PrioritizeMessageOutput | null> => {
        if (!currentUser) return null;
    
        const nextLevelKey = currentUser.level + 1;
        const nextLevel = levels[nextLevelKey] || { minBalance: Infinity, directReferrals: Infinity };
    
        const nextTeamSizeRewardResult = [...(teamSizeRewards || [])]
            .filter(r => r.isEnabled && !(currentUser.claimedTeamSizeRewards || []).includes(r.id))
            .sort((a, b) => a.teamSize - b.teamSize)
            .find(r => r.teamSize > (currentUser.teamSize || 0));
    
        const nextTeamBusinessRewardResult = [...(teamBusinessRewards || [])]
            .filter(r => r.isEnabled && !(currentUser.claimedTeamBusinessRewards || []).includes(r.id))
            .sort((a, b) => a.businessAmount - b.businessAmount)
            .find(r => r.businessAmount > (currentUser.teamBusiness || 0));
    
        const nextTeamSizeReward = nextTeamSizeRewardResult 
            ? { teamSize: nextTeamSizeRewardResult.teamSize, rewardAmount: nextTeamSizeRewardResult.rewardAmount }
            : { teamSize: Infinity, rewardAmount: 0 };
    
        const nextTeamBusinessReward = nextTeamBusinessRewardResult
            ? { businessAmount: nextTeamBusinessRewardResult.businessAmount, rewardAmount: nextTeamBusinessRewardResult.rewardAmount }
            : { businessAmount: Infinity, rewardAmount: 0 };

        try {
            const result = await prioritizeMessage({
                user: {
                    balance: currentUser.balance,
                    level: currentUser.level,
                    teamSize: currentUser.teamSize || 0,
                    teamBusiness: currentUser.teamBusiness || 0,
                    announcements: (currentUser.announcements || [])
                        .filter(a => !a.read)
                        .map(a => ({ message: a.message, createdAt: a.createdAt })),
                },
                nextLevel,
                nextTeamSizeReward,
                nextTeamBusinessReward,
            });
            return result;
        } catch (error) {
            console.error("AI prioritization failed:", error);
            const unreadAdmin = (currentUser.announcements || []).find(a => a.createdBy === 'admin' && !a.read);
            if(unreadAdmin) {
                return { source: 'admin', message: unreadAdmin.message, announcementId: unreadAdmin.id };
            }
            return null;
        }
    }, [currentUser, levels, teamSizeRewards, teamBusinessRewards]);

    const markAnnouncementAsRead = async (announcementId: string) => {
        if (!currentUser) return;
        const userRef = doc(db, "users", currentUser.id);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const userData = userSnap.data() as User;
        const updatedAnnouncements = (userData.announcements || []).map(ann => 
            ann.id === announcementId ? { ...ann, read: true } : ann
        );

        await updateDoc(userRef, { announcements: updatedAnnouncements });
    };

    const sendMessageToUser = async (userId: string, content: string): Promise<UserForAdmin | null> => {
        const userRef = doc(db, "users", userId);
        const newMessage: Message = {
            id: `msg_${Date.now()}`,
            sender: 'admin',
            content,
            timestamp: Date.now(),
            read: false,
        };
        await updateDoc(userRef, {
            messages: arrayUnion(newMessage)
        });
        toast({ title: "Message Sent!" });
        
        const userDoc = await getDoc(userRef);
        if(!userDoc.exists()) return null;
        return findUser(userDoc.data().email);
    }
    
    const sendMessageToAdmin = async (content: string) => {
        if (!currentUser) return;
        const userRef = doc(db, "users", currentUser.id);
        const newMessage: Message = {
            id: `msg_${Date.now()}`,
            sender: 'user',
            content,
            timestamp: Date.now(),
            read: false, // Admin will read this
        };
        await updateDoc(userRef, {
            messages: arrayUnion(newMessage)
        });
        toast({ title: "Message Sent!", description: "The admin has been notified." });
    };

    const deactivateUserAccount = async (userId: string) => {
        try {
            await deleteDoc(doc(db, "users", userId));
            // Note: Deleting the Firebase Auth user cannot be done securely from the client-side
            // without re-authentication. A Cloud Function would be needed for a complete wipe.
            toast({ title: 'User Deactivated', description: 'User data has been deleted from Firestore.' });
        } catch (error) {
            console.error("Error deactivating user:", error);
            toast({ title: 'Error', description: 'Could not deactivate user.', variant: 'destructive'});
        }
    };

    const deactivateCurrentUserAccount = async (password: string) => {
        const user = auth.currentUser;
        if (!user || !user.email) {
            toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            
            // Re-authenticated, now delete data and then user
            await deleteDoc(doc(db, "users", user.uid));
            await deleteUser(user);

            toast({ title: 'Account Deactivated', description: 'Your account has been permanently deleted.' });
            // The onAuthStateChanged listener will handle the sign-out UI update.
        } catch (error: any) {
            console.error("Error during account deactivation:", error);
            if (error.code === 'auth/wrong-password' || error.code === 'invalid-credential') {
                toast({ title: 'Error', description: 'Incorrect password. Deactivation failed.', variant: 'destructive'});
            } else {
                toast({ title: 'Error', description: 'An error occurred. Please try again.', variant: 'destructive'});
            }
        }
    };

    const getDownline = useCallback(async (): Promise<{downline: Record<string, DownlineUser[]>, l4PlusCount: number, rechargedTodayCount: number}> => {
        if (!currentUser) return { downline: {}, l4PlusCount: 0, rechargedTodayCount: 0 };
    
        const usersRef = collection(db, "users");
        const allUserDocs = await getDocs(usersRef);
        const allUsers = new Map<string, User>(allUserDocs.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as User]));
    
        const downline: Record<string, DownlineUser[]> = { L1: [], L2: [], L3: [] };
        let l4PlusCount = 0;
        let totalActiveMembers = 0;
    
        // --- Time-based activation calculation setup ---
        const [hours, minutes] = teamCommissionSettings.dailyActivationResetTime.split(':').map(Number);
        const now = new Date();
        const istOffset = 330; // 5.5 hours in minutes
        const nowUtc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const nowIst = new Date(nowUtc + (istOffset * 60000));
        
        let resetTimeToday = new Date(nowIst);
        resetTimeToday.setHours(hours, minutes, 0, 0);
    
        if (nowIst < resetTimeToday) {
            resetTimeToday.setDate(resetTimeToday.getDate() - 1);
        }
        const startOfDayTimestamp = resetTimeToday.getTime();
        let rechargedTodayCount = 0;
        // --- End setup ---
    
        let queue = [currentUser.id];
        const visited = new Set([currentUser.id]);
        const userToLevelMap = new Map<string, number>();
        userToLevelMap.set(currentUser.id, 0);
    
        for (const user of allUsers.values()) {
            if (user.referralPath.includes(currentUser.id)) {
                if (user.level > 0) { // Check if user is active
                    totalActiveMembers++;
                    const level = user.referralPath.indexOf(currentUser.id) + 1;
                    if (level >= 1 && level <= 3) {
                        downline[`L${level}`].push({ id: user.id, email: user.email });
                    } else {
                        l4PlusCount++;
                    }

                    // Check for activations today
                    if (user.firstDepositTime && user.firstDepositTime >= startOfDayTimestamp) {
                        rechargedTodayCount++;
                    }
                }
            }
        }
        
        // Update the current user's teamSize in Firestore, as this is the most reliable place to do it.
        if (currentUser.teamSize !== totalActiveMembers) {
            const userRef = doc(db, 'users', currentUser.id);
            await updateDoc(userRef, { teamSize: totalActiveMembers });
        }
    
        return { downline, l4PlusCount, rechargedTodayCount };
    
    }, [currentUser, teamCommissionSettings.dailyActivationResetTime]);

    const getReferredUsersWithStatus = useCallback(async (): Promise<ReferredUserWithStatus[]> => {
        if (!currentUser) return [];

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("referredBy", "==", currentUser.id));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const userData = doc.data() as User;
            return {
                email: userData.email,
                isActivated: userData.level > 0
            };
        });
    }, [currentUser]);

    const updateDailyEngagement = (settings: DailyEngagementSettings) => updateFirestoreSettings({ dailyEngagement: settings });

    const checkQuestProgress = async (userId: string, type: QuestType, value: number) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data() as User;

        const activeQuests = (dailyEngagement.quests || []).filter(q => q.isActive && q.type === type);
        let userQuests = userData.dailyQuests || [];
        let needsUpdate = false;

        for(const quest of activeQuests) {
            let userQuest = userQuests.find(uq => uq.questId === quest.id);
            if (userQuest && !userQuest.isCompleted) {
                userQuest.progress += value;
                if (userQuest.progress >= quest.targetValue) {
                    userQuest.isCompleted = true;
                    await updateDoc(userRef, { balance: userData.balance + quest.rewardAmount });
                    await addTransaction(userId, {
                        id: generateTxnId(),
                        type: 'quest_reward',
                        amount: quest.rewardAmount,
                        status: 'credited',
                        description: `Completed quest: ${quest.title}`
                    });
                    toast({title: 'Quest Completed!', description: `You earned ${quest.rewardAmount} USDT!`});
                }
                needsUpdate = true;
            }
        }
        if(needsUpdate) {
            await updateDoc(userRef, { dailyQuests: userQuests });
        }
    }

    const processDailyLogin = async (userId: string, userData: User) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const lastLoginDate = userData.lastLoginTime ? new Date(new Date(userData.lastLoginTime).getFullYear(), new Date(userData.lastLoginTime).getMonth(), new Date(userData.lastLoginTime).getDate()).getTime() : 0;
    
        if (today > lastLoginDate) {
            const yesterday = today - 24 * 60 * 60 * 1000;
            const newStreak = lastLoginDate === yesterday ? (userData.loginStreak || 0) + 1 : 1;
            
            const updates: any = { 
                lastLoginTime: now.getTime(),
                loginStreak: newStreak,
            };
    
            const lastReset = userData.lastQuestResetTime ? new Date(new Date(userData.lastQuestResetTime).getFullYear(), new Date(userData.lastQuestResetTime).getMonth(), new Date(userData.lastQuestResetTime).getDate()).getTime() : 0;
            if (today > lastReset) {
                updates.lastQuestResetTime = now.getTime();
                updates.dailyQuests = (dailyEngagement.quests || []).filter(q => q.isActive).map(q => ({
                    questId: q.id,
                    progress: 0,
                    isCompleted: false
                }));
            }
            
            await updateDoc(doc(db, 'users', userId), updates);
            
            // Check for login streak reward only if user is active (Level 1+)
            if (userData.level > 0) {
                const streakReward = (dailyEngagement.loginStreakRewards || []).find(r => r.day === newStreak);
                if (streakReward && streakReward.rewardAmount > 0) {
                    const userRef = doc(db, 'users', userId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        await updateDoc(userRef, { balance: userSnap.data().balance + streakReward.rewardAmount });
                        await addTransaction(userId, {
                            id: generateTxnId(),
                            type: 'login_reward',
                            amount: streakReward.rewardAmount,
                            status: 'credited',
                            description: `Day ${newStreak} login streak reward!`
                        });
                    }
                }
            }
    
            await checkQuestProgress(userId, 'login', 1);
        }
    };
    
    const updateLeaderboardSettings = (category: LeaderboardCategory, updates: Partial<Leaderboard>) => {
        const newLeaderboards = leaderboards.map(lb => lb.category === category ? {...lb, ...updates} : lb);
        updateFirestoreSettings({ leaderboards: newLeaderboards });
    }

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
    allOnHoldRequests,
    adminHistory,
    approveRequest,
    declineRequest,
    holdRequest,
    submitDepositRequest,
    submitWithdrawalRequest,
    findUser,
    adjustUserBalance,
    adjustUserLevel,
    adjustUserDirectReferrals,
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
    updateDashboardPanels,
    addDashboardPanel,
    deleteDashboardPanel,
    referralBonusSettings,
    updateReferralBonusSettings,
    signUpBonusSettings,
    updateSignUpBonusSettings,
    teamCommissionSettings,
    updateTeamCommissionSettings,
    teamSizeRewards,
    addTeamSizeReward,
    updateTeamSizeReward,
    deleteTeamSizeReward,
    teamBusinessRewards,
    addTeamBusinessReward,
    updateTeamBusinessReward,
    deleteTeamBusinessReward,
    claimTeamReward,
    salaryRules,
    addSalaryRule,
    updateSalaryRule,
    deleteSalaryRule,
    claimSalary,
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
    layoutSettings,
    updateLayoutSettings,
    adminDashboardLayout,
    updateAdminDashboardLayout,
    signInPopupSettings,
    updateSignInPopupSettings,
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
    boosterPacks,
    boosterPurchaseHistory,
    addBoosterPack,
    updateBoosterPack,
    deleteBoosterPack,
    purchaseBooster,
    stakingPools,
    addStakingPool,
    updateStakingPool,
    deleteStakingPool,
    joinStakingPool,
    endStakingPool,
    validateWithdrawal,
    stakingVaults,
    addStakingVault,
    updateStakingVault,
    deleteStakingVault,
    investInVault,
    sendAnnouncement,
    getPrioritizedMessage,
    markAnnouncementAsRead,
    sendMessageToUser,
    sendMessageToAdmin,
    deactivateCurrentUserAccount,
    deactivateUserAccount,
    getDownline,
    getReferredUsersWithStatus,
    dailyEngagement,
    updateDailyEngagement,
    leaderboards,
    updateLeaderboardSettings,
    adminReferralCode: ADMIN_REFERRAL_CODE,
    checkAndApplyLevelDowngrade,
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
