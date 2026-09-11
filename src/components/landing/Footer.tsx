import Link from "next/link";

interface FooterProps {
  t: any;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer id="contact" className="bg-zinc-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-bold mb-4">CaféFlow</h3>
            <p className="text-zinc-400">{t.about.description}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">{t.contact.title}</h4>
            <div className="space-y-2 text-zinc-400">
              <p>{t.contact.address}: г. Бишкек, ул. Примерная 123</p>
              <p>{t.contact.phone}: +996 XXX XXX XXX</p>
              <p>{t.contact.hours}: 09:00 - 22:00</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Навигация</h4>
            <ul className="space-y-2">
              <li><Link href="#menu" className="text-zinc-400 hover:text-white">{t.footer.menu}</Link></li>
              <li><Link href="#reservation" className="text-zinc-400 hover:text-white">{t.footer.reservation}</Link></li>
              <li><Link href="#about" className="text-zinc-400 hover:text-white">{t.footer.about}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-zinc-800 pt-8 text-center text-zinc-400">
          © {new Date().getFullYear()} CaféFlow. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
