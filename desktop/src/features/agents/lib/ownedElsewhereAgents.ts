import type { ManagedAgent, RelayAgent } from "@/shared/api/types";
import { normalizePubkey } from "@/shared/lib/pubkey";
import { isOwnedAgentNotManagedOnDevice } from "./otherSetupAgent";

/**
 * Viewer-owned relay identities with no exact-key record in the loaded local
 * inventory: the agents the viewer runs elsewhere (another machine, a server,
 * containers), listed read-only on the Agents page.
 *
 * Provenance only, the same predicate as the shared "Not managed on this
 * device" marker (docs/agent-management-provenance.md): it says nothing about
 * hosting location, availability or lifecycle authority. Fails closed — an
 * empty list — until the identity, the local inventory and the relay directory
 * have all loaded, so a slow directory never shows a local agent as remote.
 */
export function selectOwnedElsewhereAgents({
  currentPubkey,
  localInventoryReady,
  managedAgents,
  relayAgents,
  relayDirectoryReady,
}: {
  currentPubkey?: string;
  localInventoryReady: boolean;
  managedAgents: readonly ManagedAgent[];
  relayAgents: readonly RelayAgent[];
  relayDirectoryReady: boolean;
}): RelayAgent[] {
  if (!currentPubkey || !localInventoryReady || !relayDirectoryReady) {
    return [];
  }
  const local = new Set(
    managedAgents.map((agent) => normalizePubkey(agent.pubkey)),
  );
  const seen = new Set<string>();
  const owned: RelayAgent[] = [];
  for (const agent of relayAgents) {
    const key = normalizePubkey(agent.pubkey);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (
      isOwnedAgentNotManagedOnDevice({
        currentPubkey,
        ownerPubkey: agent.ownerPubkey,
        localInventoryReady,
        isLocallyManaged: local.has(key),
      })
    ) {
      owned.push(agent);
    }
  }
  return owned.sort(
    (left, right) =>
      left.name.localeCompare(right.name) ||
      normalizePubkey(left.pubkey).localeCompare(normalizePubkey(right.pubkey)),
  );
}
