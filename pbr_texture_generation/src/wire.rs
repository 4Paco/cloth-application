use core::f32;

use nalgebra::{Point2, Point3, Vector2, Vector3};

use crate::{drawable::Drawable, line::Line};

pub struct WireNode {
    pub index: usize,
    pub position: Point3<f32>,
    pub width: f32,
}

pub trait Material: Sync + Send {
    fn get_color(&self) -> Vector3<f32>;
}

struct RopeMaterial;

impl Material for RopeMaterial {
    fn get_color(&self) -> Vector3<f32> {
        Vector3::new(0., 0., 0.)
    }
}

pub trait Profile: Sync + Send {
    fn get_height(&self, x_normalized: f32) -> f32;
    fn get_normal(&self, line: &Line, w1: f32, w2: f32, t: f32, x_normalized: f32) -> Vector3<f32>;
}

struct CircleProfile;
impl Profile for CircleProfile {
    fn get_height(&self, x_normalized: f32) -> f32 {
        return x_normalized.cos();
    }

    fn get_normal(
        &self,
        line: &Line,
        w1: f32,
        w2: f32,
        _t: f32,
        x_normalized: f32,
    ) -> Vector3<f32> {
        let v_line: Vector2<f32> = line.end - line.start;
        let line_length = v_line.norm();
        let scale_angle = ((w2 - w1) / line_length).atan();

        let v_front = Vector3::new(v_line.x, v_line.y, 0.).normalize();
        let v_top = Vector3::new(0., 0., 1.);
        let v_right = v_front.cross(&v_top).normalize();

        let x_normalized = f32::consts::PI * x_normalized;

        return (scale_angle.cos() * v_top
            + scale_angle.sin() * v_front
            + x_normalized.sin() * v_right)
            .normalize();
    }
}

pub struct Wire {
    pub nodes: Vec<WireNode>,
    #[allow(unused)]
    pub material: Box<dyn Material>,
    pub profile: Box<dyn Profile>,
    pub caps: bool,
}

impl WireNode {
    pub fn new(index: usize, position: Point3<f32>, width: f32) -> Self {
        Self {
            index,
            position,
            width,
        }
    }
}

impl Wire {
    #[allow(unused)]
    pub fn new(
        index_begin: usize,
        begin: Point3<f32>,
        index_end: usize,
        end: Point3<f32>,
        begin_width: f32,
        end_width: f32,
        caps: bool,
    ) -> Self {
        let nodes = vec![
            WireNode::new(index_begin, begin, begin_width),
            WireNode::new(index_end, end, end_width),
        ];
        Self {
            nodes,
            material: Box::new(RopeMaterial),
            profile: Box::new(CircleProfile),
            caps,
        }
    }

    pub fn new_from_nodes(nodes: Vec<WireNode>, caps: bool) -> Self {
        Self {
            nodes,
            material: Box::new(RopeMaterial),
            profile: Box::new(CircleProfile),
            caps,
        }
    }

    pub fn new_from_nodes_with_material(
        nodes: Vec<WireNode>,
        caps: bool,
        material: Box<dyn Material>,
    ) -> Self {
        Self {
            nodes,
            material,
            profile: Box::new(CircleProfile),
            caps,
        }
    }
}

fn lerp(a: f32, b: f32, s: f32) -> f32 {
    b * s + a * (1. - s)
}

impl Drawable for Wire {
    fn get_height(&self, point: Point2<f32>) -> f32 {
        let mut best_cap_z: Option<f32> = None;
        let mut best_hit_z: Option<f32> = None;
        for window in self.nodes.windows(2) {
            match &window {
                &[a, b] => {
                    let line = Line::new(a.position.xy(), b.position.xy());
                    let wm = a.width.max(b.width);
                    let minimum = Vector2::new(
                        a.position.x.min(b.position.x) - wm,
                        a.position.y.min(b.position.y) - wm,
                    );
                    let maximum = Vector2::new(
                        a.position.x.max(b.position.x) + wm,
                        a.position.y.max(b.position.y) + wm,
                    );
                    if point.x < minimum.x
                        || point.x > maximum.x
                        || point.y < minimum.y
                        || point.y > maximum.y
                    {
                        continue;
                    }
                    let w1 = a.width;
                    let w2 = b.width;

                    let z1 = a.position.z;
                    let z2 = b.position.z;

                    match line.distance_to_point(point) {
                        crate::line::DistanceResult::Caps { t, d } => {
                            let w = lerp(w1, w2, t);
                            let z = lerp(z1, z2, t);
                            if self.caps && d <= w {
                                let new_z = z + w * self.profile.get_height(d / w);
                                if let Some(old_best_cap_z) = best_cap_z {
                                    if new_z > old_best_cap_z {
                                        best_cap_z = Some(new_z);
                                    }
                                } else {
                                    best_cap_z = Some(new_z);
                                }
                            }
                        }
                        crate::line::DistanceResult::Full { t, d } => {
                            let w = lerp(w1, w2, t);
                            let z = lerp(z1, z2, t);
                            if d <= w {
                                let new_z = z + w * self.profile.get_height(d / w);
                                if let Some(old_best_hit_z) = best_hit_z {
                                    if new_z > old_best_hit_z {
                                        best_hit_z = Some(new_z);
                                    }
                                } else {
                                    best_hit_z = Some(new_z);
                                }
                            }
                        }
                    }
                }
                _ => (),
            }
        }
        best_hit_z.unwrap_or(best_cap_z.unwrap_or(-f32::INFINITY))
    }

    fn get_height_with_id(&self, point: Point2<f32>) -> (f32, usize) {
        let mut best_cap_z: Option<f32> = None;
        let mut best_hit_z: Option<f32> = None;
        let mut best_id: usize = 0;
        for window in self.nodes.windows(2) {
            match &window {
                &[a, b] => {
                    let line = Line::new(a.position.xy(), b.position.xy());
                    let wm = a.width.max(b.width);
                    let minimum = Vector2::new(
                        a.position.x.min(b.position.x) - wm,
                        a.position.y.min(b.position.y) - wm,
                    );
                    let maximum = Vector2::new(
                        a.position.x.max(b.position.x) + wm,
                        a.position.y.max(b.position.y) + wm,
                    );
                    if point.x < minimum.x
                        || point.x > maximum.x
                        || point.y < minimum.y
                        || point.y > maximum.y
                    {
                        continue;
                    }
                    let w1 = a.width;
                    let w2 = b.width;

                    let z1 = a.position.z;
                    let z2 = b.position.z;

                    match line.distance_to_point(point) {
                        crate::line::DistanceResult::Caps { t, d } => {
                            let w = lerp(w1, w2, t);
                            let z = lerp(z1, z2, t);
                            if self.caps && d <= w {
                                let new_z = z + w * self.profile.get_height(d / w);
                                if let Some(old_best_cap_z) = best_cap_z {
                                    if new_z > old_best_cap_z {
                                        best_cap_z = Some(new_z);
                                    }
                                } else {
                                    best_cap_z = Some(new_z);
                                }
                            }
                        }
                        crate::line::DistanceResult::Full { t, d } => {
                            let w = lerp(w1, w2, t);
                            let z = lerp(z1, z2, t);
                            if d <= w {
                                let new_z = z + w * self.profile.get_height(d / w);
                                if let Some(old_best_hit_z) = best_hit_z {
                                    if new_z > old_best_hit_z {
                                        best_hit_z = Some(new_z);
                                        best_id = a.index;
                                    }
                                } else {
                                    best_hit_z = Some(new_z);
                                    best_id = a.index;
                                }
                            }
                        }
                    }
                }
                _ => (),
            }
        }
        (
            best_hit_z.unwrap_or(best_cap_z.unwrap_or(-f32::INFINITY)),
            best_id,
        )
    }

    fn get_normal(&self, point: Point2<f32>) -> Vector3<f32> {
        let mut best_cap_z: Option<f32> = None;
        let mut best_hit_z: Option<f32> = None;
        let mut best_cap_normal: Option<Vector3<f32>> = None;
        let mut best_hit_normal: Option<Vector3<f32>> = None;

        for window in self.nodes.windows(2) {
            match &window {
                &[a, b] => {
                    let line = Line::new(a.position.xy(), b.position.xy());
                    let w1 = a.width;
                    let w2 = b.width;

                    let z1 = a.position.z;
                    let z2 = b.position.z;

                    match line.distance_to_point(point) {
                        crate::line::DistanceResult::Caps { t, d } => {
                            let w = lerp(w1, w2, t);
                            let z = lerp(z1, z2, t);

                            let v_line: Vector2<f32> = line.end - line.start;

                            let v_front = Vector3::new(v_line.x, v_line.y, 0.).normalize();
                            let v_top = Vector3::new(0., 0., 1.);
                            let v_right = v_front.cross(&v_top).normalize();

                            let s = v_right.xy().dot(&(point - line.start)).signum();

                            if d <= w {
                                let new_normal =
                                    self.profile.get_normal(&line, w1, w2, t, s * d / w);
                                let new_z = z + w * self.profile.get_height(d / w);
                                if let Some(old_best_cap_z) = best_cap_z {
                                    if new_z > old_best_cap_z {
                                        best_cap_z = Some(new_z);
                                        best_cap_normal = Some(new_normal);
                                    }
                                } else {
                                    best_cap_z = Some(new_z);
                                    best_cap_normal = Some(new_normal);
                                }
                            }
                        }
                        crate::line::DistanceResult::Full { t, d } => {
                            let w = lerp(w1, w2, t);
                            let z = lerp(z1, z2, t);

                            let v_line: Vector2<f32> = line.end - line.start;

                            let v_front = Vector3::new(v_line.x, v_line.y, 0.).normalize();
                            let v_top = Vector3::new(0., 0., 1.);
                            let v_right = v_front.cross(&v_top).normalize();

                            let s = v_right.xy().dot(&(point - line.start)).signum();

                            if d <= w {
                                let new_normal =
                                    self.profile.get_normal(&line, w1, w2, t, s * d / w);
                                let new_z = z + w * self.profile.get_height(d / w);
                                if let Some(old_best_hit_z) = best_hit_z {
                                    if new_z > old_best_hit_z {
                                        best_hit_z = Some(new_z);
                                        best_hit_normal = Some(new_normal);
                                    }
                                } else {
                                    best_hit_z = Some(new_z);
                                    best_hit_normal = Some(new_normal);
                                }
                            }
                        }
                    }
                }
                _ => (),
            }
        }
        best_hit_normal.unwrap_or(best_cap_normal.unwrap_or(Vector3::new(0., 0., 1.)))
    }

    fn get_albedo(&self, point: Point2<f32>) -> Vector3<f32> {
        let mut best_cap_z: Option<f32> = None;
        let mut best_hit_z: Option<f32> = None;
        let mut best_cap_normal: Option<Vector3<f32>> = None;
        let mut best_hit_normal: Option<Vector3<f32>> = None;

        for window in self.nodes.windows(2) {
            match &window {
                &[a, b] => {
                    let line = Line::new(a.position.xy(), b.position.xy());
                    let wm = a.width.max(b.width);

                    let minimum = Vector2::new(
                        a.position.x.min(b.position.x) - wm,
                        a.position.y.min(b.position.y) - wm,
                    );
                    let maximum = Vector2::new(
                        a.position.x.max(b.position.x) + wm,
                        a.position.y.max(b.position.y) + wm,
                    );
                    if point.x < minimum.x
                        || point.x > maximum.x
                        || point.y < minimum.y
                        || point.y > maximum.y
                    {
                        continue;
                    }

                    let w1 = a.width;
                    let w2 = b.width;
                    let z1 = a.position.z;
                    let z2 = b.position.z;

                    match line.distance_to_point(point) {
                        crate::line::DistanceResult::Caps { t, d } => {
                            let w = lerp(w1, w2, t);
                            let z = lerp(z1, z2, t);

                            if d <= w {
                                let new_normal = self.material.get_color();
                                let new_z = z + w * self.profile.get_height(d / w);
                                if let Some(old_best_cap_z) = best_cap_z {
                                    if new_z > old_best_cap_z {
                                        best_cap_z = Some(new_z);
                                        best_cap_normal = Some(new_normal);
                                    }
                                } else {
                                    best_cap_z = Some(new_z);
                                    best_cap_normal = Some(new_normal);
                                }
                            }
                        }
                        crate::line::DistanceResult::Full { t, d } => {
                            let w = lerp(w1, w2, t);
                            let z = lerp(z1, z2, t);

                            if d <= w {
                                let new_normal = self.material.get_color();
                                let new_z = z + w * self.profile.get_height(d / w);
                                if let Some(old_best_hit_z) = best_hit_z {
                                    if new_z > old_best_hit_z {
                                        best_hit_z = Some(new_z);
                                        best_hit_normal = Some(new_normal);
                                    }
                                } else {
                                    best_hit_z = Some(new_z);
                                    best_hit_normal = Some(new_normal);
                                }
                            }
                        }
                    }
                }
                _ => (),
            }
        }
        best_hit_normal.unwrap_or(best_cap_normal.unwrap_or(Vector3::new(0., 0., 0.)))
    }
}
