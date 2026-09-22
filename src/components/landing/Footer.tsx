import Image from 'next/image';
import type { Locale } from '@/app/i18n/config';
import type { LandingTranslations } from './types';

interface FooterProps {
  t: LandingTranslations;
  locale: Locale;
}

function WhatsAppMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M12 2a9.9 9.9 0 0 0-8.56 14.87L2 22l5.3-1.39A9.9 9.9 0 1 0 12 2Zm0 18a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.15.83.84-3.07-.2-.32A8.1 8.1 0 1 1 12 20Zm4.43-6.06c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.74-1.79-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.01.4 1.36.51.57.18 1.09.15 1.5.09.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" /></svg>;
}

function InstagramMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.25 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 6.8A5.2 5.2 0 1 1 6.8 12 5.2 5.2 0 0 1 12 6.8Zm0 1.8A3.4 3.4 0 1 0 15.4 12 3.4 3.4 0 0 0 12 8.6Z" /></svg>;
}

function TelegramMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M21.7 3.6 18.6 20c-.23 1.16-.84 1.45-1.7.9l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.94.46l.34-4.8 8.74-7.9c.38-.34-.08-.53-.59-.19L6.67 13.97l-4.65-1.46c-1.01-.32-1.03-1.01.21-1.5L20.4 3.02c.84-.31 1.58.19 1.3.58Z" /></svg>;
}

function FacebookMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.08c0-.87.24-1.46 1.5-1.46h1.7V3.94c-.3-.04-1.31-.14-2.5-.14-2.47 0-4.16 1.5-4.16 4.27V10H7.3v3h2.74v8h3.46Z" /></svg>;
}

function ThreadsMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M12.1 2C6.6 2 3.2 5.5 3.2 11.2v1.1c0 5.8 3.5 9.7 9 9.7 4.9 0 8.1-2.6 8.1-6.5 0-3.3-2.1-5.5-5.6-6.3-.4-2.1-1.5-3.2-3.5-3.2-1.7 0-2.8.8-3.3 2.3l2.1.7c.2-.6.6-.9 1.2-.9.8 0 1.2.4 1.4 1.1-4.2-.1-6.4 1.4-6.4 4.3 0 2.6 1.9 4.2 4.8 4.2 2.2 0 3.8-.9 4.6-2.5 1.1.6 1.7 1.4 1.7 2.4 0 2.1-1.9 3.6-5 3.6-4 0-6.5-2.8-6.5-7.7v-1c0-4.4 2.3-6.8 6.3-6.8 3.1 0 5.1 1.6 5.8 4.6l2.2-.5C19.3 4.5 16.5 2 12.1 2Zm-.2 13.3c-1.5 0-2.4-.6-2.4-1.7 0-1.2 1.1-1.9 3.2-1.9h.4c.1 2.4-.3 3.6-1.2 3.6Z" /></svg>;
}

function TikTokMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M16.7 3c.3 1.8 1.3 3.1 3.3 3.6v2.8c-1.5-.1-2.8-.6-4-1.4v6.4c0 3.9-2.6 6.6-6.4 6.6A5.6 5.6 0 0 1 4 15.4c0-3.4 2.8-5.8 6.2-5.8.3 0 .6 0 .9.1v2.9a3.5 3.5 0 0 0-.9-.1c-1.7 0-3.2 1.1-3.2 2.9 0 1.6 1.2 2.8 2.8 2.8 1.9 0 2.9-1.2 2.9-3.6V3h4Z" /></svg>;
}

function XMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.4l-5-6.5L6.1 22H3l7.3-8.4L2.4 2h6.5l4.5 5.9L18.9 2Zm-1.1 17.5h1.8L7.9 4.4H6L17.8 19.5Z" /></svg>;
}

function YouTubeMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" /></svg>;
}

export function Footer({ t }: FooterProps) {
  const copy = t.footer;
  return (
    <footer id="contact" className="footer-surface relative bg-[#151a1e] py-10 text-white sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-8">
          <div className="flex items-center gap-3">
            <Image src="/cafeflow-logo.svg" alt="CaféFlow" width={44} height={44} className="h-11 w-11 rounded-md" />
            <div><h3 className="text-xl font-bold text-orange-300">CaféFlow</h3></div>
          </div>
          <div className="shrink-0 text-right"><p className="font-serif text-base italic text-orange-300 sm:text-lg">{copy.open}</p></div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 py-7 text-sm font-medium text-white/60 sm:justify-between">
          <div className="footer-table flex min-w-0 flex-1 flex-wrap items-start justify-between gap-7">
            <div id="address" className="min-w-[9rem]"><h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">{t.contact.address}</h4><div className="space-y-1.5 text-white/55"><p>{copy.address}</p><p>{t.contact.phone}: +996 XXX XXX XXX</p></div></div>
            <div className="min-w-[11rem]"><h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">{copy.hours}</h4><div className="space-y-1.5 text-white/55"><p>{copy.weekdays}</p><p>{copy.weekends}</p></div></div>
            <div className="min-w-[11rem]"><h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">{copy.contacts}</h4><div className="space-y-1.5 text-white/55"><p>+996 555 000 000</p><p>hello@cafeflow.kg</p><p>WhatsApp · Telegram</p></div></div>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3"><span>© {new Date().getFullYear()} CaféFlow.</span><span>{t.footer.rights}</span></div>
          <div className="cafeflow-social-card"><a aria-label="WhatsApp" href="https://wa.me/996555000000" className="cafeflow-social-card__link text-[#25d366] hover:border-[#25d366] hover:bg-[#25d366] hover:text-white"><WhatsAppMark /></a><a aria-label="Instagram" href="https://instagram.com" className="cafeflow-social-card__link text-[#e4405f] hover:border-[#e4405f] hover:bg-[#e4405f] hover:text-white"><InstagramMark /></a><a aria-label="Facebook" href="https://facebook.com" className="cafeflow-social-card__link text-[#1877f2] hover:border-[#1877f2] hover:bg-[#1877f2] hover:text-white"><FacebookMark /></a><a aria-label="Threads" href="https://threads.net" className="cafeflow-social-card__link text-white/75 hover:border-white hover:bg-white hover:text-[#151a1e]"><ThreadsMark /></a><a aria-label="TikTok" href="https://tiktok.com" className="cafeflow-social-card__link text-[#ff0050] hover:border-[#ff0050] hover:bg-[#ff0050] hover:text-white"><TikTokMark /></a><a aria-label="X" href="https://x.com" className="cafeflow-social-card__link text-white/75 hover:border-white hover:bg-white hover:text-[#151a1e]"><XMark /></a><a aria-label="Telegram" href="https://t.me" className="cafeflow-social-card__link text-[#229ed9] hover:border-[#229ed9] hover:bg-[#229ed9] hover:text-white"><TelegramMark /></a><a aria-label="YouTube" href="https://youtube.com" className="cafeflow-social-card__link text-[#ff0000] hover:border-[#ff0000] hover:bg-[#ff0000] hover:text-white"><YouTubeMark /></a></div>
        </div>
      </div>
    </footer>
  );
}
