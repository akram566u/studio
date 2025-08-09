import { RestrictionMessage, Levels, StartScreenSettings, DashboardPanel, ReferralBonusSettings } from '@/lib/types';

export const initialLevels: Levels = {
    0: { interest: 0, minBalance: 0, directReferrals: 0, withdrawalLimit: 0 },
    1: { interest: 0.018, minBalance: 100, directReferrals: 0, withdrawalLimit: 150 },
    2: { interest: 0.03, minBalance: 800, directReferrals: 8, withdrawalLimit: 300 },
    3: { interest: 0.05, minBalance: 2000, directReferrals: 20, withdrawalLimit: 500 },
    4: { interest: 0.07, minBalance: 8000, directReferrals: 36, withdrawalLimit: 750 },
    5: { interest: 0.09, minBalance: 16000, directReferrals: 55, withdrawalLimit: 1000 },
};

export const initialRestrictionMessages: RestrictionMessage[] = [
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
    }
];

export const initialReferralBonusSettings: ReferralBonusSettings = {
    isEnabled: true,
    bonusAmount: 5,
    minDeposit: 100,
};


export const initialStartScreen: StartScreenSettings = {
    title: 'Staking Hub',
    subtitle: 'Unlock Your Financial Potential. Securely stake USDT and earn daily rewards.',
};

export const initialDashboardPanels: DashboardPanel[] = [
    { id: 'p1', title: 'Your Staking Overview', componentKey: 'UserOverview', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p2', title: 'Your Staking Level', componentKey: 'StakingLevel', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p3', title: 'Daily Interest Credit', componentKey: 'InterestCredit', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p4', title: 'Transaction History', componentKey: 'TransactionHistory', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p5', title: 'Recharge USDT (BEP-20)', componentKey: 'Recharge', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p6', title: 'Withdraw USDT', componentKey: 'Withdraw', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p7', title: 'Manage Withdrawal Address', componentKey: 'ManageAddress', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p8', title: 'Your Referral Network', componentKey: 'ReferralNetwork', isVisible: true, isDeletable: false, isEditable: true },
    { id: 'p9', title: 'Staking Level Details', componentKey: 'LevelDetails', isVisible: true, isDeletable: false, isEditable: true },
];
