import { Component, type PropsWithChildren } from "react";
import { Text } from "react-native";
import { colors, type } from "../theme";

export class CodeBoundary extends Component<
  PropsWithChildren,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <Text style={[type.body, { color: colors.darkInk, textAlign: "center" }]}>
        This payload cannot be rendered as a QR code. Its original text is shown
        below.
      </Text>
    ) : (
      this.props.children
    );
  }
}
