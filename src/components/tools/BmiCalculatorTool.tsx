"use client";

import { useState } from "react";
import { bmiInputError } from "@/lib/extended-calculators";
import { Flame } from "lucide-react";

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

  const validationError=bmiInputError(totalCm,totalKg,age)||(unitSystem==="imperial"&&(heightIn<0||heightIn>=12)?"Inches must be between 0 and less than 12.":"");
  // BMI = kg / (m)^2
  const heightM = totalCm / 100;
  const bmi = heightM > 0 ? totalKg / (heightM * heightM) : 0;

  // Categories
  let category = "Normal Weight";
  let categoryColor = "text-emerald-600 ";
  let gaugePercent = 50;

  if (bmi < 18.5) {
    category = "Underweight";
    categoryColor = "text-sky-600 ";
    gaugePercent = Math.min(25, (bmi / 18.5) * 25);
  } else if (bmi < 25) {
    category = "Healthy / Normal";
    categoryColor = "text-emerald-600 ";
    gaugePercent = 25 + ((bmi - 18.5) / 6.5) * 25;
  } else if (bmi < 30) {
    category = "Overweight";
    categoryColor = "text-amber-600 ";
    gaugePercent = 50 + ((bmi - 25) / 5) * 25;
  } else {
    category = "Obesity";
    categoryColor = "text-rose-600 ";
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
    <div className="calculator-workspace w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900  tracking-normal">
          BMI & Calorie / TDEE Calculator
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Adult BMI screening and estimated resting and maintenance energy needs.</p>
      </div>

      {validationError && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validationError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none">
            {/* Unit Switcher */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unit System</span>
              <div className="flex bg-slate-100  p-1 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUnitSystem("metric")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    unitSystem === "metric"
                      ? "bg-white  text-violet-600  shadow-none"
                      : "text-slate-600 "
                  }`}
                >
                  Metric (kg / cm)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem("imperial")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    unitSystem === "imperial"
                      ? "bg-white  text-violet-600  shadow-none"
                      : "text-slate-600 "
                  }`}
                >
                  Imperial (lbs / ft)
                </button>
              </div>
            </div>

            {/* Gender & Age */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600  mb-1.5">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100  p-1 rounded-md text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`py-2 rounded-lg text-center transition-all ${
                      gender === "male"
                        ? "bg-white  text-violet-600  shadow-none"
                        : "text-slate-600 "
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`py-2 rounded-lg text-center transition-all ${
                      gender === "female"
                        ? "bg-white  text-violet-600  shadow-none"
                        : "text-slate-600 "
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600  mb-1.5">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min="20"
                  max="120"
                  aria-label="Age"
                  placeholder="Enter a value"
                  value={Number.isFinite(age) ? age : ""}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900 "
                />
              </div>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {unitSystem === "metric" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600  mb-1.5">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="250"
                      aria-label="Height in cm"
                  placeholder="Enter a value"
                  value={Number.isFinite(heightCm) ? heightCm : ""}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900 "
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600  mb-1.5">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      step="0.5"
                      aria-label="Weight in kg"
                  placeholder="Enter a value"
                  value={Number.isFinite(weightKg) ? weightKg : ""}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900 "
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600  mb-1.5">
                      Height (ft & in)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="2"
                        max="8"
                        aria-label="Height in feet"
                  value={Number.isFinite(heightFt) ? heightFt : ""}
                        onChange={(e) => setHeightFt(Number(e.target.value))}
                        className="w-1/2 px-3 py-2.5 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900 "
                        placeholder="Feet"
                      />
                      <input
                        type="number"
                        min="0"
                        max="11"
                        aria-label="Height in inches"
                  value={Number.isFinite(heightIn) ? heightIn : ""}
                        onChange={(e) => setHeightIn(Number(e.target.value))}
                        className="w-1/2 px-3 py-2.5 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900 "
                        placeholder="Inches"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600  mb-1.5">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="700"
                      aria-label="Weight in pounds"
                  placeholder="Enter a value"
                  value={Number.isFinite(weightLbs) ? weightLbs : ""}
                      onChange={(e) => setWeightLbs(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900 "
                    />
                  </div>
                </>
              )}
            </div>

            {/* Activity Level for TDEE */}
            <div>
              <label className="block text-xs font-semibold text-slate-600  mb-2">
                Daily Physical Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(Number(e.target.value))}
                className="w-full text-xs font-semibold bg-slate-50  border border-slate-200  rounded-md py-2.5 px-3 text-slate-900 "
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
        <div style={{display:validationError?"none":undefined}} className="lg:col-span-5 min-w-0 space-y-6">
          <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none">
            <h2 className="text-base font-bold text-slate-900  mb-4">
              Your BMI Results
            </h2>

            {/* BMI Number Card */}
            <div className="p-6 bg-slate-50  rounded-md text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                BMI Score
              </span>
              <div className="text-4xl font-black text-slate-900  mt-1">
                {bmi.toFixed(1)}
              </div>
              <div className={`text-sm font-extrabold mt-1 ${categoryColor}`}>
                {category}
              </div>

              {/* Gauge Bar */}
              <div className="mt-5 relative">
                <div className="h-3 w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500" />
                <div
                  className="absolute -top-1 w-2 h-5 bg-slate-900  rounded-full border-2 border-white  shadow-none transition-all duration-300"
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
              <div className="flex justify-between items-center py-2 border-b border-slate-100 ">
                <span className="text-slate-600 ">BMI reference weight range:</span>
                <span className="font-extrabold text-slate-900 ">
                  {unitSystem === "metric"
                    ? `${minIdealKg.toFixed(1)} - ${maxIdealKg.toFixed(1)} kg`
                    : `${(minIdealKg * 2.20462).toFixed(1)} - ${(maxIdealKg * 2.20462).toFixed(1)} lbs`}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 ">
                <span className="text-slate-600 ">Basal Metabolic Rate (BMR):</span>
                <span className="font-extrabold text-slate-900 ">{Math.round(bmr)} kcal/day</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm font-extrabold">
                <span className="text-violet-600  flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  <span>Maintenance Calories (TDEE):</span>
                </span>
                <span className="text-violet-600 ">{tdee} kcal</span>
              </div>
            </div>

            <p className="mt-4 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">For adults aged 20 and over. BMI is a screening measure, not a diagnosis or target weight. BMR and TDEE are estimates, not a meal plan. Pregnancy, medical conditions and body composition affect interpretation. <a className="underline" href="https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html" target="_blank" rel="noreferrer">CDC guidance</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

