import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/config/constants';
const ResetPasswordScreen: React.FC = () => <View style={styles.container}><Text>Reset Password Screen</Text></View>;
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background } });
export default ResetPasswordScreen;
