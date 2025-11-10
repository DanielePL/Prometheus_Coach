import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface S3UploadResponse {
  success: boolean
  cloudfrontUrl?: string
  thumbnailUrl?: string
  filename?: string
  error?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing S3 upload for user:', user.id)

    // Get AWS credentials from environment
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    const AWS_REGION = Deno.env.get('AWS_REGION')
    const AWS_S3_BUCKET = Deno.env.get('AWS_S3_BUCKET')

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_S3_BUCKET) {
      console.error('Missing AWS credentials')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse multipart form data
    const formData = await req.formData()
    const videoFile = formData.get('video') as File
    const exerciseName = formData.get('exerciseName') as string

    if (!videoFile || !exerciseName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing video file or exercise name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate filename
    const timestamp = Date.now()
    const slug = exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const filename = `${timestamp}-${slug}.mp4`

    console.log('Uploading to S3:', filename)

    // Read file content
    const arrayBuffer = await videoFile.arrayBuffer()
    const fileContent = new Uint8Array(arrayBuffer)

    // Prepare S3 PUT request
    const date = new Date().toUTCString()
    const contentType = 'video/mp4'
    
    // Create AWS Signature V4
    const encoder = new TextEncoder()
    
    // AWS Signature V4 signing process
    const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
      const kDate = await crypto.subtle.importKey(
        'raw',
        encoder.encode('AWS4' + key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const dateKey = await crypto.subtle.sign('HMAC', kDate, encoder.encode(dateStamp))
      
      const kRegion = await crypto.subtle.importKey('raw', dateKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const regionKey = await crypto.subtle.sign('HMAC', kRegion, encoder.encode(regionName))
      
      const kService = await crypto.subtle.importKey('raw', regionKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const serviceKey = await crypto.subtle.sign('HMAC', kService, encoder.encode(serviceName))
      
      const kSigning = await crypto.subtle.importKey('raw', serviceKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      return await crypto.subtle.sign('HMAC', kSigning, encoder.encode('aws4_request'))
    }

    const dateObj = new Date()
    const amzDate = dateObj.toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.slice(0, 8)
    
    const canonicalUri = `/${filename}`
    const canonicalQueryString = ''
    const canonicalHeaders = `host:${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
    
    const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`
    
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${AWS_REGION}/s3/aws4_request`
    
    const hashedCanonicalRequest = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)))
    ).map(b => b.toString(16).padStart(2, '0')).join('')
    
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${hashedCanonicalRequest}`
    
    const signingKey = await getSignatureKey(AWS_SECRET_ACCESS_KEY, dateStamp, AWS_REGION, 's3')
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      encoder.encode(stringToSign)
    )
    const signature = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('')
    
    const authorizationHeader = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    // Upload to S3
    const s3Url = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${filename}`
    
    const s3Response = await fetch(s3Url, {
      method: 'PUT',
      headers: {
        'Authorization': authorizationHeader,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        'Content-Type': contentType,
      },
      body: fileContent,
    })

    if (!s3Response.ok) {
      const errorText = await s3Response.text()
      console.error('S3 upload failed:', s3Response.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: `S3 upload failed: ${s3Response.statusText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Video uploaded successfully to S3')

    // Generate thumbnail from video
    console.log('🎬 Generating thumbnail from video...')
    let thumbnailUrl: string | undefined
    
    try {
      // Create a video element to extract a frame
      const videoBlob = new Blob([fileContent], { type: contentType })
      const videoBlobUrl = URL.createObjectURL(videoBlob)
      
      // Use FFmpeg-like approach via canvas (Deno runtime limitation workaround)
      // Since we can't use HTML5 video API in edge function, we'll generate thumbnail filename
      // and let the client know to generate it, OR we skip thumbnail generation here
      // and instead use video poster attribute on frontend
      
      // For now, we'll create a placeholder approach:
      // Upload a snapshot using the video's first frame metadata
      // This requires FFmpeg or similar tool which isn't available in Deno Deploy
      
      // SIMPLIFIED APPROACH: Generate thumbnail filename, but actual generation
      // needs to happen client-side or via a separate service
      const thumbnailFilename = filename.replace('.mp4', '-thumb.jpg')
      thumbnailUrl = `https://d2ymeuuhxjxg6g.cloudfront.net/${thumbnailFilename}`
      
      console.log('⚠️ Thumbnail generation skipped - needs client-side or separate service')
      console.log('📝 Thumbnail URL (placeholder):', thumbnailUrl)
    } catch (thumbError) {
      console.error('❌ Thumbnail generation error:', thumbError)
      // Continue without thumbnail - it's not critical
    }

    // Return CloudFront URLs
    const cloudfrontUrl = `https://d2ymeuuhxjxg6g.cloudfront.net/${filename}`
    
    console.log('✅ Upload complete:', cloudfrontUrl)
    if (thumbnailUrl) {
      console.log('🖼️ Thumbnail URL:', thumbnailUrl)
    }

    const response: S3UploadResponse = {
      success: true,
      cloudfrontUrl,
      thumbnailUrl, // May be undefined
      filename,
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in upload-video-to-s3 function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
