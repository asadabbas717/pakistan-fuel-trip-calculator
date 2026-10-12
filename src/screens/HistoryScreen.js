import React, { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  Share,
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { confirmAction } from "../utils/confirmAction";
import colors from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import {
  clearTripHistory,
  getTripHistory,
  exportTripHistory,
  restoreTripHistory,
} from "../storage/tripStorage";
import { formatKm, formatPKR } from "../utils/formatters";

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const restoringRef = useRef(false);
  const [backupText, setBackupText] = useState("");
  const [restoring, setRestoring] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, []),
  );

  async function loadHistory() {
    try {
      const trips = await getTripHistory();
      setHistory(trips);
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleClear() {
    try {
      await clearTripHistory();
      setHistory([]);
      alert("Trip history cleared.");
    } catch (error) {
      alert(error.message);
    }
  }

  function openTrip(trip) {
    navigation.navigate("Result", {
      trip,
    });
  }

  async function exportBackup() {
    try {
      const backup = await exportTripHistory();
      setBackupText(backup);
      if (Platform.OS === "web") {
        alert(
          "Your backup is shown below. Copy and save the complete JSON text privately.",
        );
        return;
      }
      await Share.share({
        message: backup,
        title: "FuelTrip PK history backup",
      });
    } catch (error) {
      alert(error.message || "Unable to export history.");
    }
  }
  async function restoreBackup() {
    if (restoringRef.current) return;
    restoringRef.current = true;
    setRestoring(true);
    try {
      setHistory(await restoreTripHistory(backupText));
      setBackupText("");
      alert("Trip history restored.");
    } catch (error) {
      alert(error.message || "Unable to restore history.");
    } finally {
      restoringRef.current = false;
      setRestoring(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Trip History</Text>
      <Text style={styles.subheading}>
        Your last 25 calculated trips are saved on this device.
      </Text>

      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No trip history found.</Text>
        </View>
      ) : (
        history.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            style={styles.card}
            onPress={() => openTrip(trip)}
          >
            <Text style={styles.routeText} numberOfLines={1}>
              {trip.start.name}
            </Text>

            <Text style={styles.arrow}>↓</Text>

            <Text style={styles.routeText} numberOfLines={1}>
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
        ))
      )}

      {history.length > 0 && (
        <PrimaryButton
          title="Clear History"
          disabled={restoring}
          onPress={() =>
            confirmAction("Delete all saved trip history?", handleClear)
          }
          variant="outline"
        />
      )}
      <View style={styles.card}>
        <Text style={styles.routeText}>History backup</Text>
        <Text style={styles.muted}>
          Backups contain your route locations. Save them privately. Restoring
          replaces history; vehicle profiles and fuel prices stay unchanged.
        </Text>
        <PrimaryButton
          title="Export History Backup"
          onPress={exportBackup}
          variant="outline"
          disabled={restoring}
        />
        <TextInput
          accessibilityLabel="History backup JSON"
          multiline
          style={styles.backupInput}
          value={backupText}
          onChangeText={setBackupText}
          editable={!restoring}
          maxLength={2_000_000}
          placeholder="Paste your FuelTrip PK history backup JSON"
        />
        <PrimaryButton
          title="Restore History Backup"
          loading={restoring}
          disabled={!backupText.trim()}
          onPress={() =>
            confirmAction(
              "Replace saved trip history with this backup? Export your current history first if you want to keep it.",
              restoreBackup,
            )
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
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
