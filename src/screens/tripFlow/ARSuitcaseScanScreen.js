import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";

import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { createTripBag } from "../../api/tripApi";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function calculateVolumeCm3(lengthCm, widthCm, heightCm) {
  const l = toNumber(lengthCm);
  const w = toNumber(widthCm);
  const h = toNumber(heightCm);

  if (!l || !w || !h) return 0;
  return l * w * h;
}

function getRuleLabel(rule = {}) {
  const bagType = String(rule?.bag_type || "").toLowerCase();

  if (bagType === "personal_item") return "Personal Item";
  if (bagType === "carry_on") return "Carry-On";
  if (bagType === "checked_medium") return "Checked Bag";
  if (bagType === "checked_large") return "Large Checked Bag";

  return rule?.name || rule?.rule_name || "Airline Rule";
}

function getValidationState(scanned, allowed) {
  if (!allowed) return null;

  const lengthOk = toNumber(scanned.lengthCm) <= toNumber(allowed.length_cm || 0);
  const widthOk = toNumber(scanned.widthCm) <= toNumber(allowed.width_cm || 0);
  const heightOk = toNumber(scanned.heightCm) <= toNumber(allowed.height_cm || 0);

  const overallOk = lengthOk && widthOk && heightOk;

  return {
    overallOk,
    lengthOk,
    widthOk,
    heightOk,
  };
}

export default function ARSuitcaseScanScreen({ route, navigation }) {
  const { tripId, selectedAirlineId, selectedRule } = route.params || {};

  const [scanMode, setScanMode] = useState("manual");
  const [suitcaseName, setSuitcaseName] = useState("My Suitcase");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [maxWeightKg, setMaxWeightKg] = useState(
    selectedRule?.max_weight_kg ? String(selectedRule.max_weight_kg) : ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const volumeCm3 = useMemo(() => {
    return calculateVolumeCm3(lengthCm, widthCm, heightCm);
  }, [lengthCm, widthCm, heightCm]);

  const validation = useMemo(() => {
    return getValidationState(
      {
        lengthCm,
        widthCm,
        heightCm,
      },
      selectedRule
    );
  }, [lengthCm, widthCm, heightCm, selectedRule]);

  const validationText = useMemo(() => {
    if (!selectedRule || !validation) return null;

    if (validation.overallOk) {
      return {
        type: "success",
        text: "This suitcase currently fits within the selected airline baggage rule.",
      };
    }

    const problems = [];
    if (!validation.lengthOk) problems.push("length");
    if (!validation.widthOk) problems.push("width");
    if (!validation.heightOk) problems.push("height");

    return {
      type: "danger",
      text: `This suitcase is larger than the airline allowance in: ${problems.join(
        ", "
      )}.`,
    };
  }, [selectedRule, validation]);

  const handleUseRulePrefill = () => {
    if (!selectedRule) return;

    setLengthCm(String(selectedRule.length_cm || ""));
    setWidthCm(String(selectedRule.width_cm || ""));
    setHeightCm(String(selectedRule.height_cm || ""));
    if (selectedRule.max_weight_kg) {
      setMaxWeightKg(String(selectedRule.max_weight_kg));
    }

    setActionMessage("Airline baggage dimensions copied into the suitcase form.");
    setError("");
  };

  const handleFakeScanFill = () => {
    if (selectedRule) {
      setLengthCm(String(selectedRule.length_cm || ""));
      setWidthCm(String(selectedRule.width_cm || ""));
      setHeightCm(String(selectedRule.height_cm || ""));
      setMaxWeightKg(String(selectedRule.max_weight_kg || ""));
      setActionMessage(
        "Demo scan completed. Airline rule dimensions were used as a scan placeholder."
      );
    } else {
      setLengthCm("55");
      setWidthCm("35");
      setHeightCm("23");
      setMaxWeightKg("10");
      setActionMessage("Demo scan completed with sample cabin bag dimensions.");
    }

    setError("");
  };

  const handleSaveSuitcase = async () => {
    try {
      setError("");
      setActionMessage("");

      if (!tripId) {
        setError("Trip ID is missing.");
        return;
      }

      if (!suitcaseName.trim()) {
        setError("Please enter a suitcase name.");
        return;
      }

      if (!toNumber(lengthCm) || !toNumber(widthCm) || !toNumber(heightCm)) {
        setError("Please enter valid suitcase dimensions.");
        return;
      }

      if (!toNumber(maxWeightKg)) {
        setError("Please enter a valid max weight.");
        return;
      }

      setSaving(true);

      await createTripBag(tripId, {
        suitcaseType: "custom",
        name: suitcaseName.trim(),
        volumeCm3,
        maxWeightKg: toNumber(maxWeightKg),
        lengthCm: toNumber(lengthCm),
        widthCm: toNumber(widthCm),
        heightCm: toNumber(heightCm),
        isCustom: true,
        bagRole:
          selectedRule?.bag_type === "personal_item"
            ? "personal"
            : selectedRule?.bag_type === "carry_on"
            ? "carry_on"
            : "main",
        isPrimary: true,
      });

      Alert.alert(
        "Suitcase Saved",
        validationText?.type === "danger"
          ? "Your suitcase was saved, but it appears larger than the selected airline allowance."
          : "Your scanned suitcase was saved successfully.",
        [
          {
            text: "Continue",
            onPress: () =>
              navigation.navigate("SmartInventory", {
                tripId,
              }),
          },
        ]
      );
    } catch (err) {
      console.error("Save AR suitcase error:", err);
      setError(err?.response?.data?.message || "Failed to save suitcase.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkipToInventory = () => {
    if (!tripId) {
      setError("Trip ID is missing.");
      return;
    }

    navigation.navigate("SmartInventory", { tripId });
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>PackSmart vNext</Text>
          <Text style={styles.title}>AR Suitcase Scan</Text>
          <Text style={styles.subtitle}>
            This is the foundation screen for scanning or manually entering your real suitcase dimensions.
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
              title="Scan Mode"
              subtitle="Choose how you want to provide the suitcase dimensions."
            />

            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setScanMode("manual")}
                style={[
                  styles.modeCard,
                  scanMode === "manual" && styles.modeCardSelected,
                ]}
              >
                <Text style={styles.modeTitle}>Manual</Text>
                <Text style={styles.modeSubtitle}>
                  Enter dimensions yourself
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setScanMode("camera_placeholder")}
                style={[
                  styles.modeCard,
                  scanMode === "camera_placeholder" && styles.modeCardSelected,
                ]}
              >
                <Text style={styles.modeTitle}>AR / Camera</Text>
                <Text style={styles.modeSubtitle}>
                  Placeholder until real scan
                </Text>
              </Pressable>
            </View>
          </AppCard>

          {selectedRule ? (
            <AppCard>
              <SectionHeader
                title="Selected Airline Rule"
                subtitle="Compare your real suitcase with the allowed baggage size."
              />

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Rule: </Text>
                {getRuleLabel(selectedRule)}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Allowed Size: </Text>
                {selectedRule.length_cm} × {selectedRule.width_cm} × {selectedRule.height_cm} cm
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Max Weight: </Text>
                {selectedRule.max_weight_kg || 0} kg
              </Text>

              <AppButton
                title="Use Airline Dimensions"
                variant="secondary"
                onPress={handleUseRulePrefill}
                style={styles.topButton}
              />
            </AppCard>
          ) : null}

          {scanMode === "camera_placeholder" ? (
            <AppCard>
              <SectionHeader
                title="AR Scan Placeholder"
                subtitle="This will later become the live AR suitcase scanner."
              />

              <View style={styles.cameraPlaceholder}>
                <View style={styles.scanFrame}>
                  <Text style={styles.scanFrameText}>Suitcase Frame Overlay</Text>
                </View>
              </View>

              <Text style={styles.placeholderText}>
                Later here we will use camera + AR measurement.  
                For now, press the demo button to simulate a scan result.
              </Text>

              <AppButton
                title="Run Demo Scan"
                onPress={handleFakeScanFill}
              />
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Suitcase Dimensions"
              subtitle="Enter or confirm the final suitcase size."
            />

            <Text style={styles.label}>Suitcase Name</Text>
            <TextInput
              value={suitcaseName}
              onChangeText={setSuitcaseName}
              placeholder="Example: Cabin Trolley"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={styles.label}>Length (cm)</Text>
            <TextInput
              value={lengthCm}
              onChangeText={setLengthCm}
              keyboardType="decimal-pad"
              placeholder="55"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={styles.label}>Width (cm)</Text>
            <TextInput
              value={widthCm}
              onChangeText={setWidthCm}
              keyboardType="decimal-pad"
              placeholder="35"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
              placeholder="23"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={styles.label}>Max Weight (kg)</Text>
            <TextInput
              value={maxWeightKg}
              onChangeText={setMaxWeightKg}
              keyboardType="decimal-pad"
              placeholder="10"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <View style={styles.metricsCard}>
              <Text style={styles.metricsTitle}>Calculated Volume</Text>
              <Text style={styles.metricsValue}>
                {volumeCm3 ? volumeCm3.toLocaleString() : 0} cm³
              </Text>
            </View>
          </AppCard>

          {validationText ? (
            <AppCard
              style={
                validationText.type === "danger"
                  ? styles.validationDangerCard
                  : styles.validationSuccessCard
              }
            >
              <Text
                style={
                  validationText.type === "danger"
                    ? styles.validationDangerText
                    : styles.validationSuccessText
                }
              >
                {validationText.text}
              </Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Next Step"
              subtitle="Save this suitcase and continue to Smart Inventory."
            />

            <View style={styles.actionsColumn}>
              <AppButton
                title="Save Suitcase and Continue"
                onPress={handleSaveSuitcase}
                loading={saving}
              />

              <AppButton
                title="Continue Without Saving"
                variant="secondary"
                onPress={handleSkipToInventory}
              />

              <AppButton
                title="Back to Suitcase Setup"
                variant="secondary"
                onPress={() => navigation.goBack()}
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
  modeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: "#fff",
  },
  modeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f8fbff",
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  modeSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  topButton: {
    marginTop: spacing.sm,
  },
  cameraPlaceholder: {
    height: 260,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  scanFrame: {
    width: "70%",
    height: "65%",
    borderWidth: 2,
    borderColor: "#38bdf8",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrameText: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "700",
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.md,
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
  metricsCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricsTitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
  },
  metricsValue: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  validationDangerCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
  },
  validationDangerText: {
    color: "#c2410c",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  validationSuccessCard: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
  },
  validationSuccessText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
});