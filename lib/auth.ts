import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

type AuthResult<T> = {
  data: T;
  error: string | null;
};

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult<{ session: Session | null }>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { data: { session: null }, error: error.message };
  }

  return { data: { session: data.session }, error: null };
}

export async function signOut(): Promise<AuthResult<null>> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function getSession(): Promise<
  AuthResult<{ session: Session | null }>
> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return { data: { session: null }, error: error.message };
  }

  return { data: { session: data.session }, error: null };
}
