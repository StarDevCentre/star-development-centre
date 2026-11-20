import type {SupabaseClient} from "@supabase/supabase-js";

export type RosterSession = {
  id: string;
  title: string;
  programme: string;
  starts_at: string;
  ends_at: string;
  venue: string | null;
};
type SessionRow = RosterSession & {attendance_status: string | null};

export async function loadPlayerSessionRecords(client: SupabaseClient, playerId: string) {
  const records: SessionRow[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const {data, error} = await client.rpc("star_player_session_records", {p_player: playerId})
      .order("starts_at", {ascending: false}).order("id").range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    const page: SessionRow[] = data ?? [];
    records.push(...page);
    if (page.length < pageSize) break;
  }
  return {
    sessions: records,
    attendance: records.flatMap(row => row.attendance_status ? [{session_id: row.id, status: row.attendance_status}] : []),
  };
}
