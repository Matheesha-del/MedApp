import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Import necessary libraries
import { corsHeaders } from '../_shared/cors.ts';

// Google Cloud API key (from environment variables)
const API_KEY = Deno.env.get("GOOGLE_TTS_API_KEY");

if (!API_KEY) {
  console.error("Google Cloud API key not set.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    // Handle preflight requests for CORS
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, languageCode , voiceName } = await req.json();

    // Validate input
    if (!text) {
      return new Response(JSON.stringify({ error: "Text input is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Google Cloud TTS API request payload
    const ttsRequestPayload = {
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: "MP3" },
    };

    // Make the API request to Google Cloud TTS
    const googleResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ttsRequestPayload),
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      return new Response(
        JSON.stringify({ error: "Google TTS API Error", details: errorText }),
        {
          status: googleResponse.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const ttsResponse = await googleResponse.json();

    // Return the Base64-encoded audio content
    return new Response(
      JSON.stringify({ audioContent: ttsResponse.audioContent }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error processing TTS request:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
