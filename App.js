import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, Image, TextInput, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Preview Sighting" component={PreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


function HomeScreen({ navigation }) {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    })();
  }, []);

  const takePic = async () => {
    if (cameraRef.current) {
      const options = { quality: 1, base64: true, exif: true };
      const newPhoto = await cameraRef.current.takePictureAsync(options);
      navigation.navigate('Preview Sighting', { photo: newPhoto });
    }
  };

  if (hasCameraPermission === null) {
    return <Text>Requesting permissions...</Text>;
  }
  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.containerHome}>
      <Camera style={styles.camera} ref={cameraRef} />
      <Button title="Take Picture" onPress={takePic} />
    </View>
  );
}



function PreviewScreen({ route, navigation }) {
  const { photo } = route.params;
  const [comment, setComment] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const confirmSighting = () => {
    shareAsync(photo.uri); // Replace with POST request to Django backend to send relevant data (image, metadata, comment, squirrel, behavior)
  };

  const savePhoto = async () => {
    await MediaLibrary.saveToLibraryAsync(photo.uri);
  };

  const discardPhoto = () => {
    Alert.alert(
      'Discard Image',
      'Are you sure you want to discard this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Discard',
          onPress: () => navigation.goBack(),
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.containerPreview}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
      
        <Image style={styles.preview} source={{ uri: photo.uri }} />
        
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Squirrel</Text>
        </View>
        <Picker
          selectedValue={selectedOption}
          style={styles.picker}
          onValueChange={(itemValue, itemIndex) =>
            setSelectedOption(itemValue)
          }>
          <Picker.Item label="Untagged" value="0" />
          <Picker.Item label="Left: Red/Blue" value="1" />
          <Picker.Item label="Right: Green/Orange" value="2" />
          <Picker.Item label="Left: Yellow" value="3" />
        </Picker>

        <View style={styles.labelContainer}>
          <Text style={styles.label}>Behavior</Text>
        </View>
        <Picker
          selectedValue={selectedOption}
          style={styles.picker}
          onValueChange={(itemValue, itemIndex) =>
            setSelectedOption(itemValue)
          }>
          <Picker.Item label="None" value="" />
          <Picker.Item label="Eating" value="Eating" />
          <Picker.Item label="Sleeping" value="Sleeping" />
          <Picker.Item label="Chasing a squirrel" value="Chasing a squirrel" />
        </Picker>
        
        <TextInput
          style={styles.input}
          placeholder="Sighting comment"
          value={comment}
          onChangeText={setComment}
        />

        <View style={styles.buttonsContainer}>
          <Button title="Discard" onPress={discardPhoto} />
          <Button title="Save Image" onPress={savePhoto} />
          <Button title="Confirm Sighting" onPress={confirmSighting} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  containerPreview: {
    flex: 1,
    backgroundColor: '#f9f9f9', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20, 
  },
  containerHome: {
    flex: 1,
    backgroundColor: '#f9f9f9', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  preview: {
    width: '80%',
    aspectRatio: 9 / 16, 
    borderRadius: 10, 
    marginBottom: 30, 
  },
  scrollViewContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#dcdcdc', 
    borderRadius: 5, 
    marginTop: 10,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff', 
  },
  picker: {
    width: '100%',
    height: 50,
    marginTop: 10,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff', 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#dcdcdc', 
  },
  labelContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 20,
  },
  buttonsContainer: {
    flexDirection: 'row', 
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333', 
    marginRight: 10, 
  },
});
