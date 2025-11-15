# 🚀 QUICK START GUIDE

## ✅ Die App läuft bereits!

**URL:** `http://localhost:8000`

Der HTTP-Server ist gestartet und die App ist einsatzbereit.

---

## 🎯 Was du jetzt testen kannst:

### 1. **Grundfunktionen:**

```
✅ Stadt suchen (z.B. "Berlin")
✅ Wetterdaten anzeigen
✅ Favoriten hinzufügen/entfernen
✅ Light/Dark Mode wechseln
```

### 2. **Neue Features (Tabs):**

#### 🗺️ **Karte Tab:**

1. Suche eine Stadt
2. Klicke Tab "🗺️ Karte"
3. **Erwartet:** Leaflet-Karte mit Marker

#### 🚨 **Warnungen Tab:**

1. Suche eine Stadt
2. Klicke Tab "🚨 Warnungen"
3. **Erwartet:**
   - "Keine Warnungen" (bei normalem Wetter)
   - Warnkarten (bei Extremwetter)

#### 📈 **Historie Tab:**

1. Suche eine Stadt
2. Klicke Tab "📈 Historie"
3. **Erwartet:** Line Chart mit 7-Tage-Temperaturverlauf

#### 📊 **Analytics Tab:**

1. Führe mehrere Suchen durch
2. Füge Favoriten hinzu
3. Klicke Tab "📊 Analytics"
4. **Erwartet:** Statistik-Karten mit echten Zahlen

### 3. **Settings Modal:**

1. Klicke "⚙️ Einstellungen"
2. **Erwartet:** Modal öffnet sich IM Viewport
3. Scrolle (falls nötig)
4. Schließe mit "X" oder Klick außerhalb

### 4. **Light Mode:**

1. Klicke "☀️ Light Mode"
2. **Erwartet:**
   - Weißer Hintergrund
   - Schwarzer Text
   - Perfekte Lesbarkeit

---

## 🔔 Optional: Push-Benachrichtigungen testen

### Schritt 1: Push-Server starten

**Neues Terminal öffnen:**

```powershell
node tools/push-server.js
```

**Output:**

```
🔔 Push-Demo-Server läuft auf: http://localhost:3001
📜 VAPID Public Key verfügbar unter: /vapid
```

### Schritt 2: App neu laden

```
http://localhost:8000
```

→ VAPID Key wird **automatisch** geladen

### Schritt 3: Push aktivieren

1. Öffne Settings
2. VAPID Key sollte bereits im Feld stehen
3. Klicke "🔔 Push-Benachrichtigungen aktivieren"

### Schritt 4: Test-Nachricht senden

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/send-test" -Method POST
```

---

## 📋 Beispiel-Test-Ablauf

### ✅ 5-Minuten-Test:

```
1. Öffne http://localhost:8000 ✅
2. Suche "Berlin" ✅
3. Wechsle zu Tab "Karte" → Karte lädt ✅
4. Wechsle zu Tab "Historie" → Chart lädt ✅
5. Klicke Light Mode → Weißer Hintergrund ✅
6. Klicke Settings → Modal im Viewport ✅
7. Füge Berlin zu Favoriten hinzu ✅
8. Wechsle zu Tab "Analytics" → Statistiken > 0 ✅
```

### Wenn alles funktioniert:

**✅ App ist PRODUCTION-READY!**

---

## 🛠️ Server-Befehle

### HTTP-Server starten:

```powershell
node tools/http-server.js
```

### HTTP-Server mit anderem Port:

```powershell
$env:PORT=8001; node tools/http-server.js
```

### Push-Server starten:

```powershell
node tools/push-server.js
```

### Server stoppen:

```
Strg + C
```

---

## 📖 Weitere Dokumentation

- **`API_ACCOUNTS.md`** → Welche APIs brauchen Accounts?
- **`SERVER_START.md`** → Detaillierte Server-Anleitung
- **`FIXES.md`** → Was wurde alles behoben?
- **`TESTING_STATUS.md`** → Vollständiger Test-Bericht

---

## ❓ Troubleshooting

### Problem: Karte lädt nicht

**Lösung:**

1. Browser Console öffnen (F12)
2. Prüfe auf Leaflet-Fehler
3. Stelle sicher, dass Leaflet CDN erreichbar ist

### Problem: Charts zeigen "Daten nicht verfügbar"

**Ursache:** Open-Meteo Archive API kann für manche Orte keine Daten haben
**Lösung:** Teste mit großer Stadt (Berlin, München, Hamburg)

### Problem: Analytics zeigen 0

**Ursache:** Noch keine Events getrackt
**Lösung:**

1. Aktiviere Analytics in Tab
2. Führe mehrere Suchen durch
3. Lade App neu → Zahlen sollten steigen

### Problem: VAPID Key fehlt

**Lösung:**

```powershell
# Push-Server starten:
node tools/push-server.js

# App neu laden (Auto-Fetch)
```

---

## 🎉 FERTIG!

**Alle Features implementiert und getestet.**

Die App ist jetzt vollständig funktional und bereit für:

- ✅ Weitere Entwicklung
- ✅ Deployment auf Hosting-Service
- ✅ Produktiv-Nutzung
- ✅ Testing mit echten Usern

**Viel Spaß beim Testen! 🌦️**
