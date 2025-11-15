# 🔑 API-Account-Informationen

## ✅ Benötigt KEINE Account-Registrierung

Diese APIs funktionieren sofort ohne Registrierung:

### 1. **Open-Meteo** (Hauptquelle)

- **Status:** ✅ Vollständig integriert
- **Kosten:** Kostenlos
- **API-Key:** Nicht erforderlich
- **Dokumentation:** https://open-meteo.com/
- **Features:** Aktuelle Wetterdaten, Vorhersagen, Historische Daten

### 2. **BrightSky** (Zusatzquelle)

- **Status:** ✅ Vollständig integriert
- **Kosten:** Kostenlos
- **API-Key:** Nicht erforderlich
- **Dokumentation:** https://brightsky.dev/
- **Features:** Deutsche Wetterdaten vom DWD

### 3. **Nominatim OSM** (Geocoding)

- **Status:** ✅ Vollständig integriert
- **Kosten:** Kostenlos
- **API-Key:** Nicht erforderlich
- **Dokumentation:** https://nominatim.org/
- **Features:** Ortsnamen in Koordinaten umwandeln

### 4. **Leaflet + OpenStreetMap** (Karten)

- **Status:** ✅ Vollständig integriert
- **Kosten:** Kostenlos
- **API-Key:** Nicht erforderlich
- **Dokumentation:** https://leafletjs.com/
- **Features:** Interaktive Karten

---

## ⚠️ Optional: Zusätzliche APIs (Account erforderlich)

Diese APIs sind **optional** und nur für erweiterte Features notwendig:

### 5. **OpenWeatherMap** (Optional)

- **Status:** ⚠️ Wrapper vorhanden, nicht aktiv genutzt
- **Kosten:** Kostenlos bis 1.000 API Calls/Tag
- **API-Key:** ✅ Erforderlich
- **Registrierung:** https://openweathermap.org/api
- **Schritte:**
  1. Gehe zu https://openweathermap.org/api
  2. Klicke "Sign Up" und erstelle einen Account
  3. Verifiziere deine E-Mail-Adresse
  4. Gehe zu "API Keys" und kopiere deinen Key
  5. Trage den Key in die App-Settings ein

### 6. **VisualCrossing** (Optional)

- **Status:** ⚠️ Wrapper vorhanden, nicht aktiv genutzt
- **Kosten:** Kostenlos bis 1.000 API Calls/Tag
- **API-Key:** ✅ Erforderlich
- **Registrierung:** https://www.visualcrossing.com/weather-api
- **Schritte:**
  1. Gehe zu https://www.visualcrossing.com/sign-up
  2. Erstelle einen Free Account
  3. Bestätige deine E-Mail
  4. Kopiere deinen API Key aus dem Dashboard
  5. Trage den Key in die App-Settings ein

### 7. **Meteostat** (Optional)

- **Status:** ⚠️ Wrapper vorhanden, nicht aktiv genutzt
- **Kosten:** Basic kostenlos, Pro ab $9/Monat
- **API-Key:** Optional (für höhere Limits)
- **Registrierung:** https://dev.meteostat.net/
- **Features:** Historische Wetterdaten, Langzeitanalysen

---

## 🚀 App-Start OHNE zusätzliche Accounts

**Du kannst die App sofort starten!** Alle Kern-Features funktionieren mit den kostenlosen, schlüssellosen APIs:

✅ **Funktionierende Features ohne Account:**

- Wetter-Suche für beliebige Orte
- Aktuelle Wetterdaten (Temperatur, Wind, Luftfeuchtigkeit)
- 7-Tage-Vorhersage
- Stündliche Vorhersage
- Interaktive Karte (Leaflet + OSM)
- Historische Daten (letzte 7 Tage)
- Wetterwarnungen (basierend auf Wettercodes)
- Favoriten-Verwaltung
- Offline-Modus
- PWA-Installation
- Push-Benachrichtigungen (lokaler Server erforderlich)

---

## 📝 Zusammenfassung

| API            | Account?    | Kosten    | Integration |
| -------------- | ----------- | --------- | ----------- |
| Open-Meteo     | ❌ Nein     | Kostenlos | ✅ Aktiv    |
| BrightSky      | ❌ Nein     | Kostenlos | ✅ Aktiv    |
| Nominatim      | ❌ Nein     | Kostenlos | ✅ Aktiv    |
| Leaflet/OSM    | ❌ Nein     | Kostenlos | ✅ Aktiv    |
| OpenWeatherMap | ✅ Ja       | Free Tier | ⚠️ Optional |
| VisualCrossing | ✅ Ja       | Free Tier | ⚠️ Optional |
| Meteostat      | ⚠️ Optional | Free/Paid | ⚠️ Optional |

**Empfehlung:** Starte die App ohne zusätzliche Accounts. Falls du später erweiterte Features möchtest, kannst du die optionalen APIs nachträglich aktivieren.
