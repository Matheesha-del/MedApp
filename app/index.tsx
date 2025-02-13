import React, { useState } from 'react';
import { StyleSheet, View, Text, ImageBackground, TextInput, Modal, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import 'setimmediate';
import { registerRootComponent } from "expo";



export default function Home() {
  const [modalVisible, setModalVisible] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientVoiceType, setPatientVoiceType] = useState('');

  const App = () => {
    return (
      <View>
        <Text>Hello, this is my app!</Text>
      </View>
    );
  };
  registerRootComponent(App);

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
      params: { name: patientName, age: patientAge, voiceType:patientVoiceType },
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
      {/* Patient Name Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter Name"
        value={patientName}
        onChangeText={setPatientName}
      />
      {/* Patient Age Input */}
      <TextInput
        placeholder="Enter Patient Age"
        style={styles.input}
        value={patientAge}
        onChangeText={setPatientAge}
        keyboardType="numeric"
      />
      <Text style={styles.pickerTitle}>Select the Voice Type</Text>
      {/* Voice Type Dropdown */}
      <Picker
  selectedValue={patientVoiceType}
  onValueChange={(itemValue) => setPatientVoiceType(itemValue)}
  style={styles.dropdown}
>
  <Picker.Item label="Voice Type" value="" enabled={false} />
  <Picker.Item label="Voice-1 (Female)" value="ta-IN-Standard-A" />
  <Picker.Item label="Voice-2 (Male)" value="ta-IN-Standard-B" />
</Picker>

<View style={styles.modalButtons}>
  <Button
    mode="contained"
    style={[styles.modalButton, { backgroundColor: '#f44336' }]}
    onPress={() => setModalVisible(false)}
  >
    Cancel
  </Button>
  {/*Ok Button*/}
  <Button
    mode="contained"
    style={[
      styles.modalButton,
      { backgroundColor: patientVoiceType ? '#4caf50' : '#9e9e9e' }, // Grey out if disabled
    ]}
    onPress={handleConfirm}
    disabled={!patientVoiceType} // Disable if patientVoiceType is empty
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
    paddingHorizontal: '20%',
  },
  animation: {
    width: '100%',
    height: '30%',
    marginBottom:'10%',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Black',
    fontWeight: 'bold',
    color: '#37474F',
    textAlign: 'center',
    marginBottom: '5%',
  },
  subtitle: {
    fontSize: 16,
    color: '#607D8B',
    textAlign: 'center',
    marginBottom: '10%',
  },
  button: {
    backgroundColor: '#64edd3',
    borderRadius: 8,
    paddingVertical: '3%',
    paddingHorizontal: '10%',
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
    padding: '5%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: '5%',
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: 'normal',
  },
input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: '5%',
    marginBottom: '5%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '5%',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: '2%',
  },
  dropdown: {
    height: 70,
    width: '100%',
    marginVertical: '1%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: '3%',
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: '3%',
  },

});

