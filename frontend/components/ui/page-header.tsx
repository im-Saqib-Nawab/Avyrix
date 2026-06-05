interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">{title}</h1>
      {description ? <p className="mt-2 text-sm text-secondary md:text-base">{description}</p> : null}
    </div>
  );
}
