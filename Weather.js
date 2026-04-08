const apiKey = "78803eefb5bc34dcf9367336d2e2ec28";
const apiUrl =
  "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");

async function checkWeather(city) {
  const response = await fetch(apiUrl + city + `&appid=${apiKey}`);

  if (response.status == 404) {
    document.querySelector(".error").style.display = "block";
    document.querySelector(".weather").style.display = "none";
  } else {
    var data = await response.json();

    document.querySelector(".city").innerHTML = data.name;

    document.querySelector(".temp").innerHTML =
      Math.round(data.main.temp) + "°C";

    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";

    document.querySelector(".wind").innerHTML = data.wind.speed + "km/hr";

    if (data.weather[0].main == "Clouds") {
      weatherIcon.src =
        "https://cdn-icons-png.flaticon.com/512/1163/1163634.png";
    } else if (data.weather[0].main == "Rain") {
      weatherIcon.src =
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStLkcaI3l9LYNP46TUie9c04s-ytiMHYGRAw&s";
    } else if (data.weather[0].main == "Clear") {
      weatherIcon.src =
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0_X5HZv7J5d1zl084jiTyn4zygQ0VTEyHGyUMibH9ij9uZnwXQW3CeFtYQ6cvb6xg-OA&usqp=CAU";
    } else if (data.weather[0].main == "Drizzle") {
      weatherIcon.src =
        "https://cdn3d.iconscout.com/3d/premium/thumb/heavy-drizzle-day-and-lightning-7194576-6067836.png";
    } else if (data.weather[0].main == "Mist") {
      weatherIcon.src =
        "https://w7.pngwing.com/pngs/296/238/png-transparent-cloudy-day-fog-foggy-mist-sun-weather-the-weather-is-nice-today-icon.png";
    }

    document.querySelector(".weather").style.display = "block";
    document.querySelector(".error").style.display = "none";
  }
}

searchBtn.addEventListener("click", () => {
  if (searchBox.value) {
    checkWeather(searchBox.value);
  }
});

searchBox.addEventListener("keypress", (event) => {
  if (event.key == "Enter" && searchBox.value) {
    checkWeather(searchBox.value);
  }
});
