"use client";
import React, { useContext } from 'react';
import { AppContext } from '@/components/providers/AppProvider';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Card } from '@/components/ui/card';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UserDashboard = () => {
  const context = useContext(AppContext);
  const { toast } = useToast();

  if (!context || !context.currentUser) {
    return <div>Loading user data...</div>;
  }
  const { currentUser } = context;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <GlassPanel className="w-full max-w-6xl p-8 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-8">
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
            <p className="text-xl text-gray-200 mb-2">Interest Rate: <span className="font-bold text-white">0.5%</span></p>
            <p className="text-xl text-gray-200 mb-2">Minimum Balance: <span className="font-bold text-white">100 USDT</span></p>
            <p className="text-xl text-gray-200">Monthly Withdrawal Limit: <span className="font-bold text-white">150 USDT</span></p>
          </Card>

          <Card className="card-gradient-orange-red p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Daily Interest Credit</h3>
            <p className="text-xl text-gray-200 mb-3">Next credit in:</p>
            <p className="text-5xl font-bold text-purple-400 text-center">23h 59m 59s</p>
          </Card>
        </div>

        {/* Middle Column */}
        <div className="md:col-span-1 space-y-8">
          <Card className="card-gradient-yellow-pink p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Recharge USDT (BEP-20)</h3>
            <p className="text-xl text-gray-200 mb-3">Copy this address to deposit:</p>
            <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between mb-4">
              <span className="font-mono text-sm break-all text-green-300">0x4D26...3BDc</span>
              <Button size="icon" variant="ghost" onClick={() => copyToClipboard('0x4D26340f3B52DCf82dd537cBF3c7e4C1D9b53BDc')}>
                <Copy className="size-4" />
              </Button>
            </div>
            <Input type="number" placeholder="Amount in USDT" className="mb-4 text-xl" />
            <Button className="w-full py-3 text-lg">Submit Recharge Request</Button>
          </Card>

          <Card className="card-gradient-indigo-fuchsia p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Withdraw USDT</h3>
            <p className="text-xl text-gray-200 mb-3">Minimum withdrawal: 100 USDT</p>
            <Input type="number" placeholder="Amount to withdraw" className="mb-4 text-xl" />
            <Input type="text" placeholder="Your BEP-20 Wallet Address" value={currentUser.primaryWithdrawalAddress} className="mb-4 text-xl" />
            <Button className="w-full py-3 text-lg">Request Withdrawal</Button>
          </Card>
        </div>

        {/* Right Column */}
        <div className="md:col-span-1 space-y-8">
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
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Transaction History</h3>
            <ScrollArea className="h-60 custom-scrollbar">
              <div className="space-y-2">
                <p className="text-gray-400">No transactions yet.</p>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </GlassPanel>
  );
};

export default UserDashboard;
