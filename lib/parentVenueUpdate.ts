import type {SupabaseClient} from "@supabase/supabase-js";
import type {FamilySession} from "./parentDashboard";

export async function loadSharedBooking(client: SupabaseClient, bookingId: string, playerId: string): Promise<FamilySession | null> {
  const {data, error} = await client.from("family_session_schedule")
    .select("id,player_id,title,starts_at,ends_at,venue,venue_version").eq("id", bookingId).eq("player_id", playerId).maybeSingle();
  if (error) throw error;
  return data;
}
