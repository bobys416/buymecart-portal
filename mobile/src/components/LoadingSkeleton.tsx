import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../theme";

export interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 6,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as ViewStyle["width"],
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surfaceSubtle,
    overflow: "hidden",
  },
});
