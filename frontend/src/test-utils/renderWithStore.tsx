import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { AppProviders } from "@/AppProviders";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
        <AppProviders>
            {children}
        </AppProviders>
    </Provider>
);

export const renderHookWithStore = <T,>(hook: () => T) =>
    renderHook(hook, { wrapper });