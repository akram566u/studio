
"use client";
import React, { useContext, useState, useEffect } from 'react';
import { AppContext, UserForAdmin } from '@/components/providers/AppProvider';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
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
import { Textarea } from '../ui/textarea';
import { RestrictionMessage } from '@/lib/types';
import { Switch } from '../ui/switch';
import { Trash2 } from 'lucide-react';
import { LevelBadge } from '../ui/LevelBadge';


const AdminDashboard = () => {
  const context = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserForAdmin | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentLevel, setAdjustmentLevel] = useState<number>(0);
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [localMessages, setLocalMessages] = useState<RestrictionMessage[]>([]);
  const [localTitle, setLocalTitle] = useState('');
  const [localSubtitle, setLocalSubtitle] = useState('');
  const [localWebsiteTitle, setLocalWebsiteTitle] = useState('');


  useEffect(() => {
    if (context?.restrictionMessages) {
        setLocalMessages(JSON.parse(JSON.stringify(context.restrictionMessages)));
    }
    if(context?.startScreenContent) {
        setLocalTitle(context.startScreenContent.title);
        setLocalSubtitle(context.startScreenContent.subtitle);
    }
    if(context?.websiteTitle) {
        setLocalWebsiteTitle(context.websiteTitle);
    }
  }, [context?.restrictionMessages, context?.startScreenContent, context?.websiteTitle]);
  
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
      adjustUserBalance,
      adjustUserLevel,
      adminUpdateUserEmail,
      adminUpdateUserWithdrawalAddress,
      updateRestrictionMessages,
      levels,
      updateStartScreenContent,
      updateWebsiteTitle,
      adminReferrals
  } = context;

  const handleUserSearch = () => {
      if (!searchQuery.trim()) {
          toast({ title: "Error", description: "Please enter a user email to search.", variant: "destructive"});
          return;
      }
      const user = findUser(searchQuery);
      if (user) {
          setSearchedUser(user);
          setAdjustmentLevel(user.level); // Initialize with current level
          setNewEmail(user.email);
          setNewAddress(user.primaryWithdrawalAddress || '');
      } else {
          setSearchedUser(null);
          toast({ title: "Not Found", description: "No user found with that email.", variant: "destructive"});
      }
  };

  const handleBalanceAdjust = () => {
      if (!searchedUser || adjustmentAmount === 0) {
          toast({ title: "Error", description: "Please find a user and enter a non-zero amount.", variant: "destructive"});
          return;
      }
      const updatedUser = adjustUserBalance(searchedUser.id, adjustmentAmount);
      setSearchedUser(updatedUser);
      setAdjustmentAmount(0); // Reset input
  }

  const handleLevelAdjust = () => {
      if (!searchedUser) {
          toast({ title: "Error", description: "Please find a user first.", variant: "destructive"});
          return;
      }
      const updatedUser = adjustUserLevel(searchedUser.id, adjustmentLevel);
      setSearchedUser(updatedUser);
  }

  const handleEmailChange = () => {
      if (!searchedUser || !newEmail.trim()) {
          toast({ title: "Error", description: "Please find a user and enter a new email.", variant: "destructive" });
          return;
      }
      const updatedUser = adminUpdateUserEmail(searchedUser.id, newEmail);
      if (updatedUser) {
          setSearchedUser(updatedUser);
          setSearchQuery(updatedUser.email); // Update search query to new email for consistency
      }
  }

  const handleAddressChange = () => {
      if (!searchedUser || !newAddress.trim()) {
          toast({ title: "Error", description: "Please find a user and enter a new address.", variant: "destructive" });
          return;
      }
      const updatedUser = adminUpdateUserWithdrawalAddress(searchedUser.id, newAddress);
      setSearchedUser(updatedUser);
  }

  const handleMessageChange = (id: string, field: keyof RestrictionMessage, value: string | number | boolean) => {
    setLocalMessages(prev => prev.map(msg => msg.id === id ? { ...msg, [field]: value } : msg));
  };
  
  const handleSaveChanges = () => {
      updateRestrictionMessages(localMessages);
  };
  
  const handleStartScreenSave = () => {
      updateStartScreenContent({ title: localTitle, subtitle: localSubtitle });
  };
  
  const handleWebsiteTitleSave = () => {
      updateWebsiteTitle(localWebsiteTitle);
  }

  const handleAddNewMessage = () => {
    const newMessage: RestrictionMessage = {
      id: `msg_${Date.now()}`,
      title: 'New Restriction Message',
      type: 'deposit_confirm', // default type
      message: '',
      isActive: false,
    };
    setLocalMessages(prev => [...prev, newMessage]);
  };
  
  const handleDeleteMessage = (id: string) => {
      setLocalMessages(prev => prev.filter(msg => msg.id !== id));
  };
  
  return (
    <GlassPanel className="w-full max-w-7xl p-8 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
        <h2 className="text-3xl font-bold text-purple-400 mb-6 text-center">Admin Panel</h2>
        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
                <TabsTrigger value="levels">Levels</TabsTrigger>
                <TabsTrigger value="admin_referrals">Admin Referrals</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
                <Card className="card-gradient-blue-purple lg:col-span-2 p-6">
                    <h3 className="text-xl font-semibold mb-3 text-purple-300">Admin Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-lg text-gray-300">Admin Referrals</p>
                            <p className="text-2xl font-bold text-yellow-400">{adminReferrals.length}</p>
                        </div>
                        <div>
                            <p className="text-lg text-gray-300">Admin Level</p>
                            <p className="text-2xl font-bold text-blue-400">MAX</p>
                        </div>
                        <div>
                            <p className="text-lg text-gray-300">System Funds</p>
                            <p className="text-2xl font-bold text-green-400">$1,000,000</p>
                        </div>
                        <div>
                            <p className="text-lg text-gray-300">Bonuses Paid</p>
                            <p className="text-2xl font-bold text-orange-400">$5,250</p>
                        </div>
                    </div>
                </Card>
            </TabsContent>
            <TabsContent value="requests" className="mt-6">
                 <div className="grid grid-cols-1 gap-8">
                    <Card className="card-gradient-green-cyan p-6">
                        <h3 className="text-xl font-semibold mb-4 text-purple-300">Deposit Requests</h3>
                        <ScrollArea className="h-96 custom-scrollbar">
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
                    </Card>
                     <Card className="card-gradient-orange-red p-6">
                        <h3 className="text-xl font-semibold mb-4 text-purple-300">Withdrawal Requests</h3>
                        <ScrollArea className="h-96 custom-scrollbar">
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
                    </Card>
                 </div>
            </TabsContent>
             <TabsContent value="users" className="mt-6">
                <Card className="card-gradient-indigo-fuchsia p-6">
                    <h3 className="text-xl font-semibold mb-4 text-purple-300">Manage User</h3>
                     <div className="mb-4 flex gap-2">
                        <Input 
                            placeholder="Search User by Email..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                         />
                        <Button onClick={handleUserSearch}>Search User</Button>
                    </div>
                     <ScrollArea className="h-[500px] custom-scrollbar">
                        {searchedUser ? (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>User Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <p><strong>Email:</strong> {searchedUser.email}</p>
                                        <p><strong>User ID:</strong> <span className="text-xs">{searchedUser.id}</span></p>
                                        <p><strong>Current Balance:</strong> <span className="text-green-400">{searchedUser.balance.toFixed(2)} USDT</span></p>
                                        <p><strong>Current Level:</strong> {searchedUser.level}</p>
                                        <p><strong>Withdrawal Address:</strong> <span className="text-xs">{searchedUser.primaryWithdrawalAddress || 'Not set'}</span></p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Change Email</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex gap-2">
                                        <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                                        <Button onClick={handleEmailChange}>Update Email</Button>
                                    </CardContent>
                                </Card>

                                 <Card>
                                    <CardHeader>
                                        <CardTitle>Change Withdrawal Address</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex gap-2">
                                        <Input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="New BEP-20 Address" />
                                        <Button onClick={handleAddressChange}>Update Address</Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Adjust Balance</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex gap-2">
                                        <Input 
                                            type="number" 
                                            placeholder="Amount (+/-)" 
                                            value={adjustmentAmount || ''}
                                            onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value))}
                                        />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button>Adjust</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently change the user's balance by {adjustmentAmount} USDT. This action cannot be undone.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleBalanceAdjust}>Confirm Adjustment</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Adjust Level</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex gap-2">
                                         <Input 
                                            type="number"
                                            value={adjustmentLevel}
                                            onChange={(e) => setAdjustmentLevel(parseInt(e.target.value, 10))}
                                            max={5}
                                            min={0}
                                        />
                                        <Button onClick={handleLevelAdjust}>Set Level</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                             <p className="text-gray-400 text-center py-10">Search for a user to manage their details.</p>
                        )}
                    </ScrollArea>
                </Card>
            </TabsContent>
             <TabsContent value="restrictions" className="mt-6">
                <Card className="card-gradient-yellow-pink p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-purple-300">Manage Restriction Messages</h3>
                        <Button onClick={handleSaveChanges}>Save All Changes</Button>
                    </div>
                    <CardDescription className="mb-4">
                        Modify the messages shown to users for various restrictions. Use {'{durationDays}'} and {'{countdown}'} placeholders for the withdrawal hold message.
                    </CardDescription>
                    <ScrollArea className="h-[600px] custom-scrollbar">
                        <div className="space-y-6">
                            {localMessages.map(msg => (
                                <Card key={msg.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <Input 
                                                className="text-lg font-bold"
                                                value={msg.title}
                                                onChange={(e) => handleMessageChange(msg.id, 'title', e.target.value)}
                                            />
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Label>Active</Label>
                                                    <Switch
                                                        checked={msg.isActive}
                                                        onCheckedChange={(checked) => handleMessageChange(msg.id, 'isActive', checked)}
                                                    />
                                                </div>
                                                 <Button variant="destructive" size="icon" onClick={() => handleDeleteMessage(msg.id)}>
                                                    <Trash2 className="size-4"/>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>Message Content</Label>
                                            <Textarea
                                                value={msg.message}
                                                onChange={(e) => handleMessageChange(msg.id, 'message', e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        {msg.type === 'withdrawal_hold' && (
                                            <div>
                                                <Label>Hold Duration (Days)</Label>
                                                <Input
                                                    type="number"
                                                    value={msg.durationDays || 0}
                                                    onChange={(e) => handleMessageChange(msg.id, 'durationDays', parseInt(e.target.value, 10))}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                     <Button onClick={handleAddNewMessage} className="mt-4 w-full">Add New Message</Button>
                </Card>
            </TabsContent>
            <TabsContent value="levels" className="mt-6">
                <Card className="card-gradient-green-cyan p-6">
                    <h3 className="text-xl font-semibold mb-4 text-purple-300">Staking Level Configuration</h3>
                    <CardDescription>View the current level settings. Editing functionality will be added soon.</CardDescription>
                    <ScrollArea className="h-96 custom-scrollbar mt-4">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="text-white">Level</TableHead>
                            <TableHead className="text-white">Min Balance</TableHead>
                            <TableHead className="text-white">Referrals</TableHead>
                            <TableHead className="text-white">Withdraw Limit</TableHead>
                            <TableHead className="text-white">Interest</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(levels).map(([level, details]) => (
                            <TableRow key={level}>
                                <TableCell><LevelBadge level={parseInt(level, 10)} /></TableCell>
                                <TableCell className="font-mono text-green-300">{details.minBalance} USDT</TableCell>
                                <TableCell className="font-mono text-blue-300">{details.directReferrals}</TableCell>
                                <TableCell className="font-mono text-yellow-300">{details.withdrawalLimit} USDT</TableCell>
                                <TableCell className="font-mono text-purple-300">{(details.interest * 100).toFixed(2)}%</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </ScrollArea>
                </Card>
            </TabsContent>
            <TabsContent value="admin_referrals" className="mt-6">
                <Card className="card-gradient-indigo-fuchsia p-6">
                    <h3 className="text-xl font-semibold mb-4 text-purple-300">Admin Referrals</h3>
                    <CardDescription>Users who signed up with the admin referral code.</CardDescription>
                    <ScrollArea className="h-[400px] custom-scrollbar mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-white">User Email</TableHead>
                                    <TableHead className="text-white">Level</TableHead>
                                    <TableHead className="text-white">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adminReferrals.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.level}</TableCell>
                                        <TableCell className="font-mono text-green-300">{user.balance.toFixed(2)} USDT</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </Card>
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="card-gradient-yellow-pink p-6">
                        <h3 className="text-xl font-semibold mb-4 text-purple-300">General Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="websiteTitle">Website Title</Label>
                                <Input id="websiteTitle" value={localWebsiteTitle} onChange={(e) => setLocalWebsiteTitle(e.target.value)} />
                            </div>
                            <Button onClick={handleWebsiteTitleSave}>Save Website Title</Button>
                        </div>
                    </Card>
                    <Card className="card-gradient-yellow-pink p-6">
                        <h3 className="text-xl font-semibold mb-4 text-purple-300">Start Screen</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="startTitle">Main Title</Label>
                                <Input id="startTitle" value={localTitle} onChange={e => setLocalTitle(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="startSubtitle">Subtitle</Label>
                                <Textarea id="startSubtitle" value={localSubtitle} onChange={e => setLocalSubtitle(e.target.value)} />
                            </div>
                            <Button onClick={handleStartScreenSave}>Save Start Screen Content</Button>
                        </div>
                    </Card>
                    <Card className="card-gradient-blue-purple p-6 lg:col-span-2">
                        <h3 className="text-xl font-semibold mb-4 text-purple-300">Theme & UI Options</h3>
                        <CardDescription>Theme selection and other UI customizations will be available here soon.</CardDescription>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    </GlassPanel>
  );
};

export default AdminDashboard;

    