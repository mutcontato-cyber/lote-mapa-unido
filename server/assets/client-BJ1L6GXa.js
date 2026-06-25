import { createClient } from "@supabase/supabase-js";
//#region src/integrations/supabase/client.ts
function createSupabaseClient() {
	return createClient("https://nvzccyowzemzenspbvqt.supabase.co", "sb_publishable_PD947pZ2kewSdT9vPRgLXA_50HNWU6h", { auth: {
		storage: typeof window !== "undefined" ? localStorage : void 0,
		persistSession: true,
		autoRefreshToken: true
	} });
}
var _supabase;
var supabase = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabase) _supabase = createSupabaseClient();
	return Reflect.get(_supabase, prop, receiver);
} });
//#endregion
export { supabase as t };
