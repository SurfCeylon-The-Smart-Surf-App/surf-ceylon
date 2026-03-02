import React from "react";
import CardioPlanHistoryScreen from "../components/CardioPlanHistoryScreen.jsx";
import { CardioProfileProvider } from "../context/CardioProfileContext";

export default function CardioHistory() {
  return (
    <CardioProfileProvider>
      <CardioPlanHistoryScreen />
    </CardioProfileProvider>
  );
}
