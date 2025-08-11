

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLinks, BackgroundTheme, DashboardPanel, FloatingActionButtonSettings, FloatingActionItem, Level, RechargeAddress, ReferralBonusSettings, RestrictionMessage, Transaction } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import RequestViewExamples from './RequestViewExamples';
import { ArrowDownCircle, ArrowUpCircle, Badge, CheckCircle, GripVertical, KeyRound, ShieldCheck, ShieldX, Trash2, UserCog } from 'lucide-react';

const AdminDashboard = () => {
  const context = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserForAdmin | null>(null);
  const [localWebsiteTitle, setLocalWebsiteTitle] = useState('');
  const [localStartScreenTitle, setLocalStartScreenTitle] = useState('');
  const [localStartScreenSubtitle, setLocalStartScreenSubtitle] = useState('');
  const [localLevels, setLocalLevels] = useState<{[key: number]: Level}>({});
  const [localRestrictions, setLocalRestrictions] = useState<RestrictionMessage[]>([]);
  const [themeColors, setThemeColors] = useState({ primary: '#2563eb', accent: '#7c3aed' });
  const [localPanels, setLocalPanels] = useState<DashboardPanel[]>([]);
  const [localReferralBonusSettings, setLocalReferralBonusSettings] = useState<ReferralBonusSettings>({ isEnabled: true, bonusAmount: 5, minDeposit: 100 });
  const [localRechargeAddresses, setLocalRechargeAddresses] = useState<RechargeAddress[]>([]);
  const [localAppLinks, setLocalAppLinks] = useState<AppLinks>({ downloadUrl: '', supportUrl: '' });
  const [localFabSettings, setLocalFabSettings] = useState<FloatingActionButtonSettings>({ isEnabled: true, items: [] });

  
  // State for editing a user
  const [editingEmail, setEditingEmail] = useState('');
  const [editingAddress, setEditingAddress] = useState('');
  const [editingBalance, setEditingBalance] = useState(0);
  const [editingLevel, setEditingLevel] = useState(0);


  useEffect(() => {
    if(context?.websiteTitle) setLocalWebsiteTitle(context.websiteTitle);
    if(context?.startScreenContent) {
        setLocalStartScreenTitle(context.startScreenContent.title);
        setLocalStartScreenSubtitle(context.startScreenContent.subtitle);
    }
    if(context?.levels) setLocalLevels(context.levels);
    if(context?.restrictionMessages) setLocalRestrictions(context.restrictionMessages);
    if(context?.dashboardPanels) setLocalPanels(context.dashboardPanels);
    if(context?.referralBonusSettings) setLocalReferralBonusSettings(context.referralBonusSettings);
    if(context?.rechargeAddresses) setLocalRechargeAddresses(context.rechargeAddresses);
    if(context?.appLinks) setLocalAppLinks(context.appLinks);
    if(context?.floatingActionButtonSettings) setLocalFabSettings(context.floatingActionButtonSettings);

  }, [context?.websiteTitle, context?.startScreenContent, context?.levels, context?.restrictionMessages, context?.dashboardPanels, context?.referralBonusSettings, context?.rechargeAddresses, context?.appLinks, context?.floatingActionButtonSettings]);
  
  useEffect(() => {
      if (searchedUser) {
          setEditingEmail(searchedUser.email);
          setEditingAddress(searchedUser.primaryWithdrawalAddress || '');
          setEditingBalance(searchedUser.balance);
          setEditingLevel(searchedUser.level);
      }
  }, [searchedUser]);

  if (!context || !context.isAdmin) {
    return <div>Access Denied.</div>;
  }

  const { 
      approveDeposit, 
      declineDeposit, 
      approveWithdrawal, 
      declineWithdrawal,
      findUser,
      updateWebsiteTitle,
      updateStartScreenContent,
      adminReferrals,
      updateLevel,
      addLevel,
      deleteLevel,
      updateRestrictionMessages,
      applyTheme,
      adminUpdateUserEmail,
      adminUpdateUserWithdrawalAddress,
      adjustUserBalance,
      adjustUserLevel,
      addRestrictionMessage,
      deleteRestrictionMessage,
      updateDashboardPanel,
      addDashboardPanel,
      deleteDashboardPanel,
      updateReferralBonusSettings,
      allPendingRequests,
      adminHistory,
      active3DTheme,
      setActive3DTheme,
      rechargeAddresses,
      addRechargeAddress,
      updateRechargeAddress,
      deleteRechargeAddress,
      updateAppLinks,
      forgotPassword,
      updateFloatingActionButtonSettings,
  } = context;

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
  
  const handleWebsiteTitleSave = () => {
      updateWebsiteTitle(localWebsiteTitle);
  }

  const handleStartScreenContentSave = () => {
      updateStartScreenContent({
          title: localStartScreenTitle,
          subtitle: localStartScreenSubtitle,
      });
  }

  const handleLevelChange = (level: number, field: keyof Level, value: string) => {
    const numericValue = Number(value);
    if (!isNaN(numericValue)) {
        setLocalLevels(prev => ({
            ...prev,
            [level]: { ...prev[level], [field]: numericValue }
        }));
    }
  };

  const handleSaveLevels = () => {
      Object.entries(localLevels).forEach(([level, details]) => {
          updateLevel(Number(level), details);
      });
  };

  const handleAddNewLevel = () => {
      const newLevelKey = Object.keys(localLevels).length;
      addLevel(newLevelKey);
  };
  
  const handleRestrictionChange = (id: string, field: keyof RestrictionMessage, value: string | boolean | number) => {
    setLocalRestrictions(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  
  const handleSaveRestrictions = () => {
      updateRestrictionMessages(localRestrictions);
  }
  
  const handleApplyTheme = () => {
      applyTheme(themeColors);
  }
  
  const handleAddNewRestriction = () => {
    addRestrictionMessage();
  }
  
  const handleReferralBonusSettingsChange = (field: keyof ReferralBonusSettings, value: any) => {
    const newSettings = {...localReferralBonusSettings, [field]: value};
    setLocalReferralBonusSettings(newSettings);
  }

  const handleSaveReferralBonusSettings = () => {
    updateReferralBonusSettings(localReferralBonusSettings);
  }
  
    const handleRechargeAddressChange = (id: string, field: keyof RechargeAddress, value: any) => {
        setLocalRechargeAddresses(prev => prev.map(addr => {
            if (addr.id === id) {
                if (field === 'isActive' && value === true) {
                    // Deactivate all other addresses if this one is being activated
                    return { ...addr, [field]: value };
                }
                return { ...addr, [field]: value };
            }
            // If another address was activated, this one should be deactivated if it was active
            if (field === 'isActive' && value === true) {
                return { ...addr, isActive: false };
            }
            return addr;
        }));
    };

    const handleSaveRechargeAddress = (id: string) => {
        const addressToUpdate = localRechargeAddresses.find(addr => addr.id === id);
        if (addressToUpdate) {
            updateRechargeAddress(id, addressToUpdate);
            // If this address was activated, we need to deactivate others in the main context
            if (addressToUpdate.isActive) {
                rechargeAddresses.forEach(addr => {
                    if (addr.id !== id && addr.isActive) {
                        updateRechargeAddress(addr.id, { isActive: false });
                    }
                });
            }
        }
    };


  const handleUserUpdate = async (field: 'email' | 'address' | 'balance' | 'level') => {
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
    }
    if (updatedUser) {
        setSearchedUser(updatedUser);
    }
  };

    const handlePanelChange = (id: string, field: keyof DashboardPanel, value: any) => {
        setLocalPanels(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSavePanelChanges = (id: string) => {
        const panelToUpdate = localPanels.find(p => p.id === id);
        if (panelToUpdate) {
            updateDashboardPanel(id, panelToUpdate);
        }
    };
    
    const getHistoryIcon = (tx: Transaction) => {
        switch(tx.type) {
            case 'deposit': return <ShieldCheck className="text-green-400 size-6" />;
            case 'withdrawal': return <ShieldX className="text-red-400 size-6" />;
            case 'admin_adjusted': return <UserCog className="text-blue-400 size-6" />;
            default: return <CheckCircle className="text-gray-400 size-6" />;
        }
    }
    
    const handleAppLinksChange = (field: keyof AppLinks, value: string) => {
        setLocalAppLinks(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveAppLinks = () => {
        updateAppLinks(localAppLinks);
    };

    const handlePasswordReset = () => {
        if (!searchedUser?.email) return;
        forgotPassword(searchedUser.email);
    };
    
    const handleFabSettingsChange = (field: keyof FloatingActionButtonSettings, value: any) => {
        setLocalFabSettings(prev => ({ ...prev, [field]: value }));
    };
    
    const handleFabItemChange = (id: string, field: keyof FloatingActionItem, value: string | undefined) => {
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
            url: '#'
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
    <GlassPanel className="w-full max-w-7xl p-8 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
        <h2 className="text-3xl font-bold text-purple-400 mb-2 text-center">Admin Panel</h2>
        <p className="text-center text-gray-400 mb-6">Manage all user deposit, withdrawal, and referral bonus requests.</p>
        
        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="history">Activity Log</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="settings">Content & UI</TabsTrigger>
                <TabsTrigger value="system">System Settings</TabsTrigger>
                <TabsTrigger value="panels">User Panels</TabsTrigger>
                <TabsTrigger value="view_examples">View Examples</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="mt-6 space-y-6">
                <Card className="card-gradient-blue-purple p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Admin Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                            <div>
                                <p className="text-sm text-gray-300">Admin Referral Code</p>
                                <p className="text-xl font-bold text-yellow-400">ADMINREF</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-300">Admin Level</p>
                                <p className="text-xl font-bold text-blue-400">5</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-300">System Funds (Admin Balance)</p>
                                <p className="text-xl font-bold text-green-400">1000205.00 USDT</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-300">Total Referral Bonuses Paid</p>
                                <p className="text-xl font-bold text-orange-400">0.00 USDT</p>
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
                                            {request.type === 'deposit' ? 
                                                <ArrowDownCircle className="text-green-400 mt-1 size-6" /> :
                                                <ArrowUpCircle className="text-red-400 mt-1 size-6" />
                                            }
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-lg">
                                                            {request.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Request
                                                            <span className={`ml-2 font-mono text-xl ${request.type === 'deposit' ? 'text-green-300' : 'text-red-300'}`}>
                                                                {request.amount.toFixed(2)} USDT
                                                            </span>
                                                        </p>
                                                        <p className="text-sm text-gray-300 font-mono">{request.email}</p>
                                                    </div>
                                                    <p className="text-xs text-gray-400">{format(new Date(request.timestamp), 'PPpp')}</p>
                                                </div>
                                                
                                                <div className="text-xs text-gray-400 space-y-1">
                                                    <p>Lvl: {request.userLevel} | Deposits: {request.userDepositCount} | Withdrawals: {request.userWithdrawalCount}</p>
                                                    <p className="break-all">Address: {request.walletAddress || request.userWithdrawalAddress}</p>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button onClick={() => request.type === 'deposit' ? approveDeposit(request.id) : approveWithdrawal(request.id)} size="sm">Approve</Button>
                                                    <Button onClick={() => request.type === 'deposit' ? declineDeposit(request.id) : declineWithdrawal(request.id)} variant="destructive" size="sm">Decline</Button>
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
            </TabsContent>

             <TabsContent value="history" className="mt-6 space-y-6">
                <Card className="card-gradient-orange-red p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Admin Activity Log</CardTitle>
                        <CardDescription>A log of all approvals, declines, and adjustments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[70vh] custom-scrollbar">
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
            </TabsContent>

            <TabsContent value="users" className="mt-6 space-y-6">
                <Card className="card-gradient-indigo-fuchsia p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">User Management</CardTitle>
                        <CardDescription>Search for a user to view and manage their details.</CardDescription>
                    </CardHeader>
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
                                <div>
                                    <h4 className="text-lg font-bold">{searchedUser.email}</h4>
                                    <p className="text-xs text-gray-400">ID: {searchedUser.id}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-email">Email</Label>
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
                                    <Label>Password Management</Label>
                                    <Button onClick={handlePasswordReset} variant="destructive" className="w-full">
                                        <KeyRound /> Send Password Reset Email
                                    </Button>
                                    <p className="text-xs text-gray-400">This will send a secure link to the user's email for them to reset their own password.</p>
                                </div>
                           </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6 space-y-6">
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
                        
                        <div className="space-y-4">
                            <Label>Button Actions</Label>
                            {localFabSettings.items.map((item, index) => (
                                <div key={item.id} className="bg-black/20 p-4 rounded-lg space-y-2">
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="cursor-grab text-gray-400" />
                                        <div className="flex-1 grid grid-cols-2 gap-2">
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

                        <div className="flex gap-4">
                            <Button onClick={handleSaveFabSettings}>Save FAB Settings</Button>
                            <Button onClick={handleAddFabItem} variant="secondary">Add New Action</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="system" className="mt-6 space-y-6">
                 <Card className="card-gradient-green-cyan p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Manage Levels</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-96 custom-scrollbar">
                        <div className="space-y-4">
                            {Object.entries(localLevels).sort(([a],[b]) => Number(a) - Number(b)).map(([level, details]) => (
                                <div key={level} className="bg-black/20 p-4 rounded-lg">
                                    <h4 className="font-bold text-lg text-yellow-300">Level {level}</h4>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <Label htmlFor={`level-${level}-minBalance`}>Min Balance</Label>
                                            <Input id={`level-${level}-minBalance`} type="number" value={details.minBalance} onChange={(e) => handleLevelChange(Number(level), 'minBalance', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`level-${level}-referrals`}>Referrals</Label>
                                            <Input id={`level-${level}-referrals`} type="number" value={details.directReferrals} onChange={(e) => handleLevelChange(Number(level), 'directReferrals', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`level-${level}-interest`}>Interest (Decimal)</Label>
                                            <Input id={`level-${level}-interest`} type="number" step="0.001" value={details.interest} onChange={(e) => handleLevelChange(Number(level), 'interest', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`level-${level}-withdrawalLimit`}>Withdrawal Limit</Label>
                                            <Input id={`level-${level}-withdrawalLimit`} type="number" value={details.withdrawalLimit} onChange={(e) => handleLevelChange(Number(level), 'withdrawalLimit', e.target.value)} />
                                        </div>
                                    </div>
                                    <Button onClick={() => deleteLevel(Number(level))} variant="destructive" size="sm" className="mt-4">Delete Level {level}</Button>
                                </div>
                            ))}
                        </div>
                        </ScrollArea>
                        <div className="mt-4 flex gap-4">
                            <Button onClick={handleSaveLevels}>Save All Level Changes</Button>
                            <Button onClick={handleAddNewLevel} variant="secondary">Add New Level</Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="card-gradient-yellow-pink p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Manage Recharge Addresses</CardTitle>
                        <CardDescription>Add or update the USDT addresses users will deposit to.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-72 custom-scrollbar">
                            <div className="space-y-4">
                                {localRechargeAddresses.map((addr) => (
                                    <div key={addr.id} className="bg-black/20 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between items-center">
                                             <Label htmlFor={`addr-active-${addr.id}`} className="flex items-center gap-2 text-base">
                                                <Switch
                                                    id={`addr-active-${addr.id}`}
                                                    checked={addr.isActive}
                                                    onCheckedChange={checked => handleRechargeAddressChange(addr.id, 'isActive', checked)}
                                                />
                                                {addr.isActive ? 'Active Address' : 'Inactive Address'}
                                            </Label>
                                            <Button variant="destructive" size="icon" onClick={() => deleteRechargeAddress(addr.id)}>
                                                <Trash2 />
                                            </Button>
                                        </div>
                                        <div>
                                            <Label htmlFor={`addr-address-${addr.id}`}>Address</Label>
                                            <Input id={`addr-address-${addr.id}`} value={addr.address} onChange={e => handleRechargeAddressChange(addr.id, 'address', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`addr-network-${addr.id}`}>Network</Label>
                                            <Input id={`addr-network-${addr.id}`} value={addr.network} onChange={e => handleRechargeAddressChange(addr.id, 'network', e.target.value)} />
                                        </div>
                                        <Button size="sm" onClick={() => handleSaveRechargeAddress(addr.id)}>Save Address</Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="mt-4">
                            <Button onClick={addRechargeAddress} variant="secondary">Add New Address</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-gradient-blue-purple p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Manage App Links</CardTitle>
                        <CardDescription>Set the URLs for the download and support buttons.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="downloadUrl">Download App URL</Label>
                            <Input
                                id="downloadUrl"
                                value={localAppLinks.downloadUrl}
                                onChange={(e) => handleAppLinksChange('downloadUrl', e.target.value)}
                                placeholder="https://example.com/app.apk"
                            />
                        </div>
                        <div>
                            <Label htmlFor="supportUrl">Customer Support URL</Label>
                            <Input
                                id="supportUrl"
                                value={localAppLinks.supportUrl}
                                onChange={(e) => handleAppLinksChange('supportUrl', e.target.value)}
                                placeholder="https://t.me/your-support-channel"
                            />
                        </div>
                        <Button onClick={handleSaveAppLinks}>Save App Links</Button>
                    </CardContent>
                </Card>
                <Card className="card-gradient-orange-red p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Manage Restriction Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-96 custom-scrollbar">
                           <div className="space-y-4">
                                {localRestrictions.map(r => (
                                    <div key={r.id} className="bg-black/20 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-lg text-yellow-300">{r.title}</h4>
                                            <Button variant="destructive" size="sm" onClick={() => deleteRestrictionMessage(r.id)}>Delete</Button>
                                        </div>
                                        <div>
                                            <Label htmlFor={`restriction-${r.id}-title`}>Title</Label>
                                            <Input id={`restriction-${r.id}-title`} value={r.title} onChange={e => handleRestrictionChange(r.id, 'title', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`restriction-${r.id}-type`}>Type</Label>
                                            <Select value={r.type} onValueChange={(value: RestrictionMessage['type']) => handleRestrictionChange(r.id, 'type', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="deposit_no_address">Deposit - No Address</SelectItem>
                                                    <SelectItem value="deposit_confirm">Deposit - Confirmation</SelectItem>
                                                    <SelectItem value="withdrawal_hold">Withdrawal - Hold</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor={`restriction-${r.id}-message`}>Message</Label>
                                            <Textarea id={`restriction-${r.id}-message`} value={r.message} onChange={e => handleRestrictionChange(r.id, 'message', e.target.value)} />
                                        </div>
                                        {r.type === 'withdrawal_hold' && (
                                            <div>
                                                <Label htmlFor={`restriction-${r.id}-duration`}>Duration (Days)</Label>
                                                <Input id={`restriction-${r.id}-duration`} type="number" value={r.durationDays || 0} onChange={e => handleRestrictionChange(r.id, 'durationDays', Number(e.target.value))} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                           </div>
                        </ScrollArea>
                        <div className="mt-4 flex gap-4">
                            <Button onClick={handleSaveRestrictions}>Save Restriction Changes</Button>
                             <Button onClick={handleAddNewRestriction} variant="secondary">Add New Restriction</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-gradient-indigo-fuchsia p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Manage Referral Bonus</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="bonus-enabled" className="text-lg">Enable Referral Bonus</Label>
                            <Switch 
                                id="bonus-enabled"
                                checked={localReferralBonusSettings.isEnabled} 
                                onCheckedChange={checked => handleReferralBonusSettingsChange('isEnabled', checked)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bonus-amount">Bonus Amount (USDT)</Label>
                            <Input 
                                id="bonus-amount"
                                type="number"
                                value={localReferralBonusSettings.bonusAmount}
                                onChange={e => handleReferralBonusSettingsChange('bonusAmount', Number(e.target.value))}
                                disabled={!localReferralBonusSettings.isEnabled}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="min-deposit">Minimum First Deposit (USDT)</Label>
                            <Input 
                                id="min-deposit"
                                type="number"
                                value={localReferralBonusSettings.minDeposit}
                                onChange={e => handleReferralBonusSettingsChange('minDeposit', Number(e.target.value))}
                                disabled={!localReferralBonusSettings.isEnabled}
                            />
                        </div>
                        <Button onClick={handleSaveReferralBonusSettings}>Save Bonus Settings</Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="panels" className="mt-6 space-y-6">
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
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm">Delete Panel</Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete the custom panel. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteDashboardPanel(panel.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Label htmlFor={`visible-${panel.id}`}>Visible</Label>
                                            <Switch
                                                id={`visible-${panel.id}`}
                                                checked={panel.isVisible}
                                                onCheckedChange={checked => handlePanelChange(panel.id, 'isVisible', checked)}
                                            />
                                        </div>
                                        {panel.isEditable && (
                                            <div>
                                                <Label htmlFor={`title-${panel.id}`}>Panel Title</Label>
                                                <Input
                                                    id={`title-${panel.id}`}
                                                    value={panel.title}
                                                    onChange={e => handlePanelChange(panel.id, 'title', e.target.value)}
                                                />
                                            </div>
                                        )}
                                        {panel.componentKey === 'Custom' && (
                                             <div>
                                                <Label htmlFor={`content-${panel.id}`}>Panel Content (Markdown supported)</Label>
                                                <Textarea
                                                    id={`content-${panel.id}`}
                                                    value={panel.content || ''}
                                                    onChange={e => handlePanelChange(panel.id, 'content', e.target.value)}
                                                    rows={5}
                                                />
                                            </div>
                                        )}

                                        <Button size="sm" onClick={() => handleSavePanelChanges(panel.id)}>Save Panel</Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="mt-4">
                            <Button onClick={addDashboardPanel} variant="secondary">Add New Custom Panel</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="view_examples" className="mt-6 space-y-6">
                <RequestViewExamples />
            </TabsContent>
            
        </Tabs>
    </GlassPanel>
  );
};

export default AdminDashboard;
