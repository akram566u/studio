
"use client";
import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext, DownlineUser, ReferredUserWithStatus } from '@/components/providers/AppProvider';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, UserCheck, Trash2, Edit, Send, Briefcase, TrendingUp, CheckCircle, Info, UserX, KeyRound, Ban, Megaphone, Check, ChevronRight, X, Star, BarChart, Settings, Gift, Layers, Rocket, Users, PiggyBank, Lock, Trophy, BadgePercent, MessageSquare, UserX as UserXIcon, Loader2, CalendarCheck, ShieldCheck, User as UserIcon, Eye, EyeOff, Wallet, BadgeHelp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { BoosterPack, DashboardPanel, DashboardPanelComponentKey, Level, Notice, SignInPopupSettings, StakingPool, StakingVault, Transaction, ActiveBooster, TeamSizeReward, TeamBusinessReward, PrioritizeMessageOutput, User, Message, DailyQuest, UserDailyQuest, Leaderboard, SalaryRule } from '@/lib/types';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';


// Individual Panel Components (for use in Dialogs)
const UserOverviewPanel = ({ currentUser, levels, todaysCommission }: { currentUser: any, levels: { [key: number]: Level }, todaysCommission: number }) => {
    const context = useContext(AppContext);
    if (!context) return null;

    const baseInterest = levels[currentUser.level]?.interest || 0;
    const userName = currentUser.email.split('@')[0];
    const isActive = currentUser.level > 0;

    // Calculate boosted interest
    const now = Date.now();
    const activeBoosters = (currentUser.activeBoosters || []).filter((b: ActiveBooster) => b.type === 'interest_boost' && b.expiresAt > now);
    const interestBoost = activeBoosters.reduce((acc: number, b: ActiveBooster) => acc + b.effectValue, 0);
    const totalInterest = baseInterest + interestBoost;
    
    return (
        <Card className="card-gradient-blue-purple p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-semibold mb-1 text-blue-300">Your Staking Overview</h3>
                    <p className="text-sm text-gray-400 mb-4">{currentUser.email}</p>
                </div>
                <Badge variant={isActive ? "secondary" : "destructive"} className={cn(isActive ? "bg-green-600/80 border-green-500" : "bg-red-600/80 border-red-500")}>
                    {isActive ? "Active" : "Inactive"}
                </Badge>
            </div>
            <div className="flex items-center justify-between mb-4">
            <p className="text-xl text-gray-200">Total USDT Balance:</p>
            <p className="text-4xl font-bold text-green-400">{currentUser.balance.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-lg text-gray-200">Daily Interest Rate:</p>
                <p className="text-2xl font-bold text-purple-400 flex items-center gap-2">
                    {(totalInterest * 100).toFixed(3)}%
                    {interestBoost > 0 && <Rocket className="text-orange-400" />}
                </p>
            </div>
             <div className="flex items-center justify-between">
                <p className="text-lg text-gray-200">Today's Team Commission:</p>
                <p className="text-2xl font-bold text-teal-400">{todaysCommission.toFixed(4)}</p>
            </div>
            {activeBoosters.length > 0 && (
                <div className="mt-2 text-xs text-orange-300 space-y-1">
                    {activeBoosters.map((b: ActiveBooster) => (
                        <p key={`${b.boosterId}-${b.expiresAt}`}>
                           +{(b.effectValue * 100).toFixed(2)}% boost expires in {formatDistanceToNow(b.expiresAt, { addSuffix: true })}
                        </p>
                    ))}
                </div>
            )}
        </Card>
    );
}

const StakingLevelPanel = ({ currentUser, currentLevelDetails }: { currentUser: any, currentLevelDetails: any }) => (
    <Card className="card-gradient-green-cyan p-6">
        <h3 className="text-xl font-semibold mb-3 text-blue-300">Your Staking Level</h3>
        <div className="flex items-center justify-between mb-2">
            <p className="text-xl text-gray-200">{currentLevelDetails?.name || `Level ${currentUser.level}`}</p>
            <LevelBadge level={currentUser.level} />
        </div>
        <div className="flex items-center justify-between mb-2">
            <p className="text-xl text-gray-200">Active Referrals:</p>
            <p className="text-2xl font-bold text-yellow-400">{(currentUser.directReferrals || 0) + (currentUser.purchasedReferralPoints || 0)}</p>
        </div>
        <div className="flex items-center justify-between">
            <p className="text-xl text-gray-200">Withdrawal Limit:</p>
            <p className="text-2xl font-bold text-yellow-400">{currentLevelDetails?.withdrawalLimit || 0} USDT</p>
        </div>
    </Card>
);

const InterestCountdownPanel = () => {
    const context = useContext(AppContext);
    const [interestCountdown, setInterestCountdown] = useState('00h 00m 00s');
    const [isClaimable, setIsClaimable] = useState(false);
    
    if (!context || !context.currentUser) return null;
    const { currentUser, levels } = context;

    const canEarnInterest = currentUser.level > 0 && currentUser.balance >= (levels[1]?.minBalance || 100);

    useEffect(() => {
        if (currentUser && currentUser.level > 0 && currentUser.firstDepositTime) {
          const timer = setInterval(() => {
            const now = new Date().getTime();
            const lastCreditTime = currentUser.lastInterestCreditTime || currentUser.firstDepositTime;
            const nextCredit = lastCreditTime + (24 * 60 * 60 * 1000);
            const distance = nextCredit - now;
    
            if (distance < 0) {
              setInterestCountdown('Ready to Claim!');
              setIsClaimable(true);
              clearInterval(timer);
              return;
            }
            
            setIsClaimable(false);
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setInterestCountdown(`${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
          }, 1000);
          return () => clearInterval(timer);
        } else {
          setInterestCountdown('N/A');
          setIsClaimable(false);
        }
    }, [currentUser]);
    
    const handleClaim = () => {
        if(context && isClaimable) {
            context.claimDailyInterest();
        }
    }
    
    return (
        <Card className="card-gradient-orange-red p-6 text-center">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Daily Interest Credit</h3>
            {!canEarnInterest && (
                <Alert variant="destructive" className="mb-4">
                    <BadgeHelp className="h-4 w-4" />
                    <AlertTitle>Interest Earning Paused</AlertTitle>
                    <AlertDescription>
                        Your account is inactive. You must maintain at least {(levels[1]?.minBalance || 100)} USDT to earn daily interest.
                    </AlertDescription>
                </Alert>
            )}
            <p className="text-xl text-gray-200 mb-3">Next credit in:</p>
            <p className="text-5xl font-bold text-purple-400 mb-4">{interestCountdown}</p>
            <Button 
                onClick={handleClaim} 
                disabled={!isClaimable || !canEarnInterest}
                className="w-full py-3 text-lg"
            >
               {isClaimable ? <><Check/> Claim & Start Timer</> : <><Ban/>Claim</>}
            </Button>
        </Card>
    );
}

const TransactionHistoryPanel = () => {
    const context = useContext(AppContext);
    if (!context || !context.currentUser) return null;
    const { currentUser } = context;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': case 'credited': case 'approved': return <Badge variant="secondary" className="bg-green-700">Completed</Badge>;
            case 'pending': return <Badge variant="secondary" className="bg-yellow-700">Pending</Badge>;
            case 'on_hold': return <Badge variant="secondary" className="bg-orange-600">On Hold</Badge>;
            case 'declined': return <Badge variant="destructive">Declined</Badge>;
            case 'info': return <Badge variant="default">Info</Badge>;
            case 'active': return <Badge variant="secondary" className="bg-blue-700">Active</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };
    const getIconForType = (type: string) => {
        switch(type) {
            case 'deposit': return <Briefcase className="text-green-400" />;
            case 'withdrawal': return <Send className="text-red-400" />;
            case 'interest_credit': return <TrendingUp className="text-purple-400" />;
            case 'level_up': return <TrendingUp className="text-blue-400" />;
            case 'level_down': return <TrendingUp className="text-red-400 rotate-180" />;
            case 'new_referral': return <UserCheck className="text-yellow-400" />;
            case 'team_commission': return <Users className="text-teal-400" />;
            case 'team_size_reward': return <Trophy className="text-amber-400" />;
            case 'team_business_reward': return <BadgePercent className="text-cyan-400" />;
            case 'salary_claim': return <Wallet className="text-blue-400" />;
            case 'booster_purchase': return <Rocket className="text-orange-400" />;
            case 'sign_up_bonus': return <Gift className="text-pink-400" />;
            case 'pool_join': return <Users className="text-cyan-400" />;
            case 'pool_payout': return <Star className="text-yellow-300" />;
            case 'vault_investment': return <Lock className="text-indigo-400" />;
            case 'vault_payout': return <PiggyBank className="text-pink-400" />;
            case 'quest_reward': return <ShieldCheck className="text-green-500" />;
            case 'login_reward': return <CalendarCheck className="text-blue-500" />;
            default: return <CheckCircle className="text-gray-400" />;
        }
    }
    return (
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Transaction History</h3>
            <ScrollArea className="h-96 custom-scrollbar">
                {currentUser.transactions && currentUser.transactions.length > 0 ? (
                <div className="space-y-4">
                    {currentUser.transactions.slice().sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp).map((tx: Transaction) => (
                    <div key={`${tx.id}-${tx.timestamp}`} className="flex items-start gap-3">
                        <div className="mt-1">{getIconForType(tx.type)}</div>
                        <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-white">{tx.description}</p>
                            {getStatusBadge(tx.status)}
                        </div>
                        <p className="text-xs text-gray-400">
                            {tx.timestamp && isValid(new Date(tx.timestamp))
                                ? format(new Date(tx.timestamp), 'PPpp')
                                : 'Invalid date'}
                        </p>
                        </div>
                    </div>
                    ))}
                </div>
                ) : (
                <p className="text-gray-400">No transactions yet.</p>
                )}
            </ScrollArea>
        </>
    );
};

const RechargePanel = () => {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [depositAmount, setDepositAmount] = useState('');
    const [isDepositAlertOpen, setIsDepositAlertOpen] = useState(false);
    const [depositAlertMessage, setDepositAlertMessage] = useState('');
    const [depositAlertConfirmAction, setDepositAlertConfirmAction] = useState<(() => void) | null>(null);

    if (!context || !context.currentUser) return null;
    const { currentUser, submitDepositRequest, restrictionMessages, rechargeAddresses } = context;
    const activeAddress = rechargeAddresses.find(a => a.isActive);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard!' });
    };

    const handleDepositRequest = () => {
        if (!activeAddress) {
            toast({ title: "Error", description: "No active deposit address. Please contact support.", variant: "destructive" });
            return;
        }

        const noAddressMsg = restrictionMessages.find(m => m.type === 'deposit_no_address' && m.isActive);
        const confirmMsg = restrictionMessages.find(m => m.type === 'deposit_confirm' && m.isActive);

        if (!currentUser.primaryWithdrawalAddress && noAddressMsg) {
            setDepositAlertMessage(noAddressMsg.message);
            setDepositAlertConfirmAction(null);
            setIsDepositAlertOpen(true);
            return;
        }

        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Error", description: "Please enter a valid deposit amount.", variant: "destructive" });
            return;
        }
        
        if (confirmMsg) {
            setDepositAlertMessage(confirmMsg.message);
            setDepositAlertConfirmAction(() => () => {
                submitDepositRequest(amount, activeAddress.address);
                setDepositAmount('');
            });
            setIsDepositAlertOpen(true);
        } else {
            submitDepositRequest(amount, activeAddress.address);
            setDepositAmount('');
        }
    };
    
    return (
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Recharge USDT ({activeAddress?.network || '...'})</h3>
            <p className="text-gray-200 mb-3">Copy this address to deposit:</p>
            {activeAddress ? (
                <div className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between mb-4">
                    <span className="font-mono text-sm break-all text-green-300">{activeAddress.address}</span>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(activeAddress.address)}>
                        <Copy className="size-4" />
                    </Button>
                </div>
            ) : (
                <div className="bg-gray-900/50 p-3 rounded-lg text-center text-yellow-400">
                    No active deposit address.
                </div>
            )}
            <Input 
                type="number" 
                placeholder="Amount in USDT" 
                className="mb-4 text-lg" 
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={!activeAddress}
            />
            <Button className="w-full py-3 text-lg" onClick={handleDepositRequest} disabled={!activeAddress}>
                Submit Recharge Request
            </Button>

            <AlertDialog open={isDepositAlertOpen} onOpenChange={setIsDepositAlertOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Deposit Information</AlertDialogTitle>
                    <AlertDialogDescription>
                    {depositAlertMessage}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        {depositAlertConfirmAction ? 'Cancel' : 'Close'}
                    </AlertDialogCancel>
                    {depositAlertConfirmAction && (
                        <AlertDialogAction onClick={() => {
                            if(depositAlertConfirmAction) {
                                depositAlertConfirmAction();
                            }
                            setIsDepositAlertOpen(false);
                        }}>
                        OK to Proceed
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
};

const WithdrawPanel = ({ isCounterRunning }: { isCounterRunning: boolean }) => {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    if (!context || !context.currentUser || !context.levels) return null;
    const { currentUser, levels, submitWithdrawalRequest, validateWithdrawal } = context;
    const currentLevelDetails = levels[currentUser.level];
    
    const feePercentage = currentLevelDetails?.withdrawalFee || 0;
    const amount = parseFloat(withdrawalAmount) || 0;
    const fee = (amount * feePercentage) / 100;
    const netAmount = amount - fee;

    const handleSubmitWithdrawal = () => {
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Error", description: "Please enter a valid withdrawal amount.", variant: "destructive" });
            return;
        }

        // Rule 0: Check against all restrictions
        const validationError = validateWithdrawal(amount);
        if (validationError) {
            setAlertMessage(validationError);
            setIsAlertOpen(true);
            return;
        }

        submitWithdrawalRequest(amount);
        setWithdrawalAmount('');
    };
    
    return (
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Withdraw USDT</h3>
            <p className="text-lg text-gray-300 mb-1">
                Your withdrawal limit: <span className="font-bold text-yellow-300">{currentLevelDetails?.withdrawalLimit || 0} USDT</span>
            </p>
            <p className="text-xs text-gray-400 mb-3">
                You can withdraw {currentLevelDetails?.monthlyWithdrawals || 0} time(s) per month. A {feePercentage}% fee applies.
            </p>
            {isCounterRunning && (
                <Alert variant="destructive" className='mb-4'>
                    <Ban className="h-4 w-4" />
                    <AlertTitle>Withdrawals Locked</AlertTitle>
                    <AlertDescription>
                       You cannot request a withdrawal while the daily interest timer is running.
                    </AlertDescription>
                </Alert>
            )}
            <Input
                type="number"
                placeholder="Amount to withdraw"
                className="mb-4 text-lg"
                value={withdrawalAmount}
                onChange={e => setWithdrawalAmount(e.target.value)}
                disabled={isCounterRunning}
            />
            <Input type="text" placeholder={currentUser.primaryWithdrawalAddress || 'Not set'} value={currentUser.primaryWithdrawalAddress || ''} readOnly className="mb-2 text-lg bg-gray-800/50" />
            <div className="text-sm text-gray-400 mb-4 p-2 bg-black/20 rounded-md">
                <div className="flex justify-between"><span>Fee ({feePercentage}%):</span> <span>{fee.toFixed(2)} USDT</span></div>
                <div className="flex justify-between font-bold text-white"><span>You Will Receive:</span> <span>{netAmount.toFixed(2)} USDT</span></div>
            </div>
            <Button className="w-full py-3 text-lg" onClick={handleSubmitWithdrawal} disabled={isCounterRunning}>
                 <Send/>Request Withdrawal
            </Button>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Withdrawal Information</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsAlertOpen(false)}>Close</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
};

const ManageAddressPanel = () => {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [newWithdrawalAddress, setNewWithdrawalAddress] = useState('');

    if (!context || !context.currentUser) return null;
    const { currentUser, updateWithdrawalAddress, deleteWithdrawalAddress } = context;
    
    const handleUpdateAddress = () => {
        if (newWithdrawalAddress.trim()) {
          updateWithdrawalAddress(newWithdrawalAddress.trim());
          setNewWithdrawalAddress('');
        } else {
          toast({ title: "Error", description: "Please enter a valid address.", variant: "destructive" });
        }
    };
    
    const handleDeleteAddress = () => {
        deleteWithdrawalAddress();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard!' });
    };

    return (
        <>
            <h3 className="text-xl font-semibold mb-4 text-purple-300">Manage Withdrawal Address</h3>
            <p className="text-gray-200 mb-3">Current Address:</p>
            <div className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between mb-4">
                <span className="font-mono text-sm break-all text-green-300">{currentUser.primaryWithdrawalAddress || 'Not set'}</span>
                {currentUser.primaryWithdrawalAddress && (
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(currentUser.primaryWithdrawalAddress || '')}>
                        <Copy className="size-4" />
                    </Button>
                )}
            </div>
            <Input 
            type="text" 
            placeholder="Enter new BEP-20 Address" 
            className="mb-4 text-lg" 
            value={newWithdrawalAddress}
            onChange={(e) => setNewWithdrawalAddress(e.target.value)}
            />
            <div className="flex gap-2">
                <Button className="w-full py-3 text-lg" onClick={handleUpdateAddress}><Edit />Change</Button>
                <Button variant="destructive" className="w-full py-3 text-lg" onClick={handleDeleteAddress}><Trash2 />Delete</Button>
            </div>
        </>
    );
}

const ChangePasswordPanel = () => {
    const context = useContext(AppContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            context?.toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
            return;
        }
        if (newPassword.length < 6) {
            context?.toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
            return;
        }

        const success = await context?.changePassword(currentPassword, newPassword);
        if (success) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    return (
        <>
        <h3 className="text-xl font-semibold mb-4 text-purple-300">Change Password</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-8 w-8" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                        {showCurrentPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </Button>
                </div>
                <div className="relative">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                     <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-8 w-8" onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </Button>
                </div>
                <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type={showNewPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full"><KeyRound /> Update Password</Button>
            </form>
        </>
    );
};

const DeleteAccountPanel = () => {
    const context = useContext(AppContext);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!context) return null;

    const { deactivateCurrentUserAccount } = context;

    const handleDeactivate = async () => {
        await deactivateCurrentUserAccount(password);
    }

    return (
        <>
        <h3 className="text-xl font-semibold mb-4 text-red-400">Delete Account</h3>
        <p className="text-sm text-gray-300 mb-4">
            This action is irreversible. All your data, including balance, referrals, and transaction history, will be permanently deleted.
        </p>
        <div className="relative">
            <Label htmlFor="deactivate-password">Enter Password to Confirm</Label>
            <Input id="deactivate-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </Button>
        </div>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full mt-4" disabled={!password}>
                    <UserXIcon /> Delete My Account
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This is your final confirmation. Deleting your account is permanent and cannot be undone. Are you sure you want to proceed?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivate}>Yes, Delete Everything</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}

const SettingsPanel = () => {
    return (
        <Tabs defaultValue="address" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="address">Manage Address</TabsTrigger>
                <TabsTrigger value="password">Change Password</TabsTrigger>
            </TabsList>
            <TabsContent value="address" className="mt-6">
                <ManageAddressPanel />
            </TabsContent>
            <TabsContent value="password" className="mt-6">
                <ChangePasswordPanel />
            </TabsContent>
        </Tabs>
    )
}


const ReferralNetworkPanel = () => {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [referredUsers, setReferredUsers] = useState<ReferredUserWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (context?.getReferredUsersWithStatus) {
            setIsLoading(true);
            context.getReferredUsersWithStatus()
                .then(setReferredUsers)
                .finally(() => setIsLoading(false));
        }
    }, [context?.getReferredUsersWithStatus]);

    if (!context || !context.currentUser) return null;
    const { currentUser } = context;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard!' });
    };

    return (
        <>
        <h3 className="text-2xl font-semibold mb-4 text-blue-300">Your Referral Network</h3>
        <h4 className="text-lg font-semibold mb-2 text-blue-300 mt-4">Your Referral Code:</h4>
        <div className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between mb-4">
            <span className="font-mono text-base break-all text-yellow-300">{currentUser.userReferralCode}</span>
            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(currentUser.userReferralCode)}>
                <Copy className="size-4" />
            </Button>
        </div>
        <h4 className="text-lg font-semibold mb-2 text-blue-300">Referred Users:</h4>
        <ScrollArea className="h-40">
             {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-purple-400" />
                </div>
            ) : (
                <ul className="list-none space-y-2">
                {referredUsers.length > 0 ? (
                    referredUsers.map((user, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-300">
                        {user.isActivated 
                        ? <UserCheck className="text-green-400 size-4" /> 
                        : <UserX className="text-red-400 size-4" />}
                        {user.email} {user.isActivated ? '(Active)' : '(Inactive)'}
                    </li>
                    ))
                ) : (
                    <li className="text-gray-500">No referrals yet.</li>
                )}
                </ul>
            )}
        </ScrollArea>
        </>
    );
}

const TeamLayersPanel = () => {
    const context = useContext(AppContext);
    const [downline, setDownline] = useState<Record<string, DownlineUser[]>>({});
    const [l4PlusCount, setL4PlusCount] = useState(0);
    const [rechargedTodayCount, setRechargedTodayCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (context?.currentUser) {
            context.getDownline().then(result => {
                setDownline(result.downline);
                setL4PlusCount(result.l4PlusCount);
                setRechargedTodayCount(result.rechargedTodayCount);
                setIsLoading(false);
            });
        }
    }, [context?.currentUser?.id, context]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-purple-400" size={32} />
                <p className="ml-4">Loading Team Layers...</p>
            </div>
        );
    }
    
    const renderUserTable = (users: DownlineUser[]) => (
        <ScrollArea className="h-80 custom-scrollbar pr-2">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Email</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell className="font-mono text-xs">{user.id}</TableCell>
                            <TableCell>{user.email}</TableCell>
                        </TableRow>
                    ))}
                    {users.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={2} className="text-center text-gray-400">No users in this layer yet.</TableCell>
                         </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
    );
    
    return (
      <>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-blue-300">Team Layers</h3>
            <div className="text-right">
                <p className="font-bold text-green-400 text-2xl">{rechargedTodayCount}</p>
                <p className="text-sm text-gray-400">New Activations Today</p>
            </div>
        </div>

        <Tabs defaultValue="l1">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="l1">Layer 1 ({downline.L1?.length || 0})</TabsTrigger>
                <TabsTrigger value="l2">Layer 2 ({downline.L2?.length || 0})</TabsTrigger>
                <TabsTrigger value="l3">Layer 3 ({downline.L3?.length || 0})</TabsTrigger>
                <TabsTrigger value="l4+">L4+ Community ({l4PlusCount})</TabsTrigger>
            </TabsList>
            <TabsContent value="l1" className="mt-4">{renderUserTable(downline.L1 || [])}</TabsContent>
            <TabsContent value="l2" className="mt-4">{renderUserTable(downline.L2 || [])}</TabsContent>
            <TabsContent value="l3" className="mt-4">{renderUserTable(downline.L3 || [])}</TabsContent>
            <TabsContent value="l4+" className="mt-4">
                <div className="text-center p-8">
                    <p className="text-5xl font-bold text-purple-400">{l4PlusCount}</p>
                    <p className="text-lg text-gray-300">Total Active Members in L4+ Community</p>
                </div>
            </TabsContent>
        </Tabs>
      </>
    );
}

const LevelDetailsPanel = ({ levels }: { levels: { [key: number]: Level } }) => (
    <>
        <h3 className="text-2xl font-semibold mb-4 text-blue-300">Staking Level Details</h3>
        <ScrollArea className="w-full" orientation="horizontal">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-white">Level</TableHead>
                        <TableHead className="text-white">Name</TableHead>
                        <TableHead className="text-white">Min Balance</TableHead>
                        <TableHead className="text-white">Referrals</TableHead>
                        <TableHead className="text-white">Withdraw Limit</TableHead>
                        <TableHead className="text-white whitespace-normal">Monthly Withdrawals</TableHead>
                        <TableHead className="text-white">Interest</TableHead>
                        <TableHead className="text-white">Withdrawal Fee</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.entries(levels).filter(([, details]) => details.isEnabled).sort(([a], [b]) => Number(a) - Number(b)).map(([level, details]) => (
                        <TableRow key={level}>
                            <TableCell><LevelBadge level={parseInt(level, 10)} /></TableCell>
                            <TableCell className="font-semibold text-gray-200">{details.name}</TableCell>
                            <TableCell className="font-mono text-green-300">{details.minBalance} USDT</TableCell>
                            <TableCell className="font-mono text-blue-300">{details.directReferrals}</TableCell>
                            <TableCell className="font-mono text-yellow-300">{details.withdrawalLimit} USDT</TableCell>
                            <TableCell className="font-mono text-orange-300">{details.monthlyWithdrawals}</TableCell>
                            <TableCell className="font-mono text-purple-300">{(details.interest * 100).toFixed(2)}%</TableCell>
                            <TableCell className="font-mono text-red-300">{details.withdrawalFee}%</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    </>
);

const NoticesPanel = () => {
    const context = useContext(AppContext);
    
    if (!context || !context.notices) return null;

    const activeNotices = context.notices.filter(n => n.isActive);

    if (activeNotices.length === 0) {
        return (
            <>
                <h3 className="text-2xl font-semibold mb-4 text-blue-300">Notices & Events</h3>
                <p className="text-gray-400">No active notices right now.</p>
            </>
        );
    }

    return (
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300"><Megaphone className='inline-block mr-2' />Notices & Events</h3>
            <ScrollArea className="h-96 custom-scrollbar pr-4">
                <div className="space-y-4">
                    {activeNotices.map((notice: Notice) => (
                        <div key={notice.id} className="bg-black/20 p-3 rounded-lg">
                            <h4 className="font-bold text-yellow-300">{notice.title}</h4>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{notice.content}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </>
    );
};

const BoosterStorePanel = () => {
    const context = useContext(AppContext);
    const [isCounterRunning, setIsCounterRunning] = useState(true);

    useEffect(() => {
        if (context?.currentUser?.firstDepositTime) {
            const timer = setInterval(() => {
                const now = Date.now();
                const lastCredit = context.currentUser.lastInterestCreditTime || context.currentUser.firstDepositTime;
                const nextCredit = lastCredit + 24 * 60 * 60 * 1000;
                setIsCounterRunning(now < nextCredit);
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setIsCounterRunning(false); // If no deposit, counter isn't running
        }
    }, [context?.currentUser]);
    
    if (!context || !context.boosterPacks || !context.currentUser) return null;
    const { boosterPacks, purchaseBooster, currentUser } = context;

    const activePacks = boosterPacks.filter(p => 
        p.isActive && 
        (!p.applicableLevels || p.applicableLevels.length === 0 || p.applicableLevels.includes(currentUser.level))
    );
    
    const earnedBalance = currentUser.balance - (currentUser.totalDeposits || 0);

    return (
        <>
            <h3 className="text-2xl font-semibold mb-2 text-blue-300">Booster Store</h3>
            <p className="text-sm text-gray-400 mb-4">Your available earned balance for purchases: <span className="font-bold text-green-400">{Math.max(0, earnedBalance).toFixed(2)} USDT</span></p>

            {isCounterRunning && (
                 <Alert variant="destructive" className='mb-4'>
                    <Ban className="h-4 w-4" />
                    <AlertTitle>Store Locked</AlertTitle>
                    <AlertDescription>
                       You can only purchase boosters when the daily interest timer is stopped. Please claim your interest to proceed.
                    </AlertDescription>
                </Alert>
            )}

            <ScrollArea className="h-96 custom-scrollbar">
                <div className="space-y-4">
                    {activePacks.length > 0 ? activePacks.map(pack => {
                        const canAfford = earnedBalance >= pack.cost;
                        return (
                        <Card key={pack.id} className="card-gradient-yellow-pink p-4 flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg text-yellow-200">{pack.name}</CardTitle>
                                <CardDescription className="text-gray-300">{pack.description}</CardDescription>
                            </div>
                            <Button 
                                onClick={() => purchaseBooster(pack.id)}
                                disabled={isCounterRunning || !canAfford}
                            >
                                <Rocket className="mr-2" /> Buy for {pack.cost} USDT
                            </Button>
                        </Card>
                    )}) : (
                        <p className="text-gray-400 text-center">No booster packs are available for your level right now.</p>
                    )}
                </div>
            </ScrollArea>
        </>
    );
};


const StakingPoolsPanel = () => {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [contributionAmounts, setContributionAmounts] = useState<Record<string, string>>({});

    if (!context) return null;
    const { stakingPools, joinStakingPool, currentUser } = context;
    const activePools = stakingPools.filter(p => p.isActive && p.status === 'active');
    
    const handleJoin = (poolId: string) => {
        const amount = parseFloat(contributionAmounts[poolId] || '0');
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Error", description: "Please enter a valid amount.", variant: "destructive" });
            return;
        }
        joinStakingPool(poolId, amount);
    };

    return (
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Global Staking Pools</h3>
            <ScrollArea className="h-96 custom-scrollbar">
                <div className="space-y-4">
                    {activePools.length > 0 ? activePools.map(pool => {
                        const userHasJoined = pool.participants.some(p => p.userId === currentUser?.id);
                        return (
                        <Card key={pool.id} className="card-gradient-indigo-fuchsia p-4">
                            <CardTitle className="text-lg text-purple-300">{pool.name}</CardTitle>
                            <CardDescription className="text-gray-300 mb-2">{pool.description}</CardDescription>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <div><p className="text-gray-400">Total Staked</p><p className="font-bold text-green-400">{pool.totalStaked.toFixed(2)} USDT</p></div>
                                <div><p className="text-gray-400">Ends In</p><p className="font-bold text-red-400">{formatDistanceToNow(new Date(pool.endsAt), { addSuffix: true })}</p></div>
                                <div><p className="text-gray-400">Contribution</p><p className="font-bold text-yellow-400">{pool.minContribution} - {pool.maxContribution} USDT</p></div>
                                <div><p className="text-gray-400">Participants</p><p className="font-bold text-blue-400">{pool.participants.length}</p></div>
                            </div>

                            {userHasJoined ? (
                                <p className='text-center text-green-400 font-bold'>You have joined this pool!</p>
                            ) : (
                                <div className="flex gap-2">
                                    <Input 
                                        type="number" 
                                        placeholder="Amount" 
                                        value={contributionAmounts[pool.id] || ''}
                                        onChange={e => setContributionAmounts(prev => ({...prev, [pool.id]: e.target.value}))}
                                    />
                                    <Button onClick={() => handleJoin(pool.id)}><Users className="mr-2"/> Join Pool</Button>
                                </div>
                            )}
                        </Card>
                    )}) : (
                        <p className="text-gray-400 text-center">No active staking pools right now.</p>
                    )}
                </div>
            </ScrollArea>
        </>
    );
};

const StakingVaultsPanel = () => {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [investmentAmounts, setInvestmentAmounts] = useState<Record<string, string>>({});
    
    if (!context) return null;
    const { stakingVaults, investInVault, currentUser } = context;

    const activeVaults = stakingVaults.filter(v => v.isActive);
    const userInvestments = currentUser?.vaultInvestments || [];
    
    const handleInvest = (vaultId: string) => {
        const amount = parseFloat(investmentAmounts[vaultId] || '0');
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Error", description: "Please enter a valid investment amount.", variant: "destructive"});
            return;
        }
        investInVault(vaultId, amount);
    };

    return (
      <>
        <h3 className="text-2xl font-semibold mb-4 text-blue-300">Fixed-Term Staking Vaults</h3>
        <p className="text-gray-400 mb-4">Lock your USDT for a fixed term to earn higher, guaranteed interest rates.</p>

        <Tabs defaultValue="available" className="w-full">
            <TabsList>
                <TabsTrigger value="available">Available Vaults</TabsTrigger>
                <TabsTrigger value="my_investments">My Investments ({userInvestments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="available" className="mt-4">
                <ScrollArea className="h-80 custom-scrollbar pr-2">
                    <div className="space-y-4">
                    {activeVaults.length > 0 ? activeVaults.map(vault => (
                        <Card key={vault.id} className="card-gradient-blue-purple p-4">
                            <CardTitle className="text-lg text-purple-300">{vault.name}</CardTitle>
                            <CardDescription className="text-gray-300 mb-2">{vault.termDays}-Day Term</CardDescription>

                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <div><p className="text-gray-400">Annual Interest</p><p className="font-bold text-green-400">{(vault.interestRate * 100).toFixed(2)}%</p></div>
                                <div><p className="text-gray-400">Investment Range</p><p className="font-bold text-yellow-400">{vault.minInvestment} - {vault.maxInvestment} USDT</p></div>
                            </div>
                            
                            <div className="flex gap-2">
                                <Input 
                                    type="number"
                                    placeholder={`Amount (Min ${vault.minInvestment})`}
                                    value={investmentAmounts[vault.id] || ''}
                                    onChange={e => setInvestmentAmounts(prev => ({...prev, [vault.id]: e.target.value}))}
                                />
                                <Button onClick={() => handleInvest(vault.id)}><Lock className="mr-2" />Invest</Button>
                            </div>
                        </Card>
                    )) : (
                         <p className="text-gray-400 text-center py-8">No staking vaults are available at the moment.</p>
                    )}
                    </div>
                </ScrollArea>
            </TabsContent>
            <TabsContent value="my_investments" className="mt-4">
                <ScrollArea className="h-80 custom-scrollbar pr-2">
                    <div className="space-y-4">
                        {userInvestments.length > 0 ? userInvestments.map(inv => {
                            const progress = (Date.now() - inv.startedAt) / (inv.maturesAt - inv.startedAt) * 100;
                            return (
                                <Card key={inv.investmentId} className="card-gradient-green-cyan p-4">
                                    <CardTitle className="text-lg text-cyan-300">{inv.vaultName}</CardTitle>
                                    <div className="flex justify-between items-end text-sm">
                                        <p className="text-gray-300">Invested: <span className="font-bold text-green-400">{inv.amount.toFixed(2)} USDT</span></p>
                                        <p className="text-gray-400">Matures in {formatDistanceToNow(new Date(inv.maturesAt), { addSuffix: true })}</p>
                                    </div>
                                    <Progress value={Math.min(100, progress)} className="mt-2" />
                                </Card>
                            )
                        }) : (
                             <p className="text-gray-400 text-center py-8">You have no active investments in staking vaults.</p>
                        )}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
      </>  
    );
};

const TeamPanel = () => {
    const context = useContext(AppContext);
    if (!context || !context.currentUser || !context.teamSizeRewards) return null;
    const { currentUser, teamSizeRewards, claimTeamReward, teamBusinessRewards, salaryRules, claimSalary } = context;

    const availableSizeRewards = teamSizeRewards.filter(r => r.isEnabled);
    const availableBusinessRewards = teamBusinessRewards.filter(r => r.isEnabled);
    const applicableSalaryRule = (salaryRules || []).find(r => r.isEnabled && r.level === currentUser.level);

    // Salary eligibility calculation
    const hasPendingSalaryClaim = currentUser.transactions.some(tx => tx.type === 'salary_claim' && tx.status === 'pending');
    let isEligibleForSalary = false;
    let referralsProgress = 0;
    let businessProgress = 0;
    let businessTarget = 0;
    let salaryCooldownMessage: string | null = null;


    if (applicableSalaryRule) {
        const referralReq = applicableSalaryRule.directReferrals;
        const businessReq = applicableSalaryRule.teamBusiness;
        const growthReq = applicableSalaryRule.requiredGrowthPercentage || 0;
        
        const lastClaim = currentUser.lastSalaryClaim;

        referralsProgress = Math.min(100, ((currentUser.directReferrals || 0) / referralReq) * 100);

        if (lastClaim) {
            // Check for cooldown period
            const cooldownMillis = (applicableSalaryRule.claimCooldownDays || 30) * 24 * 60 * 60 * 1000;
            const timeSinceLastClaim = Date.now() - lastClaim.timestamp;
            const isCooldownActive = timeSinceLastClaim < cooldownMillis;

            if (isCooldownActive) {
                const remainingTime = cooldownMillis - timeSinceLastClaim;
                const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
                salaryCooldownMessage = `You can claim your next salary in ${remainingDays} day(s).`;
            }

            // Check for growth requirement
            const requiredBusiness = lastClaim.teamBusinessAtClaim * (1 + growthReq / 100);
            businessTarget = requiredBusiness;
            businessProgress = Math.min(100, ((currentUser.teamBusiness || 0) / requiredBusiness) * 100);
            isEligibleForSalary = !isCooldownActive && (currentUser.directReferrals || 0) >= referralReq && (currentUser.teamBusiness || 0) >= requiredBusiness;
        } else { // First time claim
            businessTarget = businessReq;
            businessProgress = Math.min(100, ((currentUser.teamBusiness || 0) / businessReq) * 100);
            isEligibleForSalary = (currentUser.directReferrals || 0) >= referralReq && (currentUser.teamBusiness || 0) >= businessReq;
        }
    }
    
    return (
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Your Team</h3>
            <Card className="card-gradient-yellow-pink p-4 mb-6">
                <h4 className="text-lg font-bold text-yellow-200">Team Overview</h4>
                <div className="flex justify-around items-center mt-2 text-center">
                    <div>
                        <p className="text-3xl font-bold">{(currentUser.teamSize || 0)}</p>
                        <p className="text-sm text-gray-300">Total Active Members</p>
                    </div>
                     <div>
                        <p className="text-3xl font-bold">{(currentUser.teamBusiness || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-300">Team Business (USDT)</p>
                    </div>
                </div>
            </Card>

            <Tabs defaultValue="size_rewards" className="w-full">
                <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value="size_rewards">Size Rewards</TabsTrigger>
                    <TabsTrigger value="business_rewards">Business Rewards</TabsTrigger>
                    <TabsTrigger value="salary">Salary</TabsTrigger>
                </TabsList>
                <TabsContent value="size_rewards" className="mt-4">
                    <h4 className="text-xl font-semibold mb-3 text-purple-300">Team Size Rewards</h4>
                    <ScrollArea className="h-72 custom-scrollbar">
                        <div className="space-y-3">
                            {availableSizeRewards.map(reward => {
                                const isClaimed = currentUser.claimedTeamSizeRewards?.includes(reward.id);
                                const canClaim = (currentUser.teamSize || 0) >= reward.teamSize && !isClaimed;
                                const hasPending = currentUser.transactions.some(tx => tx.type === 'team_size_reward' && tx.status === 'pending' && tx.note === reward.id);
                                const progress = Math.min(100, ((currentUser.teamSize || 0) / reward.teamSize) * 100);

                                return (
                                    <Card key={reward.id} className="p-4 bg-black/20">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-lg text-amber-400">{reward.rewardAmount} USDT Bonus</p>
                                                <p className="text-sm text-gray-400">Reach {reward.teamSize} active members</p>
                                            </div>
                                            <Button
                                                onClick={() => claimTeamReward('team_size_reward', reward.id)}
                                                disabled={!canClaim || hasPending}
                                            >
                                                {hasPending ? <><Info className='mr-2' />Pending</> : isClaimed ? <><CheckCircle className='mr-2' />Claimed</> : <><Trophy className='mr-2' />Claim</>}
                                            </Button>
                                        </div>
                                        {!isClaimed && <Progress value={progress} className="mt-2" />}
                                    </Card>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </TabsContent>
                 <TabsContent value="business_rewards" className="mt-4">
                     <h4 className="text-xl font-semibold mb-3 text-purple-300">Team Business Rewards</h4>
                    <ScrollArea className="h-72 custom-scrollbar">
                        <div className="space-y-3">
                            {availableBusinessRewards.map(reward => {
                                const isClaimed = currentUser.claimedTeamBusinessRewards?.includes(reward.id);
                                const canClaim = (currentUser.teamBusiness || 0) >= reward.businessAmount && !isClaimed;
                                const hasPending = currentUser.transactions.some(tx => tx.type === 'team_business_reward' && tx.status === 'pending' && tx.note === reward.id);
                                const progress = Math.min(100, ((currentUser.teamBusiness || 0) / reward.businessAmount) * 100);

                                return (
                                    <Card key={reward.id} className="p-4 bg-black/20">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-lg text-cyan-400">{reward.rewardAmount} USDT Bonus</p>
                                                <p className="text-sm text-gray-400">Reach {reward.businessAmount} USDT in team business</p>
                                            </div>
                                            <Button
                                                onClick={() => claimTeamReward('team_business_reward', reward.id)}
                                                disabled={!canClaim || hasPending}
                                                variant="secondary"
                                            >
                                                {hasPending ? <><Info className='mr-2' />Pending</> : isClaimed ? <><CheckCircle className='mr-2' />Claimed</> : <><BadgePercent className='mr-2' />Claim</>}
                                            </Button>
                                        </div>
                                        {!isClaimed && <Progress value={progress} className="mt-2" />}
                                    </Card>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </TabsContent>
                 <TabsContent value="salary" className="mt-4">
                    <h4 className="text-xl font-semibold mb-3 text-purple-300">Monthly Salary</h4>
                     {applicableSalaryRule ? (
                        <Card className="p-4 bg-black/20">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-blue-400">{applicableSalaryRule.salaryAmount} USDT Salary</p>
                                    <p className="text-sm text-gray-400">Reward for Level {applicableSalaryRule.level} team leaders</p>
                                </div>
                                 <Button
                                    onClick={() => claimSalary()}
                                    disabled={!isEligibleForSalary || hasPendingSalaryClaim}
                                >
                                    {hasPendingSalaryClaim ? <><Info className='mr-2' />Pending</> : <><Wallet className='mr-2' />Claim Salary</>}
                                </Button>
                            </div>
                             {salaryCooldownMessage && (
                                <Alert variant="destructive" className="mt-4">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Claim Cooldown</AlertTitle>
                                    <AlertDescription>{salaryCooldownMessage}</AlertDescription>
                                </Alert>
                            )}
                            <div className="mt-4 space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm">
                                        <span>Direct Referrals</span>
                                        <span>{(currentUser.directReferrals || 0)} / {applicableSalaryRule.directReferrals}</span>
                                    </div>
                                    <Progress value={referralsProgress} className="mt-1" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm">
                                        <span>Team Business</span>
                                        <span>{(currentUser.teamBusiness || 0).toFixed(2)} / {businessTarget.toFixed(2)} USDT</span>
                                    </div>
                                    <Progress value={businessProgress} className="mt-1" />
                                     {currentUser.lastSalaryClaim && <p className="text-xs text-gray-500 mt-1">Next target based on {applicableSalaryRule.requiredGrowthPercentage}% growth.</p>}
                                </div>
                            </div>
                        </Card>
                     ) : (
                        <p className="text-center text-gray-400 py-8">No salary rule available for your current level.</p>
                     )}
                </TabsContent>
            </Tabs>
        </>
    );
};

const ChatWithAdminPanel = () => {
    const context = useContext(AppContext);
    const [newMessage, setNewMessage] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [context?.currentUser?.messages]);

    if (!context || !context.currentUser) return null;
    const { currentUser, sendMessageToAdmin } = context;

    const handleSend = () => {
        if (newMessage.trim()) {
            sendMessageToAdmin(newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Chat With Admin</h3>
            <div ref={scrollAreaRef} className="h-96 overflow-y-auto custom-scrollbar bg-black/20 rounded-lg p-4 space-y-4 mb-4">
                 {(currentUser.messages || []).map((msg: Message) => (
                    <div key={msg.id} className={cn("flex flex-col", msg.sender === 'user' ? 'items-end' : 'items-start')}>
                        <div className={cn("rounded-lg px-4 py-2 max-w-sm", msg.sender === 'user' ? 'bg-blue-800 text-white' : 'bg-gray-700 text-gray-200')}>
                            <p>{msg.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{format(msg.timestamp, 'Pp')}</p>
                    </div>
                ))}
                {(currentUser.messages || []).length === 0 && (
                    <p className="text-center text-gray-400">No messages yet. Send a message to the admin below.</p>
                )}
            </div>
            <div className="flex gap-2">
                <Textarea
                    placeholder="Type your message to the admin..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                />
                <Button onClick={handleSend}><Send/></Button>
            </div>
        </>
    );
}

const DailyEngagementPanel = () => {
    const context = useContext(AppContext);
    if (!context || !context.currentUser) return null;
    const { dailyEngagement, currentUser } = context;

    return (
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Daily Engagement</h3>
            <Tabs defaultValue="quests">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quests">Daily Quests</TabsTrigger>
                    <TabsTrigger value="streaks">Login Streak</TabsTrigger>
                </TabsList>
                <TabsContent value="quests" className="mt-4">
                    <div className="space-y-3">
                        {dailyEngagement.quests.filter(q => q.isActive).map(quest => {
                            const userQuest = currentUser.dailyQuests?.find(uq => uq.questId === quest.id);
                            const progress = userQuest ? (userQuest.progress / quest.targetValue) * 100 : 0;
                            const isCompleted = userQuest?.isCompleted || false;
                            return (
                                <Card key={quest.id} className="p-4 bg-black/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg text-amber-400">{quest.title}</p>
                                            <p className="text-sm text-gray-400">{quest.description}</p>
                                        </div>
                                        <Badge variant={isCompleted ? "default" : "secondary"}>
                                            {isCompleted ? <CheckCircle className="mr-1" /> : <Star className="mr-1" />}
                                            {quest.rewardAmount} USDT
                                        </Badge>
                                    </div>
                                    {!isCompleted && (
                                        <div className="mt-2">
                                            <Progress value={progress} />
                                            <p className="text-xs text-right text-gray-400 mt-1">{userQuest?.progress || 0} / {quest.targetValue}</p>
                                        </div>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>
                <TabsContent value="streaks" className="mt-4">
                    <p className="text-center text-gray-300 mb-2">Current Login Streak:</p>
                    <p className="text-center font-bold text-5xl text-purple-400 mb-4">{currentUser.loginStreak || 0} Days</p>
                    <div className="space-y-2">
                        {dailyEngagement.loginStreakRewards.map(reward => (
                            <div key={reward.day} className={cn(
                                "flex justify-between items-center p-2 rounded-md",
                                (currentUser.loginStreak || 0) >= reward.day ? "bg-green-800/50" : "bg-black/20"
                            )}>
                                <p>Day {reward.day} Reward</p>
                                <p>{reward.rewardAmount} USDT</p>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
};

const LeaderboardsPanel = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { leaderboards } = context;
    const activeLeaderboards = leaderboards.filter(lb => lb.isEnabled);

    return (
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Leaderboards</h3>
            <Tabs defaultValue={activeLeaderboards[0]?.category || ''}>
                <TabsList>
                    {activeLeaderboards.map(lb => (
                        <TabsTrigger key={lb.category} value={lb.category}>{lb.title}</TabsTrigger>
                    ))}
                </TabsList>
                {activeLeaderboards.map(lb => (
                     <TabsContent key={lb.category} value={lb.category} className="mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lb.data.map((entry, index) => (
                                    <TableRow key={entry.userId}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{entry.email}</TableCell>
                                        <TableCell className="text-right">{entry.value.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </TabsContent>
                ))}
            </Tabs>
        </>
    );
};

const CustomPanel = ({ panel }: { panel: DashboardPanel }) => (
    <>
        <h3 className="text-2xl font-semibold mb-4 text-blue-300">{panel.title}</h3>
        {/* A simple markdown renderer could be added here */}
        <p>{panel.content}</p>
    </>
);

const ProfilePanel = ({ currentUser }: { currentUser: User }) => {
    const userName = currentUser.email.split('@')[0];
    return (
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Your Profile</h3>
            <div className="flex flex-col items-center text-center space-y-4">
                <UserIcon className="size-24 text-purple-400" />
                <h4 className="text-2xl font-bold capitalize text-white">{userName}</h4>
                <p className="text-lg text-gray-400">{currentUser.email}</p>
                <div className="flex items-center gap-4">
                    <p className="text-lg text-gray-200">Current Level:</p>
                    <LevelBadge level={currentUser.level} className="size-12 text-xl" />
                </div>
            </div>
        </>
    )
}


type ModalView = 
    | 'recharge' 
    | 'withdraw' 
    | 'history' 
    | 'referrals' 
    | 'levels' 
    | 'settings' 
    | 'notices'
    | 'boosters'
    | 'pools'
    | 'vaults'
    | 'team'
    | 'team_layers'
    | 'daily_engagement'
    | 'leaderboards'
    | 'profile'
    | 'custom'
    | 'delete_account'
    | 'chat_with_admin';


// Main Dashboard Component
const UserDashboard = () => {
  const context = useContext(AppContext);
  const [modalView, setModalView] = useState<ModalView | null>(null);
  const [activeCustomPanel, setActiveCustomPanel] = useState<DashboardPanel | null>(null);
  const [showBoosterPopup, setShowBoosterPopup] = useState(false);
  const [prioritizedMessage, setPrioritizedMessage] = useState<PrioritizeMessageOutput | null>(null);
  const [todaysCommission, setTodaysCommission] = useState(0);
  const [isCounterRunning, setIsCounterRunning] = useState(false);
  const [showSignInPopup, setShowSignInPopup] = useState(false);


  useEffect(() => {
    if (context?.currentUser) {
        // Show booster popup only once per session
        const hasSeenBoosterPopup = sessionStorage.getItem('hasSeenBoosterPopup');
        if (!hasSeenBoosterPopup && context.boosterPacks.some(p => p.isActive)) {
            setShowBoosterPopup(true);
            sessionStorage.setItem('hasSeenBoosterPopup', 'true');
        }

        // Show sign-in popup only once per session
        const hasSeenSignInPopup = sessionStorage.getItem('hasSeenSignInPopup');
        if (!hasSeenSignInPopup && context.signInPopupSettings.isEnabled) {
            setShowSignInPopup(true);
            sessionStorage.setItem('hasSeenSignInPopup', 'true');
        }

        // Fetch prioritized message
        context.getPrioritizedMessage().then(setPrioritizedMessage);
        
        // Calculate today's commission
        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
        const commission = context.currentUser.transactions
            .filter(tx => tx.type === 'team_commission' && tx.timestamp >= twentyFourHoursAgo)
            .reduce((sum, tx) => sum + tx.amount, 0);
        setTodaysCommission(commission);
        
        // Check if interest counter is running
        if (context.currentUser.level > 0 && context.currentUser.firstDepositTime) {
            const lastCredit = context.currentUser.lastInterestCreditTime || context.currentUser.firstDepositTime;
            const nextCredit = lastCredit + (24 * 60 * 60 * 1000);
            const timerId = setInterval(() => {
                setIsCounterRunning(Date.now() < nextCredit);
            }, 1000);
            setIsCounterRunning(Date.now() < nextCredit); // Initial check
            return () => clearInterval(timerId);
        } else {
            setIsCounterRunning(false);
        }

    }
  }, [context?.currentUser?.id, context?.boosterPacks, context?.signInPopupSettings, context]);

  if (!context || !context.currentUser) {
    return <div>Loading user data...</div>;
  }
  const { currentUser, levels, markAnnouncementAsRead, dashboardPanels, signInPopupSettings } = context;
  
  const hasPendingRequests = currentUser.transactions.some(tx => tx.status === 'pending');
  const currentLevelDetails = levels[currentUser.level];

  const handleMessageDismiss = () => {
    if (prioritizedMessage?.announcementId) {
        markAnnouncementAsRead(prioritizedMessage.announcementId);
    }
    setPrioritizedMessage(null); // Dismiss from view
  }
  
  const getPanelComponent = (key: DashboardPanelComponentKey) => {
    switch(key) {
        case 'UserOverview': return <UserOverviewPanel currentUser={currentUser} levels={levels} todaysCommission={todaysCommission} />;
        case 'StakingLevel': return <StakingLevelPanel currentUser={currentUser} currentLevelDetails={currentLevelDetails} />;
        case 'InterestCredit': return <InterestCountdownPanel />;
        default: return null;
    }
  }

  const handleOpenModal = (view: ModalView, panel?: DashboardPanel) => {
    if (view === 'custom' && panel) {
        setActiveCustomPanel(panel);
    } else {
        setActiveCustomPanel(null);
    }
    setModalView(view);
  };


  const renderModalContent = () => {
    if (!modalView) return null;

    switch(modalView) {
        case 'recharge': return <RechargePanel />;
        case 'withdraw': return <WithdrawPanel isCounterRunning={isCounterRunning} />;
        case 'history': return <TransactionHistoryPanel />;
        case 'referrals': return <ReferralNetworkPanel />;
        case 'team': return <TeamPanel />;
        case 'team_layers': return <TeamLayersPanel />;
        case 'levels': return <LevelDetailsPanel levels={levels} />;
        case 'settings': return <SettingsPanel />;
        case 'notices': return <NoticesPanel />;
        case 'boosters': return <BoosterStorePanel />;
        case 'pools': return <StakingPoolsPanel />;
        case 'vaults': return <StakingVaultsPanel />;
        case 'chat_with_admin': return <ChatWithAdminPanel />;
        case 'daily_engagement': return <DailyEngagementPanel />;
        case 'leaderboards': return <LeaderboardsPanel />;
        case 'profile': return <ProfilePanel currentUser={currentUser} />;
        case 'delete_account': return <DeleteAccountPanel />;
        case 'custom':
            if (activeCustomPanel) return <CustomPanel panel={activeCustomPanel} />;
            return null;
        default: 
            return null;
    }
  };

  const getModalTitle = (view: ModalView): string => {
    if (view === 'custom' && activeCustomPanel) {
        return activeCustomPanel.title;
    }
    // A simple mapping for titles
    const titles: Record<ModalView, string> = {
        recharge: "Recharge USDT",
        withdraw: "Withdraw USDT",
        history: "Transaction History",
        referrals: "Your Referral Network",
        levels: "Staking Level Details",
        settings: "Settings",
        notices: "Notices & Events",
        boosters: "Booster Store",
        pools: "Staking Pools",
        vaults: "Staking Vaults",
        team: "Your Team",
        team_layers: "Team Layers",
        daily_engagement: "Daily Engagement",
        leaderboards: "Leaderboards",
        profile: "Your Profile",
        custom: "Information",
        delete_account: "Delete Account",
        chat_with_admin: "Chat With Admin"
    };
    return titles[view] || 'Stake Plus';
  }

  const mainPanelKeys: DashboardPanelComponentKey[] = ['UserOverview', 'StakingLevel', 'InterestCredit'];
  const visiblePanels = dashboardPanels.filter(p => p.isVisible);

  // Panels for the main grid, ensuring only the configured main panels are there
  const mainGridPanels = visiblePanels.filter(p => mainPanelKeys.includes(p.componentKey));
  
  // Panels for the floating menu (all visible panels that are NOT in the main grid)
  const floatingMenuItems = visiblePanels.filter(p => !mainPanelKeys.includes(p.componentKey));

  const dashboardItems = floatingMenuItems.map(panel => {
    const icons: Record<string, React.ElementType> = {
        Recharge: Briefcase,
        Withdraw: Send,
        TransactionHistory: BarChart,
        ChatWithAdmin: MessageSquare,
        DailyEngagement: Star,
        ReferralNetwork: UserCheck,
        Team: Users,
        TeamLayers: Layers,
        Leaderboards: Trophy,
        LevelDetails: Layers,
        StakingVaults: PiggyBank,
        BoosterStore: Gift,
        StakingPools: Star,
        Notices: Megaphone,
        Settings: Settings,
        DeleteAccount: UserXIcon,
        Profile: UserIcon,
        Custom: Info,
    };
    let viewKey = panel.componentKey.toLowerCase() as ModalView;
    if(panel.componentKey === 'TransactionHistory') viewKey = 'history';
    if(panel.componentKey === 'ReferralNetwork') viewKey = 'referrals';
    if(panel.componentKey === 'LevelDetails') viewKey = 'levels';
    if(panel.componentKey === 'BoosterStore') viewKey = 'boosters';
    if(panel.componentKey === 'StakingPools') viewKey = 'pools';
    if(panel.componentKey === 'StakingVaults') viewKey = 'vaults';
    if(panel.componentKey === 'TeamLayers') viewKey = 'team_layers';
    if(panel.componentKey === 'DailyEngagement') viewKey = 'daily_engagement';
    if(panel.componentKey === 'DeleteAccount') viewKey = 'delete_account';
    if(panel.componentKey === 'ChatWithAdmin') viewKey = 'chat_with_admin';
    
    return {
        panel,
        view: viewKey,
        label: panel.title,
        icon: icons[panel.componentKey] || Info,
    };
});

  return (
    <>
      <GlassPanel className="w-full max-w-7xl p-8 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
        {prioritizedMessage?.message && (
            <Alert className="mb-6 bg-blue-900/50 border-blue-700 text-blue-200">
                {prioritizedMessage.source === 'admin' ? <MessageSquare className="h-4 w-4 !text-blue-200" /> : <Star className="h-4 w-4 !text-blue-200" />}
                <AlertTitle>For You</AlertTitle>
                <AlertDescription>
                    {prioritizedMessage.message}
                </AlertDescription>
                <button onClick={handleMessageDismiss} className="absolute top-2 right-2 p-1">
                    <X className="h-4 w-4" />
                </button>
            </Alert>
        )}
        {hasPendingRequests && (
            <Alert className="mb-6 bg-yellow-900/50 border-yellow-700 text-yellow-200">
                <Info className="h-4 w-4 !text-yellow-200" />
                <AlertTitle>Request Pending</AlertTitle>
                <AlertDescription>
                Please wait for admin approval to process your request.
                </AlertDescription>
            </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {mainGridPanels.map(panel => (
                <div key={panel.id} className={cn(panel.componentKey === 'InterestCredit' && 'md:col-span-2')}>
                    {getPanelComponent(panel.componentKey)}
                </div>
            ))}
        </div>
      </GlassPanel>

      <FloatingMenu items={dashboardItems} onSelect={handleOpenModal} />

      <Dialog open={!!modalView} onOpenChange={(isOpen) => !isOpen && setModalView(null)}>
        <DialogContent className='max-w-2xl'>
            {modalView && (
              <>
                <DialogHeader>
                    <DialogTitle className='text-2xl text-purple-400'>{getModalTitle(modalView)}</DialogTitle>
                </DialogHeader>
                <div className='py-4'>
                    {renderModalContent()}
                </div>
              </>
            )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSignInPopup} onOpenChange={setShowSignInPopup}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    <Megaphone className="inline-block mr-2" /> Important Notice
                </AlertDialogTitle>
                <AlertDialogDescription className="whitespace-pre-wrap py-4">
                    {signInPopupSettings.content}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowSignInPopup(false)}>
                    I Understand
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBoosterPopup} onOpenChange={setShowBoosterPopup}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2"><Rocket /> New Boosters Available!</AlertDialogTitle>
                  <AlertDialogDescription>
                      Check out the Booster Store to enhance your earnings and level up faster. New packs are available now!
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Maybe Later</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                      setModalView('boosters');
                      setShowBoosterPopup(false);
                  }}>
                      Go to Store
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
};


const FloatingMenu = ({ items, onSelect }: { items: { view: ModalView, label: string, icon: React.ElementType, panel: DashboardPanel }[], onSelect: (view: ModalView, panel?: DashboardPanel) => void }) => {
    const context = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);

    if (!context) return null;
    const { layoutSettings } = context;
    const maxHeight = window.innerWidth < 768 ? layoutSettings.fabMobileMaxHeight : layoutSettings.fabDesktopMaxHeight;

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mb-4 flex flex-col items-end"
                    >
                        <ScrollArea className="pr-4 -mr-4 custom-scrollbar" style={{ maxHeight }}>
                            <div className="flex flex-col items-end gap-3">
                                {items.map((item) => {
                                    const ItemIcon = item.icon;
                                    return (
                                     <div key={item.panel.id} className="flex items-center gap-3">
                                        <span className="bg-card/50 backdrop-blur-md text-white px-3 py-1 rounded-md shadow-lg text-sm">
                                            {item.label}
                                        </span>
                                        <Button
                                            size="icon"
                                            className="rounded-full size-12 bg-secondary/80 hover:bg-secondary"
                                            onClick={() => {
                                                const view = item.panel.componentKey === 'Custom' ? 'custom' : item.view;
                                                onSelect(view, item.panel);
                                                setIsOpen(false);
                                            }}
                                        >
                                            <ItemIcon className="size-6" />
                                        </Button>
                                    </div>
                                )})}
                            </div>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button 
                size="icon" 
                className="rounded-full size-20 shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-110 active:scale-105 transition-transform duration-200"
                onClick={() => setIsOpen(!isOpen)}
            >
                <AnimatePresence initial={false}>
                    <motion.div
                        key={isOpen ? 'close' : 'open'}
                        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        {isOpen ? <X className="size-10" /> : <ChevronRight className="size-10" />}
                    </motion.div>
                </AnimatePresence>
            </Button>
        </div>
    );
}

export default UserDashboard;

    


    