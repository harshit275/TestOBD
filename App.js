import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  TextInput
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { bytesToString, stringToBytes } from 'convert-string';


const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const deviceName = 'VEEPEAK';

// const App: () => React$Node = () => {
class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      device: '',
      service: 'FFF0',
      notify: 'FFF1',
      write: 'FFF2',
      message: 'Press CONNECT to start!',
      output: 'See the command result here!',
      text: '',
      value: '',
    };
  }

  componentDidMount() {
    BleManager.start({ showAlert: false });
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
        .then((result) => {
          if (result) {
            console.log('Permission is OK!');
          } else {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
              .then((result) => {
                if (result) {
                  console.log('User accept!');
                } else {
                  console.log('User refuse!');
                }
              });
          }
        });
    }
    this.handleUpdate = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic', this.handleUpdate);
  }

  clear = async () => {
    this.setState({ text: '', value: '' });
    try {
      await BleManager.refreshCache(this.state.device);
      console.log('Cache refreshed!')
    } catch (error) {
      console.log('Error: ', error);
    }
  }

  connect = async () => {
    this.setState({ message: 'Connecting to the device!' });
    await BleManager.enableBluetooth();
    console.log('The bluetooth is already enabled or the user confirm!');
    const bondedPeripheralsArray = await BleManager.getBondedPeripherals([]);
    bondedPeripheralsArray.forEach((element) => {
      if (element.name === deviceName) {
        this.setState({ device: element.id });
      }
    });
    try {
      await BleManager.connect(this.state.device);
      console.log('Connected to ' + this.state.device);
      this.setState({ message: 'Connected!' });
    } catch (error) {
      console.log('Error: ', error);
      this.setState({ output: 'Error: ' + error, message: 'Press CONNECT to start!' });
    }
  }

  disconnect = async () => {
    try {
      await BleManager.disconnect(this.state.device);
      console.log('Disconnected!');
      this.setState({
        device: '',
        message: 'Disconnected! Press CONNECT again!',
        value: ''
      });
    } catch (error) {
      console.log('Error: ', error);
      this.setState({ output: 'Error: ' + error });
    }
  }

  handleUpdate = (data) => {
    console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
    const tempValue = this.state.value;
    const value = bytesToString(data.value);
    const output = tempValue + 'Response: ' + value + '\n';
    this.setState({ value: output })
  }

  write = async () => {
    const command = this.state.text + '\r';
    const data = stringToBytes(command);
    try {
      await BleManager.startNotification(this.state.device,
        this.state.service, this.state.notify);
      await BleManager.writeWithoutResponse(this.state.device,
        this.state.service, this.state.write, data);
      console.log('Writed: ' + data);
    } catch (error) {
      console.log('Error: ', error);
      this.setState({ output: 'Error: ' + error });
    }
  }

  render() {
    return (
      <>
        {/* <StatusBar barStyle="dark-content" /> */}
        <SafeAreaView>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={styles.scrollView}>
            {/* <Header /> */}
            {/* {global.HermesInternal == null ? null : (
              <View style={styles.engine}>
                <Text style={styles.footer}>Engine: Hermes</Text>
              </View>
            )} */}
            <View style={styles.body}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Test OBD</Text>
                <Text style={styles.sectionDescription}>
                  {this.state.message}
                </Text>
              </View>
              <View style={styles.sectionContainer}>
                <View style={{ padding: 10, borderColor: '#DAE1E7', borderWidth: 1, borderRadius: 10 }}>
                  <TextInput
                    style={{ height: 40 }}
                    placeholder='Type your command here to test!'
                    onChangeText={(text) => this.setState({ text })}
                    value={this.state.text}
                  />
                </View>
              </View>
              <View style={styles.sectionContainer}>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Button
                    title='Clear'
                    onPress={this.clear}
                  />
                  <Button
                    onPress={this.state.device ? this.disconnect : this.connect}
                    title={this.state.device ? 'Disconnect' : 'Connect'}
                  />
                  <Button
                    title='Test'
                    onPress={this.write}
                  />
                </View>
              </View>
              <View style={styles.sectionContainer}>
                <View style={{ padding: 10, borderColor: '#DAE1E7', borderWidth: 1, borderRadius: 10 }}>
                  <TextInput
                    style={{ height: '60%' }}
                    placeholder={this.state.output}
                    editable={false}
                    multiline={true}
                    numberOfLines={25}
                    onChangeText={(text) => this.setState({ text })}
                    value={this.state.value}
                  />
                </View>
              </View>
              {/* <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Learn More</Text>
                <Text style={styles.sectionDescription}>
                  Read the docs to discover what to do next:
                </Text>
              </View> */}
              {/* <LearnMoreLinks /> */}
            </View>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#F3F3F3',
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: '#1292B4',
  },
  sectionContainer: {
    marginTop: 42,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: '#444',
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: '#444',
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
