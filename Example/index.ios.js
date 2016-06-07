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
  ActivityIndicatorIOS,
  AlertIOS,
  TouchableHighlight
} from 'react-native';

import Firestack from 'react-native-firestack';
import config from './config';

const server = new Firestack(config.firebase);
server.configure();

class Login extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>Login here</Text>
      </View>
    )
  }
}

class AuthorizedPage extends Component {
  onLogout(e) {
    console.log('logging out...');
    server.signOut()
    .then(() => {
      console.log('signed out...');
    })
  }
  render() {
    const {currentUser} = this.props;

    return (
      <View style={styles.container}>
        <Text>Welcome back {currentUser.displayName}</Text>
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
    server.listenForAuth((err, user) => {
      console.log('listen for auth', err, user);
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
        {currentUser ? <AuthorizedPage currentUser={currentUser} {...this.props} /> : <Login />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('Example', () => Example);
