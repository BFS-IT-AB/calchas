# TODO: PWA Screenshots

## ❌ Problem

Die aktuellen Screenshots in `manifest.json` sind **Placeholder-SVGs**, keine echten App-Screenshots.

**PWA Best Practice:** Keine Placeholder-SVGs verwenden. Entweder echte Screenshots oder Array leeren.

---

## ✅ Lösung 1: Echte Screenshots erstellen (empfohlen)

### Anforderungen:

- **Wide (Desktop/Tablet):** 1280x720 PNG
- **Narrow (Mobile):** 540x720 PNG
- **Inhalt:** Echte App-UI mit realen Wetter-Daten
- **Format:** PNG (nicht SVG)

### Schritte:

1. App lokal starten (`npm start`)
2. Echte Wetter-Daten laden (z.B. Berlin)
3. Screenshots erstellen:
   - Desktop: Browser auf 1280px Breite, Screenshot der Hauptansicht
   - Mobile: DevTools Device Mode (360x720), Screenshot der Hauptansicht
4. Bilder speichern:
   - `assets/screenshots/screenshot-wide.png`
   - `assets/screenshots/screenshot-narrow.png`
5. `manifest.json` aktualisieren:
   ```json
   "screenshots": [
     {
       "src": "/assets/screenshots/screenshot-narrow.png",
       "sizes": "540x720",
       "type": "image/png",
       "form_factor": "narrow"
     },
     {
       "src": "/assets/screenshots/screenshot-wide.png",
       "sizes": "1280x720",
       "type": "image/png",
       "form_factor": "wide"
     }
   ]
   ```

---

## ✅ Lösung 2: Screenshots temporär entfernen (für Alpha)

Falls Screenshots noch nicht bereit:

```json
"screenshots": []
```

Screenshots sind **optional** für PWAs. Besser leeres Array als Placeholder-SVGs.

---

## 📋 Aktueller Status

- [x] Placeholder-SVGs identifiziert
- [x] ✅ **Echte Screenshots vorhanden** (5 PNG-Dateien)
- [x] ✅ Screenshots in `assets/screenshots/` gespeichert
- [x] ✅ manifest.json aktualisiert mit 4 iPhone Screenshots
- [x] ✅ Alte SVG-Files gelöscht (screenshot-narrow.svg, screenshot-wide.svg)

**🎉 PWA Screenshots komplett - Production-Ready!**

---

## 📱 Installierte Screenshots

**In manifest.json eingetragen:**

1. `iPhone-13-PRO-127.0.0.1 (4).png` - Home Screen (-7°C Berlin)
2. `iPhone-13-PRO-127.0.0.1 (5).png` - Dashboard (Wetter-Grid)
3. `iPhone-13-PRO-127.0.0.1 (6).png` - Health View (Score 71)
4. `iPhone-13-PRO-127.0.0.1 (7).png` - Historie (30-Tage Chart)

**Zusätzlich vorhanden:**

- `Google-Pixel5-127.0.0.1 (1).png` (Reserve)

### Empfohlene Verwendung:

**Narrow (Mobile - 540x720):**

- Screenshot 1 (Home) oder Screenshot 3 (Health) als Hauptansicht

**Wide (Desktop/Tablet - 1280x720):**

- Screenshot 2 (Dashboard) oder Screenshot 4 (Historie)

### Nächste Schritte:

1. **Bilder speichern:**

   ```
   assets/screenshots/home.png          (Screenshot 1)
   assets/screenshots/dashboard.png     (Screenshot 2)
   assets/screenshots/health.png        (Screenshot 3)
   assets/screenshots/historie.png      (Screenshot 4)
   ```

2. **manifest.json aktualisieren** (siehe unten)

---

## 🔗 Referenzen

- [PWA Manifest Spec](https://www.w3.org/TR/manifest-app-info/#screenshots-member)
- [Chrome PWA Criteria](https://web.dev/install-criteria/)
