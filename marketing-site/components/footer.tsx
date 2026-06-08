import Link from "next/link";
import { AtSign, Globe, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#06070d]" id="contact">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="text-xl font-extrabold tracking-tight">
              Scale<span className="glow-text">Storm</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              We build and run Meta ad campaigns that turn ad spend into
              predictable, profitable revenue for ambitious brands.
            </p>
            <div className="mt-6 flex gap-3">
              {[AtSign, Globe, MessageCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-white/30 hover:text-white"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Get in touch</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/50">
              <li>
                <a href="mailto:hello@scalestorm.com" className="hover:text-white">
                  hello@scalestorm.com
                </a>
              </li>
              <li>
                <a href="tel:+447862240214" className="hover:text-white">
                  +44 7862 240214
                </a>
              </li>
              <li>Remote-first · Worldwide</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/50">
              <li><a href="#services" className="hover:text-white">Services</a></li>
              <li><a href="#results" className="hover:text-white">Results</a></li>
              <li><a href="#process" className="hover:text-white">Process</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-white/40 md:flex-row">
          <p>© {new Date().getFullYear()} Scale Storm. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white/70">Privacy Policy</a>
            <a href="#" className="hover:text-white/70">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
