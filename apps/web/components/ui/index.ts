/**
 * VELAR Design System — punto de entrada público.
 * Importá desde aquí: `import { ThemeSwitcher, colorVar } from '@/components/ui'`.
 */
export * from './tokens';
export { cn } from './cn';
export { ThemeProvider, ThemeSwitcher, useTheme, themeInitScript } from './theme';

// Primitivas
export { Button, IconButton } from './Button';
export type { ButtonProps, IconButtonProps } from './Button';
export { Card, CardHeader, CardTitle, CardFooter } from './Card';
export type { CardProps } from './Card';
export { Badge, Tag } from './Badge';
export type { BadgeProps } from './Badge';
export { Spinner, Skeleton, Alert, EmptyState } from './feedback';
export type { AlertProps, EmptyStateProps } from './feedback';

// Formularios
export { Field, Input, Textarea, Select, Checkbox, Radio, Switch } from './form';
export type { InputProps, TextareaProps, SelectProps, CheckboxProps, SwitchProps } from './form';

// Layout
export { Stack, Cluster, Grid } from './layout';
export type { StackProps, ClusterProps, GridProps } from './layout';

// Overlays / navegación
export { Tabs } from './Tabs';
export type { TabItem } from './Tabs';
export { Tooltip } from './Tooltip';
export { Modal } from './Modal';
export type { ModalProps } from './Modal';
