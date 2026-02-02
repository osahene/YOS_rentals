import MetricCard, { MetricCardProps } from "./Cards/MetricCard";

interface MetricsGridProps {
  metrics: MetricCardProps[];
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          {...metric}
          delay={metric.delay ?? index * 0.1}
        />
      ))}
    </div>
  );
}
