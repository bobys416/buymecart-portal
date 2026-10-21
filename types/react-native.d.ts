declare module "react-native" {
  import * as React from "react";

  export type ViewStyle = Record<string, any>;
  export type TextStyle = Record<string, any>;
  export type ImageStyle = Record<string, any>;
  export type KeyboardTypeOptions = "default" | "email-address" | "numeric" | "phone-pad" | "number-pad" | "decimal-pad";

  export interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
    style?: ViewStyle | ViewStyle[];
    children?: React.ReactNode;
  }

  export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
    style?: TextStyle | TextStyle[];
    numberOfLines?: number;
    children?: React.ReactNode;
  }

  export interface TouchableOpacityProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    style?: ViewStyle | ViewStyle[];
    onPress?: () => void;
    activeOpacity?: number;
    disabled?: boolean;
    children?: React.ReactNode;
  }

  export interface ScrollViewProps extends React.HTMLAttributes<HTMLDivElement> {
    style?: ViewStyle | ViewStyle[];
    contentContainerStyle?: ViewStyle | ViewStyle[];
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    refreshControl?: React.ReactElement;
    children?: React.ReactNode;
  }

  export interface FlatListProps<T> {
    data: T[];
    renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement | null;
    keyExtractor?: (item: T, index: number) => string;
    contentContainerStyle?: ViewStyle | ViewStyle[];
    ListEmptyComponent?: React.ReactElement | React.ComponentType<any> | null;
  }

  export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    style?: TextStyle | TextStyle[];
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    multiline?: boolean;
    numberOfLines?: number;
    editable?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    onSubmitEditing?: () => void;
  }

  export interface ModalProps {
    visible?: boolean;
    transparent?: boolean;
    animationType?: "none" | "slide" | "fade";
    onRequestClose?: () => void;
    children?: React.ReactNode;
  }

  export interface RefreshControlProps {
    refreshing: boolean;
    onRefresh?: () => void;
  }

  export interface ActivityIndicatorProps {
    size?: "small" | "large" | number;
    color?: string;
  }

  export interface SwitchProps {
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    trackColor?: { false?: string; true?: string };
  }

  export const View: React.FC<ViewProps>;
  export const Text: React.FC<TextProps>;
  export const TouchableOpacity: React.FC<TouchableOpacityProps>;
  export const ScrollView: React.FC<ScrollViewProps>;
  export function FlatList<T = any>(props: FlatListProps<T>): React.ReactElement | null;
  export const TextInput: React.FC<TextInputProps>;
  export const Modal: React.FC<ModalProps>;
  export const RefreshControl: React.FC<RefreshControlProps>;
  export const ActivityIndicator: React.FC<ActivityIndicatorProps>;
  export const Switch: React.FC<SwitchProps>;
  export const SafeAreaView: React.FC<ViewProps>;
  export const StatusBar: React.FC<{ barStyle?: string; backgroundColor?: string }>;
  export const KeyboardAvoidingView: React.FC<ViewProps & { behavior?: "padding" | "height" | "position" }>;

  export const Alert: {
    alert: (title: string, message?: string, buttons?: any[]) => void;
  };

  export const BackHandler: {
    addEventListener: (eventName: string, handler: () => boolean) => { remove: () => void };
    removeEventListener: (eventName: string, handler: () => boolean) => void;
    exitApp: () => void;
  };

  export const Platform: {
    OS: "android" | "ios" | "web";
    select: <T>(obj: { android?: T; ios?: T; web?: T; default?: T }) => T;
  };

  export const Share: {
    share: (content: { title?: string; message: string; url?: string }, options?: any) => Promise<{ action: string }>;
  };

  export namespace StyleSheet {
    export function create<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(styles: T): T;
    export function flatten<T>(style: any): T;
  }
}

declare module "react-native-safe-area-context" {
  import * as React from "react";
  export const SafeAreaProvider: React.FC<{ children?: React.ReactNode }>;
  export const SafeAreaView: React.FC<{ style?: any; children?: React.ReactNode }>;
}
