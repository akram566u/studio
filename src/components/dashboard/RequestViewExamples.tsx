
"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import Image from 'next/image';

const RequestViewExamples = () => {
  return (
    <div className="space-y-8">
      <Card className="bg-black/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-2xl text-purple-300">Option 1: Separate Tables (Current Method)</CardTitle>
          <CardDescription className="text-gray-400">
            This format uses two distinct cards, one for deposits and one for withdrawals. It provides a clear separation but can take up more vertical space.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-gradient-green-cyan">
            <CardHeader>
              <CardTitle className="text-xl">Deposit Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Image 
                src="https://placehold.co/600x400.png"
                alt="Separate table view for deposits"
                width={600}
                height={400}
                className="rounded-md border border-white/10"
                data-ai-hint="table ui"
              />
            </CardContent>
          </Card>
          <Card className="card-gradient-orange-red">
            <CardHeader>
              <CardTitle className="text-xl">Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
                <Image 
                    src="https://placehold.co/600x400.png"
                    alt="Separate table view for withdrawals"
                    width={600}
                    height={400}
                    className="rounded-md border border-white/10"
                    data-ai-hint="table ui"
                />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      <Card className="bg-black/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-300">Option 2: Tabbed View</CardTitle>
          <CardDescription className="text-gray-400">
            This format is more space-efficient, combining both request types into a single card with tabs. It allows the admin to focus on one task at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deposits" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposits">Deposits (2)</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals (2)</TabsTrigger>
            </TabsList>
            <TabsContent value="deposits" className="mt-4">
              <p className="text-center text-gray-400 mb-2">The table for deposit requests would be displayed here.</p>
              <Image 
                src="https://placehold.co/800x300.png"
                alt="Tabbed view for deposits"
                width={800}
                height={300}
                className="rounded-md border border-white/10"
                data-ai-hint="table ui"
              />
            </TabsContent>
            <TabsContent value="withdrawals" className="mt-4">
              <p className="text-center text-gray-400 mb-2">The table for withdrawal requests would be displayed here.</p>
                <Image 
                    src="https://placehold.co/800x300.png"
                    alt="Tabbed view for withdrawals"
                    width={800}
                    height={300}
                    className="rounded-md border border-white/10"
                    data-ai-hint="table ui"
                />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card className="bg-black/20 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-2xl text-yellow-300">Option 3: Unified Feed View</CardTitle>
          <CardDescription className="text-gray-400">
            This format shows all pending requests in a single, chronological list. It provides a holistic overview but can be harder for batch processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Image 
                src="https://placehold.co/800x500.png"
                alt="Unified feed view mockup"
                width={800}
                height={500}
                className="rounded-md border border-white/10"
                data-ai-hint="feed ui"
            />
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestViewExamples;
