'use client';
/**
 * /design-system — galería viva del Design System de VELAR.
 * Demuestra cada primitiva con sus variantes y estados. Sirve como docs y como
 * superficie para revisión de accesibilidad/regresión visual.
 */
import { useState } from 'react';
import { Rocket } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardTitle,
  Checkbox,
  Cluster,
  EmptyState,
  Field,
  Grid,
  IconButton,
  Input,
  Modal,
  Radio,
  Select,
  Skeleton,
  Spinner,
  Stack,
  Switch,
  Tabs,
  Tag,
  Textarea,
  ThemeSwitcher,
  Tooltip,
} from '../../components/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">{title}</h2>
      <Card>{children}</Card>
    </section>
  );
}

export default function DesignSystemPage() {
  const [modal, setModal] = useState(false);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">VELAR Design System</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Primitivas tipadas, accesibles y temables. Probá el tema con el switch →</p>
        </div>
        <ThemeSwitcher />
      </header>

      <Stack gap={8}>
        <Section title="Buttons">
          <Cluster gap={3}>
            <Button>Primario</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success">Éxito</Button>
            <Button variant="danger">Peligro</Button>
            <Button variant="warn">Aviso</Button>
            <Button loading>Cargando</Button>
            <Button disabled>Deshabilitado</Button>
            <Button size="sm" leftIcon={<Rocket size={14} />}>Small</Button>
            <Button size="lg">Large</Button>
            <Tooltip label="Acción con icono">
              <IconButton aria-label="Lanzar"><Rocket size={18} /></IconButton>
            </Tooltip>
          </Cluster>
        </Section>

        <Section title="Badges & Tags">
          <Cluster gap={2}>
            <Badge tone="neutral" dot>Neutral</Badge>
            <Badge tone="primary" dot>Primary</Badge>
            <Badge tone="success" dot>Éxito</Badge>
            <Badge tone="warning" dot>Aviso</Badge>
            <Badge tone="error" dot>Error</Badge>
            <Tag tone="info">Etiqueta</Tag>
          </Cluster>
        </Section>

        <Section title="Feedback">
          <Stack gap={4}>
            <Alert tone="info" title="Información">Mensaje informativo de ejemplo.</Alert>
            <Alert tone="success" title="Listo">La operación se completó.</Alert>
            <Alert tone="warning" title="Atención">Revisá los datos antes de continuar.</Alert>
            <Alert tone="error" title="Error">No se pudo procesar la solicitud.</Alert>
            <Cluster gap={3}>
              <Spinner />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-24" />
            </Cluster>
          </Stack>
        </Section>

        <Section title="Forms">
          <Grid min={220} gap={4}>
            <Field label="Nombre" hint="Como aparece en tu perfil">
              <Input placeholder="Sofía" />
            </Field>
            <Field label="Email" error="Email inválido">
              <Input type="email" invalid defaultValue="mal@" />
            </Field>
            <Field label="País">
              <Select defaultValue="CR">
                <option value="CR">Costa Rica</option>
                <option value="CO">Colombia</option>
                <option value="BR">Brasil</option>
                <option value="AR">Argentina</option>
              </Select>
            </Field>
            <Field label="Notas" className="sm:col-span-2">
              <Textarea placeholder="Escribí aquí…" />
            </Field>
            <Stack gap={2}>
              <Checkbox label="Acepto los términos" defaultChecked />
              <Radio name="plan" label="Plan básico" defaultChecked />
              <Radio name="plan" label="Plan pro" />
              <Switch label="Notificaciones" defaultChecked />
            </Stack>
          </Grid>
        </Section>

        <Section title="Tabs">
          <Tabs
            items={[
              { id: 'a', label: 'Resumen', content: <p className="text-sm text-on-surface-variant">Contenido del resumen.</p> },
              { id: 'b', label: 'Detalle', content: <p className="text-sm text-on-surface-variant">Contenido del detalle.</p> },
              { id: 'c', label: 'Deshabilitada', content: null, disabled: true },
            ]}
          />
        </Section>

        <Section title="Card interactiva & Modal">
          <Grid min={220} gap={4}>
            <Card variant="soft" interactive>
              <CardTitle>Card interactiva</CardTitle>
              <p className="mt-1 text-sm text-on-surface-variant">Elevación en hover.</p>
            </Card>
            <div className="flex items-center">
              <Button onClick={() => setModal(true)}>Abrir modal</Button>
            </div>
          </Grid>
        </Section>

        <Section title="Empty state">
          <EmptyState
            icon={<Rocket size={28} />}
            title="Nada por aquí todavía"
            description="Cuando haya datos, aparecerán en esta sección."
            action={<Button size="sm">Crear el primero</Button>}
          />
        </Section>
      </Stack>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Diálogo de ejemplo"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={() => setModal(false)}>Confirmar</Button>
          </>
        }
      >
        <p>Este diálogo atrapa el foco, cierra con Escape y restaura el foco al cerrar.</p>
      </Modal>
    </main>
  );
}
