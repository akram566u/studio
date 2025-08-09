
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

  useEffect(() => {
    if(context?.websiteTitle) {
        setLocalWebsiteTitle(context.websiteTitle);
    }
  }, [context?.websiteTitle]);
  
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
      adminReferrals,
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

  return (
    <GlassPanel className="w-full max-w-4xl p-8 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
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

            <Card className="card-gradient-indigo-fuchsia p-6">
                <CardHeader>
                    <CardTitle className="text-purple-300">Website Name</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Input id="websiteTitle" value={localWebsiteTitle} onChange={(e) => setLocalWebsiteTitle(e.target.value)} />
                    <Button onClick={handleWebsiteTitleSave}>Update Name</Button>
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
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold">{user.email}</p>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" onClick={() => handleUserSearch(user.email)}>Manage</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Manage User: {searchedUser?.email}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            You can view user details here. Management functions like balance adjustment are in the main User Management tab.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    {searchedUser && (
                                                        <div className="text-sm space-y-2">
                                                            <p><strong>Balance:</strong> {searchedUser.balance.toFixed(2)} USDT</p>
                                                            <p><strong>Level:</strong> {searchedUser.level}</p>
                                                            <p><strong>Address:</strong> {searchedUser.primaryWithdrawalAddress || 'Not set'}</p>
                                                        </div>
                                                    )}
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Close</AlertDialogCancel>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <p className="text-xs text-gray-400 break-all">ID: {user.id}</p>
                                        <p className="text-xs text-gray-400 break-all">Address: {user.primaryWithdrawalAddress}</p>
                                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                            <p>Deposits: <span className="text-green-400">200.00 USDT</span></p>
                                            <p>Withdrawals: <span className="text-red-400">0.00 USDT</span></p>
                                            <p>Current Balance: <span className="text-yellow-400">{user.balance.toFixed(2)} USDT</span></p>
                                            <p>Direct Referrals: <span className="text-blue-400">0</span></p>
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
        </div>
    </GlassPanel>
  );
};

export default AdminDashboard;

    