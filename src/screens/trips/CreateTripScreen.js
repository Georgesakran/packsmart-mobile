import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { createTrip } from "../../api/tripApi";
import { useNotifications } from "../../context/NotificationsContext";


export default function CreateTripScreen({ navigation }) {
  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [travelType, setTravelType] = useState("casual");
  const [weatherType, setWeatherType] = useState("mixed");
  const [travelerCount, setTravelerCount] = useState("1");
  const { refreshNotifications } = useNotifications();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreateTrip = async () => {
    try {
      setSubmitting(true);
      setError("");

      const data = await createTrip({
        tripName,
        destination,
        durationDays: Number(durationDays),
        travelType,
        weatherType,
        travelerCount: Number(travelerCount),
      });
      await refreshNotifications();


      const createdTrip =
        data?.trip || data?.data || data;

      const tripId = createdTrip?.id;
      if (!tripId) {
        navigation.goBack();
        return;
      }

      navigation.replace("TripOverview", {
        tripId,
      });
    } catch (err) {
      console.error("Create trip error:", err);
      setError(
        err?.response?.data?.message || "Failed to create trip."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trips / Create</Text>
          <Text style={styles.title}>Create New Trip</Text>
          <Text style={styles.subtitle}>
            Start a new packing journey directly from your mobile app.
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Trip Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Summer Barcelona Trip"
              value={tripName}
              onChangeText={setTripName}
            />

            <Text style={styles.label}>Destination</Text>
            <TextInput
              style={styles.input}
              placeholder="Barcelona"
              value={destination}
              onChangeText={setDestination}
            />

            <Text style={styles.label}>Duration (days)</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              keyboardType="numeric"
              value={durationDays}
              onChangeText={setDurationDays}
            />

            <Text style={styles.label}>Travel Type</Text>
            <View style={styles.chipsRow}>
              {["casual", "business", "beach"].map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.chip,
                    travelType === type && styles.chipActive,
                  ]}
                  onPress={() => setTravelType(type)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      travelType === type && styles.chipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Weather</Text>
            <View style={styles.chipsRow}>
              {["hot", "mixed", "cold"].map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.chip,
                    weatherType === type && styles.chipActive,
                  ]}
                  onPress={() => setWeatherType(type)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      weatherType === type && styles.chipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Traveler Count</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              keyboardType="numeric"
              value={travelerCount}
              onChangeText={setTravelerCount}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={styles.primaryButton}
              onPress={handleCreateTrip}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Trip</Text>
              )}
            </Pressable>
          </View>
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
  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#e5e7eb",
  },
  chipActive: {
    backgroundColor: "#dbeafe",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textTransform: "capitalize",
  },
  chipTextActive: {
    color: "#1d4ed8",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.md,
  },
});