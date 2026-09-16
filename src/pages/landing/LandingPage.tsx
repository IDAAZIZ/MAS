import { Link } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';
import { APP_ORG, APP_TAGLINE } from '@/lib/constants';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-800 to-[#051530] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gold/5 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gold/3 translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-20 left-20 w-px h-32 bg-gradient-to-b from-gold/30 to-transparent" />
      <div className="absolute bottom-20 right-20 w-px h-32 bg-gradient-to-t from-gold/30 to-transparent" />
      <div className="absolute top-20 right-40 w-32 h-px bg-gradient-to-r from-gold/30 to-transparent" />
      <div className="absolute bottom-20 left-40 w-32 h-px bg-gradient-to-l from-gold/30 to-transparent" />

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Icon */}
        <div className="w-24 h-24 bg-gold/15 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-gold/20 shadow-lg shadow-gold/10">
          <Trophy className="w-12 h-12 text-gold" />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-gold tracking-wider mb-2">
          e-APRESIASI
        </h1>
        <h2 className="text-2xl md:text-4xl font-bold text-white/90 tracking-widest mb-6">
          KKBDA
        </h2>

        {/* Divider */}
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6" />

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/80 font-medium tracking-wide mb-2">
          ANUGERAH APRESIASI STAF
        </p>
        <p className="text-base text-white/50 mb-8">
          {APP_ORG}
        </p>

        {/* Tagline */}
        <p className="text-sm text-white/40 italic mb-10 tracking-wide">
          {APP_TAGLINE}
        </p>

        {/* CTA */}
        <Link
          to="/login"
          className="inline-flex items-center gap-3 bg-gold hover:bg-gold-600 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-gold/25 hover:shadow-xl hover:shadow-gold/30 text-lg"
        >
          LOG MASUK
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-white/20 text-xs">
        © {new Date().getFullYear()} {APP_ORG}
      </footer>
    </div>
  );
}
