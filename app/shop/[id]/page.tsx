'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shop, ShopService } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StarRating from '@/components/StarRating';
import FavoriteButton from '@/components/FavoriteButton';
import PhotoGallery from '@/components/PhotoGallery';
import MapEmbed from '@/components/MapEmbed';
import ReviewList from '@/components/ReviewList';
import CouponList from '@/components/CouponList';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  LogIn,
  MessageCircle,
  Tag,
  Ticket,
} from 'lucide-react';

export default function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<ShopService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShop() {
      try {
        const res = await fetch(`/api/shops/${id}`);
        if (res.ok) {
          const data = await res.json();
          setShop(data);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    fetchShop();
  }, [id, router]);

  useEffect(() => {
    fetch(`/api/shops/${id}/services`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setServices)
      .catch(() => setServices([]));
  }, [id]);

  const handleBookingClick = () => {
    if (status === 'authenticated') {
      // If logged in, go directly to booking page
      router.push(`/book/${id}`);
    } else {
      // If not logged in, redirect to login with callback to booking page
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/book/${id}`)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4" />
            <div className="h-48 bg-slate-200 rounded-2xl" />
            <div className="h-32 bg-slate-200 rounded-2xl" />
            <div className="h-32 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Буцах
        </Link>

        {/* Photo Gallery */}
        {shop.photos && shop.photos.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <PhotoGallery photos={shop.photos} alt={shop.name} />
          </div>
        )}

        {/* Shop Header */}
        <Card variant="elevated" className="mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Shop Icon */}
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-xl shadow-sky-500/30 shrink-0 overflow-hidden">
              {shop.icon ? (
                <img src={shop.icon} alt={shop.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{shop.name.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Shop Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {(shop.category || shop.district) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {shop.category && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                          {shop.category}
                        </span>
                      )}
                      {shop.district && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {shop.district}
                        </span>
                      )}
                    </div>
                  )}
                  <h1 className="text-2xl font-bold text-slate-800 mb-1">{shop.name}</h1>
                  {(shop.rating_count ?? 0) > 0 && (
                    <StarRating value={shop.rating_avg || 0} showValue count={shop.rating_count} />
                  )}
                </div>
                <FavoriteButton shopId={shop.id} className="w-10 h-10 bg-slate-50 hover:bg-red-50 shrink-0" />
              </div>
              {shop.description && (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line mt-3">{shop.description}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Services / Menu */}
        {services.length > 0 && (
          <Card variant="elevated" className="mb-6 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-sky-500" />
              Үйлчилгээ, үнийн жагсаалт
            </h2>
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-slate-800">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-slate-500">{service.description}</p>
                    )}
                    {service.duration_minutes && (
                      <p className="text-xs text-slate-500">{service.duration_minutes} минут</p>
                    )}
                  </div>
                  {typeof service.price === 'number' && (
                    <span className="font-bold text-sky-600 whitespace-nowrap">
                      {service.price.toLocaleString()}₮
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Coupons */}
        <Card variant="elevated" className="mb-6 animate-fade-in">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-500" />
            Купон
          </h2>
          <CouponList shopId={shop.id} />
        </Card>

        {/* Map */}
        {shop.address && (
          <Card variant="elevated" className="mb-6 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-500" />
              Байршил
            </h2>
            <MapEmbed address={shop.address} />
          </Card>
        )}

        {/* Shop Details */}
        <Card variant="elevated" className="mb-6 animate-fade-in stagger-1 opacity-0">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-sky-500" />
            Үйлчилгээний газрын мэдээлэл
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shop.address && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <MapPin className="w-5 h-5 text-sky-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-1">Хаяг</p>
                  <p className="text-slate-700 font-medium">{shop.address}</p>
                </div>
              </div>
            )}
            
            {shop.phone && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <Phone className="w-5 h-5 text-sky-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-1">Утас</p>
                  <p className="text-slate-700 font-medium">{shop.phone}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <Clock className="w-5 h-5 text-sky-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-1">Ажиллах цаг</p>
                <p className="text-slate-700 font-medium">
                  {shop.opening_time?.slice(0, 5)} - {shop.closing_time?.slice(0, 5)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <Users className="w-5 h-5 text-sky-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-1">Нэг цагийн багтаамж</p>
                <p className="text-slate-700 font-medium">{shop.max_capacity} хүн</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Important Notes */}
        <Card variant="elevated" className="mb-6 animate-fade-in stagger-2 opacity-0">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Анхаарах зүйлс
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-800 text-sm">
                Захиалга хийснээс хойш <strong>цуцлах боломжтой</strong>. Гэхдээ цаг хугацаанд нь ирж чадахгүй бол заавал урьдчилан мэдэгдэнэ үү.
              </p>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
              <CheckCircle className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
              <p className="text-sky-800 text-sm">
                Захиалсан цагаасаа <strong>5-10 минутын өмнө</strong> ирнэ үү.
              </p>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
              <p className="text-slate-700 text-sm">
                Нэг цагийн үйлчилгээний хугацаа <strong>{shop.slot_duration} минут</strong> байна.
              </p>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-red-800 text-sm">
                Захиалга хийхдээ <strong>зөв утасны дугаар</strong> оруулна уу. Бид танд холбогдож баталгаажуулах болно.
              </p>
            </div>
          </div>
        </Card>

        {/* Reviews */}
        <Card variant="elevated" className="mb-6 animate-fade-in">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-sky-500" />
            Сэтгэгдэл
          </h2>
          <ReviewList shopId={shop.id} />
        </Card>

        {/* Booking Button */}
        <div className="animate-fade-in stagger-3 opacity-0">
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full gap-2 text-lg py-4"
            onClick={handleBookingClick}
          >
            {status === 'authenticated' ? (
              <>
                <Calendar className="w-5 h-5" />
                Цаг захиалах
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Нэвтэрч захиалга хийх
              </>
            )}
          </Button>
          
          {status !== 'authenticated' && (
            <p className="text-center text-sm text-slate-500 mt-4">
              Захиалга хийхийн тулд эхлээд <span className="text-sky-600 font-medium">нэвтрэх</span> шаардлагатай
            </p>
          )}
          
          {status === 'authenticated' && (
            <p className="text-center text-sm text-slate-500 mt-4">
              Захиалга хийхэд <span className="text-sky-600 font-medium">үнэгүй</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
