

export type BackgroundTheme = 'FloatingCrystals' | 'CosmicNebula' | 'DigitalMatrix' | 'AbstractParticles' | 'SynthwaveSunset';

export interface RechargeAddress {
  id: string;
  address: string;
  network: string;
  isActive: boolean;
}

export interface FloatingActionItem {
  id:string;
  label: string;
  icon: string; // lucide-react icon name
  action: 'switch_view_desktop' | 'switch_view_mobile' | 'forgot_password' | 'download_app' | 'customer_support' | 'custom_link';
  url?: string; // only for custom_link
  isEnabled: boolean;
}

export interface FloatingActionButtonSettings {
  isEnabled: boolean;
  items: FloatingActionItem[];
}

export interface AppLinks {
    downloadUrl: string;
    supportUrl: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'interest_credit' | 'referral_bonus' | 'admin_adjusted' | 'level_up' | 'new_referral' | 'account_created' | 'info' | 'booster_purchase' | 'pool_join' | 'pool_payout';
  amount: number;
  status: 'pending' | 'approved' | 'declined' | 'credited' | 'completed' | 'info';
  timestamp: number;
  walletAddress?: string;
  completionTime?: number | null;
  referredUserId?: string;
  note?: string;
  email?: string;
  description: string;
}

// This interface will be used for displaying requests in the admin panel, augmented with user data.
export interface AugmentedTransaction extends Transaction {
    userLevel?: number;
    userWithdrawalAddress?: string;
    userDepositCount?: number;
    userWithdrawalCount?: number;
    directReferrals?: number;
}

export interface ActiveBooster {
    boosterId: string;
    type: 'interest_boost';
    expiresAt: number;
    effectValue: number;
}

export interface User {
  id: string;
  email: string;
  password?: string; // Should be hashed in a real app
  userReferralCode: string;
  referredBy: string | null; // Can be null if no referrer
  balance: number;
  totalDeposits: number; // New field
  level: number;
  directReferrals: number;
  purchasedReferralPoints: number;
  transactions: Transaction[];
  referredUsers: { email: string, isActivated: boolean }[];
  lastInterestCreditTime: number;
  primaryWithdrawalAddress: string;
  firstDepositTime: number | null;
  registrationTime: number;
  lastWithdrawalTime: number | null; // To track monthly withdrawal limit
  activeBoosters?: ActiveBooster[];
}

export interface Level {
  name: string;
  interest: number;
  minBalance: number;
  directReferrals: number;
  withdrawalLimit: number;
  monthlyWithdrawals: number;
  isEnabled: boolean;
}

export interface Levels {
  [key: number]: Level;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
}

export interface BoosterPack {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: 'interest_boost' | 'referral_points';
    // The value of the boost (e.g., 0.01 for 1% interest, or 2 for 2 points)
    effectValue: number; 
    // Optional: duration in hours for temporary boosts
    durationHours?: number;
    isActive: boolean;
}

export interface StakingPool {
    id: string;
    name: string;
    description: string;
    endsAt: number; // Timestamp
    interestRate: number; // Special, high rate for the pool
    totalStaked: number;
    minContribution: number;
    maxContribution: number;
    participants: { userId: string; amount: number; email: string; }[];
    status: 'active' | 'completed';
    winners?: { userId: string; prize: number; email: string; }[];
    isActive: boolean;
}

export interface RestrictionMessage {
  id:string;
  title: string;
  type: 'deposit_no_address' | 'deposit_confirm' | 'withdrawal_hold' | 'withdrawal_monthly_limit' | 'withdrawal_initial_deposit';
  message: string;
  durationDays?: number; // Optional duration for time-based restrictions
  withdrawalPercentage?: number; // Optional percentage for initial deposit withdrawal
  isActive: boolean;
}

export interface ReferralBonusSettings {
    isEnabled: boolean;
    bonusAmount: number;
    minDeposit: number;
}

export interface StartScreenSettings {
  title: string;
  subtitle: string;
}

export interface DashboardPanel {
  id: string;
  title: string;
  componentKey: 'UserOverview' | 'StakingLevel' | 'InterestCredit' | 'TransactionHistory' | 'Recharge' | 'Withdraw' | 'ManageAddress' | 'ReferralNetwork' | 'LevelDetails' | 'Custom' | 'ChangePassword' | 'Notices' | 'BoosterStore' | 'StakingPools';
  isVisible: boolean;
  isDeletable: boolean;
  isEditable: boolean;
  content?: string; // For custom panels
}

// Single document in Firestore to hold all settings
export interface AppSettings {
    websiteTitle: string;
    levels: Levels;
    restrictionMessages: RestrictionMessage[];
    startScreenContent: StartScreenSettings;
    dashboardPanels: DashboardPanel[];
    referralBonusSettings: ReferralBonusSettings;
    active3DTheme: BackgroundTheme;
    rechargeAddresses: RechargeAddress[];
    appLinks: AppLinks;
    floatingActionButtonSettings: FloatingActionButtonSettings;
    tawkToSrcUrl: string;
    themeColors: { primary: string; accent: string };
    notices: Notice[];
    boosterPacks: BoosterPack[];
    stakingPools: StakingPool[];
}
