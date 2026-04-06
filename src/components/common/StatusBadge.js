import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function StatusBadge({ label, tone = "neutral" }) {
  return (
    <View
      style={[
        styles.badge,
        tone === "success" && styles.successBg,
        tone === "danger" && styles.dangerBg,
        tone === "warning" && styles.warningBg,
        tone === "info" && styles.infoBg,
        tone === "neutral" && styles.neutralBg,
      ]}
    >
      <Text
        style={[
          styles.text,
          tone === "success" && styles.successText,
          tone === "danger" && styles.dangerText,
          tone === "warning" && styles.warningText,
          tone === "info" && styles.infoText,
          tone === "neutral" && styles.neutralText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
  successBg: { backgroundColor: "#dcfce7" },
  successText: { color: "#166534" },

  dangerBg: { backgroundColor: "#fee2e2" },
  dangerText: { color: "#b91c1c" },

  warningBg: { backgroundColor: "#fef3c7" },
  warningText: { color: "#92400e" },

  infoBg: { backgroundColor: "#dbeafe" },
  infoText: { color: "#1d4ed8" },

  neutralBg: { backgroundColor: "#e5e7eb" },
  neutralText: { color: "#374151" },
});