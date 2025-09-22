// src/store/index.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';

// Build the root reducer (add more non-RTKQ slices here)
const rootReducer = combineReducers({
  // Use the same key as your apiSlice.reducerPath (usually 'api')
  api: apiSlice.reducer,
  // ui: uiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Tiny helper so preloadedState can be partial/deeply optional
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// Only allow preloading of YOUR slices (exclude RTK Query's 'api' cache)
type AppPreloadedState = DeepPartial<Omit<RootState, 'api'>>;

export function setupStore(preloadedState?: AppPreloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().concat(apiSlice.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });
}

// App singleton store for <Provider>
export const store = setupStore();

// Strong types you can import anywhere
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
