import { StyleSheet } from "react-native";

export const colors = {
  background: "#101315",
  surface: "#1b2023",
  ink: "#f0f2f1",
  muted: "#abb2b6",
  faint: "#717c83",
  rule: "#343d42",
  platinum: "#e4e9eb",
  darkInk: "#202b31",
  success: "#c1d6c7",
  warning: "#dfc69c",
  error: "#efb9b1",
};
export const fonts = { body: "Archivo", heading: "ArchivoExpanded" };
export const type = StyleSheet.create({
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -1.2,
    color: colors.ink,
    fontWeight: "600",
  },
  heading: {
    fontFamily: fonts.body,
    fontSize: 23,
    lineHeight: 29,
    color: colors.ink,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
  },
  muted: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.5,
    color: colors.muted,
  },
});
