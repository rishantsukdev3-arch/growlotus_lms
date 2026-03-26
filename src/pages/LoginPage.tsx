import { useState } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {

  const { login } = useCRM();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(username, password);

    if (!success) {
      setError('Invalid credentials or inactive account');
    }

    setIsLoading(false);

  };

  return (

    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}
    >

      {/* BIG WATERMARK BACKGROUND */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/image.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "1000px",
          opacity: 0.05
        }}
      />

      <div className="w-full max-w-md animate-fade-in relative z-10">

        {/* LOGO */}
        <div className="text-center mb-6">

          <img
            src="/image.png"
            alt="Lotus Logo"
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />

          <h1 className="text-4xl font-bold text-primary-foreground tracking-wide">
            Grow Lotus
          </h1>
          <p className="text-1xl text-white/70">
            Fintech Pvt. Ltd.
          </p>

        </div>

        {/* LOGIN CARD */}

        <Card className="border border-white/20 shadow-2xl bg-white/10 backdrop-blur-xl">

          <CardHeader className="pb-4 pt-6 px-6">

            <h2 className="text-xl font-semibold text-white">
              Sign in
            </h2>

            <p className="text-sm text-white/70">
              Enter your credentials to access the dashboard
            </p>

          </CardHeader>

          <CardContent className="px-6 pb-6">

            <form onSubmit={handleLogin} className="space-y-4">

              {error && (

                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">

                  <AlertCircle className="w-4 h-4 shrink-0" />

                  {error}

                </div>

              )}

              <div className="space-y-2">

                <Label className="text-white">
                  Username
                </Label>

                <div className="relative">

                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />

                  <Input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />

                </div>

              </div>

              <div className="space-y-2">

                <Label className="text-white">
                  Password
                </Label>

                <div className="relative">

                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />

                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />

                </div>

              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >

                {isLoading ? (

                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>

                ) : (

                  'Sign In'

                )}

              </Button>

            </form>

          </CardContent>

        </Card>

      </div>

    </div>

  );

}