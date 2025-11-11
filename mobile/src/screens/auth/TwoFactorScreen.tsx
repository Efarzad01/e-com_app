import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/config/constants';
const TwoFactorScreen: React.FC = () => <View style={styles.container}><Text>Two Factor Authentication Screen</Text></View>;
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background } });
export default TwoFactorScreen;
