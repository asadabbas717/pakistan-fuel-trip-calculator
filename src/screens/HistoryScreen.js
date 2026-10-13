import React, { useCallback, useRef, useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { confirmAction, showMessage } from "../utils/confirmAction";
import DestructiveButton from "../components/DestructiveButton";
import Screen from "../components/Screen";
import { useThemedStyles } from "../theme/ThemeContext";
import PrimaryButton from "../components/PrimaryButton";
import {
  clearTripHistory,
  deleteTrip,
  getTripHistory,
} from "../storage/tripStorage";
import {
  exportAppBackup,
  parseBackup,
  restoreAppBackup,
} from "../services/backupService";
import { exportBackupFile, importBackupFile } from "../services/fileTransfer";
import { formatKm, formatPKR } from "../utils/formatters";

export default function HistoryScreen({ navigation }) {
  const { colors, styles } = useThemedStyles(createStyles);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [mode, setMode] = useState("merge");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getTripHistory()
        .then((trips) => {
          if (active) setHistory(trips);
        })
        .catch((error) => {
          if (active) showMessage(error.message);
        });
      return () => {
        active = false;
      };
    }, []),
  );
  async function run(action) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      showMessage(error.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function chooseBackup() {
    const file = await importBackupFile();
    if (file) {
      const data = parseBackup(file.text);
      setPending({ ...file, data });
    }
  }
  const filtered = history.filter((trip) =>
    (trip.start.name + " " + trip.destination.name)
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  function confirmRestore() {
    confirmAction(
      mode === "merge"
        ? "Merge trips and vehicles? Existing settings and duplicate records are kept. Only the latest 25 trips are retained."
        : "Replace the data included in this backup? Export your current backup first if you want to keep it.",
      () =>
        run(async () => {
          setHistory(await restoreAppBackup(pending.text, mode));
          setPending(null);
          showMessage(
            mode === "replace" && pending.data.version === 2
              ? "Backup restored. Restart the app to apply restored appearance and default trip preferences."
              : "Backup restored.",
          );
        }),
      {
        title: "Restore backup",
        label: "Restore",
        destructive: mode === "replace",
      },
    );
  }
  return (
    <Screen style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Your journeys</Text>
      <Text style={styles.subheading}>
        Your latest 25 trips, ready to revisit.
      </Text>
      <TextInput
        accessibilityLabel="Search trip history"
        placeholder="Search by starting point or destination"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
        style={[styles.backupInput, { minHeight: 48 }]}
      />
      {filtered.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {history.length
              ? "No matching journeys."
              : "Your next journey starts here."}
          </Text>
        </View>
      )}
      {filtered.map((trip) => (
        <View key={trip.id} style={styles.card}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={"View trip to " + trip.destination.name}
            onPress={() => navigation.navigate("Result", { trip })}
          >
            <Text style={styles.routeText} numberOfLines={2}>
              {trip.start.name}
            </Text>
            <Text style={styles.arrow}>↓</Text>
            <Text style={styles.routeText} numberOfLines={2}>
              {trip.destination.name}
            </Text>
            <View style={styles.row}>
              <Text style={styles.muted}>
                {formatKm(trip.result.distanceKm)}
              </Text>
              <Text style={styles.cost}>
                {formatPKR(trip.result.totalCost)}
              </Text>
            </View>
            <Text style={styles.date}>
              {new Date(trip.createdAt).toLocaleString()}
            </Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity
              accessibilityRole="button"
              style={{ paddingVertical: 14 }}
              onPress={() =>
                navigation.popTo("Home", {
                  repeatTrip: trip,
                  repeatToken: Date.now(),
                })
              }
            >
              <Text style={styles.arrow}>Plan again →</Text>
            </TouchableOpacity>
            <DestructiveButton
              accessibilityLabel={"Delete trip to " + trip.destination.name}
              disabled={busy}
              onPress={() =>
                confirmAction("Delete this saved trip?", () =>
                  run(async () => setHistory(await deleteTrip(trip.id))),
                )
              }
            />
          </View>
        </View>
      ))}
      {!!history.length && (
        <DestructiveButton
          title="Clear History"
          disabled={busy}
          onPress={() =>
            confirmAction("Delete all saved trip history?", () =>
              run(async () => {
                await clearTripHistory();
                setHistory([]);
              }),
            )
          }
        />
      )}
      <View style={styles.card}>
        <Text style={styles.routeText}>Keep your journeys safe</Text>
        <Text style={styles.subheading}>
          One private file for trips, vehicles, prices and preferences. No cloud
          account required. Backups contain your locations.
        </Text>
        <PrimaryButton
          title="Export backup file"
          variant="outline"
          disabled={busy}
          onPress={() =>
            run(async () => exportBackupFile(await exportAppBackup()))
          }
        />
        <PrimaryButton
          title="Choose backup file"
          disabled={busy}
          onPress={() => run(chooseBackup)}
        />
        {pending && (
          <>
            <Text style={styles.routeText}>{pending.name}</Text>
            <Text style={styles.subheading}>
              {pending.data.trips.length} trips
              {pending.data.version === 2
                ? ", " +
                  pending.data.vehicles.length +
                  " vehicles, prices and preferences"
                : " · legacy history backup"}
              . Validated and ready to restore.
            </Text>
            <View style={styles.row}>
              {["merge", "replace"].map((option) => (
                <TouchableOpacity
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: mode === option }}
                  disabled={busy}
                  onPress={() => setMode(option)}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor:
                      mode === option ? colors.primaryLight : colors.card,
                  }}
                >
                  <Text style={styles.routeText}>
                    {option === "merge" ? "Merge" : "Replace"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton
              title="Restore backup"
              loading={busy}
              onPress={confirmRestore}
            />
            <PrimaryButton
              title="Cancel import"
              variant="outline"
              disabled={busy}
              onPress={() => setPending(null)}
            />
          </>
        )}
      </View>
    </Screen>
  );
}
const createStyles = (colors) =>
  StyleSheet.create({
    backupInput: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginVertical: 10,
      color: colors.text,
    },
    container: {
      backgroundColor: colors.background,
    },
    content: {
      padding: 18,
    },
    heading: {
      fontSize: 25,
      fontWeight: "900",
      color: colors.primary,
    },
    subheading: {
      color: colors.muted,
      marginTop: 6,
      marginBottom: 14,
    },
    emptyCard: {
      backgroundColor: colors.card,
      padding: 30,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    emptyText: {
      color: colors.muted,
      fontWeight: "700",
    },
    card: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    routeText: {
      color: colors.text,
      fontWeight: "800",
    },
    arrow: {
      color: colors.primary,
      fontSize: 18,
      fontWeight: "900",
      marginVertical: 3,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    muted: {
      color: colors.muted,
      fontWeight: "700",
    },
    cost: {
      color: colors.success,
      fontWeight: "900",
      fontSize: 16,
    },
    date: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 8,
    },
  });
