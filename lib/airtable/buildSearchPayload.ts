import type { SearchAirtableResolvedPayload } from "@/types/airtable";

// The payload PATCH endpoint replaces the stored payload wholesale rather than
// merging it, so every display field (selectedBase, allAvailableBases, …) has to
// be resent alongside the execution fields the connector reads (baseId, tableId,
// searchText, …). searchText is omitted entirely (not sent as "") when the query
// is blank, since that's how the connector distinguishes "fetch all" from a search.
export function buildSearchPayload(edited: SearchAirtableResolvedPayload): Record<string, unknown> {
  const trimmedQuery = edited.searchQuery.trim();

  const payload: Record<string, unknown> = {
    selectedBase: edited.selectedBase,
    selectedTable: edited.selectedTable,
    searchQuery: edited.searchQuery,
    allAvailableBases: edited.allAvailableBases,
    allAvailableTablesForSelectedBase: edited.allAvailableTablesForSelectedBase,
    baseId: edited.selectedBase?.id,
    tableId: edited.selectedTable?.id,
    pageSize: edited.pageSize ?? 20,
    offset: edited.offset ?? null,
    filterByFormula: edited.filterByFormula ?? null,
  };

  if (trimmedQuery) payload.searchText = trimmedQuery;

  return payload;
}
