type Props = {
  title: string;
  description?: string;
  right?: React.ReactNode;
};

export function PageHeader({ title, description, right }: Props) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold leading-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {right ? <div className="pt-1">{right}</div> : null}
    </div>
  );
}
