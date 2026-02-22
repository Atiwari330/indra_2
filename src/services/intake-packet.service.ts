import type { AdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/types/database';
import { INTAKE_PACKET_ITEMS } from '@/lib/data/intake-content';

// ── Create ──────────────────────────────────────────────────────

export async function createIntakePacket(
  client: AdminClient,
  patientId: string,
  providerId: string,
  orgId: string
) {
  // Create the packet
  const { data: packet, error: packetError } = await client
    .from('intake_packets')
    .insert({
      patient_id: patientId,
      provider_id: providerId,
      org_id: orgId,
    })
    .select()
    .single();

  if (packetError) throw new Error(`Failed to create intake packet: ${packetError.message}`);

  // Create items
  const items = INTAKE_PACKET_ITEMS.map((item) => ({
    packet_id: packet.id,
    patient_id: patientId,
    org_id: orgId,
    item_type: item.item_type,
    item_key: item.item_key,
    item_label: item.item_label,
    sort_order: item.sort_order,
  }));

  const { error: itemsError } = await client
    .from('intake_packet_items')
    .insert(items);

  if (itemsError) throw new Error(`Failed to create intake packet items: ${itemsError.message}`);

  return packet;
}

// ── Read (Provider) ─────────────────────────────────────────────

export async function getIntakePacket(
  client: AdminClient,
  patientId: string,
  orgId: string
) {
  const { data, error } = await client
    .from('intake_packets')
    .select('*')
    .eq('patient_id', patientId)
    .eq('org_id', orgId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch intake packet: ${error.message}`);
  return data;
}

export async function getIntakePacketWithItems(
  client: AdminClient,
  patientId: string,
  orgId: string
) {
  const { data: packet, error: packetError } = await client
    .from('intake_packets')
    .select('*')
    .eq('patient_id', patientId)
    .eq('org_id', orgId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (packetError) throw new Error(`Failed to fetch intake packet: ${packetError.message}`);
  if (!packet) return null;

  const { data: items, error: itemsError } = await client
    .from('intake_packet_items')
    .select('*')
    .eq('packet_id', packet.id)
    .order('sort_order', { ascending: true });

  if (itemsError) throw new Error(`Failed to fetch intake packet items: ${itemsError.message}`);

  return { ...packet, items: items ?? [] };
}

// ── Read (Portal) ───────────────────────────────────────────────

export async function getPendingPortalIntakePacket(
  client: AdminClient,
  patientId: string,
  orgId: string
) {
  const { data: packet, error: packetError } = await client
    .from('intake_packets')
    .select('*')
    .eq('patient_id', patientId)
    .eq('org_id', orgId)
    .in('status', ['pending', 'in_progress'])
    .order('requested_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (packetError) throw new Error(`Failed to fetch pending intake packet: ${packetError.message}`);
  if (!packet) return null;

  const { data: items, error: itemsError } = await client
    .from('intake_packet_items')
    .select('*')
    .eq('packet_id', packet.id)
    .order('sort_order', { ascending: true });

  if (itemsError) throw new Error(`Failed to fetch intake packet items: ${itemsError.message}`);

  return { ...packet, items: items ?? [] };
}

// ── Item Progress (Portal) ──────────────────────────────────────

export async function startIntakePacketItem(
  client: AdminClient,
  itemId: string,
  packetId: string
) {
  // Mark the item as in_progress
  const { error: itemError } = await client
    .from('intake_packet_items')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (itemError) throw new Error(`Failed to start intake item: ${itemError.message}`);

  // Also mark the packet as in_progress if it's still pending
  const { error: packetError } = await client
    .from('intake_packets')
    .update({ status: 'in_progress' })
    .eq('id', packetId)
    .eq('status', 'pending');

  if (packetError) {
    console.error('[intake] Failed to update packet status (non-fatal):', packetError);
  }
}

export async function saveIntakeItemProgress(
  client: AdminClient,
  itemId: string,
  responses: Record<string, unknown>
) {
  const { error } = await client
    .from('intake_packet_items')
    .update({ responses: responses as unknown as Json })
    .eq('id', itemId);

  if (error) throw new Error(`Failed to save intake item progress: ${error.message}`);
}

// ── Item Completion (Portal) ────────────────────────────────────

export async function completeConsentItem(
  client: AdminClient,
  itemId: string,
  signatureName: string
) {
  const { error } = await client
    .from('intake_packet_items')
    .update({
      status: 'completed',
      signature_name: signatureName,
      signed_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) throw new Error(`Failed to complete consent item: ${error.message}`);
}

export async function completeQuestionnaireItem(
  client: AdminClient,
  itemId: string,
  responses: Record<string, unknown>
) {
  const { error } = await client
    .from('intake_packet_items')
    .update({
      status: 'completed',
      responses: responses as unknown as Json,
      completed_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) throw new Error(`Failed to complete questionnaire item: ${error.message}`);
}

// ── Packet Completion Check ─────────────────────────────────────

export async function checkAndCompletePacket(
  client: AdminClient,
  packetId: string
) {
  // Check if all items are completed
  const { data: items, error: itemsError } = await client
    .from('intake_packet_items')
    .select('status')
    .eq('packet_id', packetId);

  if (itemsError) throw new Error(`Failed to check packet items: ${itemsError.message}`);

  const allCompleted = items?.every((item) => item.status === 'completed');

  if (allCompleted) {
    const { error } = await client
      .from('intake_packets')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', packetId);

    if (error) throw new Error(`Failed to complete packet: ${error.message}`);
    return true;
  }

  return false;
}

// ── Notifications (Provider) ────────────────────────────────────

export async function markIntakePacketViewed(client: AdminClient, packetId: string) {
  const { error } = await client
    .from('intake_packets')
    .update({ provider_viewed_at: new Date().toISOString() })
    .eq('id', packetId);

  if (error) throw new Error(`Failed to mark intake packet viewed: ${error.message}`);
}

export async function getUnviewedCompletedIntakeCount(
  client: AdminClient,
  providerId: string,
  orgId: string
): Promise<number> {
  const { count, error } = await client
    .from('intake_packets')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .eq('org_id', orgId)
    .eq('status', 'completed')
    .is('provider_viewed_at', null);

  if (error) throw new Error(`Failed to count unviewed intake packets: ${error.message}`);
  return count ?? 0;
}

export async function getUnviewedCompletedIntake(
  client: AdminClient,
  providerId: string,
  orgId: string
) {
  const { data, error } = await client
    .from('intake_packets')
    .select(`
      id,
      completed_at,
      patient_id,
      patients!inner(first_name, last_name)
    `)
    .eq('provider_id', providerId)
    .eq('org_id', orgId)
    .eq('status', 'completed')
    .is('provider_viewed_at', null)
    .order('completed_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch unviewed intake packets: ${error.message}`);
  return data ?? [];
}
