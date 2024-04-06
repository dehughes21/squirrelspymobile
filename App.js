import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, Image, TextInput, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
//import { getExifData } from 'expo-exif';


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
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
    })();
  }, []);

  const takePic = async () => {
    if (cameraRef.current) {
      const options = { quality: 1, base64: true, exif: true};
      const newPhoto = await cameraRef.current.takePictureAsync(options);
      navigation.navigate('Preview Sighting', { photo: newPhoto });
    }
  };

  if (hasCameraPermission === null || hasLocationPermission === null) {
    return <Text>Requesting permissions...</Text>;
  }
  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }
  if (hasLocationPermission === false) {
    return <Text>No access to location</Text>;
  }

  return (
    <View style={styles.containerHome}>
      <Camera style={styles.camera} ref={cameraRef} />
      <Button title="Take Picture" onPress={takePic} />
    </View>
  );
}

async function getLocation() {
  const location = await Location.getCurrentPositionAsync({});
  const lat = location.coords.latitude;
  const long = location.coords.longitude;
  return [lat, long];
}


function PreviewScreen({ route, navigation }) {
  const { photo } = route.params;
  const [comment, setComment] = useState('');
  const [lat, setLat] = useState();
  const [long, setLong] = useState();
  const [selectedBehavior, setSelectedBehavior] = useState('');
  const [selectedSquirrel, setSelectedSquirrel] = useState('0');
  const [squirrels, setSquirrels] = useState([]);

  useEffect(() => {
    const fetchSquirrels = async () => {
      try {
        const response = await fetch('http://10.0.2.2:8000/squirrels/');
        const data = await response.json();
        setSquirrels(data);

      } catch (error) {
        console.error('Error fetching data:', error);
      }

    };

    fetchSquirrels();
  }, []);

  let confirmSighting = async () => {

    const formData = new FormData();

    // Get user.id from token??
    formData.append('user', 1);

    // Get squirrel.id from left and right ear colors
    formData.append('squirrel', selectedSquirrel);

    const loc = await getLocation();
    const lat = loc[0];
    const long = loc[1];
    formData.append('lat', lat);
    formData.append('long', long);
    formData.append('time', new Date().toISOString());

    // Get from user
    formData.append('certainty_level', 3);
    formData.append('behavior', selectedBehavior);
    formData.append('comment', comment);
    formData.append('image', {
      uri: photo.uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    console.log(formData);
    
    // Send sighting
    const response = await fetch('http://10.0.2.2:8000/sightings/', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
      .then(function(response) {
        return response.json()
      }).then(function(json) {
        console.log("json: ", json)
      }).catch(function(ex) {
        console.log("failed: ", ex)
      });

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

        <View style={styles.buttonsContainer}>
          <Button title="Discard" onPress={discardPhoto} />
          <Button title="Save Image" onPress={savePhoto} />
          <Button title="Confirm Sighting" onPress={confirmSighting} />
        </View>
        
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Squirrel</Text>
        </View>
        <Picker
        selectedValue = {selectedSquirrel}
          style={styles.picker}
          onValueChange={(itemValue, itemIndex) => setSelectedSquirrel(itemValue)}>
          <Picker.Item label="Select a squirrel" value={null} />
            {squirrels.map((squirrel) => (
          <Picker.Item  
            key={squirrel.id}
            label={`Left Ear: ${squirrel.left_ear_color} | Right Ear: ${squirrel.right_ear_color}`}
            value={squirrel.id}
          />
          ))}
        </Picker>

        <View style={styles.labelContainer}>
          <Text style={styles.label}>Behavior</Text>
        </View>
        <Picker
        selectedValue = {selectedBehavior}
          style={styles.picker}
          onValueChange={(itemValue, itemIndex) =>
            setSelectedBehavior(itemValue)
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