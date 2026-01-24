import React from "react";

export type TeamSymbolId =
  | "bucks" | "bulls" | "celtics" | "knicks" | "heat"
  | "raptors" | "magic" | "hawks" | "pacers" | "wizards"
  | "hornets" | "nets" | "sixers" | "pistons" | "cavaliers"
  | "timberwolves" | "thunder" | "nuggets" | "warriors" | "rockets"
  | "lakers" | "suns" | "grizzlies" | "mavericks" | "pelicans"
  | "jazz" | "blazers" | "spurs" | "kings" | "clippers";

const baseProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
};

export const nbaSymbols: Record<TeamSymbolId, React.ReactNode> = {

  /* ===== EAST ===== */

  bucks: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M10 30 C30 5, 70 5, 90 30" />
    </svg>
  ),

  bulls: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M10 10 L50 30 L90 10" />
    </svg>
  ),

  celtics: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M50 5 A15 15 0 1 1 35 20" />
      <path {...baseProps} d="M50 5 A15 15 0 1 0 65 20" />
    </svg>
  ),

  knicks: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M50 5 L50 35" />
      <path {...baseProps} d="M30 20 A20 20 0 0 1 70 20" />
    </svg>
  ),

  heat: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M50 5 C65 20, 55 35, 50 35 C45 35, 35 20, 50 5" />
    </svg>
  ),

  raptors: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M30 5 L20 35" />
      <path {...baseProps} d="M50 5 L40 35" />
      <path {...baseProps} d="M70 5 L60 35" />
    </svg>
  ),

  magic: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M20 30 C40 10, 60 10, 80 30" />
    </svg>
  ),

  hawks: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M10 30 L50 10 L90 30" />
    </svg>
  ),

  pacers: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M30 10 A20 20 0 0 0 70 10" />
    </svg>
  ),

  wizards: (
    <svg viewBox="0 0 100 40">
      <circle cx="50" cy="20" r="12" {...baseProps} />
      <path {...baseProps} d="M50 5 L50 0" />
    </svg>
  ),

  hornets: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M50 5 L50 35" />
      <path {...baseProps} d="M45 30 L50 35 L55 30" />
    </svg>
  ),

  nets: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M30 10 L70 30" />
      <path {...baseProps} d="M70 10 L30 30" />
    </svg>
  ),

  sixers: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M50 5 L50 35" />
      <circle cx="50" cy="20" r="10" {...baseProps} />
    </svg>
  ),

  pistons: (
    <svg viewBox="0 0 100 40">
      <rect x="45" y="5" width="10" height="30" {...baseProps} />
    </svg>
  ),

  cavaliers: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M50 5 L35 35 L65 35 Z" />
    </svg>
  ),

  /* ===== WEST ===== */

  timberwolves: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M40 5 L30 35" />
      <path {...baseProps} d="M60 5 L70 35" />
    </svg>
  ),

  thunder: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M30 5 L55 20 L45 35 L70 15" />
    </svg>
  ),

  nuggets: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M20 30 L40 10 L60 30 L80 10" />
    </svg>
  ),

  warriors: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M20 25 C40 5, 60 5, 80 25" />
    </svg>
  ),

  rockets: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M50 35 L50 5" />
    </svg>
  ),

  lakers: (
    <svg viewBox="0 0 100 40">
      <circle cx="50" cy="20" r="14" {...baseProps} />
    </svg>
  ),

  suns: (
    <svg viewBox="0 0 100 40">
      <circle cx="50" cy="20" r="8" {...baseProps} />
      <path {...baseProps} d="M50 0 L50 8" />
    </svg>
  ),

  grizzlies: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M30 5 L30 35" />
      <path {...baseProps} d="M50 5 L50 35" />
      <path {...baseProps} d="M70 5 L70 35" />
    </svg>
  ),

  mavericks: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M20 30 L50 10 L80 30" />
    </svg>
  ),

  pelicans: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M30 20 L70 15 L30 30" />
    </svg>
  ),

  jazz: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M20 20 C30 10, 40 30, 50 20 C60 10, 70 30, 80 20" />
    </svg>
  ),

  blazers: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M30 10 L70 30" />
    </svg>
  ),

  spurs: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M50 20 L50 5" />
      <path {...baseProps} d="M50 20 L65 30" />
      <path {...baseProps} d="M50 20 L35 30" />
    </svg>
  ),

  kings: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M30 30 L40 10 L50 30 L60 10 L70 30" />
    </svg>
  ),

  clippers: (
    <svg viewBox="0 0 100 40">
      <path {...baseProps} d="M20 20 C40 5, 60 5, 80 20" />
    </svg>
  ),
};
