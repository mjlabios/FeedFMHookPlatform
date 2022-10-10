
import React, { Component,useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, FlatList } from 'react-native';
import { audioPlayerService } from 'react-native-feed-media-audio-player';
import AudioPlayer from 'react-native-feed-media-audio-player/lib/audio-player';
import Video from 'react-native-video';
import DeviceCountry, {
  TYPE_ANY,
  TYPE_TELEPHONY,
  TYPE_CONFIGURATION,
} from 'react-native-device-country';

console.log('initializing!');
const videoSource = require('./assets/test-video.mp4')

import { LogBox } from "react-native";
LogBox.ignoreLogs(["Warning: ..."]); // Ignore log notification by message
LogBox.ignoreAllLogs();



type PlayerAvailability = boolean | null;

const Token = 'demo'
const Secret = 'demo'

interface Song {
    title: string;
    artist: string;
    album: string;
    elapsed: number;
    duration: number;
    canSkip: boolean;
    elapsedTime: AudioPlayer['elapsedTime'];
}

export default function App() {
    audioPlayerService.initialize({ token: Token, secret: Secret, debug: true, enableBackgroundMusic: false });
    const [deviceLocation, setDeviceLocation] = useState(null)
    const [available, setAvailable] = useState(null)
    const [gPlayer, setPlayer] = useState(audioPlayerService.player)
    const [stations, setStations] = useState([]) 
    const [station, setStation] =useState(null)
    const [requestingSkip, setRequestingSkip] = useState(false)
    const [playbackState, setPlaybackState] = useState(audioPlayerService.playbackState)
    const [play, setPlay] = useState<Song>(null)
    const [elapsed,setElapsed] = useState(0)

  
    // Make sure music is available for playback before registering event listeners
    useEffect(()=>{
     gPlayer.whenAvailable((availableState) => {

        DeviceCountry.getCountryCode()
      .then((result) => {
        setDeviceLocation(result)
        // {"code": "BY", "type": "telephony"}
      })
      .catch((e) => {
        console.log(e);
    });

       // no music is available
      if (!availableState) {
        setAvailable(false)
        return;
      }
      console.log('useEffect')
      setAvailable(true)
      setPlaybackState(gPlayer.playbackState)
      setStations(gPlayer.stations)
      setRequestingSkip(false)

      gPlayer.on('state-change', (state) => {
        setPlaybackState(state)
      });

      gPlayer.on('station-change', (station) => {
        setStations(station)
      });

      gPlayer.on('play-started', (play) => {
        setRequestingSkip(false)
        setPlay({...play,elapsed:0})
        setElapsed(0)
      });

      gPlayer.on('skip-failed', () => {
        setRequestingSkip(false)
        setPlay({...play, canSkip: false})
     
      });

    //   const elapsedTimer = setInterval(() => {
    //     if ((playbackState === 'PLAYING')) {

    //       const sec = Math.round(gPlayer.elapsedTime)

    //       if(sec % 1 == 0){
    //       //setPlay({...play,elapsed: sec})
    //       setElapsed(sec)
    //       }
    //     }
    //   }, 1000);
    //    return () => {
    //     if (available) {
    //       clearInterval(elapsedTimer);
    //     }
    // }
  });
    },[]);

    useEffect(()=> {

       const elapsedTimer = setInterval(() => {
        if ((playbackState === 'PLAYING')) {

          const sec = Math.round(gPlayer.elapsedTime)

          if(sec % 1 == 0){
          //setPlay({...play,elapsed: sec})
          setElapsed(sec)
          }
        }
      }, 1000);

       return () => {
        if (available) {
          clearInterval(elapsedTimer);
        }
    }



    })
  
  const skip = () => {
    // note that we're trying to skip
    setRequestingSkip(true)
    gPlayer.skip()
  }

  function renderLocation() {
    if(deviceLocation == null){
      return(
        <Text style = {styles.text}>Location = Simulator</Text>
       )
    }
    else {
       return(
        <Text style = {styles.text}>Location = {deviceLocation.code}</Text>
       )
    }
  }

  function renderStation() {
    if(station == null){
      return(
        <Text style = {styles.text}>Station = default</Text>
       )
    }
    else {
       return(
        <Text style = {styles.text}>Station = {station.name}</Text>
       )
    }
  }

  function renderButtons() {

    return [
      (

        <View key="cid" style={styles.container}>
          <View style = {{backgroundColor: 'teal',borderRadius:15,}}>
          <Text style={styles.text}>Dashboard</Text>
          <Text style={styles.text}>CID={gPlayer.clientID}</Text>
          {renderStation()}
          {renderLocation()}
          </View>
        </View>
      ),
      <Button
        key="play"
        onPress={() => {
          gPlayer.play()

        }} title={'Play Station'} />,
      <Button
        key="CreateCID"
        onPress={() => {
          gPlayer.createNewClientID(() => {
            console.log('all ready with new client id!', gPlayer.clientID);
            console.log('with new stations!', gPlayer.stations);
          });
        }} title={'Create new client id'} />,

      <Button
        key="SetCID"
        onPress={() => {
          audioPlayerService.player.setClientID('fmcidv1:kkerxjsj:2bj:0cc7obvv0m', () => {
            console.log('returned to old client id', audioPlayerService.player.clientID);
            console.log('stations are now', audioPlayerService.player.stations);
          });
        }} title={'Assign old client id'} />,

        <FlatList
           scrollEnabled = {true}
            data={stations}
            keyExtractor={item => item.id}
            contentContainerStyle = {{padding:10}}
            style = {{flex:1}}
            ListHeaderComponent = {
              <Text style = {{textAlign:'center',paddingVertical:15,fontSize:25,fontWeight:'bold'}}>Select your Station</Text>
            }
            renderItem={
            ({ item, index }) => (
              <View style = {{height:50,marginBottom:10, width:'100%',backgroundColor:'white',borderRadius:10,alignItems:'center',justifyContent:'center'}}>
                 <Button
                  key={'key' + item.id}
                  style = {{flex:1}}
                  onPress={() => {
                    setStation(item)

                  }} title={item.name} />
              </View>
              )
            }
          
        />
    ];
  }


  function renderView () {
    // player still intializing
    if (available === null) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>initializing...</Text>
        </View>
      );
    }

    // no music availale for playback
    if (available === false) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>sorry, no music is available for you</Text>
        </View>
      );
    }
    // music is available!
    switch (playbackState) {
      case 'READY_TO_PLAY':
        return (
          <View style={styles.container}>
            {renderButtons()}
          </View>

        );

      case 'WAITING_FOR_ITEM':
      case 'STALLED':
        return (
          <View style={styles.container}>
            <Text style={styles.text}>waiting for music..</Text>
          </View>
        );

      case 'PLAYING':
        return (
          <View style={styles.container}>
            <Video  
            source ={videoSource}   // the video file
            paused={false}                  // make it start    
            style={styles.backgroundVideo}  // any style you want
            repeat={true}                   // make it a loop
            />
            <Text style={styles.text}>{play.title}</Text>
            <Text style={styles.text}>by {play.artist}</Text>
            <Text style={styles.text}>on {play.album}</Text>
            <Text style={styles.text}>{elapsed} of {play.duration} seconds elapsed</Text>
            <Button onPress={() => {
              gPlayer.pause()
            }} title="pause" />
            {
              requestingSkip ?
                (<Text style={styles.text}>(trying to skip)</Text>) :
                (<Button onPress={() => { skip(); }} title="skip" />)
            }
            <Button onPress={() => {
              gPlayer.volume = 0
            }} title="vol 0" />
            <Button onPress={() => {
              gPlayer.volume = 0.3
            }} title="vol 0.3" />
            <Button onPress={() => {
              gPlayer.volume = 0.5
            }} title="vol 0.5" />
            <Button onPress={() => {
              gPlayer.volume = 1
            }} title="vol 1" />
          </View>
        );

      case 'PAUSED':
        return (
          <View style={styles.container}>
            <Text style={styles.text}>{play.title}</Text>
            <Text style={styles.text}>by {play.artist}</Text>
            <Text style={styles.text}>on {play.album}</Text>
            <Text style={styles.text}>{elapsed} of {play.duration} seconds elapsed</Text>
            <Button onPress={() => {
              gPlayer.play();
            }} title="play" />
            {
              !gPlayer.canSkip ? (<Text style={styles.text}>(Skipping not allowed)</Text>) :
                requestingSkip ? (<Text style={styles.text}>(trying to skip)</Text>) :
                  (<Button onPress={() => { skip(); }} title="skip" />)
            }
            <Button onPress={() => {
              gPlayer.stop();
            }} title="stop" />
          </View>
        );

      case 'UNINITIALIZED':
        // not reached, because player.state.available is not null at this point:
        return (
          <View style={styles.container}>
            <Text style={styles.text}>no state available yet</Text>
          </View>
        );

      case 'OFFLINE':
        // not yet exposed to react native clients
        return (
          <View style={styles.container}>
            <Text style={styles.text}>offline playback only!</Text>
          </View>
        );

    }

  }

  return(
    <View style = {{flex:1}}>
    {renderView()}
    </View>
   )
  }


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
    color:'black'
  },
  backgroundVideo: {
    width:'100%',
    height:200,
    backgroundColor:'black'
  }
});
