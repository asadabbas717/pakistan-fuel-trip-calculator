import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import colors from "../theme/colors";
import { searchPlace } from "../services/geocodingService";

export default function LocationInput({ label, placeholder, value, onSelect }) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    try {
      setLoading(true);
      setResults([]);

      const places = await searchPlace(query);
      setResults(places);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(place) {
    onSelect(place);
    setQuery(place.name);
    setResults([]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          multiline
        />

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {results.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.resultItem}
          onPress={() => handleSelect(item)}
        >
          <Text style={styles.resultText}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "700",
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  searchText: {
    color: "#fff",
    fontWeight: "700",
  },
  resultItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  resultText: {
    color: colors.text,
    fontSize: 13,
  },
});