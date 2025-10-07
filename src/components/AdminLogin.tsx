import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface AdminLoginProps {
  onLogin: () => void;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onClose }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Demo credentials
    if (
      credentials.username === 'admin' &&
      credentials.password === 'admin123'
    ) {
      onLogin();
    } else {
      toast({
        title: 'Invalid Credentials',
        description: 'Use: admin / admin123',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={credentials.username}
                  onChange={e =>
                    setCredentials(prev => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="Enter admin username"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={e =>
                      setCredentials(prev => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter password"
                    className="mt-1 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-1 h-9 w-9"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-primary"
                  disabled={
                    isLoading || !credentials.username || !credentials.password
                  }
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Demo: admin / admin123
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
