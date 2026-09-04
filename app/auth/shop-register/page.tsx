'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LOCATIONS, SUGGESTED_CATEGORIES } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Store, User, Lock, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ShopRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    owner_name: '',
    email: '',
    password: '',
    password_confirm: '',
    owner_phone: '',
    shop_name: '',
    category: '',
    district: '',
    address: '',
    shop_phone: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirm) {
      setError('Нууц үг хоорондоо тохирохгүй байна');
      return;
    }
    if (form.password.length < 8) {
      setError('Нууц үг дор хаяж 8 тэмдэгт байх ёстой');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/shop-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Бүртгэхэд алдаа гарлаа');
        return;
      }

      setDone(true);
      // そのまま管理画面に入れるようにログインまで済ませる
      await signIn('admin-login', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      router.push('/shop-admin');
    } catch {
      setError('Бүртгэхэд алдаа гарлаа');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card variant="elevated" className="max-w-md w-full text-center">
          <CheckCircle2 className="w-14 h-14 text-brand mx-auto mb-4" />
          <h1 className="text-lg font-bold text-ink-strong mb-2">Бүртгэл амжилттай</h1>
          <p className="text-sm text-subtle">Удирдлагын хэсэг рүү шилжиж байна...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <Link
          href="/auth/admin"
          className="inline-flex items-center gap-2 text-subtle hover:text-brand-dark mb-5 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Нэвтрэх хуудас руу
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink-strong mb-2">
            Үйлчилгээний газраа бүртгүүлэх
          </h1>
          <p className="text-sm text-subtle">
            Бүртгүүлээд шууд удирдлагын хэсэгт орно. Мэдээллээ бөглөж болно.
          </p>
        </div>

        <div className="flex items-start gap-2.5 px-4 py-3 mb-5 bg-brand-band border border-line rounded-card">
          <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <p className="text-sm text-ink">
            Бүртгүүлсний дараа <strong>админ шалгаж баталгаажуулна</strong>. Баталгаажих
            хүртэл таны газар үйлчлүүлэгчдэд харагдахгүй бөгөөд захиалга авахгүй.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card variant="elevated">
            <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
              <Store className="w-4 h-4 text-brand" />
              Үйлчилгээний газрын мэдээлэл
            </h2>
            <div className="space-y-4">
              <Input
                id="shop_name"
                label="Газрын нэр *"
                value={form.shop_name}
                onChange={set('shop_name')}
                placeholder="Жишээ: Гоо сайхны салон Номин"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-ink mb-1.5">
                    Ангилал
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={set('category')}
                    className="w-full h-12 px-3 border-2 border-line rounded-card bg-white text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="">Сонгоно уу</option>
                    {SUGGESTED_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-ink mb-1.5">
                    Байршил
                  </label>
                  <select
                    id="district"
                    value={form.district}
                    onChange={set('district')}
                    className="w-full h-12 px-3 border-2 border-line rounded-card bg-white text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="">Сонгоно уу</option>
                    {LOCATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Input id="address" label="Хаяг" value={form.address} onChange={set('address')} placeholder="УБ, ..." />
              <Input id="shop_phone" label="Газрын утас" value={form.shop_phone} onChange={set('shop_phone')} placeholder="99112233" />
            </div>
            <p className="text-xs text-subtle mt-3">
              Ангилал, дүүргийг сонгосон газар хайлтад олдоно. Дараа ч өөрчилж болно.
            </p>
          </Card>

          <Card variant="elevated">
            <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-brand" />
              Хариуцагчийн мэдээлэл
            </h2>
            <div className="space-y-4">
              <Input id="owner_name" label="Таны нэр *" value={form.owner_name} onChange={set('owner_name')} required />
              <Input id="owner_phone" label="Таны утас" value={form.owner_phone} onChange={set('owner_phone')} placeholder="99001122" />
            </div>
          </Card>

          <Card variant="elevated">
            <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand" />
              Нэвтрэх мэдээлэл
            </h2>
            <div className="space-y-4">
              <Input id="email" label="И-мэйл *" type="email" value={form.email} onChange={set('email')} required />
              <Input
                id="password"
                label="Нууц үг *"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="8-аас дээш тэмдэгт"
                required
              />
              <Input
                id="password_confirm"
                label="Нууц үг давтах *"
                type="password"
                value={form.password_confirm}
                onChange={set('password_confirm')}
                required
              />
            </div>
          </Card>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-card text-sm">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={submitting}>
            Бүртгүүлэх
          </Button>

          <p className="text-center text-sm text-subtle">
            Бүртгэлтэй юу?{' '}
            <Link href="/auth/admin" className="text-brand-dark font-bold hover:opacity-70">
              Нэвтрэх
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
