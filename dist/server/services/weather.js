"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherFromCity = getWeatherFromCity;
const config_1 = require("../../config");
const types_1 = require("../../helpers/types");
const logger_1 = require("../../lib/logger");
const API_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
function getWeatherType(id) {
    if (id >= 200 && id < 300)
        return types_1.WeatherType.Thunderstorm;
    if (id >= 300 && id < 400)
        return types_1.WeatherType.Drizzle;
    if (id >= 500 && id < 600)
        return types_1.WeatherType.Rain;
    if (id >= 600 && id < 700)
        return types_1.WeatherType.Snow;
    if (id >= 700 && id < 800)
        return types_1.WeatherType.Atmosphere;
    if (id === 800)
        return types_1.WeatherType.Clear;
    if (id > 800 && id < 900)
        return types_1.WeatherType.Clouds;
    return types_1.WeatherType.Atmosphere;
}
async function getWeatherFromCity(city) {
    try {
        const url = `${API_BASE_URL}?q=${city}&appid=${config_1.envs.OPEN_WEATHER_API_KEY}&units=metric`;
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
        };
    }
    catch (err) {
        logger_1.logger.error("Weather API error:", err.message);
        return null;
    }
}
