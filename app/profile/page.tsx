'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Mail, Phone, Calendar, ArrowLeft, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setName(data.name || '');
          setPhone(data.phone || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSuccess(true);
        
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.name,
          },
        });

        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Профайл шинэчлэхэд алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Систем админ';
      case 'shop_admin':
        return 'Үйлчилгээний газар админ';
      default:
        return 'Хэрэглэгч';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700';
      case 'shop_admin':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-64 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Буцах
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Миний профайл</h1>
          <p className="text-slate-500">Хувийн мэдээллээ удирдах</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <Card variant="elevated" className="mb-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center shadow-xl">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-white">
                      {name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Профайл зураг нь Facebook/Google-ээс автоматаар авагдана
              </p>
            </div>
          </Card>

          {/* Profile Info */}
          <Card variant="elevated" className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-sky-500" />
              Хувийн мэдээлэл
            </h2>

            <div className="space-y-4">
              <Input
                id="name"
                label="Нэр"
                placeholder="Таны нэр"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  И-мэйл
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 rounded-xl text-slate-600">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span>{profile?.email || '-'}</span>
                  <span className="ml-auto text-xs text-slate-400">Өөрчлөх боломжгүй</span>
                </div>
              </div>

              <Input
                id="phone"
                label="Утасны дугаар"
                placeholder="99001122"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </Card>

          {/* Account Info */}
          <Card variant="elevated" className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-500" />
              Бүртгэлийн мэдээлэл
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Хэрэглэгчийн төрөл</div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(profile?.role || 'customer')}`}>
                  {getRoleText(profile?.role || 'customer')}
                </span>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Бүртгүүлсэн огноо</div>
                <div className="font-medium text-slate-700">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('mn-MN')
                    : '-'}
                </div>
              </div>
            </div>
          </Card>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Профайл амжилттай шинэчлэгдлээ!
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Хадгалж байна...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Хадгалах
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
