import { lightTheme, type Theme } from "@rainbow-me/rainbowkit";

const base = lightTheme({ borderRadius: "medium", fontStack: "system", overlayBlur: "small" });
const NO_SHADOW = "none";

/** RainbowKit's modal in Monid's paint (tokens by reference, packages/brand/tokens/paint.css). */
export const rainbowKitTheme: Theme = {
  ...base,
  colors: {
    ...base.colors,
    accentColor: "var(--ak-accent)",
    accentColorForeground: "#ffffff",
    actionButtonBorder: "var(--ak-line)",
    actionButtonSecondaryBackground: "var(--ak-bg-muted)",
    closeButton: "var(--ak-ink-2)",
    closeButtonBackground: "var(--ak-bg-muted)",
    connectButtonBackground: "var(--ak-bg)",
    connectButtonInnerBackground: "var(--ak-bg-muted)",
    connectButtonText: "var(--ak-ink)",
    connectionIndicator: "var(--ak-success)",
    generalBorder: "var(--ak-line)",
    generalBorderDim: "var(--ak-line)",
    menuItemBackground: "var(--ak-bg-muted)",
    modalBackground: "var(--ak-bg)",
    modalBorder: "var(--ak-line)",
    modalText: "var(--ak-ink)",
    modalTextDim: "var(--ak-muted)",
    modalTextSecondary: "var(--ak-ink-2)",
    profileAction: "var(--ak-bg-muted)",
    profileActionHover: "var(--ak-line)",
    profileForeground: "var(--ak-bg)",
    selectedOptionBorder: "var(--ak-accent)",
  },
  fonts: { body: "var(--font-inter)" },
  radii: {
    actionButton: "var(--radius-md)",
    connectButton: "var(--radius-md)",
    menuButton: "var(--radius-md)",
    modal: "var(--radius-lg)",
    modalMobile: "var(--radius-lg)",
  },
  shadows: { ...base.shadows, connectButton: NO_SHADOW, profileDetailsAction: NO_SHADOW },
};
