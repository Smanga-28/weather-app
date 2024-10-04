import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faExchangeAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'; // Added Location Pin icon

const Navbar = ({ fetchWeatherByLocation }) => {
  return (
    <nav className="navbar">
      <div className='navbar-left'>
      <img className='logo' src={require('./assets/Screenshot (34).png')} alt='TL-logo' />
      <h1>Weather App</h1>
      </div>
      <ul>
        <li><a href="#app">Home</a></li>
        <li><a href="#map">Location</a></li>
        <li><a href="#forecast">Forecast</a></li>

        <li>
          <button onClick={fetchWeatherByLocation} className="location-btn">
            <FontAwesomeIcon icon={faMapMarkerAlt} /> {/* Location Pin icon */}
          </button>
        </li>
      </ul>
    </nav>
  );
};

function App() {
  const [city, setCity] = useState('');
  const [date, setDate] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState('metric'); // Metric for Celsius

  const apiKey = 'b0f97402c0b9944c2ab0d4cee03d0790'; // actual API key

  // Fetch current weather and forecast by city name
  const fetchWeather = async () => {
    try {
      setLoading(true);
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`
      );
      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`
      );

      setWeatherData(weatherResponse.data);
      setForecastData(forecastResponse.data);
      setError('');
    } catch (err) {
      setError('City not found or invalid API call');
      setWeatherData(null);
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather and forecast by current location
  const fetchWeatherByLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            setLoading(true);
            const weatherResponse = await axios.get(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${apiKey}`
            );
            const forecastResponse = await axios.get(
              `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${apiKey}`
            );

            setWeatherData(weatherResponse.data);
            setForecastData(forecastResponse.data);
            setError('');
          } catch (err) {
            setError('Unable to fetch weather for current location');
            setWeatherData(null);
            setForecastData(null);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setError('Location access denied or unavailable');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city) {
      fetchWeather();
    } else {
      setError('Please enter a city');
    }
  };

  const handleClear = () => {
    setCity('');
    setDate(new Date());
    setWeatherData(null);
    setForecastData(null);
    setError('');
  };

  const toggleUnit = () => {
    const newUnit = unit === 'metric' ? 'imperial' : 'metric';
    setUnit(newUnit);
    if (city) {
      fetchWeather();
    }
  };

  const getWeatherForSelectedDate = () => {
    if (!forecastData) return null;
    const selectedDate = date.toISOString().split('T')[0];
    const filteredData = forecastData.list.filter((forecast) => {
      const forecastDate = new Date(forecast.dt * 1000).toISOString().split('T')[0];
      return forecastDate === selectedDate;
    });
    return filteredData.length > 0 ? filteredData : null;
  };

  const selectedDateWeather = getWeatherForSelectedDate();

  return (
    <div className="App" id='app'>
      <Navbar fetchWeatherByLocation={fetchWeatherByLocation} />
      

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city"
            required
          />
          <button className='btn' type="submit">
            <FontAwesomeIcon icon={faSearch} />
          </button>
          <button type="button" onClick={toggleUnit} className="toggle-unit">
            <FontAwesomeIcon icon={faExchangeAlt} />
            <span>{unit === 'metric' ? 'C' : 'F'}</span>
          </button>
        </div>
        <div className="date-picker-group">
          <DatePicker selected={date} onChange={(date) => setDate(date)} />
          <button type="button" onClick={handleClear} className="clear-btn">Clear</button>
        </div>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}

      {weatherData && (
        <div>
          <div className="weather-container">
            <h2>Current Weather in {weatherData.name}</h2>
            <img
              src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
              alt="Weather Icon"
              className="weather-icon"
            />
            <p className="temperature">Temperature: {weatherData.main.temp}°{unit === 'metric' ? 'C' : 'F'}</p>
            <p className="description">Weather: {weatherData.weather[0].description}</p>
            <p>Wind Speed: {weatherData.wind.speed} {unit === 'metric' ? 'm/s' : 'mph'}</p>
            <p>Humidity: {weatherData.main.humidity}%</p>
          </div>

          <div id="map" style={{ height: '300px', width: '800px', }}>
            <MapContainer
              center={[weatherData.coord.lat, weatherData.coord.lon]}
              zoom={10}
              style={{ height: '300px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[weatherData.coord.lat, weatherData.coord.lon]}>
                <Popup>{`Weather in ${weatherData.name}`}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {selectedDateWeather ? (
        <div id='forecast'>
          <h2>Weather Forecast for {date.toDateString()}</h2>
          <div className="forecast-container">
            {selectedDateWeather.map((forecast, index) => (
              <div key={index} className="forecast-item">
                <p>{new Date(forecast.dt * 1000).toLocaleTimeString()}</p>
                <p>Temperature: {forecast.main.temp}°{unit === 'metric' ? 'C' : 'F'}</p>
                <p>{forecast.weather[0].description}</p>
                <img
                  src={`http://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`}
                  alt="Weather Icon"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>No weather data available for the selected date.</p>
      )}
      <footer>
        <p>&copy;{new Date().getFullYear()} CapaCiTi TECH L.E.A.D All Rights Reserved</p>
      </footer>
    </div>
  );
}

export default App;
