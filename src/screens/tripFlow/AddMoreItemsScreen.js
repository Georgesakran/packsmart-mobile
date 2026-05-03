import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const CATEGORY_OPTIONS = [
  { key: "clothing", label: "Clothing" },
  { key: "bottoms", label: "Bottoms" },
  { key: "outerwear", label: "Outerwear" },
  { key: "underwear", label: "Underwear" },
  { key: "shoes", label: "Shoes" },
  { key: "toiletries", label: "Toiletries" },
  { key: "tech", label: "Tech" },
  { key: "documents", label: "Documents" },
  { key: "accessories", label: "Accessories" },
  { key: "misc", label: "Misc" },
];

const GENERAL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["38","39", "40", "41", "42", "43", "44", "45", "46","47"];

function buildPlaceholderScannedItems() {
  return [
    { name: "T-Shirt", category: "clothing", sizeCode: "M", quantity: 1 },
    { name: "Toothbrush", category: "toiletries", sizeCode: null, quantity: 1 },
    { name: "Passport", category: "documents", sizeCode: null, quantity: 1 },
  ];
}

function getSizeOptionsForCategory(category) {
  if (category === "shoes") return SHOE_SIZES;
  return GENERAL_SIZES;
}

export default function AddMoreItemsScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [tripItems, setTripItems] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);

  const [activeMode, setActiveMode] = useState("manual");

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("misc");
  const [hasSize, setHasSize] = useState(false);
  const [sizeCode, setSizeCode] = useState("M");
  const [quantity, setQuantity] = useState(1);

  const [savingManual, setSavingManual] = useState(false);
  const [runningScan, setRunningScan] = useState(false);

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

  useEffect(() => {
    if (category === "shoes") {
      setSizeCode((prev) => (SHOE_SIZES.includes(prev) ? prev : "42"));
    } else {
      setSizeCode((prev) => (GENERAL_SIZES.includes(prev) ? prev : "M"));
    }
  }, [category]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTripItems(false);
  };

  const totalTripItemsCount = useMemo(() => {
    return tripItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [tripItems]);

  const tripGroupCount = useMemo(() => {
    return new Set(tripItems.map((item) => item.category || "misc")).size;
  }, [tripItems]);

  const currentSizeOptions = useMemo(() => {
    return getSizeOptionsForCategory(category);
  }, [category]);

  const resetManualForm = () => {
    setItemName("");
    setCategory("misc");
    setHasSize(false);
    setSizeCode("M");
    setQuantity(1);
  };

  const handleChangeQuantity = (delta) => {
    setQuantity((prev) => Math.max(1, Number(prev || 1) + delta));
  };

  const handleAddManualItem = async () => {
    try {
      setError("");
      setActionMessage("");

      if (!tripId) {
        setError("Trip ID is missing.");
        return;
      }

      if (!itemName.trim()) {
        setError("Please enter an item name.");
        return;
      }

      setSavingManual(true);

      const payload = {
        sourceType: "custom",
        customName: itemName.trim(),
        quantity: Number(quantity || 1),
        category,
        audience: null,
        sizeCode: hasSize ? sizeCode : null,
        packBehavior: "normal",
        baseVolumeCm3: 1,
        baseWeightG: 1,
      };

      await createTripItem(tripId, payload);
      await loadTripItems(false);

      setRecentlyAdded((prev) => [
        {
          id: `manual-${Date.now()}`,
          name: itemName.trim(),
          category,
          quantity: Number(quantity || 1),
          sizeCode: hasSize ? sizeCode : null,
          source: "manual",
        },
        ...prev,
      ]);

      resetManualForm();
      setActionMessage("Item added successfully.");
    } catch (err) {
      console.error("Add manual item error:", err?.response?.data || err);
      setError(err?.response?.data?.message || "Failed to add item.");
    } finally {
      setSavingManual(false);
    }
  };

  const handleRunDemoScan = async () => {
    try {
      setError("");
      setActionMessage("");
      setRunningScan(true);

      const demoItems = buildPlaceholderScannedItems();

      for (const item of demoItems) {
        await createTripItem(tripId, {
          sourceType: "custom",
          customName: item.name,
          quantity: item.quantity,
          category: item.category,
          audience: null,
          sizeCode: item.sizeCode || null,
          packBehavior: "normal",
          baseVolumeCm3: null,
          baseWeightG: null,
        });
      }

      await loadTripItems(false);

      setRecentlyAdded((prev) => [
        ...demoItems.map((item, index) => ({
          id: `scan-${Date.now()}-${index}`,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          sizeCode: item.sizeCode || null,
          source: "scan",
        })),
        ...prev,
      ]);

      setActionMessage("Demo scan added placeholder items.");
    } catch (err) {
      console.error("Demo scan error:", err?.response?.data || err);
      setError(err?.response?.data?.message || "Failed to run demo scan.");
    } finally {
      setRunningScan(false);
    }
  };

  const handleContinue = () => {
    if (!tripId) {
      setError("Trip ID is missing.");
      return;
    }

    navigation.navigate("InventoryReview", { tripId });
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading more items step...</Text>
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
          <Text style={styles.title}>Add More Items</Text>
          <Text style={styles.subtitle}>
            Add special items manually or use the scan demo. Keep this step simple.
          </Text>

          <FlowProgressHeader
            currentStep="items"
            title="Add anything beyond the essentials"
            subtitle="Use manual add for special items. Scan can stay as a simple demo for now."
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
              title="Mode"
              subtitle="Choose how you want to add more items."
            />

            <View style={styles.segmentWrap}>
              <AppButton
                title="Manual"
                variant={activeMode === "manual" ? "primary" : "secondary"}
                size="sm"
                onPress={() => setActiveMode("manual")}
                style={styles.segmentButton}
              />

              <AppButton
                title="Scan"
                variant={activeMode === "scan" ? "primary" : "secondary"}
                size="sm"
                onPress={() => setActiveMode("scan")}
                style={styles.segmentButton}
              />
            </View>
          </AppCard>

          {activeMode === "manual" ? (
            <AppCard>
              <SectionHeader
                title="Manual Add"
                subtitle="Add one custom item at a time."
              />

              <Text style={styles.label}>Item Name</Text>
              <TextInput
                value={itemName}
                onChangeText={setItemName}
                placeholder="Example: Power Bank"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryWrap}>
                {CATEGORY_OPTIONS.map((option) => (
                  <AppButton
                    key={option.key}
                    title={option.label}
                    variant={category === option.key ? "primary" : "secondary"}
                    size="sm"
                    fullWidth={false}
                    onPress={() => setCategory(option.key)}
                    style={styles.categoryChip}
                  />
                ))}
              </View>

              <Text style={styles.label}>Has Size?</Text>
              <View style={styles.segmentWrap}>
                <AppButton
                  title="No"
                  variant={!hasSize ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => setHasSize(false)}
                  style={styles.segmentButton}
                />

                <AppButton
                  title="Yes"
                  variant={hasSize ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => setHasSize(true)}
                  style={styles.segmentButton}
                />
              </View>

              {hasSize ? (
                <>
                  <Text style={styles.label}>Size</Text>
                  <View style={styles.sizeWrap}>
                    {currentSizeOptions.map((option) => (
                      <AppButton
                        key={`${category}-${option}`}
                        title={option}
                        variant={sizeCode === option ? "primary" : "secondary"}
                        size="sm"
                        fullWidth={false}
                        onPress={() => setSizeCode(option)}
                        style={styles.sizeChip}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={styles.label}>Quantity</Text>
              <View style={styles.quantityRow}>
                <AppButton
                  title="−"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onPress={() => handleChangeQuantity(-1)}
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
                  onPress={() => handleChangeQuantity(1)}
                  style={styles.counterButton}
                />
              </View>

              <AppButton
                title="Add Item"
                onPress={handleAddManualItem}
                loading={savingManual}
                size="md"
                style={styles.topButton}
              />
            </AppCard>
          ) : (
            <AppCard style={styles.betaCard}>
              <SectionHeader
                title="Scan Demo"
                subtitle="This is still a placeholder step for future AI scanning."
              />

              <View style={styles.scanPreviewBox}>
                <View style={styles.scanPreviewInner}>
                  <Text style={styles.scanPreviewText}>Inventory Camera</Text>
                  <Text style={styles.scanPreviewSubText}>
                    Demo mode adds a few placeholder items only
                  </Text>
                </View>
              </View>

              <AppButton
                title="Run Demo Scan"
                variant="secondary"
                onPress={handleRunDemoScan}
                loading={runningScan}
                size="md"
              />
            </AppCard>
          )}

          <AppCard>
            <SectionHeader
              title="Added in This Step"
              subtitle="Only the items you added here recently."
            />

            {recentlyAdded.length === 0 ? (
              <EmptyState
                title="Nothing added in this step yet"
                description="Add one custom item or try the scan demo."
              />
            ) : (
              <View style={styles.recentList}>
                {recentlyAdded.map((item) => (
                  <View key={item.id} style={styles.recentRow}>
                    <View style={styles.recentLeft}>
                      <Text style={styles.recentTitle}>{item.name}</Text>
                      <Text style={styles.recentMeta}>
                        {item.category} • Qty {item.quantity}
                        {item.sizeCode ? ` • ${item.sizeCode}` : ""}
                      </Text>
                    </View>

                    <View style={styles.recentBadge}>
                      <Text style={styles.recentBadgeText}>
                        {item.source === "scan" ? "Scan" : "Manual"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Trip Summary"
              subtitle="A small summary of the full trip so far."
            />

            {tripItems.length === 0 ? (
              <EmptyState
                title="No trip items yet"
                description="Go back to essentials or add something here first."
              />
            ) : (
              <>
                <View style={styles.tripSummaryGrid}>
                  <View style={styles.tripSummaryCard}>
                    <Text style={styles.tripSummaryLabel}>Items</Text>
                    <Text style={styles.tripSummaryValue}>{totalTripItemsCount}</Text>
                  </View>

                  <View style={styles.tripSummaryCard}>
                    <Text style={styles.tripSummaryLabel}>Groups</Text>
                    <Text style={styles.tripSummaryValue}>{tripGroupCount}</Text>
                  </View>
                </View>

                <Text style={styles.tripSummarySubText}>
                  Your full trip list stays safe. The list above only shows what was added in this screen.
                </Text>
              </>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Next Step"
              subtitle="Continue to the final review before simulation."
            />

            <View style={styles.actionsColumn}>
              <AppButton
                title="Continue to Review"
                onPress={handleContinue}
                size="md"
              />

              <AppButton
                title="Back to Essentials"
                variant="secondary"
                onPress={() => navigation.navigate("SmartInventory", { tripId })}
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
  segmentWrap: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segmentButton: {
    flex: 1,
  },
  label: {
    marginTop: spacing.md,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
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
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sizeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  sizeChip: {
    minWidth: 54,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
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
  topButton: {
    marginTop: spacing.lg,
  },
  betaCard: {
    backgroundColor: "#fcfcfd",
  },
  scanPreviewBox: {
    height: 220,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  scanPreviewInner: {
    width: "78%",
    height: "68%",
    borderWidth: 2,
    borderColor: "#38bdf8",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  scanPreviewText: {
    color: "#e2e8f0",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  scanPreviewSubText: {
    color: "#cbd5e1",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  recentList: {
    gap: spacing.sm,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: spacing.md,
  },
  recentLeft: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  recentMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  recentBadge: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  recentBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
  },
  tripSummaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tripSummaryCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
  },
  tripSummaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  tripSummaryValue: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
  },
  tripSummarySubText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
});