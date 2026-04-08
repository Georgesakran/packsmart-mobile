import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { getPackingTemplates } from "../../api/tripApi";

function normalizeTemplate(t) {
  return {
    id: t.id,
    name: t.name || "Unnamed Template",
    notes: t.notes || t.description || "No description",
    travel_type: t.travel_type || t.travelType || "Any",
    weather_type: t.weather_type || t.weatherType || "Any",
    created_at: t.created_at || t.createdAt || null,
    itemCount:
      t.item_count ??
      t.items_count ??
      t.itemsCount ??
      (Array.isArray(t.items) ? t.items.length : 0),
  };
}

export default function TemplatesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPackingTemplates();
      const safeTemplates = Array.isArray(data) ? data.map(normalizeTemplate) : [];
      setTemplates(safeTemplates);
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
    const unsubscribe = navigation.addListener("focus", loadTemplates);
    return unsubscribe;
  }, [navigation, loadTemplates]);

  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter((template) => {
        const name = (template.name || "").toLowerCase();
        const notes = (template.notes || "").toLowerCase();
        const travelType = (template.travel_type || "").toLowerCase();
        const weatherType = (template.weather_type || "").toLowerCase();

        return (
          name.includes(q) ||
          notes.includes(q) ||
          travelType.includes(q) ||
          weatherType.includes(q)
        );
      });
    }

    if (filterBy === "with_items") {
      result = result.filter((template) => Number(template.itemCount || 0) > 0);
    } else if (filterBy === "empty") {
      result = result.filter((template) => Number(template.itemCount || 0) === 0);
    } else if (filterBy === "casual") {
      result = result.filter(
        (template) => (template.travel_type || "").toLowerCase() === "casual"
      );
    } else if (filterBy === "hot") {
      result = result.filter(
        (template) => (template.weather_type || "").toLowerCase() === "hot"
      );
    }

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "items_desc") {
        return Number(b.itemCount || 0) - Number(a.itemCount || 0);
      }
      return 0;
    });

    return result;
  }, [templates, searchTerm, sortBy, filterBy]);

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
            Search, sort, and manage your reusable packing templates.
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
              title="Search"
              subtitle="Find templates by name, notes, travel type, or weather."
            />

            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search templates..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Sort"
              subtitle="Choose how templates should be ordered."
            />

            <View style={styles.filtersRow}>
              <AppButton
                title="Newest"
                variant={sortBy === "newest" ? "primary" : "secondary"}
                onPress={() => setSortBy("newest")}
                style={styles.filterButton}
              />
              <AppButton
                title="Oldest"
                variant={sortBy === "oldest" ? "primary" : "secondary"}
                onPress={() => setSortBy("oldest")}
                style={styles.filterButton}
              />
              <AppButton
                title="A-Z"
                variant={sortBy === "name_asc" ? "primary" : "secondary"}
                onPress={() => setSortBy("name_asc")}
                style={styles.filterButton}
              />
              <AppButton
                title="Most Items"
                variant={sortBy === "items_desc" ? "primary" : "secondary"}
                onPress={() => setSortBy("items_desc")}
                style={styles.filterButton}
              />
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Filters"
              subtitle="Focus on the templates you want right now."
            />

            <View style={styles.filtersRow}>
              <AppButton
                title="All"
                variant={filterBy === "all" ? "primary" : "secondary"}
                onPress={() => setFilterBy("all")}
                style={styles.filterButton}
              />
              <AppButton
                title="With Items"
                variant={filterBy === "with_items" ? "primary" : "secondary"}
                onPress={() => setFilterBy("with_items")}
                style={styles.filterButton}
              />
              <AppButton
                title="Empty"
                variant={filterBy === "empty" ? "primary" : "secondary"}
                onPress={() => setFilterBy("empty")}
                style={styles.filterButton}
              />
              <AppButton
                title="Casual"
                variant={filterBy === "casual" ? "primary" : "secondary"}
                onPress={() => setFilterBy("casual")}
                style={styles.filterButton}
              />
              <AppButton
                title="Hot"
                variant={filterBy === "hot" ? "primary" : "secondary"}
                onPress={() => setFilterBy("hot")}
                style={styles.filterButton}
              />
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Templates List"
              subtitle={`${filteredTemplates.length} template${
                filteredTemplates.length === 1 ? "" : "s"
              } found.`}
            />

            {filteredTemplates.length === 0 ? (
              <EmptyState
                title="No templates found"
                description="Try changing the search, sort, or filter options."
              />
            ) : (
              filteredTemplates.map((template) => (
                <AppCard key={template.id} style={styles.templateCard}>
                  <View style={styles.templateTopRow}>
                    <View style={styles.templateTextWrap}>
                      <Text style={styles.templateTitle}>{template.name}</Text>
                      <Text style={styles.templateSubtitle}>{template.notes}</Text>
                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Shortcut: </Text>
                        Apply this template directly to any trip
                      </Text>
                    </View>

                    <StatusBadge
                      label={`${template.itemCount} item${
                        template.itemCount === 1 ? "" : "s"
                      }`}
                      tone="info"
                    />
                  </View>

                  <View style={styles.metaGroup}>
                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Travel Type: </Text>
                      {template.travel_type}
                    </Text>

                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Weather: </Text>
                      {template.weather_type}
                    </Text>
                  </View>

                  <View style={styles.actionColumn}>
                    <AppButton
                      title="Quick Apply"
                      onPress={() =>
                        navigation.navigate("ApplyTemplateToTrip", {
                          templateId: template.id,
                          templateName: template.name,
                        })
                      }
                    />

                    <AppButton
                      title="Open Details"
                      variant="secondary"
                      onPress={() =>
                        navigation.navigate("TemplateDetails", {
                          templateId: template.id,
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
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  templateCard: {
    backgroundColor: "#f8fafc",
    marginTop: spacing.sm,
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