'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Shield } from 'lucide-react';

function AdminSignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('admin-login', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('И-мэйл эсвэл нууц үг буруу байна');
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError('Нэвтрэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="elevated" className="w-full max-w-md relative animate-fade-in border border-line">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-surface rounded-card flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-ink-strong">Админ нэвтрэлт</h1>
        <p className="text-subtle mt-2">Удирдлагын хэсэгт нэвтрэх</p>
      </div>

      <form onSubmit={handleAdminLogin} className="space-y-4">
        <Input
          id="email"
          label="И-мэйл"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
        />
        <Input
          id="password"
          label="Нууц үг"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-card text-sm font-medium">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full bg-ink-strong hover:bg-ink-strong"
          isLoading={loading}
        >
          Нэвтрэх
        </Button>
      </form>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card variant="elevated" className="w-full max-w-md relative animate-pulse border border-line">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-line rounded-card mx-auto mb-4" />
        <div className="h-8 bg-line rounded w-48 mx-auto mb-2" />
        <div className="h-4 bg-line rounded w-56 mx-auto" />
      </div>
      <div className="space-y-4">
        <div className="h-12 bg-line rounded-card" />
        <div className="h-12 bg-line rounded-card" />
        <div className="h-12 bg-line rounded-card" />
      </div>
    </Card>
  );
}

export default function AdminSignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="absolute inset-0 bg-surface" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-line-strong/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-line-strong/30 rounded-full blur-3xl" />

      <Suspense fallback={<LoadingFallback />}>
        <AdminSignInContent />
      </Suspense>
    </div>
  );
}
