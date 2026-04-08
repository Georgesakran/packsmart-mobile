import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import StatusBadge from "../../components/common/StatusBadge";
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getPackingTemplates } from "../../api/tripApi";

export default function TemplatesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState("");

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPackingTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load templates error:", err);
      setError(err?.response?.data?.message || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadTemplates();
    });

    return unsubscribe;
  }, [navigation, loadTemplates]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading templates...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Templates</Text>
          <Text style={styles.title}>Packing Templates</Text>
          <Text style={styles.subtitle}>
            Create reusable packing setups and manage them from mobile.
          </Text>

          <View style={styles.topActionsRow}>
            <AppButton
              title="Create Template"
              onPress={() => navigation.navigate("CreateTemplate")}
              style={styles.flexButton}
            />
            <AppButton
              title="Refresh"
              variant="secondary"
              onPress={loadTemplates}
              style={styles.flexButton}
            />
          </View>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Templates Summary"
              subtitle="A quick view of all saved reusable packing templates."
            />

            <View style={styles.summaryGrid}>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Total Templates</Text>
                <Text style={styles.summaryMiniValue}>{templates.length}</Text>
              </View>
            </View>
          </AppCard>

          {templates.length === 0 ? (
            <EmptyState
              title="No templates yet"
              description="Create your first packing template to reuse it across trips."
            />
          ) : (
            templates.map((template) => (
              <AppCard key={template.id}>
                <View style={styles.templateTopRow}>
                  <View style={styles.templateTextWrap}>
                    <Text style={styles.templateTitle}>
                      {template.name || "Unnamed Template"}
                    </Text>
                    <Text style={styles.templateSubtitle}>
                      {template.description || "No description"}
                    </Text>
                  </View>

                  <StatusBadge
                    label={`${template.item_count || template.itemsCount || 0} items`}
                    tone="info"
                  />
                </View>

                <View style={styles.metaGroup}>
                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Travel Type: </Text>
                    {template.travel_type || template.travelType || "Any"}
                  </Text>
                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Weather: </Text>
                    {template.weather_type || template.weatherType || "Any"}
                  </Text>
                </View>

                <View style={styles.actionColumn}>
                  <AppButton
                    title="Edit Template"
                    variant="secondary"
                    onPress={() =>
                      navigation.navigate("EditTemplate", {
                        templateId: template.id,
                      })
                    }
                  />
                </View>
              </AppCard>
            ))
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  helperText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 15,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  topActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryMiniCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  summaryMiniLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryMiniValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  templateTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  templateTextWrap: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  templateSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  metaGroup: {
    gap: 8,
    marginBottom: spacing.lg,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  actionColumn: {
    gap: spacing.sm,
  },
});