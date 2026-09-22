import Image from 'next/image';
import type { Locale } from '@/app/i18n/config';
import type { LandingTranslations } from './types';

interface FooterProps {
  t: LandingTranslations;
  locale: Locale;
}

function InstagramMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.25 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 6.8A5.2 5.2 0 1 1 6.8 12 5.2 5.2 0 0 1 12 6.8Zm0 1.8A3.4 3.4 0 1 0 15.4 12 3.4 3.4 0 0 0 12 8.6Z" /></svg>;
}

function FacebookMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.08c0-.87.24-1.46 1.5-1.46h1.7V3.94c-.3-.04-1.31-.14-2.5-.14-2.47 0-4.16 1.5-4.16 4.27V10H7.3v3h2.74v8h3.46Z" /></svg>;
}

function XMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.4l-5-6.5L6.1 22H3l7.3-8.4L2.4 2h6.5l4.5 5.9L18.9 2Zm-1.1 17.5h1.8L7.9 4.4H6L17.8 19.5Z" /></svg>;
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
          <div className="cafeflow-social-card" aria-label="CaféFlow в социальных сетях">
            <ul className="cafeflow-social-card__list">
              <li className="cafeflow-social-card__item">
                <span /><span /><span />
                <a aria-label="Facebook" href="https://facebook.com" className="cafeflow-social-card__link text-[#6ea8fe]"><FacebookMark /></a>
                <span className="cafeflow-social-card__text">Facebook</span>
              </li>
              <li className="cafeflow-social-card__item">
                <span /><span /><span />
                <a aria-label="X / Twitter" href="https://x.com" className="cafeflow-social-card__link text-white/80"><XMark /></a>
                <span className="cafeflow-social-card__text">Twitter</span>
              </li>
              <li className="cafeflow-social-card__item">
                <span /><span /><span />
                <a aria-label="Instagram" href="https://instagram.com" className="cafeflow-social-card__link text-[#fb7185]"><InstagramMark /></a>
                <span className="cafeflow-social-card__text">Instagram</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
