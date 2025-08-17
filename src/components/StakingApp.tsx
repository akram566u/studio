
'use client';
import { useState, useContext, useEffect } from 'react';
import { AppContext } from './providers/AppProvider';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import * as LucideIcons from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { FloatingActionItem, FloatingActionButtonSettings } from '@/lib/types';
import { cn } from '@/lib/utils';

import Header from './layout/Header';
import ThreeBackground from './layout/ThreeBackground';
import StartScreen from './start/StartScreen';
import AdminDashboard from './dashboard/AdminDashboard';
import UserDashboard from './dashboard/UserDashboard';
import { SignInForm, SignUpForm } from './auth/AuthForms';
import { GlassPanel } from './ui/GlassPanel';
import { Button } from './ui/button';

export type View = 'start' | 'signup' | 'signin' | 'user_dashboard' | 'admin_dashboard' | 'verify_email';

const VerifyEmailView: React.FC<{ setView: React.Dispatch<React.SetStateAction<View>>, email: string | null }> = ({ setView, email }) => (
    <GlassPanel className="w-full max-w-md p-8 text-center">
        <h2 className="text-3xl font-bold text-blue-400 mb-4">Verify Your Email</h2>
        <p className="text-gray-300 mb-6">
            A verification link has been sent to <span className="font-bold text-yellow-400">{email || 'your email address'}</span>. Please check your inbox and click the link to activate your account.
        </p>
        <p className="text-sm text-gray-400 mb-6">
            You can close this window. Once verified, you will be able to sign in.
        </p>
        <Button onClick={() => setView('signin')}>Back to Sign In</Button>
    </GlassPanel>
);

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
};


const ScreenSpecificFAB = ({ settings }: { settings: FloatingActionButtonSettings | undefined }) => {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);

    if (!context || !settings || !settings.isEnabled) {
        return null;
    }

    const { appLinks, layoutSettings } = context;
    const visibleItems = settings.items.filter(item => item.isEnabled);

    if (visibleItems.length === 0) return null;


    const handleActionClick = (item: FloatingActionItem) => {
        switch (item.action) {
            case 'forgot_password':
                setIsForgotPassOpen(true);
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
             default:
                toast({ title: "Action not configured", description: "This button's action is not available on this screen.", variant: "destructive" });
        }
        setIsOpen(false);
    };

    const MainIcon = (LucideIcons as any)[visibleItems[0]?.icon || 'HelpCircle'] || LucideIcons.HelpCircle;

    const positionClasses = {
        'bottom-right': 'bottom-8 right-8',
        'bottom-left': 'bottom-8 left-8',
        'top-right': 'top-24 right-8',
        'top-left': 'top-24 left-8',
    };
    
    const sizeClasses = {
        'small': 'size-12',
        'medium': 'size-16',
        'large': 'size-20',
    };
    
    const maxHeight = window.innerWidth < 768 ? layoutSettings.fabMobileMaxHeight : layoutSettings.fabDesktopMaxHeight;

    return (
        <>
        <div className={cn("fixed z-50", positionClasses[settings.position])}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className={cn("rounded-full bg-accent/50 backdrop-blur-sm border-accent/20 hover:bg-accent/80", sizeClasses[settings.size])}
                    >
                        <MainIcon className={cn(settings.size === 'large' ? "size-10" : "size-8")} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 mr-4 mb-2 p-0">
                     <div className="p-4">
                        <h4 className="font-medium leading-none">Help & Actions</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select an option below.
                        </p>
                    </div>
                    <ScrollArea style={{ maxHeight }} className="custom-scrollbar">
                        <div className="grid gap-2 p-2">
                            {visibleItems.map(item => {
                                // Exclude view switchers from the global FAB
                                if(item.action === 'switch_view_desktop' || item.action === 'switch_view_mobile') return null;

                                const ItemIcon = (LucideIcons as any)[item.icon] || LucideIcons.AlertCircle;
                                return (
                                    <Button key={item.id} variant="ghost" className="justify-start" onClick={() => handleActionClick(item)}>
                                        <ItemIcon className="mr-2"/> {item.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </div>
        <ForgotPasswordDialog open={isForgotPassOpen} onOpenChange={setIsForgotPassOpen} />
        </>
    );
};


export default function StakingApp() {
  const [view, setView] = useState<View>('start');
  const [emailForVerification, setEmailForVerification] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const context = useContext(AppContext);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!context) {
    // This can happen briefly on the very first load.
    return <div>Loading Context...</div>;
  }
  const { currentUser, isAdmin, floatingActionButtonSettings, layoutSettings } = context;

  const getActiveView = (): View => {
    if (isAdmin) return 'admin_dashboard';
    if (currentUser) return 'user_dashboard';
    return view;
  }

  const activeView = getActiveView();

  const renderView = () => {
    // Prevent rendering any view until client is mounted and auth state is known
    if (!isClient) {
        return <div>Loading...</div>;
    }
    
    switch (activeView) {
      case 'admin_dashboard':
        return <AdminDashboard />;
      case 'user_dashboard':
        return <UserDashboard />;
      case 'start':
        return <StartScreen setView={setView} />;
      case 'signup':
        return <SignUpForm setView={setView} setEmailForVerification={setEmailForVerification} />;
      case 'signin':
        return <SignInForm setView={setView} />;
      case 'verify_email':
        return <VerifyEmailView setView={setView} email={emailForVerification} />;
      default:
        return <StartScreen setView={setView} />;
    }
  };

  const getFabSettings = () => {
    if (!isClient) return undefined;
    switch(activeView) {
      case 'admin_dashboard':
        return floatingActionButtonSettings?.adminDashboard;
      case 'user_dashboard':
        return floatingActionButtonSettings?.userDashboard;
      default: // start, signin, signup, verify_email
        return floatingActionButtonSettings?.startScreen;
    }
  }
  
  const contentWidthClass = isClient
    ? window.innerWidth < 768
      ? `max-w-${layoutSettings.mobileMaxWidth}`
      : `max-w-${layoutSettings.desktopMaxWidth}`
    : 'max-w-7xl';
  
  return (
    <>
      {isClient && <ThreeBackground />}
      <Header setView={setView} />
      <main className={cn("flex-grow flex items-center justify-center p-4 z-10 w-full", contentWidthClass)}>
        {renderView()}
      </main>
      <ScreenSpecificFAB settings={getFabSettings()} />
    </>
  );
}
