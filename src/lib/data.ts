

import { AppSettings } from '@/lib/types';

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
    
    websiteTitle: 'Staking Hub',

    levels: {
        0: { interest: 0, minBalance: 0, directReferrals: 0, withdrawalLimit: 0, monthlyWithdrawals: 0 },
        1: { interest: 0.018, minBalance: 100, directReferrals: 0, withdrawalLimit: 150, monthlyWithdrawals: 1 },
        2: { interest: 0.03, minBalance: 800, directReferrals: 8, withdrawalLimit: 300, monthlyWithdrawals: 1 },
        3: { interest: 0.05, minBalance: 2000, directReferrals: 20, withdrawalLimit: 500, monthlyWithdrawals: 1 },
        4: { interest: 0.07, minBalance: 8000, directReferrals: 36, withdrawalLimit: 750, monthlyWithdrawals: 2 },
        5: { interest: 0.09, minBalance: 16000, directReferrals: 55, withdrawalLimit: 1000, monthlyWithdrawals: 2 },
    },

    rechargeAddresses: [
        { id: 'addr_1', address: '0x4D26340f3B52DCf82dd537cBF3c7e4C1D9b53BDc', network: 'BEP-20', isActive: true },
    ],

    appLinks: {
        downloadUrl: '#',
        supportUrl: '#',
    },

    floatingActionButtonSettings: {
        isEnabled: true,
        items: [
            { id: 'fab_1', label: 'Desktop View', icon: 'Monitor', action: 'switch_view_desktop', isEnabled: true },
            { id: 'fab_5', label: 'Mobile View', icon: 'Smartphone', action: 'switch_view_mobile', isEnabled: true },
            { id: 'fab_2', label: 'Forgot Password', icon: 'KeyRound', action: 'forgot_password', isEnabled: true },
            { id: 'fab_3', label: 'Download App', icon: 'Download', action: 'download_app', isEnabled: true },
            { id: 'fab_4', label: 'Customer Support', icon: 'MessageSquare', action: 'customer_support', isEnabled: true },
        ]
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
        },
        {
            id: 'withdrawal_monthly_1',
            title: 'Monthly Withdrawal Limit',
            type: 'withdrawal_monthly_limit',
            message: 'You have reached your monthly withdrawal limit of {limit}.',
            isActive: true,
        },
    ],

    referralBonusSettings: {
        isEnabled: true,
        bonusAmount: 5,
        minDeposit: 100,
    },

    startScreenContent: {
        title: 'Staking Hub',
        subtitle: 'Unlock Your Financial Potential. Securely stake USDT and earn daily rewards.',
    },

    dashboardPanels: [
        { id: 'p1', title: 'Your Staking Overview', componentKey: 'UserOverview', isVisible: true, isDeletable: false, isEditable: true },
        { id: 'p2', title: 'Your Staking Level', componentKey: 'StakingLevel', isVisible: true, isDeletable: false, isEditable: true },
        { id: 'p3', title: 'Daily Interest Credit', componentKey: 'InterestCredit', isVisible: true, isDeletable: false, isEditable: true },
        { id: 'p4', title: 'Transaction History', componentKey: 'TransactionHistory', isVisible: true, isDeletable: false, isEditable: true },
        { id: 'p5', title: 'Recharge USDT (BEP-20)', componentKey: 'Recharge', isVisible: true, isDeletable: false, isEditable: true },
        { id: 'p6', title: 'Withdraw USDT', componentKey: 'Withdraw', isVisible: true, isDeletable: false, isEditable: true },
        { id: 'p7', title: 'Manage Withdrawal Address', componentKey: 'ManageAddress', isVisible: true, isDeletable: false, isEditable: true },
        { id: 'p10', title: 'Change Password', componentKey: 'ChangePassword', isVisible: true, isDeletable: false, isEditable: true },
        { id: 'p8', title: 'Your Referral Network', componentKey: 'ReferralNetwork', isVisible: true, isDeletable: false, isEditable: true },
        { id: 'p9', title: 'Staking Level Details', componentKey: 'LevelDetails', isVisible: true, isDeletable: false, isEditable: true },
        { id: 'p11', title: 'Notices', componentKey: 'Notices', isVisible: true, isDeletable: false, isEditable: true },
    ],

    notices: [
        { id: 'notice_1', title: 'Welcome to Staking Hub!', content: 'We are excited to have you here. Start staking today to earn daily rewards.', isActive: true },
        { id: 'notice_2', title: 'Scheduled Maintenance', content: 'The platform will be undergoing scheduled maintenance on Saturday at 11 PM UTC. The service might be temporarily unavailable.', isActive: false },
    ],

    active3DTheme: 'FloatingCrystals',

    themeColors: {
        primary: '#2563eb',
        accent: '#7c3aed',
    }
};
