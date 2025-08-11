
"use client";
import React, { useContext, useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import type { View } from '@/components/StakingApp';
import { AppContext } from '../providers/AppProvider';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { HelpCircle, KeyRound, Download, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const ForgotPasswordDialog = ({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => {
    const context = useContext(AppContext);
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (context && email) {
            context.forgotPassword(email);
            onOpenChange(false); // Close dialog on submit
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Forgot Your Password?</DialogTitle>
                <DialogDescription>
                    Enter your email address below. If an account exists, we will send you a link to reset your password.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div>
                    <Label htmlFor="forgot-email">Email Address</Label>
                    <Input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@example.com"
                        required
                    />
                </div>
                <DialogFooter>
                    <Button type="submit">Send Reset Link</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}


const StartScreen: React.FC<StartScreenProps> = ({ setView }) => {
  const context = useContext(AppContext);
  const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);

  const handleSupportClick = () => {
    if (context?.appLinks.supportUrl) {
      window.open(context.appLinks.supportUrl, '_blank');
    }
  };

  const handleDownloadClick = () => {
    if (context?.appLinks.downloadUrl) {
      window.open(context.appLinks.downloadUrl, '_blank');
    }
  };

  return (
    <Dialog open={isForgotPassOpen} onOpenChange={setIsForgotPassOpen}>
        <section className="relative text-center flex flex-col items-center justify-center overflow-hidden w-full h-full">
            <div className="relative z-10 p-8 glass-panel rounded-lg shadow-xl max-w-3xl">
                <h2 className="text-5xl font-extrabold text-white mb-6 animate-pulse">{context?.startScreenContent.title}</h2>
                <p className="text-xl text-gray-300 mb-8">
                {context?.startScreenContent.subtitle}
                </p>
                <div className="mb-8 space-y-4"></div>
                <Button
                onClick={() => setView('signup')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 h-auto"
                >
                Get Started
                </Button>
            </div>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="fixed bottom-8 right-8 rounded-full size-16 bg-accent/50 backdrop-blur-sm border-accent/20 hover:bg-accent/80">
                        <HelpCircle className="size-8" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 mr-4 mb-2">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Help & Support</h4>
                            <p className="text-sm text-muted-foreground">
                                Need help? Choose an option below.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Button variant="outline" onClick={() => setIsForgotPassOpen(true)}>
                                <KeyRound className="mr-2"/> Forgot Password
                            </Button>
                            <Button variant="outline" onClick={handleDownloadClick}>
                                <Download className="mr-2"/> Download App
                            </Button>
                             <Button variant="outline" onClick={handleSupportClick}>
                                <MessageSquare className="mr-2"/> Customer Support
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            
        </section>
        {isForgotPassOpen && <ForgotPasswordDialog onOpenChange={setIsForgotPassOpen} />}
    </Dialog>
  );
};

export default StartScreen;
