"use client";
import { useState, useRef, useEffect } from "react";

const PRESET_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#B7B7B7", "#CCCCCC", "#D9D9D9", "#EFEFEF", "#F3F3F3", "#FFFFFF",
  "#980000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#4A86E8", "#0000FF", "#9900FF", "#FF00FF",
  "#E6B8AF", "#F4CCCC", "#FCE5CD", "#FFF2CC", "#D9EAD3", "#D0E0E3", "#C9DAF8", "#CFE2F3", "#D9D2E9", "#EAD1DC",
  "#DD7E6B", "#EA9999", "#F9CB9C", "#FFE599", "#B6D7A8", "#A2C4C9", "#A4C2F4", "#9FC5E8", "#B4A7D6", "#D5A6BD",
  "#CC4125", "#E06666", "#F6B26B", "#FFD966", "#93C47D", "#76A5AF", "#6D9EEB", "#6FA8DC", "#8E7CC3", "#C27BA0",
  "#A61C00", "#CC0000", "#E69138", "#F1C232", "#6AA84F", "#45818E", "#3C78D8", "#3D85C6", "#674EA7", "#A64D79",
  "#85200C", "#990000", "#B45F06", "#BF9000", "#38761D", "#134F5C", "#1155CC", "#0B5394", "#351C75", "#741B47",
  "#5B0F00", "#660000", "#783F04", "#7F6000", "#274E13", "#0C343D", "#1C4587", "#073763", "#20124D", "#4C1130",
];

export function ColorPicker({ value, onChange, disabled, title }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value || "#000000");
  const pickerRef = useRef(null);

  useEffect(() => {
    if (value) {
      setCustomColor(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleColorSelect = (color) => {
    onChange(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange(color);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        className="px-3 py-1.5 text-base rounded-md border border-border/70 bg-background transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/80 flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title={title}
      >
        <span
          className="w-4 h-4 rounded border border-border"
          style={{ backgroundColor: value || "#000000" }}
        />
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-3 rounded-lg border border-border bg-popover shadow-lg z-50 w-64">
          <div className="grid grid-cols-10 gap-1 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="w-5 h-5 rounded border border-border cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                title={color}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="w-10 h-8 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                  onChange(e.target.value);
                }
              }}
              className="input flex-1 h-8 text-sm"
              placeholder="#000000"
            />
          </div>

          <button
            type="button"
            className="w-full mt-2 px-2 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
          >
            Clear Color
          </button>
        </div>
      )}
    </div>
  );
}
