"use client";

import React, { createContext, useContext, useState } from "react";
import { OnboardingState } from "@/types/onboarding";

const defaultState: OnboardingState = {
  email: "",
  year: null,
  subjects: [],
  handle: "",
  notificationsEnabled: true,
  school: "",
  schoolInitial: "",
};

interface OnboardingContextValue {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}

interface OnboardingProviderProps {
  children: React.ReactNode;
  initial?: Partial<OnboardingState>;
}

export function OnboardingProvider({ children, initial }: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState>({ ...defaultState, ...initial });

  function update(patch: Partial<OnboardingState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  return (
    <OnboardingContext.Provider value={{ state, update }}>
      {children}
    </OnboardingContext.Provider>
  );
}
