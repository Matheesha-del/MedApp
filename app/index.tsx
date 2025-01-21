import React, { useState } from 'react';
import { StyleSheet, View, Text, ImageBackground, TextInput, Modal, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';


export default function Home() {
  const [modalVisible, setModalVisible] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const router = useRouter(); // Use router for navigation

  const handleGetStarted = () => {
    setModalVisible(true); // Open the modal
  };

  const handleConfirm = () => {
    // Ensure both name and age are provided
    if (!patientName || !patientAge) {
      Alert.alert('Error', 'Please provide both name and age.');
      return;
    }

    // Close the modal
    setModalVisible(false);

    // Navigate to the details page with patient details
    router.push({
      pathname: '/details',
      params: { name: patientName, age: patientAge },
    });

    // Clear the input fields for the next use
    setPatientName('');
    setPatientAge('');
  };

  return (
    <>
      <ImageBackground source={require('../assets/background.jpg')} style={styles.container}>
        {/* Lottie Animation */}
        <LottieView
          source={require('../assets/Main Scene.json')}
          autoPlay
          loop
          style={styles.animation}
          speed={0.2}
        />

        {/* Welcome Text */}
        <Text style={[styles.title, { fontFamily: 'monospace' }]}>MedTranslator</Text>
        <Text style={[styles.subtitle, { fontStyle: 'italic' }]}>
          Bridging the gap between doctors and patients.
        </Text>

        {/* Button to trigger modal */}
        <Button
          mode="contained"
          style={styles.button}
          labelStyle={styles.buttonLabel}
          onPress={handleGetStarted}
        >
          Get Started
        </Button>

        {/* Modal for Patient Details */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Patient Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Name"
                value={patientName}
                onChangeText={setPatientName}
              />
              <TextInput
                placeholder="Enter Patient Age"
                style={styles.input}
                value={patientAge}
                onChangeText={setPatientAge}
                keyboardType="numeric"
              />
              <View style={styles.modalButtons}>
                <Button
                  mode="contained"
                  style={[styles.modalButton, { backgroundColor: '#f44336' }]}
                  onPress={() => setModalVisible(false)}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  style={[styles.modalButton, { backgroundColor: '#4caf50' }]}
                  onPress={handleConfirm}
                >
                  Confirm
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 20,
  },
  animation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#37474F',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#607D8B',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#64edd3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c2a43',
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});
