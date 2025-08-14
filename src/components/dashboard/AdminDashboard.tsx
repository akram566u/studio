
"use client";
import React, { useContext, useState, useEffect } from 'react';
import { AppContext, UserForAdmin } from '@/components/providers/AppProvider';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AnimatePresence, motion } from 'framer-motion';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import RequestViewExamples from './RequestViewExamples';
import { ArrowDownCircle, ArrowUpCircle, Badge, CheckCircle, ExternalLink, GripVertical, KeyRound, Rocket, ShieldCheck, ShieldX, Star, Trash2, UserCog, Users, Settings, BarChart, FileText, Palette, Users2, PanelTop, Megaphone, Gift, Layers, X, ChevronRight, PiggyBank, BadgePercent, CheckCheck, Trophy, BrainCircuit, Loader2, Send } from 'lucide-react';
import { AppLinks, BackgroundTheme, BoosterPack, DashboardPanel, FloatingActionButtonSettings, FloatingActionItem, Level, Notice, RechargeAddress, ReferralBonusSettings, RestrictionMessage, StakingPool, StakingVault, Transaction, Levels, TeamCommissionSettings, TeamSizeReward, TeamBusinessReward, AnalyzeTeamOutput } from '@/lib/types';
import { cn } from '@/lib/utils';
import { analyzeTeam } from '@/ai/flows/analyze-team-flow';


type AdminModalView =
    | 'history'
    | 'users'
    | 'content_ui'
    | 'system'
    | 'panels'
    | 'notices'
    | 'boosters'
    | 'pools'
    | 'vaults'
    | 'booster_analytics'
    | 'view_examples';

// Main Dashboard Component
const AdminDashboard = () => {
  const context = useContext(AppContext);
  const [modalView, setModalView] = useState<AdminModalView | null>(null);

  if (!context || !context.isAdmin) {
    return <div>Access Denied.</div>;
  }

  const { totalUsers, totalDepositAmount, totalWithdrawalAmount, totalReferralBonusPaid, allPendingRequests, adminReferrals } = context;

  const firebaseProjectId = "staking-hub-3";

  const renderModalContent = () => {
    if (!modalView) return null;
    switch(modalView) {
        case 'history': return <ActivityLogPanel />;
        case 'users': return <UserManagementPanel />;
        case 'content_ui': return <ContentUIPanel />;
        case 'system': return <SystemSettingsPanel />;
        case 'panels': return <UserPanelsPanel />;
        case 'notices': return <NoticesPanel />;
        case 'boosters': return <BoostersPanel />;
        case 'booster_analytics': return <BoosterAnalyticsPanel />;
        case 'pools': return <PoolsPanel />;
        case 'vaults': return <VaultsPanel />;
        case 'view_examples': return <RequestViewExamples />;
        default: return null;
    }
  };

  const getModalTitle = (view: AdminModalView) => {
    const titles: Record<AdminModalView, string> = {
        history: 'Activity Log',
        users: 'User Management',
        content_ui: 'Content & UI Customization',
        system: 'System Settings & Rules',
        panels: 'User Dashboard Panels',
        notices: 'Manage Notices & Events',
        boosters: 'Manage Booster Packs',
        booster_analytics: 'Booster Pack Analytics',
        pools: 'Manage Staking Pools',
        vaults: 'Manage Staking Vaults',
        view_examples: 'Request View Examples',
    };
    return titles[view];
  }
  
  const menuItems: { view: AdminModalView, label: string, icon: React.ElementType }[] = [
      { view: 'history', label: 'Activity Log', icon: FileText },
      { view: 'users', label: 'User Management', icon: Users2 },
      { view: 'content_ui', label: 'Content & UI', icon: Palette },
      { view: 'system', label: 'System Settings', icon: Settings },
      { view: 'panels', label: 'User Panels', icon: PanelTop },
      { view: 'notices', label: 'Notices', icon: Megaphone },
      { view: 'boosters', label: 'Boosters', icon: Gift },
      { view: 'booster_analytics', label: 'Booster Analytics', icon: BarChart },
      { view: 'pools', label: 'Pools', icon: Layers },
      { view: 'vaults', label: 'Vaults', icon: PiggyBank },
      { view: 'view_examples', label: 'View Examples', icon: BarChart },
  ];

  const getRequestIcon = (type: string) => {
      switch(type) {
          case 'deposit': return <ArrowDownCircle className="text-green-400 mt-1 size-6" />;
          case 'withdrawal': return <ArrowUpCircle className="text-red-400 mt-1 size-6" />;
          case 'team_size_reward': return <Trophy className="text-amber-400 mt-1 size-6" />;
          case 'team_business_reward': return <BadgePercent className="text-cyan-400 mt-1 size-6" />;
          default: return <CheckCircle className="text-gray-400 mt-1 size-6" />;
      }
  }

  return (
    <>
      <GlassPanel className="w-full max-w-7xl p-8 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
        <h2 className="text-3xl font-bold text-purple-400 mb-2 text-center">Admin Panel</h2>
        <p className="text-center text-gray-400 mb-6">Manage all user deposit, withdrawal, and referral bonus requests.</p>
        
        <div className="space-y-6">
            <Card className="card-gradient-blue-purple p-6">
                <CardHeader>
                    <CardTitle className="text-purple-300">Admin Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                        <div>
                            <p className="text-sm text-gray-300">Total Registered Users</p>
                            <p className="text-xl font-bold text-blue-400">{totalUsers}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-300">Total Deposits</p>
                            <p className="text-xl font-bold text-green-400">{totalDepositAmount.toFixed(2)} USDT</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-300">Total Withdrawals</p>
                            <p className="text-xl font-bold text-red-400">{totalWithdrawalAmount.toFixed(2)} USDT</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-300">Total Referral Bonuses Paid</p>
                            <p className="text-xl font-bold text-orange-400">{totalReferralBonusPaid.toFixed(2)} USDT</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="card-gradient-green-cyan p-6">
                <CardHeader>
                    <CardTitle className="text-purple-300">Unified Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96 custom-scrollbar">
                        {allPendingRequests && allPendingRequests.length > 0 ? (
                            <div className="space-y-4">
                                {allPendingRequests.map(request => (
                                    <div key={`${request.id}-${request.timestamp}`} className="bg-black/20 p-4 rounded-lg flex items-start gap-4">
                                        {getRequestIcon(request.type)}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-lg capitalize">
                                                        {request.type.replace('_', ' ')} Request
                                                        <span className={`ml-2 font-mono text-xl ${request.type === 'deposit' ? 'text-green-300' : 'text-red-300'}`}>
                                                            {request.amount.toFixed(2)} USDT
                                                        </span>
                                                    </p>
                                                    <p className="text-sm text-gray-300 font-mono">{request.email}</p>
                                                </div>
                                                <p className="text-xs text-gray-400">{format(new Date(request.timestamp), 'PPpp')}</p>
                                            </div>
                                            
                                            <div className="text-xs text-gray-400 space-y-1">
                                                <p>
                                                    Lvl: {request.userLevel} | Deposits: {request.userDepositCount} | Withdrawals: {request.userWithdrawalCount} | Referrals: {request.directReferrals}
                                                </p>
                                                <p className="break-all">Address: {request.walletAddress || request.userWithdrawalAddress}</p>
                                                {request.note && <p className="text-yellow-300">Note: {request.note}</p>}
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button onClick={() => context.approveRequest(request.id, request.type)} size="sm">Approve</Button>
                                                <Button onClick={() => context.declineRequest(request.id, request.type)} variant="destructive" size="sm">Decline</Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center">No pending requests.</p>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card className="card-gradient-yellow-pink p-6">
                <CardHeader>
                    <CardTitle className="text-purple-300">Admin Referred Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-60 custom-scrollbar">
                        {adminReferrals.length > 0 ? (
                            <div className="space-y-4">
                                {adminReferrals.map(user => (
                                    <div key={user.id} className="bg-black/20 p-4 rounded-lg">
                                        <p className="font-bold">{user.email}</p>
                                        <p className="text-xs text-gray-400 break-all">ID: {user.id}</p>
                                        <p className="text-xs text-gray-400 break-all">Address: {user.primaryWithdrawalAddress}</p>
                                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                            <p>Current Balance: <span className="text-yellow-400">{user.balance.toFixed(2)} USDT</span></p>
                                            <p>Level: <span className="text-blue-400">{user.level}</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">No users have signed up with the admin referral code yet.</p>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
             <Card className="card-gradient-indigo-fuchsia p-6">
                <CardHeader>
                    <CardTitle className="text-purple-300">Firebase Usage &amp; Billing</CardTitle>
                    <CardDescription>Monitor your project's resource usage directly in the Firebase Console.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-300">
                       For security reasons, live usage data cannot be displayed here. Please use the links below to view your detailed usage and billing information in the Firebase Console.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a href={`https://console.firebase.google.com/project/${firebaseProjectId}/usage/firestore`} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full"><ExternalLink /> View Database Usage</Button>
                        </a>
                        <a href={`https://console.firebase.google.com/project/${firebaseProjectId}/usage/billing`} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full"><ExternalLink /> Manage Billing</Button>
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
      </GlassPanel>
      <FloatingMenu items={menuItems} onSelect={setModalView} />
       <Dialog open={!!modalView} onOpenChange={(isOpen) => !isOpen && setModalView(null)}>
        <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col'>
            <DialogHeader>
                <DialogTitle className='text-2xl text-purple-400'>{modalView && getModalTitle(modalView)}</DialogTitle>
            </DialogHeader>
            <div className='flex-grow overflow-y-auto custom-scrollbar -mr-6 pr-6'>
                {renderModalContent()}
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};


// Panel Components
const ActivityLogPanel = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { adminHistory } = context;

    const getHistoryIcon = (tx: Transaction) => {
        switch(tx.type) {
            case 'deposit': return <ShieldCheck className="text-green-400 size-6" />;
            case 'withdrawal': return <ShieldX className="text-red-400 size-6" />;
            case 'admin_adjusted': return <UserCog className="text-blue-400 size-6" />;
            default: return <CheckCircle className="text-gray-400 size-6" />;
        }
    }

    return (
        <Card className="card-gradient-orange-red p-6">
            <CardHeader>
                <CardTitle className="text-purple-300">Admin Activity Log</CardTitle>
                <CardDescription>A log of all approvals, declines, and adjustments.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh] custom-scrollbar">
                    {adminHistory && adminHistory.length > 0 ? (
                        <div className="space-y-4">
                            {adminHistory.map(tx => (
                                <div key={`${tx.id}-${tx.timestamp}`} className="bg-black/20 p-4 rounded-lg flex items-start gap-4">
                                    <div className="mt-1">{getHistoryIcon(tx)}</div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-lg text-yellow-300">{tx.description}</p>
                                            <p className="text-xs text-gray-400">{format(new Date(tx.timestamp), 'PPpp')}</p>
                                        </div>
                                        <p className="text-sm text-gray-300 font-mono">User: {tx.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center">No historical admin activities found.</p>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
};

const TeamAnalysisDialog = ({ open, onOpenChange, userId }: { open: boolean, onOpenChange: (open: boolean) => void, userId: string }) => {
    const [analysis, setAnalysis] = useState<AnalyzeTeamOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && userId && !analysis) {
            const getAnalysis = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const result = await analyzeTeam({ userId });
                    setAnalysis(result);
                } catch (e: any) {
                    setError(e.message || "Failed to analyze team.");
                } finally {
                    setIsLoading(false);
                }
            };
            getAnalysis();
        }
    }, [open, userId, analysis]);

    const handleClose = () => {
        setAnalysis(null); // Reset analysis when closing
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-purple-400 text-2xl flex items-center gap-2"><BrainCircuit /> AI Team Performance Analysis</DialogTitle>
                    <DialogDescription>
                        This AI-powered analysis provides insights into the user's team structure and suggests areas for improvement.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {isLoading && <div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin" /> <p>Analyzing team data...</p></div>}
                    {error && <p className="text-red-400">Error: {error}</p>}
                    {analysis && (
                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-bold text-yellow-300 mb-1">Strengths</h4>
                                <ul className="list-disc list-inside space-y-1 text-gray-300">
                                    {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-300 mb-1">Weaknesses</h4>
                                <ul className="list-disc list-inside space-y-1 text-gray-300">
                                    {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-bold text-green-300 mb-1">Suggestions for User</h4>
                                <ul className="list-disc list-inside space-y-1 text-gray-300">
                                    {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-bold text-blue-300 mb-1">Reward Analysis</h4>
                                <p className="text-gray-300">{analysis.rewardAnalysis}</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const UserManagementPanel = () => {
    const context = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedUser, setSearchedUser] = useState<UserForAdmin | null>(null);
    const [editingEmail, setEditingEmail] = useState('');
    const [editingAddress, setEditingAddress] = useState('');
    const [editingBalance, setEditingBalance] = useState(0);
    const [editingLevel, setEditingLevel] = useState(0);
    const [editingReferrals, setEditingReferrals] = useState(0);
    const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
    const [announcement, setAnnouncement] = useState('');


    useEffect(() => {
        if (searchedUser) {
            setEditingEmail(searchedUser.email);
            setEditingAddress(searchedUser.primaryWithdrawalAddress || '');
            setEditingBalance(searchedUser.balance);
            setEditingLevel(searchedUser.level);
            setEditingReferrals(searchedUser.directReferrals);
            setAnnouncement(''); // Clear announcement on new user search
        }
    }, [searchedUser]);

    if (!context) return null;
    const { findUser, allUsersForAdmin, adminUpdateUserEmail, adminUpdateUserWithdrawalAddress, adjustUserBalance, adjustUserLevel, forgotPassword, adjustUserDirectReferrals, sendAnnouncement } = context;

    const handleUserSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            toast({ title: "Error", description: "Please enter a user email to search.", variant: "destructive"});
            return;
        }
        const user = await findUser(searchQuery);
        if (user) {
            setSearchedUser(user);
        } else {
            setSearchedUser(null);
            toast({ title: "Not Found", description: "No user found with that email.", variant: "destructive"});
        }
    };

    const handleUserUpdate = async (field: 'email' | 'address' | 'balance' | 'level' | 'referrals') => {
        if (!searchedUser) return;
        let updatedUser: UserForAdmin | null = null;
        switch (field) {
            case 'email':
                updatedUser = await adminUpdateUserEmail(searchedUser.id, editingEmail);
                break;
            case 'address':
                updatedUser = await adminUpdateUserWithdrawalAddress(searchedUser.id, editingAddress);
                break;
            case 'balance':
                updatedUser = await adjustUserBalance(searchedUser.id, editingBalance);
                break;
            case 'level':
                updatedUser = await adjustUserLevel(searchedUser.id, editingLevel);
                break;
            case 'referrals':
                updatedUser = await adjustUserDirectReferrals(searchedUser.id, editingReferrals);
                break;
        }
        if (updatedUser) {
            setSearchedUser(updatedUser);
        }
    };

    const handlePasswordReset = () => {
        if (!searchedUser?.email) return;
        forgotPassword(searchedUser.email);
    };

    const handleSendAnnouncement = () => {
        if (!searchedUser || !announcement.trim()) {
            toast({ title: "Error", description: "Please select a user and write a message.", variant: "destructive" });
            return;
        }
        sendAnnouncement(searchedUser.id, announcement);
        setAnnouncement(''); // Clear after sending
    };

    return (
        <>
        <Card className="card-gradient-indigo-fuchsia p-6">
            <CardContent>
                 <form onSubmit={handleUserSearch} className="flex gap-2 mb-4">
                    <Input
                        type="email"
                        placeholder="Search by user email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button type="submit">Search</Button>
                </form>
                {searchedUser && (
                   <div className="bg-black/20 p-6 rounded-lg space-y-4">
                        <div className='flex justify-between items-start'>
                            <div>
                                <h4 className="text-lg font-bold">{searchedUser.email}</h4>
                                <p className="text-xs text-gray-400">ID: {searchedUser.id}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setSearchedUser(null)}>Clear Search</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email (Firestore Only)</Label>
                                <div className="flex gap-2">
                                    <Input id="edit-email" value={editingEmail} onChange={e => setEditingEmail(e.target.value)} />
                                    <Button onClick={() => handleUserUpdate('email')}>Save</Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-level">Level</Label>
                                 <div className="flex gap-2">
                                    <Input id="edit-level" type="number" value={editingLevel} onChange={e => setEditingLevel(Number(e.target.value))} />
                                    <Button onClick={() => handleUserUpdate('level')}>Save</Button>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="edit-referrals">Direct Referrals</Label>
                                <div className="flex gap-2">
                                    <Input id="edit-referrals" type="number" value={editingReferrals} onChange={e => setEditingReferrals(Number(e.target.value))} />
                                    <Button onClick={() => handleUserUpdate('referrals')}>Save</Button>
                                </div>
                            </div>
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="edit-address">Withdrawal Address</Label>
                                 <div className="flex gap-2">
                                    <Input id="edit-address" value={editingAddress} onChange={e => setEditingAddress(e.target.value)} />
                                    <Button onClick={() => handleUserUpdate('address')}>Save</Button>
                                </div>
                            </div>
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="edit-balance">Balance</Label>
                                <div className="flex gap-2">
                                    <Input id="edit-balance" type="number" value={editingBalance} onChange={e => setEditingBalance(Number(e.target.value))} />
                                    <Button onClick={() => handleUserUpdate('balance')}>Update Balance</Button>
                                </div>
                                <p className="text-xs text-gray-400">Sets the user's balance to this exact amount.</p>
                            </div>
                        </div>
                        <hr className="border-white/10" />
                        <div className="space-y-2">
                            <Label htmlFor="announcement-text">Personalized Announcement</Label>
                            <Textarea 
                                id="announcement-text" 
                                placeholder={`Write a specific message for ${searchedUser.email}...`}
                                value={announcement}
                                onChange={e => setAnnouncement(e.target.value)}
                            />
                            <Button onClick={handleSendAnnouncement}><Send className="mr-2"/> Send Message</Button>
                        </div>
                        <hr className="border-white/10" />
                        <div className="flex flex-col md:flex-row gap-2">
                            <Button onClick={handlePasswordReset} variant="destructive" className="w-full">
                                <KeyRound /> Send Password Reset Email
                            </Button>
                             <Button onClick={() => setIsAnalysisDialogOpen(true)} variant="outline" className="w-full">
                                <BrainCircuit /> Analyze Team Performance
                            </Button>
                        </div>
                   </div>
                )}
                {!searchedUser && (
                    <ScrollArea className="h-[60vh] custom-scrollbar">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Withdrawal Address</TableHead>
                                    <TableHead className='text-right'>Balance</TableHead>
                                    <TableHead className='text-right'>Level</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allUsersForAdmin.map(user => (
                                    <TableRow key={user.id} onClick={() => findUser(user.email).then(setSearchedUser)} className="cursor-pointer">
                                        <TableCell className='font-mono'>{user.email}</TableCell>
                                        <TableCell className='font-mono break-all'>{user.primaryWithdrawalAddress || 'Not set'}</TableCell>
                                        <TableCell className='font-mono text-right'>{user.balance.toFixed(2)}</TableCell>
                                        <TableCell className='font-mono text-right'>{user.level}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
        {searchedUser && <TeamAnalysisDialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen} userId={searchedUser.id} />}
        </>
    );
};

const ContentUIPanel = () => {
    const context = useContext(AppContext);
    const [localWebsiteTitle, setLocalWebsiteTitle] = useState('');
    const [localStartScreenTitle, setLocalStartScreenTitle] = useState('');
    const [localStartScreenSubtitle, setLocalStartScreenSubtitle] = useState('');
    const [themeColors, setThemeColors] = useState({ primary: '#2563eb', accent: '#7c3aed' });
    const [localFabSettings, setLocalFabSettings] = useState<FloatingActionButtonSettings>({ isEnabled: true, items: [] });
    
    useEffect(() => {
        if(context?.websiteTitle) setLocalWebsiteTitle(context.websiteTitle);
        if(context?.startScreenContent) {
            setLocalStartScreenTitle(context.startScreenContent.title);
            setLocalStartScreenSubtitle(context.startScreenContent.subtitle);
        }
        if(context?.floatingActionButtonSettings) setLocalFabSettings(context.floatingActionButtonSettings);
    }, [context?.websiteTitle, context?.startScreenContent, context?.floatingActionButtonSettings]);

    if(!context) return null;
    const { 
        updateWebsiteTitle,
        updateStartScreenContent,
        applyTheme,
        active3DTheme,
        setActive3DTheme,
        updateFloatingActionButtonSettings,
    } = context;

    const handleWebsiteTitleSave = () => updateWebsiteTitle(localWebsiteTitle);
    const handleStartScreenContentSave = () => updateStartScreenContent({ title: localStartScreenTitle, subtitle: localStartScreenSubtitle });
    const handleApplyTheme = () => applyTheme(themeColors);
    
    const handleFabSettingsChange = (field: keyof FloatingActionButtonSettings, value: any) => {
        setLocalFabSettings(prev => ({ ...prev, [field]: value }));
    };
    
    const handleFabItemChange = (id: string, field: keyof FloatingActionItem, value: string | boolean | undefined) => {
        setLocalFabSettings(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
        }));
    };
    
    const handleAddFabItem = () => {
        const newItem: FloatingActionItem = {
            id: `fab_${Date.now()}`,
            label: 'New Action',
            icon: 'PlusCircle',
            action: 'custom_link',
            url: '#',
            isEnabled: true,
        };
        setLocalFabSettings(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };
    
    const handleDeleteFabItem = (id: string) => {
        setLocalFabSettings(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id)}));
    };

    const handleSaveFabSettings = () => {
        updateFloatingActionButtonSettings(localFabSettings);
    };

    return (
        <div className="space-y-6">
            <Card className="card-gradient-indigo-fuchsia p-6">
                <CardHeader>
                    <CardTitle className="text-purple-300">Website & Start Screen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="websiteTitle">Website Title</Label>
                        <Input id="websiteTitle" value={localWebsiteTitle} onChange={(e) => setLocalWebsiteTitle(e.target.value)} className="mt-1" />
                        <Button onClick={handleWebsiteTitleSave} className="mt-2">Save Title</Button>
                    </div>
                     <hr className="border-white/10" />
                    <div>
                        <Label htmlFor="startScreenTitle">Start Screen Title</Label>
                        <Input id="startScreenTitle" value={localStartScreenTitle} onChange={e => setLocalStartScreenTitle(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="startScreenSubtitle">Start Screen Subtitle</Label>
                        <Textarea id="startScreenSubtitle" value={localStartScreenSubtitle} onChange={e => setLocalStartScreenSubtitle(e.target.value)} className="mt-1"/>
                    </div>
                    <Button onClick={handleStartScreenContentSave} className="mt-2">Save Start Screen Content</Button>
                </CardContent>
            </Card>
            <Card className="card-gradient-blue-purple p-6">
                <CardHeader>
                    <CardTitle className="text-purple-300">Theme Customization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <Input id="primaryColor" type="color" value={themeColors.primary} onChange={(e) => setThemeColors(p => ({...p, primary: e.target.value}))} />
                        <Label htmlFor="accentColor">Accent Color</Label>
                        <Input id="accentColor" type="color" value={themeColors.accent} onChange={(e) => setThemeColors(p => ({...p, accent: e.target.value}))} />
                    </div>
                    <Button onClick={handleApplyTheme}>Apply Theme</Button>
                </CardContent>
            </Card>
            <Card className="card-gradient-green-cyan p-6">
                <CardHeader>
                    <CardTitle className="text-purple-300">3D Animated Background</CardTitle>
                    <CardDescription>Change the animated background for the entire app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Label htmlFor="theme-select">Select a theme</Label>
                    <Select value={active3DTheme} onValueChange={(value: BackgroundTheme) => setActive3DTheme(value)}>
                        <SelectTrigger id="theme-select">
                            <SelectValue placeholder="Select a 3D background theme" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="FloatingCrystals">Floating Crystals</SelectItem>
                            <SelectItem value="CosmicNebula">Cosmic Nebula</SelectItem>
                            <SelectItem value="DigitalMatrix">Digital Matrix</SelectItem>
                            <SelectItem value="AbstractParticles">Abstract Particles</SelectItem>
                            <SelectItem value="SynthwaveSunset">Synthwave Sunset</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
            <Card className="card-gradient-yellow-pink p-6">
                <CardHeader>
                    <CardTitle>Floating Action Button</CardTitle>
                    <CardDescription>Manage the floating helper button on the start screen.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="fab-enabled" className="text-lg">Enable Floating Button</Label>
                        <Switch
                            id="fab-enabled"
                            checked={localFabSettings.isEnabled}
                            onCheckedChange={checked => handleFabSettingsChange('isEnabled', checked)}
                        />
                    </div>
                    
                    <ScrollArea className="h-auto max-h-[40vh] custom-scrollbar">
                    <div className="space-y-4 pr-4">
                        {localFabSettings.items.map((item) => (
                            <div key={item.id} className="bg-black/20 p-4 rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="cursor-grab text-gray-400" />
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <div className="col-span-2 flex items-center gap-2">
                                            <Label htmlFor={`fab-item-enabled-${item.id}`} className='text-sm'>Enabled</Label>
                                            <Switch
                                                id={`fab-item-enabled-${item.id}`}
                                                checked={item.isEnabled}
                                                onCheckedChange={checked => handleFabItemChange(item.id, 'isEnabled', checked)}
                                            />
                                        </div>
                                        <Input 
                                            placeholder="Label" 
                                            value={item.label} 
                                            onChange={e => handleFabItemChange(item.id, 'label', e.target.value)}
                                        />
                                        <Input 
                                            placeholder="Icon Name (lucide-react)" 
                                            value={item.icon} 
                                            onChange={e => handleFabItemChange(item.id, 'icon', e.target.value)}
                                        />
                                        <div className="col-span-2">
                                            <Select value={item.action} onValueChange={(value: FloatingActionItem['action']) => handleFabItemChange(item.id, 'action', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select action" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="switch_view_desktop">Switch View to Desktop</SelectItem>
                                                    <SelectItem value="switch_view_mobile">Switch View to Mobile</SelectItem>
                                                    <SelectItem value="forgot_password">Forgot Password</SelectItem>
                                                    <SelectItem value="download_app">Download App</SelectItem>
                                                    <SelectItem value="customer_support">Customer Support</SelectItem>
                                                    <SelectItem value="custom_link">Custom Link</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {item.action === 'custom_link' && (
                                            <div className="col-span-2">
                                                <Input
                                                    placeholder="https://example.com"
                                                    value={item.url}
                                                    onChange={e => handleFabItemChange(item.id, 'url', e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <Button variant="destructive" size="icon" onClick={() => handleDeleteFabItem(item.id)}>
                                        <Trash2 />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    </ScrollArea>

                    <div className="flex gap-4">
                        <Button onClick={handleSaveFabSettings}>Save FAB Settings</Button>
                        <Button onClick={handleAddFabItem} variant="secondary">Add New Action</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

const SystemSettingsPanel = () => {
    const context = useContext(AppContext);
    const [localLevels, setLocalLevels] = useState<{[key: number]: Level}>({});
    const [localRestrictions, setLocalRestrictions] = useState<RestrictionMessage[]>([]);
    const [localReferralBonusSettings, setLocalReferralBonusSettings] = useState<ReferralBonusSettings>({ isEnabled: true, bonusAmount: 5, minDeposit: 100 });
    const [localRechargeAddresses, setLocalRechargeAddresses] = useState<RechargeAddress[]>([]);
    const [localAppLinks, setLocalAppLinks] = useState<AppLinks>({ downloadUrl: '', supportUrl: '' });
    const [localTeamCommissionSettings, setLocalTeamCommissionSettings] = useState<TeamCommissionSettings>({ isEnabled: false, rates: { level1: 0, level2: 0, level3: 0 } });
    const [localTeamSizeRewards, setLocalTeamSizeRewards] = useState<TeamSizeReward[]>([]);
    const [localTeamBusinessRewards, setLocalTeamBusinessRewards] = useState<TeamBusinessReward[]>([]);
    
    useEffect(() => {
        if(context?.levels) setLocalLevels(context.levels);
        if(context?.restrictionMessages) setLocalRestrictions(context.restrictionMessages);
        if(context?.referralBonusSettings) setLocalReferralBonusSettings(context.referralBonusSettings);
        if(context?.rechargeAddresses) setLocalRechargeAddresses(context.rechargeAddresses);
        if(context?.appLinks) setLocalAppLinks(context.appLinks);
        if(context?.teamCommissionSettings) setLocalTeamCommissionSettings(context.teamCommissionSettings);
        if(context?.teamSizeRewards) setLocalTeamSizeRewards(context.teamSizeRewards);
        if(context?.teamBusinessRewards) setLocalTeamBusinessRewards(context.teamBusinessRewards);
    }, [context]);
    
    if(!context) return null;

    const { 
        updateLevel, addLevel, deleteLevel,
        updateRestrictionMessages, addRestrictionMessage, deleteRestrictionMessage,
        updateReferralBonusSettings,
        updateTeamCommissionSettings,
        addTeamSizeReward, updateTeamSizeReward, deleteTeamSizeReward,
        addTeamBusinessReward, updateTeamBusinessReward, deleteTeamBusinessReward,
        addRechargeAddress, updateRechargeAddress, deleteRechargeAddress,
        updateAppLinks,
    } = context;

    const handleLevelChange = (level: number, field: keyof Level, value: string | number | boolean) => {
        let finalValue = value;
        if (typeof value === 'string' && ['minBalance', 'directReferrals', 'interest', 'withdrawalLimit', 'monthlyWithdrawals'].includes(field)) {
            finalValue = Number(value);
        }
        setLocalLevels(prev => ({ ...prev, [level]: { ...prev[level], [field]: finalValue } }));
    };
    const handleSaveLevel = (levelKey: number) => { const levelDetails = localLevels[levelKey]; if (levelDetails) updateLevel(levelKey, levelDetails); };
    const handleAddNewLevel = () => addLevel();
    const handleRestrictionChange = (id: string, field: keyof RestrictionMessage, value: string | boolean | number) => {
        setLocalRestrictions(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };
    const handleSaveRestrictions = () => updateRestrictionMessages(localRestrictions);
    const handleAddNewRestriction = () => addRestrictionMessage();
    const handleReferralBonusSettingsChange = (field: keyof ReferralBonusSettings, value: any) => {
        const newSettings = {...localReferralBonusSettings, [field]: value};
        setLocalReferralBonusSettings(newSettings);
    };
    const handleSaveReferralBonusSettings = () => updateReferralBonusSettings(localReferralBonusSettings);
    
    const handleTeamCommissionChange = (field: 'isEnabled' | keyof TeamCommissionSettings['rates'], value: any) => {
        if(field === 'isEnabled') {
            setLocalTeamCommissionSettings(prev => ({...prev, isEnabled: value}));
        } else {
            setLocalTeamCommissionSettings(prev => ({ ...prev, rates: { ...prev.rates, [field]: value }}));
        }
    };
    const handleSaveTeamCommissionSettings = () => updateTeamCommissionSettings(localTeamCommissionSettings);
    
    const handleTeamSizeRewardChange = (id: string, field: keyof TeamSizeReward, value: any) => {
        setLocalTeamSizeRewards(prev => prev.map(r => r.id === id ? {...r, [field]: value} : r));
    }
    const handleSaveTeamSizeReward = (id: string) => { const reward = localTeamSizeRewards.find(r => r.id === id); if(reward) updateTeamSizeReward(id, reward); }

    const handleTeamBusinessRewardChange = (id: string, field: keyof TeamBusinessReward, value: any) => {
        setLocalTeamBusinessRewards(prev => prev.map(r => r.id === id ? {...r, [field]: value} : r));
    }
    const handleSaveTeamBusinessReward = (id: string) => { const reward = localTeamBusinessRewards.find(r => r.id === id); if(reward) updateTeamBusinessReward(id, reward); }


    const handleRechargeAddressChange = (id: string, field: keyof RechargeAddress, value: any) => {
        const newAddresses = localRechargeAddresses.map(addr => addr.id === id ? { ...addr, [field]: value } : addr);
        setLocalRechargeAddresses(newAddresses);
    };
    const handleSaveRechargeAddress = (id: string) => { const addressToUpdate = localRechargeAddresses.find(addr => addr.id === id); if (addressToUpdate) updateRechargeAddress(id, addressToUpdate); };
    const handleAppLinksChange = (field: keyof AppLinks, value: string) => setLocalAppLinks(prev => ({ ...prev, [field]: value }));
    const handleSaveAppLinks = () => updateAppLinks(localAppLinks);

    return (
        <div className="space-y-6">
            <Card className="card-gradient-green-cyan p-6">
                <CardHeader><CardTitle className="text-purple-300">Manage Levels</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="h-96 custom-scrollbar">
                        <div className="space-y-4">
                            {Object.entries(localLevels).sort(([a],[b]) => Number(a) - Number(b)).map(([levelStr, details]) => {
                                const level = Number(levelStr);
                                return (
                                <div key={level} className="bg-black/20 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-lg text-yellow-300">Level {level}</h4>
                                        <Label htmlFor={`level-enabled-${level}`} className="flex items-center gap-2">
                                            Enabled
                                            <Switch id={`level-enabled-${level}`} checked={details.isEnabled} onCheckedChange={(checked) => handleLevelChange(level, 'isEnabled', checked)} />
                                        </Label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div><Label htmlFor={`level-${level}-name`}>Level Name</Label><Input id={`level-${level}-name`} type="text" value={details.name} onChange={(e) => handleLevelChange(level, 'name', e.target.value)} /></div>
                                        <div><Label htmlFor={`level-${level}-minBalance`}>Min Balance</Label><Input id={`level-${level}-minBalance`} type="number" value={details.minBalance} onChange={(e) => handleLevelChange(level, 'minBalance', e.target.value)} /></div>
                                        <div><Label htmlFor={`level-${level}-referrals`}>Referrals</Label><Input id={`level-${level}-referrals`} type="number" value={details.directReferrals} onChange={(e) => handleLevelChange(level, 'directReferrals', e.target.value)} /></div>
                                        <div><Label htmlFor={`level-${level}-interest`}>Interest (Decimal)</Label><Input id={`level-${level}-interest`} type="number" step="0.001" value={details.interest} onChange={(e) => handleLevelChange(level, 'interest', e.target.value)} /></div>
                                        <div><Label htmlFor={`level-${level}-withdrawalLimit`}>Withdrawal Limit</Label><Input id={`level-${level}-withdrawalLimit`} type="number" value={details.withdrawalLimit} onChange={(e) => handleLevelChange(level, 'withdrawalLimit', e.target.value)} /></div>
                                        <div><Label htmlFor={`level-${level}-monthlyWithdrawals`}>Monthly Withdrawals</Label><Input id={`level-${level}-monthlyWithdrawals`} type="number" value={details.monthlyWithdrawals} onChange={(e) => handleLevelChange(level, 'monthlyWithdrawals', e.target.value)} /></div>
                                    </div>
                                    <div className='flex gap-2'><Button onClick={() => handleSaveLevel(level)} className="mt-4">Save Level {level}</Button><Button onClick={() => deleteLevel(level)} variant="destructive" size="sm" className="mt-4">Delete Level {level}</Button></div>
                                </div>
                            )})}
                        </div>
                    </ScrollArea>
                    <div className="mt-4 flex gap-4"><Button onClick={handleAddNewLevel} variant="secondary">Add New Level</Button></div>
                </CardContent>
            </Card>
            <Card className="card-gradient-orange-red p-6">
                <CardHeader><CardTitle className="text-purple-300">Manage Restriction Messages</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="h-96 custom-scrollbar">
                       <div className="space-y-4">
                            {localRestrictions.map(r => (
                                <div key={r.id} className="bg-black/20 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor={`restriction-active-${r.id}`} className="flex items-center gap-2 text-base font-bold text-yellow-300"><Switch id={`restriction-active-${r.id}`} checked={r.isActive} onCheckedChange={checked => handleRestrictionChange(r.id, 'isActive', checked)} />{r.title}</Label>
                                        <Button variant="destructive" size="sm" onClick={() => deleteRestrictionMessage(r.id)}>Delete</Button>
                                    </div>
                                    <div><Label htmlFor={`restriction-${r.id}-title`}>Title</Label><Input id={`restriction-${r.id}-title`} value={r.title} onChange={e => handleRestrictionChange(r.id, 'title', e.target.value)} /></div>
                                    <div><Label htmlFor={`restriction-${r.id}-type`}>Type</Label>
                                        <Select value={r.type} onValueChange={(value: RestrictionMessage['type']) => handleRestrictionChange(r.id, 'type', value)}>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="deposit_no_address">Deposit - No Address</SelectItem>
                                                <SelectItem value="deposit_confirm">Deposit - Confirmation</SelectItem>
                                                <SelectItem value="withdrawal_hold">Withdrawal - Hold Period</SelectItem>
                                                <SelectItem value="withdrawal_monthly_limit">Withdrawal - Monthly Limit</SelectItem>
                                                <SelectItem value="withdrawal_initial_deposit">Withdrawal - Initial Deposit</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div><Label htmlFor={`restriction-${r.id}-message`}>Message</Label><Textarea id={`restriction-${r.id}-message`} value={r.message} onChange={e => handleRestrictionChange(r.id, 'message', e.target.value)} /></div>
                                    {r.type === 'withdrawal_hold' && (<div><Label htmlFor={`restriction-${r.id}-duration`}>Duration (Days)</Label><Input id={`restriction-${r.id}-duration`} type="number" value={r.durationDays || 0} onChange={e => handleRestrictionChange(r.id, 'durationDays', Number(e.target.value))} /></div>)}
                                    {r.type === 'withdrawal_initial_deposit' && (<div><Label htmlFor={`restriction-${r.id}-percentage`}>Withdrawable Principal (%)</Label><Input id={`restriction-${r.id}-percentage`} type="number" value={r.withdrawalPercentage ?? 0} onChange={e => handleRestrictionChange(r.id, 'withdrawalPercentage', Number(e.target.value))} /></div>)}
                                </div>
                            ))}
                       </div>
                    </ScrollArea>
                    <div className="mt-4 flex gap-4"><Button onClick={handleSaveRestrictions}>Save Restriction Changes</Button><Button onClick={handleAddNewRestriction} variant="secondary">Add New Restriction</Button></div>
                </CardContent>
            </Card>
             <Card className="card-gradient-blue-purple p-6">
                <CardHeader><CardTitle className="text-purple-300">Manage Team Settings</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    {/* Team Commission Settings */}
                    <div className='p-4 rounded-lg bg-black/20'>
                        <div className="flex items-center justify-between"><Label htmlFor="team-commission-enabled" className="text-lg">Enable Team Commissions</Label><Switch id="team-commission-enabled" checked={localTeamCommissionSettings.isEnabled} onCheckedChange={checked => handleTeamCommissionChange('isEnabled', checked)} /></div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div><Label htmlFor="l1-rate">L1 Rate (%)</Label><Input id="l1-rate" type="number" value={localTeamCommissionSettings.rates.level1 * 100} onChange={e => handleTeamCommissionChange('level1', Number(e.target.value) / 100)} disabled={!localTeamCommissionSettings.isEnabled} /></div>
                            <div><Label htmlFor="l2-rate">L2 Rate (%)</Label><Input id="l2-rate" type="number" value={localTeamCommissionSettings.rates.level2 * 100} onChange={e => handleTeamCommissionChange('level2', Number(e.target.value) / 100)} disabled={!localTeamCommissionSettings.isEnabled} /></div>
                            <div><Label htmlFor="l3-rate">L3 Rate (%)</Label><Input id="l3-rate" type="number" value={localTeamCommissionSettings.rates.level3 * 100} onChange={e => handleTeamCommissionChange('level3', Number(e.target.value) / 100)} disabled={!localTeamCommissionSettings.isEnabled} /></div>
                        </div>
                        <Button onClick={handleSaveTeamCommissionSettings} className="mt-4">Save Commission Settings</Button>
                    </div>

                    {/* Team Size Rewards */}
                    <div className='p-4 rounded-lg bg-black/20'>
                         <h4 className="text-lg mb-2">Team Size Rewards</h4>
                        <ScrollArea className="h-60 custom-scrollbar pr-2">
                           <div className="space-y-4">
                                {localTeamSizeRewards.map(reward => (
                                    <div key={reward.id} className="bg-black/20 p-3 rounded-lg space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor={`reward-enabled-${reward.id}`} className="flex items-center gap-2"><Switch id={`reward-enabled-${reward.id}`} checked={reward.isEnabled} onCheckedChange={c => handleTeamSizeRewardChange(reward.id, 'isEnabled', c)} />Enabled</Label>
                                            <Button variant="destructive" size="icon" onClick={() => deleteTeamSizeReward(reward.id)}><Trash2/></Button>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1"><Label>Team Size</Label><Input type="number" value={reward.teamSize} onChange={e => handleTeamSizeRewardChange(reward.id, 'teamSize', Number(e.target.value))} /></div>
                                            <div className="flex-1"><Label>Reward (USDT)</Label><Input type="number" value={reward.rewardAmount} onChange={e => handleTeamSizeRewardChange(reward.id, 'rewardAmount', Number(e.target.value))} /></div>
                                        </div>
                                        <Button size="sm" onClick={() => handleSaveTeamSizeReward(reward.id)}>Save Reward</Button>
                                    </div>
                                ))}
                           </div>
                        </ScrollArea>
                         <Button onClick={addTeamSizeReward} variant="secondary" className="mt-4">Add New Size Reward</Button>
                    </div>
                    {/* Team Business Rewards */}
                    <div className='p-4 rounded-lg bg-black/20'>
                         <h4 className="text-lg mb-2">Team Business Rewards</h4>
                        <ScrollArea className="h-60 custom-scrollbar pr-2">
                           <div className="space-y-4">
                                {(localTeamBusinessRewards || []).map(reward => (
                                    <div key={reward.id} className="bg-black/20 p-3 rounded-lg space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor={`biz-reward-enabled-${reward.id}`} className="flex items-center gap-2"><Switch id={`biz-reward-enabled-${reward.id}`} checked={reward.isEnabled} onCheckedChange={c => handleTeamBusinessRewardChange(reward.id, 'isEnabled', c)} />Enabled</Label>
                                            <Button variant="destructive" size="icon" onClick={() => deleteTeamBusinessReward(reward.id)}><Trash2/></Button>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1"><Label>Team Business (USDT)</Label><Input type="number" value={reward.businessAmount} onChange={e => handleTeamBusinessRewardChange(reward.id, 'businessAmount', Number(e.target.value))} /></div>
                                            <div className="flex-1"><Label>Reward (USDT)</Label><Input type="number" value={reward.rewardAmount} onChange={e => handleTeamBusinessRewardChange(reward.id, 'rewardAmount', Number(e.target.value))} /></div>
                                        </div>
                                        <Button size="sm" onClick={() => handleSaveTeamBusinessReward(reward.id)}>Save Reward</Button>
                                    </div>
                                ))}
                           </div>
                        </ScrollArea>
                         <Button onClick={addTeamBusinessReward} variant="secondary" className="mt-4">Add New Business Reward</Button>
                    </div>
                </CardContent>
            </Card>
            <Card className="card-gradient-yellow-pink p-6">
                <CardHeader><CardTitle className="text-purple-300">Manage Recharge Addresses</CardTitle><CardDescription>Add or update the USDT addresses users will deposit to.</CardDescription></CardHeader>
                <CardContent>
                    <ScrollArea className="h-72 custom-scrollbar">
                        <div className="space-y-4">
                            {localRechargeAddresses.map((addr) => (
                                <div key={addr.id} className="bg-black/20 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor={`addr-active-${addr.id}`} className="flex items-center gap-2 text-base"><Switch id={`addr-active-${addr.id}`} checked={addr.isActive} onCheckedChange={checked => handleRechargeAddressChange(addr.id, 'isActive', checked)} />{addr.isActive ? 'Active Address' : 'Inactive Address'}</Label>
                                        <Button variant="destructive" size="icon" onClick={() => deleteRechargeAddress(addr.id)}><Trash2 /></Button>
                                    </div>
                                    <div><Label htmlFor={`addr-address-${addr.id}`}>Address</Label><Input id={`addr-address-${addr.id}`} value={addr.address} onChange={e => handleRechargeAddressChange(addr.id, 'address', e.target.value)} /></div>
                                    <div><Label htmlFor={`addr-network-${addr.id}`}>Network</Label><Input id={`addr-network-${addr.id}`} value={addr.network} onChange={e => handleRechargeAddressChange(addr.id, 'network', e.target.value)} /></div>
                                    <Button size="sm" onClick={() => handleSaveRechargeAddress(addr.id)}>Save Address</Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="mt-4"><Button onClick={addRechargeAddress} variant="secondary">Add New Address</Button></div>
                </CardContent>
            </Card>
            <Card className="card-gradient-blue-purple p-6">
                <CardHeader><CardTitle className="text-purple-300">Manage App Links</CardTitle><CardDescription>Set the URLs for the download and support buttons.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div><Label htmlFor="downloadUrl">Download App URL</Label><Input id="downloadUrl" value={localAppLinks.downloadUrl} onChange={(e) => handleAppLinksChange('downloadUrl', e.target.value)} placeholder="https://example.com/app.apk" /></div>
                    <div><Label htmlFor="supportUrl">Customer Support URL</Label><Input id="supportUrl" value={localAppLinks.supportUrl} onChange={(e) => handleAppLinksChange('supportUrl', e.target.value)} placeholder="https://t.me/your-support-channel" /></div>
                    <Button onClick={handleSaveAppLinks}>Save App Links</Button>
                </CardContent>
            </Card>
            <Card className="card-gradient-indigo-fuchsia p-6">
                <CardHeader><CardTitle className="text-purple-300">Manage Referral Bonus</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between"><Label htmlFor="bonus-enabled" className="text-lg">Enable Referral Bonus</Label><Switch id="bonus-enabled" checked={localReferralBonusSettings.isEnabled} onCheckedChange={checked => handleReferralBonusSettingsChange('isEnabled', checked)} /></div>
                    <div className="space-y-2"><Label htmlFor="bonus-amount">Bonus Amount (USDT)</Label><Input id="bonus-amount" type="number" value={localReferralBonusSettings.bonusAmount} onChange={e => handleReferralBonusSettingsChange('bonusAmount', Number(e.target.value))} disabled={!localReferralBonusSettings.isEnabled} /></div>
                     <div className="space-y-2"><Label htmlFor="min-deposit">Minimum First Deposit (USDT)</Label><Input id="min-deposit" type="number" value={localReferralBonusSettings.minDeposit} onChange={e => handleReferralBonusSettingsChange('minDeposit', Number(e.target.value))} disabled={!localReferralBonusSettings.isEnabled} /></div>
                    <Button onClick={handleSaveReferralBonusSettings}>Save Bonus Settings</Button>
                </CardContent>
            </Card>
        </div>
    );
}

const UserPanelsPanel = () => {
    const context = useContext(AppContext);
    const [localPanels, setLocalPanels] = useState<DashboardPanel[]>([]);

    useEffect(() => {
        if(context?.dashboardPanels) setLocalPanels(context.dashboardPanels);
    }, [context?.dashboardPanels]);
    
    if(!context) return null;
    const { updateDashboardPanel, addDashboardPanel, deleteDashboardPanel } = context;

    const handlePanelChange = (id: string, field: keyof DashboardPanel, value: any) => {
        setLocalPanels(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSavePanelChanges = (id: string) => {
        const panelToUpdate = localPanels.find(p => p.id === id);
        if (panelToUpdate) updateDashboardPanel(id, panelToUpdate);
    };

    return (
        <Card className="card-gradient-indigo-fuchsia p-6">
            <CardHeader>
                <CardTitle className="text-purple-300">Manage User Dashboard Panels</CardTitle>
                <CardDescription>Edit, rename, or hide panels on the user dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[70vh] custom-scrollbar">
                    <div className="space-y-4">
                        {localPanels.map(panel => (
                            <div key={panel.id} className="bg-black/20 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-lg text-yellow-300">{panel.title}</h4>
                                    {panel.isDeletable && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm">Delete Panel</Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the custom panel. This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteDashboardPanel(panel.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2"><Label htmlFor={`visible-${panel.id}`}>Visible</Label><Switch id={`visible-${panel.id}`} checked={panel.isVisible} onCheckedChange={checked => handlePanelChange(panel.id, 'isVisible', checked)} /></div>
                                {panel.isEditable && (<div><Label htmlFor={`title-${panel.id}`}>Panel Title</Label><Input id={`title-${panel.id}`} value={panel.title} onChange={e => handlePanelChange(panel.id, 'title', e.target.value)} /></div>)}
                                {panel.componentKey === 'Custom' && (<div><Label htmlFor={`content-${panel.id}`}>Panel Content (Markdown supported)</Label><Textarea id={`content-${panel.id}`} value={panel.content || ''} onChange={e => handlePanelChange(panel.id, 'content', e.target.value)} rows={5}/></div>)}
                                <Button size="sm" onClick={() => handleSavePanelChanges(panel.id)}>Save Panel</Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="mt-4"><Button onClick={addDashboardPanel} variant="secondary">Add New Custom Panel</Button></div>
            </CardContent>
        </Card>
    )
};

const NoticesPanel = () => {
    const context = useContext(AppContext);
    const [localNotices, setLocalNotices] = useState<Notice[]>([]);

    useEffect(() => {
        if(context?.notices) setLocalNotices(context.notices);
    }, [context?.notices]);

    if(!context) return null;
    const { addNotice, updateNotice, deleteNotice, notices } = context;

    const handleNoticeChange = (id: string, field: keyof Notice, value: any) => {
        setLocalNotices(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
    };
    const handleSaveNotice = (id: string) => { const noticeToUpdate = localNotices.find(n => n.id === id); if (noticeToUpdate) updateNotice(id, noticeToUpdate); };

    return (
        <Card className="card-gradient-blue-purple p-6">
            <CardHeader><CardTitle>Manage Notices &amp; Events</CardTitle><CardDescription>Create, edit, and publish global notices for all users.</CardDescription></CardHeader>
            <CardContent>
                <ScrollArea className="h-[70vh] custom-scrollbar">
                    <div className="space-y-4">
                        {(notices || []).map(notice => (
                            <div key={notice.id} className="bg-black/20 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor={`notice-active-${notice.id}`} className="flex items-center gap-2 text-base font-bold text-yellow-300"><Switch id={`notice-active-${notice.id}`} checked={notice.isActive} onCheckedChange={checked => handleNoticeChange(notice.id, 'isActive', checked)} />Active</Label>
                                    <Button variant="destructive" size="sm" onClick={() => deleteNotice(notice.id)}>Delete</Button>
                                </div>
                                <div><Label htmlFor={`notice-title-${notice.id}`}>Title</Label><Input id={`notice-title-${notice.id}`} value={notice.title} onChange={e => handleNoticeChange(notice.id, 'title', e.target.value)} /></div>
                                <div><Label htmlFor={`notice-content-${notice.id}`}>Content (Markdown supported)</Label><Textarea id={`notice-content-${notice.id}`} value={notice.content} onChange={e => handleNoticeChange(notice.id, 'content', e.target.value)} rows={4}/></div>
                                <Button size="sm" onClick={() => handleSaveNotice(notice.id)}>Save Notice</Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="mt-4"><Button onClick={addNotice} variant="secondary">Add New Notice</Button></div>
            </CardContent>
        </Card>
    );
};

const MultiSelect = ({ options, value, onChange, placeholder }: { options: { value: number, label: string }[], value: number[], onChange: (value: number[]) => void, placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabels = options.filter(opt => value.includes(opt.value)).map(opt => opt.label).join(', ');

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={isOpen} className="w-full justify-between">
                    <span className="truncate">{selectedLabels || placeholder}</span>
                    <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search levels..." />
                    <CommandEmpty>No levels found.</CommandEmpty>
                    <CommandGroup>
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                onSelect={() => {
                                    const newValue = value.includes(option.value)
                                        ? value.filter(v => v !== option.value)
                                        : [...value, option.value];
                                    onChange(newValue);
                                }}
                            >
                                <CheckCheck className={cn("mr-2 h-4 w-4", value.includes(option.value) ? "opacity-100" : "opacity-0")} />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const BoostersPanel = () => {
    const context = useContext(AppContext);
    const [localBoosterPacks, setLocalBoosterPacks] = useState<BoosterPack[]>([]);
    
    useEffect(() => {
        if(context?.boosterPacks) setLocalBoosterPacks(context.boosterPacks);
    }, [context?.boosterPacks]);

    if(!context) return null;
    const { addBoosterPack, updateBoosterPack, deleteBoosterPack, levels } = context;
    const levelOptions = Object.entries(levels).map(([level, details]) => ({ value: Number(level), label: `Level ${level} - ${details.name}` }));

    const handleBoosterChange = (id: string, field: keyof BoosterPack, value: any) => {
        setLocalBoosterPacks(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };
    const handleSaveBooster = (id: string) => { const packToUpdate = localBoosterPacks.find(p => p.id === id); if (packToUpdate) updateBoosterPack(id, packToUpdate); };

    return (
        <Card className="card-gradient-green-cyan p-6">
            <CardHeader><CardTitle>Manage Booster Packs</CardTitle><CardDescription>Create items for users to purchase to enhance their experience.</CardDescription></CardHeader>
            <CardContent>
                <ScrollArea className="h-[70vh] custom-scrollbar">
                    <div className="space-y-4">
                        {localBoosterPacks.map(pack => (
                            <div key={pack.id} className="bg-black/20 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor={`booster-active-${pack.id}`} className="flex items-center gap-2 text-base font-bold text-yellow-300"><Switch id={`booster-active-${pack.id}`} checked={pack.isActive} onCheckedChange={c => handleBoosterChange(pack.id, 'isActive', c)} />Active</Label>
                                    <Button variant="destructive" size="sm" onClick={() => deleteBoosterPack(pack.id)}>Delete</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>Name</Label><Input value={pack.name} onChange={e => handleBoosterChange(pack.id, 'name', e.target.value)} /></div>
                                    <div><Label>Type</Label>
                                        <Select value={pack.type} onValueChange={(v: BoosterPack['type']) => handleBoosterChange(pack.id, 'type', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="referral_points">Referral Points</SelectItem>
                                                <SelectItem value="interest_boost">Interest Boost</SelectItem>
                                                <SelectItem value="referral_bonus_boost">Referral Bonus Boost</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2"><Label>Description</Label><Textarea value={pack.description} onChange={e => handleBoosterChange(pack.id, 'description', e.target.value)} /></div>
                                    <div><Label>Cost (USDT)</Label><Input type="number" value={pack.cost} onChange={e => handleBoosterChange(pack.id, 'cost', Number(e.target.value))} /></div>
                                    <div>
                                        <Label>Effect Value</Label>
                                        <Input 
                                            type="number" 
                                            step={pack.type === 'referral_points' ? '1' : '0.01'}
                                            value={pack.effectValue} 
                                            onChange={e => handleBoosterChange(pack.id, 'effectValue', Number(e.target.value))} 
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            {pack.type === 'referral_points' && 'Number of points to grant.'}
                                            {pack.type === 'interest_boost' && 'Decimal interest boost (e.g., 0.01 for 1%).'}
                                            {pack.type === 'referral_bonus_boost' && 'Multiplier for bonus (e.g., 1.5 for 1.5x).'}
                                        </p>
                                    </div>
                                    {(pack.type === 'interest_boost' || pack.type === 'referral_bonus_boost') && <>
                                        <div><Label>Duration (Days)</Label><Input type="number" value={pack.durationDays || 0} onChange={e => handleBoosterChange(pack.id, 'durationDays', Number(e.target.value))} /></div>
                                        <div><Label>Duration (Hours)</Label><Input type="number" value={pack.durationHours || 0} onChange={e => handleBoosterChange(pack.id, 'durationHours', Number(e.target.value))} /></div>
                                    </>}
                                    <div className="col-span-2">
                                        <Label>Applicable Levels</Label>
                                        <MultiSelect 
                                            options={levelOptions} 
                                            value={pack.applicableLevels || []}
                                            onChange={(v) => handleBoosterChange(pack.id, 'applicableLevels', v)}
                                            placeholder="Select applicable levels (or leave blank for all)"
                                        />
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => handleSaveBooster(pack.id)}>Save Booster</Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="mt-4"><Button onClick={addBoosterPack} variant="secondary">Add New Booster</Button></div>
            </CardContent>
        </Card>
    );
};

const BoosterAnalyticsPanel = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { boosterPurchaseHistory } = context;

    return (
        <Card className="card-gradient-yellow-pink p-6">
            <CardHeader>
                <CardTitle>Booster Pack Purchase Analytics</CardTitle>
                <CardDescription>Review which boosters are most popular among users.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[70vh] custom-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Booster Name</TableHead>
                                <TableHead>User Email</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {boosterPurchaseHistory && boosterPurchaseHistory.length > 0 ? boosterPurchaseHistory.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium">{tx.note}</TableCell>
                                    <TableCell>{tx.email}</TableCell>
                                    <TableCell>{tx.amount.toFixed(2)} USDT</TableCell>
                                    <TableCell>{format(new Date(tx.timestamp), 'PPp')}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">No booster packs have been purchased yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

const PoolsPanel = () => {
    const context = useContext(AppContext);
    const [localStakingPools, setLocalStakingPools] = useState<StakingPool[]>([]);
    
    useEffect(() => {
        if(context?.stakingPools) setLocalStakingPools(context.stakingPools);
    }, [context?.stakingPools]);

    if(!context) return null;
    const { addStakingPool, updateStakingPool, deleteStakingPool, endStakingPool } = context;

    const handlePoolChange = (id: string, field: keyof StakingPool, value: any) => {
        setLocalStakingPools(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };
    const handleSavePool = (id: string) => { const poolToUpdate = localStakingPools.find(p => p.id === id); if (poolToUpdate) updateStakingPool(id, poolToUpdate); };

    return (
        <Card className="card-gradient-yellow-pink p-6">
            <CardHeader><CardTitle>Manage Staking Pools</CardTitle><CardDescription>Create high-reward, limited-time staking events.</CardDescription></CardHeader>
            <CardContent>
                 <ScrollArea className="h-[70vh] custom-scrollbar">
                    <div className="space-y-4">
                        {localStakingPools.map(pool => (
                            <div key={pool.id} className="bg-black/20 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor={`pool-active-${pool.id}`} className="flex items-center gap-2 text-base font-bold text-yellow-300"><Switch id={`pool-active-${pool.id}`} checked={pool.isActive} onCheckedChange={c => handlePoolChange(pool.id, 'isActive', c)} />Active</Label>
                                    <div className="flex gap-2">
                                        <Button variant="destructive" size="sm" onClick={() => deleteStakingPool(pool.id)}>Delete</Button>
                                        {pool.status === 'active' && <Button size="sm" variant="outline" onClick={() => endStakingPool(pool.id)}>End Pool & Pay Winner</Button>}
                                    </div>
                                </div>
                                <div><Label>Name</Label><Input value={pool.name} onChange={e => handlePoolChange(pool.id, 'name', e.target.value)} /></div>
                                <div><Label>Description</Label><Textarea value={pool.description} onChange={e => handlePoolChange(pool.id, 'description', e.target.value)} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>Min Contribution</Label><Input type="number" value={pool.minContribution} onChange={e => handlePoolChange(pool.id, 'minContribution', Number(e.target.value))} /></div>
                                    <div><Label>Max Contribution</Label><Input type="number" value={pool.maxContribution} onChange={e => handlePoolChange(pool.id, 'maxContribution', Number(e.target.value))} /></div>
                                    <div><Label>Pool Interest Rate</Label><Input type="number" step="0.01" value={pool.interestRate} onChange={e => handlePoolChange(pool.id, 'interestRate', Number(e.target.value))} /></div>
                                    <div><Label>End Date</Label><Input type="datetime-local" value={format(new Date(pool.endsAt), "yyyy-MM-dd'T'HH:mm")} onChange={e => handlePoolChange(pool.id, 'endsAt', new Date(e.target.value).getTime())} /></div>
                                </div>
                                <Button size="sm" onClick={() => handleSavePool(pool.id)}>Save Pool</Button>

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <h5 className="font-bold">Pool Status: {pool.status}</h5>
                                    <p>Total Staked: {pool.totalStaked.toFixed(2)} USDT</p>
                                    <p>Participants: {pool.participants.length}</p>
                                    {pool.status === 'completed' && pool.winners && (<p className="text-green-400">Winner: {pool.winners[0].email} won {pool.winners[0].prize.toFixed(2)} USDT</p>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="mt-4"><Button onClick={addStakingPool} variant="secondary">Add New Pool</Button></div>
            </CardContent>
        </Card>
    );
};

const VaultsPanel = () => {
    const context = useContext(AppContext);
    const [localStakingVaults, setLocalStakingVaults] = useState<StakingVault[]>([]);
    
    useEffect(() => {
        if(context?.stakingVaults) setLocalStakingVaults(context.stakingVaults);
    }, [context?.stakingVaults]);

    if(!context) return null;
    const { addStakingVault, updateStakingVault, deleteStakingVault } = context;

    const handleVaultChange = (id: string, field: keyof StakingVault, value: any) => {
        setLocalStakingVaults(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };
    const handleSaveVault = (id: string) => { const vaultToUpdate = localStakingVaults.find(v => v.id === id); if (vaultToUpdate) updateStakingVault(id, vaultToUpdate); };

    return (
        <Card className="card-gradient-indigo-fuchsia p-6">
            <CardHeader><CardTitle>Manage Staking Vaults</CardTitle><CardDescription>Create fixed-term, high-reward investment opportunities.</CardDescription></CardHeader>
            <CardContent>
                 <ScrollArea className="h-[70vh] custom-scrollbar">
                    <div className="space-y-4">
                        {localStakingVaults.map(vault => (
                            <div key={vault.id} className="bg-black/20 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor={`vault-active-${vault.id}`} className="flex items-center gap-2 text-base font-bold text-yellow-300"><Switch id={`vault-active-${vault.id}`} checked={vault.isActive} onCheckedChange={c => handleVaultChange(vault.id, 'isActive', c)} />Active</Label>
                                    <Button variant="destructive" size="sm" onClick={() => deleteStakingVault(vault.id)}>Delete</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>Name</Label><Input value={vault.name} onChange={e => handleVaultChange(vault.id, 'name', e.target.value)} /></div>
                                    <div><Label>Term (Days)</Label><Input type="number" value={vault.termDays} onChange={e => handleVaultChange(vault.id, 'termDays', Number(e.target.value))} /></div>
                                    <div><Label>Interest Rate (Annual)</Label><Input type="number" step="0.001" value={vault.interestRate} onChange={e => handleVaultChange(vault.id, 'interestRate', Number(e.target.value))} /></div>
                                    <div><Label>Min Investment</Label><Input type="number" value={vault.minInvestment} onChange={e => handleVaultChange(vault.id, 'minInvestment', Number(e.target.value))} /></div>
                                    <div><Label>Max Investment</Label><Input type="number" value={vault.maxInvestment} onChange={e => handleVaultChange(vault.id, 'maxInvestment', Number(e.target.value))} /></div>
                                </div>
                                <Button size="sm" onClick={() => handleSaveVault(vault.id)}>Save Vault</Button>

                                <div className="mt-4 pt-4 border-t border-white/10 text-sm">
                                    <h5 className="font-bold">Vault Stats</h5>
                                    <p>Total Invested: {vault.totalInvested.toFixed(2)} USDT</p>
                                    <p>Total Investors: {vault.totalInvestors}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="mt-4"><Button onClick={addStakingVault} variant="secondary">Add New Vault</Button></div>
            </CardContent>
        </Card>
    );
};


const FloatingMenu = ({ items, onSelect }: { items: { view: AdminModalView, label: string, icon: React.ElementType }[], onSelect: (view: AdminModalView) => void }) => {
    const [isOpen, setIsOpen] = useState(false);

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
                        <ScrollArea className="h-auto max-h-[60vh] pr-4 -mr-4 custom-scrollbar">
                            <div className="flex flex-col items-end gap-3">
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
                            </div>
                        </ScrollArea>
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

export default AdminDashboard;
