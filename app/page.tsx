'use client';

import { useState, useEffect } from 'react';
import { Shop } from '@/lib/types';
import ShopCard from '@/components/ShopCard';
import { Calendar, Clock, Users, Shield } from 'lucide-react';

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

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

  const features = [
    {
      icon: Calendar,
      title: 'Хялбар захиалга',
      description: 'Хүссэн өдөр, цагаа сонгоод шууд захиална',
    },
    {
      icon: Clock,
      title: 'Бодит цагийн мэдээлэл',
      description: 'Боломжит цагуудыг шууд харж, сонгох',
    },
    {
      icon: Users,
      title: 'Facebook нэвтрэлт',
      description: 'Facebook хаягаараа хурдан нэвтэрч захиалга хийх',
    },
    {
      icon: Shield,
      title: 'Баталгаатай',
      description: 'Захиалга хийсний дараа баталгаажуулалт авна',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100/50 via-transparent to-cyan-100/50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 mb-6">
              <span className="gradient-text">Цаг захиалах</span>
              <br />
              <span className="text-slate-700">систем</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Дэлгүүр, салон, үйлчилгээний газар руу онлайнаар цаг захиалаарай. 
              Хурдан, хялбар, найдвартай.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-slate-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-slate-700">Монгол цаг (UTC+8)</span>
              </div>
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
                className={`animate-fade-in stagger-${index + 1} opacity-0 bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl hover:border-sky-200 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-sky-500/25">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shops Section */}
      <section className="py-16 px-4" id="shops">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Дэлгүүрүүд
            </h2>
            <p className="text-slate-600">
              Захиалга хийх дэлгүүрээ сонгоно уу
            </p>
          </div>

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
                Дэлгүүр бүртгэгдээгүй байна
              </h3>
              <p className="text-slate-500">
                Удахгүй дэлгүүрүүд нэмэгдэх болно
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop, index) => (
                <div key={shop.id} className={`animate-fade-in stagger-${(index % 5) + 1} opacity-0`}>
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
          <p className="text-slate-500 text-sm">
            © 2024 Цаг Захиалга. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </footer>
    </div>
  );
}
