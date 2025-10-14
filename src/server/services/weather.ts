import { envs } from "@/config";
import { WeatherType } from "@/helpers/types";
import { logger } from "@/lib/logger";

const API_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

function getWeatherType(id: number): WeatherType {
    if (id >= 200 && id < 300) return WeatherType.Thunderstorm;
    if (id >= 300 && id < 400) return WeatherType.Drizzle;
    if (id >= 500 && id < 600) return WeatherType.Rain;
    if (id >= 600 && id < 700) return WeatherType.Snow;
    if (id >= 700 && id < 800) return WeatherType.Atmosphere;
    if (id === 800) return WeatherType.Clear;
    if (id > 800 && id < 900) return WeatherType.Clouds;

    return WeatherType.Atmosphere;
}

export async function getWeatherFromCity(city: string) {
    try {
        const url = `${API_BASE_URL}?q=${city}&appid=${envs.OPEN_WEATHER_API_KEY}&units=metric`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error("Invalid API key");
            }
            else if (res.status === 404) {
                throw new Error("City not found");
            }
            else {
                throw new Error(`API error: ${res.status} ${data.message || ""}`);
            }
        }

        const temperature = Math.round(data.main.temp);
        const weatherId = data.weather[0].id;
        const weatherType = getWeatherType(weatherId);

        return {
            temperature: temperature,
            weatherType: weatherType
        }
    } 
    catch (err) {
        logger.error("Weather API error:", err.message);
        return null
    }
}
