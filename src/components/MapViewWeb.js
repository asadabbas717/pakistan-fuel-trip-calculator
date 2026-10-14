import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Platform,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { useThemedStyles } from "../theme/ThemeContext";
import { validLocation, validCoordinates } from "../utils/validation";
import { mapPreviewHtml } from "../services/mapPreviewService";

function MapViewWeb({ start, destination, routeCoordinates }) {
  const { colors, styles } = useThemedStyles(createStyles);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("loading");
  const timer = useRef(null);
  const source = useMemo(() => {
    if (
      Platform.OS === "web" ||
      !validLocation(start) ||
      !validLocation(destination) ||
      !validCoordinates(routeCoordinates)
    )
      return null;
    return { html: mapPreviewHtml(start, destination, routeCoordinates) };
  }, [start, destination, routeCoordinates]);
  useEffect(() => {
    setStatus("loading");
    if (!source) return;
    timer.current = setTimeout(() => setStatus("slow"), 12000);
    return () => clearTimeout(timer.current);
  }, [source, attempt]);
  function onMessage(event) {
    let message;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message.type === "map-error" || message.type === "tiles-error") {
      clearTimeout(timer.current);
      setStatus("error");
    } else if (message.type === "tiles-ready") {
      clearTimeout(timer.current);
      setStatus("ready");
    } else if (message.type === "map-ready")
      setStatus((previous) => (previous === "loading" ? "tiles" : previous));
  }
  function fail() {
    clearTimeout(timer.current);
    setStatus("error");
  }
  function allowNavigation({ url }) {
    if (url === "about:blank") return true;
    try {
      const link = new URL(url);
      if (
        link.protocol === "https:" &&
        ["www.openstreetmap.org", "leafletjs.com"].includes(link.hostname)
      )
        Linking.openURL(url).catch(() => {});
    } catch {
      /* Ignore unknown navigation. */
    }
    return false;
  }
  if (Platform.OS === "web")
    return (
      <Text style={styles.note}>
        Map preview is available in the Android and iOS app. Use Open directions
        to view this journey on a map.
      </Text>
    );
  if (!source) return null;
  const failed = status === "error" || status === "slow";
  return (
    <View style={styles.frame}>
      <View style={styles.container}>
        <WebView
          key={attempt}
          originWhitelist={["about:blank"]}
          onShouldStartLoadWithRequest={allowNavigation}
          source={source}
          onMessage={onMessage}
          onError={fail}
          onHttpError={fail}
          onRenderProcessGone={fail}
          onContentProcessDidTerminate={fail}
          userAgent="SafarWise/1.0 (https://github.com/asadabbas717/pakistan-fuel-trip-calculator)"
          cacheEnabled
          style={styles.webview}
        />
      </View>
      {status !== "ready" && (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          {!failed && <ActivityIndicator size="small" color={colors.primary} />}
          <Text style={styles.note}>
            {failed
              ? "Map tiles are unavailable or taking too long. Your trip estimate is still ready."
              : status === "tiles"
                ? "Route ready · loading map tiles…"
                : "Preparing map…"}
          </Text>
          {failed && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Retry map preview"
              onPress={() => setAttempt((previous) => previous + 1)}
              style={styles.retry}
            >
              <Text style={styles.retryText}>Retry map</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
export default memo(MapViewWeb);
const createStyles = (colors) =>
  StyleSheet.create({
    frame: { marginVertical: 10 },
    container: {
      height: 280,
      borderRadius: 26,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    webview: { flex: 1 },
    feedback: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
    },
    note: { color: colors.muted, fontSize: 12, lineHeight: 18, flexShrink: 1 },
    retry: {
      padding: 12,
      backgroundColor: colors.primaryLight,
      borderRadius: 12,
    },
    retryText: { color: colors.primary, fontWeight: "700" },
  });
