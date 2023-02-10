"use strict";

// selectors

const form = document.querySelector(".form");
const hoursContainer = document.querySelector(".hours");
const daysContainer = document.querySelector(".days");

const sunsetUI = document.querySelector(".time-sunset");
const sunriseUI = document.querySelector(".time-sunrise");

const scrollRight = document.querySelector(".scroll-right");
const scrollLeft = document.querySelector(".scroll-left");

const scrollRightHours = document.querySelector(".scroll-right-hours");
const scrollLeftHours = document.querySelector(".scroll-left-hours");

const hamburger = document.querySelector(".hamburger");

const positionBtn = document.querySelector(".position");

const locationParg = document.querySelector(".location");
/*




*/

class day {
  constructor(
    time,
    weathercode,
    temperatureMax,
    temperatureMin,
    sunrise,
    sunset,
    percipitationH,
    humidityH,
    temperatureH,
    timeH,
    weathercodeH,
    visibility,
    windSpeed,
    airPressure
  ) {
    this.visibility = visibility;
    this.windSpeed = windSpeed;
    this.airPressure = airPressure;
    this.time = time;
    this.weathercode = weathercode;
    this.temperatureMax = Math.round(temperatureMax);
    this.temperatureMin = Math.round(temperatureMin);
    this.sunrise = sunrise;
    this.sunset = sunset;
    this.percipitationH = percipitationH;
    this.humidityH = humidityH;
    this.temperatureH = temperatureH;
    this.timeH = timeH;
    this.weathercodeH = weathercodeH;
    this.date = this._getday();

    this.nightOrDay = this._getnightOrDay();
  }

  _getday() {
    const date = new Date(this.time);
    if (new Date().getDay() == date.getDay()) return "Today";

    const options = {
      day: "numeric",
      weekday: "long",
      // month: "long",
    };
    return new Intl.DateTimeFormat(navigator.language, options).format(date);
  }

  _getnightOrDay() {
    const nightOrDay =
      new Date().getHours() >= new Date(this.sunset).getHours() &&
      new Date().getHours() >= new Date(this.sunrise).getHours()
        ? "night"
        : "day";

    return nightOrDay;
  }
}

class weatherApp {
  #days;
  constructor() {
    this._getmeteoInfo();
    daysContainer.addEventListener("click", this._changeHours.bind(this));
    form.addEventListener("submit", this._search.bind(this));
    scrollLeft.addEventListener("click", this._scrollToLeft.bind(this));
    scrollRight.addEventListener("click", this._scrollToRight.bind(this));
    scrollRightHours.addEventListener(
      "click",
      this._scrollToRightHours.bind(this)
    );
    scrollLeftHours.addEventListener(
      "click",
      this._scrollToLeftHours.bind(this)
    );

    hamburger.addEventListener("click", this._toggleForm.bind(this));

    positionBtn.addEventListener("click", this._renderByPosition.bind(this));
  }

  _getPosition = () =>
    new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

  _getmeteoInfo = async function (lat, lng) {
    try {
      this.#days = [];
      daysContainer.textContent = "";
      hoursContainer.textContent = "";
      let latitude = lat;
      let longitude = lng;
      if (!lat && !lng) {
        locationParg.textContent = "Based on your location";
        // getting user position
        const position = await this._getPosition();
        console.log(position);
        ({ latitude, longitude } = position.coords);
        const respGeoc = await fetch(
          `https:geocode.xyz/${latitude},${longitude}?geoit=json`
        );

        console.log(await respGeoc.json());
      }

      // getting weather info
      const weather = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relativehumidity_2m,precipitation,weathercode,visibility,pressure_msl&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,sunrise,sunset&timezone=auto`
      );

      const weatherInfo = await weather.json();
      if (!weather.ok) throw new Error(weatherInfo.reason);

      const { daily, hourly } = weatherInfo;
      console.log(daily, hourly);
      daily.time.forEach((time, index) => {
        const newDay = new day(
          time,
          daily.weathercode[index],
          daily.temperature_2m_max[index],
          daily.temperature_2m_min[index],
          daily.sunrise[index],
          daily.sunset[index],
          hourly.precipitation.splice(0, 24),
          hourly.relativehumidity_2m.splice(0, 24),
          hourly.temperature_2m.splice(0, 24),
          hourly.time.splice(0, 24),
          hourly.weathercode.splice(0, 24),
          hourly.visibility.splice(0, 24),
          daily.windspeed_10m_max[index],
          hourly.pressure_msl.splice(0, 24)
        );
        this.#days.push(newDay);
        this._renderedays(newDay);
      });

      this.#days[0].temperatureH.forEach((_, index) => {
        this._renderehour(this.#days[0], index);
      });

      this._rendereSriseSet(this.#days[0]);

      daysContainer.querySelector(".day").classList.add("day-active");
      this._movecurrentHour();
      // this._slider();
      console.log(this.#days);
    } catch (err) {
      console.error(err);
    }
  };

  _renderByPosition(e) {
    this._getmeteoInfo();
  }

  // render days info

  _renderedays = function (day) {
    const html = `
    
    <div class="day" data-date =${day.time}>
    <p class="date">${day.date}</p>

    <div class="weather">
      <img class="weather-img" src="img/img-${
        day.weathercode
      }-${day._getnightOrDay()}.svg" alt="" />
      <div class="max-min">
        <p class="max">
          ${day.temperatureMax}<span><strong>°</strong> </span>
        </p>
        <p class="min">
        ${day.temperatureMin}<span><strong>°</strong> </span>
        </p>
      </div>
    </div>
  </div>
    
    `;

    daysContainer.insertAdjacentHTML("beforeend", html);
  };

  _renderehour(day, index) {
    const html = `
    
  <div class="hour" data-hour=${new Date(day.timeH[index]).getHours()}>
  <p class="time">
    <span class="span-hour"><strong>${(
      new Date(day.timeH[index]).getHours() + ""
    ).padStart(2, 0)}</strong></span
    >00
  </p>
  <div class="weather-hour">
    <img src="img/img-${day.weathercodeH[index]}-${
      new Date(day.timeH[index]).getTime() <= new Date(day.sunrise).getTime() ||
      new Date(day.timeH[index]).getTime() >= new Date(day.sunset).getTime()
        ? "night"
        : "day"
    }.svg" alt="weather" />
    <p class="degree">
      ${Math.round(day.temperatureH[index])}<span><strong>°</strong> </span>
    </p>
  </div>

  <div class="precipitation">${day.percipitationH[index]}<span>%</span></div>
</div>
    
    `;

    hoursContainer.insertAdjacentHTML("beforeend", html);

    // margin in base of the degree

    let tempMedia = (day.temperatureMax + day.temperatureMin) / 2;
    let margin = tempMedia - day.temperatureH[index];
    if (margin > 4) margin = 4;
    if (margin < -4) margin = -4;
    // weatherTemp.dataset.margin = margin;

    // we apply the margin in base of the degree
    const hourContainer = hoursContainer
      .querySelectorAll(".hour")
      [index].querySelector(".weather-hour");

    hourContainer.style.marginTop = `${margin}rem`;
  }

  _changeHours(e) {
    const dayCont = e.target.closest(".day");
    if (!dayCont) return;
    console.log(dayCont);
    hoursContainer.textContent = "";
    console.log(dayCont.dataset.date);
    const day = this.#days.find((d) => d.time == dayCont.dataset.date);
    console.log(day);

    day.temperatureH.forEach((_, index) => {
      this._renderehour(day, index);
    });

    this._dayActive(dayCont);
    this._rendereSriseSet(day);
  }

  _dayActive(day) {
    const allDays = daysContainer.querySelectorAll(".day");
    allDays.forEach((d) => d.classList.remove("day-active"));

    day.classList.add("day-active");

    if (new Date(day.dataset.date).getDay() === new Date().getDay())
      this._movecurrentHour();
  }

  _rendereSriseSet(day) {
    sunsetUI.textContent = `${(new Date(day.sunset).getHours() + "").padStart(
      2,
      0
    )}:${(new Date(day.sunset).getMinutes() + "").padStart(2, 0)}`;
    sunriseUI.textContent = `${(new Date(day.sunrise).getHours() + "").padStart(
      2,
      0
    )}:${(new Date(day.sunrise).getMinutes() + "").padStart(2, 0)}`;
  }

  _scrollToRight(e) {
    const lastDayCords = [...document.querySelectorAll(".day")]
      .at(-1)
      .getBoundingClientRect();

    daysContainer.scrollTo({
      left: lastDayCords.left,
      behavior: "smooth",
    });
  }

  _scrollToLeft(e) {
    const lastDayCords = document
      .querySelectorAll(".day")[0]
      .getBoundingClientRect();

    daysContainer.scrollTo({
      left: lastDayCords.left,
      behavior: "smooth",
    });
  }

  _scrollToLeftHours(e) {
    const lastHoursCords = document
      .querySelectorAll(".hour")[0]
      .getBoundingClientRect();

    hoursContainer.scrollTo({
      left: lastHoursCords.left,
      behavior: "smooth",
    });
  }

  _scrollToRightHours(e) {
    const lastDayCords = [...document.querySelectorAll(".hour")]
      .at(-1)
      .getBoundingClientRect();

    hoursContainer.scrollTo({
      left: lastDayCords.left,
      behavior: "smooth",
    });
  }

  _movecurrentHour() {
    const hour = new Date().getHours();
    const currentHour = [...document.querySelectorAll(".hour")].find(
      (h) => h.dataset.hour == hour
    );

    const index = this.#days[0].timeH.findIndex(
      (t) => new Date(t).getHours() == hour
    );

    document.querySelector(".humidity").textContent =
      this.#days[0].humidityH[index];

    document.querySelector(".visibility").textContent = Math.floor(
      this.#days[0].visibility[index] / 1000
    );
    document.querySelector(".wind-speed").textContent = Math.round(
      this.#days[0].windSpeed
    );

    document.querySelector(".air-pressure").textContent = Math.round(
      this.#days[0].airPressure[index]
    );
    console.log(currentHour);
    console.log(index);
    currentHour.classList.add("hour-active");

    const currentHourCoords = currentHour.getBoundingClientRect();
    hoursContainer.scrollTo({
      left: currentHourCoords.left,
      behavior: "smooth",
    });
  }

  _search(e) {
    e.preventDefault();
    let country = document.querySelector(".search").value;
    console.log(country);
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${country}`)
      .then((response) => {
        console.log(Response);
        return response.json();
      })
      .then((data) => {
        console.log(data);
        const country = data.results[0];
        console.log(country.latitude, country.longitude);
        console.log(country);
        locationParg.textContent = `${country.name}, ${country.admin1} (${country.country_code})`;
        this._getmeteoInfo(country.latitude, country.longitude);
      });

    document.querySelector(".search").value = "";
    form.classList.remove("form-active");
  }

  _toggleForm(e) {
    if (!e.target.closest(".hamburger")) return;
    form.classList.toggle("form-active");
  }
}

const app = new weatherApp();

