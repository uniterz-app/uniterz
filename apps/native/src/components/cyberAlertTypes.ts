export type CyberAlertButtonStyle = "default" | "cancel" | "destructive";

export type CyberAlertButton = {
  text: string;
  style?: CyberAlertButtonStyle;
  onPress?: () => void;
};

export type CyberAlertVariant = "success" | "error" | "info" | "confirm";

export type CyberAlertPayload = {
  title: string;
  message: string;
  buttons: CyberAlertButton[];
  variant: CyberAlertVariant;
};
