import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

import { createTrip, getAirlines } from "../../api/tripApi";

import TripBasicsStep from "../../components/tripWizard/TripBasicsStep";
import TripDatesStep from "../../components/tripWizard/TripDatesStep";
import TripTravelersStep from "../../components/tripWizard/TripTravelersStep";
import TripStyleStep from "../../components/tripWizard/TripStyleStep";
import TripAirlineStep from "../../components/tripWizard/TripAirlineStep";
import TripPackingModeStep from "../../components/tripWizard/TripPackingModeStep";
import TripReviewStep from "../../components/tripWizard/TripReviewStep";

const TOTAL_STEPS = 7;

const initialForm = {
  tripName: "",
  destinationCity: "",
  destinationCountry: "",
  startDate: "",
  endDate: "",
  durationDays: 0,
  travelerCount: 1,
  tripType: "casual",
  airlineId: null,
  packingMode: "balanced",
};

function calculateDurationDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 0;

  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export default function CreateTripWizardScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [airlines, setAirlines] = useState([]);
  const [loadingAirlines, setLoadingAirlines] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAirlines = async () => {
      try {
        setLoadingAirlines(true);
        const data = await getAirlines();
        setAirlines(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Load airlines error:", err);
        setError(err?.response?.data?.message || "Failed to load airlines.");
      } finally {
        setLoadingAirlines(false);
      }
    };

    loadAirlines();
  }, []);

  useEffect(() => {
    const durationDays = calculateDurationDays(form.startDate, form.endDate);
    setForm((prev) => ({
      ...prev,
      durationDays,
    }));
  }, [form.startDate, form.endDate]);

  const progressPercent = useMemo(() => {
    return Math.round((step / TOTAL_STEPS) * 100);
  }, [step]);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateCurrentStep = () => {
    setError("");

    if (step === 1) {
      if (!form.destinationCity.trim() || !form.destinationCountry.trim()) {
        setError("Destination city and country are required.");
        return false;
      }
    }

    if (step === 2) {
      if (!form.startDate || !form.endDate) {
        setError("Start date and end date are required.");
        return false;
      }

      if (form.durationDays <= 0) {
        setError("End date must be the same day or after start date.");
        return false;
      }
    }

    if (step === 3) {
      if (!form.travelerCount || Number(form.travelerCount) < 1) {
        setError("Traveler count must be at least 1.");
        return false;
      }
    }

    if (step === 4) {
      if (!form.tripType) {
        setError("Trip type is required.");
        return false;
      }
    }

    if (step === 6) {
      if (!form.packingMode) {
        setError("Packing mode is required.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setError("");
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");

      const payload = {
        tripName:
          form.tripName?.trim() ||
          `${form.destinationCity} ${form.durationDays || ""}-Day Trip`.trim(),
        destinationCity: form.destinationCity,
        destinationCountry: form.destinationCountry,
        startDate: form.startDate,
        endDate: form.endDate,
        durationDays: form.durationDays,
        travelerCount: Number(form.travelerCount || 1),
        tripType: form.tripType,
        airlineId: form.airlineId,
        packingMode: form.packingMode,
        status: "draft",
      };

      const result = await createTrip(payload);
      const tripId = result?.tripId || result?.data?.tripId;

      navigation.navigate("BagRecommendation", { tripId });
    } catch (err) {
      console.error("Create trip wizard submit error:", err);
      setError(err?.response?.data?.message || "Failed to create trip.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    if (loadingAirlines && step === 5) {
      return (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading airlines...</Text>
        </View>
      );
    }

    switch (step) {
      case 1:
        return <TripBasicsStep form={form} updateField={updateField} />;
      case 2:
        return <TripDatesStep form={form} updateField={updateField} />;
      case 3:
        return <TripTravelersStep form={form} updateField={updateField} />;
      case 4:
        return <TripStyleStep form={form} updateField={updateField} />;
      case 5:
        return (
          <TripAirlineStep
            form={form}
            updateField={updateField}
            airlines={airlines}
          />
        );
      case 6:
        return <TripPackingModeStep form={form} updateField={updateField} />;
      case 7:
        return <TripReviewStep form={form} airlines={airlines} />;
      default:
        return null;
    }
  };

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <Text style={styles.kicker}>Trips / New Setup</Text>
            <Text style={styles.title}>Create New Trip</Text>
            <Text style={styles.subtitle}>
              Step {step} of {TOTAL_STEPS}
            </Text>

            <AppCard>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{progressPercent}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </AppCard>

            {error ? (
              <AppCard style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </AppCard>
            ) : null}

            {renderStep()}

            <AppCard>
              <View style={styles.actionsRow}>
                <AppButton
                  title="Back"
                  variant="secondary"
                  onPress={handleBack}
                  disabled={step === 1 || submitting}
                  style={styles.flexButton}
                />

                {step < TOTAL_STEPS ? (
                  <AppButton
                    title="Next"
                    onPress={handleNext}
                    disabled={submitting}
                    style={styles.flexButton}
                  />
                ) : (
                  <AppButton
                    title="Create Trip"
                    onPress={handleSubmit}
                    loading={submitting}
                    style={styles.flexButton}
                  />
                )}
              </View>
            </AppCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  actionsRow: {
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
  centerBlock: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  helperText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 15,
  },
});