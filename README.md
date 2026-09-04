# FuelTrip PK

A practical React Native mobile application for estimating trip fuel cost in Pakistan using route distance, vehicle efficiency, and configurable fuel prices.

## Engineering Highlights

- Retrieves the user's current location with Expo Location
- Searches locations and geocodes places using OpenStreetMap-based services
- Calculates route distance through OSRM
- Separates route distance, fuel-consumption, and cost calculations
- Stores vehicle averages and trip history locally
- Supports one-way and return-trip estimates
- Allows manual fuel-price updates instead of hard-coding a permanently stale price
- Shares trip-cost results from the mobile application
- Uses a responsive React Native interface suitable for Android development and Expo testing

## Features

- Select Petrol or Diesel
- Use current location as starting point
- Search starting and destination locations
- Calculate route distance
- Estimate fuel required from vehicle average
- Calculate estimated trip fuel cost
- Return-trip calculation
- Save vehicle averages
- View trip history
- Share trip-cost results

## Tech Stack

- React Native
- Expo
- JavaScript
- Expo Location
- OpenStreetMap
- OSRM Routing API
- Nominatim Geocoding
- React Navigation
- Expo FileSystem / local storage
- React Native WebView

## How It Works

```text
Fuel Needed = Distance / Vehicle Average
Total Cost  = Fuel Needed × Fuel Price Per Litre
```

The application obtains or searches the origin and destination, determines a route distance, applies the vehicle's fuel average, and calculates an estimated fuel expense.

## Run Locally

```bash
git clone https://github.com/asadabbas717/pakistan-fuel-trip-calculator.git
cd pakistan-fuel-trip-calculator
npm install
npx expo start
```

Required packages can be installed with:

```bash
npx expo install expo-location react-native-webview react-native-screens react-native-safe-area-context expo-file-system
npm install @react-navigation/native @react-navigation/native-stack
```

## Scope and Limitations

Fuel cost is an estimate. Actual consumption can vary with traffic, route conditions, vehicle condition, driving style, and the fuel price in effect at the time of travel.

The project intentionally allows manual fuel-price updates rather than presenting a bundled price as permanently current.

## Future Improvements

- Vehicle profiles
- Multiple-route comparison
- Optional cloud synchronization
- Traffic-aware estimates
- Automated fuel-price sourcing from a reliable current data provider

## Author

Developed by **Asad Abbas**.
