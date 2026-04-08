import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import StatusBadge from "../../components/common/StatusBadge";
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getPackingTemplateById } from "../../api/tripApi";

export default function TemplateDetailsScreen({ route, navigation }) {
  const { templateId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPackingTemplateById(templateId);

        const normalizedTemplate = data?.template || data || null;
        const normalizedItems = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.templateItems)
          ? data.templateItems
          : Array.isArray(data?.template?.items)
          ? data.template.items
          : [];

        setTemplate(normalizedTemplate);
        setItems(normalizedItems);
      } catch (err) {
        console.error("Load template details error:", err);
        setError(
          err?.response?.data?.message || "Failed to load template details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  const formattedCreatedAt = useMemo(() => {
    const rawDate = template?.created_at || template?.createdAt;
    if (!rawDate) return "—";

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return rawDate;

    return date.toLocaleDateString();
  }, [template]);

  const getItemName = (item) => {
    return (
      item.custom_name ||
      item.customName ||
      item.base_item_name ||
      item.name ||
      `Item #${item.item_id || item.itemId || item.id}`
    );
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading template details...</Text>
        </View>
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen>
        <View style={styles.container}>
          <AppCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </AppCard>
        </View>
      </AppScreen>
    );
  }

  if (!template) {
    return (
      <AppScreen>
        <View style={styles.container}>
          <EmptyState
            title="Template not found"
            description="This template could not be loaded."
          />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Templates / Details</Text>
          <Text style={styles.title}>
            {template.name || "Unnamed Template"}
          </Text>
          <Text style={styles.subtitle}>
            Review the saved template details and item setup.
          </Text>

          <AppCard style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroLabel}>Template Summary</Text>
                <Text style={styles.heroValue}>
                  {items.length} saved item{items.length === 1 ? "" : "s"}
                </Text>
              </View>

              <StatusBadge label={`${items.length} items`} tone="info" />
            </View>

            <Text style={styles.heroSubtext}>
              {template.notes ||
                template.description ||
                "No description available for this template."}
            </Text>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Template Metadata"
              subtitle="Basic information used to describe this template."
            />

            <View style={styles.metaGroup}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Travel Type: </Text>
                {template.travel_type || template.travelType || "Any"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Weather Type: </Text>
                {template.weather_type || template.weatherType || "Any"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Traveler Count: </Text>
                {template.traveler_count || template.travelerCount || 1}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Created: </Text>
                {formattedCreatedAt}
              </Text>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Template Actions"
              subtitle="Manage or update this template."
            />

          <View style={styles.actionsColumn}>
            <AppButton
              title="Apply to Trip"
              onPress={() =>
                navigation.navigate("ApplyTemplateToTrip", {
                  templateId: template.id,
                  templateName: template.name,
                })
              }
            />

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

          <AppCard>
            <SectionHeader
              title="Item Preview"
              subtitle="All items currently saved inside this template."
            />

            {items.length === 0 ? (
              <EmptyState
                title="No items in this template"
                description="This template does not contain any saved items."
              />
            ) : (
              items.map((item) => (
                <AppCard key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemTitle}>
                        {getItemName(item)} × {item.quantity || 1}
                      </Text>
                      <Text style={styles.itemSubtitle}>
                        Category: {item.category || "custom"}
                      </Text>
                    </View>

                    <StatusBadge
                      label={item.source_type || item.sourceType || "custom"}
                      tone={
                        (item.source_type || item.sourceType) === "database"
                          ? "success"
                          : "neutral"
                      }
                    />
                  </View>

                  <View style={styles.itemMetaGroup}>
                    <Text style={styles.itemMetaText}>
                      <Text style={styles.itemMetaLabel}>Size: </Text>
                      {item.size_code || item.sizeCode || "Not set"}
                    </Text>

                    <Text style={styles.itemMetaText}>
                      <Text style={styles.itemMetaLabel}>Audience: </Text>
                      {item.audience || "unisex"}
                    </Text>

                    <Text style={styles.itemMetaText}>
                      <Text style={styles.itemMetaLabel}>Pack Behavior: </Text>
                      {item.pack_behavior || item.packBehavior || "Not set"}
                    </Text>

                    <Text style={styles.itemMetaText}>
                      <Text style={styles.itemMetaLabel}>Base Volume: </Text>
                      {item.base_volume_cm3 || item.baseVolumeCm3 || 0} cm³
                    </Text>

                    <Text style={styles.itemMetaText}>
                      <Text style={styles.itemMetaLabel}>Base Weight: </Text>
                      {item.base_weight_g || item.baseWeightG || 0} g
                    </Text>
                  </View>
                </AppCard>
              ))
            )}
          </AppCard>
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
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  heroCard: {
    borderRadius: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  heroSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  metaGroup: {
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  actionsColumn: {
    gap: spacing.sm,
  },
  itemCard: {
    backgroundColor: "#f8fafc",
    marginTop: spacing.sm,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  itemSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  itemMetaGroup: {
    gap: 8,
  },
  itemMetaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  itemMetaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
});