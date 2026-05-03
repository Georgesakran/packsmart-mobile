import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";
import FlowProgressHeader from "../../components/tripFlow/FlowProgressHeader";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { createTripItem, getTripItems } from "../../api/tripApi";

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["39", "40", "41", "42", "43", "44", "45", "46"];

const ESSENTIAL_ITEMS = [
  {
    key: "tshirts",
    label: "T-Shirts",
    category: "clothing",
    suggestedName: "T-Shirt",
    hasSize: true,
    sizeOptions: CLOTHING_SIZES,
    defaultSize: "M",
  },
  {
    key: "pants",
    label: "Pants",
    category: "bottoms",
    suggestedName: "Pants",
    hasSize: true,
    sizeOptions: CLOTHING_SIZES,
    defaultSize: "M",
  },
  {
    key: "hoodies",
    label: "Hoodies",
    category: "outerwear",
    suggestedName: "Hoodie",
    hasSize: true,
    sizeOptions: CLOTHING_SIZES,
    defaultSize: "L",
  },
  {
    key: "underwear",
    label: "Underwear",
    category: "underwear",
    suggestedName: "Underwear",
    hasSize: true,
    sizeOptions: CLOTHING_SIZES,
    defaultSize: "M",
  },
  {
    key: "socks",
    label: "Socks",
    category: "underwear",
    suggestedName: "Socks",
    hasSize: false,
    sizeOptions: [],
    defaultSize: null,
  },
  {
    key: "shoes",
    label: "Shoes",
    category: "shoes",
    suggestedName: "Shoes",
    hasSize: true,
    sizeOptions: SHOE_SIZES,
    defaultSize: "42",
  },
  {
    key: "toiletries",
    label: "Toiletries",
    category: "toiletries",
    suggestedName: "Toiletry Pouch",
    hasSize: false,
    sizeOptions: [],
    defaultSize: null,
  },
  {
    key: "tech",
    label: "Tech",
    category: "tech",
    suggestedName: "Tech Item",
    hasSize: false,
    sizeOptions: [],
    defaultSize: null,
  },
  {
    key: "documents",
    label: "Documents",
    category: "documents",
    suggestedName: "Travel Documents",
    hasSize: false,
    sizeOptions: [],
    defaultSize: null,
  },
  {
    key: "accessories",
    label: "Accessories",
    category: "accessories",
    suggestedName: "Accessories",
    hasSize: false,
    sizeOptions: [],
    defaultSize: null,
  },
];

function buildInitialSelections() {
  const initial = {};

  for (const item of ESSENTIAL_ITEMS) {
    initial[item.key] = {
      quantity: 0,
      sizeCode: item.defaultSize || null,
    };
  }

  return initial;
}

export default function SmartInventoryScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tripItems, setTripItems] = useState([]);
  const [selections, setSelections] = useState(buildInitialSelections());

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadTripItems = useCallback(async (showLoader = true) => {
    try {
      if (!tripId) {
        setError("Trip ID is missing.");
        return;
      }

      if (showLoader) setLoading(true);
      setError("");

      const response = await getTripItems(tripId);
      setTripItems(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Load trip items error:", err?.response?.data || err);
      setError(err?.response?.data?.message || "Failed to load trip items.");
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTripItems(true);
  }, [loadTripItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTripItems(false);
  };

  const totalTripItemsCount = useMemo(() => {
    return tripItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [tripItems]);

  const selectedEssentialsCount = useMemo(() => {
    return Object.values(selections).reduce(
      (sum, entry) => sum + Number(entry?.quantity || 0),
      0
    );
  }, [selections]);

  const updateQuantity = (key, delta) => {
    setSelections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        quantity: Math.max(0, Number(prev[key]?.quantity || 0) + delta),
      },
    }));
  };

  const setSizeCode = (key, sizeCode) => {
    setSelections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        sizeCode,
      },
    }));
  };

  const cycleSize = (itemKey, options = []) => {
    if (!options.length) return;

    setSelections((prev) => {
      const current = prev[itemKey]?.sizeCode;
      const currentIndex = options.findIndex((value) => value === current);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % options.length : 0;

      return {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          sizeCode: options[nextIndex],
        },
      };
    });
  };

  const handleAddSelectedItems = async () => {
    try {
      setError("");
      setActionMessage("");

      if (!tripId) {
        setError("Trip ID is missing.");
        return;
      }

      const selectedRows = ESSENTIAL_ITEMS.filter(
        (item) => Number(selections[item.key]?.quantity || 0) > 0
      );

      if (!selectedRows.length) {
        setError("Choose at least one item first.");
        return;
      }

      setSaving(true);

      for (const item of selectedRows) {
        const rowState = selections[item.key];
        const qty = Number(rowState?.quantity || 0);
        const sizeCode = item.hasSize ? rowState?.sizeCode || item.defaultSize || null : null;

        await createTripItem(tripId, {
          sourceType: "custom",
          customName: item.suggestedName,
          quantity: qty,
          category: item.category,
          audience: null,
          sizeCode,
          packBehavior: "normal",
          baseVolumeCm3: null,
          baseWeightG: null,
        });
      }

      setSelections(buildInitialSelections());
      await loadTripItems(false);
      setActionMessage("Selected essentials were added to the trip.");
    } catch (err) {
      console.error("Add essentials error:", err?.response?.data || err);
      setError(err?.response?.data?.message || "Failed to add selected items.");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (!tripId) {
      setError("Trip ID is missing.");
      return;
    }

    navigation.navigate("AddMoreItems", { tripId });
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading essentials...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          <Text style={styles.kicker}>PackSmart vNext</Text>
          <Text style={styles.title}>Trip Essentials</Text>
          <Text style={styles.subtitle}>
            Start with the basics. Pick how many you need, choose a size when needed,
            and add them all at once.
          </Text>

          <FlowProgressHeader
            currentStep="items"
            title="Start with common travel items"
            subtitle="Choose your basics first. You can add custom items and scan later."
          />

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          {actionMessage ? (
            <AppCard style={styles.successCard}>
              <Text style={styles.successText}>{actionMessage}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Essentials"
              subtitle="Simple, fast, and no manual measurements needed."
            />

            <View style={styles.essentialsList}>
              {ESSENTIAL_ITEMS.map((item) => {
                const rowState = selections[item.key];
                const quantity = Number(rowState?.quantity || 0);
                const sizeCode = rowState?.sizeCode || item.defaultSize || null;

                return (
                  <View key={item.key} style={styles.essentialRow}>
                    <View style={styles.rowTop}>
                      <View style={styles.essentialTextWrap}>
                        <Text style={styles.essentialTitle}>{item.label}</Text>
                      </View>

                      {item.hasSize ? (
                        <AppButton
                          title={sizeCode || "Select"}
                          variant="secondary"
                          size="sm"
                          fullWidth={false}
                          onPress={() => cycleSize(item.key, item.sizeOptions)}
                          style={styles.sizeButton}
                        />
                      ) : (
                        <View style={styles.singleSizeBadge}>
                          <Text style={styles.singleSizeBadgeText}>One size</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.counterWrap}>
                      <AppButton
                        title="−"
                        variant="secondary"
                        size="sm"
                        fullWidth={false}
                        onPress={() => updateQuantity(item.key, -1)}
                        style={styles.counterButton}
                      />

                      <View style={styles.counterValueWrap}>
                        <Text style={styles.counterValue}>{quantity}</Text>
                      </View>

                      <AppButton
                        title="+"
                        variant="secondary"
                        size="sm"
                        fullWidth={false}
                        onPress={() => updateQuantity(item.key, 1)}
                        style={styles.counterButton}
                      />
                    </View>

                    {item.hasSize ? (
                      <View style={styles.sizeOptionsRow}>
                        {item.sizeOptions.map((option) => {
                          const selected = option === sizeCode;

                          return (
                            <AppButton
                              key={`${item.key}-${option}`}
                              title={option}
                              variant={selected ? "primary" : "secondary"}
                              size="sm"
                              fullWidth={false}
                              onPress={() => setSizeCode(item.key, option)}
                              style={styles.sizeChip}
                            />
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <View style={styles.footerBox}>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Selected now</Text>
                <Text style={styles.summaryMiniValue}>{selectedEssentialsCount}</Text>
              </View>

              <AppButton
                title="Add Selected Items"
                onPress={handleAddSelectedItems}
                loading={saving}
                size="md"
              />
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Trip So Far"
              subtitle="A quick summary of what is already saved in this trip."
            />

            {tripItems.length === 0 ? (
              <EmptyState
                title="No items saved yet"
                description="Pick a few basics above and add them to the trip first."
              />
            ) : (
              <>
                <View style={styles.tripSummaryCard}>
                  <Text style={styles.tripSummaryLabel}>Currently in trip</Text>
                  <Text style={styles.tripSummaryValue}>{totalTripItemsCount} items</Text>
                </View>

                <View style={styles.savedPreviewList}>
                  {tripItems.slice(0, 5).map((item) => {
                    const name =
                      item.custom_name || item.base_item_name || item.name || "Item";

                    return (
                      <View key={item.id} style={styles.savedPreviewRow}>
                        <View style={styles.savedDot} />
                        <Text style={styles.savedPreviewText}>
                          {name} × {Number(item.quantity || 1)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {tripItems.length > 5 ? (
                  <Text style={styles.moreItemsText}>
                    + {tripItems.length - 5} more saved items
                  </Text>
                ) : null}
              </>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Next Step"
              subtitle="Continue when you are ready to review the trip items."
            />

            <View style={styles.actionsColumn}>
              <AppButton
                title="Next"
                onPress={handleNext}
                size="md"
              />

              <AppButton
                title="Back to Suitcase Setup"
                variant="secondary"
                onPress={() => navigation.navigate("SuitcaseSetup", { tripId })}
                size="md"
              />
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
    flexGrow: 1,
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
    fontWeight: "800",
    color: colors.secondary,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  successCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  successText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  essentialsList: {
    gap: spacing.sm,
  },
  essentialRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  essentialTextWrap: {
    flex: 1,
  },
  essentialTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  counterWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  counterButton: {
    width: 42,
    minHeight: 40,
    paddingHorizontal: 0,
  },
  counterValueWrap: {
    minWidth: 34,
    alignItems: "center",
  },
  counterValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },
  sizeButton: {
    minWidth: 82,
  },
  sizeOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  sizeChip: {
    minWidth: 54,
  },
  singleSizeBadge: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  singleSizeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  footerBox: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  summaryMiniCard: {
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
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  tripSummaryCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tripSummaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  tripSummaryValue: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  savedPreviewList: {
    gap: 10,
  },
  savedPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  savedDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  savedPreviewText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  moreItemsText: {
    marginTop: spacing.md,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
});
