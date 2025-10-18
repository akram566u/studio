

import { AppSettings, DashboardPanel, DashboardPanelComponentKey } from '@/lib/types';

const defaultUserDashboardPanels: DashboardPanel[] = [
    { id: 'p1', title: 'Your Staking Overview', componentKey: 'UserOverview', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p2', title: 'Your Staking Level', componentKey: 'StakingLevel', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p3', title: 'Daily Interest Credit', componentKey: 'InterestCredit', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p18', title: 'Daily Engagement', componentKey: 'DailyEngagement', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p4', title: 'Transaction History', componentKey: 'TransactionHistory', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p5', title: 'Recharge USDT (BEP-20)', componentKey: 'Recharge', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p6', title: 'Withdraw USDT', componentKey: 'Withdraw', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p16', title: 'Settings', componentKey: 'Settings', isVisible: true, isDeletable: false, isEditable: false },
    { id: 'p7', title: 'Chat With Admin', componentKey: 'ChatWithAdmin', isVisible: true, isDeletable: false, isEditable: false },
    { id: 'p20', title: 'Delete Account', componentKey: 'DeleteAccount', isVisible: true, isDeletable: false, isEditable: false },
    { id: 'p8', title: 'Your Referral Network', componentKey: 'ReferralNetwork', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p17', title: 'Team Layers', componentKey: 'TeamLayers', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p15', title: 'Your Team', componentKey: 'Team', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p19', title: 'Leaderboards', componentKey: 'Leaderboards', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p9', title: 'Staking Level Details', componentKey: 'LevelDetails', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p11', title: 'Notices', componentKey: 'Notices', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p12', title: 'Booster Store', componentKey: 'BoosterStore', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p13', title: 'Staking Pools', componentKey: 'StakingPools', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p14', title: 'Staking Vaults', componentKey: 'StakingVaults', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p21', title: 'Profile', componentKey: 'Profile', isVisible: true, isDeletable: false, isEditable: false },
];


// This object now defines the INITIAL state of the settings.
// After the first run, these values will be read from and managed in Firestore.
// Changes in this file will only take effect if you clear the 'settings/global' document in Firestore.
export const initialAppSettings: AppSettings = {
    // =================================================================================
    // CHAT WIDGET CONFIGURATION
    // To enable the Tawk.to chat widget, paste your full widget source URL here.
    // To disable it, leave the string empty "".
    // Example: 'https://embed.tawk.to/12345abcedf/1a2b3c4d'
    // =================================================================================
    tawkToSrcUrl: '',
    // =================================================================================
    
    websiteTitle: 'Stake Plus',

    levels: {
        0: { name: 'Newcomer', interest: 0, minBalance: 0, directReferrals: 0, withdrawalLimit: 0, monthlyWithdrawals: 0, isEnabled: true },
        1: { name: 'Bronze', interest: 0.018, minBalance: 100, directReferrals: 0, withdrawalLimit: 150, monthlyWithdrawals: 1, isEnabled: true },
        2: { name: 'Silver', interest: 0.03, minBalance: 800, directReferrals: 8, withdrawalLimit: 300, monthlyWithdrawals: 1, isEnabled: true },
        3: { name: 'Gold', interest: 0.05, minBalance: 2000, directReferrals: 20, withdrawalLimit: 500, monthlyWithdrawals: 1, isEnabled: true },
        4: { name: 'Platinum', interest: 0.07, minBalance: 8000, directReferrals: 36, withdrawalLimit: 750, monthlyWithdrawals: 2, isEnabled: true },
        5: { name: 'Diamond', interest: 0.09, minBalance: 16000, directReferrals: 55, withdrawalLimit: 1000, monthlyWithdrawals: 2, isEnabled: true },
    },

    rechargeAddresses: [
        { id: 'addr_1', address: '0x4D26340f3B52DCf82dd537cBF3c7e4C1D9b53BDc', network: 'BEP-20', isActive: true },
    ],

    appLinks: {
        downloadUrl: '#',
        supportUrl: '#',
    },

    floatingActionButtonSettings: {
        startScreen: {
            isEnabled: true,
            position: 'bottom-right',
            size: 'medium',
            items: [
                { id: 'fab_1', label: 'Forgot Password', icon: 'KeyRound', action: 'forgot_password', isEnabled: true },
                { id: 'fab_2', label: 'Download App', icon: 'Download', action: 'download_app', isEnabled: true },
                { id: 'fab_3', label: 'Customer Support', icon: 'MessageSquare', action: 'customer_support', isEnabled: true },
            ]
        },
        userDashboard: {
            isEnabled: false,
            position: 'bottom-right',
            size: 'medium',
            items: [
                { id: 'fab_ud_1', label: 'Customer Support', icon: 'MessageSquare', action: 'customer_support', isEnabled: true },
            ]
        },
        adminDashboard: {
            isEnabled: false,
            position: 'bottom-right',
            size: 'medium',
            items: []
        }
    },

    layoutSettings: {
        mobileMaxWidth: 'sm',
        desktopMaxWidth: '7xl',
        fabMobileMaxHeight: '60vh',
        fabDesktopMaxHeight: '60vh',
    },

    adminDashboardLayout: 'floating',
    
    signInPopupSettings: {
        isEnabled: true,
        content: "Welcome to Stake Plus! We're glad to have you here. \n\nCheck out the Booster Store for special offers."
    },

    restrictionMessages: [
        {
            id: 'deposit_no_address_1',
            title: 'Deposit Error: No Withdrawal Address',
            type: 'deposit_no_address',
            message: 'Please update your Bep20 withdrawal address first.',
            isActive: true,
        },
        {
            id: 'deposit_confirm_1',
            title: 'Deposit Confirmation',
            type: 'deposit_confirm',
            message: 'Please make sure you set the same withdrawal address from which you deposit Usdt on the above recharge address. A different address may cause a permanent loss of funds.',
            isActive: true,
        },
        {
            id: 'withdrawal_hold_1',
            title: 'Withdrawal Hold Period',
            type: 'withdrawal_hold',
            message: 'Please wait for the {durationDays}-day holding period to end. {countdown} remaining',
            durationDays: 45,
            isActive: true,
            applicableLevels: [],
        },
        {
            id: 'withdrawal_monthly_1',
            title: 'Monthly Withdrawal Limit',
            type: 'withdrawal_monthly_limit',
            message: 'You have reached your monthly withdrawal limit of {limit}. Please try again next month.',
            isActive: true,
            applicableLevels: [],
        },
        {
            id: 'withdrawal_initial_deposit_1',
            title: 'Initial Deposit Withdrawal Rule',
            type: 'withdrawal_initial_deposit',
            message: 'You can only withdraw your earnings. To withdraw a portion of your principal, please contact support. You can currently withdraw up to {max_amount} USDT.',
            withdrawalPercentage: 0,
            isActive: true,
            applicableLevels: [],
        }
    ],

    referralBonusSettings: {
        isEnabled: true,
        bonusAmount: 5,
        minDeposit: 100,
    },

    teamCommissionSettings: {
        isEnabled: true,
        rates: {
            level1: 0.10, // 10% of Level 1's interest earnings
            level2: 0.05, // 5%
            level3: 0.02, // 2%
        },
        minDirectReferrals: 3,
        communityRate: 0.01, // 1% for L4+
        minReferralsForCommunity: 5, // 5 direct referrals needed
        dailyActivationResetTime: "00:00", // IST time for reset
    },

    teamSizeRewards: [
        { id: 'tsr_1', teamSize: 10, rewardAmount: 10, isEnabled: true },
        { id: 'tsr_2', teamSize: 50, rewardAmount: 60, isEnabled: true },
        { id: 'tsr_3', teamSize: 100, rewardAmount: 150, isEnabled: true },
    ],

    teamBusinessRewards: [
        { id: 'tbr_1', businessAmount: 5000, rewardAmount: 100, isEnabled: true },
        { id: 'tbr_2', businessAmount: 25000, rewardAmount: 600, isEnabled: true },
    ],
    
    salaryRules: [],

    startScreenContent: {
        title: 'Stake Plus',
        subtitle: 'Unlock Your Financial Potential. Securely stake USDT and earn daily rewards.',
    },

    dashboardPanels: defaultUserDashboardPanels,

    notices: [
        { id: 'notice_1', title: 'Welcome to Stake Plus!', content: 'We are excited to have you here. Start staking today to earn daily rewards.', isActive: true },
        { id: 'notice_2', title: 'Scheduled Maintenance', content: 'The platform will be undergoing scheduled maintenance on Saturday at 11 PM UTC. The service might be temporarily unavailable.', isActive: false },
    ],
    
    boosterPacks: [
        { id: 'bp_1', name: 'Referral Point Pack', description: 'Get 2 referral points to help you level up faster.', cost: 10, type: 'referral_points', effectValue: 2, isActive: true, applicableLevels: [0,1,2,3,4], purchaseLimit: -1 },
        { id: 'bp_2', name: '24hr Interest Boost', description: 'Increase your daily interest by an additional 1% for 24 hours.', cost: 5, type: 'interest_boost', effectValue: 0.01, durationHours: 24, isActive: true, purchaseLimit: -1 },
        { id: 'bp_3', name: 'Referral Bonus Boost', description: 'Earn 1.5x bonus from your next referral!', cost: 20, type: 'referral_bonus_boost', effectValue: 1.5, durationDays: 7, isActive: true, purchaseLimit: 1 },
    ],
    
    stakingPools: [
        { id: 'sp_1', name: 'Weekend Jackpot', description: 'Contribute to the pool for a chance to win the entire interest pot!', endsAt: Date.now() + 3 * 24 * 60 * 60 * 1000, interestRate: 0.25, totalStaked: 0, minContribution: 10, maxContribution: 500, participants: [], status: 'active', isActive: true }
    ],
    
    stakingVaults: [
        { id: 'sv_1', name: '7-Day Sprint', termDays: 7, interestRate: 0.10, minInvestment: 50, maxInvestment: 1000, totalInvested: 0, totalInvestors: 0, isActive: true },
        { id: 'sv_2', name: '30-Day Marathon', termDays: 30, interestRate: 0.15, minInvestment: 100, maxInvestment: 5000, totalInvested: 0, totalInvestors: 0, isActive: true },
    ],

    dailyEngagement: {
        quests: [
            { id: 'q1', type: 'login', title: 'Daily Login', description: 'Log in to your account.', targetValue: 1, rewardAmount: 0.1, isActive: true },
            { id: 'q2', type: 'deposit_amount', title: 'Stake USDT', description: 'Make a new deposit of any amount.', targetValue: 1, rewardAmount: 0.5, isActive: true },
        ],
        loginStreakRewards: [
            { day: 1, rewardAmount: 0.1 },
            { day: 2, rewardAmount: 0.2 },
            { day: 3, rewardAmount: 0.3 },
            { day: 4, rewardAmount: 0.4 },
            { day: 5, rewardAmount: 0.5 },
            { day: 6, rewardAmount: 0.6 },
            { day: 7, rewardAmount: 1.0 },
        ]
    },

    leaderboards: [
        { category: 'top_earners', title: 'Top Earners (Weekly)', data: [], lastUpdated: 0, isEnabled: true },
        { category: 'top_recruiters', title: 'Top Recruiters (Weekly)', data: [], lastUpdated: 0, isEnabled: true },
        { category: 'highest_balance', title: 'Highest Balance', data: [], lastUpdated: 0, isEnabled: true },
    ],

    active3DTheme: 'FloatingCrystals',

    themeColors: {
        primary: '#2563eb',
        accent: '#7c3aed',
    }
};
