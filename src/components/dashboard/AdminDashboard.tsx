"use client";
import React, { useContext } from 'react';
import { AppContext } from '@/components/providers/AppProvider';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';


const AdminDashboard = () => {
  const context = useContext(AppContext);

  if (!context || !context.isAdmin) {
    return <div>Access Denied.</div>;
  }

  const { depositRequests, approveDeposit, withdrawalRequests, approveWithdrawal } = context;
  
  return (
    <GlassPanel className="w-full max-w-7xl p-8 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
        <h2 className="text-3xl font-bold text-purple-400 mb-6 text-center">Admin Panel</h2>
        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
                <Card className="card-gradient-blue-purple lg:col-span-2 p-6">
                    <h3 className="text-xl font-semibold mb-3 text-purple-300">Admin Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-lg text-gray-300">Admin Referrals</p>
                            <p className="text-2xl font-bold text-yellow-400">15</p>
                        </div>
                        <div>
                            <p className="text-lg text-gray-300">Admin Level</p>
                            <p className="text-2xl font-bold text-blue-400">5</p>
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
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="card-gradient-green-cyan p-6">
                        <h3 className="text-xl font-semibold mb-4 text-purple-300">Deposit Requests</h3>
                        <ScrollArea className="h-96 custom-scrollbar">
                            {depositRequests && depositRequests.filter(r => r.status === 'pending').length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-white">User Email</TableHead>
                                            <TableHead className="text-white">Amount</TableHead>
                                            <TableHead className="text-white">Date</TableHead>
                                            <TableHead className="text-white">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {depositRequests.filter(r => r.status === 'pending').map(request => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-mono">{request.email}</TableCell>
                                                <TableCell className="font-mono text-green-300">{request.amount.toFixed(2)} USDT</TableCell>
                                                <TableCell className="font-mono">{format(request.timestamp, 'PPpp')}</TableCell>
                                                <TableCell>
                                                    <Button onClick={() => approveDeposit(request.id)}>Approve</Button>
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
                                            <TableHead className="text-white">User Email</TableHead>
                                            <TableHead className="text-white">Amount</TableHead>
                                            <TableHead className="text-white">Address</TableHead>
                                            <TableHead className="text-white">Date</TableHead>
                                            <TableHead className="text-white">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {withdrawalRequests.filter(r => r.status === 'pending').map(request => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-mono">{request.email}</TableCell>
                                                <TableCell className="font-mono text-red-300">{request.amount.toFixed(2)} USDT</TableCell>
                                                <TableCell className="font-mono text-xs">{request.walletAddress}</TableCell>
                                                <TableCell className="font-mono">{format(request.timestamp, 'PPpp')}</TableCell>
                                                <TableCell>
                                                    <Button onClick={() => approveWithdrawal(request.id)}>Approve</Button>
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
                    <h3 className="text-xl font-semibold mb-4 text-purple-300">Manage User Wallets</h3>
                     <div className="mb-4 flex gap-2">
                        <Input placeholder="Search User by ID or Email..." />
                        <Button>Search User</Button>
                    </div>
                     <ScrollArea className="h-96 custom-scrollbar">
                            <p className="text-gray-400">Search for a user to manage their wallet.</p>
                    </ScrollArea>
                </Card>
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
                <Card className="card-gradient-yellow-pink p-6">
                    <h3 className="text-xl font-semibold mb-4 text-purple-300">Theme Settings & UI Options</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Select Theme:</label>
                            <Input value="Abstract Crystal" readOnly/>
                        </div>
                         <div>
                            <label className="block text-sm font-bold mb-1">Select Font:</label>
                            <Input value="Inter" readOnly/>
                        </div>
                     </div>
                     <Button className="w-full mt-4">Apply UI Settings</Button>
                </Card>
            </TabsContent>
        </Tabs>
    </GlassPanel>
  );
};

export default AdminDashboard;
