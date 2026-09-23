'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';

type Branch = {
  id: string;
  name: string;
  code: string;
  address_text: string | null;
  phone: string | null;
  timezone: string | null;
  status: string;
};

export function LocationsPage({ locale }: { locale: Locale }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  useEffect(() => {
    fetch('/api/public/branches')
      .then((res) => res.json())
      .then((data) => {
        const activeBranches = (data.branches || []).filter((b: Branch) => b.status === 'active');
        setBranches(activeBranches);
        if (activeBranches.length > 0) {
          setSelectedBranch(activeBranches[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] px-4 py-8 text-[#151a1e] dark:bg-[#151a1e] dark:text-[#f6f2e9]">
        <div className="mx-auto max-w-6xl">
          <p className="text-center">Загрузка...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] text-[#151a1e] dark:bg-[#151a1e] dark:text-[#f6f2e9]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[.2em] opacity-90">
            Наши адреса
          </p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            Найдите ближайшее кафе
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-95">
            {branches.length} {branches.length === 1 ? 'филиал' : branches.length < 5 ? 'филиала' : 'филиалов'} по городу — всегда рядом с вами
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          {/* Список филиалов */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black">Все филиалы</h2>
            {branches.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center dark:bg-gray-900">
                <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  Информация о филиалах временно недоступна
                </p>
              </div>
            ) : (
              branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setSelectedBranch(branch)}
                  className={`w-full rounded-2xl border-2 p-6 text-left transition ${
                    selectedBranch?.id === branch.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                      : 'border-gray-200 bg-white hover:border-orange-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-orange-700'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-xl font-black">{branch.name}</h3>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                      <MapPin className="h-5 w-5" />
                    </div>
                  </div>

                  {branch.address_text && (
                    <div className="mb-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                      <span>{branch.address_text}</span>
                    </div>
                  )}

                  {branch.phone && (
                    <div className="mb-3 flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a
                        href={`tel:${branch.phone}`}
                        className="text-orange-600 hover:underline dark:text-orange-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {branch.phone}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>Ежедневно 8:00 - 22:00</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Карта 2GIS */}
          <div className="rounded-2xl bg-white p-1 shadow-lg dark:bg-gray-900 lg:sticky lg:top-8">
            <div className="overflow-hidden rounded-xl">
              {selectedBranch ? (
                <>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
                    <h3 className="mb-2 text-2xl font-black">{selectedBranch.name}</h3>
                    {selectedBranch.address_text && (
                      <p className="mb-3 opacity-95">{selectedBranch.address_text}</p>
                    )}
                    {selectedBranch.phone && (
                      <a
                        href={`tel:${selectedBranch.phone}`}
                        className="inline-flex items-center gap-2 font-bold underline hover:no-underline"
                      >
                        <Phone className="h-4 w-4" />
                        {selectedBranch.phone}
                      </a>
                    )}
                  </div>
                  
                  {/* Виджет 2GIS */}
                  <div className="relative h-[500px] bg-gray-200 dark:bg-gray-800">
                    <iframe
                      src="https://2gis.kg/bishkek?m=74.606586%2C42.874633%2F13"
                      className="h-full w-full"
                      title={`Карта ${selectedBranch.name}`}
                      style={{ border: 0 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-900/50">
                      <div className="rounded-xl bg-white p-6 text-center shadow-lg dark:bg-gray-800">
                        <MapPin className="mx-auto mb-3 h-12 w-12 text-orange-600" />
                        <p className="mb-2 text-lg font-bold">Интеграция с 2GIS</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Добавьте ваши координаты в настройках филиалов
                        </p>
                        <a
                          href={`https://2gis.kg/search/${encodeURIComponent(selectedBranch.address_text || 'CaféFlow Бишкек')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600"
                        >
                          Открыть в 2GIS
                          <Navigation className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Кнопки действий */}
                  <div className="grid grid-cols-2 gap-4 p-6">
                    <a
                      href={`https://2gis.kg/search/${encodeURIComponent(selectedBranch.address_text || 'CaféFlow')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-orange-500 font-bold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10"
                    >
                      <Navigation className="h-4 w-4" />
                      Маршрут
                    </a>
                    {selectedBranch.phone && (
                      <a
                        href={`tel:${selectedBranch.phone}`}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600"
                      >
                        <Phone className="h-4 w-4" />
                        Позвонить
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-[600px] items-center justify-center">
                  <div className="text-center">
                    <MapPin className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Выберите филиал для отображения на карте
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
