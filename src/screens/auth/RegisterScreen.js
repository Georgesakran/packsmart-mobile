import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import useAuth from "../../hooks/useAuth";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      await register({ fullName, email, password });

      setSuccessMessage("Account created successfully. You can now login.");
    } catch (err) {
      console.error("Register error:", err);
      setError(
        err?.response?.data?.message || err.message || "Register failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start your PackSmart journey</Text>

        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={handleRegister} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Register</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: spacing.md,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  successText: {
    color: colors.success,
    marginBottom: spacing.sm,
  },
});