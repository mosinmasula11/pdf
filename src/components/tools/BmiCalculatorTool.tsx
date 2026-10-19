"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  Heart,
  Scale,
  Activity,
  Flame,
  Info,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export function BmiCalculatorTool() {
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState<number>(25);

  // Metric
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);

  // Imperial
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(9);
  const [weightLbs, setWeightLbs] = useState<number>(154);

  const [activityLevel, setActivityLevel] = useState<number>(1.2); // 1.2: Sedentary, 1.375: Light, 1.55: Moderate, 1.725: Active, 1.9: Very Active

  // Standardize to metric for calculation
  const totalCm =
    unitSystem === "metric"
      ? Number(heightCm) || 0
      : (Number(heightFt) || 0) * 30.48 + (Number(heightIn) || 0) * 2.54;

  const totalKg =
    unitSystem === "metric"
      ? Number(weightKg) || 0
      : (Number(weightLbs) || 0) * 0.45359237;

  // BMI = kg / (m)^2
  const heightM = totalCm / 100;
  const bmi = heightM > 0 ? totalKg / (heightM * heightM) : 0;

  // Categories
  let category = "Normal Weight";
  let categoryColor = "text-emerald-600 dark:text-emerald-400";
  let gaugePercent = 50;

  if (bmi < 18.5) {
    category = "Underweight";
    categoryColor = "text-sky-600 dark:text-sky-400";
    gaugePercent = Math.min(25, (bmi / 18.5) * 25);
  } else if (bmi < 25) {
    category = "Healthy / Normal";
    categoryColor = "text-emerald-600 dark:text-emerald-400";
    gaugePercent = 25 + ((bmi - 18.5) / 6.5) * 25;
  } else if (bmi < 30) {
    category = "Overweight";
    categoryColor = "text-amber-600 dark:text-amber-400";
    gaugePercent = 50 + ((bmi - 25) / 5) * 25;
  } else {
    category = "Obesity";
    categoryColor = "text-rose-600 dark:text-rose-400";
    gaugePercent = Math.min(100, 75 + ((bmi - 30) / 10) * 25);
  }

  // Ideal weight range (BMI 18.5 to 24.9)
  const minIdealKg = 18.5 * (heightM * heightM);
  const maxIdealKg = 24.9 * (heightM * heightM);

  // Mifflin-St Jeor BMR Equation
  const bmr =
    gender === "male"
      ? 10 * totalKg + 6.25 * totalCm - 5 * age + 5
      : 10 * totalKg + 6.25 * totalCm - 5 * age - 161;

  // TDEE Maintenance
  const tdee = Math.round(bmr * activityLevel);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800 mb-3">
          <Activity className="w-3.5 h-3.5" />
          <span>Body Mass Index & Daily Caloric Needs</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          BMI & Calorie / TDEE Calculator
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Find your exact BMI score, healthy body weight target, Basal Metabolic Rate (BMR), and daily maintenance calories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* Unit Switcher */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unit System</span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUnitSystem("metric")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    unitSystem === "metric"
                      ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Metric (kg / cm)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem("imperial")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    unitSystem === "imperial"
                      ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Imperial (lbs / ft)
                </button>
              </div>
            </div>

            {/* Gender & Age */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`py-2 rounded-lg text-center transition-all ${
                      gender === "male"
                        ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`py-2 rounded-lg text-center transition-all ${
                      gender === "female"
                        ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min="2"
                  max="120"
                  value={age || ""}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {unitSystem === "metric" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="250"
                      value={heightCm || ""}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      step="0.5"
                      value={weightKg || ""}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Height (ft & in)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="2"
                        max="8"
                        value={heightFt || ""}
                        onChange={(e) => setHeightFt(Number(e.target.value))}
                        className="w-1/2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                        placeholder="Feet"
                      />
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={heightIn || ""}
                        onChange={(e) => setHeightIn(Number(e.target.value))}
                        className="w-1/2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                        placeholder="Inches"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="700"
                      value={weightLbs || ""}
                      onChange={(e) => setWeightLbs(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Activity Level for TDEE */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Daily Physical Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(Number(e.target.value))}
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-white"
              >
                <option value={1.2}>Sedentary (Little or no exercise, desk job)</option>
                <option value={1.375}>Lightly Active (Exercise 1-3 days/week)</option>
                <option value={1.55}>Moderately Active (Exercise 3-5 days/week)</option>
                <option value={1.725}>Very Active (Hard exercise 6-7 days/week)</option>
                <option value={1.9}>Extra Active (Intense training / physical labor)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Output: Score & Gauge (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Your BMI Results
            </h2>

            {/* BMI Number Card */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                BMI Score
              </span>
              <div className="text-4xl font-black text-slate-900 dark:text-white mt-1">
                {bmi.toFixed(1)}
              </div>
              <div className={`text-sm font-extrabold mt-1 ${categoryColor}`}>
                {category}
              </div>

              {/* Gauge Bar */}
              <div className="mt-5 relative">
                <div className="h-3 w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500" />
                <div
                  className="absolute -top-1 w-2 h-5 bg-slate-900 dark:bg-white rounded-full border-2 border-white dark:border-slate-900 shadow-md transition-all duration-300"
                  style={{ left: `calc(${gaugePercent}% - 4px)` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
                <span>&lt; 18.5 Under</span>
                <span>18.5 - 24.9 Normal</span>
                <span>25 - 29.9 Over</span>
                <span>30+ Obese</span>
              </div>
            </div>

            {/* Ideal Weight & Calories Breakdown */}
            <div className="mt-5 space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Healthy Weight Range:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {unitSystem === "metric"
                    ? `${minIdealKg.toFixed(1)} - ${maxIdealKg.toFixed(1)} kg`
                    : `${(minIdealKg * 2.20462).toFixed(1)} - ${(maxIdealKg * 2.20462).toFixed(1)} lbs`}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Basal Metabolic Rate (BMR):</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{Math.round(bmr)} kcal/day</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm font-extrabold">
                <span className="text-violet-600 dark:text-violet-400 flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  <span>Maintenance Calories (TDEE):</span>
                </span>
                <span className="text-violet-600 dark:text-violet-400">{tdee} kcal</span>
              </div>
            </div>

            {/* Calorie Goals */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">Weight Loss (-0.5kg/wk)</span>
                <span className="text-base font-black text-emerald-800 dark:text-emerald-300">{Math.max(1200, tdee - 500)} kcal</span>
              </div>
              <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900">
                <span className="text-[10px] text-violet-700 dark:text-violet-400 block font-semibold">Muscle Gain (+0.25kg/wk)</span>
                <span className="text-base font-black text-violet-800 dark:text-violet-300">{tdee + 300} kcal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

