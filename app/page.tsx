"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shop } from "@/lib/types";
import { UB_DISTRICTS, SUGGESTED_CATEGORIES, categoryStyle } from "@/lib/constants";
import ShopCard from "@/components/ShopCard";
import GenreGrid from "@/components/GenreGrid";
import Button from "@/components/ui/Button";
import { Search, MapPin, X, Store, Clock } from "lucide-react";

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

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setDistrictFilter("");
  };

  /* 新着（登録が新しい順の先頭6件）— EPARK の「最近見た施設」枠に相当 */
  const newShops = useMemo(() => shops.slice(0, 6), [shops]);

  return (
    <div className="min-h-screen bg-white">
      {/* ---- 検索バンド（EPARK の #eff7ef ヘッダー帯）---- */}
      <section className="bg-brand-band">
        <div className="max-w-[1120px] mx-auto px-4 py-4 md:py-6">
          <h1 className="text-[15px] md:text-[18px] font-bold text-ink-strong mb-3">
            Үйлчилгээний газраа хайж, цагаа захиалаарай
          </h1>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex items-center bg-white rounded-control h-9 md:h-12 flex-1 min-w-0">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-placeholder ml-3 shrink-0" />
              <input
                type="search"
                placeholder="Нэр, хаяг, түлхүүр үгээр хайх"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 h-full bg-transparent border-none outline-none px-2 text-[13px] md:text-[14px] text-ink placeholder:text-placeholder"
              />
            </div>

            <div className="flex items-center bg-white rounded-control h-9 md:h-12 md:w-[242px] shrink-0">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-placeholder ml-3 shrink-0" />
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                aria-label="Дүүрэг"
                className="flex-1 min-w-0 h-full bg-transparent border-none outline-none px-2 text-[13px] md:text-[14px] text-ink appearance-none cursor-pointer"
              >
                <option value="">Бүх дүүрэг</option>
                {UB_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <a href="#shops" className="shrink-0">
              <Button variant="primary" size="lg" className="w-full md:w-[160px]">
                <Search className="w-4 h-4" />
                Хайх
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ---- ジャンルから探す（search-genre-list）---- */}
      <section className="max-w-[1120px] mx-auto px-4 py-6 md:py-10">
        <h2 className="epark-section-title mb-4 md:mb-6">Ангилалаар хайх</h2>
        <GenreGrid
          categories={categories}
          selected={categoryFilter}
          onSelect={setCategoryFilter}
        />
      </section>

      {/* ---- 新着（横スクロールレール）---- */}
      {!loading && newShops.length > 0 && !hasActiveFilters && (
        <section className="max-w-[1120px] mx-auto px-4 pb-6 md:pb-10">
          <h2 className="epark-section-title mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand" />
            Шинээр нэмэгдсэн
          </h2>
          <div className="epark-rail gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {newShops.map((shop) => (
              <div key={shop.id} className="w-[211px] md:w-[244px] shrink-0">
                <ShopCard shop={shop} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- 一覧 ---- */}
      <section id="shops" className="max-w-[1120px] mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="epark-section-title flex items-center gap-2">
            {categoryFilter ? (
              <span
                className="w-5 h-5 rounded-full shrink-0"
                style={{ backgroundColor: categoryStyle(categoryFilter).color }}
              />
            ) : (
              <Store className="w-5 h-5 text-brand" />
            )}
            {categoryFilter || "Бүх үйлчилгээний газар"}
            {!loading && (
              <span className="text-[13px] font-normal text-subtle">
                {filteredShops.length} газар
              </span>
            )}
          </h2>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[13px] text-brand font-bold hover:opacity-70"
            >
              <X className="w-3.5 h-3.5" />
              Шүүлтүүр цэвэрлэх
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="epark-card overflow-hidden">
                <div className="h-[120px] md:h-[182px] bg-surface animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-surface rounded w-1/3 animate-pulse" />
                  <div className="h-4 bg-surface rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-16 border border-line rounded-card">
            <Store className="w-12 h-12 text-line-strong mx-auto mb-4" />
            <h3 className="text-[15px] font-bold text-ink mb-1">
              Үйлчилгээний газар бүртгэгдээгүй байна
            </h3>
            <p className="text-subtle text-[13px]">
              Удахгүй үйлчилгээний газрын жагсаалт нэмэгдэх болно
            </p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-16 border border-line rounded-card">
            <Search className="w-12 h-12 text-line-strong mx-auto mb-4" />
            <h3 className="text-[15px] font-bold text-ink mb-1">
              Хайлтаар үр дүн олдсонгүй
            </h3>
            <p className="text-subtle text-[13px] mb-4">Өөр түлхүүр үгээр оролдоно уу</p>
            <Button variant="outline" onClick={clearFilters}>
              Хайлт цэвэрлэх
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </section>

      {/* ---- フッター ---- */}
      <footer className="border-t border-line bg-white">
        <div className="max-w-[1120px] mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-[13px]">
            <Link href="/my-reservations" className="text-ink hover:text-brand">
              Миний захиалга
            </Link>
            <Link href="/favorites" className="text-ink hover:text-brand">
              Хадгалсан
            </Link>
            <Link href="/rewards" className="text-ink hover:text-brand">
              Оноо, купон
            </Link>
          </div>
          <p className="text-subtle text-[12px]">
            © 2026 Цаг Захиалга. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </footer>
    </div>
  );
}
