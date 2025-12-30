'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shop, User } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Store, Users, Plus, Edit2, Trash2, MapPin, Clock, X, Key, Copy, Check } from 'lucide-react';

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
      }
    } catch (error) {
      console.error('Error creating shop:', error);
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
      }
    } catch (error) {
      console.error('Error updating shop:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteShop = async (id: number) => {
    if (!confirm('Энэ дэлгүүрийг устгах уу? Бүх захиалга устана!')) return;

    try {
      const res = await fetch(`/api/shops/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShops(shops.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error('Error deleting shop:', error);
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
      }
    } catch (error) {
      console.error('Error creating user:', error);
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
        alert('Нууц үг шинэчлэхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Нууц үг шинэчлэхэд алдаа гарлаа');
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
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-64 bg-slate-200 rounded-2xl" />
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
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Key className="w-5 h-5 text-sky-500" />
                  Шинэ нууц үг
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInfo(null);
                    setCopied(false);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-amber-800 text-sm font-medium">
                  ⚠️ Анхааруулга: Энэ нууц үгийг одоо хадгалж аваарай! Дахин харагдахгүй.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs text-slate-500">Хэрэглэгч</label>
                  <p className="font-medium text-slate-800">{passwordInfo.name}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">И-мэйл</label>
                  <p className="font-medium text-slate-800">{passwordInfo.email}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Нууц үг</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-mono text-lg font-bold text-slate-800">
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
          <h1 className="text-3xl font-bold text-slate-800">Систем удирдлага</h1>
          <p className="text-slate-600">Бүх дэлгүүр, хэрэглэгчдийн удирдлага</p>
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
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingShop ? 'Дэлгүүр засах' : 'Шинэ дэлгүүр нэмэх'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowShopForm(false);
                      setEditingShop(null);
                      resetShopForm();
                    }}
                    className="text-slate-400 hover:text-slate-600"
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
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Тайлбар</label>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none resize-none"
                        rows={2}
                        value={shopForm.description}
                        onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                      />
                    </div>
                  </div>
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
                Шинэ дэлгүүр нэмэх
              </Button>
            )}

            {/* Shops List */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : shops.length === 0 ? (
              <Card variant="elevated" className="text-center py-12">
                <Store className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-700">Дэлгүүр бүртгэгдээгүй</h3>
                <p className="text-slate-500 text-sm">Шинэ дэлгүүр нэмэх товч дарна уу</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shops.map((shop, index) => (
                  <Card
                    key={shop.id}
                    variant="elevated"
                    className={`animate-fade-in stagger-${(index % 5) + 1} opacity-0`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-white">{shop.name.charAt(0)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editShop(shop)}
                          className="p-2 text-slate-400 hover:text-sky-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteShop(shop.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">{shop.name}</h3>
                    <div className="space-y-1 text-sm text-slate-600">
                      {shop.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-sky-500" />
                          <span>{shop.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-sky-500" />
                        <span>
                          {shop.opening_time?.slice(0, 5)} - {shop.closing_time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
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
                  <h2 className="text-lg font-bold text-slate-800">Шинэ админ хэрэглэгч нэмэх</h2>
                  <button
                    onClick={() => {
                      setShowUserForm(false);
                      resetUserForm();
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-4">
                  <p className="text-sky-800 text-sm">
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
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Эрх *</label>
                      <select
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Дэлгүүр</label>
                        <select
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
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

            {/* Users List */}
            {users.length === 0 ? (
              <Card variant="elevated" className="text-center py-12">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-700">Хэрэглэгч байхгүй</h3>
              </Card>
            ) : (
              <Card variant="elevated">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Нэр</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">И-мэйл</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Эрх</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Дэлгүүр</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 px-4 font-medium text-slate-800">{user.name}</td>
                          <td className="py-3 px-4 text-slate-600">{user.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                user.role === 'super_admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === 'shop_admin'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {user.role === 'super_admin'
                                ? 'Систем админ'
                                : user.role === 'shop_admin'
                                ? 'Үйлчилгээний газрын админ'
                                : 'Хэрэглэгч'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {(user as { shop_name?: string }).shop_name || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {(user.role === 'shop_admin' || user.role === 'super_admin') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetPassword(user.id, user.name, user.email || '')}
                                isLoading={resetLoading === user.id}
                                className="gap-1 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
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
    </div>
  );
}
