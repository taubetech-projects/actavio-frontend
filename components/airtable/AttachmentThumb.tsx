import { Paperclip } from "lucide-react";
import type { AirtableAttachment } from "@/types/airtable";

interface AttachmentThumbProps {
  attachment: AirtableAttachment;
}

export function AttachmentThumb({ attachment }: AttachmentThumbProps) {
  const isImage = attachment.type.startsWith("image/");
  const thumb = attachment.thumbnails?.small?.url;

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex flex-col items-center gap-1 rounded border border-border p-1 hover:bg-muted transition-colors text-xs text-muted-foreground max-w-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={attachment.filename}
    >
      {isImage && thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={attachment.filename}
          className="h-10 w-10 object-cover rounded"
        />
      ) : (
        <Paperclip className="h-8 w-8 text-muted-foreground" />
      )}
      <span className="truncate w-full text-center">{attachment.filename}</span>
    </a>
  );
}
