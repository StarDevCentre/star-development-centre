import {supabaseBrowser} from "./supabaseBrowser";

export type PlayerInvitationRequest = {type: "player" | "intake"; id: string; email: string};

export async function sendPlayerInvitation(request: PlayerInvitationRequest): Promise<{emailSubmitted: boolean}> {
  if (!supabaseBrowser) throw Error("Player invitations are temporarily unavailable.");
  const {data: {session}, error} = await supabaseBrowser.auth.getSession();
  if (error || !session?.access_token) throw Error("Please sign in again before inviting a player.");
  const response = await fetch("/api/player-invitation", {
    method: "POST",
    headers: {"Authorization": "Bearer " + session.access_token, "Content-Type": "application/json"},
    body: JSON.stringify(request)
  });
  const result: {ok?: boolean; emailSubmitted?: boolean; error?: string} = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw Error(result.error || "The invitation could not be created. Please try again.");
  return {emailSubmitted: result.emailSubmitted === true};
}
