import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTrips } from "../../api/tripApi";

export default function TripsListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTrips();
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load trips error:", err);
      setError(err?.response?.data?.message || "Failed to load trips.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadTrips();
    });

    return unsubscribe;
  }, [navigation, loadTrips]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  return (
    <AppScreen>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Trips</Text>
            <Text style={styles.subtitle}>
              Your real trips from the PackSmart backend
            </Text>
          </View>

          <Pressable
            style={styles.createButton}
            onPress={() => navigation.navigate("CreateTrip")}
          >
            <Text style={styles.createButtonText}>+ New</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.helperText}>Loading trips...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBlock}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadTrips}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.centerBlock}>
            <Text style={styles.helperText}>No trips found yet.</Text>
          </View>
        ) : (
          trips.map((trip) => (
            <Pressable
              key={trip.id}
              style={styles.tripCard}
              onPress={() =>
                navigation.navigate("TripOverview", {
                  tripId: trip.id,
                })
              }
            >
              <Text style={styles.tripCardTitle}>
                {trip.trip_name || "Unnamed Trip"}
              </Text>
              <Text style={styles.tripCardSubtitle}>
                {trip.destination || "No destination"} •{" "}
                {trip.duration_days
                  ? `${trip.duration_days} days`
                  : "No duration"}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  centerBlock: {
    marginTop: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    marginTop: spacing.md,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  tripCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  tripCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  tripCardSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
});