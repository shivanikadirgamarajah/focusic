"use client";

import Link from "next/link";

const categories = [
  {
    title: "Rain",
    color: "bg-slate-700",
  },
  {
    title: "Minecraft",
    color: "bg-green-700",
  },
  {
    title: "Airplane",
    color: "bg-sky-600",
  },
  {
    title: "Nature",
    color: "bg-emerald-700",
  },
  {
    title: "Fantasy",
    color: "bg-purple-700",
  },
  {
    title: "Paris",
    color: "bg-rose-600",
  },
  {
    title: "Medieval",
    color: "bg-amber-700",
  },
];

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-black text-white p-8 flex-1">
      <div className="mx-auto max-w-6xl">
        <section className="mb-12">
          <h2 className="text-4xl font-bold mb-2">Explor Ambience</h2>
          <p className="text-gray-400">
            Discover curated music collections for every work mode
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link key={index} href={`/explore/${category.title.toLowerCase()}`}>
              <div
                className={`${category.color} h-64 rounded-xl overflow-hidden cursor-pointer transform transition hover:scale-105 hover:shadow-2xl flex items-center justify-center`}
              >
                <h3 className="text-4xl font-bold text-white">{category.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
