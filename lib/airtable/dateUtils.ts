export function formatDistanceToNow(isoString: string): string {
  const date = new Date(isoString);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} days ago`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400 / 7)} weeks ago`;
  if (diffSec < 86400 * 365) return `${Math.floor(diffSec / 86400 / 30)} months ago`;
  return `${Math.floor(diffSec / 86400 / 365)} years ago`;
}
