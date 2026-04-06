import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});