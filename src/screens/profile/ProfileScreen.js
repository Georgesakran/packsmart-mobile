import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import useAuth from "../../hooks/useAuth";

export default function ProfileScreen() {
  const { logout } = useAuth();

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Your account and packing preferences will appear here
        </Text>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
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
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});