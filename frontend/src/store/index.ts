// src/store/index.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import type { PreloadedState } from 'redux';
import { apiSlice } from './apiSlice'; // adjust path if needed
// import uiReducer from './uiSlice' // example non-RTKQ slice

// Build the root reducer (you can add more non-RTKQ slices here)
const rootReducer = combineReducers({
  // Use the same key as your apiSlice.reducerPath (usually 'api')
  api: apiSlice.reducer,
  // ui: uiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Only allow preloading of YOUR slices (exclude RTK Query's 'api' cache)
type AppPreloadedState = PreloadedState<Omit<RootState, 'api'>>;

export function setupStore(preloadedState?: AppPreloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    // Let RTK infer middleware types; just append the RTK Query middleware
    middleware: (getDefault) => getDefault().concat(apiSlice.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });
}

// App singleton store for <Provider>
export const store = setupStore();

// Strong types you can import anywhere
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
