# Bicep Curls Reps Counter

Een React-gebaseerde webapplicatie die bicep curls detecteert en het aantal herhalingen automatisch telt met behulp van MediaPipe en TensorFlow.js.

## 🎯 Doel

Deze applicatie helpt gebruikers bij het uitvoeren van bicep curls door:
- Realtime pose-detectie met MediaPipe
- Automatische telling van herhalingen
- Visuele feedback over de juiste uitvoering
- Een leaderboard om prestaties bij te houden

## 🚀 Installatie

1. Clone de repository:
```bash
git clone [repository-url]
```

2. Installeer de dependencies:
```bash
npm install
```

3. Start de applicatie:
```bash
npm start
```

De applicatie is nu beschikbaar op [http://localhost:3000](http://localhost:3000)

## 💻 Gebruik

De applicatie bestaat uit drie hoofdfuncties:

1. **Data Verzamelen**
   - Verzamel pose data voor "arm omhoog" en "arm omlaag" posities
   - Minimaal 20 voorbeelden per pose worden aanbevolen

2. **Model Trainen**
   - Upload de verzamelde JSON bestanden
   - Train het model met de geüploade data
   - Bekijk de training resultaten en accuracy

3. **App Gebruiken**
   - Voer je naam in
   - Start met het uitvoeren van bicep curls
   - Zie realtime feedback en je aantal herhalingen
   - Bekijk je positie op het leaderboard

## 🛠️ Technologieën

- React
- MediaPipe voor pose-detectie
- TensorFlow.js voor machine learning
- Tailwind CSS voor styling

## 📁 Projectstructuur

```
src/
├── components/
│   ├── DataCollector.js    # Data verzamelen
│   ├── TrainModel.js       # Model training
│   ├── PoseDetector.js     # Pose detectie
│   └── RepsCounter.js      # Herhalingen tellen
├── App.js                  # Hoofdcomponent
└── index.js               # Applicatie startpunt
```

## 🔧 Ontwikkeling

### Beschikbare Scripts

- `npm start`: Start de ontwikkelingsserver
- `npm run build`: Bouwt de productieversie
- `npm test`: Start de test runner

## 📝 Licentie

Dit project is gelicenseerd onder de MIT License - zie het [LICENSE](LICENSE) bestand voor details.
