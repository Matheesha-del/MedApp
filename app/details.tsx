import { Stack, useLocalSearchParams } from 'expo-router';
import { Platform, Text , View, TextInput, Button, ScrollView, ImageBackground, StyleSheet, TouchableOpacity, Modal, Alert}from 'react-native';
import {supabase} from '~/utils/supabase';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useState, useRef, useEffect} from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { format } from 'date-fns';


export default function Details() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [summaryText, setSummaryText]= useState('');
  const [doctorRecording, setDoctorRecording] = useState<Audio.Recording>();
  const [patientRecording, setPatientRecording] = useState<Audio.Recording>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const scrollViewRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [uriArray, setUriArray] = useState<(string | null)[]>([]);
  const searchParams = useLocalSearchParams();
  const [name, setName] = useState(searchParams.name || null);
  const [age, setAge] = useState(searchParams.age || null);
  const [voiceType, setVoiceType] = useState(searchParams.voiceType || null);
  const [patientVoiceType, setPatientVoiceType] = useState(searchParams.voiceType || null);
  const currentDate = new Date();
  const formattedDate = format(currentDate, 'yyyy-MM-dd');

  
  const textToSpeech = async (text: string) =>{
    console.log(voiceType);
    const { data,error } = await supabase.functions.invoke('tts',{
      body: JSON.stringify({
        "text": text,
        "languageCode": "தமிழ் (இந்தியா)",
        "voiceName": voiceType
      }),
    });
    console.log(error);
    console.log(data);
    if (data)
    {
      const uri = `data:audio/mp3;base64,${data.audioContent}`;
      console.log(uri);

      // Add the URI to the array
      setUriArray((prevArray) => [...prevArray, uri]);

      // Play the audio
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    }
  };

  // Append new messages to conversation and save to file
  const addMessage = (speaker:string, text :string, text2:string) => {
    const newConversation = [...conversation, { speaker, text, text2}];
    setConversation(newConversation);


    // Auto-scroll to the bottom
    scrollViewRef.current?.scrollToEnd({ animated: true });

   
  }; 


  const translateET = async (text :string) => {
    const { data, error } = await supabase.functions.invoke('trmed', {
      body: JSON.stringify({ input: text, from: 'English', to: 'Tamil' }),
    });

    return data?.content || 'Translation failed.';
  };

  const onTranslateET = async () => {
    const translation = await translateTE(input);
    setOutput(translation);
  };


  const onTranslateTE = async () => {
    const translation = await translateET(input);
    setOutput(translation);
  };

  const translateTE = async (text :string) => {
    const { data, error } = await supabase.functions.invoke('trmed', {
      body: JSON.stringify({ input: text, from: 'Tamil', to: 'English' }),
    });

    return data?.content || 'Translation failed.';
  };
  /*
  const summarize = async (conversation: string) => { 
    const { data,error } = await supabase.functions.invoke('summarize', {
      body: JSON.stringify({conversation}),
    });
    console.log(error);
    console.log(data);
    return data?.summary || 'Something went wrong!';
  }

  const onSummarize = async () => {
    const singleConversation = conversationArray.join('<***>');
    console.log(singleConversation);
    try{
    const summary = await summarize(singleConversation);
    console.log(summary);
    setSummaryText(summary);
      setSummaryModalVisible(true);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }

  };*/
  const generateReport = (conversation) => {
    if (!conversation || conversation.length === 0) {
      return 'No conversation data available.';
    }
  
    let report = 'Conversation Report\n';
    report += '=====================\n\n';
    report += `Date : ${formattedDate} \n`;
    report += `Name : ${name} \n`;
    report += `Age : ${age} \n\n`;
  
    conversation.forEach((line, index) => {
      //report += `Message ${index + 1}:\n`;
      report += `${line.speaker} : ${line.text}\n`;
      report += `                 ( ${line.text2} )\n`;
    });
  
    report += '=====================\n';
    report += 'End of Report';
    
    return report;
  };


  const onSummarize = async () => {
    try {
      const report = generateReport(conversation);
      console.log(report);
      setSummaryText(report);
      setSummaryModalVisible(true);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };
  
  



  const clearConversation = async () => {
    try {
      const path = FileSystem.documentDirectory + 'conversation.txt';
      await FileSystem.deleteAsync(path);
      setConversation([]);
    } catch (err) {
      console.error('Failed to clear conversation:', err);
    }
  };

  const html = `
<html>
  <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; text-align:center;}
            p { margin: 10px 0;text-align:center; }
          </style>
        </head>
        <body>
          <h1>Report</h1>
          <p>${summaryText.replace(/\n/g, '<br>')}</p>
          <br><br>
          <p>Doctor's Signature: ______________</p>
          <p>Patient's Signature: ______________</p>
        </body>
</html>
`;

const print = async () => {
  try {
    await Print.printAsync({
      html,
      ...(Platform.OS === 'ios' && selectedPrinter
        ? { printerUrl: selectedPrinter.url }
        : {}),
    });
  } catch (error) {
    console.error('Error during printing:', error);
  }
};

const printToFile = async () => {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', uri);
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error during print to file:', error);
  }
};

const playAudio = async (uri: string) => {
  if (!uri) {
    console.warn('No URI provided for audio.');
    return;
  }
  try {
    const { sound } = await Audio.Sound.createAsync({ uri });
    
    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.isLoaded && status.didJustFinish) {
        await sound.unloadAsync();  // Unload after playback finishes
      }
    });

    await sound.playAsync();
  } catch (err) {
    console.error('Error playing audio:', err);
  }
};


const handleReplay = (index) => {
  const uri = uriArray[index];
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => playAudio(uri)}>
        <FontAwesome5 name="play-circle" size={24} color="green" />
      </TouchableOpacity>
    </View>
  );
};



{/*const selectPrinter = async () => {
  if (Platform.OS === 'ios') {
    try {
      const printer = await Print.selectPrinterAsync();
      setSelectedPrinter(printer);
    } catch (error) {
      console.error('Error selecting printer:', error);
    }
  } else {
    console.warn('Select printer is not available on Android.');
  }
};*/}

  const handlePrint = () => {
    
    Alert.alert(
      'Print Confirmation',
      'Are you sure you want to close the summary? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            setSummaryModalVisible(false);
            setIsPrinting(false);
            setConversation([]);
          },
        }, 
      ]
      );
      
    };





  async function startDoctorRecording() {
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      //console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setDoctorRecording(recording);
      //console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopDoctorRecording() {
    if (!doctorRecording){
      return;
    }
    //console.log('Stopping recording..');
    setDoctorRecording(undefined);
    await doctorRecording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );
    const uri = doctorRecording.getURI();
    //console.log('Recording stopped and stored at', uri);

    if(uri){
      const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64'});
      const { data, error } = await supabase.functions.invoke('speech-to-text',{
        body: JSON.stringify({ audioBase64 }),
      });
      //setInput(data.text);
      

      const translation = await translateET(data.text);
      textToSpeech(translation);

      if (data?.text) {
        addMessage('Doctor', data.text ,translation);
      }

      console.log(data);
      console.log(error);
    }
  }
    async function startPatientRecording() {
      try {
        if (permissionResponse?.status !== 'granted') {
          console.log('Requesting permission..');
          await requestPermission();
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
  
        console.log('Starting recording..');
        const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setPatientRecording(recording);
        console.log('Recording started');
      } catch (err) {
        console.error('Failed to start recording', err);
      }
    }
  
    async function stopPatientRecording() {
      if (!patientRecording){
        return;
      }
      console.log('Stopping recording..');
      setPatientRecording(undefined);
      await patientRecording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync(
        {
          allowsRecordingIOS: false,
        }
      );
      const uri = patientRecording.getURI();
      console.log('Recording stopped and stored at', uri);
  
      if(uri){
        const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64'});
        const { data, error } = await supabase.functions.invoke('speech-to-text',{
          body: JSON.stringify({ audioBase64 }),
        });
        //setInput(data.text);
        
        if (data?.text) {
          
          const translation = await translateTE(data.text);
          addMessage('Patient', translation, data.text);
          setUriArray((prevArray) => [...prevArray, uri]);
          
        }
        console.log(data);
        console.log(error);
      }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tamil-English Translator</Text>
      <ScrollView style={styles.outputArea} ref={scrollViewRef}>
      <View style={styles.detailsBox}>
      <Text style={styles.details}>Name - {name}</Text>
      <Text style={styles.details}>Age - {age}</Text>
      </View>
        {conversation.map((line, index) => (
          <View key={index} 
          style={[styles.messageContainer,
          line.speaker === 'Patient' && styles.patientMessage,]}>
            
          {line.speaker === 'Doctor' ? (
            <FontAwesome5 name="user-md" size={20} color="green" style={styles.icon} />
          ) : (
            <FontAwesome5 name="user-alt" size={20} color="blue" style={styles.icon} />
          )}
          <Text style={styles.outputText}>
          <View style={styles.textContainer}>
            <Text style={styles.outputText}>{line.text}</Text>
            <Text style={styles.outputText}>{line.text2}</Text>
            {line.speaker === 'Doctor' && handleReplay(index)}
            </View>
           
          </Text>
        </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button2}
          onPress={doctorRecording ? stopDoctorRecording : startDoctorRecording}
        >
          <FontAwesome5
            name={doctorRecording ? 'stop' : 'microphone'}
            size={24}
            color={doctorRecording ? 'red' : 'green'}
          />
          <Text style={styles.buttonLabel1}>Doctor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button2}
          onPress={patientRecording ? stopPatientRecording : startPatientRecording}
        >
          <FontAwesome5
            name={patientRecording ? 'stop' : 'microphone'}
            size={24}
            color={patientRecording ? 'red' : 'blue'}
          />
          <Text style={styles.buttonLabel2}>Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button2} onPress={onSummarize}>
          <FontAwesome5 name="file-import" size={30} color="#FF9800" />
          <Text style={styles.buttonLabel3}>Summarize</Text>
        </TouchableOpacity>
      </View>
       {/* Summary Modal */}
       <Modal
        animationType="slide"
        transparent={true}
        visible={summaryModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.summaryHeader}>Report</Text>
            <Text style={styles.summaryText}>{summaryText}</Text>
            <View style={styles.signatureContainer}>
              <Text>Doctor's Signature: ______________</Text>
              <Text></Text>
              <Text>Patient's Signature: ______________</Text>
            </View>
            <View style={styles.rowContainer}>
              <TouchableOpacity style={styles.button2} onPress={print}>
              <MaterialCommunityIcons name="printer" size={28} color="#6495ed" />            
              <Text style={styles.buttonLabel4}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.spacer} onPress={printToFile}>
              <FontAwesome5 name="file-download" size={24} color="#6495ed" />
              <Text style={styles.buttonLabel4}>Print to PDF File</Text>
              </TouchableOpacity> 
             
            </View> 
            <TouchableOpacity style={styles.closeButton} onPress={handlePrint}>
              <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>

        </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'darkcyan',
    padding: '7%',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '5%',
    color: '#fff',
    textShadowColor: 'black', // Shadow color (acts as border)
    textShadowOffset: { width: 1, height: 1 }, // Border thickness
    textShadowRadius: 2, // Smoothens the edges
  },
  messageContainer: {
    flexDirection: 'row',
    padding: '1%',
    alignItems: 'center',
    marginBottom: '2%',
    marginLeft: '2%', // Padding for doctor messages
    marginRight:'2%', // Padding for both messages
  },
  textContainer: {
    backgroundColor: '#f1f1f1', // Light gray background for text
    borderRadius: 8,  // Rounded corners for the background
    paddingHorizontal: '4%',  // Horizontal padding to create space around text
    paddingVertical: '4%',  // Vertical padding for better spacing
    
  },
  patientMessage: {
    flexDirection: 'row-reverse', // Align patient messages to the right
    justifyContent: 'flex-start',
  },
  icon: {
    marginRight:'3%',
    marginLeft: '3%',
  },
  outputArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: '10%',
    marginBottom: '2%',
  },
  outputText: {
    fontSize: 16,
    color: '#333',
  },
  detailsBox: {
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '6%',
  },
  details: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
},
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: '3%',
    backgroundColor: 'lightcyan',
    borderRadius:10,
  },
  button2:{
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel1: {
    color: 'green',
    fontSize: 16,
    },  
  buttonLabel2: {
    color: 'blue',
    fontSize: 16,
  },
  buttonLabel3: {
    color: '#FF9800',
    fontSize: 16,
  },
  buttonLabel4: {
    color: '#6495ed',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '5%',
    borderRadius: 10,
    width: '80%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  summaryHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: '5%',
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 16,
    marginBottom: '6%',
  },
  signatureContainer: {
    marginBottom: '6%',
  },
  spacer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    marginTop: '6%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'crimson',
    padding: '3%',
    borderRadius: 5,
  },
  closeButtonText: {
    flex:1,
    color: 'white',
    fontSize: 16,
    textAlign:'center',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Adjust spacing between buttons
    alignItems: 'center', // Align vertically
    paddingHorizontal: '3%', // Optional: add some horizontal padding
  },
  printer: {
    textAlign: 'center',
  },

});
