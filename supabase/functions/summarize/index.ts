import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import OpenAI from "npm:openai";
import { corsHeaders } from '../_shared/cors.ts';

const openai = new OpenAI();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Read the JSON body and expect the key to be `conversation`
    const { conversation } = await req.json();

    // Check if conversation is provided
    if (!conversation || typeof conversation !== 'string' || conversation.trim() === '') {
      return new Response(JSON.stringify({ error: "'conversation' is required and should be a non-empty string." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Received conversation:", conversation);

    // Use OpenAI's GPT model (adjust model name if needed)
    const completion = await openai.chat.completions.create({
      model: "gpt-4",  // Change to an appropriate model
      messages: [
        { 
          role: "system", 
          content: `You are an assistant. I have passe you a conversation between a doctor and a patient. Please give me a summary of that. ` 
        },
        { role: "user", content: conversation },
      ],
    });

    console.log("Completion received:", completion.choices[0]);

    return new Response(JSON.stringify({ summary: completion.choices[0].message.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing the request:", error);
    return new Response(JSON.stringify({ error: "An error occurred while processing the request." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
