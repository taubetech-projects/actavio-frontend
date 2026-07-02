import type { CreateAirtableResolvedPayload } from "@/types/airtable";

// Same full-replace contract as buildSearchPayload: the PATCH endpoint stores exactly
// the object it's sent, so baseId/tableId must be kept in sync with selectedBase/selectedTable.
export function buildCreateRecordPayload(edited: CreateAirtableResolvedPayload): Record<string, unknown> {
  return {
    fields: edited.fields,
    selectedBase: edited.selectedBase,
    selectedTable: edited.selectedTable,
    allAvailableBases: edited.allAvailableBases,
    allAvailableTablesForSelectedBase: edited.allAvailableTablesForSelectedBase,
    baseId: edited.selectedBase?.id,
    tableId: edited.selectedTable?.id,
  };
}
