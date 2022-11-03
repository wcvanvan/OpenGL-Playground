#version 330 core

//============================================================================
// Pass number:
// 1 -- do image thresholding,
// 2 -- do horizontal blurring,
// 3 -- do vertical blurring,
// 4 -- do combining of original image and blurred image.
//============================================================================
uniform int PassNum;

//============================================================================
// Received from rasterizer.
//============================================================================
in vec2 texCoord;    // Fragment's texture coordinates.

//============================================================================
// Threshold value for thresholding the original image luminance.
//============================================================================
uniform float LuminanceThreshold;

//============================================================================
// Number of values in the 1D blur filter.
//============================================================================
uniform int BlurFilterWidth;  // Always an odd number.

//============================================================================
// Input texture maps.
//============================================================================
uniform sampler1D BlurFilterTex;
uniform sampler2D OriginalImageTex;
uniform sampler2D ThresholdImageTex;
uniform sampler2D HorizBlurImageTex;
uniform sampler2D VertBlurImageTex;

//============================================================================
// Outputs.
//============================================================================
layout (location = 0) out vec4 FragColor;


/////////////////////////////////////////////////////////////////////////////
// Approximates the brightness of a RGB value.
/////////////////////////////////////////////////////////////////////////////
float Luminance( vec3 color )
{
    const vec3 LuminanceWeights = vec3(0.2126, 0.7152, 0.0722);
    return dot(LuminanceWeights, color);
}


/////////////////////////////////////////////////////////////////////////////
// Threshold the original image.
/////////////////////////////////////////////////////////////////////////////
void ThresholdImage()
{

    vec4 color = texture(OriginalImageTex,texCoord);
    if (Luminance(color.xyz) >= LuminanceThreshold) {
        FragColor = color;
    } else {
        FragColor = vec4(0,0,0,1);
    }

}


/////////////////////////////////////////////////////////////////////////////
// Apply horizontal blurring to the threshold image.
/////////////////////////////////////////////////////////////////////////////
void HorizBlurImage()
{

    ivec2 pix = ivec2(gl_FragCoord.xy);
    int halfWidth = BlurFilterWidth / 2;
    vec4 sum = vec4(0);
    for( int i = 0; i < BlurFilterWidth; i++ ) {
        sum += texelFetch(ThresholdImageTex, pix + ivec2(i - halfWidth, 0), 0) * texelFetch(BlurFilterTex, i, 0).r;
    }
    FragColor = sum;


}


/////////////////////////////////////////////////////////////////////////////
// Apply vertical blurring to the horizontally-blurred image.
/////////////////////////////////////////////////////////////////////////////
void VertBlurImage()
{

    ivec2 pix = ivec2(gl_FragCoord.xy);
    int halfWidth = BlurFilterWidth / 2;
    vec4 sum = vec4(0);
    for( int i = 0; i < BlurFilterWidth; i++ ) {
        sum += texelFetch(HorizBlurImageTex, pix + ivec2(0, i - halfWidth), 0) * texelFetch(BlurFilterTex, i, 0).r;
    }
    FragColor = sum;


}


/////////////////////////////////////////////////////////////////////////////
// Add the original image to the blurred image to get the final image.
/////////////////////////////////////////////////////////////////////////////
void CombineImages()
{

    ivec2 originalPix = ivec2(gl_FragCoord.xy);
    vec4 blurredColor = texture(VertBlurImageTex,texCoord);
    FragColor = texelFetch(OriginalImageTex, originalPix, 0) + blurredColor;


}



void main()
{
    switch(PassNum) {
        case 1: ThresholdImage(); break;
        case 2: HorizBlurImage(); break;
        case 3: VertBlurImage(); break;
        case 4: CombineImages(); break;
    }
}
