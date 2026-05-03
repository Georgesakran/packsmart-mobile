import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";

import AppScreen from "../../components/common/AppScreen";
import AppButton from "../../components/common/AppButton";
import AppCard from "../../components/common/AppCard";
import EmptyState from "../../components/common/EmptyState";
import SectionHeader from "../../components/common/SectionHeader";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import {
  createTripBag,
  getAirlines,
  getAirlineBaggageRules,
  getTripById,
  getTripSuitcases,
} from "../../api/tripApi";

function getRuleLabel(rule = {}) {
  const bagType = String(rule.bag_type || "").toLowerCase();

  if (bagType === "personal_item") return "Personal Item";
  if (bagType === "carry_on") return "Carry-On";
  if (bagType === "checked_medium") return "Checked Bag";
  if (bagType === "checked_large") return "Large Checked Bag";

  return rule.name || rule.rule_name || bagType || "Bag Rule";
}

function buildBagNameFromRule(rule = {}) {
  const label = getRuleLabel(rule);
  const weight = rule.max_weight_kg ? ` ${rule.max_weight_kg}kg` : "";
  return `${label}${weight}`;
}

function buildVolumeCm3(rule = {}) {
  const length = Number(rule.max_length_cm || 0);
  const width = Number(rule.max_width_cm || 0);
  const height = Number(rule.max_height_cm || 0);

  if (!length || !width || !height) return 0;
  return length * width * height;
}

function normalizeAirlines(rows = []) {
  return rows.map((airline) => ({
    id: airline.id,
    name:
      airline.name ||
      airline.airline_name ||
      airline.code ||
      `Airline #${airline.id}`,
    code: airline.code || null,
  }));
}

function normalizeRules(rows = []) {
  return rows.map((rule) => ({
    ...rule,
    id: rule.id,
    bag_type: rule.bag_type || rule.bagType || "carry_on",
    length_cm: Number(rule.max_length_cm || 0),
    width_cm: Number(rule.max_width_cm || 0),
    height_cm: Number(rule.max_height_cm || 0),
    max_weight_kg: Number(rule.max_weight_kg || 0),
  }));
}

export default function SuitcaseSetupScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);

  const [airlines, setAirlines] = useState([]);
  const [selectedAirlineId, setSelectedAirlineId] = useState(null);

  const [rulesLoading, setRulesLoading] = useState(false);
  const [rules, setRules] = useState([]);
  const [selectedRuleId, setSelectedRuleId] = useState(null);

  const [existingSuitcases, setExistingSuitcases] = useState([]);
  const [savingRuleBag, setSavingRuleBag] = useState(false);

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!tripId) {
          setError("Trip ID is missing. Please open this flow from a trip.");
          return;
        }

        const [tripData, airlinesData, suitcasesData] = await Promise.all([
          getTripById(tripId),
          getAirlines(),
          getTripSuitcases(tripId),
        ]);

        const safeAirlines = normalizeAirlines(
          Array.isArray(airlinesData) ? airlinesData : []
        );

        setTrip(tripData || null);
        setAirlines(safeAirlines);
        setExistingSuitcases(Array.isArray(suitcasesData) ? suitcasesData : []);

        const tripAirlineId = tripData?.airline_id || null;
        if (tripAirlineId) {
          setSelectedAirlineId(tripAirlineId);
        } else if (safeAirlines.length > 0) {
          setSelectedAirlineId(safeAirlines[0].id);
        }
      } catch (err) {
        console.error("Load suitcase setup error:", err);
        setError(
          err?.response?.data?.message || "Failed to load suitcase setup."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId]);

  useEffect(() => {
    const loadRules = async () => {
      try {
        if (!selectedAirlineId) {
          setRules([]);
          setSelectedRuleId(null);
          return;
        }

        setRulesLoading(true);
        setError("");

        const rulesData = await getAirlineBaggageRules(selectedAirlineId);
        const safeRules = normalizeRules(Array.isArray(rulesData) ? rulesData : []);

        setRules(safeRules);

        const preferredCarryOn =
          safeRules.find((rule) => rule.bag_type === "carry_on") ||
          safeRules[0] ||
          null;

        setSelectedRuleId(preferredCarryOn?.id || null);
      } catch (err) {
        console.error("Load airline rules error:", err);
        setError(
          err?.response?.data?.message || "Failed to load airline bag rules."
        );
        setRules([]);
        setSelectedRuleId(null);
      } finally {
        setRulesLoading(false);
      }
    };

    loadRules();
  }, [selectedAirlineId]);

  const selectedAirline = useMemo(() => {
    return airlines.find((airline) => airline.id === selectedAirlineId) || null;
  }, [airlines, selectedAirlineId]);

  const selectedRule = useMemo(() => {
    return rules.find((rule) => rule.id === selectedRuleId) || null;
  }, [rules, selectedRuleId]);

  const hasExistingSuitcases = existingSuitcases.length > 0;

  const handleUseAllowedSize = async () => {
    try {
      if (!tripId) {
        setError("Trip ID is missing.");
        return;
      }

      if (!selectedRule) {
        setError("Please select a baggage rule first.");
        return;
      }

      setSavingRuleBag(true);
      setError("");
      setActionMessage("");

      const volumeCm3 = buildVolumeCm3(selectedRule);

      await createTripBag(tripId, {
        suitcaseType: "preset",
        name: buildBagNameFromRule(selectedRule),
        volumeCm3,
        maxWeightKg: Number(selectedRule.max_weight_kg || 0),
        lengthCm: Number(selectedRule.max_length_cm || 0),
        widthCm: Number(selectedRule.max_width_cm || 0),
        heightCm: Number(selectedRule.max_height_cm || 0),
        isCustom: false,
        bagRole:
          selectedRule.bag_type === "personal_item"
            ? "personal"
            : selectedRule.bag_type === "carry_on"
            ? "carry_on"
            : "main",
        isPrimary: !hasExistingSuitcases,
      });

      setActionMessage("Airline baggage size saved to this trip.");

      navigation.navigate("SmartInventory", {
        tripId,
      });
    } catch (err) {
      console.error("Save airline baggage rule error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to save the airline baggage size."
      );
    } finally {
      setSavingRuleBag(false);
    }
  };

  const handleGoToARScan = () => {
    if (!tripId) {
      setError("Trip ID is missing.");
      return;
    }

    navigation.navigate("ARSuitcaseScan", {
      tripId,
      selectedAirlineId,
      selectedRule,
    });
  };

  const handleContinueWithoutSaving = () => {
    if (!tripId) {
      setError("Trip ID is missing.");
      return;
    }

    Alert.alert(
      "Continue without suitcase?",
      "You can continue to inventory now, but packing simulation will need suitcase dimensions later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => navigation.navigate("SmartInventory", { tripId }),
        },
      ]
    );
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading suitcase setup...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>PackSmart vNext</Text>
          <Text style={styles.title}>Suitcase Setup</Text>
          <Text style={styles.subtitle}>
            Choose airline baggage limits or scan your real suitcase with AR.
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
              title="Trip"
              subtitle="The suitcase setup belongs to this trip."
            />

            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Trip: </Text>
              {trip?.trip_name || "Unnamed Trip"}
            </Text>

            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Destination: </Text>
              {trip?.destination || "—"}
            </Text>

            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Duration: </Text>
              {trip?.duration_days || 0} day
              {Number(trip?.duration_days || 0) === 1 ? "" : "s"}
            </Text>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Choose Airline"
              subtitle="Pick the airline to load baggage rules automatically."
            />

            {airlines.length === 0 ? (
              <EmptyState
                title="No airlines found"
                description="No airline records are available yet."
              />
            ) : (
              <View style={styles.optionsColumn}>
                {airlines.map((airline) => {
                  const isSelected = airline.id === selectedAirlineId;

                  return (
                    <Pressable
                      key={airline.id}
                      onPress={() => setSelectedAirlineId(airline.id)}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                      ]}
                    >
                      <View style={styles.optionTextWrap}>
                        <Text style={styles.optionTitle}>{airline.name}</Text>
                        {airline.code ? (
                          <Text style={styles.optionSubtitle}>{airline.code}</Text>
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
              title="Airline Rules"
              subtitle="Select which baggage allowance you want to use for this trip."
            />

            {rulesLoading ? (
              <View style={styles.centerInline}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.helperTextSmall}>Loading airline rules...</Text>
              </View>
            ) : rules.length === 0 ? (
              <EmptyState
                title="No baggage rules found"
                description="This airline does not have baggage rules in the database yet."
              />
            ) : (
              <View style={styles.optionsColumn}>
                {rules.map((rule) => {
                  const isSelected = rule.id === selectedRuleId;

                  return (
                    <Pressable
                      key={rule.id}
                      onPress={() => setSelectedRuleId(rule.id)}
                      style={[
                        styles.ruleCard,
                        isSelected && styles.ruleCardSelected,
                      ]}
                    >
                      <View style={styles.ruleHeader}>
                        <Text style={styles.ruleTitle}>{getRuleLabel(rule)}</Text>
                        <View
                          style={[
                            styles.radioDot,
                            isSelected && styles.radioDotSelected,
                          ]}
                        />
                      </View>

                      <Text style={styles.ruleMeta}>
                        {rule.length_cm} × {rule.width_cm} × {rule.height_cm} cm
                      </Text>

                      <Text style={styles.ruleMeta}>
                        Max weight: {rule.max_weight_kg || 0} kg
                      </Text>

                      <Text style={styles.ruleMetaSecondary}>
                        Volume: {buildVolumeCm3(rule).toLocaleString()} cm³
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Choose Setup Mode"
              subtitle="Start with airline limits or scan your real suitcase."
            />

            {selectedAirline ? (
              <Text style={styles.modeHint}>
                Selected airline: <Text style={styles.modeHintStrong}>{selectedAirline.name}</Text>
              </Text>
            ) : null}

            {selectedRule ? (
              <Text style={styles.modeHint}>
                Selected rule: <Text style={styles.modeHintStrong}>{getRuleLabel(selectedRule)}</Text>
              </Text>
            ) : null}

            <View style={styles.actionsColumn}>
              <AppButton
                title="Use Airline Allowed Size"
                onPress={handleUseAllowedSize}
                loading={savingRuleBag}
                disabled={!selectedRule}
              />

              <AppButton
                title="Scan My Suitcase with AR"
                variant="secondary"
                onPress={handleGoToARScan}
              />

              <AppButton
                title="Continue to Smart Inventory"
                variant="secondary"
                onPress={handleContinueWithoutSaving}
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
  centerInline: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  helperText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 15,
  },
  helperTextSmall: {
    color: colors.textMuted,
    fontSize: 14,
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
  optionsColumn: {
    gap: spacing.sm,
  },
  optionCard: {
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
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f8fbff",
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  optionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  ruleCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: "#fff",
    gap: 6,
  },
  ruleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f8fbff",
  },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  ruleTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  ruleMeta: {
    fontSize: 14,
    color: colors.text,
  },
  ruleMetaSecondary: {
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
  modeHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  modeHintStrong: {
    color: colors.text,
    fontWeight: "700",
  },
  actionsColumn: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});