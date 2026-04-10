import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import EmptyState from "../../components/common/EmptyState";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import {
  createTripItem,
  deleteCustomItem,
  getCustomItems,
} from "../../api/tripApi";

export default function SavedCustomItemsScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [addingItemId, setAddingItemId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load custom items error:", err);
      setError(err?.response?.data?.message || "Failed to load custom items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const category = String(item.category || "").toLowerCase();
      return name.includes(query) || category.includes(query);
    });
  }, [items, search]);

  const handleDelete = async (customItemId) => {
    try {
      setDeletingItemId(customItemId);
      await deleteCustomItem(customItemId);
      setItems((prev) => prev.filter((item) => item.id !== customItemId));
    } catch (err) {
      console.error("Delete custom item error:", err);
      setError(err?.response?.data?.message || "Failed to delete custom item.");
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleAddToTrip = async (item) => {
    try {
      if (!tripId) {
        setError("Trip ID is missing for adding this item to a trip.");
        return;
      }

      setAddingItemId(item.id);

      await createTripItem(tripId, {
        itemId: null,
        customName: item.name,
        sourceType: "custom",
        quantity: 1,
        sizeCode: null,
        category: item.category || "misc",
        audience: item.audience || "unisex",
        baseVolumeCm3: Number(item.base_volume_cm3 || 0),
        baseWeightG: Number(item.base_weight_g || 0),
        packBehavior: item.pack_behavior,
        assignedBagId: null,
      });

      Alert.alert("Added", `${item.name} was added to the current trip.`);
    } catch (err) {
      console.error("Add custom item to trip error:", err);
      setError(err?.response?.data?.message || "Failed to add item to trip.");
    } finally {
      setAddingItemId(null);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading saved custom items...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Custom Items</Text>
          <Text style={styles.title}>Saved Custom Items</Text>
          <Text style={styles.subtitle}>
            Reuse your personal custom items in this trip or future trips.
          </Text>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Search"
              subtitle="Find a custom item by name or category."
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              style={styles.input}
              placeholder="Search custom items..."
            />
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Custom Item Library"
              subtitle="Your saved custom items."
            />

            {filteredItems.length === 0 ? (
              <EmptyState
                title="No custom items found"
                description="Create a custom item first, then it will appear here."
              />
            ) : (
              filteredItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemTitle}>{item.name}</Text>
                      <Text style={styles.itemSubtitle}>
                        {item.category || "misc"} • {item.pack_behavior}
                      </Text>
                    </View>

                    <StatusBadge label="Saved" tone="success" />
                  </View>

                  <View style={styles.metaGroup}>
                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Dimensions: </Text>
                      {item.length_cm || "—"} × {item.width_cm || "—"} ×{" "}
                      {item.height_cm || "—"} cm
                    </Text>

                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Volume: </Text>
                      {item.base_volume_cm3} cm³
                    </Text>

                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Weight: </Text>
                      {item.base_weight_g} g
                    </Text>

                    {item.notes ? (
                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Notes: </Text>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.actionsColumn}>
                    {tripId ? (
                      <AppButton
                        title="Add to Current Trip"
                        onPress={() => handleAddToTrip(item)}
                        loading={addingItemId === item.id}
                      />
                    ) : null}

                    <AppButton
                      title="Delete Custom Item"
                      variant="secondary"
                      onPress={() => handleDelete(item.id)}
                      loading={deletingItemId === item.id}
                    />
                  </View>
                </View>
              ))
            )}
          </AppCard>

          <AppCard>
            <View style={styles.actionsColumn}>
              <AppButton
                title="Create New Custom Item"
                onPress={() => navigation.navigate("AddCustomItem", { tripId })}
              />

              {tripId ? (
                <AppButton
                  title="Back to Trip"
                  variant="secondary"
                  onPress={() => navigation.goBack()}
                />
              ) : null}
            </View>
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
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  itemCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  itemHeader: {
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
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
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
    marginTop: spacing.lg,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
});