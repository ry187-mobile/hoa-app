import React, { useState, useEffect } from 'react';
// Dashboard Screen Component
const DashboardScreen = ({ navigation, events = [], user }) => {
  // Debug: Log user data
  console.log('DashboardScreen user data:', user);
  
  // State for requests data
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState(null);
  
  // DashboardScreen real-time requests
  useEffect(() => {
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to requests:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Calculate dashboard data from real requests
const openIssues = requests.filter(request => request.status === 'Pending').length;

// upcomingEvents is driven by a real-time listener below (status == 'Upcoming')


  // Get recent requests (latest 3) and format them for display
  const recentIssues = requests.slice(0, 3).map(request => ({
    id: request.id,
    color: getRequestStatusColor(request.status),
    title: request.title,
    house: `#${request.id.slice(-3)}`, // Use last 3 chars of ID as house number
    date: request.date,
    status: request.status
  }));

  // Function to get color based on request status
  function getRequestStatusColor(status) {
    switch (status) {
      case 'Pending': return '#ffa726'; // Orange for pending
      case 'Resolved': return '#66bb6a'; // Green for resolved
      default: return '#9E9E9E'; // Gray for unknown status
    }
  }

  // In DashboardScreen, add state for announcements
  const [announcements, setAnnouncements] = useState([]);

  // Add real-time listener for announcements with debugging
  useEffect(() => {
    const announcementsRef = collection(db, 'announcements');
    const q = query(announcementsRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Dashboard: Fetched announcements:', data.length, data);
      setAnnouncements(data);
    }, (error) => {
      console.error('Error listening to announcements:', error);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for upcoming events (status == 'Upcoming')
  useEffect(() => {
    // listen for events with status 'Upcoming' so dashboard updates immediately
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('status', '==', 'Upcoming'));
    const unsubscribe = onSnapshot(q, snap => {
      setUpcomingEvents(snap.size);
    }, error => {
      console.error('Upcoming events snapshot error:', error);
      setUpcomingEvents(0);
    });
    return () => unsubscribe();
  }, []);

  // Remove the old fetchAnnouncements function and its calls
  // useEffect(() => {
  //   fetchRequests();
  // }, []);

  // Refresh data when screen comes into focus (only for requests now)
  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('focus', () => {
  //     fetchRequests();
  //   });
  //   return unsubscribe;
  // }, [navigation]);

  // Function to get priority color for announcements
  function getAnnouncementPriorityColor(priority) {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9E9E9E';
    }
  }

  // Add debugging for recentAnnouncements calculation
  const recentAnnouncements = announcements?.slice(0, 3) || [];
  console.log('Dashboard: Recent announcements to display:', recentAnnouncements.length, recentAnnouncements);

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: Platform.OS === 'android' ? 50 : 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={styles.dashboardWelcomeCardModern}>
          <Text style={styles.dashboardWelcomeTitleModern}>Welcome back, {user?.firstName || 'User'}!</Text>
          <Text style={styles.dashboardWelcomeSubtitleModern}>Stay informed with the latest updates and events in our Community!</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.dashboardStatsRowModern}>
          <View style={styles.dashboardStatCardModern}>
            <Ionicons name="alert-circle" size={32} color="#FF5252" style={{ marginBottom: 8 }} />
            <Text style={styles.dashboardStatNumberModern}>{openIssues}</Text>
            <Text style={styles.dashboardStatLabelModern}>Open Issues</Text>
          </View>
          <View style={styles.dashboardStatCardModern}>
            <Ionicons name="calendar" size={32} color="#4CAF50" style={{ marginBottom: 8 }} />
            <Text style={styles.dashboardStatNumberModern}>{upcomingEvents}</Text>
            <Text style={styles.dashboardStatLabelModern}>Upcoming Events</Text>
          </View>
        </View>

        {/* Recent Issues */}
        <View style={styles.dashboardSectionModern}>
          <Text style={styles.dashboardSectionTitleModern}>Recent Issues</Text>
          {loading ? (
            <View style={styles.dashboardIssueCardModern}>
              <Text style={styles.dashboardIssueTitleModern}>Loading recent issues...</Text>
            </View>
          ) : recentIssues.length > 0 ? (
            recentIssues.map(issue => (
              <View key={issue.id} style={styles.dashboardIssueCardModern}>
                <View style={[styles.dashboardIssueDotModern, { backgroundColor: issue.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dashboardIssueTitleModern}>{issue.title}</Text>
                  <Text style={styles.dashboardIssueMetaModern}>
                    {issue.house} • {issue.date} • {issue.status}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.dashboardIssueCardModern}>
              <Text style={styles.dashboardIssueTitleModern}>No recent issues</Text>
              <Text style={styles.dashboardIssueMetaModern}>All requests are up to date</Text>
            </View>
          )}
        </View>

        {/* Recent Announcements */}
        <View style={styles.dashboardSectionModern}>
          <Text style={styles.dashboardSectionTitleModern}>Recent Announcements</Text>
          {recentAnnouncements.length > 0 ? (
            recentAnnouncements.map(announcement => (
              <TouchableOpacity 
                key={announcement.id} 
                style={styles.dashboardIssueCardModern}
                onPress={() => navigation.navigate('Announcements')}
                activeOpacity={0.7}
              >
                <View style={[styles.dashboardIssueDotModern, { backgroundColor: getAnnouncementPriorityColor(announcement.priority) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dashboardIssueTitleModern}>{announcement.title}</Text>
                  <Text style={styles.dashboardIssueMetaModern}>
                    {announcement.date} • {announcement.priority}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.dashboardIssueCardModern}>
              <Text style={styles.dashboardIssueTitleModern}>No recent announcements</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.dashboardActionsRowModern}>
          <TouchableOpacity style={styles.dashboardActionButtonModern} onPress={() => navigation.navigate('Requests')}>
            <Ionicons name="add-circle-outline" size={32} color="#2196F3" />
            <Text style={styles.dashboardActionLabelModern}>Report Issue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dashboardActionButtonModern} onPress={() => navigation.navigate('Events')}>
            <Ionicons name="calendar-outline" size={32} color="#8e24aa" />
            <Text style={styles.dashboardActionLabelModern}>View Events</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, StatusBar, SafeAreaView, Modal, FlatList, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCredential, updateProfile } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, getDoc } from 'firebase/firestore';
import { StatusBar as RNStatusBar } from 'expo-status-bar';
import BSNALogo from './assets/bsna-logo.png';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Login Screen Component
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerHomeNumber, setRegisterHomeNumber] = useState('');
  const [registerPhoneNumber, setRegisterPhoneNumber] = useState('');
  const [registerAddress, setRegisterAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // OTP state for Gmail verification
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  // Forgot password handler
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, forgotEmail);
      Alert.alert('Success', 'Password reset email sent! Please check your inbox.');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (error) {
      Alert.alert('Reset Error', error.message);
    }
  };
  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '914497576832-p7eg2q2051teku39u15g697ltjlu2kiq.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: '914497576832-p7eg2q2051teku39u15g697ltjlu2kiq.apps.googleusercontent.com',
  });

  useEffect(() => {
    const signInWithGoogleToFirebase = async (idToken) => {
      try {
        // Import GoogleAuthProvider dynamically to avoid import issues
        const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        // Set current user data for Google login
        const userData = {
          firstName: userCredential.user.displayName ? userCredential.user.displayName.split(' ')[0] : 'User',
          lastName: userCredential.user.displayName ? userCredential.user.displayName.split(' ').slice(1).join(' ') : '',
          email: userCredential.user.email
        };
        setCurrentUser(userData);
        navigation.navigate('MainTabs', { user: userData });
      } catch (error) {
        Alert.alert('Google Login Error', error.message);
      }
    };
    if (response?.type === 'success') {
      const { id_token, idToken } = response.authentication || {};
      // idToken is the standard, but fallback to id_token for some platforms
      const token = idToken || id_token;
      if (token) {
        signInWithGoogleToFirebase(token);
      } else {
        Alert.alert('Google Login Error', 'No idToken returned from Google.');
      }
    }
  }, [response]);

  // Registration with Gmail OTP verification
  const sendOtpToGmail = async () => {
    setOtpError('');
    if (!registerEmail.endsWith('@gmail.com')) {
      setOtpError('Only Gmail addresses are allowed.');
      return;
    }
    setIsSendingOtp(true);
    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(generatedOtp);
    try {
      // Use EmailJS REST API via fetch 
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'origin': 'http://localhost', 
          'Authorization': 'Bearer -AH8iXGIeO_xOyBb1', 
        },
        body: JSON.stringify({
          service_id: 'service_to0z59v',
          template_id: 'template_up35j1g',
          user_id: '-AH8iXGIeO_xOyBb1',
          template_params: {
            to_email: registerEmail,
            passcode: generatedOtp,
          },
        }),
      });
      if (response.ok) {
        setOtpSent(true);
        Alert.alert('OTP Sent', 'A verification code has been sent to your Gmail. Please enter it below.');
      } else {
        const errorText = await response.text();
        setOtpError('Failed to send OTP: ' + errorText);
        Alert.alert('OTP Error', errorText);
      }
    } catch (err) {
      setOtpError('Failed to send OTP: ' + (err?.message || err));
      Alert.alert('OTP Error', err?.message || String(err));
    }
    setIsSendingOtp(false);
  };

  const handleRegister = async () => {
    if (!registerEmail || !registerPassword || !registerFirstName || !registerLastName || !registerHomeNumber || !registerPhoneNumber || !registerAddress) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!registerEmail.endsWith('@gmail.com')) {
      Alert.alert('Error', 'Only Gmail addresses are allowed for registration.');
      return;
    }
    if (!otpSent) {
      sendOtpToGmail();
      return;
    }
    if (enteredOtp !== otp) {
      setOtpError('Invalid OTP. Please check your email and try again.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      if (userCredential.user) {
        // Save user data to user profile
        await updateProfile(userCredential.user, {
          displayName: `${registerFirstName} ${registerLastName}`
        });
        // Add member to Firestore
        await addDoc(collection(db, 'members'), {
          firstName: registerFirstName,
          lastName: registerLastName,
          email: registerEmail,
          homeNumber: registerHomeNumber,
          status: 'active',
          avatar: '', // You can collect or generate an avatar if needed
          phoneNumber: registerPhoneNumber,
          address: registerAddress,
          createdAt: new Date().toISOString(),
          role: 'user' // Add this line to set default role
        });
        // Fetch the user document to get the role
        const membersRef = collection(db, 'members');
        const q = query(membersRef, where('email', '==', registerEmail));
        const querySnapshot = await getDocs(q);
        let userRole = 'user';
        if (!querySnapshot.empty) {
          userRole = querySnapshot.docs[0].data().role || 'user';
        }
        // Set current user data and navigate to MainTabs
        const userData = {
          firstName: registerFirstName,
          lastName: registerLastName,
          email: registerEmail,
          role: userRole,
          phoneNumber: registerPhoneNumber,
          homeNumber: registerHomeNumber,
          address: registerAddress
        };
        setCurrentUser(userData);
        
        setShowRegister(false);
        setOtpSent(false);
        setEnteredOtp('');
        setOtp('');
        setRegisterFirstName('');
        setRegisterLastName('');
        setRegisterHomeNumber('');
        setRegisterPhoneNumber('');
        setRegisterAddress('');
        
        // Navigate to MainTabs with user data
        navigation.navigate('MainTabs', { user: userData });
        Alert.alert('Success', 'Registration successful! Welcome to Blessed Sapphire!');
      }
    } catch (error) {
      Alert.alert('Registration Error', error.message);
    }
  };

  // Email/password login
  const handleLogin = async () => {
    if (email && password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Fetch the user document to get the role
        const membersRef = collection(db, 'members');
        const q = query(membersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        let userRole = 'user';
        let firstName = 'User';
        let lastName = '';
        let phoneNumber = '';
        let homeNumber = '';
        let address = '';
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          userRole = data.role || 'user';
          firstName = data.firstName || 'User';
          lastName = data.lastName || '';
          phoneNumber = data.phoneNumber || '';
          homeNumber = data.homeNumber || '';
          address = data.address || '';
        } else if (userCredential.user.displayName) {
          firstName = userCredential.user.displayName.split(' ')[0];
          lastName = userCredential.user.displayName.split(' ').slice(1).join(' ');
        }
        // Set current user data
        const userData = {
          firstName,
          lastName,
          email: userCredential.user.email,
          role: userRole,
          phoneNumber,
          homeNumber,
          address
        };
        setCurrentUser(userData);
        

        
        navigation.navigate('MainTabs', { user: userData });
      } catch (error) {
        Alert.alert('Login Error', error.message);
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.loginContainer}>
        <Image
          source={BSNALogo}
          style={{ width: 180, height: 180, alignSelf: 'center', marginBottom: 12 }}
          resizeMode="contain"
        />
        <Text style={styles.title}>Blessed Sapphire</Text>
        <Text style={styles.subtitle}>Welcome Back!</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Google Login Button */}
        <TouchableOpacity
          style={[styles.facebookButton, { backgroundColor: '#4285f4', borderWidth: 1, borderColor: '#e0e0e0', marginTop: 16 }]}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png' }} style={{ width: 28, height: 28, marginRight: 10, borderRadius: 4, backgroundColor: '#4285f4' }} />
          <Text style={[styles.facebookButtonText, { color: '#fff' }]}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity style={styles.registerButton} onPress={() => setShowRegister(true)}>
          <Text style={styles.registerButtonText}>Register?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPassword} onPress={() => setShowForgotPassword(true)}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      {/* Forgot Password Modal */}
      <Modal visible={showForgotPassword} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.registerModal, { paddingHorizontal: 24, paddingVertical: 32 }]}> 
            <ScrollView 
              style={{ minWidth: 280 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center', paddingBottom: 16 }}
            >
              <Text style={[styles.gmailModalTitle, { textAlign: 'center', alignSelf: 'center', marginBottom: 24 }]}>Reset your password</Text>
              <View style={[styles.gmailInputGroup, { width: '100%', marginBottom: 24 }]}> 
                <Text style={[styles.gmailInputLabel, { textAlign: 'left', marginLeft: 2 }]}>Enter your email</Text>
                <TextInput
                  style={[styles.gmailInput, { borderRadius: 8, paddingHorizontal: 12, marginTop: 4 }]}
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor="#1a73e8"
                  placeholder="Email address"
                />
              </View>
              <TouchableOpacity style={[styles.gmailCreateButton, { width: '100%', marginBottom: 12 }]} onPress={handleForgotPassword}>
                <Text style={styles.gmailCreateButtonText}>Send Reset Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gmailSignInLink} onPress={() => setShowForgotPassword(false)}>
                <Text style={styles.gmailSignInText}>Back to Login</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>

      {/* Registration Modal with Gmail OTP */}
      <Modal visible={showRegister} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.registerModal}>
            <ScrollView contentContainerStyle={{padding: 24}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.gmailModalTitle}>Create your account</Text>
              <View style={styles.gmailInputGroup}>
                <Text style={styles.gmailInputLabel}>Gmail Address</Text>
                <TextInput
                  style={styles.gmailInput}
                  value={registerEmail}
                  onChangeText={text => {
                    setRegisterEmail(text);
                    setOtpSent(false);
                    setEnteredOtp('');
                    setOtp('');
                    setOtpError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor="#1a73e8"
                  placeholder=""
                />
              </View>
              <View style={styles.gmailInputGroup}>
                <Text style={styles.gmailInputLabel}>First Name</Text>
                <TextInput
                  style={styles.gmailInput}
                  value={registerFirstName}
                  onChangeText={setRegisterFirstName}
                  autoCapitalize="words"
                  selectionColor="#1a73e8"
                  placeholder=""
                />
              </View>
              <View style={styles.gmailInputGroup}>
                <Text style={styles.gmailInputLabel}>Last Name</Text>
                <TextInput
                  style={styles.gmailInput}
                  value={registerLastName}
                  onChangeText={setRegisterLastName}
                  autoCapitalize="words"
                  selectionColor="#1a73e8"
                  placeholder=""
                />
              </View>
              <View style={styles.gmailInputGroup}>
                <Text style={styles.gmailInputLabel}>Home Number</Text>
                <TextInput
                  style={styles.gmailInput}
                  value={registerHomeNumber}
                  onChangeText={setRegisterHomeNumber}
                  autoCapitalize="characters"
                  selectionColor="#1a73e8"
                  placeholder=""
                />
              </View>
              <View style={styles.gmailInputGroup}>
                <Text style={styles.gmailInputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.gmailInput}
                  value={registerPhoneNumber}
                  onChangeText={setRegisterPhoneNumber}
                  keyboardType="phone-pad"
                  selectionColor="#1a73e8"
                  placeholder=""
                />
              </View>
              <View style={styles.gmailInputGroup}>
                <Text style={styles.gmailInputLabel}>Address</Text>
                <TextInput
                  style={styles.gmailInput}
                  placeholder="Enter your address"
                  value={registerAddress}
                  onChangeText={setRegisterAddress}
                  multiline
                  numberOfLines={2}
                />
              </View>
              <View style={styles.gmailInputGroup}>
                <Text style={styles.gmailInputLabel}>Password</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.gmailInput, { flex: 1 }]}
                    value={registerPassword}
                    onChangeText={setRegisterPassword}
                    secureTextEntry={!showPassword}
                    selectionColor="#1a73e8"
                    placeholder=""
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#888" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              </View>
              {/* OTP Section */}
              {otpSent && (
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Enter the 6-digit code sent to your Gmail</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={enteredOtp}
                    onChangeText={setEnteredOtp}
                    keyboardType="numeric"
                    maxLength={6}
                    selectionColor="#1a73e8"
                    placeholder=""
                  />
                </View>
              )}
              {otpError ? <Text style={{ color: 'red', marginBottom: 8 }}>{otpError}</Text> : null}
              <TouchableOpacity style={styles.gmailCreateButton} onPress={handleRegister} disabled={isSendingOtp}>
                <Text style={styles.gmailCreateButtonText}>{otpSent ? 'Verify & Create Account' : (isSendingOtp ? 'Sending Code...' : 'Send Code to Gmail')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gmailSignInLink} onPress={() => {
                setShowRegister(false);
                setOtpSent(false);
                setEnteredOtp('');
                setOtp('');
                setOtpError('');
                setRegisterFirstName('');
                setRegisterLastName('');
                setRegisterHomeNumber('');
                setRegisterPhoneNumber('');
                setRegisterAddress('');
              }}>
                <Text style={styles.gmailSignInText}>Already have an account? <Text style={{ color: '#1a73e8', fontWeight: 'bold' }}>Sign in</Text></Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// 1. Modern EventsScreen with Firestore integration
const EventsScreen = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('meeting');
  const [filter, setFilter] = useState(user?.role === 'admin' ? 'upcoming' : 'all');

  // EventsScreen real-time events
  useEffect(() => {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(data);
      setLoading(false);
    }, (error) => {
      Alert.alert('Error', 'Failed to load events');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper to check if event is upcoming or ended
  function isUpcoming(event) {
    if (!event.date) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const eventDate = new Date(event.date);
    eventDate.setHours(0,0,0,0);
    return eventDate >= today;
  }
  function isEnded(event) {
    if (!event.date) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const eventDate = new Date(event.date);
    eventDate.setHours(0,0,0,0);
    return eventDate < today;
  }

  // Filtering (by type and admin status)
  let filtered = events;
  if (user?.role === 'admin') {
    if (filter === 'upcoming') filtered = events.filter(e => e.status === 'Upcoming');
    else if (filter === 'ended') filtered = events.filter(e => e.status === 'Ended');
    else filtered = events;
  } else {
    filtered = events.filter(e => filter === 'all' || e.type === filter);
  }

  // Add new event
  const handleAddEvent = async () => {
    if (!newTitle || !newDate || !newTime || !newLocation || !newDescription) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const eventData = {
        title: newTitle,
        date: newDate,
        time: newTime,
        location: newLocation,
        description: newDescription,
        type: newType,
          status: 'Upcoming',
      };

      await addDoc(collection(db, 'events'), eventData);
      
      setShowAddModal(false);
      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setNewLocation('');
      setNewDescription('');
      setNewType('meeting');
      Alert.alert('Success', 'Event added!');
    } catch (error) {
      console.error('Error adding event:', error);
      Alert.alert('Error', 'Failed to add event');
    }
  };

  // Delete event
  const handleDeleteEvent = async (id) => {
    try {
      await deleteDoc(doc(db, 'events', id));
      Alert.alert('Deleted', 'Event deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete event');
    }
  };

  // Modern card UI
  const renderEvent = ({ item }) => (
    <View style={styles.eventModernCard}>
      <View style={styles.eventModernHeader}>
        <Text style={styles.eventModernTitle}>{item.title}</Text>
        <View style={[styles.eventModernBadge, { backgroundColor: getTypeColor(item.type) }]}> 
          <Text style={styles.eventModernBadgeText}>{item.type?.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.eventModernDate}>{item.date} • {item.time}</Text>
      <Text style={styles.eventModernLocation}><Ionicons name="location-outline" size={14} color="#666" /> {item.location}</Text>
      <Text style={styles.eventModernDescription}>{item.description}</Text>
      {/* Show priority */}
      <Text style={{ color: item.priority === 'high' ? '#f44336' : item.priority === 'medium' ? '#ff9800' : item.priority === 'low' ? '#4caf50' : '#888', fontWeight: 'bold', marginTop: 4 }}>
        Priority: {item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : 'Medium'}
      </Text>
      {user?.role === 'admin' && (
        <TouchableOpacity style={styles.eventDeleteButton} onPress={() => handleDeleteEvent(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  function getTypeColor(type) {
    switch (type) {
      case 'meeting': return '#3f51b5';
      case 'party': return '#8e24aa';
      case 'committee': return '#4caf50';
      default: return '#2196F3';
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'android' ? 50 : 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.eventsModernHeader}>
          <View className="headerContent">
            <Text style={styles.eventsModernTitle}>Community Events</Text>
            <Text style={styles.eventsModernSubtitle}>{filtered.length} events</Text>
          </View>
          {user?.role === 'admin' && (
            <TouchableOpacity style={styles.eventsAddButton} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {user?.role === 'admin' && (
              <>
                <TouchableOpacity style={[styles.filterChip, filter === 'all' && styles.filterChipActive]} onPress={() => setFilter('all')}>
                  <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterChip, filter === 'upcoming' && styles.filterChipActive]} onPress={() => setFilter('upcoming')}>
                  <Text style={[styles.filterChipText, filter === 'upcoming' && styles.filterChipTextActive]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterChip, filter === 'ended' && styles.filterChipActive]} onPress={() => setFilter('ended')}>
                  <Text style={[styles.filterChipText, filter === 'ended' && styles.filterChipTextActive]}>Ended</Text>
                </TouchableOpacity>
              </>
            )}
            {user?.role !== 'admin' && (
              <>
                <TouchableOpacity style={[styles.filterChip, filter === 'all' && styles.filterChipActive]} onPress={() => setFilter('all')}>
                  <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterChip, filter === 'meeting' && styles.filterChipActive]} onPress={() => setFilter('meeting')}>
                  <Text style={[styles.filterChipText, filter === 'meeting' && styles.filterChipTextActive]}>Meeting</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterChip, filter === 'party' && styles.filterChipActive]} onPress={() => setFilter('party')}>
                  <Text style={[styles.filterChipText, filter === 'party' && styles.filterChipTextActive]}>Party</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterChip, filter === 'committee' && styles.filterChipActive]} onPress={() => setFilter('committee')}>
                  <Text style={[styles.filterChipText, filter === 'committee' && styles.filterChipTextActive]}>Committee</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
        <View style={{ padding: 20 }}>
          {filtered.map(item => (
            <View key={item.id} style={styles.eventModernCard}>
              <View style={styles.eventModernHeader}>
                <Text style={styles.eventModernTitle}>{item.title}</Text>
                <View style={[styles.eventModernBadge, { backgroundColor: getTypeColor(item.type) }]}> 
                  <Text style={styles.eventModernBadgeText}>{item.type?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.eventModernDate}>{item.date} • {item.time}</Text>
              <Text style={styles.eventModernLocation}><Ionicons name="location-outline" size={14} color="#666" /> {item.location}</Text>
              <Text style={styles.eventModernDescription}>{item.description}</Text>
              <Text style={{ color: item.priority === 'high' ? '#f44336' : item.priority === 'medium' ? '#ff9800' : item.priority === 'low' ? '#4caf50' : '#888', fontWeight: 'bold', marginTop: 4 }}>
                Priority: {item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : 'Medium'}
              </Text>
              {user?.role === 'admin' && (
                <TouchableOpacity style={styles.eventDeleteButton} onPress={() => handleDeleteEvent(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No events</Text>
              <Text style={styles.emptySubtitle}>Tap + to add a new event</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Add Event Modal (admin only) */}
      {user?.role === 'admin' && (
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.registerModal}>
              <ScrollView contentContainerStyle={{padding: 24}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.gmailModalTitle}>Add Event</Text>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Title</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    selectionColor="#1a73e8"
                    placeholder=""
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={newDate}
                    onChangeText={setNewDate}
                    selectionColor="#1a73e8"
                    placeholder="2024-07-01"
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Time</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={newTime}
                    onChangeText={setNewTime}
                    selectionColor="#1a73e8"
                    placeholder="7:00 PM"
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Location</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={newLocation}
                    onChangeText={setNewLocation}
                    selectionColor="#1a73e8"
                    placeholder="Community Center"
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Description</Text>
                  <TextInput
                    style={[styles.gmailInput, { height: 80, textAlignVertical: 'top' }]}
                    value={newDescription}
                    onChangeText={setNewDescription}
                    multiline
                    numberOfLines={4}
                    selectionColor="#1a73e8"
                    placeholder=""
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Type</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['meeting', 'party', 'committee'].map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.filterChip, newType === t && styles.filterChipActive]}
                        onPress={() => setNewType(t)}
                      >
                        <Text style={[styles.filterChipText, newType === t && styles.filterChipTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity style={styles.gmailCreateButton} onPress={handleAddEvent}>
                  <Text style={styles.gmailCreateButtonText}>Add Event</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gmailSignInLink} onPress={() => {
                  setShowAddModal(false);
                  setNewTitle('');
                  setNewDate('');
                  setNewTime('');
                  setNewLocation('');
                  setNewDescription('');
                  setNewType('meeting');
                }}>
                  <Text style={styles.gmailSignInText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// Modern RequestsScreen with Firestore integration
const RequestsScreen = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('general');
  const [filter, setFilter] = useState('all');

  // Fetch requests from Firestore
  useEffect(() => {
    // Replace fetchRequests with real-time listener
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      setLoading(false);
    }, (error) => {
      Alert.alert('Error', 'Failed to load requests');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Add new request
  const handleAddRequest = async () => {
    if (!newTitle || !newDescription) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const requestData = {
        title: newTitle,
        description: newDescription,
        date: new Date().toISOString().slice(0, 10),
        status: 'Pending',
        type: newType,
      };

      await addDoc(collection(db, 'requests'), requestData);
      
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewType('general');
      Alert.alert('Success', 'Request submitted!');
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request');
    }
  };

  // Delete request
  const handleDeleteRequest = async (id) => {
    try {
      await deleteDoc(doc(db, 'requests', id));
      Alert.alert('Deleted', 'Request deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete request');
    }
  };

  // Update request status
  const handleUpdateStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Pending' ? 'Resolved' : 'Pending';
      
      
      
      await updateDoc(doc(db, 'requests', id), {
        status: newStatus
      });
      

      
      Alert.alert('Updated', `Request marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating request status:', error);
      Alert.alert('Error', 'Failed to update request status');
    }
  };

  // Filtering (by status)
  const filtered = requests.filter(r => filter === 'all' || r.status === filter);

  // Modern card UI
  const renderRequest = ({ item }) => (
    <View style={styles.requestModernCard}>
      <View style={styles.requestModernHeader}>
        <Text style={styles.requestModernTitle}>{item.title}</Text>
        <View style={[styles.requestModernBadge, { backgroundColor: getStatusColor(item.status) }]}> 
          <Text style={styles.requestModernBadgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.requestModernDate}>{item.date}</Text>
      {/* Add type display here */}
      <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>Type: {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'General'}</Text>
      <Text style={styles.requestModernDescription}>{item.description}</Text>
      {/* Action Buttons */}
      <View style={styles.requestActionButtons}>
        {user?.role === 'admin' && (
          <TouchableOpacity 
            style={[styles.requestStatusButton, { backgroundColor: item.status === 'Pending' ? '#4CAF50' : '#FF9800' }]} 
            onPress={() => handleUpdateStatus(item.id, item.status)}
          >
            <Ionicons 
              name={item.status === 'Pending' ? 'checkmark-circle-outline' : 'time-outline'} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.requestStatusButtonText}>
              {item.status === 'Pending' ? 'Mark Resolved' : 'Mark Pending'}
            </Text>
          </TouchableOpacity>
        )}
        {user?.role === 'admin' && (
          <TouchableOpacity style={styles.requestDeleteButton} onPress={() => handleDeleteRequest(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  function getStatusColor(status) {
    return status === 'Pending' ? '#ffa726' : '#66bb6a';
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'android' ? 50 : 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.requestsModernHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.requestsModernTitle}>HOA Requests</Text>
            <Text style={styles.requestsModernSubtitle}>{filtered.length} requests</Text>
          </View>
          <TouchableOpacity style={styles.requestsAddButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity style={[styles.filterChip, filter === 'all' && styles.filterChipActive]} onPress={() => setFilter('all')}>
              <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, filter === 'Pending' && styles.filterChipActive]} onPress={() => setFilter('Pending')}>
              <Text style={[styles.filterChipText, filter === 'Pending' && styles.filterChipTextActive]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, filter === 'Resolved' && styles.filterChipActive]} onPress={() => setFilter('Resolved')}>
              <Text style={[styles.filterChipText, filter === 'Resolved' && styles.filterChipTextActive]}>Resolved</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <View style={{ padding: 20 }}>
          {filtered.map(item => (
            <View key={item.id} style={styles.requestModernCard}>
              <View style={styles.requestModernHeader}>
                <Text style={styles.requestModernTitle}>{item.title}</Text>
                <View style={[styles.requestModernBadge, { backgroundColor: getStatusColor(item.status) }]}> 
                  <Text style={styles.requestModernBadgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.requestModernDate}>{item.date}</Text>
              <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>Type: {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'General'}</Text>
              <Text style={styles.requestModernDescription}>{item.description}</Text>
              <View style={styles.requestActionButtons}>
                {user?.role === 'admin' && (
                  <TouchableOpacity 
                    style={[styles.requestStatusButton, { backgroundColor: item.status === 'Pending' ? '#4CAF50' : '#FF9800' }]} 
                    onPress={() => handleUpdateStatus(item.id, item.status)}
                  >
                    <Ionicons 
                      name={item.status === 'Pending' ? 'checkmark-circle-outline' : 'time-outline'} 
                      size={16} 
                      color="#fff" 
                    />
                    <Text style={styles.requestStatusButtonText}>
                      {item.status === 'Pending' ? 'Mark Resolved' : 'Mark Pending'}
                    </Text>
                  </TouchableOpacity>
                )}
                {user?.role === 'admin' && (
                  <TouchableOpacity style={styles.requestDeleteButton} onPress={() => handleDeleteRequest(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No requests</Text>
              <Text style={styles.emptySubtitle}>Tap + to submit a request</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Add Request Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.registerModal}>
            <ScrollView contentContainerStyle={{padding: 24}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.gmailModalTitle}>New Request</Text>
              <View style={styles.gmailInputGroup}>
                <Text style={styles.gmailInputLabel}>Title</Text>
                <TextInput
                  style={styles.gmailInput}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  selectionColor="#1a73e8"
                  placeholder=""
                />
              </View>
              <View style={styles.gmailInputGroup}>
                <Text style={styles.gmailInputLabel}>Description</Text>
                <TextInput
                  style={[styles.gmailInput, { height: 60, textAlignVertical: 'top' }]}
                  value={newDescription}
                  onChangeText={setNewDescription}
                  multiline
                  numberOfLines={3}
                  selectionColor="#1a73e8"
                  placeholder=""
                />
              </View>
              <View style={styles.gmailInputGroup}>
                <Text style={styles.gmailInputLabel}>Type</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['general', 'maintenance', 'other'].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.filterChip, newType === t && styles.filterChipActive]}
                      onPress={() => setNewType(t)}
                    >
                      <Text style={[styles.filterChipText, newType === t && styles.filterChipTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={styles.gmailCreateButton} onPress={handleAddRequest}>
                <Text style={styles.gmailCreateButtonText}>Submit Request</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gmailSignInLink} onPress={() => {
                setShowAddModal(false);
                setNewTitle('');
                setNewDescription('');
                setNewType('general');
              }}>
                <Text style={styles.gmailSignInText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};



// Announcements Screen Component
const AnnouncementsScreen = ({ user }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [filter, setFilter] = useState('all');

  // Fetch announcements from Firestore
  useEffect(() => {
    const announcementsRef = collection(db, 'announcements');
    const q = query(announcementsRef, orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(data);
      setLoading(false);
    }, (error) => {
      Alert.alert('Error', 'Failed to load announcements');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtering by priority
  let filtered = announcements;
  if (filter !== 'all') {
    filtered = filtered.filter(a => a.priority === filter);
  }

  // Add new announcement
  const handleAddAnnouncement = async () => {
    if (!newTitle || !newContent) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const announcementData = {
        title: newTitle,
        content: newContent,
        date: new Date().toISOString().slice(0, 10),
        priority: newPriority,
      };

      await addDoc(collection(db, 'announcements'), announcementData);
      
  setShowAddModal(false);
  setNewTitle('');
  setNewContent('');
  setNewPriority('medium');
  // onSnapshot listener will pick up the new announcement; no need to fetch manually
  Alert.alert('Success', 'Announcement added!');
    } catch (error) {
      console.error('Error adding announcement:', error);
      Alert.alert('Error', 'Failed to add announcement');
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id) => {
    try {
  await deleteDoc(doc(db, 'announcements', id));
  // onSnapshot listener updates announcements automatically
  Alert.alert('Deleted', 'Announcement deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete announcement');
    }
  };

  // Modern card UI
  const renderAnnouncement = ({ item }) => (
    <View style={styles.announcementModernCard}>
      <View style={styles.announcementModernHeader}>
        <Text style={styles.announcementModernTitle}>{item.title}</Text>
        <View style={[styles.announcementModernBadge, { backgroundColor: getPriorityColor(item.priority) }]}> 
          <Text style={styles.announcementModernBadgeText}>{item.priority?.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.announcementModernDate}>{item.date}</Text>
      <Text style={styles.announcementModernContent}>{item.content}</Text>
      {/* Show priority color-coded */}
      <Text style={{ color: getPriorityColor(item.priority), fontWeight: 'bold', marginTop: 4 }}>
        Priority: {item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : 'Medium'}
      </Text>
      {user?.role === 'admin' && (
        <TouchableOpacity style={styles.announcementDeleteButton} onPress={() => handleDeleteAnnouncement(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  function getPriorityColor(priority) {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'android' ? 50 : 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.announcementsModernHeader}>
          <View className="headerContent">
            <Text style={styles.announcementsModernTitle}>Announcements</Text>
            <Text style={styles.announcementsModernSubtitle}>{filtered.length} announcements</Text>
          </View>
          {user?.role === 'admin' && (
            <TouchableOpacity style={styles.announcementsAddButton} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity style={[styles.filterChip, filter === 'all' && styles.filterChipActive]} onPress={() => setFilter('all')}>
              <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, filter === 'high' && styles.filterChipActive]} onPress={() => setFilter('high')}>
              <Text style={[styles.filterChipText, filter === 'high' && styles.filterChipTextActive]}>High</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, filter === 'medium' && styles.filterChipActive]} onPress={() => setFilter('medium')}>
              <Text style={[styles.filterChipText, filter === 'medium' && styles.filterChipTextActive]}>Medium</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, filter === 'low' && styles.filterChipActive]} onPress={() => setFilter('low')}>
              <Text style={[styles.filterChipText, filter === 'low' && styles.filterChipTextActive]}>Low</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <View style={{ padding: 20 }}>
          {filtered.map(item => (
            <View key={item.id} style={styles.announcementModernCard}>
              <View style={styles.announcementModernHeader}>
                <Text style={styles.announcementModernTitle}>{item.title}</Text>
                <View style={[styles.announcementModernBadge, { backgroundColor: getPriorityColor(item.priority) }]}> 
                  <Text style={styles.announcementModernBadgeText}>{item.priority?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.announcementModernDate}>{item.date}</Text>
              <Text style={styles.announcementModernContent}>{item.content}</Text>
              <Text style={{ color: getPriorityColor(item.priority), fontWeight: 'bold', marginTop: 4 }}>
                Priority: {item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : 'Medium'}
              </Text>
              {user?.role === 'admin' && (
                <TouchableOpacity style={styles.announcementDeleteButton} onPress={() => handleDeleteAnnouncement(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No announcements</Text>
              <Text style={styles.emptySubtitle}>Tap + to add a new announcement</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Add Announcement Modal (admin only) */}
      {user?.role === 'admin' && (
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.registerModal}>
              <ScrollView contentContainerStyle={{padding: 24}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.gmailModalTitle}>Add Announcement</Text>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Title</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    selectionColor="#1a73e8"
                    placeholder=""
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Content</Text>
                  <TextInput
                    style={[styles.gmailInput, { height: 80, textAlignVertical: 'top' }]}
                    value={newContent}
                    onChangeText={setNewContent}
                    multiline
                    numberOfLines={4}
                    selectionColor="#1a73e8"
                    placeholder=""
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Priority</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['high', 'medium', 'low'].map(p => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.filterChip, newPriority === p && styles.filterChipActive]}
                        onPress={() => setNewPriority(p)}
                      >
                        <Text style={[styles.filterChipText, newPriority === p && styles.filterChipTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity style={styles.gmailCreateButton} onPress={handleAddAnnouncement}>
                  <Text style={styles.gmailCreateButtonText}>Add Announcement</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gmailSignInLink} onPress={() => {
                  setShowAddModal(false);
                  setNewTitle('');
                  setNewContent('');
                  setNewPriority('medium');
                }}>
                  <Text style={styles.gmailSignInText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// Add modern styles for announcements


const MembersScreen = ({ user }) => {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  // In MembersScreen, add state for add member modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberFirstName, setNewMemberFirstName] = useState('');
  const [newMemberLastName, setNewMemberLastName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberHomeNumber, setNewMemberHomeNumber] = useState('');
  const [newMemberPhoneNumber, setNewMemberPhoneNumber] = useState('');
  const [newMemberAddress, setNewMemberAddress] = useState('');

  const filtered = members.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) ||
                         member.homeNumber.toLowerCase().includes(search.toLowerCase()) ||
                         member.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || member.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    setLoading(true);
    const membersRef = collection(db, 'members');
    const q = query(membersRef, orderBy('lastName'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log('Members snapshot received:', querySnapshot.docs.length, 'members');
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Setting members:', membersData.length);
      setMembers(membersData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to members:', error);
      Alert.alert('Error', 'Failed to load members: ' + error.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addMember = async (memberData) => {
    try {
      const membersRef = collection(db, 'members');
      await addDoc(membersRef, {
        ...memberData,
        createdAt: new Date(),
        status: 'active'
      });
      Alert.alert('Success', 'Member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const updateMember = async (memberId, updates) => {
    try {
      const memberRef = doc(db, 'members', memberId);
      await updateDoc(memberRef, updates);
      Alert.alert('Success', 'Member updated successfully!');
    } catch (error) {
      console.error('Error updating member:', error);
      if (error.message.includes('No document to update')) {
        Alert.alert('Error', 'Member no longer exists. Please refresh the list.');
        // Force refresh the members list
        const membersRef = collection(db, 'members');
        const q = query(membersRef, orderBy('lastName'));
        const querySnapshot = await getDocs(q);
        const membersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMembers(membersData);
      } else {
        Alert.alert('Error', 'Failed to update member: ' + error.message);
      }
    }
  };

  const deleteMember = async (memberId) => {
    try {
      const memberRef = doc(db, 'members', memberId);
      await deleteDoc(memberRef);
      Alert.alert('Success', 'Member deleted successfully!');
    } catch (error) {
      console.error('Error deleting member:', error);
      Alert.alert('Error', 'Failed to delete member');
    }
  };

  const refreshMembers = async () => {
    try {
      setLoading(true);
      const membersRef = collection(db, 'members');
      const q = query(membersRef, orderBy('lastName'));
      const querySnapshot = await getDocs(q);
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersData);
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing members:', error);
      Alert.alert('Error', 'Failed to refresh members');
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to delete ${memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'members', memberId));
              Alert.alert('Success', 'Member deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete member: ' + error.message);
            }
          }
        }
      ]
    );
  };

  // Remove this useEffect since we're using onSnapshot now

  const getStatusColor = (status) => {
    return status === 'active' ? '#4CAF50' : '#FF9800';
  };



  const renderMember = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Text style={styles.avatarText}>{item.avatar || '👤'}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{`${item.firstName} ${item.lastName}`}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
        <View style={styles.memberMeta}>
          <View style={styles.homeNumberContainer}>
            <Ionicons name="home-outline" size={14} color="#666" />
            <Text style={styles.homeNumber}>{item.homeNumber}</Text>
          </View>
        </View>
        {/* Show address if available */}
        {item.address && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="location-outline" size={16} color="#888" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, color: '#333' }}>{item.address}</Text>
          </View>
        )}
        {/* Admin-only: show pending address with Accept/Reject if present */}
        {user?.role === 'admin' && item.pendingAddress && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Ionicons name="time-outline" size={16} color="#FFA726" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, color: '#FFA726', flex: 1 }}>Pending address: {item.pendingAddress}</Text>
            <TouchableOpacity onPress={async () => {
              // Accept: update address and clear pendingAddress
              const docRef = doc(db, 'members', item.id);
              await updateDoc(docRef, { address: item.pendingAddress, pendingAddress: '' });
            }} style={{ marginLeft: 8 }}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              // Reject: clear pendingAddress
              const docRef = doc(db, 'members', item.id);
              await updateDoc(docRef, { pendingAddress: '' });
            }} style={{ marginLeft: 8 }}>
              <Ionicons name="close-circle-outline" size={20} color="#FF5252" />
            </TouchableOpacity>
          </View>
        )}
        {/* Admin-only activate/deactivate button */}
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={[styles.memberStatusButton, { backgroundColor: item.status === 'active' ? '#FF9800' : '#4CAF50' }]}
            onPress={() => updateMember(item.id, { status: item.status === 'active' ? 'inactive' : 'active' })}
          >
            <Text style={styles.memberStatusButtonText}>{item.status === 'active' ? 'Set Inactive' : 'Set Active'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="mail-outline" size={20} color="#fff" />
        </TouchableOpacity>
        
        {/* Status badge positioned between email and delete */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}> 
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        
        {/* Admin-only delete button */}
        {user?.role === 'admin' && (
          <TouchableOpacity 
            style={styles.memberDeleteButton}
            onPress={() => handleDeleteMember(item.id, `${item.firstName} ${item.lastName}`)}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Add function to handle adding new member
  const handleAddMember = async () => {
    if (!newMemberFirstName || !newMemberLastName || !newMemberEmail || !newMemberHomeNumber) {
      Alert.alert('Error', 'Please fill in all required fields (First Name, Last Name, Email, Home Number)');
      return;
    }
    
    try {
      await addDoc(collection(db, 'members'), {
        firstName: newMemberFirstName,
        lastName: newMemberLastName,
        email: newMemberEmail,
        homeNumber: newMemberHomeNumber,
        phoneNumber: newMemberPhoneNumber || '',
        address: newMemberAddress || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        role: 'user'
      });
      
      setShowAddMemberModal(false);
      setNewMemberFirstName('');
      setNewMemberLastName('');
      setNewMemberEmail('');
      setNewMemberHomeNumber('');
      setNewMemberPhoneNumber('');
      setNewMemberAddress('');
      
      Alert.alert('Success', 'Member added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add member: ' + error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'android' ? 50 : 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.membersHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.membersTitle}>Community Members</Text>
            <Text style={styles.membersSubtitle}>{filtered.length} members found</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              style={[styles.addMemberButton, { backgroundColor: '#666', width: 50, height: 50 }]} 
              onPress={refreshMembers}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addMemberButton} 
              onPress={() => setShowAddMemberModal(true)}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, selectedFilter === 'active' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('active')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'active' && styles.filterChipTextActive]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, selectedFilter === 'inactive' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('inactive')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'inactive' && styles.filterChipTextActive]}>Inactive</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={{ padding: 20 }}>
          {filtered.map(item => (
            <View key={item.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.avatarText}>{item.avatar || '👤'}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{`${item.firstName} ${item.lastName}`}</Text>
                <Text style={styles.memberEmail}>{item.email}</Text>
                <View style={styles.memberMeta}>
                  <View style={styles.homeNumberContainer}>
                    <Ionicons name="home-outline" size={14} color="#666" />
                    <Text style={styles.homeNumber}>{item.homeNumber}</Text>
                  </View>
                </View>
                {item.address && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="location-outline" size={16} color="#888" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 14, color: '#333' }}>{item.address}</Text>
                  </View>
                )}
                {user?.role === 'admin' && item.pendingAddress && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                    <Ionicons name="time-outline" size={16} color="#FFA726" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 14, color: '#FFA726', flex: 1 }}>Pending address: {item.pendingAddress}</Text>
                    <TouchableOpacity onPress={async () => {
                      const docRef = doc(db, 'members', item.id);
                      await updateDoc(docRef, { address: item.pendingAddress, pendingAddress: '' });
                    }} style={{ marginLeft: 8 }}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => {
                      const docRef = doc(db, 'members', item.id);
                      await updateDoc(docRef, { pendingAddress: '' });
                    }} style={{ marginLeft: 8 }}>
                      <Ionicons name="close-circle-outline" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                )}
                {user?.role === 'admin' && (
                  <TouchableOpacity
                    style={[styles.memberStatusButton, { backgroundColor: item.status === 'active' ? '#FF9800' : '#4CAF50' }]}
                    onPress={() => updateMember(item.id, { status: item.status === 'active' ? 'inactive' : 'active' })}
                  >
                    <Text style={styles.memberStatusButtonText}>{item.status === 'active' ? 'Set Inactive' : 'Set Active'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="mail-outline" size={20} color="#fff" />
                </TouchableOpacity>
                
                {/* Status badge positioned between email and delete */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}> 
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                
                {user?.role === 'admin' && (
                  <TouchableOpacity 
                    style={styles.memberDeleteButton}
                    onPress={() => handleDeleteMember(item.id, `${item.firstName} ${item.lastName}`)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Add Member Modal (admin only) */}
      {user?.role === 'admin' && (
        <Modal visible={showAddMemberModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.registerModal}>
              <ScrollView contentContainerStyle={{padding: 24}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.gmailModalTitle}>Add New Member</Text>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>First Name *</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={newMemberFirstName}
                    onChangeText={setNewMemberFirstName}
                    placeholder="Enter first name"
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={newMemberLastName}
                    onChangeText={setNewMemberLastName}
                    placeholder="Enter last name"
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Email *</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={newMemberEmail}
                    onChangeText={setNewMemberEmail}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Home Number *</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={newMemberHomeNumber}
                    onChangeText={setNewMemberHomeNumber}
                    placeholder="Enter home number"
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.gmailInput}
                    value={newMemberPhoneNumber}
                    onChangeText={setNewMemberPhoneNumber}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.gmailInputGroup}>
                  <Text style={styles.gmailInputLabel}>Address</Text>
                  <TextInput
                    style={[styles.gmailInput, { height: 60, textAlignVertical: 'top' }]}
                    value={newMemberAddress}
                    onChangeText={setNewMemberAddress}
                    placeholder="Enter address"
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <TouchableOpacity style={styles.gmailCreateButton} onPress={handleAddMember}>
                  <Text style={styles.gmailCreateButtonText}>Add Member</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gmailSignInLink} onPress={() => {
                  setShowAddMemberModal(false);
                  setNewMemberFirstName('');
                  setNewMemberLastName('');
                  setNewMemberEmail('');
                  setNewMemberHomeNumber('');
                  setNewMemberPhoneNumber('');
                  setNewMemberAddress('');
                }}>
                  <Text style={styles.gmailSignInText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// Profile Screen Component
const ProfileScreen = ({ navigation, user }) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [helpDropdownOpen, setHelpDropdownOpen] = useState(false);
  // In ProfileScreen, add state for editing address
  const [editingAddress, setEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState(user.address || '');
  const [pendingAddress, setPendingAddress] = useState(user.pendingAddress || '');
  const [aboutVisible, setAboutVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Logout Error', error.message);
    }
  };

  // Function to submit address change for approval
  const submitAddressChange = async () => {
    try {
      // Save pendingAddress to Firestore
      const membersRef = collection(db, 'members');
      const q = query(membersRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { pendingAddress: newAddress });
        setPendingAddress(newAddress);
        setEditingAddress(false);
        Alert.alert('Submitted', 'Your address change is pending admin approval.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="person-circle-outline" size={80} color="#bbb" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 20, color: '#888', marginBottom: 8 }}>No user data</Text>
          <Text style={{ fontSize: 16, color: '#aaa', marginBottom: 24 }}>Please log in again if needed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f2f5' }}> 
      <StatusBar barStyle="dark-content" backgroundColor="#f0f2f5" />
      <ScrollView 
        contentContainerStyle={{ 
          alignItems: 'center', 
          padding: 20, 
          paddingBottom: 40,
          paddingTop: Platform.OS === 'android' ? 50 : 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={{
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: 18,
          alignItems: 'center',
          paddingVertical: 32,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <Ionicons name="person-circle" size={80} color="#2196F3" style={{ marginBottom: 10 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 4 }}>
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User'}
          </Text>
          <Text style={{ fontSize: 16, color: '#666', marginBottom: 2 }}>{user?.email}</Text>
        </View>

        {/* User Info Dropdown Card */}
        <View style={{
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: 16,
          marginBottom: 18,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}
            onPress={() => setUserDropdownOpen(open => !open)}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={26} color="#2196F3" style={{ marginRight: 14 }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#222', flex: 1 }}>Account Info</Text>
            <Ionicons
              name={userDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={26}
              color="#2196F3"
            />
          </TouchableOpacity>
          {userDropdownOpen && (
            <View style={{ borderTopWidth: 1, borderTopColor: '#f0f0f0', padding: 18, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="mail-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 16, color: '#333' }}>Email: <Text style={{ color: '#555' }}>{user.email}</Text></Text>
              </View>
              {user.role && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="person-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 16, color: '#333' }}>Role: <Text style={{ color: '#555' }}>{user.role}</Text></Text>
                </View>
              )}
              {user.phoneNumber && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="call-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 16, color: '#333' }}>Mobile: <Text style={{ color: '#555' }}>{user.phoneNumber}</Text></Text>
                </View>
              )}
              {user.homeNumber && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="home-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 16, color: '#333' }}>Home: <Text style={{ color: '#555' }}>{user.homeNumber}</Text></Text>
                </View>
              )}
              {user.address && !editingAddress && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="location-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 16, color: '#333', flex: 1 }}>Address: <Text style={{ color: '#555' }}>{user.address}</Text></Text>
                  <TouchableOpacity onPress={() => { setEditingAddress(true); setNewAddress(user.address || ''); }}>
                    <Ionicons name="pencil-outline" size={18} color="#2196F3" />
                  </TouchableOpacity>
                </View>
              )}
              {editingAddress && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="location-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, color: '#333', borderBottomWidth: 1, borderBottomColor: '#2196F3', marginRight: 8 }}
                    value={newAddress}
                    onChangeText={setNewAddress}
                    placeholder="Enter new address"
                    multiline
                  />
                  <TouchableOpacity onPress={submitAddressChange} style={{ marginRight: 8 }}>
                    <Ionicons name="checkmark-outline" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingAddress(false)}>
                    <Ionicons name="close-outline" size={20} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              )}
              {pendingAddress && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="time-outline" size={20} color="#FFA726" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 16, color: '#FFA726' }}>Pending approval: <Text style={{ color: '#555' }}>{pendingAddress}</Text></Text>
                </View>
              )}
              {/* Add more user info here if needed */}
            </View>
          )}
        </View>



        {/* Help & Support Dropdown Card */}
        <View style={{
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: 16,
          marginBottom: 18,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}
            onPress={() => setHelpDropdownOpen(open => !open)}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle-outline" size={26} color="#4CAF50" style={{ marginRight: 14 }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#222', flex: 1 }}>Help & Support</Text>
            <Ionicons
              name={helpDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={26}
              color="#4CAF50"
            />
          </TouchableOpacity>
          {helpDropdownOpen && (
            <View style={{ borderTopWidth: 1, borderTopColor: '#f0f0f0', padding: 8 }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10 }} onPress={() => Alert.alert('Help Center', 'Help Center coming soon!')}>
                <Ionicons name="help-buoy-outline" size={22} color="#2196F3" style={{ marginRight: 14 }} />
                <Text style={{ fontSize: 16, color: '#222' }}>Help Center</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10 }} onPress={() => Alert.alert('Report Center', 'Report Center coming soon!')}>
                <Ionicons name="alert-circle-outline" size={22} color="#FF9800" style={{ marginRight: 14 }} />
                <Text style={{ fontSize: 16, color: '#222' }}>Report Center</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10 }} onPress={() => setAboutVisible(true)}>
                <Ionicons name="information-circle-outline" size={22} color="#4CAF50" style={{ marginRight: 14 }} />
                <Text style={{ fontSize: 16, color: '#222' }}>About Us</Text>
              </TouchableOpacity>

            </View>
          )}
        </View>

        {/* About Us Modal */}
        <Modal visible={aboutVisible} animationType="slide" transparent onRequestClose={() => setAboutVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 560, backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 8 }}>About Us</Text>
              <Text style={{ fontSize: 14, color: '#555', marginBottom: 16 }}>Meet the developers who built Blessed Sapphire.</Text>
              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {/* Developer 1 */}
                <View style={{ alignItems: 'center', width: '48%', marginBottom: 18 }}>
                  <Image source={require('./assets/dev-oguri.png')} style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#222' }}>Ry Torilla</Text>
                  <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 6 }}>Full Stack Developer</Text>
                </View>
                {/* Developer 2 */}
                <View style={{ alignItems: 'center', width: '48%', marginBottom: 18 }}>
                  <Image source={require('./assets/dev-clifford.jpg')} style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#222' }}>Clifford Alon</Text>
                  <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 6 }}>Project Manager</Text>
                </View>
                {/* Developer 3 */}
                <View style={{ alignItems: 'center', width: '48%', marginBottom: 18 }}>
                  <Image source={require('./assets/dev-antigo.jpg')} style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#222' }}>John Lois Antigo</Text>
                  <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 6 }}>QA Engineer/Tester</Text>
                </View>
                {/* Developer 4 */}
                <View style={{ alignItems: 'center', width: '48%', marginBottom: 18 }}>
                  <Image source={require('./assets/dev-jern.jpg')} style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#222' }}>Jernalyn Samosa</Text>
                  <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 6 }}>System Analyst</Text>
                </View>
              </ScrollView>
              <TouchableOpacity onPress={() => setAboutVisible(false)} style={{ marginTop: 6, alignSelf: 'center', backgroundColor: '#1a73e8', paddingVertical: 10, paddingHorizontal: 22, borderRadius: 10 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Log Out Card Button */}
        <TouchableOpacity
          style={{
            width: '100%',
            backgroundColor: '#fff',
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
            marginTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="log-out-outline" size={24} color="#FF5252" style={{ marginRight: 12 }} />
            <Text style={{ color: '#FF5252', fontWeight: 'bold', fontSize: 18 }}>Log Out</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Main Tab Navigator
// Main Tab Navigator (no animation)


const MainTabs = ({ route }) => {
  const user = route?.params?.user;
  // 1. In MainTabs, fetch events from Firestore and store in state
  const [dashboardEvents, setDashboardEvents] = useState([]);
  
  const fetchDashboardEvents = async () => {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDashboardEvents(data);
    } catch (error) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    fetchDashboardEvents();
  }, []);



  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Requests') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Announcements') {
            iconName = focused ? 'megaphone' : 'megaphone-outline';
          } else if (route.name === 'Members') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        // Enable animation for tab transitions
        animationEnabled: true,
      })}
      sceneContainerStyle={{ backgroundColor: '#f5f5f5' }}
      // Use the default tabBar
      // tabBar={props => <AnimatedTabBar {...props} />}
    >
      <Tab.Screen name="Dashboard">
        {props => <TabSlideWrapper index={0} {...props}><DashboardScreen {...props} events={dashboardEvents} user={user} /></TabSlideWrapper>}
      </Tab.Screen>
      <Tab.Screen name="Events">
        {props => <TabSlideWrapper index={1} {...props}><EventsScreen {...props} user={user} /></TabSlideWrapper>}
      </Tab.Screen>
      <Tab.Screen name="Requests">
        {props => <TabSlideWrapper index={2} {...props}><RequestsScreen {...props} user={user} /></TabSlideWrapper>}
      </Tab.Screen>
      <Tab.Screen name="Announcements">
        {props => <TabSlideWrapper index={3} {...props}><AnnouncementsScreen {...props} user={user} /></TabSlideWrapper>}
      </Tab.Screen>
      <Tab.Screen name="Members">
        {props => <TabSlideWrapper index={4} {...props}><MembersScreen {...props} user={user} /></TabSlideWrapper>}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {props => <TabSlideWrapper index={5} {...props}><ProfileScreen {...props} user={user} /></TabSlideWrapper>}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

// Simple wrapper for tab screens (no animation)
const TabSlideWrapper = ({ children }) => children;

// Use the default tab bar directly (remove AnimatedTabBar indirection to fix error)


// Main App Component
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}  
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          options={{ headerShown: false, gestureEnabled: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  gmailModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  gmailInputGroup: {
    width: '100%',
    marginBottom: 18,
  },
  gmailInputLabel: {
    fontSize: 15,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  gmailInput: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#1B365D',
    fontSize: 16,
    color: '#222',
    paddingVertical: 10,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  gmailCreateButton: {
    backgroundColor: '#1B365D',
    borderRadius: 6,
    paddingVertical: 14,
    width: '100%',
    marginTop: 10,
    marginBottom: 8,
    shadowColor: '#1B365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  gmailCreateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  gmailSignInLink: {
    marginTop: 10,
    alignSelf: 'center',
  },
  gmailSignInText: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1877f3',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 8,
    justifyContent: 'center',
  },
  facebookLogo: {
    width: 28,
    height: 28,
    marginRight: 10,
    borderRadius: 4,
    backgroundColor: '#1877f3',
  },
  facebookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  // Dashboard styles
  dashboardWelcomeCardModern: {
    backgroundColor: '#1B365D',
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#1B365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  dashboardWelcomeTitleModern: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  dashboardWelcomeSubtitleModern: {
    color: '#e0e0e0',
    fontSize: 15,
  },
  dashboardStatsRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  dashboardStatCardModern: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  dashboardStatNumberModern: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  dashboardStatLabelModern: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  dashboardSectionModern: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  dashboardSectionTitleModern: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 14,
    color: '#222',
  },
  dashboardIssueCardModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7fa',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  dashboardIssueDotModern: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 14,
  },
  dashboardIssueTitleModern: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  dashboardIssueMetaModern: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  dashboardActionsRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 16,
  },
  dashboardActionButtonModern: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 18,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  dashboardActionLabelModern: {
    color: '#D4AF37',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#1B365D',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  forgotPassword: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#D4AF37',
    fontSize: 14,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 8,
  },
  eventsList: {
    padding: 20,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetailText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  eventDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  requestsList: {
    padding: 20,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  requestDescription: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestDate: {
    color: '#999',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {
    color: '#666',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubmit: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  announcementsList: {
    padding: 20,
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  announcementDate: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  announcementContent: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flex: 1,
  },
  membersTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  membersSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addMemberButton: {
    backgroundColor: '#1B365D',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#1B365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterScroll: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginRight: 12,
  },
  filterChipActive: {
    backgroundColor: '#1B365D',
    borderColor: '#1B365D',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  membersList: {
    padding: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeNumber: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  contactButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Add modern styles for announcements
  announcementsModernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  announcementsModernTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  announcementsModernSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  announcementsAddButton: {
    backgroundColor: '#1B365D',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#1B365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  announcementsModernList: {
    padding: 20,
  },
  announcementModernCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    paddingRight: 60, // Space for delete button
  },
  announcementModernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 15, // Extra space for badge
  },
  announcementModernTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    marginRight: 12, // Space between title and badge
  },
  announcementModernBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    marginRight: 0,
    minWidth: 36, // Ensure badge has minimum width
    alignSelf: 'flex-start',
  },

  announcementModernBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  announcementDeleteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#f44336',
    borderRadius: 16,
    padding: 8,
    zIndex: 2,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementModernDate: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  announcementModernContent: {
    color: '#444',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  // Add modern styles for events
  eventsModernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  eventsModernTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  eventsModernSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  eventsAddButton: {
    backgroundColor: '#1B365D',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#1B365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  eventsModernList: {
    padding: 20,
  },
  eventModernCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    paddingRight: 60, // More space for delete button
  },
  eventModernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 15, // Extra space for badge
  },
  eventModernTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    marginRight: 12, // More space between title and badge
  },
  eventDeleteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#f44336',
    borderRadius: 16,
    padding: 8,
    zIndex: 2,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventModernBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80, // Ensure badge has minimum width
  },
  eventModernBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventModernDate: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  eventModernLocation: {
    color: '#666',
    fontSize: 13,
    marginBottom: 8,
  },
  eventModernDescription: {
    color: '#444',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  // Add modern styles for requests
  requestsModernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestsModernTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  requestsModernSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  requestsAddButton: {
    backgroundColor: '#1B365D',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#1B365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  requestsModernList: {
    padding: 20,
  },
  requestModernCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  requestModernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestModernTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
  requestModernBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  requestModernBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  requestModernDate: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  requestModernDescription: {
    color: '#444',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  requestDeleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 16,
    padding: 8,
    marginLeft: 8,
  },
  requestActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
  },
  requestStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestStatusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  memberDeleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 8,
    marginTop: 4,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberStatusButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  memberStatusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  gmailInputModern: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    fontSize: 16,
    color: '#222',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 6,
    marginBottom: 8,
  },
});