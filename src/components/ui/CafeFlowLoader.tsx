'use client';

export function CafeFlowLoader({ label = 'CaféFlow' }: { label?: string }) {
  return (
    <div className="cafeflow-loader" role="status" aria-label={label}>
      <div className="cafeflow-loader__scene">
        <div className="cafeflow-loader__steam cafeflow-loader__steam--one" />
        <div className="cafeflow-loader__steam cafeflow-loader__steam--two" />
        <div className="cafeflow-loader__cup"><span /></div>
        <div className="cafeflow-loader__bean cafeflow-loader__bean--one" />
        <div className="cafeflow-loader__bean cafeflow-loader__bean--two" />
      </div>
      <span className="cafeflow-loader__label">{label}</span>
    </div>
  );
}
