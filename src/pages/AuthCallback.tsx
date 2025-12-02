import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';
import logoWhite from '@/assets/logo-white.png';
import gradientBg from '@/assets/gradient-bg.jpg';
import gradientBgDark from '@/assets/gradient-bg-dark.png';

type ConfirmationStatus = 'loading' | 'success' | 'error';

const AuthCallback = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the URL hash parameters (Supabase sends tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check query params (some flows use query params)
        const queryParams = new URLSearchParams(window.location.search);
        const errorCode = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');

        if (errorCode) {
          setStatus('error');
          setErrorMessage(errorDescription || 'An error occurred during confirmation.');
          return;
        }

        if (type === 'signup' || type === 'email_change' || type === 'recovery') {
          if (accessToken && refreshToken) {
            // Set the session with the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              setStatus('error');
              setErrorMessage(error.message);
              return;
            }

            // Sign out immediately so user has to login fresh
            // This ensures a clean login flow
            await supabase.auth.signOut();
            setStatus('success');
          } else {
            // No tokens but also no error - might be already confirmed
            setStatus('success');
          }
        } else if (accessToken) {
          // Has access token without type - try to verify
          await supabase.auth.signOut();
          setStatus('success');
        } else {
          // No tokens and no type - check if there's an active session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.auth.signOut();
            setStatus('success');
          } else {
            // Nothing to process, might be direct navigation
            setStatus('success');
          }
        }
      } catch (error: any) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'An unexpected error occurred.');
      }
    };

    handleEmailConfirmation();
  }, []);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${theme === 'dark' ? gradientBgDark : gradientBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={theme === 'dark' ? logoWhite : logoFull}
              alt="Prometheus Coach"
              className="h-12"
            />
          </div>

          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
              <h2 className="text-2xl font-bold">Verifying your email...</h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your email address.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Email Confirmed!
                </h2>
                <p className="text-muted-foreground mt-2">
                  Your email has been successfully verified. You can now sign in to your account.
                </p>
              </div>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full"
                size="lg"
              >
                Continue to Sign In
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                  Verification Failed
                </h2>
                <p className="text-muted-foreground mt-2">
                  {errorMessage || 'We could not verify your email. The link may have expired.'}
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full"
                  size="lg"
                >
                  Back to Sign In
                </Button>
                <p className="text-sm text-muted-foreground">
                  Need a new confirmation link? Sign up again or contact support.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
