

export type BackgroundTheme = 'FloatingCrystals' | 'CosmicNebula' | 'DigitalMatrix' | 'AbstractParticles' | 'SynthwaveSunset';

export interface RechargeAddress {
  id: string;
  address: string;
  network: string;
  isActive: boolean;
}

export interface FloatingActionItem {
  id: string;
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
  type: 'deposit' | 'withdrawal' | 'interest_credit' | 'referral_bonus' | 'admin_adjusted' | 'level_up' | 'new_referral' | 'account_created' | 'info';
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


export interface User {
  id: string;
  email: string;
  password?: string; // Should be hashed in a real app
  userReferralCode: string;
  referredBy: string | null; // Can be null if no referrer
  balance: number;
  level: number;
  directReferrals: number;
  transactions: Transaction[];
  referredUsers: { email: string, isActivated: boolean }[];
  lastInterestCreditTime: number;
  primaryWithdrawalAddress: string;
  firstDepositTime: number | null;
  registrationTime: number;
  lastWithdrawalTime: number | null; // To track monthly withdrawal limit
}

export interface Level {
  interest: number;
  minBalance: number;
  directReferrals: number;
  withdrawalLimit: number;
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

export interface AdminContent {
  id: string;
  title: string;
  body: string;
  type: 'Announcement' | 'Action Item' | 'Information';
  global: boolean;
  targetUserId: string;
  isActive: boolean;
}

export interface RestrictionMessage {
  id:string;
  title: string;
  type: 'deposit_no_address' | 'deposit_confirm' | 'withdrawal_hold';
  message: string;
  durationDays?: number; // Optional duration for time-based restrictions
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
  componentKey: 'UserOverview' | 'StakingLevel' | 'InterestCredit' | 'TransactionHistory' | 'Recharge' | 'Withdraw' | 'ManageAddress' | 'ReferralNetwork' | 'LevelDetails' | 'Custom' | 'ChangePassword' | 'Notices';
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
}
