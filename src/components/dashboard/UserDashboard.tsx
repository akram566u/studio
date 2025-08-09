

"use client";
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '@/components/providers/AppProvider';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Card } from '@/components/ui/card';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, UserCheck, Trash2, Edit, Clock, Send, Briefcase, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const UserDashboard = () => {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const [interestCountdown, setInterestCountdown] = useState('00h 00m 00s');
  const [withdrawalCountdown, setWithdrawalCountdown] = useState('');
  const [isWithdrawalLocked, setIsWithdrawalLocked] = useState(true);
  const [newWithdrawalAddress, setNewWithdrawalAddress] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  if (!context || !context.currentUser) {
    return <div>Loading user data...</div>;
  }
  const { currentUser, levels, updateWithdrawalAddress, deleteWithdrawalAddress, submitDepositRequest, submitWithdrawalRequest } = context;

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
  
  const handleSubmitDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
        toast({ title: "Error", description: "Please enter a valid deposit amount.", variant: "destructive" });
        return;
    }
    submitDepositRequest(amount);
    setDepositAmount('');
  };
  
  const handleSubmitWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount);
    if (isWithdrawalLocked) {
        toast({ title: "Withdrawal Locked", description: "Withdrawal is currently locked.", variant: "destructive" });
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        toast({ title: "Error", description: "Please enter a valid withdrawal amount.", variant: "destructive" });
        return;
    }
    submitWithdrawalRequest(amount);
    setWithdrawalAmount('');
  };

  const depositAddress = "0x4D26340f3B52DCf82dd537cBF3c7e4C1D9b53BDc";

  // Effect for Daily Interest Countdown
  useEffect(() => {
    if (currentUser && currentUser.level > 0) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const nextCredit = (currentUser.lastInterestCreditTime || now) + (24 * 60 * 60 * 1000);
        const distance = nextCredit - now;

        if (distance < 0) {
          setInterestCountdown('Crediting...');
          // Logic to credit interest is now in AppProvider
          return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setInterestCountdown(`${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setInterestCountdown('00h 00m 00s');
    }
  }, [currentUser, currentUser?.lastInterestCreditTime]);

  // Effect for Withdrawal Restriction Countdown
  useEffect(() => {
    if (currentUser && currentUser.firstDepositTime && currentUser.level > 0) {
      const RESTRICTION_DAYS = 45;
      const restrictionEndTime = currentUser.firstDepositTime + (RESTRICTION_DAYS * 24 * 60 * 60 * 1000);
      
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = restrictionEndTime - now;

        if (distance <= 0) {
          setIsWithdrawalLocked(false);
          setWithdrawalCountdown('Withdrawals Unlocked');
          clearInterval(timer);
          return;
        }

        setIsWithdrawalLocked(true);
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setWithdrawalCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s remaining`);

      }, 1000);
      return () => clearInterval(timer);

    } else {
        setIsWithdrawalLocked(true);
        setWithdrawalCountdown(currentUser.level === 0 ? 'Awaiting first eligible deposit.' : 'Withdrawals are locked.');
    }
  }, [currentUser?.firstDepositTime, currentUser?.level]);

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed':
        case 'credited':
        case 'approved':
            return <Badge variant="secondary" className="bg-green-700">Completed</Badge>;
        case 'pending':
            return <Badge variant="secondary" className="bg-yellow-700">Pending</Badge>;
        case 'declined':
            return <Badge variant="destructive">Declined</Badge>;
        case 'info':
            return <Badge variant="default">Info</Badge>;
        default:
            return <Badge>{status}</Badge>;
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
    <GlassPanel className="w-full max-w-7xl p-8 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="card-gradient-blue-purple p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Your Staking Overview</h3>
            <p className="text-gray-200 text-base mb-2">User ID: <span className="font-mono text-sm break-all text-blue-200">{currentUser.id}</span></p>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xl text-gray-200">Total USDT Balance:</p>
              <p className="text-4xl font-bold text-green-400">{currentUser.balance.toFixed(2)}</p>
            </div>
          </Card>

          <Card className="card-gradient-green-cyan p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Your Staking Level</h3>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xl text-gray-200">Current Level:</p>
              <LevelBadge level={currentUser.level} />
            </div>
            {levels[currentUser.level] && (
              <>
                <p className="text-xl text-gray-200 mb-2">Interest Rate: <span className="font-bold text-white">{(levels[currentUser.level].interest * 100).toFixed(2)}%</span></p>
                <p className="text-xl text-gray-200 mb-2">Min Balance: <span className="font-bold text-white">{levels[currentUser.level].minBalance} USDT</span></p>
                <p className="text-xl text-gray-200">Withdrawal Limit: <span className="font-bold text-white">{levels[currentUser.level].withdrawalLimit} USDT</span></p>
              </>
            )}
          </Card>

          <Card className="card-gradient-orange-red p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Daily Interest Credit</h3>
            <p className="text-xl text-gray-200 mb-3">Next credit in:</p>
            <p className="text-5xl font-bold text-purple-400 text-center">{interestCountdown}</p>
          </Card>

           <Card className="card-gradient-indigo-fuchsia p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Transaction History</h3>
            <ScrollArea className="h-96 custom-scrollbar">
               {currentUser.transactions && currentUser.transactions.length > 0 ? (
                 <div className="space-y-4">
                   {currentUser.transactions.map(tx => (
                     <div key={tx.id} className="flex items-start gap-3">
                       <div className="mt-1">{getIconForType(tx.type)}</div>
                       <div className="flex-1">
                         <div className="flex justify-between items-center">
                            <p className="font-semibold text-white">{tx.description}</p>
                            {getStatusBadge(tx.status)}
                         </div>
                         <p className="text-xs text-gray-400">{format(tx.timestamp, 'PPpp')}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                <p className="text-gray-400">No transactions yet.</p>
               )}
            </ScrollArea>
          </Card>

        </div>

        {/* Middle Column */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="card-gradient-yellow-pink p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Recharge USDT (BEP-20)</h3>
            <p className="text-xl text-gray-200 mb-3">Copy this address to deposit:</p>
            <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between mb-4">
              <span className="font-mono text-sm break-all text-green-300">{depositAddress}</span>
              <Button size="icon" variant="ghost" onClick={() => copyToClipboard(depositAddress)}>
                <Copy className="size-4" />
              </Button>
            </div>
            <Input 
              type="number" 
              placeholder="Amount in USDT" 
              className="mb-4 text-xl" 
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <Button className="w-full py-3 text-lg" onClick={handleSubmitDeposit}>Submit Recharge Request</Button>
          </Card>

          <Card className="card-gradient-indigo-fuchsia p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Withdraw USDT</h3>
            {isWithdrawalLocked && (
                <div className="text-center p-4 bg-red-900/50 rounded-lg mb-4">
                    <p className="text-yellow-300 font-semibold mb-2 flex items-center justify-center gap-2">
                        <AlertTriangle className="size-5" />
                        {currentUser.level === 0
                            ? "Deposit 100+ USDT to start withdrawal timer."
                            : "Withdrawal Locked"
                        }
                    </p>
                    {currentUser.level > 0 && currentUser.firstDepositTime && (
                        <div className="flex items-center justify-center gap-2 text-lg text-white">
                            <Clock className="size-5"/>
                            <span>{withdrawalCountdown}</span>
                        </div>
                    )}
                </div>
            )}
            <p className="text-xl text-gray-200 mb-3">Minimum withdrawal: 100 USDT</p>
            <Input
                type="number"
                placeholder="Amount to withdraw"
                className="mb-4 text-xl"
                value={withdrawalAmount}
                onChange={e => setWithdrawalAmount(e.target.value)}
                disabled={isWithdrawalLocked}
            />
            <Input type="text" placeholder={currentUser.primaryWithdrawalAddress || 'Not set'} value={currentUser.primaryWithdrawalAddress || ''} readOnly className="mb-4 text-xl bg-gray-800/50" />
            <Button className="w-full py-3 text-lg" onClick={handleSubmitWithdrawal} disabled={isWithdrawalLocked}>
                <Send/>Request Withdrawal
            </Button>
          </Card>

          <Card className="card-gradient-orange-red p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Manage Withdrawal Address</h3>
            <p className="text-xl text-gray-200 mb-3">Current Address:</p>
            <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between mb-4">
                <span className="font-mono text-sm break-all text-green-300">{currentUser.primaryWithdrawalAddress || 'Not set'}</span>
                {currentUser.primaryWithdrawalAddress && (
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(currentUser.primaryWithdrawalAddress)}>
                        <Copy className="size-4" />
                    </Button>
                )}
            </div>
            <Input 
              type="text" 
              placeholder="Enter new BEP-20 Address" 
              className="mb-4 text-xl" 
              value={newWithdrawalAddress}
              onChange={(e) => setNewWithdrawalAddress(e.target.value)}
            />
            <div className="flex gap-2">
                <Button className="w-full py-3 text-lg" onClick={handleUpdateAddress}><Edit />Change</Button>
                <Button variant="destructive" className="w-full py-3 text-lg" onClick={handleDeleteAddress}><Trash2 />Delete</Button>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="card-gradient-blue-purple p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Your Referral Network</h3>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xl text-gray-200">Direct Referrals:</p>
              <p className="text-4xl font-bold text-yellow-400">{currentUser.directReferrals}</p>
            </div>
            <h4 className="text-lg font-semibold mb-2 text-blue-300 mt-4">Your Referral Code:</h4>
             <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between mb-4">
              <span className="font-mono text-base break-all text-yellow-300">{currentUser.userReferralCode}</span>
              <Button size="icon" variant="ghost" onClick={() => copyToClipboard(currentUser.userReferralCode)}>
                <Copy className="size-4" />
              </Button>
            </div>
             <h4 className="text-lg font-semibold mb-2 text-blue-300">Referred Users:</h4>
             <ScrollArea className="h-40">
                <ul className="list-none space-y-2">
                    <li className="flex items-center gap-2 text-gray-300"><UserCheck className="text-green-400 size-4"/> user@example.com</li>
                    <li className="text-gray-500">No other referrals yet.</li>
                </ul>
             </ScrollArea>
          </Card>
          
          <Card className="card-gradient-green-cyan p-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-300">Staking Level Details</h3>
            <ScrollArea className="h-96 custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Level</TableHead>
                    <TableHead className="text-white">Min Balance</TableHead>
                    <TableHead className="text-white">Referrals</TableHead>
                    <TableHead className="text-white">Interest</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(levels).map(([level, details]) => (
                    <TableRow key={level}>
                      <TableCell><LevelBadge level={parseInt(level, 10)} /></TableCell>
                      <TableCell className="font-mono text-green-300">{details.minBalance} USDT</TableCell>
                      <TableCell className="font-mono text-blue-300">{details.directReferrals}</TableCell>
                      <TableCell className="font-mono text-purple-300">{(details.interest * 100).toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </GlassPanel>
  );
};

export default UserDashboard;
