export function formatRelativeTime(unixSeconds: number): string {
  if (unixSeconds === 0) return "--";
  
  const now = Date.now() / 1000;
  const diff = now - unixSeconds;
  
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleDateString(undefined, { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
}
