import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import colors from "../../theme/colors";

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary", // primary | secondary | danger
  size = "md", // sm | md | lg
  fullWidth = true,
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;

  const spinnerColor =
    variant === "secondary" ? colors.text : "#ffffff";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,

        size === "sm" && styles.sizeSm,
        size === "md" && styles.sizeMd,
        size === "lg" && styles.sizeLg,

        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,

        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,

        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.contentWrap}>
          <Text
            numberOfLines={1}
            style={[
              styles.baseText,

              size === "sm" && styles.textSm,
              size === "md" && styles.textMd,
              size === "lg" && styles.textLg,

              variant === "primary" && styles.primaryText,
              variant === "secondary" && styles.secondaryText,
              variant === "danger" && styles.dangerText,

              isDisabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  fullWidth: {
    width: "100%",
  },

  sizeSm: {
    minHeight: 40,
    paddingVertical: 10,
    borderRadius: 14,
  },

  sizeMd: {
    minHeight: 48,
    paddingVertical: 13,
    borderRadius: 16,
  },

  sizeLg: {
    minHeight: 56,
    paddingVertical: 16,
    borderRadius: 18,
  },

  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  secondary: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#dbe3ee",
  },

  danger: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },

  disabled: {
    opacity: 0.58,
  },

  contentWrap: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  baseText: {
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.1,
  },

  textSm: {
    fontSize: 13,
  },

  textMd: {
    fontSize: 15,
  },

  textLg: {
    fontSize: 16,
  },

  primaryText: {
    color: "#ffffff",
  },

  secondaryText: {
    color: colors.text,
  },

  dangerText: {
    color: "#ffffff",
  },

  disabledText: {
    opacity: 0.95,
  },
});