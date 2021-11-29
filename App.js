import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, View, Alert } from 'react-native';
import { Input, Button, ListItem, Icon } from 'react-native-elements';
import MapView, { Marker } from 'react-native-maps';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SQLite from 'expo-sqlite';

const Stack = createNativeStackNavigator();

const db = SQLite.openDatabase('myplacesdb.db');

function Places({ route, navigation }) {

  const [address, setAddress] = useState('')
  const [places, setPlaces] = useState([])
  

    useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('create table if not exists place (id integer primary key not null, street text, postalCode text, area text, fullAddress text);');
    });
    updateList();    
  }, []);


  useEffect(() => {

    if (route.params?.region) {
          
      saveItem()
      
    }
      
  }, [route.params?.region]);

 
  const saveItem = () => {

    
    const street = route.params?.region.street

    const postalCode = route.params?.region.postalCode

    const area = route.params?.region.area

    const fullAddress = address

    
    db.transaction(tx => {
        tx.executeSql('insert into place (street, postalCode, area, fullAddress) values (?, ?, ?, ?);', [street, postalCode, area, fullAddress]);    
      }, null, updateList
    )

    setAddress('')
    
  }

  
  const updateList = () => {
    db.transaction(tx => {
      tx.executeSql('select * from place;', [], (_, { rows }) =>
        setPlaces(rows._array)
      ); 
    });

    
  }

  
  const deleteItem = (id) => {
    db.transaction(
      tx => {
        tx.executeSql(`delete from place where id = ?;`, [id]);
      }, null, updateList
    )    
  }

    
  return (

    <View style={styles.container}>

      <Input
        placeholder='Type address and city'
        label='PLACEFINDER'  
        style={styles.input}
        onChangeText={address => setAddress(address)}
        value={address}          
      />      
        
      <Button onPress={() => navigation.navigate('Map', { address, save: true })} title= "Show on map" />
      
      <View style={{width:'100%'}}>

        <FlatList 
          style={{marginLeft : "5%"}}
          keyExtractor={item => item.id.toString()} 
          data={places}
          renderItem={({item}) =>  

          <ListItem bottomDivider>  
              <ListItem.Content>
              <ListItem.Title> {item.street}, {item.postalCode} {item.area} </ListItem.Title>
              <ListItem.Subtitle  onPress={() => navigation.navigate('Map', { address: item.fullAddress, save: false })}> Show on map </ListItem.Subtitle>
              </ListItem.Content>        
            <Icon
              color='red'
              name='delete'
              type='material'
              onPress={() => Alert.alert(
                  "Do you want to remove the address?",
                  "The address will be deleted permanently",
                  [
                    {
                      text: "Cancel",
                      onPress: () => console.log("Cancel Pressed"),
                      style: "cancel"
                    },
                    { text: "OK", onPress: () => deleteItem(item.id) }
                  ]
              )}
            />
          </ListItem>}      
        />  
      </View>

    
    </View>
  );


}

function MapScreen({ route, navigation }) {

  const [region, setRegion] = useState({

    latitude: 60.200692,
    longitude: 24.934302,
    latitudeDelta: 0.0322,
    longitudeDelta: 0.0221

  })

  const { address, save } = route.params

    fetch(`http://www.mapquestapi.com/geocoding/v1/address?key=EWWR1uAZNVRPjnGV8vu4zJPoIK8IEbXf&location=${address}`)

    .then(response => response.json())
    .then(responseJson => setRegion({
      street: responseJson.results[0].locations[0].street,
      postalCode: responseJson.results[0].locations[0].postalCode,
      area: responseJson.results[0].locations[0].adminArea5,
      latitude: responseJson.results[0].locations[0].latLng.lat,
      longitude: responseJson.results[0].locations[0].latLng.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
        
    }))
            
    .catch(error => { 
          Alert.alert('Error', error); 
    });




  if(save) {
    
    return (
    
      <MapView
        style={styles.map}      
        region={region}
      >
        <Marker coordinate={{
          latitude: region.latitude,
          longitude: region.longitude}}        
        />
      
        <Button
         
          style={styles.mapButton}
          title="Save location" 
          onPress={() => {
            navigation.navigate({
              name: 'My Places',
              params: { region: region },
              merge: true,
            }) 
          }}   

        />

      </MapView> 

    )
  }


    return (

      <MapView
        style={styles.map}      
        region={region}
      >
        <Marker coordinate={{
          latitude: region.latitude,
          longitude: region.longitude}}        
        />


      </MapView>

    )


}


export default function App() {
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="My Places">
        <Stack.Screen name="My Places" component={Places} />
        <Stack.Screen name="Map" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20
    
  },
  input: {
    width: 200,  
    borderBottomColor: 'black',
    borderBottomWidth: 1
      
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%"
  },
  mapButton: {
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  listcontainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    
   },
});
