import assert from "node:assert/strict";
import test from "node:test";

import { selectOwnedElsewhereAgents } from "./ownedElsewhereAgents.ts";

const OWNER = "a".repeat(64);
const OTHER_OWNER = "c".repeat(64);
const relayAgent = (pubkey, name, ownerPubkey = OWNER) => ({
  pubkey,
  ownerPubkey,
  name,
  agentType: "agent",
  channels: [],
  channelIds: [],
  capabilities: [],
  status: "unknown",
  respondTo: null,
  respondToAllowlist: [],
});
const ready = {
  currentPubkey: OWNER,
  localInventoryReady: true,
  relayDirectoryReady: true,
};

test("lists the viewer's relay agents that this device doesn't manage, by name", () => {
  const agents = selectOwnedElsewhereAgents({
    ...ready,
    managedAgents: [{ pubkey: "1".repeat(64) }],
    relayAgents: [
      relayAgent("3".repeat(64), "TechLead"),
      relayAgent("1".repeat(64), "Local one"),
      relayAgent("2".repeat(64), "Architect"),
      relayAgent("4".repeat(64), "Someone else's", OTHER_OWNER),
      relayAgent("5".repeat(64), "No owner", null),
    ],
  });
  assert.deepEqual(
    agents.map((agent) => agent.name),
    ["Architect", "TechLead"],
  );
});

test("matches local records by exact key, whatever the case", () => {
  const agents = selectOwnedElsewhereAgents({
    ...ready,
    managedAgents: [{ pubkey: "B".repeat(64) }],
    relayAgents: [relayAgent("b".repeat(64), "Managed here")],
  });
  assert.deepEqual(agents, []);
});

test("fails closed until identity, inventory and directory have loaded", () => {
  const relayAgents = [relayAgent("2".repeat(64), "Architect")];
  for (const missing of [
    { currentPubkey: undefined },
    { localInventoryReady: false },
    { relayDirectoryReady: false },
  ]) {
    assert.deepEqual(
      selectOwnedElsewhereAgents({
        ...ready,
        ...missing,
        managedAgents: [],
        relayAgents,
      }),
      [],
    );
  }
});

test("lists a relay identity once", () => {
  const agents = selectOwnedElsewhereAgents({
    ...ready,
    managedAgents: [],
    relayAgents: [
      relayAgent("2".repeat(64), "Architect"),
      relayAgent("2".repeat(64), "Architect"),
    ],
  });
  assert.equal(agents.length, 1);
});
