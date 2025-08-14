
"use client";
import React, { useContext, useState, useRef, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import type { View } from '@/components/StakingApp';
import { AppContext } from '../providers/AppProvider';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '../ui/popover';
import * as LucideIcons from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { FloatingActionItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

interface StartScreenProps {
  setView: React.Dispatch<React.SetStateAction<View>>;
}

const ForgotPasswordDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
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
        <Dialog open={open} onOpenChange={onOpenChange}>
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
        </Dialog>
    );
}

const DraggableFloatingActionButton = ({ onOpenChange, setMockupView }: { onOpenChange: (open: boolean) => void, setMockupView: (view: 'desktop' | 'mobile') => void }) => {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    if (!context || !context.floatingActionButtonSettings.isEnabled) {
        return null;
    }

    const { floatingActionButtonSettings, appLinks } = context;
    const visibleItems = floatingActionButtonSettings.items.filter(item => item.isEnabled);

    if (visibleItems.length === 0) return null;


    const handleActionClick = (item: FloatingActionItem) => {
        switch (item.action) {
            case 'switch_view_mobile':
                setMockupView('mobile');
                toast({ title: "View Switched", description: "Displaying mobile layout." });
                break;
            case 'switch_view_desktop':
                setMockupView('desktop');
                toast({ title: "View Switched", description: "Displaying desktop layout." });
                break;
            case 'forgot_password':
                onOpenChange(true);
                break;
            case 'download_app':
                if (appLinks.downloadUrl && appLinks.downloadUrl !== '#') {
                    window.open(appLinks.downloadUrl, '_blank');
                } else {
                    toast({ title: "Not Available", description: "Download link has not been configured.", variant: "destructive" });
                }
                break;
            case 'customer_support':
                if (appLinks.supportUrl && appLinks.supportUrl !== '#') {
                    window.open(appLinks.supportUrl, '_blank');
                } else {
                    toast({ title: "Not Available", description: "Support link has not been configured.", variant: "destructive" });
                }
                break;
            case 'custom_link':
                if (item.url && item.url !== '#') {
                    window.open(item.url, '_blank');
                } else {
                    toast({ title: "Not Available", description: "Custom link has not been configured.", variant: "destructive" });
                }
                break;
        }
        setIsOpen(false);
    };

    const MainIcon = (LucideIcons as any)[visibleItems[0]?.icon || 'HelpCircle'] || LucideIcons.HelpCircle;

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full size-16 bg-accent/50 backdrop-blur-sm border-accent/20 hover:bg-accent/80"
                    >
                        <MainIcon className="size-8" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 mr-4 mb-2 p-0">
                     <div className="p-4">
                        <h4 className="font-medium leading-none">Help & Actions</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select an option below.
                        </p>
                    </div>
                    <ScrollArea className="h-auto max-h-[60vh]">
                        <div className="grid gap-2 p-2">
                            {visibleItems.map(item => {
                                const ItemIcon = (LucideIcons as any)[item.icon] || LucideIcons.AlertCircle;
                                return (
                                    <Button key={item.id} variant="outline" onClick={() => handleActionClick(item)}>
                                        <ItemIcon className="mr-2"/> {item.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </div>
    );
};

const StartScreen: React.FC<StartScreenProps> = ({ setView }) => {
  const context = useContext(AppContext);
  const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);
  const [mockupView, setMockupView] = useState<'desktop' | 'mobile'>('desktop');

  const contentWidth = mockupView === 'desktop' ? 'max-w-4xl' : 'max-w-sm';

  return (
    <>
        <section className="relative text-center flex flex-col items-center justify-center overflow-hidden w-full h-full p-4">
            <div className={`relative z-10 p-8 glass-panel rounded-lg shadow-xl transition-all duration-500 w-full ${contentWidth}`}>
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
            
            <DraggableFloatingActionButton onOpenChange={setIsForgotPassOpen} setMockupView={setMockupView} />
            
        </section>
        <ForgotPasswordDialog open={isForgotPassOpen} onOpenChange={setIsForgotPassOpen} />
    </>
  );
};

export default StartScreen;
