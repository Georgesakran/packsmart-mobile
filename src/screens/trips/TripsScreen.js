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
import StatusBadge from "../../components/common/StatusBadge";
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { archiveTrip, duplicateTrip, unarchiveTrip, getTrips, deleteTrip } from "../../api/tripApi";

import { useNotifications } from "../../context/NotificationsContext";

function normalizeTrip(trip) {
  const bagsCount = Number(trip.bagsCount || trip.bags_count || 0);
  const itemsCount = Number(trip.itemsCount || trip.items_count || 0);
  const hasResults = !!trip.hasResults || !!trip.has_results;
  const overallFits = trip.overallFits === true || trip.overall_fits === true;
  const checklistStarted =
    trip.checklistStarted === true || trip.checklist_started === true;
  const travelDayConfigured =
    trip.travelDayConfigured === true || trip.travel_day_configured === true;

  let readinessScore = 0;
  if (bagsCount > 0) readinessScore += 25;
  if (itemsCount > 0) readinessScore += 20;
  if (hasResults) readinessScore += 20;
  if (checklistStarted) readinessScore += 20;
  if (travelDayConfigured) readinessScore += 15;

  let readinessLabel = "Needs work";
  let readinessTone = "warning";

  if (!hasResults) {
    readinessLabel = "No results";
    readinessTone = "neutral";
  } else if (overallFits && readinessScore >= 85) {
    readinessLabel = "Ready";
    readinessTone = "success";
  } else if (overallFits) {
    readinessLabel = "Good progress";
    readinessTone = "info";
  }

  return {
    ...trip,
    bagsCount,
    itemsCount,
    hasResults,
    overallFits,
    checklistStarted,
    travelDayConfigured,
    readinessScore,
    readinessLabel,
    readinessTone,
  };
}

export default function TripsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");

  const { refreshNotifications } = useNotifications();
  const [actionMessage, setActionMessage] = useState("");

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTrips();
      const tripsArray = Array.isArray(data) ? data : [];
      setTrips(tripsArray.map(normalizeTrip));
    } catch (err) {
      console.error("Load trips error:", err);
      setError(err?.response?.data?.message || "Failed to load trips.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadTrips);
    return unsubscribe;
  }, [navigation, loadTrips]);

  const filteredTrips = useMemo(() => {
    let result = [...trips];

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      result = result.filter((trip) => {
        const tripName = (trip.trip_name || "").toLowerCase();
        const destination = (trip.destination || "").toLowerCase();
        return tripName.includes(query) || destination.includes(query);
      });
    }

    if (filterBy === "ready") {
      result = result.filter((trip) => trip.hasResults && trip.overallFits);
    } else if (filterBy === "needs_work") {
      result = result.filter((trip) => trip.hasResults && !trip.overallFits);
    } else if (filterBy === "no_results") {
      result = result.filter((trip) => !trip.hasResults);
    }
    if (filterBy === "archived") {
      result = result.filter((trip) => (trip.status || "").toLowerCase() === "archived");
    }

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === "name_asc") {
        return (a.trip_name || "").localeCompare(b.trip_name || "");
      }
      if (sortBy === "readiness_desc") {
        return b.readinessScore - a.readinessScore;
      }
      return 0;
    });

    return result;
  }, [trips, searchTerm, sortBy, filterBy]);

  const handleDuplicateTrip = async (tripId) => {
    try {
      setError("");
      setActionMessage("");
  
      const data = await duplicateTrip(tripId);
      setActionMessage(data?.message || "Trip duplicated successfully.");
  
      await loadTrips();
      await refreshNotifications();
    } catch (err) {
      console.error("Duplicate trip error:", err);
      setError(err?.response?.data?.message || "Failed to duplicate trip.");
    }
  };
  
  const handleArchiveTrip = async (tripId) => {
    try {
      setError("");
      setActionMessage("");
  
      const data = await archiveTrip(tripId);
      setActionMessage(data?.message || "Trip archived successfully.");
  
      await loadTrips();
      await refreshNotifications();
    } catch (err) {
      console.error("Archive trip error:", err);
      setError(err?.response?.data?.message || "Failed to archive trip.");
    }
  };
  
  const handleRestoreTrip = async (tripId) => {
    try {
      setError("");
      setActionMessage("");
  
      const data = await unarchiveTrip(tripId);
      setActionMessage(data?.message || "Trip restored successfully.");
  
      await loadTrips();
      await refreshNotifications();
    } catch (err) {
      console.error("Restore trip error:", err);
      setError(err?.response?.data?.message || "Failed to restore trip.");
    }
  };

  const handleDeleteTrip = (tripId, tripName) => {
    Alert.alert(
      "Delete Trip",
      `Are you sure you want to permanently delete "${tripName || "this trip"}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setError("");
              setActionMessage("");
  
              const data = await deleteTrip(tripId);
              setActionMessage(data?.message || "Trip deleted successfully.");
  
              await loadTrips();
              await refreshNotifications();
            } catch (err) {
              console.error("Delete trip error:", err);
              setError(err?.response?.data?.message || "Failed to delete trip.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading trips...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trips</Text>
          <Text style={styles.title}>My Trips</Text>
          <Text style={styles.subtitle}>
            Search, sort, and filter your trips from one place.
          </Text>
          {actionMessage ? (
            <AppCard style={styles.successCard}>
              <Text style={styles.successText}>{actionMessage}</Text>
            </AppCard>
          ) : null}

          <View style={styles.topActionsRow}>
            <AppButton
              title="Create Trip"
              onPress={() => navigation.navigate("CreateTrip")}
              style={styles.flexButton}
            />
            <AppButton
              title="Refresh"
              variant="secondary"
              onPress={loadTrips}
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
              subtitle="Find a trip by name or destination."
            />

            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search trips..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Sort"
              subtitle="Choose how trips should be ordered."
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
                title="Readiness"
                variant={sortBy === "readiness_desc" ? "primary" : "secondary"}
                onPress={() => setSortBy("readiness_desc")}
                style={styles.filterButton}
              />

            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Filters"
              subtitle="Focus on the trips that matter right now."
            />

            <View style={styles.filtersRow}>
              <AppButton
                title="All"
                variant={filterBy === "all" ? "primary" : "secondary"}
                onPress={() => setFilterBy("all")}
                style={styles.filterButton}
              />
              <AppButton
                title="Ready"
                variant={filterBy === "ready" ? "primary" : "secondary"}
                onPress={() => setFilterBy("ready")}
                style={styles.filterButton}
              />
              <AppButton
                title="Needs Work"
                variant={filterBy === "needs_work" ? "primary" : "secondary"}
                onPress={() => setFilterBy("needs_work")}
                style={styles.filterButton}
              />
              <AppButton
                title="No Results"
                variant={filterBy === "no_results" ? "primary" : "secondary"}
                onPress={() => setFilterBy("no_results")}
                style={styles.filterButton}
              />
              <AppButton
                title="Archived"
                variant={filterBy === "archived" ? "primary" : "secondary"}
                onPress={() => setFilterBy("archived")}
                style={styles.filterButton}
              />
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Trips List"
              subtitle={`${filteredTrips.length} trip${filteredTrips.length === 1 ? "" : "s"} found.`}
            />

            {filteredTrips.length === 0 ? (
              <EmptyState
                title="No trips found"
                description="Try changing the search, sort, or filter options."
              />
            ) : (
              filteredTrips.map((trip) => (
                <AppCard key={trip.id} style={styles.tripCard}>
                  <View style={styles.tripTopRow}>
                    <View style={styles.tripTextWrap}>
                      <Text style={styles.tripTitle}>
                        {trip.trip_name || "Unnamed Trip"}
                      </Text>
                      <Text style={styles.tripSubtitle}>
                        {trip.destination || "No destination"}
                      </Text>
                    </View>

                    <StatusBadge
                      label={`${trip.readinessScore}/100`}
                      tone={trip.readinessTone}
                    />
                  </View>

                  <View style={styles.metaGroup}>
                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Status: </Text>
                      {trip.readinessLabel}
                    </Text>
                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Bags: </Text>
                      {trip.bagsCount}
                    </Text>
                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Items: </Text>
                      {trip.itemsCount}
                    </Text>
                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Results: </Text>
                      {trip.hasResults ? "Yes" : "No"}
                    </Text>
                  </View>

                  <View style={styles.actionColumn}>
                    <AppButton
                      title="Open Trip"
                      variant="secondary"
                      onPress={() =>
                        navigation.navigate("TripOverview", {
                          tripId: trip.id,
                        })
                      }
                    />

                    <AppButton
                      title="Duplicate"
                      variant="secondary"
                      onPress={() => handleDuplicateTrip(trip.id)}
                    />

                    {trip.status === "archived" ? (
                      <AppButton
                        title="Restore"
                        variant="secondary"
                        onPress={() => handleRestoreTrip(trip.id)}
                      />
                    ) : (
                      <AppButton
                        title="Archive"
                        variant="secondary"
                        onPress={() => handleArchiveTrip(trip.id)}
                      />
                    )}

                    <AppButton
                      title="Delete"
                      variant="danger"
                      onPress={() => handleDeleteTrip(trip.id, trip.trip_name)}
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
  tripCard: {
    backgroundColor: "#f8fafc",
    marginTop: spacing.sm,
  },
  tripTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  tripTextWrap: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  tripSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
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
  successCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  successText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
  },
});