"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, BarChart3, Warehouse, ShoppingCart } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Products", icon: Package },
    { href: "/warehouses", label: "Warehouses", icon: Warehouse },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div className="absolute inset-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-none gradient-text">
                AlloStock
              </span>
              <span className="text-[10px] text-white/30 leading-none mt-0.5">
                Inventory System
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-500/30 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Reserve Now</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
