import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
  getItemFoldProfiles,
  getItemSizeProfiles,
  updateTripItemProfile,
} from "../../api/tripApi";

function prettifyToken(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function TripItemProfileEditorScreen({ route, navigation }) {
  const { tripId, tripItem } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [sizeProfiles, setSizeProfiles] = useState([]);
  const [foldProfiles, setFoldProfiles] = useState([]);
  const [selectedSizeCode, setSelectedSizeCode] = useState(
    tripItem?.size_code || tripItem?.resolved_size_code || null
  );
  const [selectedFoldType, setSelectedFoldType] = useState(
    tripItem?.fold_type || tripItem?.resolved_fold_type || null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const itemId = tripItem?.item_id || tripItem?.itemId || null;
  const itemName =
    tripItem?.custom_name ||
    tripItem?.base_item_name ||
    tripItem?.displayName ||
    tripItem?.name ||
    "Item";

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        setError("");

        if (!itemId) {
          setSizeProfiles([]);
          setFoldProfiles([]);
          return;
        }

        const [sizes, folds] = await Promise.all([
          getItemSizeProfiles(itemId),
          getItemFoldProfiles(itemId),
        ]);

        const safeSizes = Array.isArray(sizes) ? sizes : [];
        const safeFolds = Array.isArray(folds) ? folds : [];

        setSizeProfiles(safeSizes);
        setFoldProfiles(safeFolds);

        if (!selectedSizeCode) {
          const defaultSize = safeSizes.find((profile) => Number(profile.is_default) === 1);
          if (defaultSize) {
            setSelectedSizeCode(defaultSize.size_code);
          }
        }

        if (!selectedFoldType) {
          const defaultFold = safeFolds.find((profile) => Number(profile.is_default) === 1);
          if (defaultFold) {
            setSelectedFoldType(defaultFold.fold_type);
          }
        }
      } catch (err) {
        console.error("Load item profiles error:", err);
        setError(err?.response?.data?.message || "Failed to load item profiles.");
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [itemId]);

  const selectedSizeProfile = useMemo(() => {
    return sizeProfiles.find((profile) => profile.size_code === selectedSizeCode) || null;
  }, [sizeProfiles, selectedSizeCode]);

  const selectedFoldProfile = useMemo(() => {
    return (
      foldProfiles.find((profile) => profile.fold_type === selectedFoldType) || null
    );
  }, [foldProfiles, selectedFoldType]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateTripItemProfile(tripId, tripItem.id, {
        sizeCode: selectedSizeCode,
        foldType: selectedFoldType,
      });

      setSuccessMessage("Item size and fold profile updated successfully.");

      navigation.goBack();
    } catch (err) {
      console.error("Update trip item profile error:", err);
      setError(
        err?.response?.data?.message || "Failed to update item profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading item profiles...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip Items / Profile</Text>
          <Text style={styles.title}>Edit Item Profile</Text>
          <Text style={styles.subtitle}>
            Choose the best size and fold type for more accurate packing results.
          </Text>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          {successMessage ? (
            <AppCard style={styles.successCard}>
              <Text style={styles.successText}>{successMessage}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Item Context"
              subtitle="This is the item you are updating."
            />

            <View style={styles.metaGroup}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Item: </Text>
                {itemName}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Category: </Text>
                {tripItem?.category || "misc"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Current Size: </Text>
                {tripItem?.size_code ||
                  tripItem?.resolved_size_code ||
                  "Not selected"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Current Fold: </Text>
                {prettifyToken(
                  tripItem?.fold_type || tripItem?.resolved_fold_type || "not selected"
                )}
              </Text>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Size Profiles"
              subtitle="Pick the most accurate size for this item."
            />

            {sizeProfiles.length === 0 ? (
              <EmptyState
                title="No size profiles available"
                description="This item does not have size profiles yet."
              />
            ) : (
              sizeProfiles.map((profile) => {
                const selected = selectedSizeCode === profile.size_code;

                return (
                  <View key={profile.id} style={styles.optionCard}>
                    <View style={styles.optionHeader}>
                      <View style={styles.optionTextWrap}>
                        <Text style={styles.optionTitle}>
                          Size {profile.size_code}
                        </Text>
                        <Text style={styles.optionSubtitle}>
                          {Number(profile.base_volume_cm3 || 0)} cm³ •{" "}
                          {Number(profile.base_weight_g || 0)} g
                        </Text>
                      </View>

                      <View style={styles.badgesColumn}>
                        {Number(profile.is_default) === 1 ? (
                          <StatusBadge label="Default" tone="info" />
                        ) : null}

                        {selected ? (
                          <StatusBadge label="Selected" tone="success" />
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.metaGroup}>
                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Dimensions: </Text>
                        {profile.base_length_cm || "—"} × {profile.base_width_cm || "—"} ×{" "}
                        {profile.base_height_cm || "—"} cm
                      </Text>
                    </View>

                    <AppButton
                      title={selected ? "Selected" : "Choose Size"}
                      variant={selected ? "secondary" : "primary"}
                      onPress={() => setSelectedSizeCode(profile.size_code)}
                    />
                  </View>
                );
              })
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Fold Profiles"
              subtitle="Pick the best fold type for the current packing strategy."
            />

            {foldProfiles.length === 0 ? (
              <EmptyState
                title="No fold profiles available"
                description="This item does not have fold profiles yet."
              />
            ) : (
              foldProfiles.map((profile) => {
                const selected = selectedFoldType === profile.fold_type;

                return (
                  <View key={profile.id} style={styles.optionCard}>
                    <View style={styles.optionHeader}>
                      <View style={styles.optionTextWrap}>
                        <Text style={styles.optionTitle}>
                          {prettifyToken(profile.fold_type)}
                        </Text>
                        <Text style={styles.optionSubtitle}>
                          {profile.folded_volume_cm3
                            ? `${Number(profile.folded_volume_cm3)} cm³`
                            : profile.volume_multiplier
                            ? `Multiplier ${profile.volume_multiplier}`
                            : "No fold volume data"}
                        </Text>
                      </View>

                      <View style={styles.badgesColumn}>
                        {Number(profile.is_default) === 1 ? (
                          <StatusBadge label="Default" tone="info" />
                        ) : null}

                        {selected ? (
                          <StatusBadge label="Selected" tone="success" />
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.metaGroup}>
                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Folded Dimensions: </Text>
                        {profile.folded_length_cm || "—"} ×{" "}
                        {profile.folded_width_cm || "—"} ×{" "}
                        {profile.folded_height_cm || "—"} cm
                      </Text>
                    </View>

                    <AppButton
                      title={selected ? "Selected" : "Choose Fold"}
                      variant={selected ? "secondary" : "primary"}
                      onPress={() => setSelectedFoldType(profile.fold_type)}
                    />
                  </View>
                );
              })
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Selection Preview"
              subtitle="Review the chosen size and fold before saving."
            />

            <View style={styles.metaGroup}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Selected Size: </Text>
                {selectedSizeCode || "Not selected"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Selected Fold: </Text>
                {prettifyToken(selectedFoldType || "not selected")}
              </Text>

              {selectedSizeProfile ? (
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Selected Size Volume: </Text>
                  {Number(selectedSizeProfile.base_volume_cm3 || 0)} cm³
                </Text>
              ) : null}

              {selectedFoldProfile?.folded_volume_cm3 ? (
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Selected Fold Volume: </Text>
                  {Number(selectedFoldProfile.folded_volume_cm3 || 0)} cm³
                </Text>
              ) : null}
            </View>

            <View style={styles.actionsColumn}>
              <AppButton
                title="Save Item Profile"
                onPress={handleSave}
                loading={saving}
              />

              <AppButton
                title="Back"
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
  optionCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  badgesColumn: {
    gap: 6,
    alignItems: "flex-end",
  },
  actionsColumn: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});