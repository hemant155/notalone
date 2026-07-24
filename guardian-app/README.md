# Guardian — MVP v0

Ye MVP ka **v0** hai. Ismein sirf core safety feature kaam karti hai:

- **SOS button** — 1 sec dabao, 3-2-1 countdown, phir tumhari live location ka Google Maps link guardians ko SMS ke liye taiyaar ho jaata hai.
- **Guardians** — trusted contacts add/remove karo (manual ya phone contacts se).
- Data phone pe hi save hota hai (AsyncStorage) — abhi koi backend nahi.

---

## Chalane ke liye (version-safe tareeka)

Kyunki Expo ka SDK time ke saath badalta rehta hai, sabse safe raasta ye hai ki fresh app banao aur usmein ye files daal do:

1. **Node.js** install hona chahiye (https://nodejs.org).
2. Fresh Expo app banao:
   ```
   npx create-expo-app@latest guardian-app --template blank
   ```
3. Is folder ke `App.js`, `app.json`, aur poora `src/` folder us naye project mein copy kar do (purane files overwrite kar do).
4. Native modules install karo (ye command tumhare Expo SDK ke hisaab se sahi version laati hai):
   ```
   npx expo install expo-location expo-sms expo-contacts @react-native-async-storage/async-storage
   ```
5. Chalao:
   ```
   npx expo start
   ```
6. Phone mein **Expo Go** app download karo, aur terminal mein aaya **QR code** scan karo. App phone pe khul jaayega.

---

## Zaroori note (SOS ke baare mein)

Abhi `expo-sms` phone ka **SMS composer khol deta hai** location + message ke saath — user ko "send" khud dabana padta hai. Ye **silently apne aap send nahi karta**.

Ek real emergency mein tum chahoge ki bina kuch kiye alert chala jaaye. Uske liye do raaste hain, aur ye **agla step** hai:

- **Backend + SMS API** (jaise Twilio ya MSG91): app server ko batayega, server SMS + push notification bhejega. Ye sabse reliable hai.
- **Native Android build** with SEND_SMS permission (Expo Go ke bahar, dev build): background silent SMS possible.

v0 ka maksad hai ki tum flow apne phone pe dekh lo aur test kar lo.

---

## Aage kya (roadmap)

1. Backend + real-time location sharing (guardians live dot dekh sakein).
2. Auto-send SOS (SMS API + push).
3. Guardian ka apna view — incoming alert screen.
4. Auto-Guard (routine learning + deviation detection).
5. Safe routes, threat detection.
