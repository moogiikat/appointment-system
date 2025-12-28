'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFacebookLogin = () => {
    signIn('facebook', { callbackUrl: '/' });
  };

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
        window.location.href = '/';
      }
    } catch {
      setError('Нэвтрэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100/50 via-transparent to-cyan-100/50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-sky-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl" />

      <Card variant="elevated" className="w-full max-w-md relative animate-fade-in border border-slate-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Тавтай морил</h1>
          <p className="text-slate-500 mt-2">Цаг захиалах системд нэвтэрнэ үү</p>
        </div>

        {!isAdminLogin ? (
          <>
            <Button
              variant="primary"
              size="lg"
              className="w-full mb-4"
              onClick={handleFacebookLogin}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook-ээр нэвтрэх
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">эсвэл</span>
              </div>
            </div>

            <button
              onClick={() => setIsAdminLogin(true)}
              className="w-full text-center text-sm text-slate-600 hover:text-sky-600 transition-colors font-medium"
            >
              Админ нэвтрэлт →
            </button>
          </>
        ) : (
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
              className="w-full"
              isLoading={loading}
            >
              Нэвтрэх
            </Button>

            <button
              type="button"
              onClick={() => setIsAdminLogin(false)}
              className="w-full text-center text-sm text-slate-600 hover:text-sky-600 transition-colors font-medium"
            >
              ← Facebook нэвтрэлт руу буцах
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500 mt-8">
          Нэвтрэхээр бол{' '}
          <span className="text-sky-600 font-medium">үйлчилгээний нөхцөл</span>-ийг зөвшөөрч байна
        </p>
      </Card>
    </div>
  );
}
