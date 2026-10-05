precision highp float;

uniform vec2 uRes;
uniform float uTime;

// noise
uniform vec2 uScale;
uniform float uBump, uSeed, uFqScale, uFloor, uCeil, uCeilF, uMix;

// movimento
uniform vec2 uRot;
uniform float uFlow, uDrift;

// modo (0 = linear, 1 = circular)
uniform float uMode, uAngle, uSize, uOffset;
uniform vec2 uCenter;

// blend entre a camada de forma e a camada de noise
uniform float uBlend, uLayerMix;

// paleta
uniform vec3 uCols[8];
uniform int uN;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}

float fbm(vec2 p){
  float s = 0., a = .5, w = 0.;
  vec2 lac = vec2(1.475, 1.6);   // antes controlado por noise fq x/y; fixado nos valores padrão
  for(int i=0;i<5;i++){ s += a*vnoise(p); w += a; p = p*lac + 17.3; a *= uFqScale * .6; }
  return s / w;
}

// posição 0..1 -> cor da paleta
vec3 palette(float s){
  float x = clamp(s, 0., 1.) * float(uN - 1);
  vec3 c = uCols[0];
  for(int i=1;i<8;i++){
    if(i >= uN) break;
    c = mix(c, uCols[i], smoothstep(float(i-1), float(i), x));
  }
  return c;
}

// a = camada de forma (base), b = camada de noise (topo)
vec3 blend(vec3 a, vec3 b, int mode){
  if(mode == 1) return a * b;                                   // multiply
  if(mode == 2) return 1. - (1.-a)*(1.-b);                      // screen
  if(mode == 3) return mix(2.*a*b, 1.-2.*(1.-a)*(1.-b), step(.5, a)); // overlay
  if(mode == 4) return min(a + b, 1.);                          // add
  if(mode == 5) return abs(a - b);                              // difference
  if(mode == 6) return (1.-2.*b)*a*a + 2.*b*a;                  // soft light
  return b;                                                     // normal
}

void main(){
  float aspect = uRes.x / uRes.y;
  vec2 uv = (gl_FragCoord.xy - .5*uRes) / uRes.y;
  float t = uTime;

  // ---- camada 1: forma do gradiente (linear ou circular) ----
  float g;
  float off = uOffset + uDrift * .25 * sin(t * 1.3);
  if(uMode < .5){
    vec2 d = vec2(cos(uAngle), sin(uAngle));
    g = dot(uv, d) / uSize + .5 + off;
  } else {
    vec2 c = uCenter * vec2(.5 * aspect, .5);
    g = length(uv - c) / uSize + off;
  }

  // ---- camada 2: noise ----
  vec2 q0 = uv;
  q0.x += q0.y * uRot.x;
  q0.y += q0.x * uRot.y;
  vec2 p = q0 * uScale * .45 + vec2(uSeed*7.13, uSeed*3.71);
  vec2 q = vec2(fbm(p + vec2(0., t*.35)), fbm(p + vec2(5.2, 1.3) - t*.25));
  p += (q - .5) * uFlow * .035;
  float n = fbm(p + vec2(t*.2, 0.));
  n += (fbm(p*3. + 11.) - .5) * uBump;
  n = (n - .5) * 2.6 + .5;
  float s = smoothstep(uFloor, uCeil + uCeilF, n);

  // ---- combinação ----
  vec3 base = palette(g);
  vec3 top = palette(s);
  vec3 c = mix(base, blend(base, top, int(uBlend + .5)), uLayerMix);

  c += (hash(gl_FragCoord.xy + fract(t)) - .5) * uMix;   // grão
  gl_FragColor = vec4(c, 1.);
}
