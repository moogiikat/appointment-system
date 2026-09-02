"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shop } from "@/lib/types";
import { UB_DISTRICTS, SUGGESTED_CATEGORIES } from "@/lib/constants";
import ShopCard from "@/components/ShopCard";
import Button from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  Users,
  Shield,
  Search,
  Store,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const userRole = (session?.user as { role?: string })?.role;

  const categories = useMemo(() => {
    const fromShops = shops.map((s) => s.category).filter(Boolean) as string[];
    return Array.from(new Set([...SUGGESTED_CATEGORIES, ...fromShops])).sort();
  }, [shops]);

  useEffect(() => {
    if (status === "authenticated" && userRole === "shop_admin") {
      router.push("/shop-admin");
    }
  }, [status, userRole, router]);

  useEffect(() => {
    async function fetchShops() {
      try {
        const res = await fetch("/api/shops");
        if (res.ok) {
          const data = await res.json();
          setShops(data);
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchShops();
  }, []);

  const filteredShops = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return shops.filter((shop) => {
      const matchesQuery =
        !query ||
        shop.name.toLowerCase().includes(query) ||
        shop.description?.toLowerCase().includes(query) ||
        shop.address?.toLowerCase().includes(query);
      const matchesCategory = !categoryFilter || shop.category === categoryFilter;
      const matchesDistrict = !districtFilter || shop.district === districtFilter;
      return matchesQuery && matchesCategory && matchesDistrict;
    });
  }, [shops, searchQuery, categoryFilter, districtFilter]);

  const hasActiveFilters = !!(searchQuery || categoryFilter || districtFilter);

  const features = [
    {
      icon: Calendar,
      title: "Хялбар захиалга",
      description: "Хүссэн өдөр, цагаа сонгоод шууд захиална",
    },
    {
      icon: Clock,
      title: "Бодит цагийн мэдээлэл",
      description: "Боломжит цагуудыг шууд харж, сонгох",
    },
    {
      icon: Users,
      title: "Google-ээр нэвтрэх",
      description: "Google хаягаараа хурдан нэвтэрч захиалга хийх",
    },
    {
      icon: Shield,
      title: "Баталгаатай",
      description: "Захиалга хийсний дараа баталгаажуулалт авна",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-sky-100/50 via-transparent to-cyan-100/50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm border border-sky-100 text-sm text-sky-700 font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Монголын #1 цаг захиалгын систем
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 mb-6">
              <span className="gradient-text">Цаг захиалах</span>
              <br />
              <span className="text-slate-700">систем</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Үйлчилгээний газар руу онлайнаар цаг захиалаарай. Хурдан, хялбар,
              найдвартай.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {status === "authenticated" && userRole !== "shop_admin" ? (
                <>
                  <Link href="/my-reservations">
                    <Button variant="primary" size="lg" className="gap-2">
                      <Calendar className="w-5 h-5" />
                      Миний захиалгууд
                    </Button>
                  </Link>
                  <a href="#shops">
                    <Button variant="outline" size="lg" className="gap-2">
                      <Store className="w-5 h-5" />
                      Үйлчилгээний газар сонгох
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </a>
                </>
              ) : status !== "loading" ? (
                <Link href="/auth/signin">
                  <Button variant="primary" size="lg" className="gap-2">
                    <Users className="w-5 h-5" />
                    Нэвтэрч захиалга хийх
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-slate-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-slate-700">Монгол цаг (UTC+8)</span>
              </div>
              {!loading && shops.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-slate-100">
                  <Store className="w-4 h-4 text-sky-500" />
                  <span className="text-slate-700">{shops.length} үйлчилгээний газар</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`animate-fade-in stagger-${
                  index + 1
                } opacity-0 bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl hover:border-sky-200 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="w-12 h-12 bg-linear-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-sky-500/25">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shops Section */}
      <section className="py-16 px-4" id="shops">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Үйлчилгээний газрын жагсаалт
            </h2>
            <p className="text-slate-600">
              Захиалга хийх үйлчилгээний газрыг сонгоно уу
            </p>
          </div>

          {!loading && shops.length > 0 && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Нэр, хаяг, тайлбараар хайх..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-700 shadow-sm"
                >
                  <option value="">Бүх ангилал</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-700 shadow-sm"
                >
                  <option value="">Бүх дүүрэг</option>
                  {UB_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("");
                      setDistrictFilter("");
                    }}
                    className="px-4 py-2.5 text-sm font-semibold text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                  >
                    Шүүлтүүр цэвэрлэх
                  </button>
                )}
              </div>
              {hasActiveFilters && (
                <p className="text-sm text-slate-500 mt-3 text-center">
                  {filteredShops.length} үр дүн олдлоо
                </p>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow-lg animate-pulse border border-slate-100"
                >
                  <div className="w-14 h-14 bg-slate-200 rounded-2xl mb-4" />
                  <div className="h-6 bg-slate-200 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-slate-200 rounded mb-4 w-full" />
                  <div className="h-10 bg-slate-200 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Calendar className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Үйлчилгээний газар бүртгэгдээгүй байна
              </h3>
              <p className="text-slate-500">
                Удахгүй үйлчилгээний газрын жагсаалт нэмэгдэх болно
              </p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Хайлтаар үр дүн олдсонгүй
              </h3>
              <p className="text-slate-500 mb-4">Өөр түлхүүр үгээр оролдоно уу</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("");
                  setDistrictFilter("");
                }}
              >
                Хайлт цэвэрлэх
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop, index) => (
                <div
                  key={shop.id}
                  className={`animate-fade-in stagger-${
                    (index % 5) + 1
                  } opacity-0`}
                >
                  <ShopCard shop={shop} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-linear-to-br from-sky-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-700">Цаг Захиалга</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 Цаг Захиалга. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </footer>
    </div>
  );
}
