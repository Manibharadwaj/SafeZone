# 🚨 SafeZone - Emergency Alert App

## 📥 Download

Download SafeZone APK (Android)([https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing](https://expo.dev/accounts/mmtspteam/projects/SafeZoneApp/builds/37736c3a-1369-44d3-bbfc-800dd40057e7))


**SafeZone** is a React Native emergency response app designed to detect distress and instantly trigger safety protocols. Whether it’s a scream, a loud noise, or a spoken keyword like “help” or “emergency,” SafeZone responds in real-time to keep users safe.

---

## ⚙️ Features

- 🎤 **Voice Detection (WebView)**  
  Uses Web Speech API to detect keywords like **"help"** or **"emergency"**.

- 🔊 **Loud Sound Detection**  
  Leverages the Web Audio API to pick up distress sounds like **screams or claps**.

- 📸 **Auto Photo Capture**  
  Instantly accesses the camera and takes photos during emergencies.

- 📱 **Emergency SMS Trigger**  
  Automatically sends a pre-defined **SMS alert** to emergency contacts.

- 📞 **Auto Call Trigger**  
  Can initiate a call to a designated emergency number.

- 🚨 **Alarm Playback**  
  Plays a loud siren or alert sound when distress is detected.

- 🔄 **Background Service**  
  Continues to monitor for threats even when the app is running in the background.

---

## 📲 Tech Stack

- **React Native (with Expo)**
- **WebView (for audio + speech APIs)**
- **JavaScript / HTML5 APIs**
- **Expo Media / Permissions / Notifications**
- **React Native Camera, SMS, and Linking**

---

## 📦 Installation


git clone https://github.com/yourusername/safezone-app.git
cd safezone-app
npm install
npx expo start
