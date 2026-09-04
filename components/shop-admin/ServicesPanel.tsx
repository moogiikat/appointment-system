'use client';

import { useState, useEffect } from 'react';
import { ShopService } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Trash2, Edit2, Check, Tag } from 'lucide-react';

interface ServicesPanelProps {
  shopId: number;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

interface ServiceForm {
  name: string;
  price: string;
  duration_minutes: string;
  description: string;
}

const emptyForm: ServiceForm = { name: '', price: '', duration_minutes: '', description: '' };

export default function ServicesPanel({ shopId, onError, onSuccess }: ServicesPanelProps) {
  const [services, setServices] = useState<ShopService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchServices = () => {
    setLoading(true);
    fetch(`/api/shops/${shopId}/services`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchServices, [shopId]);

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
        name: form.name,
        price: form.price ? Number(form.price) : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        description: form.description,
      };
      const res = await fetch(
        editingId ? `/api/shops/${shopId}/services/${editingId}` : `/api/shops/${shopId}/services`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        fetchServices();
        resetForm();
        onSuccess(editingId ? 'Үйлчилгээ шинэчлэгдлээ' : 'Үйлчилгээ нэмэгдлээ');
      } else {
        onError('Хадгалахад алдаа гарлаа');
      }
    } catch {
      onError('Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: ShopService) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      price: service.price?.toString() || '',
      duration_minutes: service.duration_minutes?.toString() || '',
      description: service.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const target = services.find((s) => s.id === id);
    if (!confirm(`"${target?.name ?? ''}"-г устгах уу?`)) return;
    try {
      const res = await fetch(`/api/shops/${shopId}/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        onSuccess(`"${target?.name ?? ''}" устгагдлаа`);
      } else {
        onError('Устгахад алдаа гарлаа');
      }
    } catch {
      onError('Устгахад алдаа гарлаа');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">
      <Card variant="elevated" className="p-5!">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand" />
            Үйлчилгээ, үнийн жагсаалт
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
              id="serviceName"
              label="Нэр"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="servicePrice"
                label="Үнэ (₮)"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <Input
                id="serviceDuration"
                label="Хугацаа (минут)"
                type="number"
                min="0"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Тайлбар</label>
              <textarea
                className="w-full px-4 py-2.5 border-2 border-line rounded-card focus:border-brand focus:outline-none resize-none text-sm"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              <div key={i} className="h-14 bg-surface rounded-card animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-subtle text-center py-6">Одоогоор үйлчилгээ нэмээгүй байна</p>
        ) : (
          <div className="space-y-2">
            {services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 bg-surface rounded-card">
                <div className="min-w-0">
                  <p className="font-medium text-ink-strong truncate">{service.name}</p>
                  <p className="text-xs text-subtle">
                    {typeof service.price === 'number' && `${service.price.toLocaleString()}₮`}
                    {service.duration_minutes && ` · ${service.duration_minutes} мин`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(service)}
                    className="p-2 text-placeholder hover:text-brand-dark transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(service.id)}
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
