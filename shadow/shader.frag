#version 330 core

//============================================================================
// Indicates whether
//   true  -- rendering the shadow map, or
//   false -- using the shadow map to render shadows.
//============================================================================
uniform bool RenderShadowMapMode;


//============================================================================
// Received from rasterizer.
//============================================================================
in vec3 wcPosition;  // Fragment's 3D position in world space.
in vec3 ecPosition;  // Fragment's 3D position in eye space.
in vec3 ecNormal;    // Fragment's normal vector in eye space.
in vec2 texCoord;    // Fragment's texture coordinates.


//============================================================================
// Matrices
//============================================================================
uniform mat4 ShadowMatrix;        // For transforming world-space point
                                  //   to shadow-map space.


//============================================================================
// Light info.
//============================================================================
uniform vec3 LightPosition; // Given in eye space. Must be point light.
uniform vec3 LightAmbient;
//uniform vec3 LightDiffuse;  // Not used.
//uniform vec3 LightSpecular; // Not used.


//============================================================================
// Material info.
//============================================================================
uniform vec3 MatlAmbient;
uniform vec3 MatlDiffuse;
uniform vec3 MatlSpecular;
uniform float MatlShininess;


//============================================================================
// Texture maps and Shadow maps.
//============================================================================
uniform sampler2DShadow ShadowMap;  // Shadow map.
uniform sampler2D ProjectorImage;   // Image projected by projector.


//============================================================================
// Outputs.
//============================================================================
layout (location = 0) out vec4 FragColor;



/////////////////////////////////////////////////////////////////////////////
// Computes and returns the values of N_dot_L and R_dot_V_pow_n
// in the Phong Illumination Equation.
/////////////////////////////////////////////////////////////////////////////
void PhongLighting(out float N_dot_L, out float R_dot_V_pow_n)
{
    vec3 viewVec = -normalize( ecPosition );
    vec3 necNormal = normalize( ecNormal );
    vec3 lightVec = normalize( LightPosition.xyz - ecPosition );
    vec3 reflectVec = reflect( -lightVec, necNormal );
    N_dot_L = max( 0.0, dot( necNormal, lightVec ) );
    float R_dot_V = max( 0.0, dot( reflectVec, viewVec ) );
    R_dot_V_pow_n = ( R_dot_V == 0.0 )? 0.0 : pow( R_dot_V, MatlShininess );
}



/////////////////////////////////////////////////////////////////////////////
// Draws the scene with projector's projection and shadows.
/////////////////////////////////////////////////////////////////////////////
void DrawSceneWithProjection()
{
    // Do the shadow-map lookup
    vec4 ShadowCoord = ShadowMatrix * vec4(wcPosition, 1);
    // avoid acne
    ShadowCoord.z -= 0.03f;

    // PCF
    float sum = 0.0f;
    int samples = 25;
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(-2,-2));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(-2,-1));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(-2,0));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(-2,1));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(-2,2));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(-1,-2));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(-1,-1));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(-1,0));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(-1,1));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(-1,2));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(0,-2));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(0,-1));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(0,0));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(0,1));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(0,2));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(1,-2));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(1,-1));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(1,0));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(1,1));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(1,2));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(2,-2));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(2,-1));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(2,0));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(2,1));
    sum += textureProjOffset(ShadowMap, ShadowCoord, ivec2(2,2));
    float shadow = sum / samples;

    vec3 ambientColor = LightAmbient * MatlAmbient;
    vec4 lightDiffSpec = texture(ProjectorImage, texCoord);
    float N_dot_L, R_dot_V_pow_n;
    PhongLighting(N_dot_L, R_dot_V_pow_n);
    vec3 diffSpec =  lightDiffSpec.xyz * MatlDiffuse * N_dot_L +
                        lightDiffSpec.xyz * MatlSpecular * R_dot_V_pow_n;

    FragColor = vec4( ambientColor + shadow * (diffSpec), 1.0 );
}



/////////////////////////////////////////////////////////////////////////////
// Draws the scene's depth to the shadowmap.
/////////////////////////////////////////////////////////////////////////////
void DrawShadowMap()
{
    // Do nothing; fragment depth will be written automatically.
}



void main()
{
    if ( RenderShadowMapMode )
        DrawShadowMap();
    else
        DrawSceneWithProjection();

    // Use the following line to disable Early Z Testing, which may
    // mess up the shadowmap and/or depth comparison on some systems.
    gl_FragDepth = gl_FragCoord.z;
}
