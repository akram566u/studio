

import { z } from 'zod';

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
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size: 'small' | 'medium' | 'large';
  items: FloatingActionItem[];
}

export type FABSettings = Record<'startScreen' | 'userDashboard' | 'adminDashboard', FloatingActionButtonSettings>;


export interface ScreenLayoutSettings {
    mobileMaxWidth: 'sm' | 'md' | 'lg' | 'full';
    desktopMaxWidth: 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export interface AppLinks {
    downloadUrl: string;
    supportUrl: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'interest_credit' | 'referral_bonus' | 'admin_adjusted' | 'level_up' | 'new_referral' | 'account_created' | 'info' | 'booster_purchase' | 'pool_join' | 'pool_payout' | 'vault_investment' | 'vault_payout' | 'team_commission' | 'team_size_reward' | 'team_business_reward';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: 'pending' | 'on_hold' | 'approved' | 'declined' | 'credited' | 'completed' | 'info' | 'active';
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
    type: 'interest_boost' | 'referral_bonus_boost' | 'referral_points';
    expiresAt: number;
    effectValue: number; // e.g., 0.01 for interest, 1.5 for 1.5x bonus
    cost: number;
}

export interface UserVaultInvestment {
    investmentId: string;
    vaultId: string;
    vaultName: string;
    amount: number;
    interestRate: number;
    startedAt: number;
    maturesAt: number;
}

export interface UserAnnouncement {
  id: string;
  message: string;
  createdAt: number;
  createdBy: 'admin' | 'ai';
  read: boolean;
  priority: number; // e.g., 1 for high, 10 for low
}

export interface Message {
  id: string;
  sender: 'admin' | 'user';
  content: string;
  timestamp: number;
  read: boolean;
}

export interface User {
  id: string;
  email: string;
  password?: string; // Should be hashed in a real app
  userReferralCode: string;
  referredBy: string | null; // The direct referrer's ID
  referralPath: string[]; // An array of referrer IDs, from direct to top-level
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
  vaultInvestments?: UserVaultInvestment[];
  teamSize?: number; // Total number of users in the downline
  teamBusiness?: number; // Total deposits made by the entire downline
  claimedTeamSizeRewards?: string[]; // Array of claimed reward IDs
  claimedTeamBusinessRewards?: string[]; // Array of claimed reward IDs
  announcements?: UserAnnouncement[];
  messages?: Message[];
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
    type: 'interest_boost' | 'referral_points' | 'referral_bonus_boost';
    // The value of the boost (e.g., 0.01 for 1% interest, or 2 for 2 points)
    effectValue: number; 
    // Optional: duration in hours/days for temporary boosts
    durationDays?: number;
    durationHours?: number;
    // Optional: which levels can purchase this
    applicableLevels?: number[];
    purchaseLimit: number; // -1 for unlimited
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

export interface StakingVault {
    id: string;
    name: string;
    termDays: number;
    interestRate: number; // Annualized rate
    minInvestment: number;
    maxInvestment: number;
    totalInvested: number;
    totalInvestors: number;
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
  applicableLevels?: number[]; // Optional: which levels this restriction applies to. Empty means all levels.
}

export interface ReferralBonusSettings {
    isEnabled: boolean;
    bonusAmount: number;
    minDeposit: number;
}

export interface TeamCommissionSettings {
    isEnabled: boolean;
    rates: {
        level1: number;
        level2: number;
        level3: number;
    };
}

export interface TeamSizeReward {
    id: string;
    teamSize: number;
    rewardAmount: number;
    isEnabled: boolean;
}

export interface TeamBusinessReward {
    id: string;
    businessAmount: number; // Total team deposit amount required
    rewardAmount: number;
    isEnabled: boolean;
}

export interface StartScreenSettings {
  title: string;
  subtitle: string;
}

export interface DashboardPanel {
  id: string;
  title: string;
  componentKey: 'UserOverview' | 'StakingLevel' | 'InterestCredit' | 'TransactionHistory' | 'Recharge' | 'Withdraw' | 'ManageAddress' | 'ReferralNetwork' | 'LevelDetails' | 'Custom' | 'ChangePassword' | 'Notices' | 'BoosterStore' | 'StakingPools' | 'StakingVaults' | 'Team' | 'Settings';
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
    teamCommissionSettings: TeamCommissionSettings;
    teamSizeRewards: TeamSizeReward[];
    teamBusinessRewards: TeamBusinessReward[];
    active3DTheme: BackgroundTheme;
    rechargeAddresses: RechargeAddress[];
    appLinks: AppLinks;
    floatingActionButtonSettings: FABSettings;
    screenLayoutSettings: ScreenLayoutSettings;
    tawkToSrcUrl: string;
    themeColors: { primary: string; accent: string };
    notices: Notice[];
    boosterPacks: BoosterPack[];
    stakingPools: StakingPool[];
    stakingVaults: StakingVault[];
}


// Zod schemas and types for analyzeTeam AI flow
export const AnalyzeTeamInputSchema = z.object({
  userId: z.string().describe("The ID of the user whose team is to be analyzed."),
});
export type AnalyzeTeamInput = z.infer<typeof AnalyzeTeamInputSchema>;

export const AnalyzeTeamOutputSchema = z.object({
  strengths: z.array(z.string()).describe("Positive aspects of the user's team-building efforts."),
  weaknesses: z.array(z.string()).describe("Areas where the user's team-building could be improved."),
  suggestions: z.array(z.string()).describe("Actionable suggestions for the user to improve team performance and engagement."),
  rewardAnalysis: z.string().describe("An analysis of the user's proximity to earning team-based rewards."),
});
export type AnalyzeTeamOutput = z.infer<typeof AnalyzeTeamOutputSchema>;


// Zod schemas and types for prioritizeMessage AI flow
const userSchemaForPrioritization = z.object({
    balance: z.number(),
    level: z.number(),
    teamSize: z.number(),
    teamBusiness: z.number(),
    announcements: z.array(z.object({
        message: z.string(),
        createdAt: z.number(),
    })),
});

export const PrioritizeMessageInputSchema = z.object({
    user: userSchemaForPrioritization,
    nextLevel: z.object({
        minBalance: z.number(),
        directReferrals: z.number(),
    }),
    nextTeamSizeReward: z.object({
        teamSize: z.number(),
        rewardAmount: z.number(),
    }),
    nextTeamBusinessReward: z.object({
        businessAmount: z.number(),
        rewardAmount: z.number(),
    }),
});
export type PrioritizeMessageInput = z.infer<typeof PrioritizeMessageInputSchema>;

export const PrioritizeMessageOutputSchema = z.object({
    source: z.enum(['admin', 'ai']).describe("The source of the message."),
    message: z.string().describe("The prioritized message to display to the user."),
    announcementId: z.string().optional().describe("The ID of the admin announcement, if applicable."),
});
export type PrioritizeMessageOutput = z.infer<typeof PrioritizeMessageOutputSchema>;
