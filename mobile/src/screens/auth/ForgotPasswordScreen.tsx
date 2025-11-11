import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/config/constants';
const ForgotPasswordScreen: React.FC = () => <View style={styles.container}><Text>Forgot Password Screen</Text></View>;
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background } });
export default ForgotPasswordScreen;
