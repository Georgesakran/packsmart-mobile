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

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      setError("");

      await login({ email, password });
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.response?.data?.message || err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Login to continue using PackSmart</Text>

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

        <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Login</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>Don’t have an account? Register</Text>
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
});