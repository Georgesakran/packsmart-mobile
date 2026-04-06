import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import colors from "../../theme/colors";

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.text : "#fff"} />
      ) : (
        <Text
          style={[
            styles.baseText,
            variant === "primary" && styles.primaryText,
            variant === "secondary" && styles.secondaryText,
            variant === "danger" && styles.dangerText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: "#e2e8f0",
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.7,
  },
  baseText: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: colors.text,
  },
  dangerText: {
    color: "#fff",
  },
});