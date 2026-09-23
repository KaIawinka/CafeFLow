'use client';

import { ChefHat, Heart, Leaf, Users, Clock, Award } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';

export function AboutPage({ locale }: { locale: Locale }) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] text-[#151a1e] dark:bg-[#151a1e] dark:text-[#f6f2e9]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-20 text-white sm:px-6 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[.2em] opacity-90">
            О CaféFlow
          </p>
          <h1 className="text-4xl font-black leading-tight sm:text-6xl">
            Место, где рождаются <br />
            <span className="font-serif italic">вкусные истории</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed opacity-95">
            Мы создаем не просто кафе, а пространство для встреч, вдохновения и наслаждения 
            качественной едой и напитками
          </p>
        </div>
      </section>

      {/* История */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-orange-600">
                Наша история
              </p>
              <h2 className="text-3xl font-black sm:text-4xl">
                Началось с простой идеи
              </h2>
              <div className="mt-6 space-y-4 text-base leading-7 text-gray-700 dark:text-gray-300">
                <p>
                  В 2020 году мы открыли первое кафе с простой миссией: создать место, где люди 
                  могут насладиться качественным кофе и свежей едой в уютной атмосфере.
                </p>
                <p>
                  Сегодня CaféFlow — это не просто сеть кафе. Это сообщество людей, которые 
                  ценят качество, заботятся о деталях и верят, что хороший день начинается с 
                  правильного завтрака.
                </p>
                <p>
                  Мы тщательно отбираем поставщиков, работаем только со свежими продуктами и 
                  постоянно совершенствуем наши рецепты, чтобы каждый визит к нам был особенным.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900">
                <div className="text-4xl font-black text-orange-600">4+</div>
                <p className="mt-2 text-sm font-semibold">Года работы</p>
              </div>
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900">
                <div className="text-4xl font-black text-orange-600">5K+</div>
                <p className="mt-2 text-sm font-semibold">Довольных гостей</p>
              </div>
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900">
                <div className="text-4xl font-black text-orange-600">15+</div>
                <p className="mt-2 text-sm font-semibold">Опытных сотрудников</p>
              </div>
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900">
                <div className="text-4xl font-black text-orange-600">50+</div>
                <p className="mt-2 text-sm font-semibold">Блюд в меню</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ценности */}
      <section className="bg-white px-4 py-16 dark:bg-gray-900 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-orange-600">
              Наши ценности
            </p>
            <h2 className="text-3xl font-black sm:text-4xl">Чем мы гордимся</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                <Leaf className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-black">Свежие продукты</h3>
              <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                Мы работаем только с проверенными поставщиками и используем продукты высшего 
                качества. Овощи, фрукты и зелень доставляются ежедневно.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                <ChefHat className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-black">Профессиональная команда</h3>
              <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                Наши повара имеют многолетний опыт работы в лучших ресторанах города. Каждое 
                блюдо готовится с любовью и вниманием к деталям.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-black">Забота о гостях</h3>
              <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                Мы ценим каждого гостя и стремимся создать для вас комфортную атмосферу. 
                Ваше удовольствие — наша главная награда.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-black">Уютная атмосфера</h3>
              <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                Продуманный интерьер, приятная музыка и дружелюбный персонал создают идеальные 
                условия для встреч с друзьями или работы.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-black">Быстрое обслуживание</h3>
              <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                Мы ценим ваше время. Средняя подача заказа — 15 минут. Для тех, кто спешит, 
                доступен предзаказ через приложение.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-black">Гарантия качества</h3>
              <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                Если что-то пошло не так — мы исправим это немедленно. Ваше довольство — наш 
                приоритет. Гарантируем качество каждого блюда.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Команда */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-orange-600">
              Наша команда
            </p>
            <h2 className="text-3xl font-black sm:text-4xl">Люди, которые создают CaféFlow</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-700 dark:text-gray-300">
              Профессионалы своего дела, которые работают с любовью и заботой о каждом госте
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Александр Петров', role: 'Шеф-повар', exp: '12 лет опыта' },
              { name: 'Мария Иванова', role: 'Су-шеф', exp: '8 лет опыта' },
              { name: 'Дмитрий Сидоров', role: 'Бариста', exp: '5 лет опыта' },
              { name: 'Анна Смирнова', role: 'Менеджер зала', exp: '7 лет опыта' },
            ].map((member) => (
              <div
                key={member.name}
                className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900"
              >
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-3xl font-black text-white">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <h3 className="text-lg font-black">{member.name}</h3>
                <p className="mt-1 text-sm font-semibold text-orange-600">{member.role}</p>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{member.exp}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
