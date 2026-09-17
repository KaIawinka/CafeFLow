"use client";

import Link from "next/link";
import { useState } from "react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Contact request failed');
      setStatus("success");
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div id="contact" className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-zinc-200">
      <h3 className="text-3xl font-bold text-zinc-900 mb-2">
        Запросить демо
      </h3>
      <p className="text-zinc-600 mb-8">
        Заполните форму и мы свяжемся с вами в течение 24 часов
      </p>

      {status === "success" ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h4 className="mb-2 text-xl font-semibold text-orange-900">
            Спасибо за заявку!
          </h4>
          <p className="text-orange-700">
            Мы свяжемся с вами в ближайшее время
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === "error" && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Ваше имя *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                placeholder="Иван Иванов"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Телефон *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
              placeholder="ivan@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Название заведения
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
              placeholder="Кафе 'Уют'"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Комментарий
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
              placeholder="Расскажите о вашем заведении..."
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-md bg-orange-500 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Отправка...
              </span>
            ) : (
              "Отправить заявку"
            )}
          </button>

          <p className="text-center text-sm text-zinc-500">
            Нажимая кнопку, вы соглашаетесь с{" "}
            <Link href="/privacy" className="text-orange-600 underline hover:text-orange-700">
              политикой конфиденциальности
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
