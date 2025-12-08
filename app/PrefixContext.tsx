"use client";

import { createContext, useContext } from "react";

export const PrefixContext = createContext("/mobile");

export const usePrefix = () => useContext(PrefixContext);
