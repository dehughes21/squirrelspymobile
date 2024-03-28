import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, Image, TextInput, SafeAreaView } from 'react-native';
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
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef} />
      <Button title="Take Picture" onPress={takePic} />
    </View>
  );
}



function PreviewScreen({ route, navigation }) {
  const { photo } = route.params;
  const [comment, setComment] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const sharePic = () => {
    shareAsync(photo.uri);
  };

  const savePhoto = async () => {
    await MediaLibrary.saveToLibraryAsync(photo.uri);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image style={styles.preview} source={{ uri: photo.uri }} />
      <TextInput
        style={styles.input}
        placeholder="Sighting comment"
        value={comment}
        onChangeText={setComment}
      />
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
      <Button title="Share" onPress={sharePic} />
      <Button title="Save" onPress={savePhoto} />
      <Button title="Discard" onPress={() => navigation.goBack()} />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  preview: {
    width: '100%',
    height: '70%',
  },
  input: {
    width: '80%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  picker: {
    width: '80%',
    height: 50,
    marginTop: 10,
  },
  labelContainer: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 20
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
