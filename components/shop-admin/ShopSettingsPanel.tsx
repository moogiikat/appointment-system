'use client';

import { useState, useEffect } from 'react';
import { Shop } from '@/lib/types';
import { UB_DISTRICTS, SUGGESTED_CATEGORIES } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Store, Clock, Users, MapPin, Phone, FileText, Check, Image as ImageIcon, Plus, X, Tag, Coins } from 'lucide-react';

interface ShopSettingsPanelProps {
  shop: Shop;
  onSaved: (shop: Shop) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function ShopSettingsPanel({
  shop,
  onSaved,
  onError,
  onSuccess,
}: ShopSettingsPanelProps) {
  const [saving, setSaving] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [shopDistrict, setShopDistrict] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState(30);
  const [maxCapacity, setMaxCapacity] = useState(1);
  const [pointsPerVisit, setPointsPerVisit] = useState(0);

  useEffect(() => {
    setShopName(shop.name);
    setShopDescription(shop.description || '');
    setShopAddress(shop.address || '');
    setShopPhone(shop.phone || '');
    setShopCategory(shop.category || '');
    setShopDistrict(shop.district || '');
    setPhotos(shop.photos && shop.photos.length > 0 ? shop.photos : ['']);
    setOpeningTime(shop.opening_time?.slice(0, 5) || '09:00');
    setClosingTime(shop.closing_time?.slice(0, 5) || '18:00');
    setSlotDuration(shop.slot_duration || 30);
    setMaxCapacity(shop.max_capacity || 1);
    setPointsPerVisit(shop.points_per_visit || 0);
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shopName,
          description: shopDescription,
          address: shopAddress,
          phone: shopPhone,
          category: shopCategory,
          district: shopDistrict,
          photos: photos.map((p) => p.trim()).filter(Boolean),
          opening_time: openingTime,
          closing_time: closingTime,
          slot_duration: slotDuration,
          max_capacity: maxCapacity,
          points_per_visit: pointsPerVisit,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSaved(updated);
        onSuccess('Тохиргоо амжилттай хадгалагдлаа');
      } else {
        onError('Хадгалахад алдаа гарлаа');
      }
    } catch {
      onError('Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5 pb-6">
      <Card variant="elevated" className="p-5!">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Store className="w-4 h-4 text-sky-500" />
          Үндсэн мэдээлэл
        </h2>
        <div className="space-y-4">
          <Input id="shopName" label="Үйлчилгээний газрын нэр" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
          <Input id="shopPhone" label="Утасны дугаар" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} placeholder="99112233" />
          <Input id="shopAddress" label="Хаяг" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} placeholder="УБ, ..." />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex text-sm font-medium text-slate-700 mb-1.5 items-center gap-1.5">
                <Tag className="w-4 h-4 text-slate-400" />
                Ангилал
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-base"
                value={shopCategory}
                onChange={(e) => setShopCategory(e.target.value)}
              >
                <option value="">Сонгоно уу</option>
                {SUGGESTED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex text-sm font-medium text-slate-700 mb-1.5 items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                Дүүрэг
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-base"
                value={shopDistrict}
                onChange={(e) => setShopDistrict(e.target.value)}
              >
                <option value="">Сонгоно уу</option>
                {UB_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="flex text-sm font-medium text-slate-700 mb-1.5 items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              Зургууд (URL)
            </label>
            <div className="space-y-2">
              {photos.map((photo, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm"
                    placeholder="https://example.com/photo.jpg"
                    value={photo}
                    onChange={(e) =>
                      setPhotos((prev) => prev.map((p, i) => (i === index ? e.target.value : p)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                    className="p-2.5 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPhotos((prev) => [...prev, ''])}
                className="flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Зураг нэмэх
              </button>
            </div>
          </div>
          <div>
            <label className="flex text-sm font-medium text-slate-700 mb-1.5 items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              Тодорхойлолт
            </label>
            <textarea
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none resize-none text-base"
              rows={4}
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              placeholder="Үйлчилгээний газрын тухай..."
            />
          </div>
        </div>
      </Card>

      <Card variant="elevated" className="p-5!">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-500" />
          Ажиллах цаг
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Input id="openingTime" label="Нээх цаг" type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} />
          <Input id="closingTime" label="Хаах цаг" type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} />
        </div>
      </Card>

      <Card variant="elevated" className="p-5!">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-500" />
          Захиалгын тохиргоо
        </h2>
        <div className="space-y-4">
          <Input id="slotDuration" label="Нэг цагийн хугацаа (минут)" type="number" min="15" max="120" step="15" value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))} />
          <Input id="maxCapacity" label="Нэг цагт авах хүний тоо" type="number" min="1" max="100" value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} />
        </div>
        <p className="text-xs text-slate-500 mt-3 bg-sky-50 px-3 py-2 rounded-lg">
          Жишээ: {openingTime}–{closingTime}, {slotDuration} мин тутамд {maxCapacity} хүн захиалах боломжтой
        </p>
      </Card>

      <Card variant="elevated" className="p-5!">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-500" />
          Урамшууллын оноо
        </h2>
        <Input
          id="pointsPerVisit"
          label="Нэг захиалга дуусахад олгох оноо"
          type="number"
          min="0"
          value={pointsPerVisit}
          onChange={(e) => setPointsPerVisit(Number(e.target.value))}
        />
        <p className="text-xs text-slate-500 mt-3 bg-amber-50 px-3 py-2 rounded-lg">
          0 бол оноо олгохгүй. Хэрэглэгч захиалгаа дуусгах бүрт энэ оноог автоматаар авна.
        </p>
      </Card>

      <Card variant="bordered" className="p-4! bg-slate-50">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Урьдчилан харах</p>
        <div className="space-y-2 text-sm text-slate-600">
          {shopAddress && (
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
              {shopAddress}
            </p>
          )}
          {shopPhone && (
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-500 shrink-0" />
              {shopPhone}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-500 shrink-0" />
            {openingTime} – {closingTime} · {slotDuration} мин · {maxCapacity} хүн/цаг
          </p>
        </div>
      </Card>

      <Button type="submit" variant="primary" size="lg" className="w-full gap-2" isLoading={saving}>
        <Check className="w-5 h-5" />
        Хадгалах
      </Button>
    </form>
  );
}
