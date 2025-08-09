
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
import { Level, RestrictionMessage } from '@/lib/types';
import { Textarea } from '../ui/textarea';

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

const AdminDashboard = () => {
  const context = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserForAdmin | null>(null);
  const [localWebsiteTitle, setLocalWebsiteTitle] = useState('');
  const [localStartScreenTitle, setLocalStartScreenTitle] = useState('');
  const [localStartScreenSubtitle, setLocalStartScreenSubtitle] = useState('');
  const [localLevels, setLocalLevels] = useState<{[key: number]: Level}>({});
  const [localRestrictions, setLocalRestrictions] = useState<RestrictionMessage[]>([]);
  const [themeColors, setThemeColors] = useState({ primary: '#80b3ff', accent: '#a66eff' });

  useEffect(() => {
    if(context?.websiteTitle) setLocalWebsiteTitle(context.websiteTitle);
    if(context?.startScreenContent) {
        setLocalStartScreenTitle(context.startScreenContent.title);
        setLocalStartScreenSubtitle(context.startScreenContent.subtitle);
    }
    if(context?.levels) setLocalLevels(context.levels);
    if(context?.restrictionMessages) setLocalRestrictions(context.restrictionMessages);

  }, [context?.websiteTitle, context?.startScreenContent, context?.levels, context?.restrictionMessages]);
  
  if (!context || !context.isAdmin) {
    return <div>Access Denied.</div>;
  }

  const { 
      depositRequests, 
      approveDeposit, 
      declineDeposit, 
      withdrawalRequests, 
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
  } = context;

  const handleUserSearch = (email: string) => {
      if (!email.trim()) {
          toast({ title: "Error", description: "Please enter a user email to search.", variant: "destructive"});
          return;
      }
      const user = findUser(email);
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
  
  const handleRestrictionChange = (id: string, field: keyof RestrictionMessage, value: string | boolean) => {
    setLocalRestrictions(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  
  const handleSaveRestrictions = () => {
      updateRestrictionMessages(localRestrictions);
  }
  
  const handleApplyTheme = () => {
      applyTheme(themeColors);
  }


  return (
    <GlassPanel className="w-full max-w-7xl p-8 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
        <h2 className="text-3xl font-bold text-purple-400 mb-2 text-center">Admin Panel</h2>
        <p className="text-center text-gray-400 mb-6">Manage all user deposit, withdrawal, and referral bonus requests.</p>
        
        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="settings">Settings & UI</TabsTrigger>
                <TabsTrigger value="system">System & Levels</TabsTrigger>
                <TabsTrigger value="funds">Funds</TabsTrigger>
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
                        <CardTitle className="text-purple-300">Deposit Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-60 custom-scrollbar">
                            {depositRequests && depositRequests.filter(r => r.status === 'pending').length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-white">User</TableHead>
                                            <TableHead className="text-white">Amount</TableHead>
                                            <TableHead className="text-white">Date</TableHead>
                                            <TableHead className="text-white">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {depositRequests.filter(r => r.status === 'pending').map(request => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-mono">
                                                    <div className="font-bold">{request.email}</div>
                                                    <div className="text-xs text-gray-400">Lvl: {request.userLevel} | Deposits: {request.userDepositCount}</div>
                                                </TableCell>
                                                <TableCell className="font-mono text-green-300">{request.amount.toFixed(2)} USDT</TableCell>
                                                <TableCell className="font-mono">{format(new Date(request.timestamp), 'PPpp')}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => approveDeposit(request.id)} size="sm">Approve</Button>
                                                        <Button onClick={() => declineDeposit(request.id)} variant="destructive" size="sm">Decline</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-gray-400">No pending deposit requests.</p>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                 <Card className="card-gradient-orange-red p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Withdrawal Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-60 custom-scrollbar">
                            {withdrawalRequests && withdrawalRequests.filter(r => r.status === 'pending').length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-white">User</TableHead>
                                            <TableHead className="text-white">Amount</TableHead>
                                            <TableHead className="text-white">Address</TableHead>
                                            <TableHead className="text-white">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {withdrawalRequests.filter(r => r.status === 'pending').map(request => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-mono">
                                                    <div className="font-bold">{request.email}</div>
                                                    <div className="text-xs text-gray-400">Lvl: {request.userLevel} | Withdrawals: {request.userWithdrawalCount}</div>
                                                </TableCell>
                                                <TableCell className="font-mono text-red-300">{request.amount.toFixed(2)} USDT</TableCell>
                                                <TableCell className="font-mono text-xs break-all">{request.walletAddress}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => approveWithdrawal(request.id)} size="sm">Approve</Button>
                                                        <Button onClick={() => declineWithdrawal(request.id)} variant="destructive" size="sm">Decline</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-gray-400">No pending withdrawal requests.</p>
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
                            <Input id="primaryColor" type="color" value={themeColors.primary} onChange={(e) => setThemeColors(p => ({...p, primary: e.target.value}))} className="w-24" />
                            <Label htmlFor="accentColor">Accent Color</Label>
                            <Input id="accentColor" type="color" value={themeColors.accent} onChange={(e) => setThemeColors(p => ({...p, accent: e.target.value}))} className="w-24" />
                        </div>
                        <Button onClick={handleApplyTheme}>Apply Theme</Button>
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
                <Card className="card-gradient-orange-red p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Manage Restriction Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-96 custom-scrollbar">
                           <div className="space-y-4">
                                {localRestrictions.map(r => (
                                    <div key={r.id} className="bg-black/20 p-4 rounded-lg">
                                        <h4 className="font-bold text-lg text-yellow-300">{r.title}</h4>
                                        <div className="space-y-2 mt-2">
                                            <div>
                                                <Label htmlFor={`restriction-${r.id}-title`}>Title</Label>
                                                <Input id={`restriction-${r.id}-title`} value={r.title} onChange={e => handleRestrictionChange(r.id, 'title', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label htmlFor={`restriction-${r.id}-message`}>Message</Label>
                                                <Textarea id={`restriction-${r.id}-message`} value={r.message} onChange={e => handleRestrictionChange(r.id, 'message', e.target.value)} />
                                            </div>
                                            {r.durationDays !== undefined && (
                                                <div>
                                                    <Label htmlFor={`restriction-${r.id}-duration`}>Duration (Days)</Label>
                                                    <Input id={`restriction-${r.id}-duration`} type="number" value={r.durationDays} onChange={e => handleRestrictionChange(r.id, 'durationDays', e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                           </div>
                        </ScrollArea>
                        <div className="mt-4">
                            <Button onClick={handleSaveRestrictions}>Save Restriction Changes</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="funds" className="mt-6 space-y-6">
                <Card className="card-gradient-indigo-fuchsia p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Admin Funds Management</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold mb-2">Deposit to System Funds</h4>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="depositAmount">Amount to deposit (USDT)</Label>
                                    <Input id="depositAmount" type="number" placeholder="0.00" />
                                </div>
                                <Button className="w-full">Deposit Funds</Button>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Withdraw from System Funds</h4>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="withdrawAmount">Amount to withdraw (USDT)</Label>
                                    <Input id="withdrawAmount" type="number" placeholder="0.00" />
                                </div>
                                <div>
                                    <Label htmlFor="withdrawAddress">Custom BEP-20 Address</Label>
                                    <Input id="withdrawAddress" type="text" placeholder="0x..." />
                                </div>
                                <Button className="w-full">Withdraw Funds</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-gradient-blue-purple p-6">
                    <CardHeader>
                        <CardTitle className="text-purple-300">Manage System Deposit Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <Label htmlFor="globalDepositAddress">Set New Global Deposit Address:</Label>
                            <Input id="globalDepositAddress" type="text" placeholder="0x4D26340f3B52DCf82dd537cBF3c7e4C1D9b53BDc" className="mt-1 mb-2"/>
                            <p className="text-xs text-gray-400 mb-3">This address will be shown to all users for deposits.</p>
                            <Button className="w-full">Update Global Address</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </GlassPanel>
  );
};

export default AdminDashboard;
