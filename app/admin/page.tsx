'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shop, User } from '@/lib/types';
import { UB_DISTRICTS, SUGGESTED_CATEGORIES } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ToastContainer, useToast } from '@/components/Toast';
import { Store, Users, Plus, Edit2, Trash2, MapPin, Clock, X, Key, Copy, Check, Tag, Search, EyeOff, AlertTriangle, ShieldCheck, Ban, Clock3 } from 'lucide-react';

type AdminTab = 'shops' | 'users';

interface PasswordInfo {
  password: string;
  email: string;
  name: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('shops');
  const [shops, setShops] = useState<Shop[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();

  // 一覧の絞り込み
  const [shopQuery, setShopQuery] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [shopDistrict, setShopDistrict] = useState('');
  const [onlyHidden, setOnlyHidden] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);
  const [decidingId, setDecidingId] = useState<number | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [userRole, setUserRole] = useState('');

  // Password display state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInfo, setPasswordInfo] = useState<PasswordInfo | null>(null);
  const [copied, setCopied] = useState(false);

  // Shop form state
  const [showShopForm, setShowShopForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    icon: '',
    category: '',
    district: '',
    opening_time: '09:00',
    closing_time: '18:00',
    slot_duration: 30,
    max_capacity: 1,
  });

  // User form state
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'shop_admin',
    shop_id: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as { role?: string })?.role;
      if (userRole !== 'super_admin') {
        router.push('/');
      }
    }
  }, [status, session, router]);

  // Fetch shops
  useEffect(() => {
    async function fetchShops() {
      try {
        const res = await fetch('/api/shops');
        if (res.ok) {
          const data = await res.json();
          setShops(data);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchShops();
  }, []);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      if (activeTab !== 'users') return;
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
    if (session?.user) {
      fetchUsers();
    }
  }, [activeTab, session]);

  /*
   * category か district が空の店舗は、トップのジャンル検索・地区絞り込みから漏れる。
   * 一覧には並ぶので気づきにくく、実際に客から見つけてもらえない状態になる。
   */
  const hiddenShops = useMemo(
    () => shops.filter((s) => !s.category || !s.district),
    [shops]
  );

  // 自己登録された店舗は status='pending' で入ってくる。承認するまで客には出ない
  const pendingShops = useMemo(
    () => shops.filter((s) => s.status === 'pending'),
    [shops]
  );

  const filteredShops = useMemo(() => {
    const q = shopQuery.trim().toLowerCase();
    return shops.filter((s) => {
      if (onlyPending && s.status !== 'pending') return false;
      if (onlyHidden && s.category && s.district) return false;
      if (shopCategory && s.category !== shopCategory) return false;
      if (shopDistrict && s.district !== shopDistrict) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q)
      );
    });
  }, [shops, shopQuery, shopCategory, shopDistrict, onlyHidden, onlyPending]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (userRole && u.role !== userRole) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    });
  }, [users, userQuery, userRole]);

  // 一意制約がないので同名を作れてしまう。作る前に気づけるようにする
  const duplicateName = useMemo(() => {
    const name = shopForm.name.trim().toLowerCase();
    if (!name) return false;
    return shops.some(
      (s) => s.name.trim().toLowerCase() === name && s.id !== editingShop?.id
    );
  }, [shopForm.name, shops, editingShop]);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopForm),
      });

      if (res.ok) {
        const newShop = await res.json();
        setShops([...shops, newShop]);
        setShowShopForm(false);
        resetShopForm();
        showToast(`"${newShop.name}" нэмэгдлээ`, 'success');
      } else {
        showToast('Үйлчилгээний газар нэмэхэд алдаа гарлаа', 'error');
      }
    } catch (error) {
      console.error('Error creating shop:', error);
      showToast('Үйлчилгээний газар нэмэхэд алдаа гарлаа', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;
    setFormLoading(true);

    try {
      const res = await fetch(`/api/shops/${editingShop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopForm),
      });

      if (res.ok) {
        const updatedShop = await res.json();
        setShops(shops.map((s) => (s.id === updatedShop.id ? updatedShop : s)));
        setEditingShop(null);
        setShowShopForm(false);
        resetShopForm();
        showToast('Хадгаллаа', 'success');
      } else {
        showToast('Хадгалахад алдаа гарлаа', 'error');
      }
    } catch (error) {
      console.error('Error updating shop:', error);
      showToast('Хадгалахад алдаа гарлаа', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDecide = async (shop: Shop, status: 'approved' | 'rejected') => {
    let reason = '';
    if (status === 'rejected') {
      const input = prompt(`"${shop.name}"-г татгалзах шалтгаан:`);
      if (input === null) return;
      reason = input.trim();
      if (!reason) {
        showToast('Шалтгаан шаардлагатай', 'error');
        return;
      }
    }

    setDecidingId(shop.id);
    try {
      const res = await fetch(`/api/shops/${shop.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejection_reason: reason }),
      });
      if (res.ok) {
        const updated = await res.json();
        setShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showToast(
          status === 'approved'
            ? `"${shop.name}" баталгаажлаа. Одоо үйлчлүүлэгчдэд харагдана.`
            : `"${shop.name}"-г татгалзлаа`,
          status === 'approved' ? 'success' : 'info'
        );
      } else {
        showToast('Төлөв шинэчлэхэд алдаа гарлаа', 'error');
      }
    } catch {
      showToast('Төлөв шинэчлэхэд алдаа гарлаа', 'error');
    } finally {
      setDecidingId(null);
    }
  };

  const handleDeleteShop = async (id: number) => {
    const target = shops.find((s) => s.id === id);
    // どの店を消すのか分からないまま確認させないよう、名前を出す
    if (!confirm(`"${target?.name ?? ''}"-г устгах уу? Энэ газрын бүх захиалга хамт устана!`)) return;

    try {
      const res = await fetch(`/api/shops/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShops(shops.filter((s) => s.id !== id));
        showToast(`"${target?.name ?? ''}" устлаа`, 'success');
      } else {
        showToast('Устгахад алдаа гарлаа', 'error');
      }
    } catch (error) {
      console.error('Error deleting shop:', error);
      showToast('Устгахад алдаа гарлаа', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userForm,
          shop_id: userForm.shop_id ? Number(userForm.shop_id) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers([...users, data.user]);
        setShowUserForm(false);
        resetUserForm();
        
        // Show password modal if password was generated
        if (data.password) {
          setPasswordInfo({
            password: data.password,
            email: data.user.email,
            name: data.user.name,
          });
          setShowPasswordModal(true);
        }
        showToast(`${data.user.name} нэмэгдлээ`, 'success');
      } else {
        showToast('Хэрэглэгч нэмэхэд алдаа гарлаа', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('Хэрэглэгч нэмэхэд алдаа гарлаа', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (userId: number, userName: string, userEmail: string) => {
    if (!confirm(`${userName}-н нууц үгийг шинэчлэх үү?`)) return;

    setResetLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setPasswordInfo({
          password: data.newPassword,
          email: userEmail,
          name: userName,
        });
        setShowPasswordModal(true);
      } else {
        showToast('Нууц үг шинэчлэхэд алдаа гарлаа', 'error');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast('Нууц үг шинэчлэхэд алдаа гарлаа', 'error');
    } finally {
      setResetLoading(null);
    }
  };

  const copyPassword = async () => {
    if (passwordInfo?.password) {
      await navigator.clipboard.writeText(passwordInfo.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetShopForm = () => {
    setShopForm({
      name: '',
      description: '',
      address: '',
      phone: '',
      icon: '',
      category: '',
      district: '',
      opening_time: '09:00',
      closing_time: '18:00',
      slot_duration: 30,
      max_capacity: 1,
    });
  };

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'shop_admin',
      shop_id: '',
    });
  };

  const editShop = (shop: Shop) => {
    setEditingShop(shop);
    setShopForm({
      name: shop.name,
      description: shop.description || '',
      address: shop.address || '',
      phone: shop.phone || '',
      icon: shop.icon || '',
      category: shop.category || '',
      district: shop.district || '',
      opening_time: shop.opening_time?.slice(0, 5) || '09:00',
      closing_time: shop.closing_time?.slice(0, 5) || '18:00',
      slot_duration: shop.slot_duration || 30,
      max_capacity: shop.max_capacity || 1,
    });
    setShowShopForm(true);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-line rounded w-1/3" />
            <div className="h-64 bg-line rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Password Modal */}
        {showPasswordModal && passwordInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card variant="elevated" className="w-full max-w-md animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-ink-strong flex items-center gap-2">
                  <Key className="w-5 h-5 text-brand" />
                  Шинэ нууц үг
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInfo(null);
                    setCopied(false);
                  }}
                  className="text-placeholder hover:text-subtle"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-card p-4 mb-4">
                <p className="text-amber-800 text-sm font-medium">
                  ⚠️ Анхааруулга: Энэ нууц үгийг одоо хадгалж аваарай! Дахин харагдахгүй.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs text-subtle">Хэрэглэгч</label>
                  <p className="font-medium text-ink-strong">{passwordInfo.name}</p>
                </div>
                <div>
                  <label className="text-xs text-subtle">И-мэйл</label>
                  <p className="font-medium text-ink-strong">{passwordInfo.email}</p>
                </div>
                <div>
                  <label className="text-xs text-subtle">Нууц үг</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-surface rounded-card font-mono text-lg font-bold text-ink-strong">
                      {passwordInfo.password}
                    </code>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={copyPassword}
                      className="gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Хуулсан
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Хуулах
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInfo(null);
                  setCopied(false);
                }}
              >
                Ойлголоо, хаах
              </Button>
            </Card>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-ink-strong">Систем удирдлага</h1>
          <p className="text-subtle">Бүх үйлчилгээний газрын, хэрэглэгчдийн удирдлага</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={activeTab === 'shops' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('shops')}
            className="gap-2"
          >
            <Store className="w-4 h-4" />
            Үйлчилгээний газрын жагсаалт
          </Button>
          <Button
            variant={activeTab === 'users' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            Хэрэглэгчид
          </Button>
        </div>

        {/* Shops Tab */}
        {activeTab === 'shops' && (
          <>
            {/* Shop Form */}
            {showShopForm && (
              <Card variant="elevated" className="mb-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-ink-strong">
                    {editingShop ? 'Үйлчилгээний газар засах' : 'Шинэ үйлчилгээний газар нэмэх'}
                  </h2> 
                  <button
                    onClick={() => {
                      setShowShopForm(false);
                      setEditingShop(null);
                      resetShopForm();
                    }}
                    className="text-placeholder hover:text-subtle"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={editingShop ? handleUpdateShop : handleCreateShop}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input
                      id="name"
                      label="Үйлчилгээний газрын нэр *"
                      value={shopForm.name}
                      onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                      required
                    />
                    <Input
                      id="icon"
                      label="Зургийн URL"
                      placeholder="https://example.com/icon.jpg"
                      value={shopForm.icon}
                      onChange={(e) => setShopForm({ ...shopForm, icon: e.target.value })}
                    />
                    <Input
                      id="phone"
                      label="Утас"
                      value={shopForm.phone}
                      onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                    />
                    <Input
                      id="address"
                      label="Хаяг"
                      value={shopForm.address}
                      onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                    />
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Ангилал</label>
                      <select
                        className="w-full px-4 py-3 border-2 border-line rounded-card focus:border-brand focus:outline-none"
                        value={shopForm.category}
                        onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })}
                      >
                        <option value="">Сонгоно уу</option>
                        {SUGGESTED_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Дүүрэг</label>
                      <select
                        className="w-full px-4 py-3 border-2 border-line rounded-card focus:border-brand focus:outline-none"
                        value={shopForm.district}
                        onChange={(e) => setShopForm({ ...shopForm, district: e.target.value })}
                      >
                        <option value="">Сонгоно уу</option>
                        {UB_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        id="opening"
                        label="Нээх цаг"
                        type="time"
                        value={shopForm.opening_time}
                        onChange={(e) => setShopForm({ ...shopForm, opening_time: e.target.value })}
                      />
                      <Input
                        id="closing"
                        label="Хаах цаг"
                        type="time"
                        value={shopForm.closing_time}
                        onChange={(e) => setShopForm({ ...shopForm, closing_time: e.target.value })}
                      />
                    </div>
                    <Input
                      id="slot"
                      label="Нэг цагийн хугацаа (минут)"
                      type="number"
                      min="15"
                      max="120"
                      step="15"
                      value={shopForm.slot_duration}
                      onChange={(e) => setShopForm({ ...shopForm, slot_duration: Number(e.target.value) })}
                    />
                    <Input
                      id="capacity"
                      label="Нэг цагт авах хүний тоо"
                      type="number"
                      min="1"
                      max="100"
                      value={shopForm.max_capacity}
                      onChange={(e) => setShopForm({ ...shopForm, max_capacity: Number(e.target.value) })}
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-ink mb-1.5">Тайлбар</label>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-line rounded-card focus:border-brand focus:outline-none resize-none"
                        rows={2}
                        value={shopForm.description}
                        onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  {duplicateName && (
                    <div className="flex items-start gap-2 px-3 py-2 mb-4 bg-amber-50 border border-amber-200 rounded-control text-sm text-amber-800">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Ижил нэртэй газар аль хэдийн бүртгэлтэй байна. Давхардуулах уу?</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowShopForm(false);
                        setEditingShop(null);
                        resetShopForm();
                      }}
                    >
                      Болих
                    </Button>
                    <Button type="submit" variant="primary" isLoading={formLoading}>
                      {editingShop ? 'Хадгалах' : 'Нэмэх'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Add Shop Button */}
            {!showShopForm && (
              <Button
                variant="primary"
                onClick={() => setShowShopForm(true)}
                className="mb-6 gap-2"
              >
                <Plus className="w-4 h-4" />
                Шинэ үйлчилгээний газар нэмэх
              </Button>
            )}

            {/* 審査待ちの申請 */}
            {!loading && pendingShops.length > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-brand-band border border-brand rounded-card">
                <div className="flex items-start gap-2 text-ink">
                  <Clock3 className="w-5 h-5 shrink-0 mt-0.5 text-brand-dark" />
                  <span className="text-sm">
                    <strong>{pendingShops.length} газар</strong> баталгаажуулахыг хүлээж байна.
                    Баталгаажих хүртэл үйлчлүүлэгчдэд харагдахгүй.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOnlyPending((v) => !v)}
                  className="gap-1.5 shrink-0"
                >
                  <Clock3 className="w-4 h-4" />
                  {onlyPending ? 'Бүгдийг харах' : 'Зөвхөн эдгээрийг харах'}
                </Button>
              </div>
            )}

            {/* 客から見つからない店舗の警告 */}
            {!loading && hiddenShops.length > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-card">
                <div className="flex items-start gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-sm">
                    <strong>{hiddenShops.length} газар</strong> ангилал эсвэл дүүрэггүй байна.
                    Эдгээр нь нүүр хуудасны хайлтад <strong>харагдахгүй</strong>.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOnlyHidden((v) => !v)}
                  className="gap-1.5 shrink-0"
                >
                  <EyeOff className="w-4 h-4" />
                  {onlyHidden ? 'Бүгдийг харах' : 'Зөвхөн эдгээрийг харах'}
                </Button>
              </div>
            )}

            {/* 検索と絞り込み */}
            {!loading && shops.length > 0 && (
              <div className="bg-white rounded-card border border-line p-3 mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-placeholder" />
                  <input
                    type="text"
                    placeholder="Нэр, хаяг, утсаар хайх..."
                    value={shopQuery}
                    onChange={(e) => setShopQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-line rounded-control text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-band"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={shopCategory}
                    onChange={(e) => setShopCategory(e.target.value)}
                    aria-label="Ангилал"
                    className="h-9 px-3 border border-line rounded-control text-sm text-ink bg-white focus:border-brand focus:outline-none"
                  >
                    <option value="">Бүх ангилал</option>
                    {SUGGESTED_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={shopDistrict}
                    onChange={(e) => setShopDistrict(e.target.value)}
                    aria-label="Дүүрэг"
                    className="h-9 px-3 border border-line rounded-control text-sm text-ink bg-white focus:border-brand focus:outline-none"
                  >
                    <option value="">Бүх дүүрэг</option>
                    {UB_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="text-sm text-subtle tabular-nums ml-auto">
                    {filteredShops.length} / {shops.length} газар
                  </span>
                  {(shopQuery || shopCategory || shopDistrict || onlyHidden) && (
                    <button
                      type="button"
                      onClick={() => {
                        setShopQuery('');
                        setShopCategory('');
                        setShopDistrict('');
                        setOnlyHidden(false);
                      }}
                      className="text-sm font-bold text-brand-dark hover:opacity-70"
                    >
                      Цэвэрлэх
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Shops List */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-line rounded-card animate-pulse" />
                ))}
              </div>
            ) : shops.length === 0 ? (
              <Card variant="elevated" className="text-center py-12">
                <Store className="w-12 h-12 text-placeholder mx-auto mb-4" />
                <h3 className="font-semibold text-ink">Үйлчилгээний газар бүртгэгдээгүй</h3>
                <p className="text-subtle text-sm">Шинэ үйлчилгээний газар нэмэх товч дарна уу</p>
              </Card>
            ) : filteredShops.length === 0 ? (
              <Card variant="elevated" className="text-center py-12">
                <Search className="w-12 h-12 text-placeholder mx-auto mb-4" />
                <h3 className="font-semibold text-ink">Үр дүн олдсонгүй</h3>
                <p className="text-subtle text-sm">Хайлт эсвэл шүүлтүүрээ өөрчилнө үү</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShops.map((shop, index) => (
                  <Card
                    key={shop.id}
                    variant="elevated"
                    className={`animate-fade-in stagger-${(index % 5) + 1} opacity-0`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-card flex items-center justify-center shadow-md overflow-hidden">
                        {shop.icon ? (
                          <img src={shop.icon} alt={shop.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-brand flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{shop.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editShop(shop)}
                          className="p-2 text-placeholder hover:text-brand-dark transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteShop(shop.id)}
                          className="p-2 text-placeholder hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-ink-strong mb-2">{shop.name}</h3>
                    {shop.status === 'pending' && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-brand-dark bg-brand-band border border-brand rounded-control px-2 py-1">
                          <Clock3 className="w-3.5 h-3.5 shrink-0" />
                          Баталгаажуулахыг хүлээж байна
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 gap-1.5"
                            isLoading={decidingId === shop.id}
                            onClick={() => handleDecide(shop, 'approved')}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Баталгаажуулах
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={decidingId === shop.id}
                            onClick={() => handleDecide(shop, 'rejected')}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Татгалзах
                          </Button>
                        </div>
                      </div>
                    )}
                    {shop.status === 'rejected' && (
                      <div className="mb-2">
                        <div className="flex items-start gap-1.5 mb-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-control px-2 py-1">
                          <Ban className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            Татгалзсан
                            {shop.rejection_reason && (
                              <span className="block font-normal mt-0.5">{shop.rejection_reason}</span>
                            )}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5"
                          isLoading={decidingId === shop.id}
                          onClick={() => handleDecide(shop, 'approved')}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Дахин баталгаажуулах
                        </Button>
                      </div>
                    )}
                    {(!shop.category || !shop.district) && (
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-control px-2 py-1">
                        <EyeOff className="w-3.5 h-3.5 shrink-0" />
                        {!shop.category && !shop.district
                          ? 'Ангилал, дүүрэг алга'
                          : !shop.category
                            ? 'Ангилал алга'
                            : 'Дүүрэг алга'}
                      </div>
                    )}
                    {(shop.category || shop.district) && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {shop.category && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-band text-brand-dark">
                            <Tag className="w-3 h-3" />
                            {shop.category}
                          </span>
                        )}
                        {shop.district && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface text-subtle">
                            {shop.district}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="space-y-1 text-sm text-subtle">
                      {shop.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-brand" />
                          <span>{shop.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-brand" />
                        <span>
                          {shop.opening_time?.slice(0, 5)} - {shop.closing_time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className="text-xs text-subtle">
                        Нэг цагт: {shop.max_capacity} хүн, {shop.slot_duration} минут
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* User Form */}
            {showUserForm && (
              <Card variant="elevated" className="mb-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-ink-strong">Шинэ админ хэрэглэгч нэмэх</h2>
                  <button
                    onClick={() => {
                      setShowUserForm(false);
                      resetUserForm();
                    }}
                    className="text-placeholder hover:text-subtle"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-brand-band border border-line rounded-card p-4 mb-4">
                  <p className="text-brand-dark text-sm">
                    💡 新規ユーザーを作成すると、自動的にパスワードが生成されます。
                  </p>
                </div>
                <form onSubmit={handleCreateUser}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input
                      id="userName"
                      label="Нэр *"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      required
                    />
                    <Input
                      id="userEmail"
                      label="И-мэйл *"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      required
                    />
                    <Input
                      id="userPhone"
                      label="Утас"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    />
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Эрх *</label>
                      <select
                        className="w-full px-4 py-3 border-2 border-line rounded-card focus:border-brand focus:outline-none"
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                        required
                      >
                        <option value="shop_admin">Үйлчилгээний газрын админ</option>
                        <option value="super_admin">Систем админ</option>
                      </select>
                    </div>
                    {userForm.role === 'shop_admin' && (
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">Үйлчилгээний газар</label>
                        <select
                          className="w-full px-4 py-3 border-2 border-line rounded-card focus:border-brand focus:outline-none"
                          value={userForm.shop_id}
                          onChange={(e) => setUserForm({ ...userForm, shop_id: e.target.value })}
                        >
                          <option value="">Сонгоно уу</option>
                          {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>
                              {shop.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowUserForm(false);
                        resetUserForm();
                      }}
                    >
                      Болих
                    </Button>
                    <Button type="submit" variant="primary" isLoading={formLoading}>
                      Нэмэх
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Add User Button */}
            {!showUserForm && (
              <Button
                variant="primary"
                onClick={() => setShowUserForm(true)}
                className="mb-6 gap-2"
              >
                <Plus className="w-4 h-4" />
                Шинэ админ нэмэх
              </Button>
            )}

            {/* 検索と権限の絞り込み */}
            {users.length > 0 && (
              <div className="bg-white rounded-card border border-line p-3 mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-placeholder" />
                  <input
                    type="text"
                    placeholder="Нэр, и-мэйл, утсаар хайх..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-line rounded-control text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-band"
                  />
                </div>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  aria-label="Эрх"
                  className="h-10 px-3 border border-line rounded-control text-sm text-ink bg-white focus:border-brand focus:outline-none"
                >
                  <option value="">Бүх эрх</option>
                  <option value="super_admin">Систем админ</option>
                  <option value="shop_admin">Үйлчилгээний газрын админ</option>
                  <option value="customer">Хэрэглэгч</option>
                </select>
                <span className="text-sm text-subtle tabular-nums whitespace-nowrap">
                  {filteredUsers.length} / {users.length}
                </span>
              </div>
            )}

            {/* Users List */}
            {users.length === 0 ? (
              <Card variant="elevated" className="text-center py-12">
                <Users className="w-12 h-12 text-placeholder mx-auto mb-4" />
                <h3 className="font-semibold text-ink">Хэрэглэгч байхгүй</h3>
              </Card>
            ) : (
              <Card variant="elevated">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="text-left py-3 px-4 text-sm font-medium text-subtle">Нэр</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-subtle">И-мэйл</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-subtle">Эрх</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-subtle">Үйлчилгээний газар</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-subtle">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-line last:border-0">
                          <td className="py-3 px-4 font-medium text-ink-strong">{user.name}</td>
                          <td className="py-3 px-4 text-subtle">{user.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                user.role === 'super_admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === 'shop_admin'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-surface text-ink-strong'
                              }`}
                            >
                              {user.role === 'super_admin'
                                ? 'Систем админ'
                                : user.role === 'shop_admin'
                                ? 'Үйлчилгээний газрын админ'
                                : 'Хэрэглэгч'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-subtle">
                            {(user as { shop_name?: string }).shop_name || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {(user.role === 'shop_admin' || user.role === 'super_admin') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetPassword(user.id, user.name, user.email || '')}
                                isLoading={resetLoading === user.id}
                                className="gap-1 text-brand-dark hover:text-brand-dark hover:bg-brand-band"
                              >
                                <Key className="w-4 h-4" />
                                <span className="hidden sm:inline">Нууц үг шинэчлэх</span>
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
