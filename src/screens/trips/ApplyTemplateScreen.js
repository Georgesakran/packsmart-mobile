import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { applyTemplateToTrip, getPackingTemplates } from "../../api/tripApi";

export default function ApplyTemplateScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState("");
  const [submittingTemplateId, setSubmittingTemplateId] = useState(null);

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

  const handleApplyTemplate = async (templateId, replaceExistingItems = false) => {
    try {
      setSubmittingTemplateId(templateId);
      setError("");

      await applyTemplateToTrip(tripId, templateId, { replaceExistingItems });

      navigation.goBack();
    } catch (err) {
      console.error("Apply template error:", err);
      setError(err?.response?.data?.message || "Failed to apply template.");
    } finally {
      setSubmittingTemplateId(null);
    }
  };

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
          <Text style={styles.kicker}>Trip / Templates / Apply</Text>
          <Text style={styles.title}>Apply Template</Text>
          <Text style={styles.subtitle}>
            Choose a saved template and add its items to this trip.
          </Text>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {templates.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No templates found</Text>
              <Text style={styles.emptyText}>
                You do not have any saved templates yet.
              </Text>
            </View>
          ) : (
            templates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <Text style={styles.templateName}>
                  {template.name || "Unnamed Template"}
                </Text>

                <Text style={styles.templateMeta}>
                  Items: {template.item_count || template.itemsCount || "—"}
                </Text>

                {template.description ? (
                  <Text style={styles.templateDescription}>
                    {template.description}
                  </Text>
                ) : null}

                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.primaryButton}
                    disabled={submittingTemplateId === template.id}
                    onPress={() => handleApplyTemplate(template.id, false)}
                  >
                    {submittingTemplateId === template.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Apply</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.secondaryButton}
                    disabled={submittingTemplateId === template.id}
                    onPress={() => handleApplyTemplate(template.id, true)}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Replace Current Items
                    </Text>
                  </Pressable>
                </View>
              </View>
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
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  templateCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  templateName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  templateMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actionsRow: {
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});