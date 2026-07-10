"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  city: string;
  temp: number;
  desc: string;
  icon: string;
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // Simple weather using wttr.in (no API key needed)
    fetch("https://wttr.in/?format=j1")
      .then((r) => r.json())
      .then((data) => {
        const current = data.current_condition?.[0];
        if (current) {
          setWeather({
            city: data.nearest_area?.[0]?.areaName?.[0]?.value ?? "未知",
            temp: parseInt(current.temp_C),
            desc: current.lang_zh?.[0]?.value ?? current.weatherDesc?.[0]?.value ?? "",
            icon: getWeatherIcon(current.weatherCode),
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!weather) return null;

  return (
    <div className="weather-widget">
      <span className="weather-icon">{weather.icon}</span>
      <div>
        <div className="weather-temp">{weather.temp}°C</div>
        <div className="weather-desc">{weather.city} · {weather.desc}</div>
      </div>
    </div>
  );
}

function getWeatherIcon(code: string): string {
  const c = parseInt(code);
  if (c === 113) return "☀️";
  if (c === 116) return "⛅";
  if ([119, 122].includes(c)) return "☁️";
  if ([176, 263, 266, 293, 296].includes(c)) return "🌦️";
  if ([299, 302, 305, 308, 356, 359].includes(c)) return "🌧️";
  if ([200, 386, 389].includes(c)) return "⛈️";
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(c))
    return "❄️";
  if ([143, 248, 260].includes(c)) return "🌫️";
  return "🌤️";
}
