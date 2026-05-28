import Link from 'next/link';
import Image from 'next/image';

const navLinks = [
  { href: '#features', label: 'Возможности' },
  { href: '#how',      label: 'Механика'    },
  { href: '#preview',  label: 'Интерфейс'  },
];

export function Footer() {
  return (
    <footer style={{ background: '#6b8dd6' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
        <div className="flex items-center justify-between">

          {/* Логотип */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/vector 7.png"
              alt="HealthTrack"
              width={36}
              height={36}
              className="w-9 h-9 brightness-0 invert"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-white text-sm leading-none">Health</span>
              <span className="font-semibold text-white/80 text-sm leading-none">Track</span>
            </div>
          </Link>

          {/* Ссылки */}
          <div className="flex items-center gap-10">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-white text-sm hover:text-white/70 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Копирайт */}
          <p className="text-white/60 text-xs sm:text-sm text-right">
            {new Date().getFullYear()} HealthTrack
            <span className="hidden sm:inline"> · </span>
            <br className="sm:hidden" />
            <a
              href="https://www.flaticon.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/80"
            >
              Иконки — Flaticon
            </a>
          </p>

        </div>
      </div>
    </footer>
  );
}
