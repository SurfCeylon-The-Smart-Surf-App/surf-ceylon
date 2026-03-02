import React from "react";
import CardioPlansScreen from "../../components/CardioPlansScreen";
import { CardioProfileProvider } from "../../context/CardioProfileContext";

export default function CardioPlans() {
  return (
    <CardioProfileProvider>
      <CardioPlansScreen />
    </CardioProfileProvider>
  );
}
