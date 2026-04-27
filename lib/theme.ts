export interface Theme {
  bg:            string;
  surface:       string;
  primary:       string;
  primaryBg:     string;
  textPrimary:   string;
  textSecondary: string;
  textMuted:     string;
  border:        string;
  surfaceAlt:    string;
  warningBg:     string;
  warning:       string;
  dangerBg:      string;
  danger:        string;
  shadow:        string;
}

export const light: Theme = {
  bg:            "#F4F6F4",
  surface:       "#FFFFFF",
  primary:       "#00853F",
  primaryBg:     "#E8F5EE",
  textPrimary:   "#1A2E1F",
  textSecondary: "#5A7A63",
  textMuted:     "#9BB0A0",
  border:        "#D8E8DC",
  surfaceAlt:    "#F4F6F4",
  warningBg:     "#FFF4E5",
  warning:       "#E07B00",
  dangerBg:      "#FDECEA",
  danger:        "#C41230",
  shadow:        "#1A2E1F",
};

export const dark: Theme = {
  bg:            "#0D1710",
  surface:       "#172419",
  primary:       "#00853F",
  primaryBg:     "#1A3525",
  textPrimary:   "#E8F5EE",
  textSecondary: "#7AAB85",
  textMuted:     "#4A6A54",
  border:        "#253D2C",
  surfaceAlt:    "#111F15",
  warningBg:     "#2A1800",
  warning:       "#E07B00",
  dangerBg:      "#280A0F",
  danger:        "#C41230",
  shadow:        "#000000",
};
