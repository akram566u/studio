
"use client";
import React, { useContext, useState, useRef, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import type { View } from '@/components/StakingApp';
import { AppContext } from '../providers/AppProvider';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import * as LucideIcons from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { FloatingActionItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
    const fabRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
    const [isDragging, setIsDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && fabRef.current) {
                setPosition({
                    x: Math.max(0, Math.min(window.innerWidth - fabRef.current!.offsetWidth, e.clientX - offset.current.x)),
                    y: Math.max(0, Math.min(window.innerHeight - fabRef.current!.offsetHeight, e.clientY - offset.current.y))
                });
            }
        };

        const handleMouseUp = () => setIsDragging(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (fabRef.current) {
            offset.current = {
                x: e.clientX - fabRef.current.offsetLeft,
                y: e.clientY - fabRef.current.offsetTop,
            };
            setIsDragging(true);
        }
    };
    
    if (!context || !context.floatingActionButtonSettings.isEnabled) {
        return null;
    }

    const { floatingActionButtonSettings, appLinks } = context;

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
        }
    };

    const MainIcon = (LucideIcons as any)[floatingActionButtonSettings.items[0]?.icon || 'HelpCircle'] || LucideIcons.HelpCircle;

    return (
        <div
            ref={fabRef}
            className="fixed z-50"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <Popover>
                <PopoverTrigger asChild>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full size-16 bg-accent/50 backdrop-blur-sm border-accent/20 hover:bg-accent/80 cursor-grab active:cursor-grabbing"
                        onMouseDown={handleMouseDown}
                    >
                        <MainIcon className="size-8" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 mr-4 mb-2">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Help & Actions</h4>
                            <p className="text-sm text-muted-foreground">
                                Select an option below.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            {floatingActionButtonSettings.items.map(item => {
                                const ItemIcon = (LucideIcons as any)[item.icon] || LucideIcons.AlertCircle;
                                return (
                                    <Button key={item.id} variant="outline" onClick={() => handleActionClick(item)}>
                                        <ItemIcon className="mr-2"/> {item.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

const StartScreen: React.FC<StartScreenProps> = ({ setView }) => {
  const context = useContext(AppContext);
  const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);
  const [mockupView, setMockupView] = useState<'desktop' | 'mobile'>('desktop');

  const contentWidth = mockupView === 'desktop' ? 'max-w-3xl' : 'max-w-sm';

  return (
    <>
        <section className="relative text-center flex flex-col items-center justify-center overflow-hidden w-full h-full">
            <div className={`relative z-10 p-8 glass-panel rounded-lg shadow-xl transition-all duration-300 ${contentWidth}`}>
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
