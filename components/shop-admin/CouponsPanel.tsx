'use client';

import { useState, useEffect } from 'react';
import { ShopCoupon } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Trash2, Edit2, Check, Ticket, ScanLine } from 'lucide-react';

interface CouponsPanelProps {
  shopId: number;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

interface CouponForm {
  title: string;
  description: string;
  points_cost: string;
  max_claims: string;
}

const emptyForm: CouponForm = { title: '', description: '', points_cost: '', max_claims: '' };

export default function CouponsPanel({ shopId, onError, onSuccess }: CouponsPanelProps) {
  const [coupons, setCoupons] = useState<ShopCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const fetchCoupons = () => {
    setLoading(true);
    fetch(`/api/shops/${shopId}/coupons?all=1`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchCoupons, [shopId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        points_cost: form.points_cost ? Number(form.points_cost) : 0,
        max_claims: form.max_claims ? Number(form.max_claims) : null,
      };
      const res = await fetch(
        editingId ? `/api/shops/${shopId}/coupons/${editingId}` : `/api/shops/${shopId}/coupons`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        fetchCoupons();
        resetForm();
        onSuccess(editingId ? 'Купон шинэчлэгдлээ' : 'Купон нэмэгдлээ');
      } else {
        onError('Хадгалахад алдаа гарлаа');
      }
    } catch {
      onError('Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (coupon: ShopCoupon) => {
    setEditingId(coupon.id);
    setForm({
      title: coupon.title,
      description: coupon.description || '',
      points_cost: coupon.points_cost?.toString() || '',
      max_claims: coupon.max_claims?.toString() || '',
    });
    setShowForm(true);
  };

  const handleToggleActive = async (coupon: ShopCoupon) => {
    try {
      const res = await fetch(`/api/shops/${shopId}/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: coupon.title,
          description: coupon.description,
          points_cost: coupon.points_cost,
          max_claims: coupon.max_claims,
          is_active: !coupon.is_active,
        }),
      });
      if (res.ok) fetchCoupons();
    } catch {
      onError('Шинэчлэхэд алдаа гарлаа');
    }
  };

  const handleDelete = async (id: number) => {
    const target = coupons.find((c) => c.id === id);
    if (!confirm(`"${target?.title ?? ''}" купоныг устгах уу?`)) return;
    try {
      const res = await fetch(`/api/shops/${shopId}/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        onSuccess(`"${target?.title ?? ''}" устгагдлаа`);
      } else {
        onError('Устгахад алдаа гарлаа');
      }
    } catch {
      onError('Устгахад алдаа гарлаа');
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/coupons/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(`${data.user_name}-н "${data.title}" купон амжилттай ашиглагдлаа`);
        setRedeemCode('');
      } else {
        onError(data.error || 'Алдаа гарлаа');
      }
    } catch {
      onError('Алдаа гарлаа');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">
      <Card variant="elevated" className="p-5!">
        <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-brand" />
          Купон ашиглах (кодоор)
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Купоны кодыг оруулна уу"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            className="flex-1 px-4 py-2.5 border-2 border-line rounded-card focus:border-brand focus:outline-none text-sm font-mono uppercase"
          />
          <Button type="button" variant="primary" onClick={handleRedeem} isLoading={redeeming}>
            Ашиглах
          </Button>
        </div>
      </Card>

      <Card variant="elevated" className="p-5!">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-500" />
            Купонууд
          </h2>
          {!showForm && (
            <Button type="button" variant="primary" size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Нэмэх
            </Button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 mb-5 p-4 bg-surface rounded-card">
            <Input
              id="couponTitle"
              label="Гарчиг"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Жишээ: 10% хямдрал"
              required
            />
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Тайлбар</label>
              <textarea
                className="w-full px-4 py-2.5 border-2 border-line rounded-card focus:border-brand focus:outline-none resize-none text-sm"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="couponPointsCost"
                label="Оноо шаардлага"
                type="number"
                min="0"
                value={form.points_cost}
                onChange={(e) => setForm({ ...form, points_cost: e.target.value })}
              />
              <Input
                id="couponMaxClaims"
                label="Хязгаар (заавал биш)"
                type="number"
                min="1"
                value={form.max_claims}
                onChange={(e) => setForm({ ...form, max_claims: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Болих
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={saving} className="gap-1.5">
                <Check className="w-4 h-4" />
                {editingId ? 'Хадгалах' : 'Нэмэх'}
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-surface rounded-card animate-pulse" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-subtle text-center py-6">Одоогоор купон нэмээгүй байна</p>
        ) : (
          <div className="space-y-2">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between p-3 bg-surface rounded-card">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink-strong truncate">{coupon.title}</p>
                    {!coupon.is_active && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-line text-subtle">Идэвхгүй</span>
                    )}
                  </div>
                  <p className="text-xs text-subtle">
                    {coupon.points_cost > 0 ? `${coupon.points_cost} оноо` : 'Үнэгүй'}
                    {' · '}
                    {coupon.claimed_count} авсан
                    {coupon.max_claims ? ` / ${coupon.max_claims}` : ''}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(coupon)}
                    className="px-2 py-1 text-xs font-semibold text-subtle hover:text-brand-dark transition-colors"
                  >
                    {coupon.is_active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(coupon)}
                    className="p-2 text-placeholder hover:text-brand-dark transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(coupon.id)}
                    className="p-2 text-placeholder hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
