# FuelTrip PK - React Native Expo App

FuelTrip PK is a React Native Expo mobile app that helps users calculate the estimated fuel cost for a trip in Pakistan. The user can select fuel type, enter their vehicle average, choose starting point and destination, and the app calculates the estimated fuel required and total trip cost.

## Features

* Select Petrol or Diesel
* Use current location as starting point
* Search starting and destination locations
* Get route distance using free OpenStreetMap-based services
* Calculate fuel required based on vehicle average
* Calculate total fuel cost using Pakistan fuel prices
* Manual fuel price update option
* Return trip cost calculation
* Save vehicle averages
* View trip history
* Share trip cost result
* Clean and responsive mobile UI

## Tech Stack

* React Native
* Expo
* JavaScript
* Expo Location
* OpenStreetMap
* OSRM Routing API
* Nominatim Geocoding
* React Navigation
* Expo FileSystem / Local Storage
* React Native WebView

## Project Purpose

This project was created as a practical React Native portfolio app. It solves a real-world problem for Pakistani users by estimating fuel expenses before travelling. The app focuses on mobile development concepts such as location access, API integration, routing, local storage, form handling, and cost calculation.

## Installation

```bash
git clone https://github.com/your-username/fueltrip-pk-react-native.git
cd fueltrip-pk-react-native
npm install
npx expo start
```

## Required Dependencies

```bash
npx expo install expo-location react-native-webview react-native-screens react-native-safe-area-context expo-file-system
npm install @react-navigation/native @react-navigation/native-stack
```

## How It Works

1. User selects fuel type.
2. User enters vehicle fuel average.
3. User selects starting point and destination.
4. App gets route distance.
5. App calculates fuel required.
6. App calculates estimated fuel cost.
7. User can save or share the result.

## Formula Used

```txt
Fuel Needed = Distance / Vehicle Average

Total Cost = Fuel Needed × Fuel Price Per Litre
```

## Note

This app uses free OpenStreetMap-based services. Distance and fuel cost are estimates and may vary depending on traffic, road conditions, vehicle condition, driving style, and actual fuel prices.

## Future Improvements

* User authentication
* Cloud-based saved trips
* Admin panel for fuel price updates
* Multiple route comparison
* Traffic-based cost estimation
* Vehicle profile management
* Dark mode support

## Author

Developed by Asad Abbas.
