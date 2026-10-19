"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Copy,
  Check,
  Scale,
  Sparkles,
  Layers,
  HardDrive,
  Maximize2,
  Thermometer,
} from "lucide-react";

type UnitCategory = "length" | "weight" | "storage" | "area" | "temperature";

interface UnitDef {
  id: string;
  name: string;
  toBase: (v: number) => number; // convert to base unit
  fromBase: (v: number) => number; // convert from base unit
}

const unitData: Record<UnitCategory, { name: string; base: string; units: UnitDef[] }> = {
  length: {
    name: "Length",
    base: "m",
    units: [
      { id: "m", name: "Meters (m)", toBase: (v) => v, fromBase: (v) => v },
      { id: "km", name: "Kilometers (km)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "cm", name: "Centimeters (cm)", toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
      { id: "mm", name: "Millimeters (mm)", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: "mi", name: "Miles (mi)", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { id: "yd", name: "Yards (yd)", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: "ft", name: "Feet (ft)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: "in", name: "Inches (in)", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    ],
  },
  weight: {
    name: "Weight & Mass",
    base: "kg",
    units: [
      { id: "kg", name: "Kilograms (kg)", toBase: (v) => v, fromBase: (v) => v },
      { id: "g", name: "Grams (g)", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: "mg", name: "Milligrams (mg)", toBase: (v) => v * 1e-6, fromBase: (v) => v / 1e-6 },
      { id: "t", name: "Metric Tons (t)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "lb", name: "Pounds (lbs)", toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: "oz", name: "Ounces (oz)", toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
    ],
  },
  storage: {
    name: "Data Storage",
    base: "MB",
    units: [
      { id: "B", name: "Bytes (B)", toBase: (v) => v / (1024 * 1024), fromBase: (v) => v * (1024 * 1024) },
      { id: "KB", name: "Kilobytes (KB)", toBase: (v) => v / 1024, fromBase: (v) => v * 1024 },
      { id: "MB", name: "Megabytes (MB)", toBase: (v) => v, fromBase: (v) => v },
      { id: "GB", name: "Gigabytes (GB)", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: "TB", name: "Terabytes (TB)", toBase: (v) => v * (1024 * 1024), fromBase: (v) => v / (1024 * 1024) },
      { id: "PB", name: "Petabytes (PB)", toBase: (v) => v * (1024 * 1024 * 1024), fromBase: (v) => v / (1024 * 1024 * 1024) },
    ],
  },
  area: {
    name: "Area & Land",
    base: "sqm",
    units: [
      { id: "sqm", name: "Square Meters (m²)", toBase: (v) => v, fromBase: (v) => v },
      { id: "sqft", name: "Square Feet (ft²)", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: "sqkm", name: "Square Kilometers (km²)", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: "sqmi", name: "Square Miles (mi²)", toBase: (v) => v * 2589988.11, fromBase: (v) => v / 2589988.11 },
      { id: "acre", name: "Acres", toBase: (v) => v * 4046.85642, fromBase: (v) => v / 4046.85642 },
      { id: "hectare", name: "Hectares", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      { id: "bigha", name: "Bigha (India Standard)", toBase: (v) => v * 2500, fromBase: (v) => v / 2500 },
    ],
  },
  temperature: {
    name: "Temperature",
    base: "c",
    units: [
      { id: "c", name: "Celsius (°C)", toBase: (v) => v, fromBase: (v) => v },
      { id: "f", name: "Fahrenheit (°F)", toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: "k", name: "Kelvin (K)", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
};

export function UnitConverterTool() {
  const fromValueId = useId();

  const [category, setCategory] = useState<UnitCategory>("length");
  const [fromUnit, setFromUnit] = useState<string>("km");
  const [toUnit, setToUnit] = useState<string>("mi");
  const [fromValue, setFromValue] = useState<number>(10);
  const [copied, setCopied] = useState<boolean>(false);

  const currentDef = unitData[category];
  const fromUnitObj = currentDef.units.find((u) => u.id === fromUnit) || currentDef.units[0];
  const toUnitObj = currentDef.units.find((u) => u.id === toUnit) || currentDef.units[1];

  // Conversion
  const val = Number(fromValue) || 0;
  const inBase = fromUnitObj.toBase(val);
  const convertedResult = toUnitObj.fromBase(inBase);

  // Multi-unit overview table
  const allConversions = currentDef.units.map((u) => ({
    name: u.name,
    id: u.id,
    value: u.fromBase(inBase),
  }));

  const handleCategoryChange = (newCat: UnitCategory) => {
    setCategory(newCat);
    const catUnits = unitData[newCat].units;
    setFromUnit(catUnits[0].id);
    setToUnit(catUnits[1]?.id || catUnits[0].id);
  };

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const formatNumber = (num: number) => {
    if (isNaN(num)) return "0";
    if (Math.abs(num) >= 1e9 || (Math.abs(num) > 0 && Math.abs(num) < 1e-4)) {
      return num.toExponential(4);
    }
    return parseFloat(num.toFixed(6)).toString();
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(`${formatNumber(convertedResult)} ${toUnitObj.name}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800 mb-3">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Universal Measurement Conversion</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Unit Converter
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Fast, accurate conversions for Length, Weight, Digital Storage, Land Area (Acres, Bigha, Sq.ft), and Temperature.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {(
          [
            { id: "length", label: "Length", icon: ArrowLeftRight },
            { id: "weight", label: "Weight", icon: Scale },
            { id: "storage", label: "Data Storage", icon: HardDrive },
            { id: "area", label: "Area & Land", icon: Maximize2 },
            { id: "temperature", label: "Temperature", icon: Thermometer },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const isSelected = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCategoryChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                isSelected
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Converter Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Convert {currentDef.name}
            </h2>
            <button
              type="button"
              onClick={handleSwap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Swap Units</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* From Input */}
            <div className="space-y-2">
              <label htmlFor={fromValueId} className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                From
              </label>
              <input
                id={fromValueId}
                type="number"
                value={fromValue || ""}
                onChange={(e) => setFromValue(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                {currentDef.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* To Output */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">To</span>
                <button
                  type="button"
                  onClick={copyResult}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="w-full px-4 py-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 text-xl font-black text-violet-700 dark:text-violet-300 overflow-x-auto">
                {formatNumber(convertedResult)}
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                {currentDef.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Formula summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <strong>Formula:</strong> 1 {fromUnitObj.name} = {formatNumber(toUnitObj.fromBase(fromUnitObj.toBase(1)))} {toUnitObj.name}
          </div>
        </div>

        {/* All Units Quick Overview Table (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Quick Conversion Table ({formatNumber(val)} {fromUnitObj.id})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {allConversions.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{formatNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

