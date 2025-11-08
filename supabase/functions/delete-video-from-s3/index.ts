import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteRequest {
  exerciseId: string;
  videoFilename: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { exerciseId, videoFilename }: DeleteRequest = await req.json();

    // Verify user owns this exercise or is admin
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('created_by')
      .eq('id', exerciseId)
      .single();

    if (exerciseError || !exercise) {
      return new Response(
        JSON.stringify({ error: 'Exercise not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });

    if (exercise.created_by !== user.id && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to delete this exercise' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete from S3
    const awsRegion = Deno.env.get('AWS_REGION')!;
    const awsBucket = Deno.env.get('AWS_S3_BUCKET')!;
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')!;
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')!;

    const s3Key = `exercises/${videoFilename}`;
    const s3Url = `https://${awsBucket}.s3.${awsRegion}.amazonaws.com/${s3Key}`;

    // Create AWS Signature V4
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');

    const canonicalUri = `/${s3Key}`;
    const canonicalHeaders = `host:${awsBucket}.s3.${awsRegion}.amazonaws.com\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-date';
    const canonicalRequest = `DELETE\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`;

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${awsRegion}/s3/aws4_request`;
    
    const encoder = new TextEncoder();
    const canonicalRequestHash = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(canonicalRequest)
    );
    const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`;

    const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
      const kDate = await crypto.subtle.importKey(
        'raw',
        encoder.encode(`AWS4${key}`),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const kDateSigned = await crypto.subtle.sign('HMAC', kDate, encoder.encode(dateStamp));
      
      const kRegion = await crypto.subtle.importKey(
        'raw',
        kDateSigned,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const kRegionSigned = await crypto.subtle.sign('HMAC', kRegion, encoder.encode(regionName));
      
      const kService = await crypto.subtle.importKey(
        'raw',
        kRegionSigned,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const kServiceSigned = await crypto.subtle.sign('HMAC', kService, encoder.encode(serviceName));
      
      const kSigning = await crypto.subtle.importKey(
        'raw',
        kServiceSigned,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      return kSigning;
    };

    const signingKey = await getSignatureKey(awsSecretAccessKey, dateStamp, awsRegion, 's3');
    const signatureArrayBuffer = await crypto.subtle.sign('HMAC', signingKey, encoder.encode(stringToSign));
    const signature = Array.from(new Uint8Array(signatureArrayBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const authorizationHeader = `${algorithm} Credential=${awsAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Delete file from S3
    const s3Response = await fetch(s3Url, {
      method: 'DELETE',
      headers: {
        'x-amz-date': amzDate,
        'Authorization': authorizationHeader,
      },
    });

    if (!s3Response.ok && s3Response.status !== 404) {
      console.error('S3 delete failed:', await s3Response.text());
      return new Response(
        JSON.stringify({ error: 'Failed to delete video from S3' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('exercises')
      .delete()
      .eq('id', exerciseId);

    if (deleteError) {
      console.error('Database delete failed:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete exercise from database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Exercise deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
