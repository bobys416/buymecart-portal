import React from "react";

// Mock React Native primitives for JSDOM test environments
export const View = React.forwardRef<HTMLDivElement, any>(
  ({ children, style, ...props }, ref) => (
    <div ref={ref} {...props}>{children}</div>
  )
);
View.displayName = "View";

export const Text = React.forwardRef<HTMLSpanElement, any>(
  ({ children, style, numberOfLines, ...props }, ref) => (
    <span ref={ref} {...props}>{children}</span>
  )
);
Text.displayName = "Text";

export const TouchableOpacity = React.forwardRef<HTMLButtonElement, any>(
  ({ children, onPress, disabled, activeOpacity, style, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={disabled ? undefined : onPress}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
);
TouchableOpacity.displayName = "TouchableOpacity";

export const ScrollView = React.forwardRef<HTMLDivElement, any>(
  ({ children, style, contentContainerStyle, refreshControl, showsHorizontalScrollIndicator, showsVerticalScrollIndicator, ...props }, ref) => (
    <div ref={ref} {...props}>
      {refreshControl}
      {children}
    </div>
  )
);
ScrollView.displayName = "ScrollView";

export const FlatList = <T,>({
  data,
  renderItem,
  keyExtractor,
  ListEmptyComponent,
}: {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  ListEmptyComponent?: React.ReactNode;
}) => {
  if (!data || data.length === 0) {
    return <>{ListEmptyComponent}</>;
  }
  return (
    <div>
      {data.map((item, index) => (
        <div key={keyExtractor ? keyExtractor(item, index) : index}>
          {renderItem({ item, index })}
        </div>
      ))}
    </div>
  );
};

export const TextInput = React.forwardRef<HTMLInputElement, any>(
  ({ value, onChangeText, placeholder, secureTextEntry, editable = true, autoCapitalize, placeholderTextColor, keyboardType, multiline, numberOfLines, style, ...props }, ref) => (
    <input
      ref={ref}
      type={secureTextEntry ? "password" : "text"}
      value={value}
      placeholder={placeholder}
      disabled={!editable}
      onChange={(e) => onChangeText && onChangeText(e.target.value)}
      {...props}
    />
  )
);
TextInput.displayName = "TextInput";

export const Modal = React.forwardRef<HTMLDivElement, any>(
  ({ visible = true, children, onRequestClose, transparent, animationType, ...props }, ref) => {
    if (!visible) return null;
    return (
      <div ref={ref} data-testid="rn-modal" {...props}>
        {children}
      </div>
    );
  }
);
Modal.displayName = "Modal";

export const RefreshControl = ({ refreshing, onRefresh }: any) => null;

export const Alert = {
  alert: (title: string, message?: string, buttons?: any[]) => {
    // No-op or test stub
  },
};

export const BackHandler = {
  addEventListener: (eventName: string, handler: () => boolean) => ({
    remove: () => {},
  }),
  removeEventListener: (eventName: string, handler: () => boolean) => {},
  exitApp: () => {},
};

export const KeyboardAvoidingView = React.forwardRef<HTMLDivElement, any>(
  ({ children, behavior, ...props }, ref) => (
    <div ref={ref} {...props}>{children}</div>
  )
);
KeyboardAvoidingView.displayName = "KeyboardAvoidingView";

export const ActivityIndicator = ({ size, color }: any) => (
  <span data-testid="activity-indicator">Loading...</span>
);

export const Switch = ({ value, onValueChange }: any) => (
  <input
    type="checkbox"
    checked={!!value}
    onChange={(e) => onValueChange && onValueChange(e.target.checked)}
  />
);

export const SafeAreaView = ({ children, style }: any) => <div>{children}</div>;
export const StatusBar = () => null;

export const StyleSheet = {
  create: <T,>(styles: T): T => styles,
  flatten: (style: any) => style,
};

export const Platform = {
  OS: "web",
  select: (obj: any) => obj.web || obj.default,
};

export const Share = {
  share: async (content: any, options?: any) => ({ action: "sharedAction" }),
};

export default {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  RefreshControl,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  ActivityIndicator,
  Switch,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  Share,
};
