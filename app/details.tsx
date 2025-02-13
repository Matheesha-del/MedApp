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
import { Picker } from '@react-native-picker/picker';


export default function Details() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [summaryText, setSummaryText]= useState('');
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [templateText, setTemplateText]= useState('');
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
  const soundRefs = useRef({});

  const [playingIndex, setPlayingIndex] = useState(null);  // Track which audio is playing
  const [progress, setProgress] = useState({}); // Store progress for each audio

  const [templates, setTemplates] = useState({
    "Catheterisation" : "We are inserting a thin tube that we insert into your bladder to help drain urine. This will also help us monitor your urine output. You may feel some mild discomfort during insertion, but we use lubrication to make it easier. Once inserted it shouldn’t cause pain, and we will remove it when it's no longer needed. Do you understand and agree to this procedure?",
    "IV Cannula Insertion": "We are inserting a cannula into your vein, to give you fluids, medications, or blood if needed. You may feel a small pinch when it’s inserted, but after that, it should not cause much discomfort. It stays in place with a small dressing and will be removed once it’s no longer needed. Do you understand and give your consent?",
    "Upper GI Endoscopy": "We are putting a thin tube with a camera through your mouth to look inside your oesophagus, stomach, and the first part of your small intestine. This helps us check for problems like ulcers, inflammation, or bleeding. You will be given a sedative to help you relax, and a numbing spray for your throat. You have to fast for 6 hours before the procedure and you will be awake during the procedure. Do you understand and agree to this procedure?",
    "Flexible Sigmoidoscopy": "We are putting a thin tube with a camera through your anus to look inside the colon and rectum. This helps us find causes of symptoms like bleeding or changes in your  bowel habits. You may feel some bloating or mild discomfort, but it passes soon. Before the procedure you have to drink a special drink and do an enema to to clear your bowels. We usually give sedation to keep you comfortable. Do you understand and agree to this procedure?",
    "Colonoscopy": "We are putting a thin tube with a camera through your anus to look inside your large intestine. This helps detect conditions like polyps, inflammation, or cancer. You will need to fast for 6 hours and take a special drink. We will do an enema to clear your bowels before the procedure. We usually give sedation to keep you comfortable. You may feel bloated afterward, but this will settle soon. Do you understand and give your consent?",
    "Digital Rectal Examination": "I will insert my finger with lubrication into your rectum to assess your prostate or check for abnormalities like lumps, bleeding, or tenderness. It only takes a few seconds and might feel uncomfortable, but it shouldn’t be painful. Do you understand and agree to this examination?",
    "Local and Regional Anaesthesia": "We will numb the area where the procedure is happening using an injection. You will stay awake, but you won’t feel pain. You may feel some pressure, but there won’t be pain. The numbness will wear off after a few hours. This is a very safe method, and we will monitor you closely. Do you understand, and do you agree to this procedure?",
    "General Anaesthesia": "We will give you medicine to make you sleep during the procedure. You won’t feel anything, and we will monitor you closely. When you wake up, you might feel drowsy for a while and it will pass away. Do you understand, and do you agree to this procedure?",
    "Below Knee Amputation": "Because of your condition, we need to remove your lower leg, below the knee to prevent further harm. After surgery, we will help you with rehabilitation and possibly a prosthetic limb so you can regain mobility. You may experience some pain at first, but we will manage it with medication. Do you understand, and do you agree to proceed?",
    "Above Knee Amputation": "We need to remove your leg above the knee due to your condition. This will help prevent serious complications and improve your long-term health. After the surgery, we will provide pain management, physical therapy, and, if needed, options for a prosthetic limb to help with mobility. You may need time to adjust, but we will support you throughout. Do you understand, and do you agree to this procedure?",
    "Finger Amputation": "We need to remove your finger because of your condition. This will help prevent further complications. The procedure is done under anaesthesia, so you won’t feel pain during it. Afterward, you may have some swelling or discomfort, but we will give you medication to help. We will also guide you on how to take care of your hand after surgery. Do you understand, and do you agree to this procedure?",
    "Skin Grafts": "Your wound needs help to heal properly, so we will take a thin layer of healthy skin from another part of your body and place it over the wound. The donor site will heal on its own in a couple of weeks. This helps the wound close and reduces the risk of infection. After the procedure, you may feel some discomfort in both areas, but we will provide pain relief and guidw you. Do you understand the procedure and agree to proceed?",
    "Negative Pressure Wound Therapy": "To help your wound heal faster, we will use a special dressing with gentle suction. This helps remove extra fluid, reduces swelling, and encourages new tissue growth. The dressing is connected to a small machine that creates the suction, which you may feel as a slight pulling sensation. This method is commonly used for slow-healing wounds and is very effective. We will check the wound regularly and adjust the treatment as needed. Do you understand and consent to this procedure?"
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [recording, setRecording] = useState(null);

  
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
      //const { sound } = await Audio.Sound.createAsync({ uri });
      //await sound.playAsync();
    }
  };

  // Append new messages to conversation and save to file
  const addMessage = (speaker:string, text :string, text2:string) => {
    const newConversation = [...conversation, { speaker, text, text2}];
    setConversation(newConversation);
    console.log(newConversation);


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
  
  const summarize = async (conversation: string) => { 
    const { data,error } = await supabase.functions.invoke('summarize', {
      body: JSON.stringify({conversation}),
    });
    console.log(error);
    console.log(data);
    return data?.summary || 'Something went wrong!';
  }

  const onSummarize = async () => {
    try {
      const summary = await summarize(JSON.stringify(conversation));
      const translation_summary = await translateET(JSON.stringify(summary));
      console.log(translation_summary);
      let report = 'Conversation Report\n';
      report += '=====================\n\n';
      report += `Date : ${formattedDate} \n`;
      report += `Name : ${name} \n`;
      report += `Age : ${age} \n\n`;
      report += `${summary} \n`;
      report += `${translation_summary} \n`;
      report += '\n=====================\n';
      report += 'End of Report';
      setSummaryText(report);
      setSummaryModalVisible(true);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };
  /*
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
  };*/
  
  const onTemplates = async () => {
    try {
      //setTemplateText();
      setTemplateModalVisible(true);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };
  
  const template = async () => {
    const selectedTemplateText = templates[selectedTemplate];
    console.log(selectedTemplateText);
    const translation = await translateET(selectedTemplateText);
    textToSpeech(translation);
    addMessage('Doctor', selectedTemplateText ,translation);
    

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

  const toggleAudio = async () => {
    if (playingIndex === index) {
      // Pause the audio
      if (soundRefs.current[index]) {
        const status = await soundRefs.current[index].getStatusAsync();
        setProgress((prev) => ({
          ...prev,
          [index]: (status.positionMillis / status.durationMillis) * 100, // Save current progress
        }));
        await soundRefs.current[index].pauseAsync();
      }
      setPlayingIndex(null);
    } else {
      // Stop previous sound if any
      if (soundRefs.current[playingIndex]) {
        const status = await soundRefs.current[playingIndex].getStatusAsync();
        setProgress((prev) => ({
          ...prev,
          [playingIndex]: (status.positionMillis / status.durationMillis) * 100, // Save progress before stopping
        }));
        await soundRefs.current[playingIndex].stopAsync();
      }
  
      // Get the previous progress position, or 0 if no progress saved
      const savedProgress = progress[index] ? (progress[index] / 100) : 0;
      console.log('Saved Progress:', savedProgress); // Log progress to see if it's correct
  
      // Play the new audio from the saved position
      const { sound } = await Audio.Sound.createAsync({ uri });
  
      // Wait until the audio is loaded to get its duration
      const status = await sound.getStatusAsync();
      const durationMillis = status.durationMillis || 0;
  
      console.log('Duration:', durationMillis); // Log duration to check if it's correct
      const positionMillis = savedProgress * durationMillis;
      console.log('Position in ms:', positionMillis); // Log the calculated position
  
      // Set the positionMillis before playing
      await sound.setPositionAsync(positionMillis); // Set the position
  
      // Play the audio from the saved position
      await sound.playAsync();
  
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded) {
          setProgress((prev) => ({
            ...prev,
            [index]: (status.positionMillis / status.durationMillis) * 100,
          }));
        }
  
        if (status.didJustFinish) {
          // Reset progress when the audio finishes
          setProgress((prev) => ({
            ...prev,
            [index]: 0, // Reset the progress to 0 when the audio finishes
          }));
  
          // Unload the sound and reset playingIndex
          await sound.unloadAsync();
          setPlayingIndex(null);
        }
      });
  
      soundRefs.current[index] = sound;
      setPlayingIndex(index);
    }
  };
  
  
  
  
  
  

  return (
    <View style={styles.row}>
      

      {/* Play/Pause Button */}
      <TouchableOpacity onPress={toggleAudio}>
        <FontAwesome5 
          name={playingIndex === index ? "pause-circle" : "play-circle"} 
          size={24} 
          color={playingIndex === index ? "red" : "green"} 
        />
      </TouchableOpacity>

      {/* Audio Progress Bar */}
      <View style={styles.progressBar}>
        <View style={{ 
          width: `${progress[index] || 0}%`,
          height: '100%', 
          backgroundColor: 'darkslategrey' 
        }} />
      </View>
    </View>
  );
};


const handleTemplay = (index) => {
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
          <View style={styles.detailsContainer}>
      <View style={styles.detailsColumn}>
        <Text style={styles.details}>Date</Text>
        <Text style={styles.details}>Name</Text>
        <Text style={styles.details}>Age</Text>
      </View>
      <View style={styles.separatorColumn}>
        <Text style={styles.details}> - </Text>
        <Text style={styles.details}> - </Text>
        <Text style={styles.details}> - </Text>
      </View>
      <View style={styles.detailsColumn}>
        <Text style={styles.details}>{formattedDate}</Text>
        <Text style={styles.details}>{name}</Text>
        <Text style={styles.details}>{age}</Text>
      </View>
      </View>

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
            <Text style={[styles.outputText, { fontStyle: 'italic',fontWeight: '500' }]}>{line.text}</Text>
            <Text style={[styles.outputText, { fontStyle: 'italic' }]}>{line.text2}</Text>
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
            size={20}
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
            size={20}
            color={patientRecording ? 'red' : 'blue'}
          />
          <Text style={styles.buttonLabel2}>Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button2} onPress={onSummarize}>
          <FontAwesome5 name="file-import" size={20} color="#FF9800" />
          <Text style={styles.buttonLabel3}>Summarize</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button2} onPress={onTemplates}>
          <FontAwesome5 name="file-audio" size={20} color="#B72020" />
          <Text style={styles.buttonLabel5}>Templates</Text>
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


      <Modal 
  animationType="slide" 
  transparent={true} 
  visible={templateModalVisible} 
  onRequestClose={() => setTemplateModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.summaryHeader}>Audio Templates</Text>
      
      {/* Dropdown for Templates */}
      <Picker
        selectedValue={selectedTemplate}
        onValueChange={(itemValue) => {
          
            setSelectedTemplate(itemValue);
          
        }}
      >
        <Picker.Item label="Select an audio template" enabled={false} />
        {Object.keys(templates).map((name) => (
          <Picker.Item key={name} label={name} value={name} />
        ))}
        
        
      </Picker>

      {/* Buttons Container */}
      <View style={styles.buttonContainer}>
        {/* Add Button */}
        <TouchableOpacity
  style={[
    styles.addButton,
    { backgroundColor: selectedTemplate ? '#4caf50' : '#9e9e9e' } // Change color
  ]}
  onPress={() => {
    template(); // Call the function
    setTemplateModalVisible(false); // Close the modal
  }}
  disabled={!selectedTemplate} // Disable when no template selected
>
  <Text style={styles.addButtonText}>Add</Text>
</TouchableOpacity>

        

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButtonT} onPress={() => setTemplateModalVisible(false)}>
          <Text style={styles.closeButtonTextT}>Close</Text>
        </TouchableOpacity>
      </View>

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
    padding: '4%',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '3%',
    color: '#fff',
    textShadowColor: 'black', // Shadow color (acts as border)
    textShadowOffset: { width: 1, height: 1 }, // Border thickness
    textShadowRadius: 2, // Smoothens the edges
  },
  messageContainer: {
    flexDirection: 'row',
    padding: '1%',
    alignItems: 'center',
    marginBottom: '1%',
    marginLeft: '1%', // Padding for doctor messages
    marginRight:'1%', // Padding for both messages
  },
  textContainer: {
    backgroundColor: '#f1f1f1', // Light gray background for text
    borderRadius: 8,  // Rounded corners for the background
    paddingHorizontal: '5%',  // Horizontal padding to create space around text
    paddingVertical: '5%',  // Vertical padding for better spacing
    
  },
  patientMessage: {
    flexDirection: 'row-reverse', // Align patient messages to the right
    justifyContent: 'flex-start',
  },
  icon: {
    marginRight:'1%',
    marginLeft: '1%',
  },
  outputArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: '6%',
    marginBottom: '3%',
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
    alignItems: 'flex-start',
    marginBottom: '3%',
    padding: '3%',
  },
  details: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    fontWeight: 'bold', 
    //fontStyle: 'italic'
},

detailsContainer: {
  flexDirection: 'row', // Arrange in row
  justifyContent: 'space-between',
  alignItems: 'flex-start', // Align at the start of the container
},

detailsColumn: {
  flexDirection: 'column', // Arrange items in a column
},

separatorColumn: {
  flexDirection: 'column',
  justifyContent: 'center', // Align separator (-) vertically centered
  marginHorizontal: 10, // Add space between columns
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
    fontSize: 14,
    },  
  buttonLabel2: {
    color: 'blue',
    fontSize: 14,
  },
  buttonLabel3: {
    color: '#FF9800',
    fontSize: 14,
  },
  buttonLabel4: {
    color: '#6495ed',
    fontSize: 16,
  },
  buttonLabel5: {
    color: '#B72121',
    fontSize: 14,
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
  closeButtonT: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: 100,
  },
  closeButtonTextT: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  input: { width: '100%', borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 10 },
  recordButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'red', borderRadius: 5 },
  recordText: { color: 'white', marginLeft: 10 },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  addButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: 100,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    flex: 1, 
    height: 5, 
    backgroundColor: '#ddd', 
    borderRadius: 5, 
    overflow: 'hidden',
    marginRight: 10 // Space before button
  },
  row: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 10
  },

});
