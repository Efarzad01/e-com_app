import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/authStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/config/constants';
import { showMessage } from 'react-native-flash-message';

const RegisterScreen: React.FC<any> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      showMessage({ message: 'Error', description: 'Please fill all fields', type: 'warning' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showMessage({ message: 'Error', description: 'Passwords do not match', type: 'danger' });
      return;
    }
    try {
      await register(formData);
      showMessage({ message: 'Success', description: 'Registration successful! Please check your email.', type: 'success' });
      navigation.navigate('Login');
    } catch (error) {
      showMessage({ message: 'Error', description: 'Registration failed', type: 'danger' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
        
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="First Name" value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })} />
          </View>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Last Name" value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })} />
          </View>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Email" value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })} keyboardType="email-address" />
          </View>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Password" value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })} secureTextEntry={!showPassword} />
          </View>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Confirm Password" value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })} secureTextEntry={!showPassword} />
          </View>
          
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerButtonText}>Register</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg },
  backButton: { marginBottom: SPACING.md },
  title: { fontSize: FONT_SIZES.heading, fontWeight: 'bold', marginBottom: SPACING.lg },
  form: { gap: SPACING.md },
  inputContainer: { backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  input: { fontSize: FONT_SIZES.md },
  registerButton: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: 'center', marginTop: SPACING.md },
  registerButtonText: { color: '#FFF', fontSize: FONT_SIZES.lg, fontWeight: '600' },
});

export default RegisterScreen;
