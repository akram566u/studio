
"use client";
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '@/components/providers/AppProvider';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, UserCheck, Trash2, Edit, Send, Briefcase, TrendingUp, CheckCircle, Info, UserX, KeyRound, Ban, Megaphone, Check, ChevronRight, X, Star, BarChart, Settings, Gift, Layers } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { BoosterPack, DashboardPanel, Level, Notice, StakingPool, Transaction } from '@/lib/types';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';


// Individual Panel Components (for use in Dialogs)
const UserOverviewPanel = ({ currentUser }: { currentUser: any }) => (
    <Card className="card-gradient-blue-purple p-6">
        <h3 className="text-xl font-semibold mb-3 text-blue-300">Your Staking Overview</h3>
        <p className="text-gray-200 text-base mb-2">User ID: <span className="font-mono text-sm break-all text-blue-200">{currentUser.id}</span></p>
        <div className="flex items-center justify-between mb-4">
        <p className="text-xl text-gray-200">Total USDT Balance:</p>
        <p className="text-4xl font-bold text-green-400">{currentUser.balance.toFixed(2)}</p>
        </div>
    </Card>
);

const StakingLevelPanel = ({ currentUser, currentLevelDetails }: { currentUser: any, currentLevelDetails: any }) => (
    <Card className="card-gradient-green-cyan p-6">
        <h3 className="text-xl font-semibold mb-3 text-blue-300">Your Staking Level</h3>
        <div className="flex items-center justify-between mb-2">
            <p className="text-xl text-gray-200">{currentLevelDetails?.name || `Level ${currentUser.level}`}</p>
            <LevelBadge level={currentUser.level} />
        </div>
        <div className="flex items-center justify-between mb-2">
            <p className="text-xl text-gray-200">Active Referrals:</p>
            <p className="text-2xl font-bold text-yellow-400">{currentUser.directReferrals}</p>
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

    useEffect(() => {
        if (context?.currentUser && context.currentUser.level > 0 && context.currentUser.firstDepositTime) {
          const timer = setInterval(() => {
            const now = new Date().getTime();
            const lastCreditTime = context.currentUser.lastInterestCreditTime || context.currentUser.firstDepositTime;
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
    }, [context?.currentUser]);
    
    const handleClaim = () => {
        if(context && isClaimable) {
            context.claimDailyInterest();
        }
    }
    
    return (
        <Card className="card-gradient-orange-red p-6 text-center">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Daily Interest Credit</h3>
            <p className="text-xl text-gray-200 mb-3">Next credit in:</p>
            <p className="text-5xl font-bold text-purple-400 mb-4">{interestCountdown}</p>
            <Button 
                onClick={handleClaim} 
                disabled={!isClaimable}
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
            case 'declined': return <Badge variant="destructive">Declined</Badge>;
            case 'info': return <Badge variant="default">Info</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };
    const getIconForType = (type: string) => {
        switch(type) {
            case 'deposit': return <Briefcase className="text-green-400" />;
            case 'withdrawal': return <Send className="text-red-400" />;
            case 'interest_credit': return <TrendingUp className="text-purple-400" />;
            case 'level_up': return <TrendingUp className="text-blue-400" />;
            case 'new_referral': return <UserCheck className="text-yellow-400" />;
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
                        <p className="text-xs text-gray-400">{format(new Date(tx.timestamp), 'PPpp')}</p>
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

const WithdrawPanel = () => {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    if (!context || !context.currentUser || !context.levels) return null;
    const { currentUser, levels, submitWithdrawalRequest, restrictionMessages } = context;
    const currentLevelDetails = levels[currentUser.level];
    
    const hasPendingWithdrawal = currentUser.transactions.some(tx => tx.type === 'withdrawal' && tx.status === 'pending');

    const handleSubmitWithdrawal = () => {
        // Rule 1: Check for pending withdrawal first
        if (hasPendingWithdrawal) {
            setAlertMessage("You already have a withdrawal request being processed. Please wait for admin approval.");
            setIsAlertOpen(true);
            return;
        }
        
        // Rule 2: Check for withdrawal hold period
        const holdMsg = restrictionMessages.find(m => m.type === 'withdrawal_hold' && m.isActive);
        if (holdMsg && (holdMsg.durationDays || 0) > 0 && currentUser.lastWithdrawalTime) {
            const holdDurationMs = (holdMsg.durationDays || 0) * 24 * 60 * 60 * 1000;
            const timeSinceLastWithdrawal = Date.now() - currentUser.lastWithdrawalTime;

            if (timeSinceLastWithdrawal < holdDurationMs) {
                const remainingTime = holdDurationMs - timeSinceLastWithdrawal;
                const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
                const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const countdown = `${days}d ${hours}h`;
                const message = holdMsg.message.replace('{durationDays}', (holdMsg.durationDays || 0).toString()).replace('{countdown}', countdown)
                setAlertMessage(message);
                setIsAlertOpen(true);
                return;
            }
        }
        
        // Rule 3: Check for monthly withdrawal limit
        const monthlyLimitMsg = restrictionMessages.find(m => m.type === 'withdrawal_monthly_limit' && m.isActive);
        if (monthlyLimitMsg && currentLevelDetails) {
            const monthlyWithdrawalsAllowed = currentLevelDetails.monthlyWithdrawals || 0;
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const recentWithdrawals = currentUser.transactions.filter(
                (tx): tx is Transaction & { type: 'withdrawal', status: 'approved' } => tx.type === 'withdrawal' && tx.status === 'approved' && tx.timestamp > thirtyDaysAgo
            ).length;

            if (recentWithdrawals >= monthlyWithdrawalsAllowed) {
                setAlertMessage(monthlyLimitMsg.message.replace('{limit}', monthlyWithdrawalsAllowed.toString()));
                setIsAlertOpen(true);
                return;
            }
        }
        
        const amount = parseFloat(withdrawalAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Error", description: "Please enter a valid withdrawal amount.", variant: "destructive" });
            return;
        }
        if (amount > currentUser.balance) {
            toast({ title: "Error", description: "Insufficient balance.", variant: "destructive" });
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
                You can withdraw {currentLevelDetails?.monthlyWithdrawals || 0} time(s) per month.
            </p>
            <Input
                type="number"
                placeholder="Amount to withdraw"
                className="mb-4 text-lg"
                value={withdrawalAmount}
                onChange={e => setWithdrawalAmount(e.target.value)}
            />
            <Input type="text" placeholder={currentUser.primaryWithdrawalAddress || 'Not set'} value={currentUser.primaryWithdrawalAddress || ''} readOnly className="mb-4 text-lg bg-gray-800/50" />
            <Button className="w-full py-3 text-lg" onClick={handleSubmitWithdrawal} >
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
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Manage Withdrawal Address</h3>
            <p className="text-lg text-gray-200 mb-3">Current Address:</p>
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
        <h3 className="text-2xl font-semibold mb-4 text-blue-300">Change Password</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full"><KeyRound /> Update Password</Button>
            </form>
        </>
    );
};


const ReferralNetworkPanel = ({ currentUser }: { currentUser: any }) => {
    const { toast } = useToast();
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
            <ul className="list-none space-y-2">
            {currentUser.referredUsers.length > 0 ? (
                currentUser.referredUsers.map((user: any, index: number) => (
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
        </ScrollArea>
        </>
    );
}

const LevelDetailsPanel = ({ levels }: { levels: { [key: number]: Level } }) => (
    <>
        <h3 className="text-2xl font-semibold mb-4 text-blue-300">Staking Level Details</h3>
        <ScrollArea className="h-96 custom-scrollbar">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="text-white">Level</TableHead>
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Min Balance</TableHead>
                <TableHead className="text-white">Referrals</TableHead>
                <TableHead className="text-white">Withdraw Limit</TableHead>
                <TableHead className="text-white">Monthly Withdrawals</TableHead>
                <TableHead className="text-white">Interest</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {Object.entries(levels).filter(([,details]) => details.isEnabled).sort(([a], [b]) => Number(a) - Number(b)).map(([level, details]) => (
                <TableRow key={level}>
                    <TableCell><LevelBadge level={parseInt(level, 10)} /></TableCell>
                    <TableCell className="font-semibold text-gray-200">{details.name}</TableCell>
                    <TableCell className="font-mono text-green-300">{details.minBalance} USDT</TableCell>
                    <TableCell className="font-mono text-blue-300">{details.directReferrals}</TableCell>
                    <TableCell className="font-mono text-yellow-300">{details.withdrawalLimit} USDT</TableCell>
                    <TableCell className="font-mono text-orange-300">{details.monthlyWithdrawals}</TableCell>
                    <TableCell className="font-mono text-purple-300">{(details.interest * 100).toFixed(2)}%</TableCell>
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
    if(!context) return null;
    return(
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Booster Store</h3>
            <p className="text-gray-400">Coming soon! Purchase packs to boost your earnings.</p>
        </>
    )
}

const StakingPoolsPanel = () => {
    const context = useContext(AppContext);
    if(!context) return null;
    return(
        <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Global Staking Pools</h3>
            <p className="text-gray-400">Coming soon! Join global pools for a chance at huge rewards.</p>
        </>
    )
}

const CustomPanel = ({ panel }: { panel: DashboardPanel }) => (
    <>
        <h3 className="text-2xl font-semibold mb-4 text-blue-300">{panel.title}</h3>
        {/* A simple markdown renderer could be added here */}
        <p>{panel.content}</p>
    </>
);


type ModalView = 
    | 'recharge' 
    | 'withdraw' 
    | 'history' 
    | 'referrals' 
    | 'levels' 
    | 'settings' 
    | 'notices'
    | 'boosters'
    | 'pools';

// Main Dashboard Component
const UserDashboard = () => {
  const context = useContext(AppContext);
  const [modalView, setModalView] = useState<ModalView | null>(null);

  if (!context || !context.currentUser) {
    return <div>Loading user data...</div>;
  }
  const { currentUser, levels } = context;
  
  const hasPendingRequests = currentUser.transactions.some(tx => tx.status === 'pending');
  const currentLevelDetails = levels[currentUser.level];

  const renderModalContent = () => {
    if (!modalView) return null;

    switch(modalView) {
        case 'recharge': return <RechargePanel />;
        case 'withdraw': return <WithdrawPanel />;
        case 'history': return <TransactionHistoryPanel />;
        case 'referrals': return <ReferralNetworkPanel currentUser={currentUser} />;
        case 'levels': return <LevelDetailsPanel levels={levels} />;
        case 'settings': return <ChangePasswordPanel />;
        case 'notices': return <NoticesPanel />;
        case 'boosters': return <BoosterStorePanel />;
        case 'pools': return <StakingPoolsPanel />;
        default: return null;
    }
  };

  const getModalTitle = () => {
    if (!modalView) return '';
    const titles: Record<ModalView, string> = {
        recharge: 'Recharge',
        withdraw: 'Withdraw',
        history: 'History',
        referrals: 'Referral Network',
        levels: 'Level Details',
        settings: 'Settings',
        notices: 'Notices',
        boosters: 'Booster Store',
        pools: 'Staking Pools',
    };
    return titles[modalView];
  };

  const dashboardItems: { view: ModalView, label: string, icon: React.ElementType }[] = [
    { view: 'recharge', label: 'Recharge', icon: Briefcase },
    { view: 'withdraw', label: 'Withdraw', icon: Send },
    { view: 'history', label: 'History', icon: BarChart },
    { view: 'referrals', label: 'Referrals', icon: UserCheck },
    { view: 'levels', label: 'Levels', icon: Layers },
    { view: 'boosters', label: 'Boosters', icon: Gift },
    { view: 'pools', label: 'Pools', icon: Star },
    { view: 'notices', label: 'Notices', icon: Megaphone },
    { view: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <GlassPanel className="w-full max-w-7xl p-8 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
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
            <UserOverviewPanel currentUser={currentUser} />
            <StakingLevelPanel currentUser={currentUser} currentLevelDetails={currentLevelDetails} />
            <div className='md:col-span-2'>
                <InterestCountdownPanel/>
            </div>
        </div>
      </GlassPanel>

      <FloatingMenu items={dashboardItems} onSelect={setModalView} />

      <Dialog open={!!modalView} onOpenChange={(isOpen) => !isOpen && setModalView(null)}>
        <DialogContent className='max-w-2xl'>
            <DialogHeader>
                <DialogTitle className='text-2xl text-purple-400'>{getModalTitle()}</DialogTitle>
            </DialogHeader>
            <div className='py-4'>
                {renderModalContent()}
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};


const FloatingMenu = ({ items, onSelect }: { items: { view: ModalView, label: string, icon: React.ElementType }[], onSelect: (view: ModalView) => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mb-4 flex flex-col items-end gap-3"
                    >
                        {items.map((item) => (
                             <div key={item.view} className="flex items-center gap-3">
                                <span className="bg-card/50 backdrop-blur-md text-white px-3 py-1 rounded-md shadow-lg text-sm">
                                    {item.label}
                                 </span>
                                <Button
                                    size="icon"
                                    className="rounded-full size-12 bg-secondary/80 hover:bg-secondary"
                                    onClick={() => {
                                        onSelect(item.view);
                                        setIsOpen(false);
                                    }}
                                >
                                    <item.icon className="size-6" />
                                </Button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <Button 
                size="icon" 
                className="rounded-full size-20 shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600 hover:scale-110 active:scale-105 transition-transform duration-200"
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

    