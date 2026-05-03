import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { createTrip, getAirlines } from "../../api/tripApi";

const TRAVEL_TYPES = [
  { key: "casual", label: "Casual" },
  { key: "business", label: "Business" },
  { key: "family", label: "Family" },
  { key: "beach", label: "Beach" },
  { key: "winter", label: "Winter" },
];

const WEATHER_TYPES = [
  { key: "hot", label: "Hot" },
  { key: "cold", label: "Cold" },
  { key: "mild", label: "Mild" },
  { key: "mixed", label: "Mixed" },
];

const PACKING_MODES = [
  { key: "light", label: "Light" },
  { key: "balanced", label: "Balanced" },
  { key: "max_capacity", label: "Max Capacity" },
];

function buildDurationDays(startDate, endDate) {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays <= 0) return null;
  return diffDays;
}

export default function NewTripScreen({ navigation }) {
  const [tripName, setTripName] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);


  const [travelerCount, setTravelerCount] = useState("1");
  const [travelType, setTravelType] = useState("casual");
  const [weatherType, setWeatherType] = useState("mixed");
  const [packingMode, setPackingMode] = useState("balanced");
  const [notes, setNotes] = useState("");

  const [airlines, setAirlines] = useState([]);
  const [airlinesLoaded, setAirlinesLoaded] = useState(false);
  const [selectedAirlineId, setSelectedAirlineId] = useState(null);

  const [loadingAirlines, setLoadingAirlines] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const durationDays = useMemo(() => {
    return buildDurationDays(startDate, endDate);
  }, [startDate, endDate]);

  const loadAirlines = async () => {
    try {
      if (airlinesLoaded) return;

      setLoadingAirlines(true);
      const data = await getAirlines();
      const safeAirlines = Array.isArray(data) ? data : [];
      setAirlines(safeAirlines);
      setAirlinesLoaded(true);

      if (safeAirlines.length > 0 && !selectedAirlineId) {
        setSelectedAirlineId(safeAirlines[0].id);
      }
    } catch (err) {
      console.error("Load airlines error:", err);
      setError(err?.response?.data?.message || "Failed to load airlines.");
    } finally {
      setLoadingAirlines(false);
    }
  };

  const handleCreateTrip = async () => {
    try {
      setError("");

      if (!tripName.trim() && !destinationCity.trim()) {
        setError("Please enter at least a trip name or destination city.");
        return;
      }

      if (!startDate.trim() || !endDate.trim()) {
        setError("Please enter both start date and end date.");
        return;
      }

      if (!durationDays) {
        setError("Please enter valid travel dates.");
        return;
      }

      setSubmitting(true);

      const destination =
        `${destinationCity.trim()}${
          destinationCity.trim() && destinationCountry.trim() ? ", " : ""
        }${destinationCountry.trim()}` || null;

      const payload = {
        tripName: tripName.trim() || destinationCity.trim() || "New Trip",
        destination,
        destinationCity: destinationCity.trim() || null,
        destinationCountry: destinationCountry.trim() || null,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        durationDays,
        travelType,
        tripType: travelType,
        weatherType,
        travelerCount: Number(travelerCount || 1),
        airlineId: selectedAirlineId || null,
        packingMode,
        notes: notes.trim() || null,
        status: "draft",
      };

      const response = await createTrip(payload);
      const newTripId = response?.tripId || response?.id;

      if (!newTripId) {
        throw new Error("Trip was created but no tripId was returned.");
      }

      navigation.navigate("TripsTab", {
        screen: "SuitcaseSetup",
        params: { tripId: newTripId },
      });
      
    } catch (err) {
      console.error("Create trip error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create trip."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>PackSmart vNext</Text>
          <Text style={styles.title}>Create New Trip</Text>
          <Text style={styles.subtitle}>
            Start the trip first, then continue to suitcase setup.
          </Text>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Trip Basics"
              subtitle="Enter the core trip information."
            />

            <Text style={styles.label}>Trip Name</Text>
            <TextInput
              value={tripName}
              onChangeText={setTripName}
              placeholder="Example: Milan Weekend"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={styles.label}>Destination City</Text>
            <TextInput
              value={destinationCity}
              onChangeText={setDestinationCity}
              placeholder="Example: Milan"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={styles.label}>Destination Country</Text>
            <TextInput
              value={destinationCountry}
              onChangeText={setDestinationCountry}
              placeholder="Example: Italy"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={styles.label}>Start Date</Text>
            <Pressable
            onPress={() => setShowStartPicker(true)}
            style={styles.input}
            >
            <Text style={{ color: startDate ? colors.text : "#9ca3af" }}>
                {startDate || "Select start date"}
            </Text>
            </Pressable>

            {showStartPicker && (
                <DateTimePicker
                value={startDate ? new Date(startDate) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()} // 👈 HERE
                onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate) {
                    const formatted = selectedDate.toISOString().split("T")[0];
                    setStartDate(formatted);
                    }
                }}
                />
            )}


            <Text style={styles.label}>End Date</Text>
            <Pressable
            onPress={() => setShowEndPicker(true)}
            style={styles.input}
            >
            <Text style={{ color: endDate ? colors.text : "#9ca3af" }}>
                {endDate || "Select end date"}
            </Text>
            </Pressable>

            {showEndPicker && (
            <DateTimePicker
                value={endDate ? new Date(endDate) : new Date()}
                mode="date"
                display="default"
                minimumDate={startDate ? new Date(startDate) : new Date()} // 👈 HERE
                onChange={(event, selectedDate) => {
                    setShowEndPicker(false);
                    if (selectedDate) {
                    const formatted = selectedDate.toISOString().split("T")[0];
                    setEndDate(formatted);
                    }
                }}
            />
            )}

            <Text style={styles.label}>Traveler Count</Text>
            <TextInput
              value={travelerCount}
              onChangeText={setTravelerCount}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <View style={styles.inlineMeta}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Calculated Duration: </Text>
                {durationDays ? `${durationDays} days` : "—"}
              </Text>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Trip Style"
              subtitle="Choose the travel context."
            />

            <Text style={styles.label}>Travel Type</Text>
            <View style={styles.chipWrap}>
              {TRAVEL_TYPES.map((item) => (
                <AppButton
                  key={item.key}
                  title={item.label}
                  variant={travelType === item.key ? "primary" : "secondary"}
                  onPress={() => setTravelType(item.key)}
                  style={styles.chipButton}
                />
              ))}
            </View>

            <Text style={styles.label}>Weather Type</Text>
            <View style={styles.chipWrap}>
              {WEATHER_TYPES.map((item) => (
                <AppButton
                  key={item.key}
                  title={item.label}
                  variant={weatherType === item.key ? "primary" : "secondary"}
                  onPress={() => setWeatherType(item.key)}
                  style={styles.chipButton}
                />
              ))}
            </View>

            <Text style={styles.label}>Packing Mode</Text>
            <View style={styles.chipWrap}>
              {PACKING_MODES.map((item) => (
                <AppButton
                  key={item.key}
                  title={item.label}
                  variant={packingMode === item.key ? "primary" : "secondary"}
                  onPress={() => setPackingMode(item.key)}
                  style={styles.chipButton}
                />
              ))}
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Airline"
              subtitle="Optional now, but useful for baggage rules later."
            />

            {!airlinesLoaded ? (
              <AppButton
                title={loadingAirlines ? "Loading Airlines..." : "Load Airlines"}
                onPress={loadAirlines}
                loading={loadingAirlines}
              />
            ) : airlines.length === 0 ? (
              <Text style={styles.emptyText}>No airlines found.</Text>
            ) : (
              <View style={styles.airlineList}>
                {airlines.map((airline) => {
                  const isSelected = airline.id === selectedAirlineId;
                  return (
                    <Pressable
                      key={airline.id}
                      onPress={() => setSelectedAirlineId(airline.id)}
                      style={[
                        styles.airlineRow,
                        isSelected && styles.airlineRowSelected,
                      ]}
                    >
                      <View style={styles.airlineTextWrap}>
                        <Text style={styles.airlineTitle}>
                          {airline.name || airline.airline_name || `Airline #${airline.id}`}
                        </Text>
                        {airline.code ? (
                          <Text style={styles.airlineSubtitle}>{airline.code}</Text>
                        ) : null}
                      </View>

                      <View
                        style={[
                          styles.radioDot,
                          isSelected && styles.radioDotSelected,
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Notes"
              subtitle="Optional extra notes for this trip."
            />

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Example: Need one formal outfit"
              placeholderTextColor="#9ca3af"
              multiline
              style={[styles.input, styles.textArea]}
            />
          </AppCard>

          <AppButton
            title="Create Trip and Continue"
            onPress={handleCreateTrip}
            loading={submitting}
            style={styles.submitButton}
          />

          <AppButton
            title="Back"
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
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
  kicker: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.secondary,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inlineMeta: {
    marginTop: spacing.md,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chipButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  airlineList: {
    gap: spacing.sm,
  },
  airlineRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  airlineRowSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f8fbff",
  },
  airlineTextWrap: {
    flex: 1,
  },
  airlineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  airlineSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  radioDotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});