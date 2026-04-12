import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
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
  assignTripItemToBag,
  calculateTrip,
  deleteTripItem,
  getTripById,
  getTripItems,
  getTripItemsSummary,
  getTripSuitcases,
  updateTripItemPackingStatus,
  updateTripItemQuantity,
  updateTripItemTravelDayMode,
} from "../../api/tripApi";

const TRAVEL_DAY_OPTIONS = ["normal", "wear_on_travel_day", "keep_accessible"];
const PACKING_STATUS_OPTIONS = [
  "pending",
  "packed",
  "wear_on_travel_day",
  "skip",
];

function prettifyToken(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const ITEM_FILTERS = [
    { key: "all", label: "All" },
    { key: "custom", label: "Custom" },
    { key: "catalog", label: "Catalog" },
    { key: "unassigned", label: "Unassigned" },
    { key: "travel_day", label: "Travel Day" },
    { key: "accessible", label: "Accessible" },
    { key: "clothing", label: "Clothing" },
    { key: "toiletries", label: "Toiletries" },
    { key: "tech", label: "Tech" },
    { key: "documents", label: "Docs" },
    { key: "accessories", label: "Accessories" },
    { key: "shoes", label: "Shoes" },
  ];

export default function TripItemsManagementScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [bags, setBags] = useState([]);

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [calculating, setCalculating] = useState(false);
  
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const [selectedItem, setSelectedItem] = useState(null);
  const [bagPickerVisible, setBagPickerVisible] = useState(false);
  const [travelModePickerVisible, setTravelModePickerVisible] = useState(false);
  const [packingStatusPickerVisible, setPackingStatusPickerVisible] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [tripData, itemsData, summaryData, bagsData] = await Promise.all([
        getTripById(tripId),
        getTripItems(tripId),
        getTripItemsSummary(tripId),
        getTripSuitcases(tripId),
      ]);

      setTrip(tripData || null);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setSummary(summaryData || null);
      setBags(Array.isArray(bagsData) ? bagsData : []);
    } catch (err) {
      console.error("Load trip items management error:", err);
      setError(
        err?.response?.data?.message || "Failed to load trip items."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
  
    return items.filter((item) => {
      const displayName = String(
        item.displayName || item.custom_name || item.base_item_name || ""
      ).toLowerCase();
  
      const category = String(item.category || "misc").toLowerCase();
      const sourceType = String(item.source_type || item.sourceType || "database").toLowerCase();
      const travelDayMode = String(item.travelDayMode || item.travel_day_mode || "normal").toLowerCase();
      const assignedBagId = item.assigned_bag_id || null;
  
      const matchesSearch =
        !query ||
        displayName.includes(query) ||
        category.includes(query);
  
      let matchesFilter = true;
  
      switch (selectedFilter) {
        case "custom":
          matchesFilter = sourceType === "custom";
          break;
        case "catalog":
          matchesFilter = sourceType !== "custom";
          break;
        case "unassigned":
          matchesFilter = !assignedBagId;
          break;
        case "travel_day":
          matchesFilter = travelDayMode === "wear_on_travel_day";
          break;
        case "accessible":
          matchesFilter = travelDayMode === "keep_accessible";
          break;
        case "all":
          matchesFilter = true;
          break;
        default:
          matchesFilter = category === selectedFilter;
          break;
      }
  
      return matchesSearch && matchesFilter;
    });
  }, [items, search, selectedFilter]);

  const itemsByCategory = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const key = item.category || "misc";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  const categoryKeys = useMemo(() => {
    return Object.keys(itemsByCategory);
  }, [itemsByCategory]);

  const handleQuantityChange = async (item, delta) => {
    try {
      const nextQuantity = Number(item.quantity || 1) + delta;

      if (nextQuantity < 1) {
        Alert.alert(
          "Remove item?",
          `Do you want to remove ${item.displayName || item.custom_name || "this item"} from the trip?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: () => handleDeleteItem(item),
            },
          ]
        );
        return;
      }

      setUpdatingItemId(item.id);
      setActionMessage("");
      setError("");

      await updateTripItemQuantity(tripId, item.id, nextQuantity);

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, quantity: nextQuantity }
            : entry
        )
      );

      setSummary((prev) =>
        prev
          ? {
              ...prev,
              total_quantity:
                Number(prev.total_quantity || 0) + delta,
            }
          : prev
      );

      setActionMessage("Item quantity updated.");
    } catch (err) {
      console.error("Update quantity error:", err);
      setError(
        err?.response?.data?.message || "Failed to update item quantity."
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      setDeletingItemId(item.id);
      setActionMessage("");
      setError("");

      await deleteTripItem(tripId, item.id);

      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      setActionMessage("Item removed successfully.");

      await loadData(true);
    } catch (err) {
      console.error("Delete item error:", err);
      setError(err?.response?.data?.message || "Failed to delete item.");
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleTravelDayModeChange = async (item) => {
    try {
      const currentIndex = TRAVEL_DAY_OPTIONS.indexOf(
        item.travelDayMode || item.travel_day_mode || "normal"
      );
      const nextMode =
        TRAVEL_DAY_OPTIONS[
          (currentIndex + 1) % TRAVEL_DAY_OPTIONS.length
        ];

      setUpdatingItemId(item.id);
      setActionMessage("");
      setError("");

      await updateTripItemTravelDayMode(tripId, item.id, nextMode);

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, travelDayMode: nextMode, travel_day_mode: nextMode }
            : entry
        )
      );

      setActionMessage("Travel-day mode updated.");
      await loadData(true);
    } catch (err) {
      console.error("Update travel-day mode error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update travel-day mode."
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handlePackingStatusChange = async (item) => {
    try {
      const currentIndex = PACKING_STATUS_OPTIONS.indexOf(
        item.packingStatus || item.packing_status || "pending"
      );
      const nextStatus =
        PACKING_STATUS_OPTIONS[
          (currentIndex + 1) % PACKING_STATUS_OPTIONS.length
        ];

      setUpdatingItemId(item.id);
      setActionMessage("");
      setError("");

      await updateTripItemPackingStatus(tripId, item.id, nextStatus);

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, packingStatus: nextStatus, packing_status: nextStatus }
            : entry
        )
      );

      setActionMessage("Packing status updated.");
      await loadData(true);
    } catch (err) {
      console.error("Update packing status error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update packing status."
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleAssignBag = async (item) => {
    try {
      if (!bags.length) {
        setError("No bags found for this trip.");
        return;
      }

      const currentBagId = item.assigned_bag_id || null;
      const currentIndex = bags.findIndex((bag) => bag.id === currentBagId);
      const nextBag =
        currentIndex === -1
          ? bags[0]
          : bags[(currentIndex + 1) % bags.length];

      setUpdatingItemId(item.id);
      setActionMessage("");
      setError("");

      await assignTripItemToBag(tripId, item.id, nextBag?.id || null);

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                assigned_bag_id: nextBag?.id || null,
                assignedBagName: nextBag?.name || null,
              }
            : entry
        )
      );

      setActionMessage(
        nextBag?.name
          ? `Item assigned to ${nextBag.name}.`
          : "Bag assignment cleared."
      );

      await loadData(true);
    } catch (err) {
      console.error("Assign bag error:", err);
      setError(err?.response?.data?.message || "Failed to assign bag.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleCalculateTrip = async () => {
    try {
      setCalculating(true);
      setActionMessage("");
      setError("");

      await calculateTrip(tripId);

      setActionMessage("Trip recalculated successfully.");
      navigation.navigate("TripCalculationResults", { tripId });
    } catch (err) {
      console.error("Calculate trip error:", err);
      setError(err?.response?.data?.message || "Failed to calculate trip.");
    } finally {
      setCalculating(false);
    }
  };

  const handleAssignBagChoice = async (assignedBagId) => {
    try {
      if (!selectedItem) return;
  
      setUpdatingItemId(selectedItem.id);
      setBagPickerVisible(false);
      setActionMessage("");
      setError("");
  
      await assignTripItemToBag(tripId, selectedItem.id, assignedBagId);
  
      setActionMessage(
        assignedBagId
          ? "Bag assignment updated."
          : "Bag assignment cleared."
      );
  
      await loadData(true);
    } catch (err) {
      console.error("Assign bag choice error:", err);
      setError(err?.response?.data?.message || "Failed to assign bag.");
    } finally {
      setUpdatingItemId(null);
      setSelectedItem(null);
    }
  };
  
  const handleTravelModeChoice = async (travelDayMode) => {
    try {
      if (!selectedItem) return;
  
      setUpdatingItemId(selectedItem.id);
      setTravelModePickerVisible(false);
      setActionMessage("");
      setError("");
  
      await updateTripItemTravelDayMode(tripId, selectedItem.id, travelDayMode);
  
      setActionMessage("Travel-day mode updated.");
      await loadData(true);
    } catch (err) {
      console.error("Travel mode choice error:", err);
      setError(
        err?.response?.data?.message || "Failed to update travel-day mode."
      );
    } finally {
      setUpdatingItemId(null);
      setSelectedItem(null);
    }
  };
  
  const handlePackingStatusChoice = async (packingStatus) => {
    try {
      if (!selectedItem) return;
  
      setUpdatingItemId(selectedItem.id);
      setPackingStatusPickerVisible(false);
      setActionMessage("");
      setError("");
  
      await updateTripItemPackingStatus(tripId, selectedItem.id, packingStatus);
  
      setActionMessage("Packing status updated.");
      await loadData(true);
    } catch (err) {
      console.error("Packing status choice error:", err);
      setError(
        err?.response?.data?.message || "Failed to update packing status."
      );
    } finally {
      setUpdatingItemId(null);
      setSelectedItem(null);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading trip items...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.kicker}>Trips / Items Management</Text>
          <Text style={styles.title}>Manage Trip Items</Text>
          <Text style={styles.subtitle}>
            Review, adjust, assign, and prepare all packing items in one place.
          </Text>

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
              title="Trip Context"
              subtitle="Current trip and item management summary."
            />

            <View style={styles.metaGroup}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Trip: </Text>
                {trip?.trip_name || "Unnamed Trip"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Destination: </Text>
                {trip?.destination ||
                  `${trip?.destination_city || ""}${
                    trip?.destination_city && trip?.destination_country ? ", " : ""
                  }${trip?.destination_country || ""}` ||
                  "—"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Duration: </Text>
                {trip?.duration_days || 0} day
                {Number(trip?.duration_days || 0) === 1 ? "" : "s"}
              </Text>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Items Summary"
              subtitle="Quick overview of the current trip items."
            />

            <View style={styles.summaryGrid}>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Unique Items</Text>
                <Text style={styles.summaryMiniValue}>
                  {Number(summary?.unique_items || 0)}
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Total Quantity</Text>
                <Text style={styles.summaryMiniValue}>
                  {Number(summary?.total_quantity || 0)}
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Custom Items</Text>
                <Text style={styles.summaryMiniValue}>
                  {Number(summary?.custom_items || 0)}
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Unassigned</Text>
                <Text style={styles.summaryMiniValue}>
                  {Number(summary?.unassigned_items || 0)}
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Travel Day</Text>
                <Text style={styles.summaryMiniValue}>
                  {Number(summary?.wear_on_travel_day_items || 0)}
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Accessible</Text>
                <Text style={styles.summaryMiniValue}>
                  {Number(summary?.keep_accessible_items || 0)}
                </Text>
              </View>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Quick Actions"
              subtitle="Add items and navigate to other item tools."
            />

            <View style={styles.actionsColumn}>
              <AppButton
                title="Add Custom Item"
                onPress={() => navigation.navigate("AddCustomItem", { tripId })}
              />

              <AppButton
                title="Open Saved Custom Items"
                variant="secondary"
                onPress={() =>
                  navigation.navigate("SavedCustomItems", { tripId })
                }
              />

              <AppButton
                title="Recalculate Trip"
                onPress={handleCalculateTrip}
                loading={calculating}
              />
            </View>
          </AppCard>

        <AppCard>
        <SectionHeader
            title="Search & Filters"
            subtitle="Quickly find and narrow down trip items."
        />

        <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search items..."
            style={styles.searchInput}
        />

        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
        >
            {ITEM_FILTERS.map((filter) => (
            <AppButton
                key={filter.key}
                title={filter.label}
                variant={selectedFilter === filter.key ? "primary" : "secondary"}
                onPress={() => setSelectedFilter(filter.key)}
                style={styles.filterChip}
            />
            ))}
        </ScrollView>
        </AppCard>

          <AppCard>
            <SectionHeader
              title="Trip Items"
              subtitle="Manage quantities, status, travel-day mode, bag assignment, and profiles."
            />

            {filteredItems.length === 0 ? (
              <EmptyState
                title="No items yet"
                description="Try changing the filter or search text."
              />
            ) : (
              categoryKeys.map((categoryKey) => (
                <View key={categoryKey} style={styles.categoryBlock}>
                  <Text style={styles.categoryTitle}>
                    {prettifyToken(categoryKey)}
                  </Text>

                  {itemsByCategory[categoryKey].map((item) => {
                    const displayName =
                      item.displayName ||
                      item.custom_name ||
                      item.base_item_name ||
                      "Item";

                    const packingStatus =
                      item.packingStatus || item.packing_status || "pending";

                    const travelDayMode =
                      item.travelDayMode || item.travel_day_mode || "normal";

                    const currentBagName =
                      item.assignedBagName ||
                      item.assigned_bag_name ||
                      "Unassigned";

                    const updating = updatingItemId === item.id;
                    const deleting = deletingItemId === item.id;

                    return (
                      <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemTextWrap}>
                            <Text style={styles.itemTitle}>{displayName}</Text>
                            <Text style={styles.itemSubtitle}>
                              {item.category || "misc"} •{" "}
                              {item.source_type || item.sourceType || "database"}
                            </Text>
                          </View>

                          <View style={styles.badgesColumn}>
                            <StatusBadge
                              label={
                                item.source_type === "custom" ? "Custom" : "Catalog"
                              }
                              tone={
                                item.source_type === "custom" ? "warning" : "info"
                              }
                            />
                            <StatusBadge
                              label={`Qty ${item.quantity || 1}`}
                              tone="neutral"
                            />
                            <StatusBadge
                                label={item.assigned_bag_id ? "Assigned" : "Unassigned"}
                                tone={item.assigned_bag_id ? "success" : "warning"}
                            />
                          </View>
                        </View>

                        <View style={styles.metaGroup}>
                          <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Size: </Text>
                            {item.sizeCode || item.size_code || "Default"}
                          </Text>

                          <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Fold: </Text>
                            {prettifyToken(
                              item.foldType || item.fold_type || "default"
                            )}
                          </Text>

                          <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Bag: </Text>
                            {currentBagName}
                          </Text>

                          <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Travel Day: </Text>
                            {prettifyToken(travelDayMode)}
                          </Text>

                          <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Packing Status: </Text>
                            {prettifyToken(packingStatus)}
                          </Text>
                        </View>

                        <View style={styles.actionsColumn}>
                          <View style={styles.inlineActionsRow}>
                            <AppButton
                              title="-"
                              variant="secondary"
                              onPress={() => handleQuantityChange(item, -1)}
                              style={styles.smallButton}
                              disabled={updating || deleting}
                            />

                            <AppButton
                              title="+"
                              variant="secondary"
                              onPress={() => handleQuantityChange(item, 1)}
                              style={styles.smallButton}
                              disabled={updating || deleting}
                            />

                            <AppButton
                              title="Edit Size & Fold"
                              variant="secondary"
                              onPress={() =>
                                navigation.navigate("TripItemProfileEditor", {
                                  tripId,
                                  tripItem: item,
                                })
                              }
                              style={styles.flexButton}
                            />
                          </View>

                          <AppButton
                            title={`Change Travel Mode: ${prettifyToken(
                              travelDayMode
                            )}`}
                            variant="secondary"
                            onPress={() => {
                                setSelectedItem(item);
                                setTravelModePickerVisible(true);
                              }}
                            loading={updating}
                          />

                          <AppButton
                            title={`Change Packing Status: ${prettifyToken(
                              packingStatus
                            )}`}
                            variant="secondary"
                            onPress={() => {
                                setSelectedItem(item);
                                setPackingStatusPickerVisible(true);
                              }}
                            loading={updating}
                          />

                          <AppButton
                            title={`Assign Bag: ${currentBagName}`}
                            variant="secondary"
                            onPress={() => {
                                setSelectedItem(item);
                                setBagPickerVisible(true);
                              }}
                            loading={updating}
                          />

                          <AppButton
                            title="Delete Item"
                            variant="secondary"
                            onPress={() => handleDeleteItem(item)}
                            loading={deleting}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </AppCard>
        </View>
      </ScrollView>
    <Modal
    visible={bagPickerVisible}
    transparent
    animationType="slide"
    onRequestClose={() => {
        setBagPickerVisible(false);
        setSelectedItem(null);
    }}
    >
    <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>Assign Bag</Text>
        <Text style={styles.modalSubtitle}>
            Choose where to assign this item.
        </Text>

        <AppButton
            title="Clear Assignment"
            variant="secondary"
            onPress={() => handleAssignBagChoice(null)}
        />

        {bags.map((bag) => (
            <AppButton
            key={bag.id}
            title={bag.name || "Bag"}
            variant="secondary"
            onPress={() => handleAssignBagChoice(bag.id)}
            />
        ))}

        <AppButton
            title="Cancel"
            variant="secondary"
            onPress={() => {
            setBagPickerVisible(false);
            setSelectedItem(null);
            }}
        />
        </View>
    </View>
    </Modal>

    <Modal
    visible={travelModePickerVisible}
    transparent
    animationType="slide"
    onRequestClose={() => {
        setTravelModePickerVisible(false);
        setSelectedItem(null);
    }}
    >
    <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>Travel Day Mode</Text>
        <Text style={styles.modalSubtitle}>
            Choose how this item should behave on travel day.
        </Text>

        {TRAVEL_DAY_OPTIONS.map((option) => (
            <AppButton
            key={option}
            title={prettifyToken(option)}
            variant="secondary"
            onPress={() => handleTravelModeChoice(option)}
            />
        ))}

        <AppButton
            title="Cancel"
            variant="secondary"
            onPress={() => {
            setTravelModePickerVisible(false);
            setSelectedItem(null);
            }}
        />
        </View>
    </View>
    </Modal>

    <Modal
    visible={packingStatusPickerVisible}
    transparent
    animationType="slide"
    onRequestClose={() => {
        setPackingStatusPickerVisible(false);
        setSelectedItem(null);
    }}
    >
    <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>Packing Status</Text>
        <Text style={styles.modalSubtitle}>
            Update the current packing progress for this item.
        </Text>

        {PACKING_STATUS_OPTIONS.map((option) => (
            <AppButton
            key={option}
            title={prettifyToken(option)}
            variant="secondary"
            onPress={() => handlePackingStatusChoice(option)}
            />
        ))}

        <AppButton
            title="Cancel"
            variant="secondary"
            onPress={() => {
            setPackingStatusPickerVisible(false);
            setSelectedItem(null);
            }}
        />
        </View>
    </View>
    </Modal>

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
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  successCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  successText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
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
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryMiniCard: {
    width: "48%",
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
  actionsColumn: {
    gap: spacing.sm,
  },
  categoryBlock: {
    marginTop: spacing.md,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
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
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  badgesColumn: {
    gap: 6,
    alignItems: "flex-end",
  },
  inlineActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  smallButton: {
    width: 56,
  },
  flexButton: {
    flex: 1,
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
    marginBottom: spacing.md,
  },
  filtersRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  filterChip: {
    minWidth: 88,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});