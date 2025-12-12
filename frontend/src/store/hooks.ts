// store/hooks.ts
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./index"; // <- wherever your store exports AppDispatch

export const useAppDispatch = () => useDispatch<AppDispatch>();
