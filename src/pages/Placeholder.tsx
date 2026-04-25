import { Construction } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
}

/** Stub para páginas que aún no tienen UI; se reemplazan en commits posteriores. */
export const Placeholder = ({ title, description }: Props) => (
  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
    <Construction className="w-10 h-10 text-muted-foreground" />
    <h2 className="text-2xl font-bold text-foreground">{title}</h2>
    {description && (
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
    )}
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
      WIP — pendiente de implementación
    </p>
  </div>
);
