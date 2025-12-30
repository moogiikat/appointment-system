'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminSignInPage() {
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 via-transparent to-slate-200/50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-slate-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-slate-300/30 rounded-full blur-3xl" />

      <Card variant="elevated" className="w-full max-w-md relative animate-fade-in border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Админ нэвтрэлт</h1>
          <p className="text-slate-500 mt-2">Удирдлагын хэсэгт нэвтрэх</p>
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
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full bg-slate-800 hover:bg-slate-900"
            isLoading={loading}
          >
            Нэвтрэх
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
        </div>
      </Card>
    </div>
  );
}

