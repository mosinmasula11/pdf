"use client";

import { useState, useEffect } from "react";
import { calculateAge, localDateValue } from "@/lib/age-calculator";
import {
  Calendar,
  Clock,
  Sparkles,
  Cake,
  Copy,
  Check,
  Heart,
  Moon,
  Wind,
  Info,
  Compass,
} from "lucide-react";

type ZodiacSign = {
  name: string;
  symbol: string;
  element: string;
};

function getWesternZodiac(month: number, day: number): ZodiacSign {
  // month is 1-12, day is 1-31
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: "Aries", symbol: "♈", element: "Fire" };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: "Taurus", symbol: "♉", element: "Earth" };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { name: "Gemini", symbol: "♊", element: "Air" };
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { name: "Cancer", symbol: "♋", element: "Water" };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: "Leo", symbol: "♌", element: "Fire" };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: "Virgo", symbol: "♍", element: "Earth" };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: "Libra", symbol: "♎", element: "Air" };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { name: "Scorpio", symbol: "♏", element: "Water" };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: "Sagittarius", symbol: "♐", element: "Fire" };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: "Capricorn", symbol: "♑", element: "Earth" };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: "Aquarius", symbol: "♒", element: "Air" };
  return { name: "Pisces", symbol: "♓", element: "Water" };
}

function getChineseZodiac(year: number): string {
  const animals = ["Rat 🐀", "Ox 🐂", "Tiger 🐅", "Rabbit 🐇", "Dragon 🐉", "Snake 🐍", "Horse 🐎", "Goat 🐐", "Monkey 🐒", "Rooster 🐓", "Dog 🐕", "Pig 🐖"];
  return animals[(year - 4) % 12] || "Dragon";
}

function getGeneration(year: number): string {
  if (year >= 2013) return "Generation Alpha (2013–Present)";
  if (year >= 1997) return "Generation Z (1997–2012)";
  if (year >= 1981) return "Millennial / Gen Y (1981–1996)";
  if (year >= 1965) return "Generation X (1965–1980)";
  if (year >= 1946) return "Baby Boomer (1946–1964)";
  return "Silent Generation (Before 1946)";
}

export function AgeCalculatorTool() {
  const [birthDate, setBirthDate] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [copyError, setCopyError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (!mounted) return;
      const today = new Date();
      setTargetDate(localDateValue(today));
      const sample = new Date(today);
      sample.setFullYear(today.getFullYear() - 25);
      setBirthDate(localDateValue(sample));
      setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  const result = calculateAge(birthDate, targetDate);
  const isValidDates = !!result;
  const isFutureBirth = !!birthDate && !!targetDate && birthDate > targetDate;
  const birth = result?.birth || new Date(2000, 0, 1);
  const { years = 0, months = 0, days = 0, totalDays = 0, totalMonths = 0,
    nextBday = birth, daysUntilNextBday = 0, nextBdayAge = 0 } = result || {};
  const totalWeeks = Math.floor(totalDays / 7);
  const remainingDaysInWeek = totalDays % 7;
  const totalHours = totalDays * 24;
  const totalMinutes = totalHours * 60;
  const totalSeconds = totalMinutes * 60;
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const nextBdayDayOfWeek = daysOfWeek[nextBday.getDay()];

  // Zodiac & Generation
  const zodiac = getWesternZodiac(birth.getMonth() + 1, birth.getDate());
  const chineseZodiac = getChineseZodiac(birth.getFullYear());
  const generation = getGeneration(birth.getFullYear());

  // Fun Stats
  const estimatedHeartbeats = Math.round(totalMinutes * 75).toLocaleString();
  const estimatedBreaths = Math.round(totalMinutes * 16).toLocaleString();
  const estimatedSleepDays = Math.round(totalDays * 0.33).toLocaleString();

  const copySummary = async () => {
    const summary = `Age: ${years} Years, ${months} Months, ${days} Days\nTotal Days: ${totalDays.toLocaleString()}\nNext Birthday: In ${daysUntilNextBday} days (${nextBdayDayOfWeek})\nZodiac: ${zodiac.name} ${zodiac.symbol} | Chinese: ${chineseZodiac}\nGeneration: ${generation}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true); setCopyError("");
      setTimeout(() => setCopied(false), 2000);
    } catch { setCopyError("Clipboard access was denied. Please try again."); }
  };

  return (
    <div className="space-y-6">
      {/* 1. Date Inputs Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-violet-600" />
          <h2 className="text-base font-bold text-slate-900">Select Dates</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Date of Birth</label>
            <input
              type="date"
              aria-label="Date of Birth"
              aria-invalid={ready && !isValidDates}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Age on Date (Default: Today)</label>
              <button
                type="button"
                onClick={() => setTargetDate(localDateValue(new Date()))}
                className="text-[11px] font-semibold text-violet-600 hover:text-violet-700"
              >
                Set to Today
              </button>
            </div>
            <input
              type="date"
              aria-label="Age on Date"
              aria-invalid={ready && !isValidDates}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      {copyError && <p role="alert" className="text-sm text-red-700">{copyError}</p>}
      {ready && !isValidDates ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-800">
          {isFutureBirth ? "Date of Birth must be on or before Age on Date." : "Select a valid Date of Birth and Age on Date."}
        </div>
      ) : isValidDates ? (
        <>
          {/* 2. Primary Result Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-600 via-indigo-600 to-slate-900 p-6 sm:p-8 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-violet-200 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>Exact Calculated Age</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-4xl sm:text-6xl font-black tracking-tight text-white">
                    {years} <span className="text-2xl sm:text-3xl font-medium text-violet-200">Years</span>
                  </span>
                  <span className="text-2xl sm:text-4xl font-bold text-violet-100">
                    {months} <span className="text-lg sm:text-xl font-normal text-violet-300">Months</span>
                  </span>
                  <span className="text-2xl sm:text-4xl font-bold text-violet-100">
                    {days} <span className="text-lg sm:text-xl font-normal text-violet-300">Days</span>
                  </span>
                </div>
                <p className="text-xs text-violet-200/90 pt-1">
                  Born on {birth.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              <button
                type="button"
                onClick={copySummary}
                className="self-start sm:self-center flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition border border-white/20"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-300">Copied Age Summary!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Age Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. Upcoming Birthday & Astrology Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Next Birthday Countdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Cake className="h-5 w-5 text-pink-500" />
                <h3 className="text-sm font-bold text-slate-900">Next Birthday Countdown</h3>
              </div>

              <div className="rounded-xl border border-pink-100 bg-pink-50/50 p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-pink-950">
                    {daysUntilNextBday === 0 ? "🎉 Today is your Birthday!" : `In ${daysUntilNextBday} Days`}
                  </span>
                  <span className="text-xs font-bold text-pink-700">Turning {nextBdayAge}</span>
                </div>
                <p className="text-xs text-slate-600">
                  Will fall on a <strong className="text-slate-900">{nextBdayDayOfWeek}</strong> (
                  {nextBday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})
                </p>
              </div>
            </div>

            {/* Zodiac & Generation */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900">Astrology & Generation</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[11px] text-slate-500 font-medium">Western Zodiac</span>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">
                    {zodiac.symbol} {zodiac.name} ({zodiac.element})
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[11px] text-slate-500 font-medium">Birth-year Zodiac (Approximate)</span>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">
                    {chineseZodiac}
                  </div>
                </div>

                <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[11px] text-slate-500 font-medium">Demographic Generation</span>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">
                    {generation}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Complete Time Units Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">Total Life Duration In Different Units</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[11px] text-slate-500">Total Months</span>
                <p className="text-base font-bold text-slate-900 mt-1">{totalMonths.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">+{days} days</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[11px] text-slate-500">Total Weeks</span>
                <p className="text-base font-bold text-slate-900 mt-1">{totalWeeks.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">+{remainingDaysInWeek} days</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[11px] text-slate-500">Total Days</span>
                <p className="text-base font-bold text-slate-900 mt-1">{totalDays.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">days lived</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[11px] text-slate-500">Total Hours</span>
                <p className="text-base font-bold text-slate-900 mt-1">{totalHours.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">hours passed</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[11px] text-slate-500">Total Minutes</span>
                <p className="text-base font-bold text-slate-900 mt-1">{totalMinutes.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">minutes</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[11px] text-slate-500">Total Seconds</span>
                <p className="text-base font-bold text-slate-900 mt-1">{totalSeconds.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">seconds</span>
              </div>
            </div>
          </div>

          {/* 5. Biological & Fun Milestones */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">Estimated Biological Milestones</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-rose-800">Heartbeats Taken</span>
                  <p className="text-base font-bold text-slate-900">~{estimatedHeartbeats}</p>
                  <span className="text-[10px] text-slate-500">at 75 bpm average</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <Wind className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-sky-800">Breaths Taken</span>
                  <p className="text-base font-bold text-slate-900">~{estimatedBreaths}</p>
                  <span className="text-[10px] text-slate-500">at 16 breaths/min</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-violet-800">Time Spent Sleeping</span>
                  <p className="text-base font-bold text-slate-900">~{estimatedSleepDays} Days</p>
                  <span className="text-[10px] text-slate-500">approx 8 hrs/day</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

