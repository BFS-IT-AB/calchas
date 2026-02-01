# Production-Ready Struktur - Refactoring Abgeschlossen

## ✅ Neue Ordnerstruktur

```
/
├── index.html                  # Haupt-HTML (Root)
├── app.js                      # Haupt-App-Logik (Root)
├── service-worker.js           # Service Worker (Root-Scope)
├── click-debug.js              # Debug-Tools
├── manifest.json               # PWA Manifest
├── package.json                # NPM-Konfiguration
├── .cfignore                   # Cloudflare Pages Ignore
├── .gitignore                  # Git Ignore
├── jest.config.js              # Jest Test-Konfiguration
│
├── css/                        # Stylesheets
│   ├── style.css
│   └── mobile.css
│
├── js/                         # JavaScript-Module
│   ├── api/                    # API-Integrationen
│   ├── ui/                     # UI-Komponenten
│   ├── utils/                  # Utilities
│   ├── logic/                  # Business Logic
│   ├── config/                 # Konfiguration
│   ├── i18n/                   # Internationalisierung
│   └── vendor/                 # Third-party Libraries
│
├── assets/                     # Statische Assets
│   ├── froggie/
│   ├── google-weather-icons/
│   ├── screenshots/
│   └── logo.png
│
├── legal/                      # Rechtliche Dokumente
│   ├── privacy.html
│   └── terms.html
│
└── dev/                        # Development-only Dateien
    ├── docs/                   # Dokumentation
    ├── tests/                  # Tests
    ├── tools/                  # Dev-Tools
    ├── coverage/               # Test Coverage Reports
    └── Schulisches/            # Schulmaterialien
```

## 🔄 Durchgeführte Änderungen

### 1. Ordnerstruktur

- ✅ `/css`, `/js`, `/assets`, `/dev` Ordner erstellt
- ✅ CSS-Dateien nach `/css/` verschoben
- ✅ JS-Module nach `/js/` verschoben
- ✅ Assets nach `/assets/` verschoben
- ✅ Haupt-Dateien ins Root verschoben
- ✅ Dev-Ordner nach `/dev/` verschoben
- ✅ `src/` Ordner entfernt

### 2. Pfad-Updates

- ✅ [index.html](index.html): Alle CSS/JS/Asset-Pfade aktualisiert
- ✅ [app.js](app.js): Import-Pfade für Module aktualisiert
- ✅ [service-worker.js](service-worker.js): Cache-Pfade für Root-Scope aktualisiert
- ✅ [manifest.json](manifest.json): Screenshot-Pfade aktualisiert
- ✅ [package.json](package.json): Script-Pfade aktualisiert
- ✅ [jest.config.js](jest.config.js): Test-Pfade aktualisiert

### 3. Deployment-Konfiguration

- ✅ [.cfignore](.cfignore) erstellt für Cloudflare Pages
- ✅ [.gitignore](.gitignore) bereinigt (alte build:pages Einträge entfernt)
- ✅ `build:pages` Script entfernt (nicht mehr nötig)

## 🚀 Cloudflare Pages Deployment

### Konfiguration:

```yaml
Build Command: (leer lassen)
Output Directory: /
Node Version: 18.x oder höher
```

### Deployment-Verhalten:

- Cloudflare Pages deployed **alles im Root** automatisch
- `.cfignore` verhindert Upload von:
  - `dev/` (Docs, Tests, Tools)
  - `node_modules/`
  - Markdown- und Text-Dateien
  - Git-Verzeichnis

### Was deployed wird:

- ✅ `index.html`, `app.js`, `service-worker.js`
- ✅ `/css/` - Alle Stylesheets
- ✅ `/js/` - Alle JavaScript-Module
- ✅ `/assets/` - Alle statischen Assets
- ✅ `/legal/` - Rechtliche Dokumente
- ✅ `manifest.json` - PWA Manifest

## 📝 Lokaler Development-Server

```bash
npm start
# Startet dev/tools/http-server.js auf Port 8000
```

Oder mit `http-server` direkt:

```bash
npx http-server -p 8000 -c-1
```

## ✨ Vorteile der neuen Struktur

1. **Production-Ready**: Root enthält nur deploybare Dateien
2. **Klare Trennung**: Dev-Dateien in `/dev/`, Production-Code im Root
3. **Kein Build nötig**: Direktes Deployment ohne Build-Step
4. **Cloudflare-optimiert**: `.cfignore` reduziert Upload-Größe
5. **Service Worker im Root**: Korrekter Scope für PWA
6. **Übersichtlich**: Logische Ordnerstruktur (`/css`, `/js`, `/assets`)

## 🧪 Tests

Tests laufen weiterhin:

```bash
npm test           # Jest Tests
npm run test:watch # Watch Mode
```

Test-Dateien liegen jetzt in `/dev/tests/`.

## 🎯 Nächste Schritte

1. Teste die App lokal: `npm start`
2. Öffne `http://localhost:8000`
3. Überprüfe alle Features
4. Pushe zu GitHub
5. Deploye auf Cloudflare Pages

---

**Refactoring abgeschlossen am:** 01.02.2026
**Cache-Version:** calchas-v12
