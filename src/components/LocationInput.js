import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useThemedStyles } from "../theme/ThemeContext";
import { searchPlace } from "../services/geocodingService";

export default function LocationInput({ label, placeholder, value, onSelect }) {
  const { colors, styles } = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const generation = useRef(0);
  const editing = useRef(false);
  useEffect(() => {
    if (value) {
      setQuery(value.name);
      editing.current = false;
    } else if (!editing.current) setQuery("");
    generation.current += 1;
    setResults([]);
    setLoading(false);
    return () => {
      generation.current += 1;
    };
  }, [value]);

  function changeQuery(text) {
    editing.current = true;
    generation.current += 1;
    setQuery(text);
    setResults([]);
    setLoading(false);
    onSelect(null);
  }

  useEffect(() => {
    const request = ++generation.current;
    setResults([]);
    setMessage("");
    setLoading(false);
    if (query.trim().length < 3 || query === value?.name) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const places = await searchPlace(query, { signal: controller.signal });
        if (request !== generation.current) return;
        setResults(places);
        if (!places.length)
          setMessage(
            "No matches. Try a nearby town or a more specific address.",
          );
      } catch (error) {
        if (request === generation.current && !controller.signal.aborted)
          setMessage(error.message + " You can also enter distance manually.");
      } finally {
        if (request === generation.current) setLoading(false);
      }
    }, 750);
    return () => {
      clearTimeout(timer);
      controller.abort();
      generation.current += 1;
    };
  }, [query, value?.name]);

  function handleSelect(place) {
    editing.current = false;
    generation.current += 1;
    onSelect(place);
    setQuery(place.name);
    setResults([]);
    setMessage("");
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={[
            styles.input,
            focused && {
              borderColor: colors.primary,
              backgroundColor: colors.card,
            },
          ]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          value={query}
          accessibilityLabel={label}
          onChangeText={changeQuery}
          maxLength={200}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          multiline
        />

        {loading && <ActivityIndicator color={colors.primary} size="small" />}
      </View>

      {!!message && (
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {message}
        </Text>
      )}
      {!value && query.length < 3 && (
        <Text style={styles.message}>
          Type at least 3 characters. Choose a suggestion below.
        </Text>
      )}
      {results.map((item) => (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={"Select " + item.name}
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

const createStyles = (colors) =>
  StyleSheet.create({
    message: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 8,
    },
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
      minHeight: 56,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: colors.input,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: colors.text,
    },
    resultItem: {
      minHeight: 48,
      justifyContent: "center",
      backgroundColor: colors.card,
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
