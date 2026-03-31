import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Typography } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'display' | 'title' | 'heading' | 'subtitle' | 'body' | 'bodyMedium' | 'bodySemiBold' | 'mono' | 'link' | 'caption';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'display' ? styles.display : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'heading' ? styles.heading : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'body' ? styles.body : undefined,
        type === 'bodyMedium' ? styles.bodyMedium : undefined,
        type === 'bodySemiBold' ? styles.bodySemiBold : undefined,
        type === 'mono' ? styles.mono : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'caption' ? styles.caption : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 16,
    lineHeight: 24,
  },
  display: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -1,
  },
  title: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: Typography.heading.fontFamily,
    fontSize: 24,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: Typography.bodySemiBold.fontFamily,
    fontSize: 18,
    lineHeight: 26,
  },
  body: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySemiBold: {
    fontFamily: Typography.bodySemiBold.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  mono: {
    fontFamily: Typography.mono.fontFamily,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  link: {
    fontFamily: Typography.body.fontFamily,
    lineHeight: 24,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  caption: {
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
});