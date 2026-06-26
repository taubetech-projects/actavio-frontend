import { Badge } from "@/components/ui/badge";
import { PhoneLink } from "./PhoneLink";
import { AttachmentThumb } from "./AttachmentThumb";
import { ExpandableText } from "./ExpandableText";
import {
  isPhoneNumber,
  isPhoneByColumnName,
  isEmail,
  isUrl,
  isAttachment,
} from "@/lib/airtable/detectors";
import type { AirtableAttachment, AirtableFieldValue } from "@/types/airtable";
import { formatDistanceToNow } from "@/lib/airtable/dateUtils";

interface FieldValueCellProps {
  value: AirtableFieldValue;
  columnName: string;
}

export function FieldValueCell({ value, columnName }: FieldValueCellProps) {
  return <>{renderFieldValue(value, columnName)}</>;
}

// Uses `unknown` to avoid TypeScript control-flow narrowing fighting the union type.
export function renderFieldValue(
  rawValue: unknown,
  columnName: string
): React.ReactNode {
  const value = rawValue;

  // Null / undefined
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">—</span>;
  }

  // Phone (column-name heuristic first, then pattern)
  if (isPhoneByColumnName(columnName, value) || isPhoneNumber(value)) {
    return <PhoneLink phone={value} />;
  }

  // Email
  if (isEmail(value)) {
    return (
      <a
        href={`mailto:${value}`}
        className="text-blue-600 underline hover:text-blue-800"
      >
        {value}
      </a>
    );
  }

  // URL
  if (isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800 truncate max-w-xs block"
      >
        {value}
      </a>
    );
  }

  // Boolean
  if (typeof value === "boolean") {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          value
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  // Number
  if (typeof value === "number") {
    return (
      <span className="font-mono tabular-nums">{value.toLocaleString()}</span>
    );
  }

  // createdTime → relative date
  if (columnName === "createdTime" && typeof value === "string") {
    const rel = formatDistanceToNow(value);
    return <span title={value}>{rel}</span>;
  }

  // Array
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400 italic">—</span>;

    if (value.every(isAttachment)) {
      return (
        <div className="flex flex-wrap gap-1">
          {(value as AirtableAttachment[]).map((att) => (
            <AttachmentThumb key={att.id} attachment={att} />
          ))}
        </div>
      );
    }

    return (
      <span className="inline-flex gap-1 flex-wrap">
        {value.map((v, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {String(v)}
          </Badge>
        ))}
      </span>
    );
  }

  // Object
  if (typeof value === "object" && value !== null) {
    return (
      <code className="text-xs bg-gray-100 rounded px-1 break-all">
        {JSON.stringify(value)}
      </code>
    );
  }

  // String (including long text)
  if (typeof value === "string") {
    if (value.length > 120) {
      return <ExpandableText text={value} />;
    }
    return <span>{value}</span>;
  }

  return <span>{String(value)}</span>;
}
