import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">

      {/* Hero Badge */}
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 py-1.5 text-sm text-purple-700 dark:text-gray-400 backdrop-blur-md transition-all hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
        </span>
        <span className="font-semibold">v2.0 Now Live</span>
      </div>

      {/* Hero Title */}
      <h1 className="mb-6 text-6xl font-extrabold tracking-tight sm:text-7xl">
        <span className="block text-gray-900 dark:text-slate-100 drop-shadow-sm">Master Your</span>
        <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-cyan-400 dark:to-blue-500 bg-clip-text text-transparent animate-gradient-x drop-shadow-sm filter brightness-110">
          Competitive Journey
        </span>
      </h1>

      {/* Hero Subtitle */}
      <p className="mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl leading-relaxed">
        CompAce is the ultimate platform for tracking high-school competitions.
        Discover opportunities, manage submissions, and level up your portfolio with AI-powered insights.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-20">
        <Link href="/competitions" className="group relative inline-flex items-center justify-center rounded-full bg-gray-900 dark:bg-white px-8 py-3.5 text-base font-bold text-white dark:text-black transition-all hover:bg-gray-800 dark:hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20">
          Explore Competitions
          <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <Link href="/dashboard" className="group inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-8 py-3.5 text-base font-bold text-gray-900 dark:text-white transition-all hover:bg-white/80 dark:hover:bg-white/10 hover:scale-105 active:scale-95 backdrop-blur-sm shadow-sm hover:shadow-md">
          Go to Dashboard
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 w-full max-w-4xl border-y border-gray-200 dark:border-white/5 py-8 bg-white/30 dark:bg-black/20 backdrop-blur-sm rounded-3xl md:rounded-full px-8">
        {[
          { label: "Competitions", value: "500+" },
          { label: "Active Students", value: "10k+" },
          { label: "Missions Completed", value: "50k+" },
          { label: "Success Rate", value: "92%" },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</div>
            <div className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Feature Grid (Glass) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        {[
          { title: "Smart Discovery", desc: "AI-curated feed of competitions tailored to your interests and grade level.", icon: "🔍", color: "from-blue-500 to-cyan-500" },
          { title: "Track Progress", desc: "Manage deadlines, tasks, and submission statuses in one unified workspace.", icon: "📊", color: "from-purple-500 to-pink-500" },
          { title: "Portfolio Builder", desc: "Automatically generate a showcase of your achievements and awards.", icon: "🚀", color: "from-amber-400 to-orange-500" }
        ].map((feat, i) => (
          <div key={i} className="glass-card group relative overflow-hidden rounded-3xl p-8 transition-all hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
            <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feat.color} text-2xl text-white shadow-lg`}>
              {feat.icon}
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">{feat.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Trust Badge / Footer Mock */}
      <div className="mt-24 pt-10 border-t border-gray-200 dark:border-white/10 w-full flex flex-col items-center">
        <p className="text-gray-400 text-sm mb-4">Trusted by students from top high schools worldwide</p>
        <div className="flex gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Placeholders for logos */}
          {['Stanford', 'MIT', 'Harvard', 'Berkeley'].map(school => (
            <span key={school} className="font-serif font-bold text-xl text-gray-500 dark:text-gray-400">{school}</span>
          ))}
        </div>
      </div>

    </div>
  );
}
