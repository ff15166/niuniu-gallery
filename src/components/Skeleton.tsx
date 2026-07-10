export default function Skeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="photo-grid grid-container">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card card">
          <div className="skeleton-image" />
          <div className="skeleton-text" />
          <div className="skeleton-text short" />
        </div>
      ))}
    </div>
  );
}
