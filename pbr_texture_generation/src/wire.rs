use core::f32;

use nalgebra::{Point2, Point3, Vector2, Vector3};

use crate::{drawable::Drawable, line::Line};

pub struct WireNode {
    pub position: Point3<f32>,
    pub width: f32,
}

pub trait Material: Sync + Send {}

struct RopeMaterial;

impl Material for RopeMaterial {}

pub trait Profile: Sync + Send {
    fn get_height(&self, x_normalized: f32) -> f32;
    fn get_normal(&self, line: &Line, w1: f32, w2: f32, t: f32, x_normalized: f32) -> Vector3<f32>;
}

struct CircleProfile;
impl Profile for CircleProfile {
    fn get_height(&self, x_normalized: f32) -> f32 {
        return x_normalized.cos();
    }

    fn get_normal(&self, line: &Line, w1: f32, w2: f32, t: f32, x_normalized: f32) -> Vector3<f32> {
        let v_line: Vector2<f32> = line.end - line.start;
        let line_length = v_line.norm();
        let scale_angle = ((w2 - w1) / line_length).atan();

        let v_front = Vector3::new(v_line.x, v_line.y, 0.).normalize();
        let v_top = Vector3::new(0., 0., 1.);
        let v_right = v_front.cross(&v_top).normalize();

        return (x_normalized.sin() * v_right + x_normalized.cos() * v_top) * scale_angle.cos()
            + scale_angle.sin() * v_front;
    }
}

pub struct Wire {
    pub nodes: Vec<WireNode>,
    pub material: Box<dyn Material>,
    pub profile: Box<dyn Profile>,
    pub caps: bool,
}

impl WireNode {
    pub fn new(position: Point3<f32>, width: f32) -> Self {
        Self { position, width }
    }
}

impl Wire {
    pub fn new(
        begin: Point3<f32>,
        end: Point3<f32>,
        begin_width: f32,
        end_width: f32,
        caps: bool,
    ) -> Self {
        let nodes = vec![
            WireNode::new(begin, begin_width),
            WireNode::new(end, end_width),
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
}

fn lerp(a: f32, b: f32, s: f32) -> f32 {
    b * s + a * (1. - s)
}

impl Drawable for Wire {
    fn get_height(&self, point: Point2<f32>) -> f32 {
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
                    match line.distance_to_point(point, self.caps) {
                        crate::line::DistanceResult::OutOfBounds => continue,
                        crate::line::DistanceResult::Full { t, d } => {
                            let w1 = a.width;
                            let w2 = b.width;
                            let w = lerp(w1, w2, t);

                            let z1 = a.position.z;
                            let z2 = b.position.z;
                            let z = lerp(z1, z2, t);

                            if d <= w {
                                return z + w * self.profile.get_height(d / w);
                            }
                        }
                    }
                }
                _ => (),
            }
        }
        return -f32::INFINITY;
    }

    fn get_normal(&self, point: Point2<f32>) -> Vector3<f32> {
        for window in self.nodes.windows(2) {
            match &window {
                &[a, b] => {
                    let line = Line::new(a.position.xy(), b.position.xy());
                    match line.distance_to_point(point, self.caps) {
                        crate::line::DistanceResult::OutOfBounds => continue,
                        crate::line::DistanceResult::Full { t, d } => {
                            let w1 = a.width;
                            let w2 = b.width;
                            let w = lerp(w1, w2, t);

                            if d <= w {
                                return self.profile.get_normal(&line, w1, w2, t, d / w);
                            }
                        }
                    }
                }
                _ => (),
            }
        }
        return Vector3::zeros();
    }
}
