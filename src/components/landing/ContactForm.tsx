"use client";

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

    // Здесь будет реальная отправка формы
    // Пока симулируем отправку
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
      setTimeout(() => setStatus("idle"), 3000);
    }, 1500);
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
    <div id="contact" className="bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-zinc-200 dark:border-zinc-700">
      <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
        Запросить демо
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        Заполните форму и мы свяжемся с вами в течение 24 часов
      </p>

      {status === "success" ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h4 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
            Спасибо за заявку!
          </h4>
          <p className="text-green-700 dark:text-green-300">
            Мы свяжемся с вами в ближайшее время
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
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
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="Иван Иванов"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
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
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
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
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="ivan@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Название заведения
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="Кафе 'Уют'"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Комментарий
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
              placeholder="Расскажите о вашем заведении..."
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Нажимая кнопку, вы соглашаетесь с{" "}
            <a href="/privacy" className="text-amber-600 hover:text-amber-700 underline">
              политикой конфиденциальности
            </a>
          </p>
        </form>
      )}
    </div>
  );
}
