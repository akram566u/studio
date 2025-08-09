import { RestrictionMessage, Levels } from '@/lib/types';

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
