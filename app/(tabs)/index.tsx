import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  Platform,
  Linking,
  Image,
  Animated,
  Easing,
  ScrollView,
  TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SafeZone() {
  const [location, setLocation] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [storedContact, setStoredContact] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      const savedContact = await AsyncStorage.getItem('emergencyContact');
      if (savedContact) {
        setStoredContact(savedContact);
      }
    })();
  }, []);

  useEffect(() => {
    let timer;
    if (isCounting && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      animatePulse();
    } else if (isCounting && countdown === 0) {
      setIsCounting(false);
      makeEmergencyCall(storedContact);
    }

    return () => clearTimeout(timer);
  }, [countdown, isCounting]);

  const animatePulse = () => {
    pulseAnim.setValue(1);
    Animated.timing(pulseAnim, {
      toValue: 1.3,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();
  };

  const saveContact = async () => {
    if (!emergencyContact) {
      Alert.alert('Invalid Input', 'Please enter a valid phone number.');
      return;
    }
    await AsyncStorage.setItem('emergencyContact', emergencyContact);
    setStoredContact(emergencyContact);
    Alert.alert('Saved', 'Emergency contact saved successfully.');
  };

  const triggerEmergency = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available.');
      return;
    }

    if (!storedContact) {
      Alert.alert('Missing Contact', 'Please set your emergency contact.');
      return;
    }

    const message = `🚨 Emergency! My current location is: https://maps.google.com/?q=${location.latitude},${location.longitude}`;

    try {
      setCountdown(10);

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(
          [storedContact],
          message
        );

        Alert.alert(
          'Emergency Triggered',
          'Location shared. Call will be made in 10 seconds.'
        );

        setTimeout(() => {
          setIsCounting(true);
        }, 300);
      } else {
        Alert.alert('SMS Not Available', 'Your device does not support SMS.');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert('Error', 'An error occurred while sending the SMS.');
    }
  };

  const makeEmergencyCall = async (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Calling not supported on this device.');
    }
  };

  const handleWebMessage = (event) => {
    const message = event.nativeEvent.data.toLowerCase();
    console.log('WebView heard:', message);

    if (message.includes('help') || message.includes('emergency') || message.includes('loud sound')) {
      Alert.alert('Voice Detected', 'Emergency keyword or loud sound detected!');
      setShowWebView(false);
      triggerEmergency();
    }
  };

  const webHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Listening</title>
  </head>
  <body style="font-family:sans-serif;text-align:center;background:#e0f7fa;">
    <h2>🎙 Say "Help" or "Emergency" or Scream Loudly</h2>
    <p>🎧 Listening for voice or loud sounds...</p>
    <script>
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onresult = function(event) {
        const transcript = event.results[event.results.length - 1][0].transcript;
        window.ReactNativeWebView.postMessage(transcript);
      };
      recognition.onerror = function(event) {
        window.ReactNativeWebView.postMessage('error: ' + event.error);
      };
      recognition.start();

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 512;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          source.connect(analyser);

          function checkVolume() {
            analyser.getByteFrequencyData(dataArray);
            let volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            if (volume > 80) {
              window.ReactNativeWebView.postMessage('Loud sound detected');
            }
            requestAnimationFrame(checkVolume);
          }

          checkVolume();
        })
        .catch(err => {
          window.ReactNativeWebView.postMessage('mic error: ' + err.message);
        });
    </script>
  </body>
  </html>
  `;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🛡️ SafeZone</Text>

      <Image
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2099/2099073.png' }}
        style={styles.icon}
      />

      <Text style={styles.subtitle}>Smart Emergency Alert System</Text>

      <View style={styles.infoBox}>
        <Text style={styles.sectionTitle}>🔍 About SafeZone</Text>
        <Text style={styles.description}>
          SafeZone is your personal safety companion. It listens for distress words like "help"
          or "emergency", shares your live location via SMS, and makes a call to your emergency contact.
        </Text>
      </View>

      <Text style={{ fontSize: 16, marginTop: 10, fontWeight: 'bold' }}>📞 Emergency Contact</Text>
      <TextInput
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        value={emergencyContact}
        onChangeText={setEmergencyContact}
        style={styles.input}
      />
      <Button title="💾 Save Contact" onPress={saveContact} color="#0288d1" />

      <View style={styles.buttonContainer}>
        <Button
          title="🎙 Start Voice Detection"
          onPress={() => setShowWebView(true)}
          color="#2e7d32"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="🚨 Trigger Emergency Now"
          onPress={triggerEmergency}
          color="#c62828"
        />
      </View>

      {location && (
        <Text style={styles.location}>
          📍 Current Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      )}

      {isCounting && (
        <Animated.View style={[styles.countdownBox, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.countdownText}>📞 Calling in {countdown} sec...</Text>
        </Animated.View>
      )}

      {showWebView && (
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Button title="❌ Close Listening" onPress={() => setShowWebView(false)} color="#d32f2f" />
          </View>
          <WebView
            originWhitelist={['*']}
            source={{ html: webHTML }}
            onMessage={handleWebMessage}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 100,
    paddingHorizontal: 20,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  icon: {
    width: 90,
    height: 90,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    color: '#555',
    marginTop: 10,
  },
  location: {
    marginTop: 20,
    fontSize: 14,
    color: '#2e7d32',
  },
  buttonContainer: {
    marginVertical: 12,
    width: '100%',
  },
  countdownBox: {
    backgroundColor: '#fff59d',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  countdownText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e65100',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 12,
    marginVertical: 20,
    width: '100%',
  },
  webViewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    backgroundColor: 'white',
  },
  webViewHeader: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 20,
  },
  input: {
    width: '100%',
    padding: 12,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
  },
});
