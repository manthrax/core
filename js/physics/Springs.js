let M_PI = Math.PI
let sqrtf = Math.sqrt
let fabs = Math.abs
let sinf = Math.sin
let cosf = Math.cos

let copysign = (a,b)=>a < 0 ? (b < 0 ? a : -a) : (b < 0 ? -a : a)

let fast_negexp = (x)=>{
    return 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
}

let fast_atan = (x)=>{
    let z = fabs(x);
    let w = z > 1.0 ? 1.0 / z : z;
    let y = (M_PI / 4.0) * w - w * (w - 1) * (0.2447 + 0.0663 * w);
    return copysign(z > 1.0 ? M_PI / 2.0 - y : y, x);
}

let squaref = (x)=>{
    return x * x;
}

let spring_damper_implicit = (xv,x_goal,v_goal,stiffness,damping,dt,eps=1e-5)=>{
    let {x, v} = xv;
    let g = x_goal;
    let q = v_goal;
    let s = stiffness;
    let d = damping;
    let c = g + (d * q) / (s + eps);
    let y = d / 2.0;

    if (fabs(s - (d * d) / 4.0) < eps) // Critically Damped
    {
        let j0 = x - c;
        let j1 = v + j0 * y;

        let eydt = fast_negexp(y * dt);

        x = j0 * eydt + dt * j1 * eydt + c;
        v = -y * j0 * eydt - y * dt * j1 * eydt + j1 * eydt;
    } else if (s - (d * d) / 4.0 > 0.0) // Under Damped
    {
        let w = sqrtf(s - (d * d) / 4.0);
        let j = sqrtf(squaref(v + y * (x - c)) / (w * w + eps) + squaref(x - c));
        let p = fast_atan((v + (x - c) * y) / (-(x - c) * w + eps));

        j = (x - c) > 0.0 ? j : -j;

        let eydt = fast_negexp(y * dt);

        x = j * eydt * cosf(w * dt + p) + c;
        v = -y * j * eydt * cosf(w * dt + p) - w * j * eydt * sinf(w * dt + p);
    } else if (s - (d * d) / 4.0 < 0.0) // Over Damped
    {
        let y0 = (d + sqrtf(d * d - 4 * s)) / 2.0;
        let y1 = (d - sqrtf(d * d - 4 * s)) / 2.0;
        let j1 = (c * y0 - x * y0 - v) / (y1 - y0);
        let j0 = x - j1 - c;

        let ey0dt = fast_negexp(y0 * dt);
        let ey1dt = fast_negexp(y1 * dt);

        x = j0 * ey0dt + j1 * ey1dt + c;
        v = -y0 * j0 * ey0dt - y1 * j1 * ey1dt;
    }
    xv.x = x;
    xv.v = v;
}



let Springs = {
    spring_damper_implicit
}

export default Springs;
