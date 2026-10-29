-- Match the existing column-scoped profile update permissions for the new frame field.
-- RLS and the learning-look trigger continue to enforce family access and earned unlocks.
grant update(frame) on public.player_space_profiles to authenticated;
