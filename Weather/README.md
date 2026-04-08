# Weather App ⛅

A simple and beautiful weather application built with HTML, CSS, and JavaScript. Get real-time weather information for any city worldwide using the OpenWeather API.

## Features ✨

- **Real-time Weather Data**: Get current weather information for any city
- **Weather Icons**: Dynamic weather icons based on current conditions
- **Detailed Information**: Display temperature, humidity, and wind speed
- **Error Handling**: Clear error messages for invalid city names
- **Responsive Design**: Works on desktop and mobile devices
- **Quick Search**: Search by pressing Enter or clicking the search button
- **Beautiful UI**: Modern gradient design with smooth interactions

## Weather Conditions Supported 🌦️

- ☁️ Clouds
- 🌧️ Rain
- ☀️ Clear
- 🌦️ Drizzle
- 🌫️ Mist

## How to Use 🚀

1. **Clone the Repository**

   ```bash
   git clone https://github.com/shashankpandya/Weather_app
   cd Weather_app
   ```

2. **Open in Browser**
   - Simply open `Weather.html` in your web browser
   - Or use a local server:

     ```bash
     # Using Python 3
     python -m http.server 8000

     # Using Python 2
     python -m SimpleHTTPServer 8000

     # Using Node.js (with http-server)
     npx http-server
     ```

3. **Enter a City Name**
   - Type any city name in the search box
   - Press Enter or click the search button
   - View the current weather information

## Live Preview 🌐

Try the app directly without downloading:

- **GitHub Pages**: [View Live Demo](https://shashankpandya.github.io/Weather_app/)
- **JSFiddle Alternative**: Copy the HTML, CSS, and JS files to create your own preview
- **Local**: Open `Weather.html` directly in your browser

## API Used 🔌

- **Open Weather Map API**: Free tier for current weather data
- **Endpoint**: `https://api.openweathermap.org/data/2.5/weather`
- **API Key**: Included (replace with your own for production)

## File Structure 📁

```
Weather_app/
├── Weather.html      # Main HTML structure
├── Weather.css       # Styling and layout
├── Weather.js        # Weather logic and API calls
└── README.md         # Documentation
```

## Bug Fixes & Improvements ✅

- ✅ Fixed case-sensitivity bug in weather condition checking ("clear" → "Clear")
- ✅ Removed incorrect DOM selector that caused errors
- ✅ Added Enter key support for search
- ✅ Added input validation (empty field checking)
- ✅ Fixed duplicate CSS rules for heading styles
- ✅ Improved error handling

## Customization 🎨

### Change API Key

Replace the API key in `Weather.js`:

```javascript
const apiKey = "YOUR_API_KEY_HERE";
```

Get your free API key from [OpenWeatherMap](https://openweathermap.org/api)

### Modify Colors

Edit the gradient in `Weather.css`:

```css
background: linear-gradient(135deg, #00feba, #5b548a);
```

### Add More Weather Conditions

Add more conditions in the `checkWeather()` function in `Weather.js`

## Troubleshooting 🔧

| Issue                     | Solution                                                               |
| ------------------------- | ---------------------------------------------------------------------- |
| "Invalid city name" error | Make sure you're typing a valid city name (e.g., "London", "New York") |
| Icons not loading         | Check your internet connection; icons are loaded from CDN              |
| API not responding        | Verify your API key is valid and has free tier access                  |
| Search not working        | Clear browser cache or try a different city name                       |

## Browser Support 🌍

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Future Enhancements 🚀

- [ ] 5-day weather forecast
- [ ] Weather history/trending
- [ ] Multiple city comparison
- [ ] Temperature unit toggle (°C/°F)
- [ ] Dark/Light mode
- [ ] Geolocation support
- [ ] Weather alerts

## License 📄

This project is open source and available under the MIT License.

## Author 👨‍💻

Created by [Shashank Pandya](https://github.com/shashankpandya)

---

**Enjoy exploring the weather! 🌤️**
