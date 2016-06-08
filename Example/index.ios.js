/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TextInput,
  ActivityIndicatorIOS,
  Image,
  TouchableHighlight,
  Dimensions,
  ListView,
} from 'react-native';
const windowSize = Dimensions.get('window');

import Firestack from 'react-native-firestack';
import config from './config';

const server = new Firestack(config.firebase);
server.configure();

class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: ''
    }
  }

  signIn(e) {
    this.props.onSignIn(this.state)
  }

  render() {
    return (
        <View style={styles.container}>
            <Image style={styles.bg} source={{uri: 'http://i.imgur.com/xlQ56UK.jpg'}} />
            <View style={styles.header}>
                <Image style={styles.mark} source={{uri: 'http://i.imgur.com/da4G0Io.png'}} />
            </View>
            <View style={styles.inputs}>
                <View style={styles.inputContainer}>
                    <Image style={styles.inputUsername} source={{uri: 'http://i.imgur.com/iVVVMRX.png'}}/>
                    <TextInput
                        style={[styles.input, styles.whiteFont]}
                        placeholder="Email"
                        placeholderTextColor="#FFF"
                        onChangeText={(t) => this.setState({username: t})}
                        value={this.state.username}
                    />
                </View>
                <View style={styles.inputContainer}>
                    <Image style={styles.inputPassword} source={{uri: 'http://i.imgur.com/ON58SIG.png'}}/>
                    <TextInput
                        password={true}
                        style={[styles.input, styles.whiteFont]}
                        placeholder="Pasword"
                        placeholderTextColor="#FFF"
                        onChangeText={(t) => this.setState({password: t})}
                        value={this.state.password}
                    />
                </View>
                <View style={styles.forgotContainer}>
                    <Text style={styles.greyFont}>Forgot Password</Text>
                </View>
            </View>
            <View style={styles.signin}>
              <TouchableHighlight onPress={this.signIn.bind(this)}>
                <Text style={styles.whiteFont}>Sign In</Text>
              </TouchableHighlight>
            </View>
            <View style={styles.signup}>
                <Text style={styles.greyFont}>Don't have an account?<Text style={styles.whiteFont}>  Sign Up</Text></Text>
            </View>
        </View>
    );
  }
}

class AuthorizedPage extends Component {
  constructor(props) {
    super(props);

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      vals: [],
      dataSource: ds,
    }
  }
  onLogout(e) {
    server.signOut()
    .then(() => {
      console.log('signed out...');
    })
  }

  componentDidMount() {
    const ref = server.database.ref('things');

    ref.orderByChild('timestamp')
      .on('value', snapshot => {
        if (snapshot.val()) {
          const val = snapshot.val();
          const vals = Object.keys(val).map(k => val[k]);
          const dataSource = this.state.dataSource.cloneWithRows(vals);
          this.setState({dataSource})
        }
      });
    ref.push({
      timestamp: server.ServerValue.TIMESTAMP,
      name: 'mounted',
    });
  }

  componentWillUnmount() {
    const ref = server.database.ref('things');

    ref.push({
      timestamp: server.ServerValue.TIMESTAMP,
      name: 'unmounted'
    })
  }

  render() {
    const {currentUser} = this.props;

    return (
      <View style={styles.container}>
        <Text>Welcome back {currentUser.displayName}</Text>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={(rowData) => <Text>{rowData.timestamp}</Text>}
          />

          <TouchableHighlight onPress={this.onLogout.bind(this)}>
          <Text>Logout</Text>
        </TouchableHighlight>
      </View>
    )
  }
}

class Example extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      currentUser: null
    }
  }
  componentWillMount() {
    console.log('listen for auth, yo');
    server.listenForAuth((evt) => {
      console.log('listen for auth', evt);
      if (evt.error) {
        this.setState({currentUser: null, loading: false});
      } else {
        this.setState({currentUser: evt.user, loading: false});
      }
    });
  }
  componentWillUnmount() {
    server.unlistenForAuth();
  }
  componentDidMount() {
    console.log('new props', this.props);
    server.getCurrentUser()
      .then(u => {
        console.log('got current user', u)
        this.setState({
          loading: false,
          currentUser: u
        })
      })
      .catch(e => {
        console.info('no current user', e)
        this.setState({
          loading: false,
          currentUser: null
        })
      })
    server.logEventWithName('launched', {});
  }

  onSignIn({username, password}) {
    console.log('onSignIn called', username, password);
    server.signInWithEmail(username, password)
    .then(u => this.setState({currentUser: u, loading: false}))
    .catch(e => {
      console.info('error ->', e);
    })
  }

  render() {
    const {loading, currentUser} = this.state;

    if (loading) {
      return (<View style={styles.container}>
        <Text>Loading...</Text>
      </View>)
    }

    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        {currentUser ?
          <AuthorizedPage currentUser={currentUser} {...this.props} /> :
          <Login onSignIn={this.onSignIn.bind(this)} />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
    container: {
      flexDirection: 'column',
      flex: 1,
      backgroundColor: 'transparent'
    },
    bg: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: windowSize.width,
        height: windowSize.height
    },
    header: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: .5,
        backgroundColor: 'transparent'
    },
    mark: {
        width: 150,
        height: 150
    },
    signin: {
        backgroundColor: '#FF3366',
        padding: 20,
        alignItems: 'center'
    },
    signup: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: .15
    },
    inputs: {
        marginTop: 10,
        marginBottom: 10,
        flex: .25
    },
    inputPassword: {
        marginLeft: 15,
        width: 20,
        height: 21
    },
    inputUsername: {
      marginLeft: 15,
      width: 20,
      height: 20
    },
    inputContainer: {
        padding: 10,
        borderWidth: 1,
        borderBottomColor: '#CCC',
        borderColor: 'transparent'
    },
    input: {
        position: 'absolute',
        left: 61,
        top: 12,
        right: 0,
        height: 20,
        fontSize: 14
    },
    forgotContainer: {
      alignItems: 'flex-end',
      padding: 15,
    },
    greyFont: {
      color: '#D8D8D8'
    },
    whiteFont: {
      color: '#FFF'
    }
})


AppRegistry.registerComponent('Example', () => Example);
