

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'interest_credit' | 'referral_bonus' | 'admin_adjusted';
  amount: number;
  status: 'pending' | 'approved' | 'declined' | 'credited' | 'completed';
  timestamp: number;
  walletAddress?: string;
  completionTime?: number | null;
  referredUserId?: string;
  note?: string;
  email?: string;
}

export interface User {
  id: string;
  email: string;
  password?: string; // Should be hashed in a real app
  userReferralCode: string;
  referredBy: string;
  balance: number;
  level: number;
  directReferrals: number;
  lastWithdrawalMonth: string | null;
  lastWithdrawalAmount: number;
  transactions: Transaction[];
  referredUsers: string[];
  lastInterestCreditTime: number;
  withdrawalCompletionTime: number | null;
  primaryWithdrawalAddress: string;
  firstDepositTime: number | null;
  registrationTime: number;
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
  id: string;
  type: 'deposit' | 'withdrawal';
  message: string;
  isActive: boolean;
  timestamp: number;
}

export interface StartScreenSettings {
  title: string;
  subtitle: string;
  titleFontSize: string;
  subtitleFontSize: string;

  panelPadding: string;
  showGetStartedButton: boolean;
  customContent: {
    id: string;
    title?: string;
    body: string;
    isActive: boolean;
  }[];
}

export interface DashboardPanelVisibility {
  [key: string]: boolean;
  userOverviewPanel: boolean;
  userLevelPanel: boolean;
  dailyInterestPanel: boolean;
  rechargePanel: boolean;
  withdrawPanel: boolean;
  userReferralPanel: boolean;
  changeWithdrawalAddressPanel: boolean;
  transactionHistoryPanel: boolean;
  levelDetailsPanel: boolean;
  userAdminContentPanel: boolean;
}

export interface AdminTransaction {
    id: string;
    type: 'admin_deposit' | 'admin_withdrawal' | 'admin_referral_bonus';
    amount: number;
    status: 'completed' | 'credited';
    timestamp: number;
    note: string;
    referredUserId?: string;
    walletAddress?: string;
}
