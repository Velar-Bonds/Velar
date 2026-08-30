/**
 * VELAR Design System — punto de entrada público.
 * Importá desde aquí: `import { ThemeSwitcher, colorVar } from '@velar/ui'`.
 */
export * from './tokens.js';
export { cn } from './cn.js';
export { ThemeProvider, ThemeSwitcher, useTheme, themeInitScript } from './theme.js';
export type { ThemeProviderProps } from './theme.js';

// Primitivas
export { Button, IconButton } from './Button.js';
export type { ButtonProps, IconButtonProps } from './Button.js';
export { Card, CardHeader, CardTitle, CardFooter } from './Card.js';
export type { CardProps } from './Card.js';
export { Badge, Tag } from './Badge.js';
export type { BadgeProps } from './Badge.js';
export { Spinner, Skeleton, Alert, EmptyState } from './feedback.js';
export type { AlertProps, EmptyStateProps } from './feedback.js';

// Formularios
export { Field, Input, Textarea, Select, Checkbox, Radio, Switch } from './form.js';
export type { InputProps, TextareaProps, SelectProps, CheckboxProps, SwitchProps } from './form.js';

// Layout
export { Stack, Cluster, Grid } from './layout.js';
export type { StackProps, ClusterProps, GridProps } from './layout.js';

// Overlays / navegación
export { Tabs } from './Tabs.js';
export type { TabItem } from './Tabs.js';
export { Tooltip } from './Tooltip.js';
export { Modal } from './Modal.js';
export type { ModalProps } from './Modal.js';

export { Table, DataTable } from './Table.js';
export type {
  TableProps,
  DataTableProps,
  TableColumn,
  TablePagination,
  TableSortDirection,
} from './Table.js';
